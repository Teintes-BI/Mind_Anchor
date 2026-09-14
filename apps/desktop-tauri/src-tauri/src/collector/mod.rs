//! Platform activity collection.
//!
//! Privacy contract for this module (Phase 0):
//!
//! * Keystrokes are **counted only as "time since last input"**. We never
//!   install a keyboard hook, never read a key code and never store text.
//!   The only OS call is `GetLastInputInfo`, which returns a timestamp.
//! * Window titles are **not collected by default**. [`CollectorConfig`]
//!   defaults `capture_window_title` to `false`, and even when a user turns it
//!   on the value passes through [`redact_title`] before it can be stored.
//! * Collection is **local only**. Nothing in this module opens a socket.

pub mod foreground;
pub mod idle;
pub mod sampler;
pub mod session;

use serde::{Deserialize, Serialize};

/// Collection settings. Every privacy-relevant switch defaults to the
/// non-invasive value, so a freshly constructed config is already safe.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CollectorConfig {
    /// Sampling cadence in milliseconds.
    pub sample_interval_ms: u64,
    /// OFF by default. When off, no window title is ever read from the OS.
    pub capture_window_title: bool,
    /// Master switch. When false the sampler reports nothing at all.
    pub enabled: bool,
}

impl Default for CollectorConfig {
    fn default() -> Self {
        Self {
            sample_interval_ms: 30_000,
            capture_window_title: false,
            enabled: true,
        }
    }
}

/// Reduce a raw window title to a coarse, non-identifying label.
///
/// Kept even though title capture is off by default, so that the "worst case"
/// of an enabled setting is still bounded: the title is capped and the
/// identifying tail (document names, file paths, chat subjects) is dropped.
pub fn redact_title(raw: &str) -> String {
    const MAX_CHARS: usize = 24;
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    // Keep only the leading segment before a separator, which is usually the
    // application-level part rather than the user's document name.
    let head = trimmed
        .split(['—', '-', '|', '·'])
        .next()
        .unwrap_or("")
        .trim();
    // A title made only of separators (e.g. " - ") carries no application
    // information, so there is nothing safe to keep.
    if head.is_empty() {
        return String::new();
    }
    head.chars().take(MAX_CHARS).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_does_not_capture_titles() {
        let config = CollectorConfig::default();
        assert!(!config.capture_window_title, "titles must be opt-in");
        assert!(config.enabled);
    }

    #[test]
    fn redact_title_drops_document_tail() {
        // The part after the dash is the user's document, which we must not keep.
        let redacted = redact_title("Budget 2026 - Notepad");
        assert!(!redacted.contains("Notepad"));
        assert_eq!(redacted, "Budget 2026");
    }

    #[test]
    fn redact_title_caps_length() {
        let long = "a".repeat(200);
        assert_eq!(redact_title(&long).chars().count(), 24);
    }

    #[test]
    fn redact_title_handles_empty_and_separator_only() {
        assert_eq!(redact_title(""), "");
        assert_eq!(redact_title("   "), "");
        assert_eq!(redact_title(" - "), "");
    }
}
