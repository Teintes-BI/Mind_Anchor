//! Interruption decision engine — Phase 0.
//!
//! This module is deliberately **pure**: it performs no I/O, spawns no threads,
//! reads no global clock and touches no OS API. Every input, including "now",
//! arrives through [`DecisionInput`]. That makes the whole "is it worth
//! interrupting?" question reproducible in a plain `cargo test` run.
//!
//! Shadow-mode guarantee: this module only ever *classifies*. It has no code
//! path that sends a notification, plays a sound, moves a window or opens a
//! socket. Returning [`Decision::Interrupt`] means "this would have been a
//! reasonable moment", not "interrupt the user now".

use serde::{Deserialize, Serialize};

/// A single observation of desktop activity.
///
/// NOTE: there is intentionally **no** keystroke, key-content, text or
/// clipboard field on this struct. Phase 0 records *counts and timing only*.
/// Because the field does not exist, no code can persist what was typed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ActivitySample {
    /// Milliseconds since the Unix epoch, UTC.
    pub observed_at_ms: u64,
    /// Foreground process name, e.g. `Code`. Empty when unavailable.
    /// Never a window title unless title capture is explicitly enabled.
    pub app: String,
    /// Seconds since the last user input, as reported by the OS.
    pub idle_seconds: u32,
}

/// Tunable thresholds for the decision. Kept as data so tests can pin them.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InterruptPolicy {
    /// Do not consider interrupting if the user went idle at all recently.
    pub max_idle_seconds: u32,
    /// ...but if the user has been away long enough, the moment has passed.
    pub away_idle_seconds: u32,
    /// Minimum length of the current uninterrupted focus stretch.
    pub min_focus_ms: u64,
    /// More distinct app switches than this inside the lookback window means
    /// the user is still thrashing between tasks.
    pub max_switches_in_window: u32,
    /// Length of the app-switch lookback window.
    pub switch_window_ms: u64,
    /// Local-time hour (inclusive) at which quiet hours begin.
    pub quiet_hour_start: u8,
    /// Local-time hour (exclusive) at which quiet hours end.
    pub quiet_hour_end: u8,
    /// Maximum number of interruptions allowed per local day.
    pub daily_budget: u32,
}

impl Default for InterruptPolicy {
    fn default() -> Self {
        Self {
            max_idle_seconds: 30,
            away_idle_seconds: 15 * 60,
            min_focus_ms: 5 * 60 * 1000,
            max_switches_in_window: 8,
            switch_window_ms: 10 * 60 * 1000,
            quiet_hour_start: 22,
            quiet_hour_end: 8,
            daily_budget: 3,
        }
    }
}

/// Why the decision came out the way it did. Every reason is enumerable so
/// tests can assert on it, and so the UI can explain itself to the user.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReasonCode {
    /// The user is actively typing/moving the mouse; interrupting now would
    /// land on top of real work.
    IdleTooShort,
    /// The user has been away long enough that an in-the-moment nudge is
    /// pointless; it will be re-evaluated when they return.
    IdleTooLong,
    /// Focus stretch is shorter than the minimum, so we do not yet have
    /// evidence the user is settled into one thing.
    FocusTooBrief,
    /// Too many app switches in the window: the user is mid task-switch.
    SwitchStorm,
    /// Current local hour is inside quiet hours.
    OutsideQuietHours,
    /// The per-day interruption budget is used up.
    DailyBudgetExhausted,
    /// A previous interruption is still inside its cooldown.
    CooldownActive,
    /// No suppression rule fired. This does not mean "interrupt"; it means
    /// "nothing is blocking a low-frequency, low-cost window".
    Eligible,
}

/// The classification outcome.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Decision {
    /// A reasonable moment by policy. In shadow mode this is recorded only.
    Interrupt,
    /// Not now, but the situation may ripen; re-evaluate later.
    Defer,
    /// Actively do not disturb — the user is working or asleep.
    Silence,
}

/// Everything the decision depends on. Constructing this is the caller's job,
/// including the current time, which keeps the function deterministic.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecisionInput {
    /// Current time in milliseconds since the Unix epoch, UTC.
    pub now_ms: u64,
    /// Current local hour, 0-23, supplied by the caller (no timezone DB here).
    pub local_hour: u8,
    /// Seconds since last user input right now.
    pub idle_seconds: u32,
    /// Recent activity samples, oldest first. The most recent sample's
    /// `observed_at_ms` anchors the focus window.
    pub samples: Vec<ActivitySample>,
    /// Milliseconds since the last interruption, if there was one.
    pub last_interrupt_age_ms: Option<u64>,
    /// Interruptions already spent today.
    pub interrupts_today: u32,
    /// `true` when the user had disabled collection or the OS reported the
    /// session locked. A locked screen is never a good moment.
    pub session_locked: bool,
    pub policy: InterruptPolicy,
}

/// The result: a decision plus the ordered reasons that produced it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecisionOutput {
    pub decision: Decision,
    /// All reasons that applied, sorted and deduplicated. Always non-empty:
    /// an unblocked evaluation carries exactly [`ReasonCode::Eligible`].
    pub reasons: Vec<ReasonCode>,
    /// A coarse 0-100 confidence that the moment is low-cost. Shown in the
    /// shadow UI so the user can see the engine's own uncertainty.
    pub score: u8,
}

const COOLDOWN_MS: u64 = 20 * 60 * 1000;

/// Classify whether this is a reasonable moment for a low-frequency nudge.
///
/// The ordering of checks matters and is part of the contract:
/// a locked session silences first, then quiet hours, then budget/cooldown,
/// then the activity-shape checks. The first group *silences*, the second
/// group only *defers*.
pub fn decide(input: &DecisionInput) -> DecisionOutput {
    let policy = &input.policy;

    // --- Hard suppression: do not disturb at all. ---
    if input.session_locked {
        return silence(vec![ReasonCode::IdleTooLong]);
    }
    if is_quiet_hour(input.local_hour, policy) {
        return silence(vec![ReasonCode::OutsideQuietHours]);
    }
    if input.interrupts_today >= policy.daily_budget {
        return silence(vec![ReasonCode::DailyBudgetExhausted]);
    }

    // --- Soft deferral: a moment might come, just not this one. ---
    let mut reasons = Vec::new();

    if let Some(age) = input.last_interrupt_age_ms {
        if age < COOLDOWN_MS {
            reasons.push(ReasonCode::CooldownActive);
        }
    }
    if input.idle_seconds <= policy.max_idle_seconds {
        reasons.push(ReasonCode::IdleTooShort);
    }
    if input.idle_seconds >= policy.away_idle_seconds {
        reasons.push(ReasonCode::IdleTooLong);
    }
    if focus_ms(input) < policy.min_focus_ms {
        reasons.push(ReasonCode::FocusTooBrief);
    }
    if switch_count(input) > policy.max_switches_in_window {
        reasons.push(ReasonCode::SwitchStorm);
    }

    if reasons.is_empty() {
        return DecisionOutput {
            decision: Decision::Interrupt,
            reasons: vec![ReasonCode::Eligible],
            score: 100,
        };
    }

    reasons.sort();
    reasons.dedup();
    DecisionOutput {
        decision: Decision::Defer,
        score: score_for(&reasons),
        reasons,
    }
}

fn silence(reasons: Vec<ReasonCode>) -> DecisionOutput {
    DecisionOutput {
        decision: Decision::Silence,
        reasons,
        score: 0,
    }
}

fn is_quiet_hour(hour: u8, policy: &InterruptPolicy) -> bool {
    let start = policy.quiet_hour_start;
    let end = policy.quiet_hour_end;
    if start == end {
        return false;
    }
    if start < end {
        hour >= start && hour < end
    } else {
        // Window wraps past midnight, e.g. 22 -> 8.
        hour >= start || hour < end
    }
}

/// Length of the current focus stretch.
///
/// Focus is the span from the *oldest* sample of the current unbroken run of
/// the same foreground app up to `now`. Anchoring on the newest sample would be
/// wrong: the newest sample is at most one polling interval old, so focus would
/// always look like a single interval and the engine could never conclude the
/// user had settled.
fn focus_ms(input: &DecisionInput) -> u64 {
    let Some(latest) = input.samples.last() else {
        return 0;
    };
    if latest.app.is_empty() {
        return 0;
    }
    // Walk backwards while the foreground app stays the same.
    let mut start = latest.observed_at_ms;
    for sample in input.samples.iter().rev() {
        if sample.app != latest.app {
            break;
        }
        start = sample.observed_at_ms;
    }
    input.now_ms.saturating_sub(start)
}

/// Count of foreground-app changes inside the switch lookback window.
fn switch_count(input: &DecisionInput) -> u32 {
    let cutoff = input.now_ms.saturating_sub(input.policy.switch_window_ms);
    let mut count = 0u32;
    let mut previous: Option<&str> = None;
    for sample in input.samples.iter().filter(|s| s.observed_at_ms >= cutoff) {
        if let Some(prev) = previous {
            if !sample.app.is_empty() && sample.app.as_str() != prev {
                count += 1;
            }
        }
        if !sample.app.is_empty() {
            previous = Some(sample.app.as_str());
        }
    }
    count
}

/// Coarse confidence: each blocking reason costs some headroom. This is a
/// presentation aid, not a probability, and must not gate any behaviour.
fn score_for(reasons: &[ReasonCode]) -> u8 {
    let penalty = 15u32 * reasons.len() as u32;
    100u32.saturating_sub(penalty).min(85) as u8
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

    /// A settled user: a long unbroken run on one app, few switches, idle just
    /// above the active threshold, midday, budget free, no recent interruption.
    ///
    /// The samples start 9 minutes ago and stay on `Code`, so the focus stretch
    /// comfortably exceeds the 5-minute minimum.
    fn settled_input() -> DecisionInput {
        let now = 1_000_000_000u64;
        DecisionInput {
            now_ms: now,
            local_hour: 14,
            idle_seconds: 45,
            samples: vec![
                sample(now - 9 * 60 * 1000, "Code", 45),
                sample(now - 6 * 60 * 1000, "Code", 45),
                sample(now - 3 * 60 * 1000, "Code", 45),
                sample(now - 30 * 1000, "Code", 45),
            ],
            last_interrupt_age_ms: None,
            interrupts_today: 0,
            session_locked: false,
            policy: InterruptPolicy::default(),
        }
    }

    #[test]
    fn settled_user_is_eligible() {
        let out = decide(&settled_input());
        assert_eq!(out.decision, Decision::Interrupt);
        assert_eq!(out.reasons, vec![ReasonCode::Eligible]);
        assert_eq!(out.score, 100);
    }

    #[test]
    fn active_typing_defers() {
        let mut input = settled_input();
        input.idle_seconds = 3;
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::IdleTooShort));
    }

    #[test]
    fn long_absence_defers_rather_than_silences() {
        let mut input = settled_input();
        input.idle_seconds = 30 * 60;
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::IdleTooLong));
    }

    #[test]
    fn brief_focus_defers() {
        let mut input = settled_input();
        // A recent switch: the current app has only been foreground for 1 min.
        input.samples = vec![
            sample(input.now_ms - 5 * 60 * 1000, "Chrome", 45),
            sample(input.now_ms - 60 * 1000, "Code", 45),
            sample(input.now_ms - 30 * 1000, "Code", 45),
        ];
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::FocusTooBrief));
    }

    #[test]
    fn focus_is_measured_from_the_start_of_the_current_run() {
        // Four samples on the same app spanning 20 minutes => focus 20 min.
        let now = 1_000_000_000u64;
        let long_run = DecisionInput {
            samples: vec![
                sample(now - 20 * 60 * 1000, "Code", 45),
                sample(now - 10 * 60 * 1000, "Code", 45),
                sample(now - 2 * 60 * 1000, "Code", 45),
            ],
            ..settled_input()
        };
        assert_eq!(focus_ms(&long_run), 20 * 60 * 1000);
        assert_eq!(decide(&long_run).decision, Decision::Interrupt);
    }

    #[test]
    fn focus_restarts_after_an_app_switch() {
        let now = 1_000_000_000u64;
        // Long run on Code, but the newest samples are Chrome: focus is short.
        let switched = DecisionInput {
            samples: vec![
                sample(now - 30 * 60 * 1000, "Code", 45),
                sample(now - 5 * 60 * 1000, "Chrome", 45),
                sample(now - 60 * 1000, "Chrome", 45),
            ],
            ..settled_input()
        };
        assert_eq!(focus_ms(&switched), 5 * 60 * 1000);
    }

    #[test]
    fn switch_storm_defers() {
        let mut input = settled_input();
        input.samples = vec![
            sample(input.now_ms - 9 * 60 * 1000, "Code", 45),
            sample(input.now_ms - 8 * 60 * 1000, "Chrome", 45),
            sample(input.now_ms - 7 * 60 * 1000, "Slack", 45),
            sample(input.now_ms - 6 * 60 * 1000, "Code", 45),
            sample(input.now_ms - 5 * 60 * 1000, "Terminal", 45),
            sample(input.now_ms - 4 * 60 * 1000, "Chrome", 45),
            sample(input.now_ms - 3 * 60 * 1000, "Finder", 45),
            sample(input.now_ms - 2 * 60 * 1000, "Slack", 45),
            sample(input.now_ms - 60 * 1000, "Code", 45),
            sample(input.now_ms, "Chrome", 45),
        ];
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::SwitchStorm));
    }

    #[test]
    fn quiet_hours_silence_across_midnight() {
        let mut input = settled_input();
        input.local_hour = 23;
        assert_eq!(decide(&input).decision, Decision::Silence);
        input.local_hour = 3;
        assert_eq!(decide(&input).decision, Decision::Silence);
        input.local_hour = 7;
        assert_eq!(decide(&input).decision, Decision::Silence);
        // 8 is the exclusive end, so 8 is awake again.
        input.local_hour = 8;
        assert_eq!(decide(&input).decision, Decision::Interrupt);
    }

    #[test]
    fn budget_exhaustion_silences() {
        let mut input = settled_input();
        input.interrupts_today = 3;
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Silence);
        assert_eq!(out.reasons, vec![ReasonCode::DailyBudgetExhausted]);
    }

    #[test]
    fn locked_session_silences() {
        let mut input = settled_input();
        input.session_locked = true;
        assert_eq!(decide(&input).decision, Decision::Silence);
    }

    #[test]
    fn cooldown_defers() {
        let mut input = settled_input();
        input.last_interrupt_age_ms = Some(60 * 1000);
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::CooldownActive));
    }

    #[test]
    fn reasons_are_sorted_and_deduplicated() {
        let mut input = settled_input();
        input.idle_seconds = 3;
        input.samples = vec![sample(input.now_ms - 1000, "Code", 3)];
        input.last_interrupt_age_ms = Some(1000);
        let out = decide(&input);
        let mut expected = out.reasons.clone();
        expected.sort();
        expected.dedup();
        assert_eq!(out.reasons, expected);
        assert!(out.reasons.len() >= 2);
    }

    #[test]
    fn score_never_exceeds_85_when_blocked() {
        let mut input = settled_input();
        input.idle_seconds = 3;
        assert!(decide(&input).score <= 85);
    }

    #[test]
    fn empty_samples_is_deterministic_and_defers() {
        let mut input = settled_input();
        input.samples = vec![];
        let out = decide(&input);
        assert_eq!(out.decision, Decision::Defer);
        assert!(out.reasons.contains(&ReasonCode::FocusTooBrief));
    }

    #[test]
    fn decision_is_pure_over_repeated_calls() {
        let input = settled_input();
        let a = decide(&input);
        let b = decide(&input);
        assert_eq!(a, b);
    }
}
