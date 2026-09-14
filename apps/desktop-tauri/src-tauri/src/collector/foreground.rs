//! Foreground-window reader.
//!
//! Phase 0 reads **only the process name** of the foreground window, which is
//! low-entropy and non-identifying (e.g. `Code`, `chrome`). The window title
//! is read only when the caller explicitly opts in, and the result is passed
//! through [`crate::collector::redact_title`] before it can be stored.
//!
//! This module reads; it never writes to another process, never injects input
//! and never captures pixels.

/// Foreground process name and (optionally) a redacted title.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ForegroundInfo {
    pub app: String,
    /// Empty unless title capture was explicitly requested.
    pub window_title: String,
}

/// Read the foreground window's owning process name.
///
/// `include_title` defaults are the caller's responsibility; the app passes
/// `config.capture_window_title`, which defaults to `false`.
#[cfg(windows)]
pub fn read_foreground(include_title: bool) -> ForegroundInfo {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };

    // SAFETY: every handle obtained here is closed before returning, and all
    // buffer pointers are to local stack/heap values whose lengths are passed
    // alongside. No pointer escapes this function.
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            return ForegroundInfo::default();
        }

        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return ForegroundInfo::default();
        }

        let mut app = String::new();
        if let Ok(handle) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            let mut buffer = [0u16; 512];
            let mut size = buffer.len() as u32;
            if QueryFullProcessImageNameW(
                handle,
                PROCESS_NAME_WIN32,
                windows::core::PWSTR(buffer.as_mut_ptr()),
                &mut size,
            )
            .is_ok()
            {
                let full = String::from_utf16_lossy(&buffer[..size as usize]);
                app = full
                    .rsplit(['\\', '/'])
                    .next()
                    .unwrap_or(&full)
                    .trim_end_matches(".exe")
                    .to_string();
            }
            let _ = CloseHandle(handle);
        }

        let mut window_title = String::new();
        if include_title {
            let len = GetWindowTextLengthW(hwnd);
            if len > 0 {
                let mut buffer = vec![0u16; len as usize + 1];
                let written = GetWindowTextW(hwnd, &mut buffer);
                if written > 0 {
                    let raw = String::from_utf16_lossy(&buffer[..written as usize]);
                    window_title = crate::collector::redact_title(&raw);
                }
            }
        }

        ForegroundInfo { app, window_title }
    }
}

/// Non-Windows stub: Phase 0 targets Windows.
#[cfg(not(windows))]
pub fn read_foreground(_include_title: bool) -> ForegroundInfo {
    ForegroundInfo::default()
}
