//! Reminder inbox client.
//!
//! Reads the relay's `/client/inbox` endpoints. Two properties of the server
//! shape this module, both taken from observed responses rather than guessed:
//!
//! 1. Identity comes from the bearer token. The routes accept a `userId` query
//!    parameter but ignore it (an earlier version trusted it, which let a caller
//!    read another user's reminders). This client never sends it.
//!
//! 2. The overview returns three overlapping views of the same collection -
//!    `messages`, `pendingMessages`, `acknowledgedMessages` - plus counters and
//!    per-channel counts. Only `messages` is used as the source of truth and the
//!    rest are verified against it, so a server-side inconsistency shows up as a
//!    test failure rather than as duplicated rows in the UI.

use serde::{Deserialize, Serialize};

/// The channels a reminder can arrive on, as the server defines them.
pub const CHANNELS: [&str; 4] = ["mobile_push", "desktop_local", "feishu_bot", "telegram_bot"];

/// One reminder.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub title: String,
    pub message: String,
    pub channel: String,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "acknowledgedAt", default)]
    pub acknowledged_at: Option<String>,
}

impl Message {
    /// Whether this reminder still needs attention.
    pub fn is_pending(&self) -> bool {
        self.status == "pending"
    }
}

/// Counters as reported by the server.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MetricCounts {
    #[serde(rename = "totalMessages")]
    pub total_messages: u64,
    #[serde(rename = "pendingMessages")]
    pub pending_messages: u64,
    #[serde(rename = "acknowledgedMessages")]
    pub acknowledged_messages: u64,
    /// Present on the overview; surfaced because it is the one count that
    /// indicates something needs a decision.
    #[serde(rename = "openInterventions", default)]
    pub open_interventions: u64,
}

/// Per-channel breakdown.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChannelCount {
    pub channel: String,
    pub total: u64,
    pub pending: u64,
    pub acknowledged: u64,
}

/// The overview response. Only the fields this app uses are required; the rest
/// (behaviour conclusion, recovery plan, active session) are ignored so a server
/// adding to them cannot break parsing.
#[derive(Debug, Clone, Deserialize)]
pub struct Overview {
    pub messages: Vec<Message>,
    #[serde(rename = "metricCounts")]
    pub metric_counts: MetricCounts,
    #[serde(rename = "channelCounts", default)]
    pub channel_counts: Vec<ChannelCount>,
}

/// A response that contradicts itself.
///
/// Kept as its own type so callers can distinguish "the server is inconsistent"
/// from "the request failed", which deserve different handling and different
/// messages.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inconsistency {
    pub detail: String,
}

impl std::fmt::Display for Inconsistency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.detail)
    }
}

impl Overview {
    /// Check the response against itself before it reaches the UI.
    ///
    /// The server sends the same collection three ways. If those disagree, the
    /// panel would show one thing and the counters another, and the user would
    /// have no way to tell which is right. Better to refuse the snapshot.
    pub fn validate(&self) -> Result<(), Inconsistency> {
        let pending = self.messages.iter().filter(|m| m.is_pending()).count() as u64;
        let acknowledged = self.messages.len() as u64 - pending;

        if self.metric_counts.total_messages != self.messages.len() as u64 {
            return Err(Inconsistency {
                detail: format!(
                    "totalMessages is {} but {} messages were sent",
                    self.metric_counts.total_messages,
                    self.messages.len()
                ),
            });
        }
        if self.metric_counts.pending_messages != pending {
            return Err(Inconsistency {
                detail: format!(
                    "pendingMessages is {} but {} messages have status pending",
                    self.metric_counts.pending_messages, pending
                ),
            });
        }
        if self.metric_counts.acknowledged_messages != acknowledged {
            return Err(Inconsistency {
                detail: format!(
                    "acknowledgedMessages is {} but {} messages are acknowledged",
                    self.metric_counts.acknowledged_messages, acknowledged
                ),
            });
        }

        // Every message must carry a non-empty id, or acknowledging it is
        // impossible and the row is unusable.
        if let Some(bad) = self.messages.iter().find(|m| m.id.trim().is_empty()) {
            return Err(Inconsistency {
                detail: format!("a message has an empty id (title {:?})", bad.title),
            });
        }

        // A channel the client does not know would be displayed as a raw token
        // and could never be counted correctly.
        if let Some(bad) = self
            .messages
            .iter()
            .find(|m| !CHANNELS.contains(&m.channel.as_str()))
        {
            return Err(Inconsistency {
                detail: format!("unknown channel {:?}", bad.channel),
            });
        }

        // Status drives whether the row is actionable, so an unexpected value
        // must not be treated as pending by accident.
        if let Some(bad) = self
            .messages
            .iter()
            .find(|m| m.status != "pending" && m.status != "acknowledged")
        {
            return Err(Inconsistency {
                detail: format!("unknown status {:?}", bad.status),
            });
        }

        Ok(())
    }
}

/// The pending reminders, newest first, as the panel should show them.
///
/// The server sends them in its own order; sorting here keeps the panel stable
/// regardless of that, using the id as a tiebreak so equal timestamps do not
/// reorder between polls.
pub fn pending_sorted(messages: &[Message]) -> Vec<&Message> {
    let mut pending: Vec<&Message> = messages.iter().filter(|m| m.is_pending()).collect();
    pending.sort_by(|a, b| {
        b.created_at
            .cmp(&a.created_at)
            .then_with(|| a.id.cmp(&b.id))
    });
    pending
}

/// Human-readable label for a channel. Falls back to the raw value so an
/// unrecognised channel is visible rather than blank.
pub fn channel_label(channel: &str) -> &str {
    match channel {
        "mobile_push" => "手机推送",
        "desktop_local" => "本机提醒",
        "feishu_bot" => "飞书",
        "telegram_bot" => "Telegram",
        other => other,
    }
}

/// Path for acknowledging one message.
pub fn ack_path(message_id: &str) -> String {
    format!("/client/inbox/{}/ack", percent_encode(message_id))
}

/// Percent-encode the characters that would otherwise change the path.
///
/// Ids are UUIDs in practice, so this is defensive: an id containing `/` would
/// silently address a different route.
fn percent_encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

/// Derive the inbox URLs from the configured event endpoint.
///
/// Same origin as the relay, so one configuration entry covers both. `None` when
/// the endpoint is not a URL, in which case the caller simply does not poll.
pub fn inbox_urls(event_endpoint: &str) -> Option<(String, String)> {
    let trimmed = event_endpoint.trim();
    let scheme_end = trimmed.find("://")? + 3;
    let rest = &trimmed[scheme_end..];
    let origin_end = rest
        .find('/')
        .map(|i| scheme_end + i)
        .unwrap_or(trimmed.len());
    let origin = &trimmed[..origin_end];
    if origin.len() <= scheme_end {
        return None;
    }
    Some((
        format!("{origin}/client/inbox/overview"),
        origin.to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A response copied verbatim from the relay, including the real Chinese
    /// title, so parsing is exercised against what the server actually sends.
    const REAL_RESPONSE: &str = r#"{
        "messages": [
            {
                "id": "a609e613-8507-48f4-ab31-6ab137680d8d",
                "userId": "demo-user",
                "title": "恢复计划已就绪",
                "message": "Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.",
                "channel": "mobile_push",
                "status": "pending",
                "createdAt": "2026-09-15T12:32:05.715Z"
            }
        ],
        "pendingMessages": [{"id": "a609e613-8507-48f4-ab31-6ab137680d8d"}],
        "acknowledgedMessages": [],
        "metricCounts": {
            "totalMessages": 1,
            "pendingMessages": 1,
            "acknowledgedMessages": 0,
            "openInterventions": 1
        },
        "channelCounts": [
            {"channel": "mobile_push", "total": 1, "pending": 1, "acknowledged": 0},
            {"channel": "desktop_local", "total": 0, "pending": 0, "acknowledged": 0},
            {"channel": "feishu_bot", "total": 0, "pending": 0, "acknowledged": 0},
            {"channel": "telegram_bot", "total": 0, "pending": 0, "acknowledged": 0}
        ],
        "latestBehaviorConclusion": null,
        "latestRecoveryPlan": null,
        "activeSession": null
    }"#;

    fn real() -> Overview {
        serde_json::from_str(REAL_RESPONSE).expect("the captured response parses")
    }

    #[test]
    fn parses_the_real_relay_response() {
        let overview = real();
        assert_eq!(overview.messages.len(), 1);
        let message = &overview.messages[0];
        assert_eq!(message.title, "恢复计划已就绪");
        assert_eq!(message.channel, "mobile_push");
        assert!(message.is_pending());
        // Non-ASCII and embedded quotes must survive intact.
        assert!(message.message.contains("调整收件箱提醒文案"));
    }

    #[test]
    fn the_real_response_is_self_consistent() {
        assert_eq!(real().validate(), Ok(()));
    }

    #[test]
    fn unknown_extra_fields_are_ignored() {
        // The server sends behaviour conclusion, recovery plan and active
        // session; the client must not break when those grow.
        let text = REAL_RESPONSE.replace(
            r#""activeSession": null"#,
            r#""activeSession": null, "somethingNew": {"nested": [1,2,3]}"#,
        );
        let overview: Overview = serde_json::from_str(&text).expect("still parses");
        assert_eq!(overview.messages.len(), 1);
    }

    #[test]
    fn an_empty_inbox_parses_and_validates() {
        let text = r#"{
            "messages": [],
            "metricCounts": {"totalMessages":0,"pendingMessages":0,"acknowledgedMessages":0,"openInterventions":0},
            "channelCounts": []
        }"#;
        let overview: Overview = serde_json::from_str(text).unwrap();
        assert_eq!(overview.validate(), Ok(()));
        assert!(pending_sorted(&overview.messages).is_empty());
    }

    #[test]
    fn a_total_that_disagrees_is_rejected() {
        let text = REAL_RESPONSE.replace(r#""totalMessages": 1"#, r#""totalMessages": 5"#);
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        let error = overview.validate().unwrap_err();
        assert!(error.detail.contains("totalMessages"), "{error}");
    }

    #[test]
    fn a_pending_count_that_disagrees_is_rejected() {
        let text = REAL_RESPONSE.replace(r#""pendingMessages": 1"#, r#""pendingMessages": 0"#);
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        assert!(overview.validate().is_err());
    }

    #[test]
    fn an_unknown_channel_is_rejected() {
        // Replace the channel value only. An earlier version of this test
        // matched `"mobile_push","status"` without the JSON's spaces, so nothing
        // was replaced, validate() legitimately returned Ok, and unwrap_err()
        // panicked - a broken test rather than a broken check.
        let text = REAL_RESPONSE.replace(
            r#""channel": "mobile_push""#,
            r#""channel": "carrier_pigeon""#,
        );
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        let error = overview.validate().unwrap_err();
        assert!(error.detail.contains("channel"), "{error}");
    }

    #[test]
    fn an_unknown_channel_in_the_message_list_is_rejected() {
        // The counters-only variant above could pass for the wrong reason if the
        // messages array happened to be empty. This one guarantees a message
        // carries the bad channel.
        //
        // The fixture lays `channel` and `status` out on separate lines, so the
        // pattern must not assume they are adjacent.
        let text = REAL_RESPONSE.replace(
            r#""channel": "mobile_push","#,
            r#""channel": "carrier_pigeon","#,
        );
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        // Sanity: the counters still describe the untouched message count, so
        // the failure below is attributable to the channel and nothing else.
        assert_eq!(overview.messages.len(), 1);
        let error = overview.validate().unwrap_err();
        assert!(error.detail.contains("carrier_pigeon"), "{error}");
    }

    #[test]
    fn an_unknown_status_is_rejected() {
        let text = REAL_RESPONSE.replace(r#""status": "pending""#, r#""status": "snoozed""#);
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        let error = overview.validate().unwrap_err();
        assert!(error.detail.contains("status"), "{error}");
    }

    #[test]
    fn acknowledged_messages_are_sorted_out_of_the_pending_list() {
        let text = REAL_RESPONSE.replace(
            r#""status": "pending""#,
            r#""status": "acknowledged", "acknowledgedAt": "2026-09-15T13:00:00.000Z""#,
        );
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        assert!(pending_sorted(&overview.messages).is_empty());
        assert_eq!(
            overview.messages[0].acknowledged_at.as_deref(),
            Some("2026-09-15T13:00:00.000Z")
        );
    }

    #[test]
    fn an_empty_id_is_rejected() {
        let text = REAL_RESPONSE.replace(
            r#""id": "a609e613-8507-48f4-ab31-6ab137680d8d""#,
            r#""id": """#,
        );
        assert_ne!(text, REAL_RESPONSE, "the fixture must actually change");
        let overview: Overview = serde_json::from_str(&text).unwrap();
        let error = overview.validate().unwrap_err();
        assert!(error.detail.contains("empty id"), "{error}");
    }

    #[test]
    fn pending_are_ordered_newest_first_with_a_stable_tiebreak() {
        let make = |id: &str, at: &str| Message {
            id: id.to_string(),
            user_id: "demo-user".to_string(),
            title: "t".to_string(),
            message: "m".to_string(),
            channel: "mobile_push".to_string(),
            status: "pending".to_string(),
            created_at: at.to_string(),
            acknowledged_at: None,
        };
        let messages = vec![
            make("b", "2026-09-15T12:00:00.000Z"),
            make("a", "2026-09-15T13:00:00.000Z"),
            make("c", "2026-09-15T12:00:00.000Z"),
        ];
        let ordered: Vec<&str> = pending_sorted(&messages)
            .iter()
            .map(|m| m.id.as_str())
            .collect();
        assert_eq!(ordered, vec!["a", "b", "c"], "newest first, ties by id");
    }

    #[test]
    fn channel_labels_cover_every_known_channel() {
        for channel in CHANNELS {
            assert_ne!(
                channel_label(channel),
                channel,
                "{channel} should have a label"
            );
        }
        assert_eq!(channel_label("something_else"), "something_else");
    }

    #[test]
    fn ack_path_encodes_path_characters() {
        assert_eq!(ack_path("abc-123"), "/client/inbox/abc-123/ack");
        // An unencoded slash would address a different route entirely.
        assert_eq!(ack_path("a/b"), "/client/inbox/a%2Fb/ack");
    }

    #[test]
    fn urls_are_derived_from_the_event_endpoint() {
        let (overview, origin) = inbox_urls("https://47.104.73.144:18443/v1/core/events").unwrap();
        assert_eq!(
            overview,
            "https://47.104.73.144:18443/client/inbox/overview"
        );
        assert_eq!(origin, "https://47.104.73.144:18443");
    }

    #[test]
    fn urls_are_refused_for_a_non_url() {
        assert!(inbox_urls("").is_none());
        assert!(inbox_urls("relay.example/x").is_none());
        assert!(inbox_urls("https://").is_none());
    }
}
