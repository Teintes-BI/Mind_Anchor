//! Comma desktop activity collector — Phase 0 (Windows, shadow mode).
//!
//! What this crate does:
//!
//! * Samples the foreground process name and the idle time, locally.
//! * Classifies each sample as `Interrupt` / `Defer` / `Silence` via a pure
//!   function ([`interrupt::decide`]).
//! * Persists samples and decisions to a local SQLite file (append-only).
//!
//! What this crate deliberately does **not** do:
//!
//! * No notifications, popups, sounds or window raises. Shadow mode means the
//!   engine's output is recorded and displayed, never delivered.
//! * No keystroke capture. The only keyboard-adjacent OS call is
//!   `GetLastInputInfo`, which yields a *timestamp*, not a key.
//! * No network. There is no HTTP client in the dependency graph, so an upload
//!   cannot happen even by accident; [`store::sanitize`] defines the only
//!   shape that would ever be allowed to leave.

pub mod collector;
pub mod interrupt;
pub mod privacy;
pub mod store;
pub mod upload;

use std::sync::Mutex;

use serde::Serialize;
use tauri::State;

use collector::sampler::{sample_once, ActivityBuffer};
use collector::CollectorConfig;
use interrupt::{decide, DecisionInput, DecisionOutput, InterruptPolicy};
use privacy::{CollectionState, DataLevel};
use store::sanitize::{build_export, ExportError, SanitizedExport};
use store::{LocalStore, StoreError};

/// Application state shared with the UI.
pub struct AppState {
    store: LocalStore,
    buffer: ActivityBuffer,
    collector_config: CollectorConfig,
    collection_state: CollectionState,
    policy: InterruptPolicy,
    /// Timestamp of the most recent `Interrupt` classification, used by the
    /// engine's own cooldown. Never used to deliver anything.
    last_interrupt_at_ms: Option<u64>,
    interrupts_today: u32,
    /// T2: where sanitised aggregates are sent. Empty means "not configured",
    /// in which case uploads are refused rather than sent anywhere.
    upload_endpoint: String,
    /// Optional bearer token for the relay.
    upload_token: Option<String>,
    /// SHA-256 fingerprint the relay's TLS certificate must match. Required for
    /// https endpoints; without it the upload is refused rather than trusting
    /// an unverified peer.
    upload_pin: Option<String>,
    /// How often to attempt a background flush, in milliseconds. Zero disables
    /// scheduling; the UI may only ever set a clamped value.
    upload_interval_ms: u64,
}

impl AppState {
    fn new(store: LocalStore) -> Self {
        let mut state = Self {
            store,
            buffer: ActivityBuffer::new(),
            collector_config: CollectorConfig::default(),
            collection_state: CollectionState::default(),
            policy: InterruptPolicy::default(),
            last_interrupt_at_ms: None,
            interrupts_today: 0,
            upload_endpoint: String::new(),
            upload_token: None,
            upload_pin: None,
            upload_interval_ms: 0,
        };
        // Restore any relay configuration saved by a previous run. A failure
        // here is not fatal: the app still collects, it just starts with an
        // unconfigured relay, which the UI reports as such.
        if let Err(error) = state.load_relay_config() {
            eprintln!("comma-desktop: could not restore relay config: {error:?}");
        }
        state
    }

    /// Setting keys for the persisted relay configuration.
    const KEY_ENDPOINT: &'static str = "upload.endpoint";
    const KEY_TOKEN: &'static str = "upload.token";
    const KEY_PIN: &'static str = "upload.pin";
    const KEY_INTERVAL: &'static str = "upload.interval_ms";

    /// Write the relay configuration to the store.
    ///
    /// Called after every change. An empty value clears the key rather than
    /// storing an empty string, so "unset" has exactly one representation.
    fn persist_relay_config(&self) -> Result<(), StoreError> {
        let write = |key: &str, value: Option<&str>| -> Result<(), StoreError> {
            match value {
                Some(value) if !value.is_empty() => self.store.set_setting(key, value),
                _ => self.store.clear_setting(key),
            }
        };
        write(Self::KEY_ENDPOINT, Some(self.upload_endpoint.as_str()))?;
        write(Self::KEY_TOKEN, self.upload_token.as_deref())?;
        write(Self::KEY_PIN, self.upload_pin.as_deref())?;
        self.store
            .set_setting(Self::KEY_INTERVAL, &self.upload_interval_ms.to_string())?;
        Ok(())
    }

    /// Load the relay configuration, if a previous run saved one.
    fn load_relay_config(&mut self) -> Result<(), StoreError> {
        if let Some(endpoint) = self.store.setting(Self::KEY_ENDPOINT)? {
            self.upload_endpoint = endpoint;
        }
        self.upload_token = self.store.setting(Self::KEY_TOKEN)?;
        self.upload_pin = self.store.setting(Self::KEY_PIN)?;
        if let Some(raw) = self.store.setting(Self::KEY_INTERVAL)? {
            if let Ok(interval) = raw.parse::<u64>() {
                self.upload_interval_ms = upload::schedule::clamp_interval_ms(interval);
            }
        }
        Ok(())
    }
}

/// The quiet-hours window, present only when the rule is on.
#[derive(Debug, Clone, Copy, Serialize)]
pub struct QuietWindow {
    pub start_hour: u8,
    pub end_hour: u8,
}

/// Snapshot the UI renders. Every field here is safe to display locally.
#[derive(Debug, Clone, Serialize)]
pub struct StatusSnapshot {
    pub shadow_mode: bool,
    pub collection_enabled: bool,
    pub capture_window_title: bool,
    pub upload_enabled: bool,
    /// Whether the engine's quiet-hours rule is currently applied.
    pub quiet_hours_enabled: bool,
    /// The window in effect, or `None` when quiet hours are off.
    pub quiet_hours_window: Option<QuietWindow>,
    pub data_level: DataLevel,
    pub sample_interval_ms: u64,
    pub sample_count: u64,
    pub decision_count: u64,
    pub last_sample: Option<SampleView>,
    pub last_decision: Option<DecisionView>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SampleView {
    pub observed_at_ms: u64,
    pub app: String,
    /// Always empty in the default configuration.
    pub window_title: String,
    pub idle_seconds: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct DecisionView {
    pub decision: interrupt::Decision,
    pub reasons: Vec<interrupt::ReasonCode>,
    pub score: u8,
}

fn to_decision_view(output: &DecisionOutput) -> DecisionView {
    DecisionView {
        decision: output.decision,
        reasons: output.reasons.clone(),
        score: output.score,
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Current wall-clock hour in UTC.
///
/// Phase 0 keeps this deliberately crude and explicit rather than pulling in a
/// timezone database: the decision function receives the hour as data, so the
/// timezone question is a single, visible place to fix later.
fn current_utc_hour() -> u8 {
    let seconds = now_ms() / 1000;
    ((seconds / 3600) % 24) as u8
}

/// Current local hour. Uses the OS offset rather than a tz database.
fn current_local_hour() -> u8 {
    // `GetLocalTime` is the cheapest correct-enough source on Windows and needs
    // no additional crate features beyond what is already enabled.
    #[cfg(windows)]
    {
        use windows::Win32::System::SystemInformation::GetLocalTime;
        // SAFETY: `GetLocalTime` returns a SYSTEMTIME by value and reads no
        // caller memory.
        unsafe {
            let st = GetLocalTime();
            return st.wHour as u8;
        }
    }
    #[allow(unreachable_code)]
    current_utc_hour()
}

#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum CommandError {
    Store { message: String },
    Export { reason: ExportError },
    Upload { reason: upload::UploadError },
}

impl From<StoreError> for CommandError {
    fn from(error: StoreError) -> Self {
        CommandError::Store {
            message: error.to_string(),
        }
    }
}

impl From<upload::UploadError> for CommandError {
    fn from(reason: upload::UploadError) -> Self {
        CommandError::Upload { reason }
    }
}

/// Upload configuration and queue depth, for the status surface.
#[derive(Debug, Clone, Serialize)]
pub struct UploadStatus {
    pub endpoint_configured: bool,
    pub endpoint: Option<String>,
    /// Whether a bearer token is set. The token itself is never returned.
    pub token_configured: bool,
    /// Whether a TLS certificate fingerprint is pinned. Required for https.
    pub certificate_pin_configured: bool,
    /// Background flush interval in milliseconds. Zero means scheduling is off.
    pub upload_interval_ms: u64,
    pub upload_enabled: bool,
    pub collection_enabled: bool,
    pub pending: u64,
    pub delivered: u64,
    pub failed: u64,
}

type CommandResult<T> = Result<T, CommandError>;

/// Take one sample, classify it, persist both, and return the decision.
///
/// This is the whole Phase 0 loop. Note it has no branch that notifies anyone:
/// the final statement is a struct return.
#[tauri::command]
fn poll_once(state: State<'_, Mutex<AppState>>) -> CommandResult<DecisionView> {
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    let timestamp = now_ms();

    let Some(sample) = sample_once(&app.collector_config, timestamp) else {
        // Collection disabled: nothing observed, nothing stored.
        return Ok(DecisionView {
            decision: interrupt::Decision::Silence,
            reasons: vec![interrupt::ReasonCode::IdleTooShort],
            score: 0,
        });
    };

    app.store.insert_sample(&app.collection_state, &sample)?;
    app.buffer.push(sample.clone());

    let input = DecisionInput {
        now_ms: timestamp,
        local_hour: current_local_hour(),
        idle_seconds: sample.idle_seconds,
        samples: app.buffer.samples().to_vec(),
        last_interrupt_age_ms: app
            .last_interrupt_at_ms
            .map(|at| timestamp.saturating_sub(at)),
        interrupts_today: app.interrupts_today,
        // A locked screen is never a moment worth interrupting. A failed probe
        // fails closed (treated as locked) so an API error cannot cause one.
        session_locked: collector::session::is_locked_or_unknown(),
        policy: app.policy.clone(),
    };

    let output = decide(&input);

    // In shadow mode a would-be interruption is *counted*, so the daily budget
    // and cooldown behave realistically, but it is never delivered.
    if output.decision == interrupt::Decision::Interrupt {
        app.last_interrupt_at_ms = Some(timestamp);
        app.interrupts_today += 1;
    }

    app.store.insert_decision(
        &app.collection_state,
        timestamp,
        output.decision,
        &output.reasons,
        output.score,
    )?;

    Ok(to_decision_view(&output))
}

/// Read the current status without changing anything.
#[tauri::command]
fn collector_status(state: State<'_, Mutex<AppState>>) -> CommandResult<StatusSnapshot> {
    let app = state.lock().unwrap_or_else(|e| e.into_inner());
    let samples = app.store.recent_samples(1)?;
    let decisions = app.store.recent_decisions(1)?;

    Ok(StatusSnapshot {
        shadow_mode: interrupt::SHADOW_MODE,
        collection_enabled: app.collection_state.enabled,
        capture_window_title: app.collection_state.capture_window_title,
        upload_enabled: app.collection_state.upload_enabled,
        quiet_hours_enabled: app.policy.quiet_hours_active(),
        quiet_hours_window: if app.policy.quiet_hours_active() {
            Some(QuietWindow {
                start_hour: app.policy.quiet_hour_start,
                end_hour: app.policy.quiet_hour_end,
            })
        } else {
            None
        },
        data_level: DataLevel::activity_sample_level(),
        sample_interval_ms: app.collector_config.sample_interval_ms,
        sample_count: app.store.sample_count()?,
        decision_count: app.store.decision_count()?,
        last_sample: samples.last().map(|s| SampleView {
            observed_at_ms: s.observed_at_ms,
            app: s.app.clone(),
            window_title: String::new(),
            idle_seconds: s.idle_seconds,
        }),
        last_decision: decisions.last().map(|d| DecisionView {
            decision: d.decision,
            reasons: d.reasons.clone(),
            score: d.score,
        }),
    })
}

/// Dry-run the decision engine against a hand-built input. Used by tests and by
/// the UI's "what would it say if…" panel; performs no collection.
#[tauri::command]
fn decision_preview(
    idle_seconds: u32,
    apps: Vec<String>,
    local_hour: u8,
    interrupts_today: u32,
) -> DecisionView {
    let timestamp = now_ms();
    const STEP_MS: u64 = 30_000;
    let count = apps.len().max(1) as u64;
    let samples: Vec<interrupt::ActivitySample> = apps
        .iter()
        .enumerate()
        .map(|(index, app)| interrupt::ActivitySample {
            observed_at_ms: timestamp.saturating_sub(STEP_MS * (count - 1 - index as u64)),
            app: app.clone(),
            idle_seconds,
        })
        .collect();

    let input = DecisionInput {
        now_ms: timestamp,
        local_hour,
        idle_seconds,
        samples,
        last_interrupt_age_ms: None,
        interrupts_today,
        // Unlike `poll_once`, this is a what-if tool: the caller supplies all
        // inputs and the session is assumed awake so the preview shows what the
        // engine would say about the activity shape alone.
        session_locked: false,
        policy: InterruptPolicy::default(),
    };
    to_decision_view(&decide(&input))
}

/// Build the sanitised projection. Refused unless the user opted in.
#[tauri::command]
fn export_sanitized(state: State<'_, Mutex<AppState>>) -> Result<SanitizedExport, CommandError> {
    let app = state.lock().unwrap_or_else(|e| e.into_inner());
    let samples = app.store.recent_samples(10_000)?;
    let decisions = app.store.recent_decisions(10_000)?;
    build_export(&app.collection_state, &samples, &decisions)
        .map_err(|reason| CommandError::Export { reason })
}

/// Flip the collection switches. Title capture and upload default to off.
#[tauri::command]
fn set_collection_state(
    state: State<'_, Mutex<AppState>>,
    enabled: Option<bool>,
    capture_window_title: Option<bool>,
    upload_enabled: Option<bool>,
    quiet_hours_enabled: Option<bool>,
) -> CommandResult<StatusSnapshot> {
    {
        let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(value) = enabled {
            app.collection_state.enabled = value;
        }
        if let Some(value) = capture_window_title {
            app.collection_state.capture_window_title = value;
            app.collector_config.capture_window_title = value;
        }
        if let Some(value) = upload_enabled {
            app.collection_state.upload_enabled = value;
        }
        if let Some(value) = quiet_hours_enabled {
            app.collection_state.quiet_hours_enabled = value;
            // The switch is applied to the policy immediately, so the next
            // sample reflects it without a restart.
            app.policy.set_quiet_hours(value);
        }
    }
    collector_status(state)
}

/// Erase the local shadow log.
#[tauri::command]
fn purge_local_data(state: State<'_, Mutex<AppState>>) -> CommandResult<()> {
    let app = state.lock().unwrap_or_else(|e| e.into_inner());
    app.store.purge()?;
    Ok(())
}

/// Configure the relay endpoint. An empty string clears it.
#[tauri::command]
fn set_upload_endpoint(
    state: State<'_, Mutex<AppState>>,
    endpoint: Option<String>,
    token: Option<String>,
    certificate_pin: Option<String>,
) -> CommandResult<UploadStatus> {
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(endpoint) = endpoint {
        let trimmed = endpoint.trim().to_string();
        // Reject a bad endpoint at configuration time rather than at send time,
        // so a misconfiguration cannot sit silently until the first upload.
        if !trimmed.is_empty() {
            upload::validate_endpoint(&trimmed)?;
        }
        app.upload_endpoint = trimmed;
    }
    if let Some(token) = token {
        let trimmed = token.trim().to_string();
        app.upload_token = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        };
    }
    if let Some(pin) = certificate_pin {
        let trimmed = pin.trim().to_string();
        if trimmed.is_empty() {
            app.upload_pin = None;
        } else {
            // Validate the format here so a typo is caught at configuration
            // time, not on the first upload attempt.
            let normalised = upload::cert::validate_pin(&trimmed)
                .map_err(|reason| upload::UploadError::Cert { reason })?;
            app.upload_pin = Some(normalised);
        }
    }
    // Persist. Without this the configuration lived only in memory and a
    // restart silently reverted it, while the queue counters - read from the
    // database - kept their values, so the panel looked half-configured.
    app.persist_relay_config()?;
    upload_status_inner(&app)
}

/// Current upload configuration and queue depth.
#[tauri::command]
fn upload_status(state: State<'_, Mutex<AppState>>) -> CommandResult<UploadStatus> {
    let app = state.lock().unwrap_or_else(|e| e.into_inner());
    upload_status_inner(&app)
}

fn upload_status_inner(app: &AppState) -> CommandResult<UploadStatus> {
    let (pending, delivered, failed) = app.store.upload_counts()?;
    Ok(UploadStatus {
        endpoint_configured: !app.upload_endpoint.is_empty(),
        endpoint: if app.upload_endpoint.is_empty() {
            None
        } else {
            Some(app.upload_endpoint.clone())
        },
        token_configured: app.upload_token.is_some(),
        certificate_pin_configured: app.upload_pin.is_some(),
        upload_interval_ms: app.upload_interval_ms,
        upload_enabled: app.collection_state.upload_enabled,
        collection_enabled: app.collection_state.enabled,
        pending,
        delivered,
        failed,
    })
}

/// Set or clear the background flush interval. Zero disables scheduling.
///
/// The value is clamped here rather than trusted from the caller: a zero-second
/// interval would hammer the relay, so the floor is one minute.
#[tauri::command]
fn set_upload_interval(
    state: State<'_, Mutex<AppState>>,
    interval_ms: u64,
) -> CommandResult<UploadStatus> {
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    app.upload_interval_ms = upload::schedule::clamp_interval_ms(interval_ms);
    app.persist_relay_config()?;
    upload_status_inner(&app)
}

/// Decide what a scheduling tick would do, without doing it.
///
/// Exposed so the UI can explain *why* nothing is being sent, which is the
/// difference between "silently not uploading" and "not uploading because the
/// endpoint is unset".
#[tauri::command]
fn upload_schedule_preview(state: State<'_, Mutex<AppState>>) -> CommandResult<TickPreview> {
    let app = state.lock().unwrap_or_else(|e| e.into_inner());
    let (pending, _, _) = app.store.upload_counts()?;
    let tick = upload::schedule::next_action(upload::schedule::TickInput {
        interval_ms: app.upload_interval_ms,
        collection_enabled: app.collection_state.enabled,
        upload_enabled: app.collection_state.upload_enabled,
        endpoint_configured: !app.upload_endpoint.is_empty(),
        pending,
    });
    Ok(match tick {
        upload::schedule::Tick::Flush => TickPreview {
            will_flush: true,
            reason: "flush".to_string(),
        },
        upload::schedule::Tick::Skip(reason) => TickPreview {
            will_flush: false,
            reason: format!("{reason:?}"),
        },
    })
}

/// What the next scheduling tick would do.
#[derive(Debug, Serialize)]
pub struct TickPreview {
    pub will_flush: bool,
    /// A `skip_reason` variant name, or `flush`.
    pub reason: String,
}

/// Build the current sanitised aggregate, enqueue it, then attempt delivery.
///
/// This is what the UI's single "upload now" button calls. The two steps stay
/// a single command because a user asking to send now does not want to be told
/// the queue is empty — that was the previous behaviour and it made the button
/// look broken.
#[tauri::command]
fn send_now(state: State<'_, Mutex<AppState>>, limit: Option<u32>) -> CommandResult<UploadStatus> {
    {
        let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
        // Reuse the same gates as an explicit enqueue, so a scheduled or manual
        // send cannot bypass them.
        enqueue_upload_inner(&mut app)?;
    }
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    flush_uploads_inner(&mut app, limit.unwrap_or(20))
}

/// Build the sanitised aggregate and enqueue it without sending.
#[tauri::command]
fn enqueue_upload_now(state: State<'_, Mutex<AppState>>) -> CommandResult<UploadStatus> {
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    enqueue_upload_inner(&mut app)
}

/// The enqueue half, shared by `send_now` and `enqueue_upload_now`.
fn enqueue_upload_inner(app: &mut AppState) -> CommandResult<UploadStatus> {
    if !app.collection_state.enabled {
        return Err(CommandError::Upload {
            reason: upload::UploadError::CollectionDisabled,
        });
    }
    if !app.collection_state.may_upload() {
        return Err(CommandError::Upload {
            reason: upload::UploadError::UploadDisabled,
        });
    }
    if app.upload_endpoint.is_empty() {
        return Err(CommandError::Upload {
            reason: upload::UploadError::EndpointNotConfigured,
        });
    }

    let samples = app.store.recent_samples(10_000)?;
    let decisions = app.store.recent_decisions(10_000)?;
    let export = store::sanitize::build_export(&app.collection_state, &samples, &decisions)
        .map_err(|reason| CommandError::Export { reason })?;

    let request = upload::payload::to_core_event(&export, &iso8601_utc(now_ms()));
    let (client_event_id, body) = upload::queue::to_queue_item(&request)?;

    app.store
        .enqueue_upload(&client_event_id, &body, now_ms() as i64)?;
    upload_status_inner(app)
}

/// Attempt delivery of everything currently due.
#[tauri::command]
fn flush_uploads(
    state: State<'_, Mutex<AppState>>,
    limit: Option<u32>,
) -> CommandResult<UploadStatus> {
    let mut app = state.lock().unwrap_or_else(|e| e.into_inner());
    flush_uploads_inner(&mut app, limit.unwrap_or(20))
}

/// The single delivery path, shared by the manual command and the scheduler.
///
/// Kept as one function on purpose: a scheduled flush must not be able to skip
/// a gate that a user-initiated flush honours.
fn flush_uploads_inner(app: &mut AppState, limit: u32) -> CommandResult<UploadStatus> {
    if !app.collection_state.enabled {
        return Err(CommandError::Upload {
            reason: upload::UploadError::CollectionDisabled,
        });
    }
    if !app.collection_state.may_upload() {
        return Err(CommandError::Upload {
            reason: upload::UploadError::UploadDisabled,
        });
    }
    upload::validate_endpoint(&app.upload_endpoint)
        .map_err(|reason| CommandError::Upload { reason })?;

    let now = now_ms() as i64;
    let due = app.store.due_uploads(now, limit)?;

    for item in due {
        match upload::client::post_json(
            &app.upload_endpoint,
            &item.body_json,
            app.upload_token.as_deref(),
            app.upload_pin.as_deref(),
        ) {
            Ok(response) if (200..300).contains(&response.status) => {
                app.store.mark_upload_delivered(item.id)?;
            }
            Ok(response) => {
                let error = upload::UploadError::HttpStatus {
                    status: response.status,
                    message: response.body.chars().take(200).collect(),
                };
                record_upload_failure(app, &item, &error, now)?;
            }
            Err(error) => {
                record_upload_failure(app, &item, &error, now)?;
            }
        }
    }

    upload_status_inner(app)
}

/// Apply the retry policy for one failure. Deliberately does not delete the
/// item: an exhausted upload stays visible as `failed`.
fn record_upload_failure(
    app: &AppState,
    item: &upload::queue::QueueItem,
    error: &upload::UploadError,
    now_ms: i64,
) -> Result<(), StoreError> {
    if !upload::queue::is_retryable(error) {
        // A permanent rejection: park immediately, do not burn attempts.
        app.store.mark_upload_failed(
            item.id,
            upload::queue::QueueItemState::Failed,
            item.attempts + 1,
            now_ms,
            &error.to_string(),
        )?;
        return Ok(());
    }
    let (state, attempts, next_at) = upload::queue::after_failure(item, now_ms, error);
    app.store
        .mark_upload_failed(item.id, state, attempts, next_at, &error.to_string())?;
    Ok(())
}

/// UTC ISO-8601 with milliseconds, matching the API's `coreIsoDateTimeSchema`.
fn iso8601_utc(ms: u64) -> String {
    let seconds = (ms / 1000) as i64;
    let millis = ms % 1000;
    let days = seconds.div_euclid(86_400);
    let time_of_day = seconds.rem_euclid(86_400);
    let (hour, minute, second) = (
        time_of_day / 3600,
        (time_of_day % 3600) / 60,
        time_of_day % 60,
    );
    let (year, month, day) = civil_from_days(days);
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

/// Days since the Unix epoch to a civil date (Howard Hinnant's algorithm).
fn civil_from_days(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

/// Background flush loop.
///
/// Ticks once a minute and re-reads the interval each time, so a change made in
/// the UI takes effect on the next tick without restarting anything. Every gate
/// is evaluated fresh per tick: the loop never caches "we are configured" and
/// therefore cannot keep uploading after the user turns it off.
fn spawn_upload_scheduler(handle: tauri::AppHandle) {
    use tauri::Manager;

    std::thread::spawn(move || {
        /// How often to re-evaluate. Independent of the flush interval so that
        /// shortening the interval in the UI is picked up promptly.
        const TICK_MS: u64 = 60_000;

        loop {
            std::thread::sleep(std::time::Duration::from_millis(TICK_MS));

            let decision = {
                let state = handle.state::<Mutex<AppState>>();
                let app = match state.lock() {
                    Ok(app) => app,
                    // A poisoned lock means another thread panicked while
                    // holding it. Sampling state is not worth taking the whole
                    // process down for, so skip this tick.
                    Err(_) => continue,
                };
                let pending = app.store.upload_counts().map(|c| c.0).unwrap_or(0);
                upload::schedule::next_action(upload::schedule::TickInput {
                    interval_ms: app.upload_interval_ms,
                    collection_enabled: app.collection_state.enabled,
                    upload_enabled: app.collection_state.upload_enabled,
                    endpoint_configured: !app.upload_endpoint.is_empty(),
                    pending,
                })
            };

            // Only an explicit Flush acts. Every Skip reason is a no-op, which
            // is what keeps a scheduled flush from ever inventing a destination.
            if decision != upload::schedule::Tick::Flush {
                continue;
            }

            let state = handle.state::<Mutex<AppState>>();
            let mut app = match state.lock() {
                Ok(app) => app,
                Err(_) => continue,
            };
            if let Err(error) = flush_uploads_inner(&mut app, 20) {
                // Not fatal: the item stays queued with a backoff, and the next
                // tick tries again. Logging keeps it diagnosable.
                eprintln!("comma-desktop: scheduled flush failed: {error:?}");
            }
        }
    });
}

/// Build the Phase 0 loop's command set.
pub fn build_app(store: LocalStore) -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::new(store)))
        .setup(|app| {
            spawn_upload_scheduler(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            poll_once,
            collector_status,
            decision_preview,
            export_sanitized,
            set_collection_state,
            purge_local_data,
            set_upload_endpoint,
            upload_status,
            set_upload_interval,
            upload_schedule_preview,
            enqueue_upload_now,
            send_now,
            flush_uploads
        ])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn local_hour_is_in_range() {
        assert!(current_local_hour() < 24);
    }

    #[test]
    fn utc_hour_is_in_range() {
        assert!(current_utc_hour() < 24);
    }

    #[test]
    fn now_ms_is_monotonic_enough() {
        let first = now_ms();
        let second = now_ms();
        assert!(second >= first);
        assert!(first > 1_600_000_000_000, "clock looks unset: {first}");
    }

    #[test]
    fn relay_config_survives_a_restart() {
        // The regression this guards: configuration lived only in AppState, so
        // reopening the app reverted the endpoint while the queue counters
        // (read from the database) stayed correct - a half-configured panel.
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("phase0.sqlite");

        {
            let mut state = AppState::new(LocalStore::open(&path).unwrap());
            state.upload_endpoint = "https://relay.example/v1/core/events".to_string();
            state.upload_token = Some("dev:alice:alice@example.com".to_string());
            state.upload_pin = Some("ab".repeat(32));
            state.upload_interval_ms = 300_000;
            state.persist_relay_config().unwrap();
        }

        let restored = AppState::new(LocalStore::open(&path).unwrap());
        assert_eq!(
            restored.upload_endpoint,
            "https://relay.example/v1/core/events"
        );
        assert_eq!(
            restored.upload_token.as_deref(),
            Some("dev:alice:alice@example.com")
        );
        assert_eq!(
            restored.upload_pin.as_deref(),
            Some("ab".repeat(32).as_str())
        );
        assert_eq!(restored.upload_interval_ms, 300_000);
    }

    #[test]
    fn clearing_relay_config_persists_as_unset() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("phase0.sqlite");

        {
            let mut state = AppState::new(LocalStore::open(&path).unwrap());
            state.upload_endpoint = "https://relay.example/x".to_string();
            state.persist_relay_config().unwrap();
            // Now clear it, as the UI does when a field is emptied.
            state.upload_endpoint = String::new();
            state.upload_token = None;
            state.upload_pin = None;
            state.persist_relay_config().unwrap();
        }

        let restored = AppState::new(LocalStore::open(&path).unwrap());
        assert!(
            restored.upload_endpoint.is_empty(),
            "a cleared endpoint must stay cleared"
        );
        assert!(restored.upload_token.is_none());
        assert!(restored.upload_pin.is_none());
    }

    #[test]
    fn a_fresh_database_starts_unconfigured() {
        let state = AppState::new(LocalStore::open_in_memory().unwrap());
        assert!(state.upload_endpoint.is_empty());
        assert!(state.upload_token.is_none());
        assert!(state.upload_pin.is_none());
        assert_eq!(state.upload_interval_ms, 0, "scheduling off by default");
    }

    #[test]
    fn a_corrupt_interval_does_not_break_startup() {
        // A hand-edited or truncated row must not stop the app from starting.
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("phase0.sqlite");
        {
            let store = LocalStore::open(&path).unwrap();
            store
                .set_setting(AppState::KEY_INTERVAL, "not-a-number")
                .unwrap();
        }
        let state = AppState::new(LocalStore::open(&path).unwrap());
        assert_eq!(state.upload_interval_ms, 0, "falls back to scheduling off");
    }
}
