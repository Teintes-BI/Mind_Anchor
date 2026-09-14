//! Mapping the sanitised projection onto the Core event contract.
//!
//! The target is `POST /v1/core/events` in `apps/api`. The contract, read from
//! the source rather than assumed, is:
//!
//! | field | required | value used here |
//! |---|---|---|
//! | `eventType` | yes | `"activity"` |
//! | `source` | yes | `"desktop"` |
//! | `occurredAt` | yes | the export's period end, ISO-8601 UTC |
//! | `privacyLevel` | yes | `"P1"` (never P3) |
//! | `confidence` | yes, 0-1 | aggregate-derived, capped below 1.0 |
//! | `payload` | yes | the aggregate counters only |
//! | `clientEventId` | no | stable per export, gives idempotency |
//!
//! `clientEventId` is the important one: the API treats a repeated
//! `clientEventId` (or `Idempotency-Key` header) with an identical payload as
//! the same event, so a retried upload cannot duplicate rows.

use serde::{Deserialize, Serialize};

use crate::store::sanitize::SanitizedExport;

/// The request body for `POST /v1/core/events`.
///
/// Field types follow the API's Zod schema exactly. In particular `confidence`
/// is a **number**, not a string: `coreEventSchema` declares
/// `z.number().min(0).max(1)`, and a string there is rejected with a 400. This
/// was caught by `apps/api/tests/desktop-upload-contract.test.ts` rather than
/// assumed.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreEventRequest {
    pub client_event_id: String,
    pub event_type: String,
    pub occurred_at: String,
    pub source: String,
    pub privacy_level: String,
    pub confidence: f64,
    pub payload: ActivityPayload,
}

/// The aggregate counters that travel. Deliberately no app names or titles.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityPayload {
    pub schema: String,
    pub sample_count: u64,
    pub decision_count: u64,
    pub eligible_count: u64,
    pub total_idle_seconds: u64,
    /// `(utc_hour_bucket, sample_count)` pairs.
    pub hourly_activity: Vec<(u64, u64)>,
}

/// Convert an export into a Core event request.
///
/// `occurred_at` is supplied by the caller as an ISO-8601 UTC string so this
/// stays a pure function; the caller reads the clock.
pub fn to_core_event(export: &SanitizedExport, occurred_at: &str) -> CoreEventRequest {
    CoreEventRequest {
        client_event_id: client_event_id(export),
        event_type: "activity".to_string(),
        occurred_at: occurred_at.to_string(),
        source: "desktop".to_string(),
        // Activity aggregates are P1. P3 is checked at the egress boundary and
        // cannot reach here, but the literal is asserted in tests.
        privacy_level: "P1".to_string(),
        confidence: confidence_for(export),
        payload: ActivityPayload {
            schema: export.schema.clone(),
            sample_count: export.sample_count,
            decision_count: export.decision_count,
            eligible_count: export.eligible_count,
            total_idle_seconds: export.total_idle_seconds,
            hourly_activity: export.hourly_activity.clone(),
        },
    }
}

/// A stable identifier for this export, used for idempotent retries.
///
/// Built from the content rather than a random id, so re-sending the *same*
/// aggregate resolves to the same event server-side, while a changed aggregate
/// produces a new one.
pub fn client_event_id(export: &SanitizedExport) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    export.schema.hash(&mut hasher);
    export.sample_count.hash(&mut hasher);
    export.decision_count.hash(&mut hasher);
    export.eligible_count.hash(&mut hasher);
    export.total_idle_seconds.hash(&mut hasher);
    // Buckets are already ordered (BTreeMap on the way in), so the hash is
    // stable for identical input.
    export.hourly_activity.hash(&mut hasher);

    format!("desktop-activity-{:016x}", hasher.finish())
}

/// Confidence for the aggregate.
///
/// Deliberately capped below 1.0: an activity aggregate is indirect evidence,
/// never certainty. More samples raise it, but only towards the cap.
///
/// Returns a number because the API's schema requires `z.number()`; a string
/// here is a 400. Rounded to 2 decimals so the sent value is stable and
/// readable.
fn confidence_for(export: &SanitizedExport) -> f64 {
    const CAP: f64 = 0.80;
    if export.sample_count == 0 {
        return 0.0;
    }
    // Reaches the cap at ~100 samples, then stops.
    let scaled = (export.sample_count as f64 / 100.0).min(1.0) * CAP;
    (scaled * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privacy::DataLevel;

    fn export() -> SanitizedExport {
        SanitizedExport {
            schema: "comma.desktop.activity.v1".to_string(),
            level: DataLevel::P1Event,
            sample_count: 42,
            hourly_activity: vec![(472_222, 42)],
            total_idle_seconds: 900,
            decision_count: 42,
            eligible_count: 3,
        }
    }

    #[test]
    fn maps_to_the_core_contract() {
        let request = to_core_event(&export(), "2026-09-14T12:00:00.000Z");
        assert_eq!(request.event_type, "activity");
        assert_eq!(request.source, "desktop");
        assert_eq!(request.privacy_level, "P1");
        assert_eq!(request.occurred_at, "2026-09-14T12:00:00.000Z");
        assert_eq!(request.payload.sample_count, 42);
        assert_eq!(request.payload.eligible_count, 3);
    }

    #[test]
    fn event_type_and_source_are_valid_enum_members() {
        // Mirrors coreEventTypeSchema / coreEventSourceSchema in packages/domain.
        const EVENT_TYPES: [&str; 6] = [
            "state_report",
            "activity",
            "task_candidate",
            "check_in",
            "interaction",
            "device_signal",
        ];
        const SOURCES: [&str; 8] = [
            "user", "desktop", "web", "mobile", "watch", "glasses", "system", "legacy",
        ];
        let request = to_core_event(&export(), "2026-09-14T12:00:00.000Z");
        assert!(EVENT_TYPES.contains(&request.event_type.as_str()));
        assert!(SOURCES.contains(&request.source.as_str()));
    }

    #[test]
    fn privacy_level_is_never_p3() {
        let request = to_core_event(&export(), "2026-09-14T12:00:00.000Z");
        assert_ne!(request.privacy_level, "P3");
        assert!(["P0", "P1", "P2", "P3"].contains(&request.privacy_level.as_str()));
    }

    #[test]
    fn serialised_body_carries_no_identifying_fields() {
        let request = to_core_event(&export(), "2026-09-14T12:00:00.000Z");
        let json = serde_json::to_string(&request).unwrap();
        for leak in ["app", "windowTitle", "title", "path", "user", "profile"] {
            assert!(
                !json.contains(leak),
                "core event body leaked {leak:?}: {json}"
            );
        }
    }

    #[test]
    fn client_event_id_is_stable_for_identical_content() {
        let a = client_event_id(&export());
        let b = client_event_id(&export());
        assert_eq!(a, b, "identical aggregates must be idempotent");
        assert!(a.starts_with("desktop-activity-"));
    }

    #[test]
    fn client_event_id_changes_with_content() {
        let mut changed = export();
        changed.eligible_count = 4;
        assert_ne!(client_event_id(&export()), client_event_id(&changed));
    }

    #[test]
    fn confidence_is_a_number_capped_below_certainty() {
        // The API requires z.number(); a string is rejected with a 400.
        let mut big = export();
        big.sample_count = 10_000;
        let request = to_core_event(&big, "2026-09-14T12:00:00.000Z");
        assert!(request.confidence <= 0.80, "must not claim certainty");
        assert!(request.confidence > 0.0);

        let json = serde_json::to_value(&request).unwrap();
        assert!(
            json["confidence"].is_number(),
            "confidence must serialise as a number, got {}",
            json["confidence"]
        );
    }

    #[test]
    fn confidence_is_zero_for_an_empty_export() {
        let mut empty = export();
        empty.sample_count = 0;
        let request = to_core_event(&empty, "2026-09-14T12:00:00.000Z");
        assert_eq!(request.confidence, 0.0);
    }

    #[test]
    fn confidence_is_always_a_unit_interval_number() {
        for count in [0u64, 1, 50, 100, 1000] {
            let mut e = export();
            e.sample_count = count;
            let value = to_core_event(&e, "2026-09-14T12:00:00.000Z").confidence;
            assert!((0.0..=1.0).contains(&value), "count={count} value={value}");
        }
    }

    #[test]
    fn camel_case_serialisation_matches_api_expectations() {
        let request = to_core_event(&export(), "2026-09-14T12:00:00.000Z");
        let json = serde_json::to_value(&request).unwrap();
        for key in [
            "clientEventId",
            "eventType",
            "occurredAt",
            "source",
            "privacyLevel",
            "confidence",
            "payload",
        ] {
            assert!(json.get(key).is_some(), "missing {key} in {json}");
        }
    }
}
