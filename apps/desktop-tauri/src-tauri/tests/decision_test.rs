//! Integration coverage for the decision engine.
//!
//! These exercise the engine through its public API only, the way the app does,
//! and assert the shadow-mode contract: classification is pure, deterministic,
//! and every outcome carries an explainable reason.

use comma_desktop::interrupt::{
    decide, ActivitySample, Decision, DecisionInput, InterruptPolicy, ReasonCode,
};

fn sample(at: u64, app: &str, idle: u32) -> ActivitySample {
    ActivitySample {
        observed_at_ms: at,
        app: app.to_string(),
        idle_seconds: idle,
    }
}

fn base() -> DecisionInput {
    let now = 1_700_000_000_000u64;
    DecisionInput {
        now_ms: now,
        local_hour: 14,
        idle_seconds: 60,
        // A settled run on one app for the last 15 minutes, sampled every 5.
        samples: vec![
            sample(now - 15 * 60 * 1000, "Code", 60),
            sample(now - 10 * 60 * 1000, "Code", 60),
            sample(now - 5 * 60 * 1000, "Code", 60),
            sample(now - 30 * 1000, "Code", 60),
        ],
        last_interrupt_age_ms: None,
        interrupts_today: 0,
        session_locked: false,
        policy: InterruptPolicy::default(),
    }
}

#[test]
fn eligible_when_user_is_settled() {
    let output = decide(&base());
    assert_eq!(output.decision, Decision::Interrupt);
    assert_eq!(output.reasons, vec![ReasonCode::Eligible]);
}

#[test]
fn every_reason_code_is_reachable() {
    // Guards against a reason code that can never fire, which would make the
    // UI's explanation table silently wrong.
    let mut reached = std::collections::BTreeSet::new();

    // The unblocked case must yield Eligible.
    reached.extend(decide(&base()).reasons);

    let mut active = base();
    active.idle_seconds = 2;
    reached.extend(decide(&active).reasons);

    let mut away = base();
    away.idle_seconds = 60 * 60;
    reached.extend(decide(&away).reasons);

    let mut brief = base();
    brief.samples = vec![
        sample(brief.now_ms - 60 * 1000, "Chrome", 60),
        sample(brief.now_ms - 30 * 1000, "Chrome", 60),
    ];
    reached.extend(decide(&brief).reasons);

    let mut storm = base();
    storm.samples = (0..12)
        .map(|i| {
            let app = if i % 2 == 0 { "Code" } else { "Chrome" };
            sample(storm.now_ms - (12 - i) * 20_000, app, 60)
        })
        .collect();
    reached.extend(decide(&storm).reasons);

    let mut quiet = base();
    quiet.local_hour = 23;
    reached.extend(decide(&quiet).reasons);

    let mut budget = base();
    budget.interrupts_today = 99;
    reached.extend(decide(&budget).reasons);

    let mut cooldown = base();
    cooldown.last_interrupt_age_ms = Some(1000);
    reached.extend(decide(&cooldown).reasons);

    for reason in [
        ReasonCode::IdleTooShort,
        ReasonCode::IdleTooLong,
        ReasonCode::FocusTooBrief,
        ReasonCode::SwitchStorm,
        ReasonCode::OutsideQuietHours,
        ReasonCode::DailyBudgetExhausted,
        ReasonCode::CooldownActive,
        ReasonCode::Eligible,
    ] {
        assert!(reached.contains(&reason), "reason never fires: {reason:?}");
    }
}

#[test]
fn silence_is_reserved_for_hard_suppression() {
    // Activity-shape problems must never silence; they defer. Only lock, quiet
    // hours and budget exhaustion silence.
    for mutate in [
        |input: &mut DecisionInput| input.idle_seconds = 1,
        |input: &mut DecisionInput| input.idle_seconds = 99 * 60,
        |input: &mut DecisionInput| input.last_interrupt_age_ms = Some(1),
    ] {
        let mut input = base();
        mutate(&mut input);
        assert_eq!(
            decide(&input).decision,
            Decision::Defer,
            "soft reasons must defer, not silence"
        );
    }
}

#[test]
fn decision_output_always_explains_itself() {
    let inputs = {
        let mut list = vec![base()];
        let mut quiet = base();
        quiet.local_hour = 2;
        list.push(quiet);
        let mut locked = base();
        locked.session_locked = true;
        list.push(locked);
        let mut empty = base();
        empty.samples = vec![];
        list.push(empty);
        list
    };

    for input in inputs {
        let output = decide(&input);
        assert!(
            !output.reasons.is_empty(),
            "a decision without reasons cannot be shown to the user"
        );
        assert!(output.score <= 100);
    }
}

#[test]
fn policy_thresholds_are_honoured() {
    let mut input = base();
    input.policy.min_focus_ms = 60 * 60 * 1000; // require a full hour of focus
    let output = decide(&input);
    assert_eq!(output.decision, Decision::Defer);
    assert!(output.reasons.contains(&ReasonCode::FocusTooBrief));
}

#[test]
fn quiet_hour_window_is_configurable() {
    let mut input = base();
    input.policy.quiet_hour_start = 9;
    input.policy.quiet_hour_end = 17;
    input.local_hour = 12;
    assert_eq!(decide(&input).decision, Decision::Silence);

    input.local_hour = 18;
    assert_eq!(decide(&input).decision, Decision::Interrupt);
}

#[test]
fn equal_quiet_bounds_disable_quiet_hours() {
    let mut input = base();
    input.policy.quiet_hour_start = 0;
    input.policy.quiet_hour_end = 0;
    input.local_hour = 3;
    assert_eq!(decide(&input).decision, Decision::Interrupt);
}

#[test]
fn now_before_last_sample_does_not_panic_or_underflow() {
    // A clock going backwards must not panic. With `saturating_sub` the focus
    // span collapses to zero, which is treated as "not yet focused".
    let mut input = base();
    input.now_ms = 0;
    let output = decide(&input);
    assert!(
        matches!(output.decision, Decision::Defer | Decision::Silence),
        "a backwards clock must not produce an eligible moment"
    );
}

#[test]
fn zero_budget_silences_immediately() {
    let mut input = base();
    input.policy.daily_budget = 0;
    assert_eq!(decide(&input).decision, Decision::Silence);
}
