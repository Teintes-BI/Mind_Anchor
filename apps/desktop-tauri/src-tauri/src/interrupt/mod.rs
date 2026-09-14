//! Interruption decision boundary.
//!
//! All classification logic lives in [`decision`], which is pure and testable.
//! This module only re-exports it and owns the policy defaults used by the app.

pub mod decision;
pub mod fixture;

pub use decision::{
    decide, ActivitySample, Decision, DecisionInput, DecisionOutput, InterruptPolicy, ReasonCode,
};

/// Shadow mode is the Phase 0 default: the engine classifies, and the result is
/// written to the local trace and shown in the UI, but nothing is ever
/// delivered to the user. There is no code path in this crate that turns a
/// [`Decision::Interrupt`] into a visible interruption.
pub const SHADOW_MODE: bool = true;
