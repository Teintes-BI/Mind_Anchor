//! Upload boundary — the only place in this crate that can talk to a network.
//!
//! Phase 0 shipped with no network code at all and could prove it by the
//! absence of any HTTP client in the dependency graph. T2 introduces exactly
//! one egress path, and keeps that property intact by using **WinHTTP**, which
//! ships with Windows, instead of vendoring a third-party HTTP stack:
//!
//! ```text
//! cargo tree | grep -E 'reqwest|ureq|isahc|attohttpc|hyper'   # still empty
//! ```
//!
//! What may leave the machine is unchanged from Phase 0: only
//! [`crate::store::sanitize::SanitizedExport`], which carries no app name, no
//! window title, no path and no raw timestamp.
//!
//! Gating is deliberately triple:
//!
//! 1. `CollectionState::enabled` — master collection switch.
//! 2. `CollectionState::upload_enabled` — upload switch. **Defaults to `true`**:
//!    this design assumes a trusted relay server exists, so the mechanism ships
//!    ready.
//! 3. A configured endpoint. With no endpoint there is nothing to send to, and
//!    the code refuses rather than guessing a default host.
//!
//! Endpoint policy: `https://` only, plus loopback `http://` for local testing.
//! A non-loopback plaintext endpoint is rejected so a misconfiguration cannot
//! silently send behavioural data in the clear.

pub mod cert;
pub mod client;
pub mod payload;
pub mod queue;

use serde::{Deserialize, Serialize};

/// Why an upload attempt was refused or failed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UploadError {
    /// Master collection switch is off.
    CollectionDisabled,
    /// The upload switch is off.
    UploadDisabled,
    /// No endpoint configured. Never guessed.
    EndpointNotConfigured,
    /// The endpoint scheme is not permitted by policy.
    InsecureEndpointRejected,
    /// Nothing to send.
    EmptyQueue,
    /// Transport-level failure (DNS, connect, TLS, timeout).
    Transport { message: String },
    /// The server answered with a non-2xx status.
    HttpStatus { status: u16, message: String },
    /// The server answered 2xx but the body was not the expected shape.
    MalformedResponse { message: String },
    /// TLS certificate verification failed (missing pin, or a fingerprint
    /// mismatch). Never a warning: a failed pin means the peer is not trusted.
    Cert { reason: cert::CertError },
}

impl std::fmt::Display for UploadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UploadError::CollectionDisabled => write!(f, "collection is disabled"),
            UploadError::UploadDisabled => write!(f, "upload is disabled"),
            UploadError::EndpointNotConfigured => write!(f, "no endpoint configured"),
            UploadError::InsecureEndpointRejected => {
                write!(f, "endpoint must be https:// (loopback http:// allowed)")
            }
            UploadError::EmptyQueue => write!(f, "nothing to upload"),
            UploadError::Transport { message } => write!(f, "transport error: {message}"),
            UploadError::HttpStatus { status, message } => {
                write!(f, "server returned {status}: {message}")
            }
            UploadError::MalformedResponse { message } => {
                write!(f, "malformed response: {message}")
            }
            UploadError::Cert { reason } => write!(f, "certificate rejected: {reason}"),
        }
    }
}

impl std::error::Error for UploadError {}

/// Validate an endpoint against policy.
///
/// Allowed: `https://` anywhere, and `http://` only for loopback so a
/// developer can run a local receiver without pretending it is production.
pub fn validate_endpoint(endpoint: &str) -> Result<(), UploadError> {
    let trimmed = endpoint.trim();
    if trimmed.is_empty() {
        return Err(UploadError::EndpointNotConfigured);
    }

    if let Some(rest) = trimmed.strip_prefix("https://") {
        if rest.is_empty() {
            return Err(UploadError::InsecureEndpointRejected);
        }
        return Ok(());
    }

    if let Some(rest) = trimmed.strip_prefix("http://") {
        // Loopback only: the port (if any) may follow, but the host must be local.
        let host = rest.split(['/', ':']).next().unwrap_or("");
        if matches!(host, "127.0.0.1" | "localhost" | "[::1]" | "::1") {
            return Ok(());
        }
        return Err(UploadError::InsecureEndpointRejected);
    }

    Err(UploadError::InsecureEndpointRejected)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn https_is_accepted() {
        assert!(validate_endpoint("https://relay.example.com/v1/core/events").is_ok());
        assert!(validate_endpoint("https://192.168.1.10:8443/v1/core/events").is_ok());
    }

    #[test]
    fn loopback_http_is_accepted_for_local_testing() {
        assert!(validate_endpoint("http://127.0.0.1:8080/v1/core/events").is_ok());
        assert!(validate_endpoint("http://localhost:3001/v1/core/events").is_ok());
        assert!(validate_endpoint("http://127.0.0.1/v1/core/events").is_ok());
    }

    #[test]
    fn non_loopback_plaintext_is_rejected() {
        // The case that matters: a misconfigured remote host must not silently
        // receive behavioural data in the clear.
        assert_eq!(
            validate_endpoint("http://relay.example.com/v1/core/events").unwrap_err(),
            UploadError::InsecureEndpointRejected
        );
        assert_eq!(
            validate_endpoint("http://192.168.1.10:3001/v1/core/events").unwrap_err(),
            UploadError::InsecureEndpointRejected
        );
    }

    #[test]
    fn other_schemes_are_rejected() {
        for bad in [
            "ftp://example.com/x",
            "ws://example.com/x",
            "example.com/x",
            "file:///c:/tmp/x",
        ] {
            assert_eq!(
                validate_endpoint(bad).unwrap_err(),
                UploadError::InsecureEndpointRejected,
                "{bad} should be rejected"
            );
        }
    }

    #[test]
    fn empty_endpoint_is_its_own_error() {
        assert_eq!(
            validate_endpoint("").unwrap_err(),
            UploadError::EndpointNotConfigured
        );
        assert_eq!(
            validate_endpoint("   ").unwrap_err(),
            UploadError::EndpointNotConfigured
        );
    }

    #[test]
    fn scheme_only_is_rejected() {
        assert!(validate_endpoint("https://").is_err());
    }
}
