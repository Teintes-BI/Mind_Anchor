//! Privacy red-team coverage for the egress boundary.
//!
//! The architecture doc states P3 never leaves the machine and that activity
//! data must not carry identifying detail. These tests attack the sanitiser
//! from the outside: they build realistic local data, run it through the only
//! export path, and assert nothing identifying survives.

use comma_desktop::interrupt::{ActivitySample, Decision, ReasonCode};
use comma_desktop::privacy::{CollectionState, DataLevel};
use comma_desktop::store::sanitize::{build_export, to_json, ExportError};
use comma_desktop::store::StoredDecision;

fn sample(at: u64, app: &str, idle: u32) -> ActivitySample {
    ActivitySample {
        observed_at_ms: at,
        app: app.to_string(),
        idle_seconds: idle,
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

fn opted_in() -> CollectionState {
    CollectionState {
        upload_enabled: true,
        ..CollectionState::default()
    }
}

#[test]
fn default_state_allows_export_but_master_gate_still_blocks() {
    // T2 changed the default: the upload switch ships ready because a trusted
    // relay is a required part of this design. The gate that still stops an
    // egress is the master collection switch (and, at send time, an unset
    // endpoint).
    assert!(CollectionState::default().may_upload());

    let master_off = CollectionState {
        enabled: false,
        ..CollectionState::default()
    };
    assert_eq!(
        build_export(&master_off, &[sample(1, "Code", 1)], &[]).unwrap_err(),
        ExportError::CollectionDisabled
    );
}

#[test]
fn explicit_upload_opt_out_still_blocks_export() {
    let opted_out = CollectionState {
        upload_enabled: false,
        ..CollectionState::default()
    };
    assert_eq!(
        build_export(&opted_out, &[sample(1, "Code", 1)], &[]).unwrap_err(),
        ExportError::UploadDisabled
    );
}

#[test]
fn disabling_collection_blocks_export_even_when_upload_stays_on() {
    let state = CollectionState {
        enabled: false,
        upload_enabled: true,
        ..CollectionState::default()
    };
    assert_eq!(
        build_export(&state, &[sample(1, "Code", 1)], &[]).unwrap_err(),
        ExportError::CollectionDisabled
    );
}

#[test]
fn identifying_application_names_never_survive() {
    // A deliberately hostile set: names that look like private documents.
    let hostile = [
        "TaxReturn-2025",
        "TherapyNotes",
        "DivorcePaperwork",
        "MedicalPortal",
        "1Password",
    ];
    let samples: Vec<_> = hostile
        .iter()
        .enumerate()
        .map(|(index, app)| sample(1_700_000_000_000 + index as u64 * 1000, app, 5))
        .collect();

    let export = build_export(&opted_in(), &samples, &[]).unwrap();
    let json = to_json(&export).unwrap();

    for name in hostile {
        assert!(
            !json.contains(name),
            "sanitised export leaked application name {name:?}"
        );
    }
}

#[test]
fn aggregate_shape_is_preserved_after_sanitising() {
    // Sanitising must not destroy the signal, only the identity.
    let samples: Vec<_> = (0..24)
        .map(|i| sample(1_700_000_000_000 + i * 60_000, "Code", 12))
        .collect();
    let decisions = vec![
        decision(Decision::Interrupt),
        decision(Decision::Defer),
        decision(Decision::Silence),
    ];
    let export = build_export(&opted_in(), &samples, &decisions).unwrap();

    assert_eq!(export.sample_count, 24);
    assert_eq!(export.total_idle_seconds, 24 * 12);
    assert_eq!(export.decision_count, 3);
    assert_eq!(export.eligible_count, 1);
    assert!(!export.hourly_activity.is_empty());
}

#[test]
fn export_declares_p1_and_excludes_p3() {
    let export = build_export(&opted_in(), &[sample(1_700_000_000_000, "Code", 3)], &[]).unwrap();
    assert_eq!(export.level, DataLevel::P1Event);

    let json = to_json(&export).unwrap();
    assert!(json.contains("p1_event"));
    assert!(
        !json.contains("p3_deep_personal_model"),
        "P3 must never appear in an egress payload"
    );
}

#[test]
fn export_contains_no_window_title_or_path_fragments() {
    let samples = vec![
        sample(1_700_000_000_000, "Code", 4),
        sample(1_700_000_060_000, "explorer", 4),
    ];
    let json = to_json(&build_export(&opted_in(), &samples, &[]).unwrap()).unwrap();

    for fragment in [
        "window_title",
        "title",
        "\\",
        "/",
        "Users",
        "C:",
        ".xlsx",
        ".docx",
    ] {
        assert!(
            !json.contains(fragment),
            "sanitised export contained {fragment:?}: {json}"
        );
    }
}

#[test]
fn raw_timestamps_are_bucketed_not_forwarded() {
    let exact = 1_700_000_987_654u64;
    let export = build_export(&opted_in(), &[sample(exact, "Code", 1)], &[]).unwrap();
    let json = to_json(&export).unwrap();

    assert!(!json.contains(&exact.to_string()));
    // The hour bucket is the only time-shaped value permitted.
    assert_eq!(export.hourly_activity.len(), 1);
    assert_eq!(export.hourly_activity[0].0, exact / (60 * 60 * 1000));
}

#[test]
fn empty_dataset_exports_a_valid_empty_envelope() {
    let export = build_export(&opted_in(), &[], &[]).unwrap();
    assert_eq!(export.sample_count, 0);
    assert!(export.hourly_activity.is_empty());
    assert_eq!(export.schema, "comma.desktop.activity.v1");
}

#[test]
fn export_is_deterministic_for_identical_input() {
    let samples = vec![sample(1_700_000_000_000, "Code", 3)];
    let decisions = vec![decision(Decision::Defer)];
    let first = to_json(&build_export(&opted_in(), &samples, &decisions).unwrap()).unwrap();
    let second = to_json(&build_export(&opted_in(), &samples, &decisions).unwrap()).unwrap();
    assert_eq!(first, second);
}
