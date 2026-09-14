//! Live end-to-end test against the deployed relay.
//!
//! Ignored by default so `cargo test` stays hermetic. Run explicitly:
//!
//! ```text
//! cargo test --test live_relay_test -- --ignored --nocapture
//! ```
//!
//! What this proves that the API-side contract test cannot: that the *Rust*
//! client, over real TLS, with a real bearer token, against the real relay,
//! gets a 201 — and that a wrong pin is refused rather than silently accepted.
//!
//! Requires outbound access to the relay. If it is unreachable the test fails
//! loudly rather than skipping, because a silently skipped network test is how
//! "we verified the transport" becomes false.

use comma_desktop::upload::cert::CertError;
use comma_desktop::upload::client::post_json;
use comma_desktop::upload::UploadError;

/// The relay, and the SHA-256 fingerprint of its (self-signed) certificate.
/// The fingerprint is pinned deliberately: it was read off the server over SSH,
/// independently of the TLS connection being tested.
const RELAY: &str = "https://47.104.73.144:18443/v1/core/events";
const RELAY_PIN: &str =
    "28:26:41:9B:80:E2:5B:78:89:00:2D:A0:1C:B2:64:80:2A:C6:B3:12:4B:5E:EA:4B:65:6E:2B:9E:ED:B5:A2:80";
/// NOTE: the raw token only. `post_json` prepends "Bearer " itself, so passing
/// a prefixed value here would send "Bearer Bearer dev:..." and be rejected.
const TOKEN: &str = "dev:rust-e2e:rust@example.com";

fn body(client_event_id: &str) -> String {
    serde_json::json!({
        "clientEventId": client_event_id,
        "eventType": "activity",
        "occurredAt": "2026-09-14T16:00:00.000Z",
        "source": "desktop",
        "privacyLevel": "P1",
        "confidence": 0.55,
        "payload": {
            "schema": "comma.desktop.activity.v1",
            "sampleCount": 240,
            "decisionCount": 240,
            "eligibleCount": 7,
            "totalIdleSeconds": 7200,
            "hourlyActivity": [[472222, 240]]
        }
    })
    .to_string()
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn rust_client_delivers_over_tls_with_a_pinned_certificate() {
    let response = post_json(RELAY, &body("rust-e2e-001"), Some(TOKEN), Some(RELAY_PIN))
        .expect("upload must succeed with the correct pin");

    println!("live: status={} body={}", response.status, response.body);
    assert!(
        (200..300).contains(&response.status),
        "expected 2xx, got {}: {}",
        response.status,
        response.body
    );
    assert!(
        response.body.contains("rust-e2e-001"),
        "response should echo the clientEventId: {}",
        response.body
    );
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn idempotent_replay_returns_the_same_event() {
    let first = post_json(RELAY, &body("rust-e2e-002"), Some(TOKEN), Some(RELAY_PIN))
        .expect("first upload");
    let second =
        post_json(RELAY, &body("rust-e2e-002"), Some(TOKEN), Some(RELAY_PIN)).expect("replay");

    let id_of = |text: &str| -> String {
        let start = text.find("\"id\":\"").expect("id present") + 6;
        text[start..].split('"').next().unwrap().to_string()
    };

    let a = id_of(&first.body);
    let b = id_of(&second.body);
    println!("live: first={a} replay={b}");
    assert_eq!(a, b, "a retried upload must resolve to the same event");
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn a_wrong_pin_is_refused_and_nothing_is_sent() {
    // A well-formed but different fingerprint must fail. This is the property
    // that makes relaxing the chain check safe.
    let wrong = "00".repeat(32);
    let result = post_json(RELAY, &body("rust-e2e-003"), Some(TOKEN), Some(&wrong));

    match result {
        Err(UploadError::Cert {
            reason: CertError::FingerprintMismatch { .. },
        }) => println!("live: wrong pin correctly refused"),
        other => panic!("a mismatched pin must be refused, got {other:?}"),
    }
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn a_missing_pin_is_refused_before_any_connection() {
    let result = post_json(RELAY, &body("rust-e2e-004"), Some(TOKEN), None);
    match result {
        Err(UploadError::Cert {
            reason: CertError::PinRequired,
        }) => println!("live: missing pin correctly refused"),
        other => panic!("an https endpoint without a pin must be refused, got {other:?}"),
    }
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn p3_is_rejected_by_the_server() {
    let p3 = serde_json::json!({
        "clientEventId": "rust-e2e-p3",
        "eventType": "activity",
        "occurredAt": "2026-09-14T16:00:00.000Z",
        "source": "desktop",
        "privacyLevel": "P3",
        "confidence": 1.0,
        "payload": {}
    })
    .to_string();

    let response = post_json(RELAY, &p3, Some(TOKEN), Some(RELAY_PIN))
        .expect("the request completes; the server decides");
    println!("live: p3 status={} body={}", response.status, response.body);
    assert_eq!(
        response.status, 403,
        "P3 must be refused by the egress guard"
    );
    assert!(response.body.contains("core_p3_egress_blocked"));
}

#[test]
#[ignore = "requires outbound access to the deployed relay"]
fn missing_auth_is_rejected() {
    let response = post_json(RELAY, &body("rust-e2e-005"), None, Some(RELAY_PIN))
        .expect("the request completes; the server decides");
    println!("live: noauth status={}", response.status);
    assert_eq!(response.status, 401);
}
