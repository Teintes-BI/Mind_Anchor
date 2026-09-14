//! Fixture replay for the interruption decision engine.
//!
//! The scenarios live in `fixtures/decision-scenarios.json` as data, so the
//! thresholds and expected outcomes can be retuned without editing Rust. This
//! module turns a scenario into a sequence of [`DecisionInput`] values and
//! checks each classification.
//!
//! Why a replayer rather than more unit tests: the interesting failures are
//! *cross-step*. A single call to [`decide`] cannot demonstrate that focus
//! accumulates, that a cooldown expires, that the daily budget decrements, or
//! that a locked screen suppresses and then releases. Those need a timeline.
//!
//! State the replayer carries between steps (mirroring what the app keeps):
//!
//! * `interrupts_today` — incremented on each `Interrupt`, so budget exhaustion
//!   is reachable.
//! * `last_interrupt_age_ms` — set on each `Interrupt`, so cooldown engages.
//! * the accumulated sample history, so focus and switch counts can be derived.
//!
//! The replayer is deterministic: it reads no clock and performs no I/O beyond
//! the caller-supplied JSON text.

use serde::{Deserialize, Serialize};

use super::decision::{
    decide, ActivitySample, Decision, DecisionInput, DecisionOutput, InterruptPolicy, ReasonCode,
};

/// Top-level fixture document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixtureDocument {
    pub schema: String,
    #[serde(default)]
    pub description: String,
    pub scenarios: Vec<Scenario>,
}

/// One replayable timeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub id: String,
    #[serde(default)]
    pub description: String,
    pub policy: InterruptPolicy,
    pub steps: Vec<Step>,
}

/// One observation plus what the engine is expected to conclude from it.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Step {
    /// Milliseconds since the scenario start. Becomes the sample timestamp.
    pub at_ms: u64,
    pub app: String,
    pub idle_seconds: u32,
    /// Local hour, injected because the engine never reads a clock.
    pub local_hour: u8,
    /// Session lock state. Defaults to unlocked.
    #[serde(default)]
    pub session_locked: bool,
    pub expect: Expectation,
}

/// The assertion attached to a step.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expectation {
    pub decision: String,
    /// Exact match: the reasons must equal this list *after* the engine's own
    /// sort/dedup. Asserting equality rather than containment is deliberate —
    /// containment would hide a newly introduced spurious reason.
    pub reasons: Vec<String>,
}

/// A scenario failure, with enough context to locate it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReplayFailure {
    pub scenario: String,
    pub step_index: usize,
    pub at_ms: u64,
    pub message: String,
    pub actual: DecisionOutput,
}

impl std::fmt::Display for ReplayFailure {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "[{}] step {} (at_ms={}): {} — got {:?} with reasons {:?}",
            self.scenario,
            self.step_index,
            self.at_ms,
            self.message,
            self.actual.decision,
            self.actual.reasons
        )
    }
}

/// Parse the fixture document.
pub fn parse(json: &str) -> Result<FixtureDocument, String> {
    let document: FixtureDocument =
        serde_json::from_str(json).map_err(|error| format!("cannot parse fixtures: {error}"))?;
    if document.schema != "comma.desktop.decision-fixtures.v1" {
        return Err(format!("unexpected fixture schema: {}", document.schema));
    }
    if document.scenarios.is_empty() {
        return Err("fixture document has no scenarios".to_string());
    }
    for scenario in &document.scenarios {
        if scenario.steps.is_empty() {
            return Err(format!("scenario {} has no steps", scenario.id));
        }
    }
    Ok(document)
}

/// Replay every scenario, returning all failures rather than stopping at the
/// first so one run shows the whole picture.
pub fn replay_all(document: &FixtureDocument) -> Vec<ReplayFailure> {
    document
        .scenarios
        .iter()
        .flat_map(replay_scenario)
        .collect()
}

/// Replay one scenario.
pub fn replay_scenario(scenario: &Scenario) -> Vec<ReplayFailure> {
    let mut failures = Vec::new();
    let mut samples: Vec<ActivitySample> = Vec::new();
    let mut interrupts_today: u32 = 0;
    let mut last_interrupt_at_ms: Option<u64> = None;

    for (index, step) in scenario.steps.iter().enumerate() {
        samples.push(ActivitySample {
            observed_at_ms: step.at_ms,
            app: step.app.clone(),
            idle_seconds: step.idle_seconds,
        });

        let input = DecisionInput {
            now_ms: step.at_ms,
            local_hour: step.local_hour,
            idle_seconds: step.idle_seconds,
            samples: samples.clone(),
            last_interrupt_age_ms: last_interrupt_at_ms.map(|at| step.at_ms.saturating_sub(at)),
            interrupts_today,
            session_locked: step.session_locked,
            policy: scenario.policy.clone(),
        };

        let output = decide(&input);

        // Mirror the app's bookkeeping before evaluating the expectation, so a
        // failure reports the state the engine actually produced.
        if output.decision == Decision::Interrupt {
            last_interrupt_at_ms = Some(step.at_ms);
            interrupts_today += 1;
        }

        let expected_decision = match parse_decision(&step.expect.decision) {
            Ok(value) => value,
            Err(message) => {
                failures.push(ReplayFailure {
                    scenario: scenario.id.clone(),
                    step_index: index,
                    at_ms: step.at_ms,
                    message,
                    actual: output,
                });
                continue;
            }
        };

        let expected_reasons = match parse_reasons(&step.expect.reasons) {
            Ok(value) => value,
            Err(message) => {
                failures.push(ReplayFailure {
                    scenario: scenario.id.clone(),
                    step_index: index,
                    at_ms: step.at_ms,
                    message,
                    actual: output,
                });
                continue;
            }
        };

        if output.decision != expected_decision {
            failures.push(ReplayFailure {
                scenario: scenario.id.clone(),
                step_index: index,
                at_ms: step.at_ms,
                message: format!("expected decision {expected_decision:?}"),
                actual: output,
            });
            continue;
        }

        if output.reasons != expected_reasons {
            failures.push(ReplayFailure {
                scenario: scenario.id.clone(),
                step_index: index,
                at_ms: step.at_ms,
                message: format!("expected reasons {expected_reasons:?}"),
                actual: output,
            });
        }
    }

    failures
}

fn parse_decision(value: &str) -> Result<Decision, String> {
    match value {
        "interrupt" => Ok(Decision::Interrupt),
        "defer" => Ok(Decision::Defer),
        "silence" => Ok(Decision::Silence),
        other => Err(format!("unknown decision {other:?} in fixture")),
    }
}

fn parse_reasons(values: &[String]) -> Result<Vec<ReasonCode>, String> {
    let mut parsed = Vec::with_capacity(values.len());
    for value in values {
        parsed.push(match value.as_str() {
            "idle_too_short" => ReasonCode::IdleTooShort,
            "idle_too_long" => ReasonCode::IdleTooLong,
            "focus_too_brief" => ReasonCode::FocusTooBrief,
            "switch_storm" => ReasonCode::SwitchStorm,
            "outside_quiet_hours" => ReasonCode::OutsideQuietHours,
            "daily_budget_exhausted" => ReasonCode::DailyBudgetExhausted,
            "cooldown_active" => ReasonCode::CooldownActive,
            "eligible" => ReasonCode::Eligible,
            other => return Err(format!("unknown reason {other:?} in fixture")),
        });
    }
    // The engine sorts and dedups, so the expectation must be in that form for
    // the equality check to mean "exactly these reasons".
    parsed.sort();
    parsed.dedup();
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The shipped fixture file, embedded so tests do not depend on the
    /// working directory.
    const SHIPPED: &str = include_str!("../../fixtures/decision-scenarios.json");

    #[test]
    fn shipped_fixtures_parse() {
        let document = parse(SHIPPED).expect("shipped fixtures must parse");
        assert!(
            document.scenarios.len() >= 8,
            "expected at least 8 scenarios, found {}",
            document.scenarios.len()
        );
    }

    #[test]
    fn scenario_ids_are_unique() {
        let document = parse(SHIPPED).unwrap();
        let mut seen = std::collections::BTreeSet::new();
        for scenario in &document.scenarios {
            assert!(
                seen.insert(scenario.id.clone()),
                "duplicate id {}",
                scenario.id
            );
        }
    }

    #[test]
    fn every_reason_code_appears_somewhere_in_the_fixtures() {
        // Guards against a documented reason that no scenario ever exercises.
        let document = parse(SHIPPED).unwrap();
        let mut covered = std::collections::BTreeSet::new();
        for scenario in &document.scenarios {
            for step in &scenario.steps {
                covered.extend(step.expect.reasons.iter().cloned());
            }
        }
        for code in [
            "idle_too_short",
            "idle_too_long",
            "focus_too_brief",
            "switch_storm",
            "outside_quiet_hours",
            "daily_budget_exhausted",
            "cooldown_active",
            "eligible",
        ] {
            assert!(
                covered.contains(code),
                "reason {code} is never asserted by any scenario"
            );
        }
    }

    #[test]
    fn rejecting_a_bad_schema() {
        let bad = r#"{"schema":"something-else","scenarios":[]}"#;
        assert!(parse(bad).is_err());
    }

    #[test]
    fn rejecting_an_empty_scenario_list() {
        let bad = r#"{"schema":"comma.desktop.decision-fixtures.v1","scenarios":[]}"#;
        assert!(parse(bad).is_err());
    }

    #[test]
    fn rejecting_a_scenario_without_steps() {
        let bad = r#"{"schema":"comma.desktop.decision-fixtures.v1","scenarios":[
            {"id":"x","policy":{"max_idle_seconds":30,"away_idle_seconds":900,
             "min_focus_ms":0,"max_switches_in_window":8,"switch_window_ms":600000,
             "quiet_hour_start":22,"quiet_hour_end":8,"daily_budget":3},"steps":[]}]}"#;
        assert!(parse(bad).is_err());
    }

    #[test]
    fn unknown_decision_is_reported_not_panicked() {
        let json = r#"{"schema":"comma.desktop.decision-fixtures.v1","scenarios":[
            {"id":"x","policy":{"max_idle_seconds":30,"away_idle_seconds":900,
             "min_focus_ms":0,"max_switches_in_window":8,"switch_window_ms":600000,
             "quiet_hour_start":22,"quiet_hour_end":8,"daily_budget":3},
             "steps":[{"at_ms":0,"app":"Code","idle_seconds":60,"local_hour":10,
             "expect":{"decision":"maybe","reasons":[]}}]}]}"#;
        let document = parse(json).unwrap();
        let failures = replay_all(&document);
        assert_eq!(failures.len(), 1);
        assert!(failures[0].message.contains("unknown decision"));
    }

    #[test]
    fn unknown_reason_is_reported_not_panicked() {
        let json = r#"{"schema":"comma.desktop.decision-fixtures.v1","scenarios":[
            {"id":"x","policy":{"max_idle_seconds":30,"away_idle_seconds":900,
             "min_focus_ms":0,"max_switches_in_window":8,"switch_window_ms":600000,
             "quiet_hour_start":22,"quiet_hour_end":8,"daily_budget":3},
             "steps":[{"at_ms":0,"app":"Code","idle_seconds":60,"local_hour":10,
             "expect":{"decision":"interrupt","reasons":["nonsense"]}}]}]}"#;
        let document = parse(json).unwrap();
        let failures = replay_all(&document);
        assert_eq!(failures.len(), 1);
        assert!(failures[0].message.contains("unknown reason"));
    }

    #[test]
    fn expectation_reasons_are_normalised_before_comparison() {
        // A fixture may list reasons in any order; the engine sorts them.
        let mut parsed =
            parse_reasons(&["idle_too_short".to_string(), "focus_too_brief".to_string()]).unwrap();
        parsed.sort();
        assert_eq!(
            parsed,
            vec![ReasonCode::IdleTooShort, ReasonCode::FocusTooBrief]
        );
    }

    #[test]
    fn failure_display_is_informative() {
        let failure = ReplayFailure {
            scenario: "demo".to_string(),
            step_index: 2,
            at_ms: 1234,
            message: "expected decision Interrupt".to_string(),
            actual: DecisionOutput {
                decision: Decision::Defer,
                reasons: vec![ReasonCode::FocusTooBrief],
                score: 85,
            },
        };
        let text = failure.to_string();
        assert!(text.contains("demo"));
        assert!(text.contains("step 2"));
        assert!(text.contains("FocusTooBrief"));
    }
}
