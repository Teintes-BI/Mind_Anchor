//! Session lock detection.
//!
//! Phase 0 recorded `session_locked: false` unconditionally. This module makes
//! it a real reading so the decision engine's existing `Silence` rule for a
//! locked screen actually fires.
//!
//! Mechanism: `OpenInputDesktop`. When the workstation is unlocked, the calling
//! process can open the input desktop and gets a handle; once the session is
//! locked the input desktop is owned by the secure desktop (`Winlogon`) and the
//! call fails with a null handle. This reads state and changes nothing — it does
//! not lock, unlock, or switch desktops.
//!
//! Deliberately **polling**, not event-driven: registering for
//! `WTSRegisterSessionNotification` requires a window procedure and a message
//! loop, which is a much larger surface for a Phase 0 reading that is sampled
//! once per collection interval anyway.

/// Whether the interactive session is currently locked.
///
/// Returns `None` when the state cannot be determined, so callers never mistake
/// an API failure for "unlocked" (which would let the engine interrupt during a
/// locked session).
#[cfg(windows)]
pub fn is_locked() -> Option<bool> {
    use windows::Win32::System::StationsAndDesktops::{
        CloseDesktop, OpenInputDesktop, DESKTOP_READOBJECTS,
    };

    // SAFETY: `OpenInputDesktop` returns an `HDESK` owned by the caller and we
    // close it on the success path. No caller memory is written; the failure
    // signal is an `Err`, which is the locked case.
    unsafe {
        match OpenInputDesktop(Default::default(), false, DESKTOP_READOBJECTS) {
            Ok(desktop) => {
                // Desktop handles are closed with `CloseDesktop`, not
                // `CloseHandle` — `HDESK` is not an `HANDLE`.
                let _ = CloseDesktop(desktop);
                Some(false)
            }
            Err(_) => {
                // The secure desktop owns the input desktop while locked, so the
                // open fails. That is the locked case, not a probe error.
                Some(true)
            }
        }
    }
}

/// Non-Windows stub: unknown.
#[cfg(not(windows))]
pub fn is_locked() -> Option<bool> {
    None
}

/// Convenience wrapper for the sampler: unknown is treated as *locked* so that
/// a probe failure can never cause an interruption.
pub fn is_locked_or_unknown() -> bool {
    fail_closed(is_locked())
}

/// The fail-closed rule, extracted so it can be tested without a literal
/// `None` (clippy rejects asserting on `None.unwrap_or(..)` directly, and that
/// form would not test the shipped rule anyway).
fn fail_closed(probe: Option<bool>) -> bool {
    probe.unwrap_or(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn locked_or_unknown_never_panics() {
        // Whatever the host state, this must return a bool without panicking.
        let _ = is_locked_or_unknown();
    }

    #[test]
    fn unknown_is_treated_as_locked() {
        // A failed probe must not look "unlocked".
        assert!(fail_closed(None), "unknown session state must fail closed");
    }

    #[test]
    fn known_states_pass_through() {
        assert!(!fail_closed(Some(false)), "unlocked stays unlocked");
        assert!(fail_closed(Some(true)), "locked stays locked");
    }

    #[test]
    fn is_locked_is_tri_state() {
        // On Windows we expect a real reading; on other platforms `None`.
        #[cfg(windows)]
        assert!(is_locked().is_some(), "Windows must report a session state");
        #[cfg(not(windows))]
        assert!(is_locked().is_none());
    }
}
