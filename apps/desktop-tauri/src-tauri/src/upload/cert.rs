//! Certificate verification policy for the relay connection.
//!
//! The relay uses a **self-signed** certificate, so the default WinHTTP chain
//! check cannot succeed: the issuer is the certificate itself and no CA signs
//! it. The tempting shortcut — disable certificate validation entirely — is
//! unacceptable, because it would also accept any attacker's certificate.
//!
//! The policy implemented here is **pin or refuse**:
//!
//! 1. A SHA-256 fingerprint is configured by the user (obtained out of band,
//!    e.g. by reading it off the server over SSH).
//! 2. For each request WinHTTP's chain check is relaxed *only* for
//!    `IGNORE_UNKNOWN_CA` — enough to accept a self-signed leaf, not enough to
//!    accept a mismatched name or expired certificate.
//! 3. After the response headers arrive, the server's actual certificate is
//!    read back and its SHA-256 fingerprint compared to the pinned value.
//!    A mismatch fails the request.
//!
//! So an attacker who presents a different self-signed certificate gets a
//! fingerprint mismatch, not a successful upload. Pinning is what makes
//! `IGNORE_UNKNOWN_CA` safe.
//!
//! A pinned fingerprint is **required** for `https://` endpoints: this module
//! deliberately has no "skip verification" mode.

use serde::{Deserialize, Serialize};

/// Why certificate verification failed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CertError {
    /// The endpoint is https but no fingerprint was configured.
    PinRequired,
    /// The pinned string is not a 64-hex-character SHA-256 digest.
    MalformedPin { value: String },
    /// The server presented a certificate with a different fingerprint.
    FingerprintMismatch { expected: String, actual: String },
    /// The certificate could not be read from the request handle.
    Unreadable { message: String },
}

impl std::fmt::Display for CertError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CertError::PinRequired => write!(
                f,
                "https endpoint requires a pinned certificate fingerprint"
            ),
            CertError::MalformedPin { value } => write!(
                f,
                "pinned fingerprint must be 64 hex characters, got {value:?}"
            ),
            CertError::FingerprintMismatch { expected, actual } => write!(
                f,
                "certificate fingerprint mismatch: expected {expected}, got {actual}"
            ),
            CertError::Unreadable { message } => {
                write!(f, "cannot read server certificate: {message}")
            }
        }
    }
}

impl std::error::Error for CertError {}

/// Normalise a fingerprint for comparison: lowercase, hex only, separators
/// removed. Accepts the colon-separated form that `openssl -fingerprint`
/// prints as well as a bare digest.
pub fn normalize_fingerprint(raw: &str) -> String {
    raw.chars()
        .filter(|c| c.is_ascii_hexdigit())
        .map(|c| c.to_ascii_lowercase())
        .collect()
}

/// Validate a pinned fingerprint, returning the normalised form.
pub fn validate_pin(raw: &str) -> Result<String, CertError> {
    let normalised = normalize_fingerprint(raw);
    if normalised.len() != 64 {
        return Err(CertError::MalformedPin {
            value: raw.trim().to_string(),
        });
    }
    Ok(normalised)
}

/// Whether a request to this scheme needs a pin.
pub fn requires_pin(scheme: &str) -> bool {
    scheme.eq_ignore_ascii_case("https")
}

/// Compare a server fingerprint against the pin. Pure, so the policy is
/// testable without a network or a certificate.
pub fn verify(pin: &str, server_fingerprint: &str) -> Result<(), CertError> {
    let expected = validate_pin(pin)?;
    let actual = normalize_fingerprint(server_fingerprint);
    if expected == actual {
        Ok(())
    } else {
        Err(CertError::FingerprintMismatch { expected, actual })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // The actual relay fingerprint, as printed by openssl on the server.
    const RELAY_PIN: &str = "28:26:41:9B:80:E2:5B:78:89:00:2D:A0:1C:B2:64:80:2A:C6:B3:12:4B:5E:EA:4B:65:6E:2B:9E:ED:B5:A2:80";

    #[test]
    fn accepts_the_openssl_colon_form() {
        let normalised = normalize_fingerprint(RELAY_PIN);
        assert_eq!(normalised.len(), 64);
        assert!(normalised.chars().all(|c| c.is_ascii_hexdigit()));
        assert!(!normalised.contains(':'));
        assert!(validate_pin(RELAY_PIN).is_ok());
    }

    #[test]
    fn accepts_a_bare_digest() {
        let bare = RELAY_PIN.replace(':', "");
        assert_eq!(
            validate_pin(&bare).unwrap(),
            normalize_fingerprint(RELAY_PIN)
        );
    }

    #[test]
    fn normalisation_is_case_insensitive() {
        let upper = RELAY_PIN.to_ascii_uppercase();
        let lower = RELAY_PIN.to_ascii_lowercase();
        assert_eq!(normalize_fingerprint(&upper), normalize_fingerprint(&lower));
    }

    #[test]
    fn rejects_a_short_pin() {
        assert!(matches!(
            validate_pin("deadbeef"),
            Err(CertError::MalformedPin { .. })
        ));
    }

    #[test]
    fn rejects_an_empty_pin() {
        assert!(matches!(
            validate_pin(""),
            Err(CertError::MalformedPin { .. })
        ));
    }

    #[test]
    fn matching_fingerprint_verifies() {
        assert!(verify(RELAY_PIN, RELAY_PIN).is_ok());
        // Same value, formatted differently, still matches.
        assert!(verify(RELAY_PIN, &RELAY_PIN.replace(':', "")).is_ok());
    }

    #[test]
    fn mismatched_fingerprint_is_refused() {
        let other = "00".repeat(32);
        let error = verify(RELAY_PIN, &other).unwrap_err();
        match error {
            CertError::FingerprintMismatch { expected, actual } => {
                assert_eq!(expected, normalize_fingerprint(RELAY_PIN));
                assert_eq!(actual, other);
            }
            other => panic!("expected a mismatch, got {other:?}"),
        }
    }

    #[test]
    fn a_valid_but_different_certificate_is_still_refused() {
        // This is the attack the pin exists to stop: a well-formed self-signed
        // certificate that is not ours must not be accepted.
        let attacker = normalize_fingerprint(&"ab".repeat(32));
        assert!(verify(RELAY_PIN, &attacker).is_err());
    }

    #[test]
    fn https_requires_a_pin_and_http_does_not() {
        assert!(requires_pin("https"));
        assert!(requires_pin("HTTPS"));
        assert!(!requires_pin("http"));
    }

    #[test]
    fn errors_are_displayable() {
        assert!(CertError::PinRequired.to_string().contains("pinned"));
        assert!(CertError::MalformedPin { value: "x".into() }
            .to_string()
            .contains("64 hex"));
    }
}
