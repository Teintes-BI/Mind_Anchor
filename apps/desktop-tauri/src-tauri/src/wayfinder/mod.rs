//! Wayfinder client.
//!
//! Six operations, matching what the Electron client already does, so the Tauri
//! port is a replacement rather than a redefinition:
//!
//!   refresh      - read consent grants, situations, and the active one's options
//!   grantConsent - PATCH the consent for this device
//!   capture      - POST a manual note, which creates or updates a situation
//!   confirm      - confirm a situation, which generates options
//!   selectOption - record a decision for one option
//!
//! Every literal below (enum members, field names) was confirmed against the
//! running relay rather than read off a schema and assumed: `retentionClass`
//! and `kind` were discovered by sending a deliberately invalid value and
//! letting the server's validation name the legal set.
//!
//! Consent is checked before capture, client-side, because the server's refusal
//! is a 403 that says nothing about what to do next. The rule mirrors the
//! server's: a grant whose status is `granted` must exist.

use serde::{Deserialize, Serialize};

/// This device's identity in the Wayfinder consent record.
pub const SOURCE_DEVICE_ID: &str = "desktop-comma";

/// The retention class used for a note the user types by hand.
///
/// `summary` rather than `ephemeral` because the point of capturing a note is
/// to still have it when the options are generated, and not
/// `long_term_candidate` because that is a decision the user has not made.
pub const DEFAULT_RETENTION_CLASS: &str = "summary";

/// Consent purpose and scope, matching the Electron client.
pub const CONSENT_PURPOSE: &str = "wayfinder_context";
pub const CONSENT_SCOPE: &str = "manual_notes";

/// Storage policy declared alongside the consent.
///
/// `local_only` is the conservative default: the relay may pass the derived text
/// to a configured model provider only if the user chooses otherwise.
pub const CONSENT_MODEL_SHARING: &str = "local_only";

/// One consent grant.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConsentGrant {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub source: String,
    pub purpose: String,
    pub scope: String,
    pub status: String,
}

impl ConsentGrant {
    /// Whether this grant actually permits capturing.
    ///
    /// Also requires the purpose and scope to match: a grant for a different
    /// purpose would satisfy the server's `assertGranted` for the ref but would
    /// not be what the user agreed to here.
    pub fn permits_capture(&self) -> bool {
        self.status == "granted" && self.purpose == CONSENT_PURPOSE && self.scope == CONSENT_SCOPE
    }
}

/// The consent list response.
#[derive(Debug, Clone, Deserialize)]
pub struct ConsentList {
    pub grants: Vec<ConsentGrant>,
}

impl ConsentList {
    /// The grant this app should cite when capturing, if there is one.
    pub fn active_grant(&self) -> Option<&ConsentGrant> {
        self.grants
            .iter()
            .find(|grant| grant.source == SOURCE_DEVICE_ID && grant.permits_capture())
    }
}

/// A captured situation awaiting confirmation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Situation {
    pub id: String,
    pub status: String,
    pub summary: String,
    #[serde(rename = "riskLevel")]
    pub risk_level: String,
}

impl Situation {
    /// Whether the user still has to confirm or dismiss this.
    pub fn awaits_confirmation(&self) -> bool {
        self.status == "awaiting_confirmation"
    }

    /// Whether this situation still has something to do.
    ///
    /// A confirmed situation is actionable because confirming is what generates
    /// the options; a dismissed one is not.
    pub fn is_actionable(&self) -> bool {
        self.status == "awaiting_confirmation" || self.status == "confirmed"
    }
}

/// A proposed option.
///
/// Deliberately not named `Option`: that would shadow the standard enum
/// throughout this module and in every file that imports it, which turned every
/// `Option<T>` in the Wayfinder commands into a type error.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DecisionOption {
    pub id: String,
    pub status: String,
    pub action: String,
    #[serde(rename = "firstStep")]
    pub first_step: String,
    pub rationale: String,
    #[serde(rename = "riskLevel", default)]
    pub risk_level: String,
    #[serde(rename = "requiresApproval", default)]
    pub requires_approval: bool,
}

impl DecisionOption {
    /// Whether this option can still be chosen.
    pub fn is_selectable(&self) -> bool {
        self.status == "proposed"
    }
}

/// Response of the situations list.
#[derive(Debug, Clone, Deserialize)]
pub struct SituationList {
    pub situations: Vec<Situation>,
}

impl SituationList {
    /// The situation to work on: the newest one that is still actionable.
    ///
    /// Actionable means awaiting confirmation *or* already confirmed. Filtering
    /// to `awaiting_confirmation` alone was a bug: options are generated by
    /// confirming, so a confirmed situation is exactly the one whose options the
    /// user needs to choose from. Excluding it made those options unreachable and
    /// left the panel with nothing to act on.
    ///
    /// Dismissed situations are excluded - the user has already declined them.
    ///
    /// The newest, because the server's order is not specified and acting on a
    /// stale situation is not what the user just asked for.
    pub fn active(&self) -> Option<&Situation> {
        self.situations
            .iter()
            .rfind(|situation| situation.is_actionable())
    }
}

/// Response of the capture call.
#[derive(Debug, Clone, Deserialize)]
pub struct CaptureResult {
    pub situation: Option<Situation>,
}

/// Response of the confirm call.
#[derive(Debug, Clone, Deserialize)]
pub struct ConfirmResult {
    pub situation: Option<Situation>,
    #[serde(default)]
    pub options: Vec<DecisionOption>,
}

/// Response of the options list.
#[derive(Debug, Clone, Deserialize)]
pub struct OptionList {
    pub status: String,
    #[serde(default)]
    pub options: Vec<DecisionOption>,
}

/// Body for PATCH /wayfinder/consent/:source.
pub fn consent_body() -> String {
    serde_json::json!({
        "purpose": CONSENT_PURPOSE,
        "scope": CONSENT_SCOPE,
        "status": "granted",
        "rawRetentionSeconds": 0,
        "derivedRetentionDays": 30,
        "modelSharing": CONSENT_MODEL_SHARING,
    })
    .to_string()
}

/// Body for POST /wayfinder/events.
///
/// `rawRetentionSeconds: 0` in the consent means nothing raw is stored, which is
/// why only a derived summary is sent.
pub fn capture_body(consent_ref: &str, note: &str, now_iso: &str, trace_id: &str) -> String {
    serde_json::json!({
        "sourceDeviceId": SOURCE_DEVICE_ID,
        "kind": "manual_note",
        "occurredAt": now_iso,
        "confidence": 0.8,
        "consentRef": consent_ref,
        "retentionClass": DEFAULT_RETENTION_CLASS,
        "traceId": trace_id,
        "payload": { "note": note },
    })
    .to_string()
}

/// Body for POST /wayfinder/situations/:id/confirm.
pub fn confirm_body(trace_id: &str) -> String {
    serde_json::json!({ "status": "confirmed", "traceId": trace_id }).to_string()
}

/// Body for POST /wayfinder/decisions.
///
/// `actionStatus` must be one of not_started | in_progress | completed |
/// abandoned. The relay named that set in a 400 when this sent "planned", which
/// is not a member. `not_started` is the honest value: recording the decision is
/// not the same as having begun the action.
pub fn decision_body(situation_id: &str, option_id: &str, trace_id: &str) -> String {
    serde_json::json!({
        "situationId": situation_id,
        "selectedOptionId": option_id,
        "actionStatus": "not_started",
        "traceId": trace_id,
    })
    .to_string()
}

/// Path for the consent PATCH, with the source percent-encoded.
pub fn consent_path() -> String {
    format!("/wayfinder/consent/{}", percent_encode(SOURCE_DEVICE_ID))
}

/// Percent-encode so a source containing `/` cannot address another route.
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

/// Build a URL under the relay origin.
pub fn url(origin: &str, path: &str) -> String {
    format!("{origin}{path}")
}

/// The origin of the configured endpoint, or `None` if it is not a URL.
///
/// Shared with the inbox: one configured endpoint covers every relay feature.
pub fn origin_of(endpoint: &str) -> Option<String> {
    let trimmed = endpoint.trim();
    let scheme_end = trimmed.find("://")? + 3;
    let rest = &trimmed[scheme_end..];
    let origin_end = rest
        .find('/')
        .map(|i| scheme_end + i)
        .unwrap_or(trimmed.len());
    if origin_end <= scheme_end {
        return None;
    }
    Some(trimmed[..origin_end].to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A grant copied from the relay's actual response.
    const REAL_GRANT: &str = r#"{
        "id": "44b6849b-c711-4fd5-822a-b9e4bff6f8d0",
        "userId": "demo-user",
        "source": "desktop-comma",
        "purpose": "wayfinder_context",
        "scope": "manual_notes",
        "status": "granted",
        "rawRetentionSeconds": 0,
        "derivedRetentionDays": 30,
        "modelSharing": "local_only",
        "grantedAt": "2026-09-15T13:24:40.662Z",
        "updatedAt": "2026-09-15T13:24:40.662Z",
        "traceId": "5c5c282c-dfc3-4535-9bbc-f3e88496352a"
    }"#;

    /// A situation copied from the relay's actual response.
    const REAL_SITUATION: &str = r#"{
        "id": "1a854970-0ace-4422-8943-5b48fd3b1d8b",
        "userId": "demo-user",
        "eventIds": ["fd8fdeb8-f8ef-452e-b1e3-c905561ff4a2"],
        "status": "awaiting_confirmation",
        "summary": "manual_note detected from desktop-comma",
        "uncertainty": [],
        "linkedGoalIds": [],
        "linkedTaskIds": [],
        "riskLevel": "low",
        "createdAt": "2026-09-15T13:25:02.357Z",
        "updatedAt": "2026-09-15T13:25:02.357Z",
        "traceId": "probe"
    }"#;

    #[test]
    fn parses_the_real_consent_grant() {
        let grant: ConsentGrant = serde_json::from_str(REAL_GRANT).unwrap();
        assert_eq!(grant.source, "desktop-comma");
        assert_eq!(grant.status, "granted");
        assert!(grant.permits_capture());
    }

    #[test]
    fn extra_fields_on_a_grant_are_ignored() {
        // The real response carries retention, timestamps and a trace id that
        // this client does not model; they must not break parsing.
        let grant: ConsentGrant = serde_json::from_str(REAL_GRANT).unwrap();
        assert_eq!(grant.id, "44b6849b-c711-4fd5-822a-b9e4bff6f8d0");
    }

    #[test]
    fn a_grant_for_another_purpose_does_not_permit_capture() {
        let text = REAL_GRANT.replace(
            r#""purpose": "wayfinder_context""#,
            r#""purpose": "health""#,
        );
        assert_ne!(text, REAL_GRANT, "the fixture must actually change");
        let grant: ConsentGrant = serde_json::from_str(&text).unwrap();
        assert!(
            !grant.permits_capture(),
            "a grant for a different purpose is not consent for this"
        );
    }

    #[test]
    fn a_revoked_grant_does_not_permit_capture() {
        let text = REAL_GRANT.replace(r#""status": "granted""#, r#""status": "revoked""#);
        assert_ne!(text, REAL_GRANT, "the fixture must actually change");
        let grant: ConsentGrant = serde_json::from_str(&text).unwrap();
        assert!(!grant.permits_capture());
    }

    #[test]
    fn an_empty_consent_list_has_no_active_grant() {
        let list: ConsentList = serde_json::from_str(r#"{"grants":[]}"#).unwrap();
        assert!(list.active_grant().is_none());
    }

    #[test]
    fn a_grant_from_another_device_is_not_used() {
        let text = REAL_GRANT.replace(r#""source": "desktop-comma""#, r#""source": "some-phone""#);
        assert_ne!(text, REAL_GRANT, "the fixture must actually change");
        let list: ConsentList = serde_json::from_str(&format!(r#"{{"grants":[{text}]}}"#)).unwrap();
        assert!(
            list.active_grant().is_none(),
            "another device's grant is not ours"
        );
    }

    #[test]
    fn the_real_grant_is_selected_from_a_list() {
        let list: ConsentList =
            serde_json::from_str(&format!(r#"{{"grants":[{REAL_GRANT}]}}"#)).unwrap();
        assert_eq!(
            list.active_grant().map(|g| g.id.as_str()),
            Some("44b6849b-c711-4fd5-822a-b9e4bff6f8d0")
        );
    }

    #[test]
    fn parses_the_real_situation() {
        let situation: Situation = serde_json::from_str(REAL_SITUATION).unwrap();
        assert_eq!(situation.risk_level, "low");
        assert!(situation.awaits_confirmation());
    }

    #[test]
    fn a_confirmed_situation_no_longer_awaits_confirmation() {
        let text = REAL_SITUATION.replace(
            r#""status": "awaiting_confirmation""#,
            r#""status": "confirmed""#,
        );
        assert_ne!(text, REAL_SITUATION, "the fixture must actually change");
        let situation: Situation = serde_json::from_str(&text).unwrap();
        assert!(!situation.awaits_confirmation());
    }

    #[test]
    fn the_active_situation_is_the_newest_actionable_one() {
        let older = REAL_SITUATION.replace("1a854970-0ace-4422-8943-5b48fd3b1d8b", "older");
        let dismissed = REAL_SITUATION
            .replace("1a854970-0ace-4422-8943-5b48fd3b1d8b", "dismissed")
            .replace(
                r#""status": "awaiting_confirmation""#,
                r#""status": "dismissed""#,
            );
        let list: SituationList =
            serde_json::from_str(&format!(r#"{{"situations":[{older},{dismissed}]}}"#)).unwrap();
        // Dismissed is skipped even though it comes later.
        assert_eq!(list.active().map(|s| s.id.as_str()), Some("older"));
    }

    #[test]
    fn a_confirmed_situation_is_still_actionable() {
        // The regression this guards: a confirmed situation is exactly the one
        // whose options the user must choose from, because confirming is what
        // generates them. Treating it as inactive made those options unreachable.
        let text = REAL_SITUATION.replace(
            r#""status": "awaiting_confirmation""#,
            r#""status": "confirmed""#,
        );
        assert_ne!(text, REAL_SITUATION, "the fixture must actually change");
        let situation: Situation = serde_json::from_str(&text).unwrap();
        assert!(!situation.awaits_confirmation());
        assert!(
            situation.is_actionable(),
            "a confirmed situation must remain actionable"
        );

        let list: SituationList =
            serde_json::from_str(&format!(r#"{{"situations":[{text}]}}"#)).unwrap();
        assert_eq!(
            list.active().map(|s| s.id.as_str()),
            Some(situation.id.as_str())
        );
    }

    #[test]
    fn a_dismissed_situation_is_not_actionable() {
        let text = REAL_SITUATION.replace(
            r#""status": "awaiting_confirmation""#,
            r#""status": "dismissed""#,
        );
        assert_ne!(text, REAL_SITUATION, "the fixture must actually change");
        let situation: Situation = serde_json::from_str(&text).unwrap();
        assert!(!situation.is_actionable());
    }

    #[test]
    fn no_actionable_situation_means_nothing_active() {
        let done = REAL_SITUATION.replace(
            r#""status": "awaiting_confirmation""#,
            r#""status": "dismissed""#,
        );
        let list: SituationList =
            serde_json::from_str(&format!(r#"{{"situations":[{done}]}}"#)).unwrap();
        assert!(list.active().is_none());
    }

    #[test]
    fn parses_a_proposed_option() {
        let text = r#"{
            "id": "opt-1",
            "status": "proposed",
            "action": "把收件箱提醒改成一句话",
            "firstStep": "打开面板",
            "rationale": "降低理解成本",
            "riskLevel": "low",
            "requiresApproval": false
        }"#;
        let option: DecisionOption = serde_json::from_str(text).unwrap();
        assert!(option.is_selectable());
        assert_eq!(option.first_step, "打开面板");
    }

    #[test]
    fn a_superseded_option_is_not_selectable() {
        let text =
            r#"{"id":"o","status":"superseded","action":"a","firstStep":"b","rationale":"c"}"#;
        let option: DecisionOption = serde_json::from_str(text).unwrap();
        assert!(!option.is_selectable());
        // Absent risk fields default rather than failing to parse.
        assert_eq!(option.risk_level, "");
        assert!(!option.requires_approval);
    }

    #[test]
    fn a_confirm_result_with_no_options_parses() {
        // Dismissing a situation returns an empty options list, and the client
        // must not treat that as a parse failure.
        let text = format!(
            r#"{{"situation":{REAL_SITUATION},"options":[],"fastStatus":"completed","fullStatus":"cancelled"}}"#
        );
        let result: ConfirmResult = serde_json::from_str(&text).unwrap();
        assert!(result.options.is_empty());
        assert!(result.situation.is_some());
    }

    #[test]
    fn a_capture_result_parses() {
        let text = format!(r#"{{"situation":{REAL_SITUATION}}}"#);
        let result: CaptureResult = serde_json::from_str(&text).unwrap();
        assert_eq!(
            result.situation.unwrap().id,
            "1a854970-0ace-4422-8943-5b48fd3b1d8b"
        );
    }

    #[test]
    fn the_capture_body_uses_the_measured_enums() {
        let body = capture_body("consent-1", "note text", "2026-09-15T13:25:02.000Z", "t");
        let value: serde_json::Value = serde_json::from_str(&body).unwrap();
        // These two were learned from the server's own validation errors.
        assert_eq!(value["retentionClass"], "summary");
        assert_eq!(value["kind"], "manual_note");
        assert_eq!(value["consentRef"], "consent-1");
        assert_eq!(value["payload"]["note"], "note text");
        assert_eq!(value["sourceDeviceId"], SOURCE_DEVICE_ID);
    }

    #[test]
    fn the_consent_body_matches_every_measured_enum() {
        let value: serde_json::Value = serde_json::from_str(&consent_body()).unwrap();
        assert_eq!(value["purpose"], "wayfinder_context");
        assert_eq!(value["scope"], "manual_notes");
        assert_eq!(value["status"], "granted");
        // `local_only` is the conservative member of the measured set.
        assert_eq!(value["modelSharing"], "local_only");
        // Nothing raw is retained, which is what makes the consent meaningful.
        assert_eq!(value["rawRetentionSeconds"], 0);
    }

    #[test]
    fn the_confirm_and_decision_bodies_carry_their_identifiers() {
        let confirm: serde_json::Value = serde_json::from_str(&confirm_body("t")).unwrap();
        assert_eq!(confirm["status"], "confirmed");
        assert_eq!(confirm["traceId"], "t");

        let decision: serde_json::Value =
            serde_json::from_str(&decision_body("sit-1", "opt-1", "t")).unwrap();
        assert_eq!(decision["situationId"], "sit-1");
        assert_eq!(decision["selectedOptionId"], "opt-1");
        // The relay's 400 named the legal set: not_started | in_progress |
        // completed | abandoned. "planned" was rejected, so this asserts
        // membership rather than a remembered string.
        let allowed = ["not_started", "in_progress", "completed", "abandoned"];
        let sent = decision["actionStatus"].as_str().unwrap();
        assert!(
            allowed.contains(&sent),
            "actionStatus {sent:?} is not one of {allowed:?}",
        );
    }

    #[test]
    fn consent_path_encodes_the_source() {
        assert_eq!(consent_path(), "/wayfinder/consent/desktop-comma");
    }

    #[test]
    fn url_joins_origin_and_path() {
        assert_eq!(
            url("https://host:18443", "/wayfinder/consent"),
            "https://host:18443/wayfinder/consent"
        );
    }

    #[test]
    fn origin_is_derived_from_the_endpoint() {
        assert_eq!(
            origin_of("https://47.104.73.144:18443/v1/core/events").as_deref(),
            Some("https://47.104.73.144:18443")
        );
        assert!(origin_of("").is_none());
        assert!(origin_of("no-scheme/x").is_none());
    }
}
