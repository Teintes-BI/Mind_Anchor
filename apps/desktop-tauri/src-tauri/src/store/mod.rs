//! Local persistence for Phase 0.
//!
//! Two append-only tables in a single SQLite file:
//!
//! * `activity_samples` — what was observed (no keys, no text).
//! * `interrupt_decisions` — what the engine concluded, and why.
//!
//! Decisions are stored even in shadow mode, because the whole point of shadow
//! mode is to accumulate evidence about how often the engine *would* have
//! interrupted. Nothing here ever writes to the network.

pub mod sanitize;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use crate::interrupt::{ActivitySample, Decision, ReasonCode};
use crate::privacy::CollectionState;

/// Errors from the local store.
#[derive(Debug)]
pub enum StoreError {
    Sqlite(rusqlite::Error),
    /// A write was attempted while the user had collection switched off.
    CollectionDisabled,
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StoreError::Sqlite(error) => write!(f, "sqlite error: {error}"),
            StoreError::CollectionDisabled => write!(f, "collection is disabled"),
        }
    }
}

impl std::error::Error for StoreError {}

impl From<rusqlite::Error> for StoreError {
    fn from(error: rusqlite::Error) -> Self {
        StoreError::Sqlite(error)
    }
}

const SCHEMA_VERSION: i64 = 2;

/// A decision as persisted, with its reasons intact for later auditing.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StoredDecision {
    pub decided_at_ms: u64,
    pub decision: Decision,
    pub reasons: Vec<ReasonCode>,
    pub score: u8,
}

/// Local SQLite-backed store.
pub struct LocalStore {
    connection: Connection,
}

impl LocalStore {
    /// Open (or create) the store at `path` and apply the schema.
    pub fn open(path: &std::path::Path) -> Result<Self, StoreError> {
        let connection = Connection::open(path)?;
        let store = Self { connection };
        store.migrate()?;
        // WAL keeps the writer from blocking reads; Phase 0 is single-writer.
        let _ = store.connection.pragma_update(None, "journal_mode", "WAL");
        Ok(store)
    }

    /// In-memory store, used by tests.
    pub fn open_in_memory() -> Result<Self, StoreError> {
        let connection = Connection::open_in_memory()?;
        let store = Self { connection };
        store.migrate()?;
        Ok(store)
    }

    fn migrate(&self) -> Result<(), StoreError> {
        self.connection.execute_batch(
            "BEGIN;
             CREATE TABLE IF NOT EXISTS schema_meta (
                 version INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS activity_samples (
                 id            INTEGER PRIMARY KEY AUTOINCREMENT,
                 observed_at_ms INTEGER NOT NULL,
                 app           TEXT NOT NULL,
                 idle_seconds  INTEGER NOT NULL,
                 -- Keystroke content is structurally impossible here: there is
                 -- no column for text, key codes or clipboard data.
                 level         TEXT NOT NULL DEFAULT 'p1_event'
             );
             CREATE INDEX IF NOT EXISTS idx_activity_time
                 ON activity_samples (observed_at_ms);
             CREATE TABLE IF NOT EXISTS interrupt_decisions (
                 id            INTEGER PRIMARY KEY AUTOINCREMENT,
                 decided_at_ms INTEGER NOT NULL,
                 decision      TEXT NOT NULL,
                 reasons_json  TEXT NOT NULL,
                 score         INTEGER NOT NULL
             );
             CREATE INDEX IF NOT EXISTS idx_decision_time
                 ON interrupt_decisions (decided_at_ms);
             -- T2 upload queue. Additive: Phase 0 data is untouched by this
             -- migration and the table can be dropped without side effects.
             CREATE TABLE IF NOT EXISTS upload_queue (
                 id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                 client_event_id    TEXT NOT NULL,
                 body_json          TEXT NOT NULL,
                 state              TEXT NOT NULL DEFAULT 'pending',
                 attempts           INTEGER NOT NULL DEFAULT 0,
                 next_attempt_at_ms INTEGER NOT NULL DEFAULT 0,
                 last_error         TEXT,
                 created_at_ms      INTEGER NOT NULL
             );
             -- At most one live row per idempotency id: re-enqueuing the same
             -- aggregate must not create parallel deliveries.
             CREATE UNIQUE INDEX IF NOT EXISTS idx_upload_queue_client_event
                 ON upload_queue (client_event_id);
             CREATE INDEX IF NOT EXISTS idx_upload_queue_state
                 ON upload_queue (state, next_attempt_at_ms);
             -- Relay configuration. These values were previously held in memory
             -- only, so a restart silently lost the endpoint, token and pinned
             -- fingerprint while the queue counters (read from this database)
             -- still looked correct. Persisting them makes the panel and the
             -- uploader agree across restarts.
             CREATE TABLE IF NOT EXISTS settings (
                 key   TEXT PRIMARY KEY,
                 value TEXT NOT NULL
             );
             COMMIT;",
        )?;

        let existing: Option<i64> = self
            .connection
            .query_row("SELECT version FROM schema_meta LIMIT 1", [], |row| {
                row.get(0)
            })
            .ok();
        if existing.is_none() {
            self.connection.execute(
                "INSERT INTO schema_meta (version) VALUES (?1)",
                params![SCHEMA_VERSION],
            )?;
        }
        Ok(())
    }

    /// Append an activity sample. Refused when collection is off.
    pub fn insert_sample(
        &self,
        state: &CollectionState,
        sample: &ActivitySample,
    ) -> Result<(), StoreError> {
        if !state.may_store() {
            return Err(StoreError::CollectionDisabled);
        }
        self.connection.execute(
            "INSERT INTO activity_samples (observed_at_ms, app, idle_seconds, level)
             VALUES (?1, ?2, ?3, 'p1_event')",
            params![
                sample.observed_at_ms as i64,
                sample.app,
                sample.idle_seconds as i64
            ],
        )?;
        Ok(())
    }

    /// Append a decision. Refused when collection is off.
    pub fn insert_decision(
        &self,
        state: &CollectionState,
        decided_at_ms: u64,
        decision: Decision,
        reasons: &[ReasonCode],
        score: u8,
    ) -> Result<(), StoreError> {
        if !state.may_store() {
            return Err(StoreError::CollectionDisabled);
        }
        let reasons_json = serde_json::to_string(reasons).unwrap_or_else(|_| "[]".to_string());
        self.connection.execute(
            "INSERT INTO interrupt_decisions (decided_at_ms, decision, reasons_json, score)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                decided_at_ms as i64,
                decision_tag(decision),
                reasons_json,
                score as i64
            ],
        )?;
        Ok(())
    }

    pub fn sample_count(&self) -> Result<u64, StoreError> {
        let count: i64 =
            self.connection
                .query_row("SELECT COUNT(*) FROM activity_samples", [], |row| {
                    row.get(0)
                })?;
        Ok(count as u64)
    }

    pub fn decision_count(&self) -> Result<u64, StoreError> {
        let count: i64 =
            self.connection
                .query_row("SELECT COUNT(*) FROM interrupt_decisions", [], |row| {
                    row.get(0)
                })?;
        Ok(count as u64)
    }

    /// Column names of a table, in declaration order.
    ///
    /// Exposed so privacy tests can assert the *schema* cannot hold sensitive
    /// material. The table name is interpolated from a literal chosen by the
    /// caller, never from user input, and `pragma_table_info` only ever reads
    /// catalogue metadata.
    pub fn column_names(&self, table: &str) -> Result<Vec<String>, StoreError> {
        if !matches!(
            table,
            "activity_samples" | "interrupt_decisions" | "schema_meta"
        ) {
            return Err(StoreError::Sqlite(rusqlite::Error::InvalidQuery));
        }
        let mut statement = self
            .connection
            .prepare("SELECT name FROM pragma_table_info(?1)")?;
        let rows = statement.query_map(params![table], |row| row.get::<_, String>(0))?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// Data level recorded for a sample row. Used by privacy tests to prove
    /// activity data is graded P1 and not, say, silently P3.
    pub fn sample_level(&self, id: i64) -> Result<String, StoreError> {
        let level: String = self.connection.query_row(
            "SELECT level FROM activity_samples WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )?;
        Ok(level)
    }

    /// Read back recent samples, oldest first.
    pub fn recent_samples(&self, limit: u32) -> Result<Vec<ActivitySample>, StoreError> {
        let mut statement = self.connection.prepare(
            "SELECT observed_at_ms, app, idle_seconds FROM activity_samples
             ORDER BY observed_at_ms DESC LIMIT ?1",
        )?;
        let rows = statement.query_map(params![limit as i64], |row| {
            Ok(ActivitySample {
                observed_at_ms: row.get::<_, i64>(0)? as u64,
                app: row.get(1)?,
                idle_seconds: row.get::<_, i64>(2)? as u32,
            })
        })?;
        let mut samples = rows.collect::<Result<Vec<_>, _>>()?;
        samples.reverse();
        Ok(samples)
    }

    /// Read back recent decisions, oldest first.
    pub fn recent_decisions(&self, limit: u32) -> Result<Vec<StoredDecision>, StoreError> {
        let mut statement = self.connection.prepare(
            "SELECT decided_at_ms, decision, reasons_json, score FROM interrupt_decisions
             ORDER BY decided_at_ms DESC LIMIT ?1",
        )?;
        let rows = statement.query_map(params![limit as i64], |row| {
            let decided_at_ms: i64 = row.get(0)?;
            let tag: String = row.get(1)?;
            let reasons_json: String = row.get(2)?;
            let score: i64 = row.get(3)?;
            Ok(StoredDecision {
                decided_at_ms: decided_at_ms as u64,
                decision: decision_from_tag(&tag),
                reasons: serde_json::from_str(&reasons_json).unwrap_or_default(),
                score: score as u8,
            })
        })?;
        let mut decisions = rows.collect::<Result<Vec<_>, _>>()?;
        decisions.reverse();
        Ok(decisions)
    }

    /// Delete everything. Phase 0 keeps this in-process so a user can wipe the
    /// shadow log without touching any other subsystem.
    pub fn purge(&self) -> Result<(), StoreError> {
        self.connection.execute_batch(
            "DELETE FROM activity_samples;
             DELETE FROM interrupt_decisions;
             DELETE FROM upload_queue;",
        )?;
        Ok(())
    }

    // ---- T2 upload queue ----

    /// Enqueue an upload. Re-enqueuing the same `client_event_id` is a no-op,
    /// so a retry cannot create a second delivery of the same aggregate.
    pub fn enqueue_upload(
        &self,
        client_event_id: &str,
        body_json: &str,
        now_ms: i64,
    ) -> Result<(), StoreError> {
        self.connection.execute(
            "INSERT OR IGNORE INTO upload_queue
                 (client_event_id, body_json, state, attempts, next_attempt_at_ms, created_at_ms)
             VALUES (?1, ?2, 'pending', 0, 0, ?3)",
            params![client_event_id, body_json, now_ms],
        )?;
        Ok(())
    }

    /// Items whose next attempt is due, oldest first.
    pub fn due_uploads(
        &self,
        now_ms: i64,
        limit: u32,
    ) -> Result<Vec<crate::upload::queue::QueueItem>, StoreError> {
        let mut statement = self.connection.prepare(
            "SELECT id, client_event_id, body_json, state, attempts, next_attempt_at_ms, last_error
             FROM upload_queue
             WHERE state = 'pending' AND next_attempt_at_ms <= ?1
             ORDER BY id ASC LIMIT ?2",
        )?;
        let rows = statement.query_map(params![now_ms, limit as i64], |row| {
            Ok(crate::upload::queue::QueueItem {
                id: row.get(0)?,
                client_event_id: row.get(1)?,
                body_json: row.get(2)?,
                state: crate::upload::queue::QueueItemState::parse_state(&row.get::<_, String>(3)?),
                attempts: row.get::<_, i64>(4)? as u32,
                next_attempt_at_ms: row.get(5)?,
                last_error: row.get(6)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// Mark an item delivered.
    pub fn mark_upload_delivered(&self, id: i64) -> Result<(), StoreError> {
        self.connection.execute(
            "UPDATE upload_queue SET state = 'delivered', last_error = NULL WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    /// Delete failed queue rows and report how many were removed.
    ///
    /// Failed rows are deliberately never dropped automatically, so they can be
    /// inspected. That also means they accumulate and, with no way to clear
    /// them, the failure count becomes permanent noise in the panel. This is the
    /// explicit, user-initiated cleanup.
    ///
    /// Only rows in the `failed` state are touched: pending work is still owed
    /// to the server and delivered rows are the audit trail.
    pub fn clear_failed_uploads(&self) -> Result<u64, StoreError> {
        let removed = self
            .connection
            .execute("DELETE FROM upload_queue WHERE state = 'failed'", [])?;
        Ok(removed as u64)
    }

    /// Record a failed attempt and its next window.
    pub fn mark_upload_failed(
        &self,
        id: i64,
        state: crate::upload::queue::QueueItemState,
        attempts: u32,
        next_attempt_at_ms: i64,
        error: &str,
    ) -> Result<(), StoreError> {
        self.connection.execute(
            "UPDATE upload_queue
             SET state = ?2, attempts = ?3, next_attempt_at_ms = ?4, last_error = ?5
             WHERE id = ?1",
            params![
                id,
                state.as_str(),
                attempts as i64,
                next_attempt_at_ms,
                error
            ],
        )?;
        Ok(())
    }

    /// Counts by state, for the status surface.
    pub fn upload_counts(&self) -> Result<(u64, u64, u64), StoreError> {
        let read = |state: &str| -> Result<u64, StoreError> {
            let count: i64 = self.connection.query_row(
                "SELECT COUNT(*) FROM upload_queue WHERE state = ?1",
                params![state],
                |row| row.get(0),
            )?;
            Ok(count as u64)
        };
        Ok((read("pending")?, read("delivered")?, read("failed")?))
    }

    /// Write a configuration value, replacing any previous one.
    ///
    /// Called on every relay configuration change so the setting survives a
    /// restart. Before this, the endpoint/token/pin lived only in memory and
    /// silently reverted while the queue counters kept their values.
    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), StoreError> {
        self.connection.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    /// Remove a setting. Used when a field is explicitly cleared.
    pub fn clear_setting(&self, key: &str) -> Result<(), StoreError> {
        self.connection
            .execute("DELETE FROM settings WHERE key = ?1", params![key])?;
        Ok(())
    }

    /// Read a configuration value, or `None` when it was never set.
    pub fn setting(&self, key: &str) -> Result<Option<String>, StoreError> {
        let value = self
            .connection
            .query_row(
                "SELECT value FROM settings WHERE key = ?1",
                params![key],
                |row| row.get::<_, String>(0),
            )
            .ok();
        Ok(value)
    }
}

fn decision_tag(decision: Decision) -> &'static str {
    match decision {
        Decision::Interrupt => "interrupt",
        Decision::Defer => "defer",
        Decision::Silence => "silence",
    }
}

fn decision_from_tag(tag: &str) -> Decision {
    match tag {
        "interrupt" => Decision::Interrupt,
        "silence" => Decision::Silence,
        _ => Decision::Defer,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(at: u64, app: &str, idle: u32) -> ActivitySample {
        ActivitySample {
            observed_at_ms: at,
            app: app.to_string(),
            idle_seconds: idle,
        }
    }

    #[test]
    fn schema_applies_to_empty_database() {
        let store = LocalStore::open_in_memory().unwrap();
        assert_eq!(store.sample_count().unwrap(), 0);
        assert_eq!(store.decision_count().unwrap(), 0);
    }

    #[test]
    fn migration_is_repeatable_on_same_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("phase0.sqlite");
        {
            let store = LocalStore::open(&path).unwrap();
            store
                .insert_sample(&CollectionState::default(), &sample(1000, "Code", 5))
                .unwrap();
        }
        // Reopening must not fail or duplicate the meta row.
        let store = LocalStore::open(&path).unwrap();
        assert_eq!(store.sample_count().unwrap(), 1);
    }

    #[test]
    fn samples_round_trip_in_order() {
        let store = LocalStore::open_in_memory().unwrap();
        let state = CollectionState::default();
        for i in 0..5u64 {
            store
                .insert_sample(&state, &sample(1000 + i, "Code", 7))
                .unwrap();
        }
        let read = store.recent_samples(10).unwrap();
        assert_eq!(read.len(), 5);
        assert!(read
            .windows(2)
            .all(|w| w[0].observed_at_ms < w[1].observed_at_ms));
    }

    #[test]
    fn decisions_round_trip_with_reasons() {
        let store = LocalStore::open_in_memory().unwrap();
        let state = CollectionState::default();
        store
            .insert_decision(
                &state,
                5000,
                Decision::Defer,
                &[ReasonCode::IdleTooShort, ReasonCode::CooldownActive],
                70,
            )
            .unwrap();
        let read = store.recent_decisions(10).unwrap();
        assert_eq!(read.len(), 1);
        assert_eq!(read[0].decision, Decision::Defer);
        assert_eq!(
            read[0].reasons,
            vec![ReasonCode::IdleTooShort, ReasonCode::CooldownActive]
        );
        assert_eq!(read[0].score, 70);
    }

    #[test]
    fn writes_are_refused_when_collection_disabled() {
        let store = LocalStore::open_in_memory().unwrap();
        let state = CollectionState {
            enabled: false,
            ..CollectionState::default()
        };
        assert!(matches!(
            store.insert_sample(&state, &sample(1, "Code", 1)),
            Err(StoreError::CollectionDisabled)
        ));
        assert!(matches!(
            store.insert_decision(&state, 1, Decision::Defer, &[], 0),
            Err(StoreError::CollectionDisabled)
        ));
        assert_eq!(store.sample_count().unwrap(), 0);
    }

    #[test]
    fn purge_empties_both_tables() {
        let store = LocalStore::open_in_memory().unwrap();
        let state = CollectionState::default();
        store
            .insert_sample(&state, &sample(1000, "Code", 5))
            .unwrap();
        store
            .insert_decision(&state, 1000, Decision::Silence, &[], 0)
            .unwrap();
        store.purge().unwrap();
        assert_eq!(store.sample_count().unwrap(), 0);
        assert_eq!(store.decision_count().unwrap(), 0);
    }

    #[test]
    fn schema_has_no_column_for_keystrokes_or_text() {
        let store = LocalStore::open_in_memory().unwrap();
        let mut statement = store
            .connection
            .prepare("SELECT name FROM pragma_table_info('activity_samples')")
            .unwrap();
        let columns = statement
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();
        for forbidden in ["key", "text", "content", "clipboard", "title"] {
            assert!(
                !columns.iter().any(|c| c.contains(forbidden)),
                "activity_samples must not have a {forbidden:?} column: {columns:?}"
            );
        }
        assert!(columns.contains(&"observed_at_ms".to_string()));
    }

    #[test]
    fn clearing_failed_uploads_removes_only_failed_rows() {
        // The distinction that matters: pending work is still owed to the server
        // and delivered rows are the audit trail, so neither may be deleted.
        let store = LocalStore::open_in_memory().unwrap();

        store.enqueue_upload("evt-failed", "{}", 1).unwrap();
        store.enqueue_upload("evt-pending", "{}", 1).unwrap();
        store.enqueue_upload("evt-delivered", "{}", 1).unwrap();

        let failed_id = store
            .due_uploads(1, 10)
            .unwrap()
            .into_iter()
            .find(|item| item.client_event_id == "evt-failed")
            .unwrap()
            .id;
        store
            .mark_upload_failed(
                failed_id,
                crate::upload::queue::QueueItemState::Failed,
                5,
                0,
                "boom",
            )
            .unwrap();

        let delivered_id = store
            .due_uploads(1, 10)
            .unwrap()
            .into_iter()
            .find(|item| item.client_event_id == "evt-delivered")
            .unwrap()
            .id;
        store.mark_upload_delivered(delivered_id).unwrap();

        let (pending_before, delivered_before, failed_before) = store.upload_counts().unwrap();
        assert_eq!((pending_before, delivered_before, failed_before), (1, 1, 1));

        let removed = store.clear_failed_uploads().unwrap();
        assert_eq!(removed, 1, "exactly the one failed row");

        let (pending_after, delivered_after, failed_after) = store.upload_counts().unwrap();
        assert_eq!(pending_after, 1, "pending work must survive");
        assert_eq!(delivered_after, 1, "the delivered audit trail must survive");
        assert_eq!(failed_after, 0);
    }

    #[test]
    fn clearing_with_no_failures_is_a_no_op() {
        let store = LocalStore::open_in_memory().unwrap();
        store.enqueue_upload("evt-pending", "{}", 1).unwrap();
        assert_eq!(store.clear_failed_uploads().unwrap(), 0);
        assert_eq!(store.upload_counts().unwrap().0, 1);
    }

    #[test]
    fn clearing_failed_uploads_is_repeatable() {
        let store = LocalStore::open_in_memory().unwrap();
        store.enqueue_upload("evt-1", "{}", 1).unwrap();
        let id = store.due_uploads(1, 10).unwrap()[0].id;
        store
            .mark_upload_failed(id, crate::upload::queue::QueueItemState::Failed, 1, 0, "x")
            .unwrap();
        assert_eq!(store.clear_failed_uploads().unwrap(), 1);
        assert_eq!(
            store.clear_failed_uploads().unwrap(),
            0,
            "a second clear has nothing left to do"
        );
    }

    #[test]
    fn settings_round_trip_through_a_reopened_database() {
        // The whole point of the settings table: a value written by one run must
        // be readable by the next. Relay configuration used to live only in
        // memory, so a restart silently reverted it while the queue counters
        // (already persisted) kept their values.
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("phase0.sqlite");

        {
            let store = LocalStore::open(&path).unwrap();
            store
                .set_setting("upload.endpoint", "https://relay.example/v1/core/events")
                .unwrap();
            store.set_setting("upload.interval_ms", "300000").unwrap();
        }

        let store = LocalStore::open(&path).unwrap();
        assert_eq!(
            store.setting("upload.endpoint").unwrap().as_deref(),
            Some("https://relay.example/v1/core/events")
        );
        assert_eq!(
            store.setting("upload.interval_ms").unwrap().as_deref(),
            Some("300000")
        );
    }

    #[test]
    fn setting_overwrites_rather_than_duplicating() {
        let store = LocalStore::open_in_memory().unwrap();
        store
            .set_setting("upload.endpoint", "https://first.example/x")
            .unwrap();
        store
            .set_setting("upload.endpoint", "https://second.example/x")
            .unwrap();
        assert_eq!(
            store.setting("upload.endpoint").unwrap().as_deref(),
            Some("https://second.example/x"),
            "the later write must win"
        );
    }

    #[test]
    fn clearing_a_setting_removes_it() {
        // "unset" must have exactly one representation, otherwise a cleared
        // endpoint could read back as an empty string and look configured.
        let store = LocalStore::open_in_memory().unwrap();
        store.set_setting("upload.token", "secret").unwrap();
        store.clear_setting("upload.token").unwrap();
        assert_eq!(store.setting("upload.token").unwrap(), None);
    }

    #[test]
    fn reading_an_absent_setting_is_none_not_an_error() {
        let store = LocalStore::open_in_memory().unwrap();
        assert_eq!(store.setting("never.written").unwrap(), None);
    }

    #[test]
    fn clearing_an_absent_setting_is_harmless() {
        let store = LocalStore::open_in_memory().unwrap();
        store.clear_setting("never.written").unwrap();
        assert_eq!(store.setting("never.written").unwrap(), None);
    }
}
