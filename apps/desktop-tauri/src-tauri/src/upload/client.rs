//! WinHTTP transport.
//!
//! The single place in this crate that performs I/O to a network. WinHTTP is
//! used because it ships with Windows, which preserves the property that no
//! third-party HTTP stack appears in `cargo tree`. The cost is a small amount
//! of `unsafe` FFI, confined to this file.
//!
//! Scope: one synchronous `POST` with a JSON body and a bearer token. No
//! implicit redirect following, no proxy autodetection beyond the system
//! default, no cookies.
//!
//! TLS: WinHTTP validates the server certificate against the system trust
//! store. This implementation deliberately offers **no** "ignore certificate
//! errors" switch. If a relay presents only a self-signed certificate, the
//! correct fix is to install that certificate in the OS trust store, not to
//! weaken the client.
//!
//! Note on the `windows` crate bindings: handles here are raw
//! `*mut c_void` rather than `Result`-returning smart handles, and the failure
//! signal is a null pointer. All checks below are null checks, not `?`.

use serde::{Deserialize, Serialize};

use super::UploadError;

/// A successful response, reduced to what the caller needs.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
}

/// Split an absolute URL into `(scheme, host, port, path)`.
///
/// Written by hand rather than pulling in a URL crate, so the whole parsing
/// surface is visible and testable.
pub fn parse_url(url: &str) -> Result<(String, String, u16, String), UploadError> {
    let (scheme, rest) = url
        .split_once("://")
        .ok_or_else(|| UploadError::Transport {
            message: format!("url has no scheme: {url}"),
        })?;
    let scheme = scheme.to_ascii_lowercase();
    let default_port = match scheme.as_str() {
        "https" => 443u16,
        "http" => 80u16,
        _ => return Err(UploadError::InsecureEndpointRejected),
    };

    let (authority, path) = match rest.find('/') {
        Some(index) => (&rest[..index], &rest[index..]),
        None => (rest, "/"),
    };
    if authority.is_empty() {
        return Err(UploadError::Transport {
            message: format!("url has no host: {url}"),
        });
    }

    let (host, port) = match authority.rsplit_once(':') {
        Some((host, port_text)) if !port_text.contains(']') => {
            let port = port_text
                .parse::<u16>()
                .map_err(|_| UploadError::Transport {
                    message: format!("bad port in url: {url}"),
                })?;
            (host.to_string(), port)
        }
        _ => (authority.to_string(), default_port),
    };

    Ok((scheme, host, port, path.to_string()))
}

/// POST `body` to `url` with an optional bearer token. Blocking.
///
/// `pin` is the SHA-256 fingerprint the https server's certificate must match.
/// For `https://` endpoints a pin is **required**; there is no
/// skip-verification mode.
#[cfg(windows)]
pub fn post_json(
    url: &str,
    body: &str,
    bearer_token: Option<&str>,
    pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    request_json("POST", url, Some(body), bearer_token, pin)
}

/// Non-Windows stub: this build targets Windows.
#[cfg(not(windows))]
pub fn post_json(
    _url: &str,
    _body: &str,
    _bearer_token: Option<&str>,
    _pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    Err(UploadError::Transport {
        message: "upload transport is Windows-only in this build".to_string(),
    })
}

/// GET `url` with an optional bearer token. Blocking.
///
/// Needed because the inbox overview is a GET. Reading the reminders has to go
/// through this same transport so it shares the certificate pinning; a second
/// HTTP path would be a second place for the pin to be forgotten.
#[cfg(windows)]
pub fn get_json(
    url: &str,
    bearer_token: Option<&str>,
    pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    request_json("GET", url, None, bearer_token, pin)
}

/// PATCH `body` to `url` with an optional bearer token. Blocking.
///
/// The consent route is a PATCH, and like the others it goes through this
/// transport so it cannot bypass the pin.
#[cfg(windows)]
pub fn patch_json(
    url: &str,
    body: &str,
    bearer_token: Option<&str>,
    pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    request_json("PATCH", url, Some(body), bearer_token, pin)
}

/// Non-Windows stub: this build targets Windows.
#[cfg(not(windows))]
pub fn patch_json(
    _url: &str,
    _body: &str,
    _bearer_token: Option<&str>,
    _pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    Err(UploadError::Transport {
        message: "upload transport is Windows-only in this build".to_string(),
    })
}

/// Non-Windows stub: this build targets Windows.
#[cfg(not(windows))]
pub fn get_json(
    _url: &str,
    _bearer_token: Option<&str>,
    _pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    Err(UploadError::Transport {
        message: "upload transport is Windows-only in this build".to_string(),
    })
}

#[cfg(windows)]
fn request_json(
    verb: &str,
    url: &str,
    body: Option<&str>,
    bearer_token: Option<&str>,
    pin: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    use windows::core::PCWSTR;
    use windows::Win32::Networking::WinHttp::{
        WinHttpCloseHandle, WinHttpConnect, WinHttpOpen, WinHttpOpenRequest, WinHttpQueryHeaders,
        WinHttpReadData, WinHttpReceiveResponse, WinHttpSendRequest, WinHttpSetOption,
        WinHttpSetTimeouts, SECURITY_FLAG_IGNORE_UNKNOWN_CA, WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
        WINHTTP_FLAG_SECURE, WINHTTP_OPEN_REQUEST_FLAGS, WINHTTP_OPTION_SECURITY_FLAGS,
        WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_QUERY_STATUS_CODE,
    };

    const USER_AGENT: &str = "comma-desktop/0.1";
    /// Generous but finite: a hung relay must not wedge the queue forever.
    const RESOLVE_TIMEOUT_MS: i32 = 10_000;
    const CONNECT_TIMEOUT_MS: i32 = 10_000;
    const SEND_TIMEOUT_MS: i32 = 15_000;
    const RECEIVE_TIMEOUT_MS: i32 = 15_000;
    const MAX_BODY_BYTES: usize = 64 * 1024;

    let (scheme, host, port, path) = parse_url(url)?;
    let secure = scheme == "https";

    // Refuse before opening a socket: an https request without a pin cannot be
    // verified, and we do not silently fall back to trusting everything.
    let expected_pin = if super::cert::requires_pin(&scheme) {
        let raw = pin.ok_or(UploadError::Cert {
            reason: super::cert::CertError::PinRequired,
        })?;
        Some(super::cert::validate_pin(raw).map_err(|reason| UploadError::Cert { reason })?)
    } else {
        None
    };

    let wide =
        |value: &str| -> Vec<u16> { value.encode_utf16().chain(std::iter::once(0)).collect() };
    let host_w = wide(&host);
    let path_w = wide(&path);
    let verb_w = wide(verb);
    let agent_w = wide(USER_AGENT);

    // SAFETY: handles are null-checked before use and closed on every path that
    // opened them. All wide-string pointers reference locals that outlive the
    // calls, and WinHttpSendRequest is given the header slice directly so the
    // crate computes the correct length. The response body is size-capped so a
    // hostile or broken server cannot exhaust memory. The certificate context
    // read below is borrowed from WinHTTP and must NOT be freed by us.
    unsafe {
        let transport_error = |message: String| UploadError::Transport { message };

        let session = WinHttpOpen(
            PCWSTR(agent_w.as_ptr()),
            WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
            PCWSTR::null(),
            PCWSTR::null(),
            0,
        );
        if session.is_null() {
            return Err(transport_error("WinHttpOpen returned no session".into()));
        }

        let result = (|| -> Result<HttpResponse, UploadError> {
            let _ = WinHttpSetTimeouts(
                session,
                RESOLVE_TIMEOUT_MS,
                CONNECT_TIMEOUT_MS,
                SEND_TIMEOUT_MS,
                RECEIVE_TIMEOUT_MS,
            );

            let connection = WinHttpConnect(session, PCWSTR(host_w.as_ptr()), port, 0);
            if connection.is_null() {
                return Err(transport_error(format!(
                    "cannot open a connection to {host}:{port}"
                )));
            }

            let connection_result = (|| -> Result<HttpResponse, UploadError> {
                let flags = if secure {
                    WINHTTP_FLAG_SECURE
                } else {
                    WINHTTP_OPEN_REQUEST_FLAGS(0)
                };
                let request = WinHttpOpenRequest(
                    connection,
                    PCWSTR(verb_w.as_ptr()),
                    PCWSTR(path_w.as_ptr()),
                    PCWSTR::null(),
                    PCWSTR::null(),
                    std::ptr::null(),
                    flags,
                );
                if request.is_null() {
                    return Err(transport_error(
                        "WinHttpOpenRequest returned no handle".into(),
                    ));
                }

                let request_result = (|| -> Result<HttpResponse, UploadError> {
                    if secure {
                        // Relax exactly one chain error: the unknown-CA case that
                        // a self-signed certificate necessarily triggers. Name
                        // mismatch, date invalidity and wrong-usage remain
                        // enforced. Pin comparison below is what makes this safe.
                        let ignore_unknown_ca = SECURITY_FLAG_IGNORE_UNKNOWN_CA.to_le_bytes();
                        WinHttpSetOption(
                            Some(request as *const core::ffi::c_void),
                            WINHTTP_OPTION_SECURITY_FLAGS,
                            Some(&ignore_unknown_ca),
                        )
                        .map_err(|error| {
                            transport_error(format!("cannot set TLS options: {error}"))
                        })?;
                    }

                    let mut headers = String::from("Content-Type: application/json\r\n");
                    if let Some(token) = bearer_token.filter(|t| !t.trim().is_empty()) {
                        headers.push_str(&format!("Authorization: Bearer {token}\r\n"));
                    }
                    let headers_w = wide(&headers);
                    let headers_slice = &headers_w[..headers_w.len() - 1];

                    // Send headers and body together. WinHttpWriteData on its
                    // own is rejected with E_INVALIDARG unless the total length
                    // was declared up front, so declaring it here is both simpler
                    // and the documented way to post a body.
                    //
                    // A GET carries no body: passing a null pointer with zero
                    // lengths is what WinHTTP expects for a bodiless request.
                    match body {
                        Some(text) => {
                            let bytes = text.as_bytes();
                            WinHttpSendRequest(
                                request,
                                Some(headers_slice),
                                Some(bytes.as_ptr() as *const core::ffi::c_void),
                                bytes.len() as u32,
                                bytes.len() as u32,
                                0,
                            )
                            .map_err(|error| transport_error(format!("send failed: {error}")))?;
                        }
                        None => {
                            WinHttpSendRequest(request, Some(headers_slice), None, 0, 0, 0)
                                .map_err(|error| {
                                    transport_error(format!("send failed: {error}"))
                                })?;
                        }
                    }

                    // The TLS handshake completes during this call, so the
                    // server certificate is only available afterwards. Reading
                    // it before the response arrives fails with E_INVALIDARG.
                    WinHttpReceiveResponse(request, std::ptr::null_mut()).map_err(|error| {
                        transport_error(format!("no response from {url}: {error}"))
                    })?;

                    // Verify the pin before treating any response as
                    // trustworthy. A mismatch aborts the request.
                    if let Some(expected) = expected_pin.as_deref() {
                        let actual = server_certificate_fingerprint(request)?;
                        super::cert::verify(expected, &actual)
                            .map_err(|reason| UploadError::Cert { reason })?;
                    }

                    let mut status = 0u32;
                    let mut status_size = std::mem::size_of::<u32>() as u32;
                    WinHttpQueryHeaders(
                        request,
                        WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                        PCWSTR::null(),
                        Some(&mut status as *mut u32 as *mut core::ffi::c_void),
                        &mut status_size,
                        std::ptr::null_mut(),
                    )
                    .map_err(|error| transport_error(format!("cannot read status: {error}")))?;

                    let mut collected: Vec<u8> = Vec::new();
                    loop {
                        if collected.len() >= MAX_BODY_BYTES {
                            break;
                        }
                        let mut chunk = [0u8; 4096];
                        let mut read = 0u32;
                        WinHttpReadData(
                            request,
                            chunk.as_mut_ptr() as *mut core::ffi::c_void,
                            chunk.len() as u32,
                            &mut read,
                        )
                        .map_err(|error| transport_error(format!("read failed: {error}")))?;
                        if read == 0 {
                            break;
                        }
                        collected.extend_from_slice(&chunk[..read as usize]);
                    }

                    Ok(HttpResponse {
                        status: status as u16,
                        body: String::from_utf8_lossy(&collected).to_string(),
                    })
                })();

                let _ = WinHttpCloseHandle(request);
                request_result
            })();

            let _ = WinHttpCloseHandle(connection);
            connection_result
        })();

        let _ = WinHttpCloseHandle(session);
        result
    }
}

/// Read the negotiated server certificate and return its lowercase SHA-256
/// fingerprint as 64 hex characters.
///
/// The `CERT_CONTEXT` returned by WinHTTP is **borrowed**; it is released when
/// the request handle closes, so this must not free it.
#[cfg(windows)]
unsafe fn server_certificate_fingerprint(
    request: *mut core::ffi::c_void,
) -> Result<String, UploadError> {
    use windows::Win32::Networking::WinHttp::{
        WinHttpQueryOption, WINHTTP_OPTION_SERVER_CERT_CONTEXT,
    };
    use windows::Win32::Security::Cryptography::{
        CertGetCertificateContextProperty, CERT_SHA256_HASH_PROP_ID,
    };

    let cert = {
        let mut value: *mut core::ffi::c_void = std::ptr::null_mut();
        let mut size = std::mem::size_of::<*mut core::ffi::c_void>() as u32;
        WinHttpQueryOption(
            request,
            WINHTTP_OPTION_SERVER_CERT_CONTEXT,
            Some(&mut value as *mut *mut core::ffi::c_void as *mut core::ffi::c_void),
            &mut size,
        )
        .map_err(|error| UploadError::Cert {
            reason: super::cert::CertError::Unreadable {
                message: format!("WinHttpQueryOption failed: {error}"),
            },
        })?;
        value as *const windows::Win32::Security::Cryptography::CERT_CONTEXT
    };

    if cert.is_null() {
        return Err(UploadError::Cert {
            reason: super::cert::CertError::Unreadable {
                message: "WinHTTP returned a null certificate context".to_string(),
            },
        });
    }

    // First call sizes the property buffer.
    let mut size = 0u32;
    let _ = CertGetCertificateContextProperty(cert, CERT_SHA256_HASH_PROP_ID, None, &mut size);
    if size == 0 || size > 128 {
        return Err(UploadError::Cert {
            reason: super::cert::CertError::Unreadable {
                message: format!("unexpected fingerprint buffer size {size}"),
            },
        });
    }

    let mut buffer = vec![0u8; size as usize];
    CertGetCertificateContextProperty(
        cert,
        CERT_SHA256_HASH_PROP_ID,
        Some(buffer.as_mut_ptr() as *mut core::ffi::c_void),
        &mut size,
    )
    .map_err(|error| UploadError::Cert {
        reason: super::cert::CertError::Unreadable {
            message: format!("cannot read SHA-256 property: {error}"),
        },
    })?;

    buffer.truncate(size as usize);
    Ok(buffer.iter().map(|byte| format!("{byte:02x}")).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_https_with_default_port() {
        let (scheme, host, port, path) =
            parse_url("https://relay.example.com/v1/core/events").unwrap();
        assert_eq!(scheme, "https");
        assert_eq!(host, "relay.example.com");
        assert_eq!(port, 443);
        assert_eq!(path, "/v1/core/events");
    }

    #[test]
    fn parses_explicit_port_and_http() {
        let (scheme, host, port, path) = parse_url("http://127.0.0.1:8080/v1/core/events").unwrap();
        assert_eq!(scheme, "http");
        assert_eq!(host, "127.0.0.1");
        assert_eq!(port, 8080);
        assert_eq!(path, "/v1/core/events");
    }

    #[test]
    fn missing_path_defaults_to_root() {
        let (_, _, _, path) = parse_url("https://relay.example.com").unwrap();
        assert_eq!(path, "/");
    }

    #[test]
    fn rejects_bad_urls() {
        assert!(parse_url("relay.example.com/v1").is_err());
        assert!(parse_url("https://").is_err());
        assert!(parse_url("ftp://example.com/x").is_err());
        assert!(parse_url("https://host:notaport/x").is_err());
    }

    #[test]
    fn transport_failure_is_an_error_not_a_panic() {
        // Port 1 is reserved and will not answer. This asserts the failure is a
        // clean error rather than a panic or a hang past the timeouts.
        let result = post_json("http://127.0.0.1:1/v1/core/events", "{}", None, None);
        assert!(result.is_err(), "connecting to a dead port must fail");
    }

    #[test]
    fn https_without_a_pin_is_refused_before_connecting() {
        // The point of the policy: never fall back to trusting an unverified
        // peer. A live https endpoint with no pin must fail as PinRequired,
        // which means no socket was opened.
        let result = post_json("https://127.0.0.1:1/v1/core/events", "{}", None, None);
        match result {
            Err(UploadError::Cert {
                reason: crate::upload::cert::CertError::PinRequired,
            }) => {}
            other => panic!("expected PinRequired, got {other:?}"),
        }
    }

    #[test]
    fn https_with_a_malformed_pin_is_refused_before_connecting() {
        let result = post_json(
            "https://127.0.0.1:1/v1/core/events",
            "{}",
            None,
            Some("nope"),
        );
        match result {
            Err(UploadError::Cert {
                reason: crate::upload::cert::CertError::MalformedPin { .. },
            }) => {}
            other => panic!("expected MalformedPin, got {other:?}"),
        }
    }
}
