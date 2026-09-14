//! Sampling loop.
//!
//! Converts raw OS readings into a bounded, in-memory ring of
//! [`ActivitySample`] values that the decision engine and the store consume.
//! The ring is capped so an unattended app cannot grow memory without limit.

use crate::collector::foreground::{self, ForegroundInfo};
use crate::collector::idle;
use crate::collector::{redact_title, CollectorConfig};
use crate::interrupt::ActivitySample;

/// Hard cap on retained samples. At the default 30s cadence this is ~2.5h of
/// history, which comfortably covers the decision engine's 10-minute window.
pub const MAX_SAMPLES: usize = 300;

/// Bounded, ordered history of activity samples.
#[derive(Debug, Clone, Default)]
pub struct ActivityBuffer {
    samples: Vec<ActivitySample>,
}

impl ActivityBuffer {
    pub fn new() -> Self {
        Self {
            samples: Vec::new(),
        }
    }

    /// Append a sample, evicting the oldest once [`MAX_SAMPLES`] is reached.
    pub fn push(&mut self, sample: ActivitySample) {
        self.samples.push(sample);
        if self.samples.len() > MAX_SAMPLES {
            let overflow = self.samples.len() - MAX_SAMPLES;
            self.samples.drain(0..overflow);
        }
    }

    pub fn samples(&self) -> &[ActivitySample] {
        &self.samples
    }

    pub fn is_empty(&self) -> bool {
        self.samples.is_empty()
    }

    pub fn len(&self) -> usize {
        self.samples.len()
    }
}

/// Build one sample from the OS, honouring the config's privacy switches.
///
/// Returns `None` when collection is disabled, so the "off" switch is a real
/// gate rather than a UI-only affordance.
pub fn sample_once(config: &CollectorConfig, now_ms: u64) -> Option<ActivitySample> {
    if !config.enabled {
        return None;
    }
    let info = foreground::read_foreground(config.capture_window_title);
    let info = enforce_title_policy(info, config);
    Some(ActivitySample {
        observed_at_ms: now_ms,
        app: info.app,
        idle_seconds: idle::idle_seconds().unwrap_or(0),
    })
}

/// Second line of defence for window titles: even if a caller built a
/// [`ForegroundInfo`] with a title while capture is disabled, it is dropped
/// here, and any retained title is re-redacted.
fn enforce_title_policy(mut info: ForegroundInfo, config: &CollectorConfig) -> ForegroundInfo {
    if config.capture_window_title {
        info.window_title = redact_title(&info.window_title);
    } else {
        info.window_title = String::new();
    }
    info
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(at: u64) -> ActivitySample {
        ActivitySample {
            observed_at_ms: at,
            app: "Code".to_string(),
            idle_seconds: 5,
        }
    }

    #[test]
    fn buffer_caps_growth() {
        let mut buffer = ActivityBuffer::new();
        for i in 0..(MAX_SAMPLES + 50) {
            buffer.push(sample(i as u64));
        }
        assert_eq!(buffer.len(), MAX_SAMPLES);
        // Oldest entries were evicted, newest retained.
        assert_eq!(buffer.samples()[0].observed_at_ms, 50);
    }

    #[test]
    fn disabled_config_yields_no_sample() {
        let config = CollectorConfig {
            enabled: false,
            ..CollectorConfig::default()
        };
        assert!(sample_once(&config, 1_000).is_none());
    }

    #[test]
    fn disabled_title_capture_clears_titles() {
        let config = CollectorConfig::default();
        let info = ForegroundInfo {
            app: "Code".to_string(),
            window_title: "secret.docx - Editor".to_string(),
        };
        assert_eq!(enforce_title_policy(info, &config).window_title, "");
    }

    #[test]
    fn enabled_title_capture_still_redacts() {
        let config = CollectorConfig {
            capture_window_title: true,
            ..CollectorConfig::default()
        };
        let info = ForegroundInfo {
            app: "Code".to_string(),
            window_title: "Budget 2026 - Notepad".to_string(),
        };
        let out = enforce_title_policy(info, &config);
        assert_eq!(out.window_title, "Budget 2026");
        assert!(!out.window_title.contains("Notepad"));
    }
}
