//! Sanitised egress projection — the only shape allowed to leave the machine.
//!
//! Phase 0 has **no network code at all** (see `Cargo.toml`: no HTTP client is
//! a dependency). This module exists so that when an uploader is added later,
//! the only thing it can be handed is [`SanitizedExport`], which by
//! construction cannot carry an app name, a window title, a path, a username
//! or a raw timestamp.
//!
//! The projection is deliberately lossy: it buckets time to the hour and
//! reduces apps to nothing at all, keeping only aggregate shape.

use serde::{Deserialize, Serialize};

use crate::interrupt::ActivitySample;
use crate::privacy::{CollectionState, DataLevel};
use crate::store::StoredDecision;

/// Reasons an export request was refused.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportError {
    /// The user has not enabled upload; the default.
    UploadDisabled,
    /// The master collection gate is off.
    CollectionDisabled,
    /// A caller tried to export P3 material, which must never egress.
    P3EgressForbidden,
}

/// Aggregate, non-identifying view of a period of activity.
///
/// Note what is *absent*: no `app`, no `window_title`, no `path`, no raw
/// millisecond timestamps, no username. Aggregates are bucketed to whole hours
/// so timing cannot be used to reconstruct a schedule.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SanitizedExport {
    /// Schema marker so a receiver can version the contract.
    pub schema: String,
    /// Data grade; always P1 for activity aggregates.
    pub level: DataLevel,
    /// Number of samples the aggregates were computed from, after any
    /// drop-out. This is a count, not an identifier.
    pub sample_count: u64,
    /// Hour-bucketed activity counts, `(utc_hour_bucket, sample_count)`.
    pub hourly_activity: Vec<(u64, u64)>,
    /// Total seconds of measured idle time across the period.
    pub total_idle_seconds: u64,
    /// How many decisions were classified in the period.
    pub decision_count: u64,
    /// How many of those were classified as eligible moments.
    pub eligible_count: u64,
}

const SCHEMA: &str = "comma.desktop.activity.v1";
/// One hour in milliseconds.
const HOUR_MS: u64 = 60 * 60 * 1000;

/// Build the only uploadable projection from local data.
///
/// Returns `Err` when the user has not opted in, so that "off" is enforced at
/// the boundary rather than by convention. App names and titles are dropped
/// entirely; only counts survive.
pub fn build_export(
    state: &CollectionState,
    samples: &[ActivitySample],
    decisions: &[StoredDecision],
) -> Result<SanitizedExport, ExportError> {
    if !state.enabled {
        return Err(ExportError::CollectionDisabled);
    }
    if !state.may_upload() {
        return Err(ExportError::UploadDisabled);
    }

    let level = DataLevel::activity_sample_level();
    // Defence in depth: if the grade were ever P3, refuse here too.
    if level.egress_forbidden() {
        return Err(ExportError::P3EgressForbidden);
    }

    let mut buckets: std::collections::BTreeMap<u64, u64> = std::collections::BTreeMap::new();
    let mut total_idle_seconds = 0u64;
    for sample in samples {
        let bucket = sample.observed_at_ms / HOUR_MS;
        *buckets.entry(bucket).or_insert(0) += 1;
        total_idle_seconds += u64::from(sample.idle_seconds);
    }

    let eligible_count = decisions
        .iter()
        .filter(|d| d.decision == crate::interrupt::Decision::Interrupt)
        .count() as u64;

    Ok(SanitizedExport {
        schema: SCHEMA.to_string(),
        level,
        sample_count: samples.len() as u64,
        hourly_activity: buckets.into_iter().collect(),
        total_idle_seconds,
        decision_count: decisions.len() as u64,
        eligible_count,
    })
}

/// Serialise an export for inspection. Kept separate from building so tests
/// can assert on the JSON the receiver would actually see.
pub fn to_json(export: &SanitizedExport) -> Result<String, ExportError> {
    serde_json::to_string(export).map_err(|_| ExportError::UploadDisabled)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::interrupt::{Decision, ReasonCode};

    fn sample(at: u64, app: &str) -> ActivitySample {
        ActivitySample {
            observed_at_ms: at,
            app: app.to_string(),
            idle_seconds: 10,
        }
    }

    fn decision(kind: Decision) -> StoredDecision {
        StoredDecision {
            decided_at_ms: 1_700_000_000_000,
            decision: kind,
            reasons: vec![ReasonCode::Eligible],
            score: 100,
        }
    }

    fn upload_on() -> CollectionState {
        CollectionState {
            upload_enabled: true,
            ..CollectionState::default()
        }
    }

    #[test]
    fn upload_disabled_by_explicit_opt_out() {
        let state = CollectionState {
            upload_enabled: false,
            ..CollectionState::default()
        };
        let err = build_export(&state, &[], &[]).unwrap_err();
        assert_eq!(err, ExportError::UploadDisabled);
    }

    #[test]
    fn upload_defaults_to_enabled_but_needs_a_master_gate() {
        // T2 changed the default: the upload switch ships ready. The gate that
        // still blocks is the master collection switch.
        assert!(CollectionState::default().may_upload());
        let master_off = CollectionState {
            enabled: false,
            ..CollectionState::default()
        };
        assert_eq!(
            build_export(&master_off, &[], &[]).unwrap_err(),
            ExportError::CollectionDisabled
        );
    }

    #[test]
    fn collection_off_beats_upload_flag() {
        let state = CollectionState {
            enabled: false,
            upload_enabled: true,
            ..CollectionState::default()
        };
        assert_eq!(
            build_export(&state, &[], &[]).unwrap_err(),
            ExportError::CollectionDisabled
        );
    }

    #[test]
    fn export_drops_app_names_and_titles() {
        let samples = vec![
            sample(1_700_000_000_000, "Code"),
            sample(1_700_000_060_000, "chrome"),
            sample(1_700_000_120_000, "Banking-App"),
        ];
        let export = build_export(&upload_on(), &samples, &[]).unwrap();
        let json = to_json(&export).unwrap();

        for leak in [
            "Code",
            "chrome",
            "Banking-App",
            "app",
            "window_title",
            "path",
        ] {
            assert!(
                !json.contains(leak),
                "sanitised export leaked {leak:?}: {json}"
            );
        }
        assert_eq!(export.sample_count, 3);
    }

    #[test]
    fn export_buckets_time_to_hours() {
        // Two samples one second apart fall in the same hour bucket.
        let samples = vec![
            sample(1_700_000_000_000, "Code"),
            sample(1_700_000_001_000, "Code"),
        ];
        let export = build_export(&upload_on(), &samples, &[]).unwrap();
        assert_eq!(export.hourly_activity.len(), 1);
        assert_eq!(export.hourly_activity[0].1, 2);

        // A sample two hours later lands in its own bucket.
        let mut more = samples.clone();
        more.push(sample(1_700_000_000_000 + 2 * HOUR_MS, "Code"));
        let export = build_export(&upload_on(), &more, &[]).unwrap();
        assert_eq!(export.hourly_activity.len(), 2);
    }

    #[test]
    fn export_json_has_no_raw_millisecond_timestamp() {
        let samples = vec![sample(1_700_000_123_456, "Code")];
        let export = build_export(&upload_on(), &samples, &[]).unwrap();
        let json = to_json(&export).unwrap();
        // The raw value must not appear verbatim; only the hour bucket may.
        assert!(
            !json.contains("1700000123456"),
            "raw timestamp leaked: {json}"
        );
    }

    #[test]
    fn export_counts_decisions_without_leaking_them() {
        let decisions = vec![
            decision(Decision::Interrupt),
            decision(Decision::Defer),
            decision(Decision::Interrupt),
            decision(Decision::Silence),
        ];
        let export = build_export(&upload_on(), &[], &decisions).unwrap();
        assert_eq!(export.decision_count, 4);
        assert_eq!(export.eligible_count, 2);
    }

    #[test]
    fn export_level_is_p1_and_never_p3() {
        let samples = vec![sample(1_700_000_000_000, "Code")];
        let export = build_export(&upload_on(), &samples, &[]).unwrap();
        assert_eq!(export.level, DataLevel::P1Event);
        assert!(!export.level.egress_forbidden());
        assert!(export.level < DataLevel::P3DeepPersonalModel);
    }

    #[test]
    fn export_payload_grades_as_p1_not_p3() {
        // Guards the invariant the architecture doc states: P3 never egresses.
        let samples = vec![sample(1_700_000_000_000, "Code")];
        let export = build_export(&upload_on(), &samples, &[]).unwrap();
        let json = to_json(&export).unwrap();
        assert!(json.contains("p1_event"), "grade missing from payload");
        assert!(!json.contains("p3_deep_personal_model"));
    }
}
