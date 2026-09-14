//! Integration coverage for the fixture replayer.
//!
//! This drives the *entire shipped scenario file* through the engine. If a
//! threshold change in `decision.rs` alters any documented outcome, these tests
//! fail with the scenario id, the step index and both the expected and actual
//! classification — so a policy edit cannot silently change behaviour.

use comma_desktop::interrupt::fixture::{parse, replay_all, replay_scenario, FixtureDocument};

/// The shipped fixture file, resolved at compile time so the test does not
/// depend on the process working directory.
const SHIPPED: &str = include_str!("../fixtures/decision-scenarios.json");

fn document() -> FixtureDocument {
    parse(SHIPPED).expect("shipped decision fixtures must parse")
}

#[test]
fn every_shipped_scenario_replays_as_documented() {
    let failures = replay_all(&document());
    if !failures.is_empty() {
        let report = failures
            .iter()
            .map(|failure| failure.to_string())
            .collect::<Vec<_>>()
            .join("\n");
        panic!(
            "{} fixture step(s) did not match:\n{report}",
            failures.len()
        );
    }
}

#[test]
fn all_eight_documented_scenarios_are_present() {
    let document = document();
    let ids: Vec<&str> = document
        .scenarios
        .iter()
        .map(|scenario| scenario.id.as_str())
        .collect();
    for expected in [
        "deep-focus-then-pause",
        "continuous-typing",
        "long-absence",
        "switch-storm",
        "quiet-hours-across-midnight",
        "daily-budget-exhausted",
        "cooldown-then-recovery",
        "session-locked-then-unlocked",
    ] {
        assert!(ids.contains(&expected), "missing scenario {expected}");
    }
}

#[test]
fn replay_is_deterministic() {
    // Running twice must produce identical results; the engine reads no clock.
    let document = document();
    let first = replay_all(&document);
    let second = replay_all(&document);
    assert_eq!(first, second);
}

#[test]
fn replaying_a_single_scenario_matches_the_full_run() {
    let document = document();
    for scenario in &document.scenarios {
        let isolated = replay_scenario(scenario);
        assert!(
            isolated.is_empty(),
            "scenario {} failed in isolation: {isolated:?}",
            scenario.id
        );
    }
}

#[test]
fn focus_actually_accumulates_over_the_timeline() {
    // The replayer must not be a no-op: the first step of the deep-focus
    // scenario is blocked by brief focus and a later step is not.
    let document = document();
    let scenario = document
        .scenarios
        .iter()
        .find(|scenario| scenario.id == "deep-focus-then-pause")
        .expect("scenario present");

    assert_eq!(scenario.steps.first().unwrap().expect.decision, "defer");
    assert_eq!(scenario.steps.last().unwrap().expect.decision, "interrupt");
}

#[test]
fn daily_budget_scenario_exhausts_the_budget() {
    // With a budget of 1, the first interrupt consumes it and every later step
    // must be *silenced* by the budget rather than merely deferred.
    let document = document();
    let scenario = document
        .scenarios
        .iter()
        .find(|scenario| scenario.id == "daily-budget-exhausted")
        .expect("scenario present");

    assert_eq!(scenario.policy.daily_budget, 1);

    let interrupts = scenario
        .steps
        .iter()
        .filter(|step| step.expect.decision == "interrupt")
        .count();
    assert_eq!(interrupts, 1, "a budget of 1 allows exactly one interrupt");

    // Every step after the first must be silent for the budget reason.
    for step in scenario.steps.iter().skip(1) {
        assert_eq!(step.expect.decision, "silence");
        assert!(
            step.expect
                .reasons
                .contains(&"daily_budget_exhausted".to_string()),
            "later steps must be blocked by budget exhaustion, got {:?}",
            step.expect.reasons
        );
    }
}

#[test]
fn locked_session_scenario_toggles_back_to_unlocked() {
    let document = document();
    let scenario = document
        .scenarios
        .iter()
        .find(|scenario| scenario.id == "session-locked-then-unlocked")
        .expect("scenario present");

    let locked = scenario
        .steps
        .iter()
        .filter(|step| step.session_locked)
        .count();
    assert_eq!(locked, 2, "expected two locked steps");
    // Locked steps must be silent, and the final unlocked step eligible.
    for step in scenario.steps.iter().filter(|step| step.session_locked) {
        assert_eq!(step.expect.decision, "silence");
    }
    assert_eq!(scenario.steps.last().unwrap().expect.decision, "interrupt");
    assert!(!scenario.steps.last().unwrap().session_locked);
}

#[test]
fn a_mutated_threshold_is_detected_by_the_replay() {
    // Proves the replay is actually sensitive to policy, not vacuously green:
    // tightening the focus requirement must break the deep-focus scenario.
    let mut document = document();
    let scenario = document
        .scenarios
        .iter_mut()
        .find(|scenario| scenario.id == "deep-focus-then-pause")
        .expect("scenario present");
    // Demand 10 hours of focus; the 10-minute timeline can never satisfy it.
    scenario.policy.min_focus_ms = 10 * 60 * 60 * 1000;

    let failures = replay_scenario(scenario);
    assert!(
        !failures.is_empty(),
        "an unsatisfiable policy must produce a failure, not a pass"
    );
}
