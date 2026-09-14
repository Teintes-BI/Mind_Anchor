//! Idle-time reader built on `GetLastInputInfo`.
//!
//! `GetLastInputInfo` returns the tick count of the last keyboard or mouse
//! input for the current session. From it we can derive **how long** the user
//! has been quiet — never *what* they did. This is the entire keyboard-related
//! surface of Phase 0: no hook, no key code, no text.

/// Seconds since the last user input, or `None` when the OS call fails.
///
/// Returning `None` rather than `0` matters: `0` would mean "the user is
/// typing right now", so conflating a failed read with that would make the
/// engine permanently defer. Callers treat `None` as "unknown".
#[cfg(windows)]
pub fn idle_seconds() -> Option<u32> {
    use windows::Win32::System::SystemInformation::GetTickCount;
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    // SAFETY: `LASTINPUTINFO` is a plain C struct. We initialise `cbSize` as
    // the API requires, pass a pointer to our own stack value, and only read
    // the field back after the call reports success.
    unsafe {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if !GetLastInputInfo(&mut info).as_bool() {
            return None;
        }
        let now = GetTickCount();
        // Tick counts wrap roughly every 49.7 days; `wrapping_sub` keeps the
        // arithmetic correct across the wrap boundary.
        let elapsed_ms = now.wrapping_sub(info.dwTime);
        Some(elapsed_ms / 1000)
    }
}

/// Non-Windows stub. Phase 0 targets Windows; other platforms report "unknown"
/// instead of inventing a value.
#[cfg(not(windows))]
pub fn idle_seconds() -> Option<u32> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn idle_seconds_is_plausible() {
        // On a real Windows session this must return a sane number. The test
        // tolerates `None` so it stays green in headless CI where there is no
        // interactive session, but asserts the range whenever a value exists.
        if let Some(seconds) = idle_seconds() {
            assert!(seconds < 60 * 60 * 24 * 30, "idle={seconds}");
        }
    }
}
