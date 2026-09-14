//! Upload queue with idempotent retry.
//!
//! The design constraints:
//!
//! * **Offline-first.** A failed upload must not lose data, and must not block
//!   collection. Items stay in a local table until the server accepts them.
//! * **Idempotent.** Each item carries the `clientEventId` derived from its
//!   content, so retrying an item the server already stored is a no-op there.
//! * **Bounded.** Attempts are retried with backoff and capped, so a permanently
//!   broken endpoint does not spin forever.
//! * **No silent drop.** An item that exhausts its attempts stays in the queue
//!   marked as failed and is surfaced in the status, rather than being deleted.

use crate::upload::payload::CoreEventRequest;
use crate::upload::UploadError;

/// Maximum delivery attempts before an item is parked as failed.
pub const MAX_ATTEMPTS: u32 = 8;

/// Backoff before the next attempt, in milliseconds. Grows then plateaus.
pub fn backoff_ms(attempts: u32) -> u64 {
    const BASE_MS: u64 = 1_000;
    const CAP_MS: u64 = 15 * 60 * 1_000;
    let shift = attempts.min(10);
    (BASE_MS << shift).min(CAP_MS)
}

/// Lifecycle of a queued item.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QueueItemState {
    /// Waiting for its next attempt window.
    Pending,
    /// Delivered and accepted by the server.
    Delivered,
    /// Attempts exhausted; kept for inspection, never silently deleted.
    Failed,
}

impl QueueItemState {
    pub fn as_str(self) -> &'static str {
        match self {
            QueueItemState::Pending => "pending",
            QueueItemState::Delivered => "delivered",
            QueueItemState::Failed => "failed",
        }
    }

    /// Parse the stored form. Named `parse_state` rather than `from_str` to
    /// avoid shadowing the `std::str::FromStr` trait method, which reads as a
    /// mistake even when it is intentional.
    pub fn parse_state(value: &str) -> Self {
        match value {
            "delivered" => QueueItemState::Delivered,
            "failed" => QueueItemState::Failed,
            _ => QueueItemState::Pending,
        }
    }
}

/// A queued upload.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QueueItem {
    pub id: i64,
    pub client_event_id: String,
    pub body_json: String,
    pub state: QueueItemState,
    pub attempts: u32,
    /// Epoch milliseconds of the next permitted attempt.
    pub next_attempt_at_ms: i64,
    pub last_error: Option<String>,
}

/// Decide what to do with an item after a failed attempt.
///
/// Pure, so the retry policy is testable without a clock or a network. The
/// `reason` is accepted for symmetry with the caller's logging and to keep the
/// signature stable if the policy ever becomes reason-dependent.
pub fn after_failure(
    item: &QueueItem,
    now_ms: i64,
    reason: &UploadError,
) -> (QueueItemState, u32, i64) {
    let _ = reason;
    let attempts = item.attempts + 1;
    if attempts >= MAX_ATTEMPTS {
        return (QueueItemState::Failed, attempts, now_ms);
    }
    let delay = backoff_ms(attempts) as i64;
    (QueueItemState::Pending, attempts, now_ms + delay)
}

/// Whether a failure is worth retrying at all.
///
/// A policy rejection or a malformed-payload response will not improve by
/// waiting, so retrying only burns the attempt budget. Transport failures and
/// 5xx are transient and are retried.
pub fn is_retryable(error: &UploadError) -> bool {
    match error {
        UploadError::Transport { .. } => true,
        UploadError::HttpStatus { status, .. } => *status >= 500 || *status == 429,
        // A certificate failure is not transient: retrying will hit the same
        // mismatch. Park it and surface it rather than burning attempts.
        UploadError::Cert { .. } => false,
        UploadError::CollectionDisabled
        | UploadError::UploadDisabled
        | UploadError::EndpointNotConfigured
        | UploadError::InsecureEndpointRejected
        | UploadError::EmptyQueue
        | UploadError::MalformedResponse { .. } => false,
    }
}

/// Build the queue row for a request. Kept here so the body/id pair can never
/// drift apart.
pub fn to_queue_item(request: &CoreEventRequest) -> Result<(String, String), UploadError> {
    let body = serde_json::to_string(request).map_err(|error| UploadError::MalformedResponse {
        message: format!("cannot serialise request: {error}"),
    })?;
    Ok((request.client_event_id.clone(), body))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(attempts: u32) -> QueueItem {
        QueueItem {
            id: 1,
            client_event_id: "desktop-activity-abc".to_string(),
            body_json: "{}".to_string(),
            state: QueueItemState::Pending,
            attempts,
            next_attempt_at_ms: 0,
            last_error: None,
        }
    }

    #[test]
    fn backoff_grows_then_plateaus() {
        assert_eq!(backoff_ms(0), 1_000);
        assert_eq!(backoff_ms(1), 2_000);
        assert_eq!(backoff_ms(2), 4_000);
        // Plateaus at the cap rather than overflowing.
        assert_eq!(backoff_ms(20), 15 * 60 * 1_000);
    }

    #[test]
    fn retryable_classification() {
        assert!(is_retryable(&UploadError::Transport {
            message: "timeout".into()
        }));
        assert!(is_retryable(&UploadError::HttpStatus {
            status: 503,
            message: "unavailable".into()
        }));
        assert!(is_retryable(&UploadError::HttpStatus {
            status: 429,
            message: "slow down".into()
        }));
        // Not retryable: waiting will not fix these.
        assert!(!is_retryable(&UploadError::HttpStatus {
            status: 400,
            message: "bad request".into()
        }));
        assert!(!is_retryable(&UploadError::HttpStatus {
            status: 403,
            message: "forbidden".into()
        }));
        assert!(!is_retryable(&UploadError::MalformedResponse {
            message: "unexpected".into()
        }));
        assert!(!is_retryable(&UploadError::UploadDisabled));
        assert!(!is_retryable(&UploadError::EndpointNotConfigured));
    }

    #[test]
    fn failure_schedules_a_backoff_while_attempts_remain() {
        let (state, attempts, next_at) = after_failure(
            &item(0),
            1_000,
            &UploadError::Transport {
                message: "timeout".into(),
            },
        );
        assert_eq!(state, QueueItemState::Pending);
        assert_eq!(attempts, 1);
        assert_eq!(next_at, 1_000 + 2_000, "second attempt after backoff(1)");
    }

    #[test]
    fn failure_parks_the_item_at_the_attempt_cap() {
        let (state, attempts, _) = after_failure(
            &item(MAX_ATTEMPTS - 1),
            1_000,
            &UploadError::Transport {
                message: "timeout".into(),
            },
        );
        assert_eq!(state, QueueItemState::Failed, "must not retry forever");
        assert_eq!(attempts, MAX_ATTEMPTS);
    }

    #[test]
    fn failed_items_are_kept_not_dropped() {
        // The state transition returns a state, it never deletes. This asserts
        // the contract explicitly so a future edit cannot make failures vanish.
        let (state, _, _) = after_failure(
            &item(MAX_ATTEMPTS),
            0,
            &UploadError::HttpStatus {
                status: 500,
                message: "boom".into(),
            },
        );
        assert_eq!(state, QueueItemState::Failed);
        assert_ne!(state, QueueItemState::Delivered);
    }

    #[test]
    fn state_round_trips_through_its_storage_form() {
        for state in [
            QueueItemState::Pending,
            QueueItemState::Delivered,
            QueueItemState::Failed,
        ] {
            assert_eq!(QueueItemState::parse_state(state.as_str()), state);
        }
        // Unknown values degrade to Pending rather than panicking.
        assert_eq!(
            QueueItemState::parse_state("nonsense"),
            QueueItemState::Pending
        );
    }

    #[test]
    fn body_and_id_stay_together() {
        use crate::privacy::DataLevel;
        use crate::store::sanitize::SanitizedExport;
        use crate::upload::payload::to_core_event;

        let export = SanitizedExport {
            schema: "comma.desktop.activity.v1".to_string(),
            level: DataLevel::P1Event,
            sample_count: 5,
            hourly_activity: vec![(1, 5)],
            total_idle_seconds: 10,
            decision_count: 5,
            eligible_count: 1,
        };
        let request = to_core_event(&export, "2026-09-14T12:00:00.000Z");
        let (id, body) = to_queue_item(&request).unwrap();
        assert_eq!(id, request.client_event_id);
        assert!(body.contains(&id), "body must carry its own idempotency id");
    }
}
