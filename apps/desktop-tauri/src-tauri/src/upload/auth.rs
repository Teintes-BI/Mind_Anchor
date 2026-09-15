//! Access-token renewal.
//!
//! Access tokens expire after 7 days. Without renewal the collector starts
//! failing with 401 and, because the failure is just another upload error, the
//! user only notices by watching the queue.
//!
//! Two properties of the server contract shape this module, both measured
//! against the running relay rather than inferred:
//!
//! 1. Refresh tokens are **single use**. A successful refresh revokes the token
//!    that was presented and issues a replacement. So the new pair must be
//!    persisted before the old pair is discarded; losing the replacement means
//!    the account can only be recovered by logging in again.
//!
//! 2. A JWT issued within the same second is byte-identical, because the only
//!    varying input is `iat` at one-second resolution. Comparing tokens to
//!    decide whether a refresh happened is therefore useless; the expiry
//!    timestamp is what must be tracked.

use serde::Deserialize;

/// Refresh this long before the access token actually expires, so a renewal
/// that fails (offline, relay down) still has time to be retried.
pub const RENEW_MARGIN_MS: u64 = 24 * 60 * 60 * 1000;

/// The subset of the session response this module needs.
#[derive(Debug, Clone, Deserialize)]
pub struct Session {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: Option<String>,
    /// ISO-8601 instant. `None` when the server omits it.
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
}

/// Whether the access token should be renewed now.
///
/// `expires_at_ms` is the parsed expiry. A token with no parseable expiry is
/// treated as needing renewal only when it has already been rejected, which the
/// caller signals by passing `None` for `now_ms`... which is not knowable here,
/// so instead an unknown expiry returns `false` and relies on the 401 path.
pub fn should_renew(expires_at_ms: Option<i64>, now_ms: i64) -> bool {
    match expires_at_ms {
        Some(expiry) => now_ms + RENEW_MARGIN_MS as i64 >= expiry,
        // Unknown expiry: do not churn. A stale token surfaces as a 401 and the
        // caller then calls `renew_now`, which is the recovery path anyway.
        None => false,
    }
}

/// Parse an ISO-8601 UTC instant into epoch milliseconds.
///
/// Hand-rolled rather than pulling in a date crate: the format is fixed
/// (`YYYY-MM-DDTHH:MM:SS.sssZ`) and the whole crate budget for this app is
/// deliberately tiny. Returns `None` on anything unexpected instead of
/// panicking, so a format change degrades to "unknown expiry" rather than a
/// crash.
pub fn parse_iso8601_ms(value: &str) -> Option<i64> {
    let bytes = value.as_bytes();
    if bytes.len() < 20 {
        return None;
    }
    let digits = |range: std::ops::Range<usize>| -> Option<i64> {
        let slice = value.get(range)?;
        if !slice.bytes().all(|b| b.is_ascii_digit()) {
            return None;
        }
        slice.parse::<i64>().ok()
    };

    let year = digits(0..4)?;
    let month = digits(5..7)?;
    let day = digits(8..10)?;
    let hour = digits(11..13)?;
    let minute = digits(14..16)?;
    let second = digits(17..19)?;
    if !(1..=12).contains(&month)
        || !(1..=31).contains(&day)
        || hour > 23
        || minute > 59
        || second > 60
    {
        return None;
    }

    // Days since the Unix epoch, proleptic Gregorian.
    let days_from_civil = |y: i64, m: i64, d: i64| -> i64 {
        let y = if m <= 2 { y - 1 } else { y };
        let era = if y >= 0 { y } else { y - 399 } / 400;
        let yoe = y - era * 400;
        let mp = (m + 9) % 12;
        let doy = (153 * mp + 2) / 5 + d - 1;
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        era * 146_097 + doe - 719_468
    };

    let days = days_from_civil(year, month, day);
    Some(((days * 86_400) + hour * 3600 + minute * 60 + second) * 1000)
}

/// The body sent to `/auth/refresh`.
pub fn refresh_body(refresh_token: &str) -> String {
    serde_json::json!({ "refreshToken": refresh_token }).to_string()
}

/// Path appended to the relay origin to reach the refresh endpoint.
pub const REFRESH_PATH: &str = "/auth/refresh";

/// Derive the refresh URL from the event endpoint.
///
/// The configured endpoint points at `/v1/core/events`; authentication lives
/// under the same origin. Anything that does not look like a URL yields `None`,
/// and the caller then simply never refreshes rather than sending auth
/// credentials to a guessed address.
pub fn refresh_url(event_endpoint: &str) -> Option<String> {
    let trimmed = event_endpoint.trim();
    let scheme_end = trimmed.find("://")? + 3;
    let rest = &trimmed[scheme_end..];
    let origin_end = rest
        .find('/')
        .map(|i| scheme_end + i)
        .unwrap_or(trimmed.len());
    let origin = &trimmed[..origin_end];
    if origin.len() <= scheme_end {
        return None;
    }
    Some(format!("{origin}{REFRESH_PATH}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    const DAY_MS: i64 = 86_400_000;

    #[test]
    fn parses_a_typical_expiry() {
        // 2026-09-22T05:08:31Z. Cross-checked against .NET:
        //   DateTimeOffset.Parse("2026-09-22T05:08:31.000Z").ToUnixTimeMilliseconds()
        // returns 1790053711000, and FromUnixTimeMilliseconds(1790053711000)
        // round-trips to 2026-09-22T05:08:31.000Z.
        let parsed = parse_iso8601_ms("2026-09-22T05:08:31.000Z").expect("parses");
        assert_eq!(parsed, 1_790_053_711_000);
    }

    #[test]
    fn parses_the_epoch_itself() {
        assert_eq!(parse_iso8601_ms("1970-01-01T00:00:00.000Z"), Some(0));
    }

    #[test]
    fn parses_a_leap_day() {
        // 2024-02-29 must not be rejected or shifted.
        let leap = parse_iso8601_ms("2024-02-29T00:00:00.000Z").expect("parses");
        let after = parse_iso8601_ms("2024-03-01T00:00:00.000Z").expect("parses");
        assert_eq!(after - leap, DAY_MS);
    }

    #[test]
    fn rejects_malformed_input_instead_of_panicking() {
        for bad in [
            "",
            "not a date",
            "2026-13-01T00:00:00.000Z",
            "2026-01-32T00:00:00.000Z",
            "2026-01-01T25:00:00.000Z",
            "2026-01-01",
        ] {
            assert_eq!(parse_iso8601_ms(bad), None, "should reject {bad:?}");
        }
    }

    #[test]
    fn renews_once_inside_the_margin() {
        let now = 1_700_000_000_000;
        assert!(
            !should_renew(Some(now + 5 * DAY_MS), now),
            "far from expiry"
        );
        assert!(
            should_renew(Some(now + RENEW_MARGIN_MS as i64 - 1), now),
            "just inside the margin"
        );
        assert!(should_renew(Some(now - 1), now), "already expired");
    }

    #[test]
    fn an_unknown_expiry_does_not_cause_churn() {
        // Without this, a server that omits expiresAt would trigger a refresh
        // on every single poll.
        assert!(!should_renew(None, 1_700_000_000_000));
    }

    #[test]
    fn derives_the_refresh_url_from_the_event_endpoint() {
        assert_eq!(
            refresh_url("https://47.104.73.144:18443/v1/core/events").as_deref(),
            Some("https://47.104.73.144:18443/auth/refresh")
        );
        assert_eq!(
            refresh_url("http://127.0.0.1:3002/v1/core/events").as_deref(),
            Some("http://127.0.0.1:3002/auth/refresh")
        );
    }

    #[test]
    fn a_url_without_a_path_still_yields_an_origin() {
        assert_eq!(
            refresh_url("https://relay.example").as_deref(),
            Some("https://relay.example/auth/refresh")
        );
    }

    #[test]
    fn refuses_to_guess_an_origin() {
        // Better to never refresh than to POST a refresh token somewhere odd.
        assert_eq!(refresh_url(""), None);
        assert_eq!(refresh_url("   "), None);
        assert_eq!(refresh_url("relay.example/v1/core/events"), None);
        assert_eq!(refresh_url("https://"), None);
    }

    #[test]
    fn refresh_body_carries_the_token() {
        let body = refresh_body("abc123");
        assert!(body.contains("\"refreshToken\":\"abc123\""));
    }
}
