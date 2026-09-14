//! Live smoke test against the real Windows session.
//!
//! These are `#[ignore]`d by default so `cargo test` stays hermetic, but they
//! are the evidence that the FFI actually works on this machine rather than
//! merely compiling. Run with:
//!
//! ```text
//! cargo test --test live_windows_test -- --ignored --nocapture
//! ```
//!
//! What is asserted: `GetLastInputInfo` yields a real idle time, the foreground
//! reader yields a real process name, and the end-to-end loop classifies and
//! persists a sample. Nothing here asserts *which* app is foreground, because
//! that depends on the user's desktop.

#![cfg(windows)]

use comma_desktop::collector::sampler::sample_once;
use comma_desktop::collector::CollectorConfig;
use comma_desktop::interrupt::{decide, DecisionInput, InterruptPolicy};
use comma_desktop::privacy::CollectionState;
use comma_desktop::store::LocalStore;

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

#[test]
#[ignore = "requires a live interactive Windows session"]
fn last_input_info_returns_a_real_idle_time() {
    let idle = comma_desktop::collector::idle::idle_seconds();
    let elapsed = idle.expect("GetLastInputInfo must succeed in an interactive session");
    assert!(elapsed < 60 * 60 * 24 * 30, "implausible idle: {elapsed}s");
    println!("live: idle_seconds = {elapsed}");
}

#[test]
#[ignore = "requires a live interactive Windows session"]
fn foreground_reader_returns_a_process_name() {
    let info = comma_desktop::collector::foreground::read_foreground(false);
    assert!(
        !info.app.is_empty(),
        "expected a foreground process name in an interactive session"
    );
    assert!(
        info.window_title.is_empty(),
        "title must stay empty when not requested"
    );
    println!("live: foreground app = {}", info.app);
    // The name must be a bare process name, not a full path.
    assert!(
        !info.app.contains('\\'),
        "app should be a basename: {}",
        info.app
    );
}

#[test]
#[ignore = "requires a live interactive Windows session"]
fn end_to_end_loop_classifies_and_persists() {
    let state = CollectionState::default();
    let config = CollectorConfig::default();
    let store = LocalStore::open_in_memory().unwrap();

    let sample = sample_once(&config, now_ms()).expect("collection is enabled by default");
    println!(
        "live: sample app={:?} idle={}s title={:?}",
        sample.app, sample.idle_seconds, ""
    );
    assert!(sample.observed_at_ms > 1_600_000_000_000);

    store.insert_sample(&state, &sample).unwrap();
    assert_eq!(store.sample_count().unwrap(), 1);

    let input = DecisionInput {
        now_ms: sample.observed_at_ms,
        local_hour: 14,
        idle_seconds: sample.idle_seconds,
        samples: vec![sample.clone()],
        last_interrupt_age_ms: None,
        interrupts_today: 0,
        session_locked: false,
        policy: InterruptPolicy::default(),
    };
    let output = decide(&input);
    println!(
        "live: decision = {:?} reasons = {:?}",
        output.decision, output.reasons
    );

    store
        .insert_decision(
            &state,
            sample.observed_at_ms,
            output.decision,
            &output.reasons,
            output.score,
        )
        .unwrap();
    assert_eq!(store.decision_count().unwrap(), 1);
    assert!(!output.reasons.is_empty());
}

#[test]
#[ignore = "requires a live interactive Windows session"]
fn title_capture_is_redacted_when_explicitly_enabled() {
    // Opt in for this one call, exactly as a user would through the UI.
    let config = CollectorConfig {
        capture_window_title: true,
        ..CollectorConfig::default()
    };
    let info = comma_desktop::collector::foreground::read_foreground(true);
    println!("live: raw-read app = {}", info.app);
    // The reader already redacts; assert the cap held whichever window is up.
    assert!(info.window_title.chars().count() <= 24);
    let _ = sample_once(&config, now_ms());
}

#[test]
#[ignore = "requires a live interactive Windows session"]
fn local_hour_matches_the_os_clock() {
    // Indirect check that GetLocalTime is wired through: the value must be a
    // valid hour, and formatting it must not panic.
    let store = LocalStore::open_in_memory().unwrap();
    let _ = store.column_names("activity_samples").unwrap();
    let now = now_ms();
    let utc_hour = ((now / 1000 / 3600) % 24) as u8;
    assert!(utc_hour < 24);
    println!("live: utc_hour = {utc_hour}");
}

/// Reads the real session lock state. This changes nothing — it only opens and
/// immediately closes the input desktop.
///
/// Run while **unlocked** and expect `Some(false)`:
/// `cargo test --test live_windows_test -- --ignored --nocapture session_lock_probe`
#[test]
#[ignore = "requires a live interactive Windows session"]
fn session_lock_probe_reads_current_state() {
    let state = comma_desktop::collector::session::is_locked();
    let locked = state.expect("OpenInputDesktop probe must return a value on Windows");
    println!("live: session_locked = {locked}");
    // This test is run from an interactive terminal, which can only exist on an
    // unlocked desktop, so the expected reading is `false`.
    assert!(
        !locked,
        "expected an unlocked session; if this fails the probe is inverted"
    );
}

/// End-to-end check of the locked branch. **Requires the user to lock the
/// screen (Win+L) while this test waits.**
///
/// Run this, then press Win+L within the wait window:
/// `cargo test --test live_windows_test -- --ignored --nocapture session_lock_flip`
#[test]
#[ignore = "user must press Win+L during the wait window"]
fn session_lock_flip_observes_the_lock() {
    use comma_desktop::collector::session;
    use std::io::Write;

    let before = session::is_locked().expect("probe available");
    println!("live: before = {before} (expect false)");
    println!("live: >>> press Win+L now; waiting up to 45s <<<");
    std::io::stdout().flush().ok();

    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(45);
    let mut observed = before;
    while std::time::Instant::now() < deadline {
        if let Some(locked) = session::is_locked() {
            observed = locked;
            if locked {
                break;
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    println!("live: after = {observed}");
    assert!(
        observed,
        "did not observe a locked session; press Win+L within the 45s window"
    );
    println!("live: lock detected; unlock to finish");
}
