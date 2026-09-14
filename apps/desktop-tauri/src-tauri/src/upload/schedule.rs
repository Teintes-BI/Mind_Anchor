//! Periodic upload scheduling.
//!
//! Uploads are retried on a timer rather than only on a button press, because a
//! desktop collector runs for hours unattended and a transient network failure
//! should not require the user to notice and click.
//!
//! The scheduler is deliberately thin: it owns a tick and a decision about
//! whether to act, and delegates the actual send to the same `flush_uploads`
//! path the UI uses. That keeps one code path with one set of gates, so a
//! scheduled flush cannot bypass a check a manual flush honours.
//!
//! Gating is the important part. A tick does nothing unless *every* condition
//! holds:
//!
//! * collection is on (otherwise there is nothing new and the user has asked
//!   for silence),
//! * the upload switch is on,
//! * an endpoint is configured (an unconfigured relay must never be guessed),
//! * the queue is non-empty.
//!
//! The interval is exposed as a plain config value so it can be set to zero to
//! disable scheduling entirely.

use serde::{Deserialize, Serialize};

/// How the scheduler should behave on this tick.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Tick {
    /// Conditions are met; run a flush.
    Flush,
    /// Nothing to do, and why.
    Skip(SkipReason),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SkipReason {
    /// Scheduling is disabled (interval of zero).
    Disabled,
    CollectionOff,
    UploadSwitchOff,
    EndpointNotConfigured,
    QueueEmpty,
}

/// The inputs a scheduling decision depends on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TickInput {
    pub interval_ms: u64,
    pub collection_enabled: bool,
    pub upload_enabled: bool,
    pub endpoint_configured: bool,
    pub pending: u64,
}

/// Whether this tick should flush. Pure, so every gate is testable without a
/// timer, a network, or a database.
pub fn next_action(input: TickInput) -> Tick {
    if input.interval_ms == 0 {
        return Tick::Skip(SkipReason::Disabled);
    }
    if !input.collection_enabled {
        return Tick::Skip(SkipReason::CollectionOff);
    }
    if !input.upload_enabled {
        return Tick::Skip(SkipReason::UploadSwitchOff);
    }
    if !input.endpoint_configured {
        return Tick::Skip(SkipReason::EndpointNotConfigured);
    }
    if input.pending == 0 {
        return Tick::Skip(SkipReason::QueueEmpty);
    }
    Tick::Flush
}

/// Clamp a user-supplied interval into a sane range.
///
/// A very small interval would hammer the relay; the floor is one minute. Zero
/// is allowed and means "never", since that is a legitimate user choice rather
/// than a mistake.
pub fn clamp_interval_ms(requested: u64) -> u64 {
    const MIN: u64 = 60_000;
    const MAX: u64 = 24 * 60 * 60 * 1000;
    if requested == 0 {
        return 0;
    }
    requested.clamp(MIN, MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ready() -> TickInput {
        TickInput {
            interval_ms: 300_000,
            collection_enabled: true,
            upload_enabled: true,
            endpoint_configured: true,
            pending: 1,
        }
    }

    #[test]
    fn a_ready_state_flushes() {
        assert_eq!(next_action(ready()), Tick::Flush);
    }

    #[test]
    fn a_zero_interval_disables_scheduling() {
        let input = TickInput {
            interval_ms: 0,
            ..ready()
        };
        assert_eq!(next_action(input), Tick::Skip(SkipReason::Disabled));
    }

    #[test]
    fn collection_off_skips() {
        let input = TickInput {
            collection_enabled: false,
            ..ready()
        };
        assert_eq!(next_action(input), Tick::Skip(SkipReason::CollectionOff));
    }

    #[test]
    fn upload_switch_off_skips() {
        let input = TickInput {
            upload_enabled: false,
            ..ready()
        };
        assert_eq!(next_action(input), Tick::Skip(SkipReason::UploadSwitchOff));
    }

    #[test]
    fn an_unconfigured_endpoint_skips_rather_than_guessing() {
        // The critical one: a scheduled flush must not send anywhere if no
        // endpoint was configured. There is no default relay.
        let input = TickInput {
            endpoint_configured: false,
            ..ready()
        };
        assert_eq!(
            next_action(input),
            Tick::Skip(SkipReason::EndpointNotConfigured)
        );
    }

    #[test]
    fn an_empty_queue_skips() {
        let input = TickInput {
            pending: 0,
            ..ready()
        };
        assert_eq!(next_action(input), Tick::Skip(SkipReason::QueueEmpty));
    }

    #[test]
    fn collection_off_is_reported_before_endpoint_state() {
        // Order matters for diagnosis: when several gates are closed the first
        // one in the chain is the one reported.
        let input = TickInput {
            collection_enabled: false,
            endpoint_configured: false,
            pending: 0,
            ..ready()
        };
        assert_eq!(next_action(input), Tick::Skip(SkipReason::CollectionOff));
    }

    #[test]
    fn intervals_are_clamped_to_a_sane_range() {
        assert_eq!(clamp_interval_ms(0), 0, "zero means disabled, not minimum");
        assert_eq!(clamp_interval_ms(1), 60_000, "below the floor");
        assert_eq!(clamp_interval_ms(300_000), 300_000, "within range is kept");
        assert_eq!(
            clamp_interval_ms(u64::MAX),
            24 * 60 * 60 * 1000,
            "above the ceiling"
        );
    }

    #[test]
    fn every_skip_reason_is_distinguishable() {
        let reasons = [
            SkipReason::Disabled,
            SkipReason::CollectionOff,
            SkipReason::UploadSwitchOff,
            SkipReason::EndpointNotConfigured,
            SkipReason::QueueEmpty,
        ];
        for (i, a) in reasons.iter().enumerate() {
            for (j, b) in reasons.iter().enumerate() {
                assert_eq!(i == j, a == b, "{a:?} vs {b:?} must not collide");
            }
        }
    }
}
