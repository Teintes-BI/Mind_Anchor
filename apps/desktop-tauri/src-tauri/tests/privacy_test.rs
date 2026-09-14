//! Structural privacy invariants for the local store.
//!
//! These check that the *schema itself* cannot hold sensitive material, so the
//! guarantee survives future edits: a column for keystrokes or text simply does
//! not exist, and adding one would break these tests.

use comma_desktop::interrupt::{ActivitySample, Decision, ReasonCode};
use comma_desktop::privacy::{CollectionState, DataLevel};
use comma_desktop::store::{LocalStore, StoreError};

fn sample(at: u64, app: &str, idle: u32) -> ActivitySample {
    ActivitySample {
        observed_at_ms: at,
        app: app.to_string(),
        idle_seconds: idle,
    }
}

fn columns(store: &LocalStore, table: &str) -> Vec<String> {
    // `pragma_table_info` is queried through the public read path: we re-open
    // the same in-memory database is not possible, so this uses the store's own
    // helper surface instead.
    store.column_names(table).expect("column_names")
}

#[test]
fn activity_table_has_no_sensitive_columns() {
    let store = LocalStore::open_in_memory().unwrap();
    let found = columns(&store, "activity_samples");
    for forbidden in [
        "key",
        "text",
        "content",
        "clipboard",
        "title",
        "password",
        "input_text",
    ] {
        assert!(
            !found.iter().any(|column| column.contains(forbidden)),
            "activity_samples must not have a {forbidden:?} column, found {found:?}"
        );
    }
}

#[test]
fn activity_table_has_the_expected_minimal_columns() {
    let store = LocalStore::open_in_memory().unwrap();
    let found = columns(&store, "activity_samples");
    for expected in ["id", "observed_at_ms", "app", "idle_seconds", "level"] {
        assert!(
            found.contains(&expected.to_string()),
            "missing column {expected:?} in {found:?}"
        );
    }
    assert_eq!(found.len(), 5, "unexpected extra columns: {found:?}");
}

#[test]
fn decision_table_stores_reasons_as_data_not_prose() {
    let store = LocalStore::open_in_memory().unwrap();
    let found = columns(&store, "interrupt_decisions");
    assert_eq!(
        found,
        vec![
            "id".to_string(),
            "decided_at_ms".to_string(),
            "decision".to_string(),
            "reasons_json".to_string(),
            "score".to_string()
        ]
    );
}

#[test]
fn writes_are_gated_by_the_collection_switch() {
    let store = LocalStore::open_in_memory().unwrap();
    let off = CollectionState {
        enabled: false,
        ..CollectionState::default()
    };
    assert!(matches!(
        store.insert_sample(&off, &sample(1, "Code", 1)),
        Err(StoreError::CollectionDisabled)
    ));
    assert_eq!(store.sample_count().unwrap(), 0);
}

#[test]
fn level_defaults_to_p1_event_for_samples() {
    let store = LocalStore::open_in_memory().unwrap();
    let on = CollectionState::default();
    store.insert_sample(&on, &sample(1, "Code", 3)).unwrap();
    assert_eq!(store.sample_level(1).unwrap(), "p1_event");
    assert_eq!(DataLevel::activity_sample_level(), DataLevel::P1Event);
}

#[test]
fn reopening_a_file_database_preserves_rows_and_schema() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("shadow.sqlite");
    let on = CollectionState::default();

    {
        let store = LocalStore::open(&path).unwrap();
        for i in 0..3u64 {
            store
                .insert_sample(&on, &sample(1000 + i, "Code", 5))
                .unwrap();
        }
        store
            .insert_decision(&on, 1000, Decision::Interrupt, &[ReasonCode::Eligible], 100)
            .unwrap();
    }

    let reopened = LocalStore::open(&path).unwrap();
    assert_eq!(reopened.sample_count().unwrap(), 3);
    assert_eq!(reopened.decision_count().unwrap(), 1);
    assert_eq!(columns(&reopened, "activity_samples").len(), 5);
}

#[test]
fn purge_is_total_and_idempotent() {
    let store = LocalStore::open_in_memory().unwrap();
    let on = CollectionState::default();
    store.insert_sample(&on, &sample(1, "Code", 1)).unwrap();
    store
        .insert_decision(&on, 1, Decision::Defer, &[ReasonCode::IdleTooShort], 85)
        .unwrap();

    store.purge().unwrap();
    store.purge().unwrap();

    assert_eq!(store.sample_count().unwrap(), 0);
    assert_eq!(store.decision_count().unwrap(), 0);
    assert!(store.recent_samples(10).unwrap().is_empty());
    assert!(store.recent_decisions(10).unwrap().is_empty());
}
