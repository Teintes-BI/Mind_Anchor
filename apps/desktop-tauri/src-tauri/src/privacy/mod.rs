//! Privacy boundary for Phase 0.
//!
//! Two things live here:
//!
//! 1. [`DataLevel`] — the same P0-P3 grading the architecture doc uses, so a
//!    record's sensitivity travels with it.
//! 2. [`CollectionState`] — the user-facing kill switches. `enabled` is the
//!    master gate; when it is false the sampler produces nothing and the store
//!    refuses writes.

use serde::{Deserialize, Serialize};

/// Data sensitivity, aligned with `docs/architecture/comma-v0.1-technical-architecture-2026-08-24.md`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataLevel {
    /// Raw audio / transient sensor buffers. Must expire.
    P0Ephemeral,
    /// Structured events and device activity summaries. Local, immutable.
    P1Event,
    /// User-confirmed long-term facts. Local by default.
    P2PersonalMemory,
    /// Life Compass and deep personal model. Local only, never egressed.
    P3DeepPersonalModel,
}

impl DataLevel {
    /// P3 is the only level that may never leave the machine, regardless of
    /// consent. Everything else is local-only in Phase 0 anyway.
    pub fn egress_forbidden(self) -> bool {
        matches!(self, DataLevel::P3DeepPersonalModel)
    }

    /// Activity samples are event-grade: they are observations, not memories.
    pub fn activity_sample_level() -> Self {
        DataLevel::P1Event
    }
}

/// User-controlled switches.
///
/// `upload_enabled` **defaults to `true`**: this design requires a trusted relay
/// server, so the mechanism ships ready. It is not, on its own, permission to
/// send anything — an upload is only attempted when a valid endpoint has also
/// been configured (see [`crate::upload`]). With no endpoint the client refuses
/// rather than guessing a host.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CollectionState {
    /// Master collection gate.
    pub enabled: bool,
    /// Window-title capture. Off by default per the Phase 0 brief.
    pub capture_window_title: bool,
    /// Whether the sanitised export may be handed to an uploader. Defaults to
    /// `true`; the endpoint requirement is the effective second gate.
    pub upload_enabled: bool,
}

impl Default for CollectionState {
    fn default() -> Self {
        Self {
            enabled: true,
            capture_window_title: false,
            upload_enabled: true,
        }
    }
}

impl CollectionState {
    /// True only when a record may be written to the local store.
    pub fn may_store(&self) -> bool {
        self.enabled
    }

    /// True only when a sanitised projection may be handed out for upload.
    ///
    /// Requires the master collection gate to be on. `upload_enabled` defaults
    /// to `true`, so the effective remaining gate for actually sending anything
    /// is a configured endpoint — enforced in `crate::upload`.
    pub fn may_upload(&self) -> bool {
        self.enabled && self.upload_enabled
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_are_privacy_preserving_except_upload_gate() {
        let state = CollectionState::default();
        assert!(!state.capture_window_title, "titles are opt-in");
        // T2: the upload switch ships ready because a trusted relay is a
        // required part of this design. Sending still cannot happen without a
        // configured endpoint, which is asserted in `crate::upload`.
        assert!(
            state.upload_enabled,
            "upload switch ships enabled by design"
        );
        assert!(state.may_upload());
        assert!(state.may_store(), "local collection is the default");
    }

    #[test]
    fn upload_requires_the_master_gate() {
        let master_off = CollectionState {
            enabled: false,
            ..CollectionState::default()
        };
        assert!(!master_off.may_upload(), "master gate must dominate upload");
        assert!(!master_off.may_store());

        let upload_off = CollectionState {
            upload_enabled: false,
            ..CollectionState::default()
        };
        assert!(
            !upload_off.may_upload(),
            "explicit opt-out must be honoured"
        );
        assert!(upload_off.may_store(), "local collection still works");
    }

    #[test]
    fn p3_is_never_egressable() {
        assert!(DataLevel::P3DeepPersonalModel.egress_forbidden());
        assert!(!DataLevel::P1Event.egress_forbidden());
        assert!(!DataLevel::P2PersonalMemory.egress_forbidden());
    }

    #[test]
    fn activity_samples_are_p1() {
        assert_eq!(DataLevel::activity_sample_level(), DataLevel::P1Event);
    }
}
