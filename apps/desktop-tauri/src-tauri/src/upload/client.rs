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
#[cfg(windows)]
pub fn post_json(
    url: &str,
    body: &str,
    bearer_token: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    post_json_impl(url, body, bearer_token)
}

/// Non-Windows stub: this build targets Windows.
#[cfg(not(windows))]
pub fn post_json(
    _url: &str,
    _body: &str,
    _bearer_token: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    Err(UploadError::Transport {
        message: "upload transport is Windows-only in this build".to_string(),
    })
}

#[cfg(windows)]
fn post_json_impl(
    url: &str,
    body: &str,
    bearer_token: Option<&str>,
) -> Result<HttpResponse, UploadError> {
    use windows::core::PCWSTR;
    use windows::Win32::Networking::WinHttp::{
        WinHttpCloseHandle, WinHttpConnect, WinHttpOpen, WinHttpOpenRequest, WinHttpQueryHeaders,
        WinHttpReadData, WinHttpReceiveResponse, WinHttpSendRequest, WinHttpSetTimeouts,
        WinHttpWriteData, WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, WINHTTP_FLAG_SECURE,
        WINHTTP_OPEN_REQUEST_FLAGS, WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_QUERY_STATUS_CODE,
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

    let wide =
        |value: &str| -> Vec<u16> { value.encode_utf16().chain(std::iter::once(0)).collect() };
    let host_w = wide(&host);
    let path_w = wide(&path);
    let verb_w = wide("POST");
    let agent_w = wide(USER_AGENT);

    // SAFETY: handles are null-checked before use and closed on every path that
    // opened them. All wide-string pointers reference locals that outlive the
    // calls, and WinHttpSendRequest is given the header slice directly so the
    // crate computes the correct length. The response body is size-capped so a
    // hostile or broken server cannot exhaust memory.
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
                    let mut headers = String::from("Content-Type: application/json\r\n");
                    if let Some(token) = bearer_token.filter(|t| !t.trim().is_empty()) {
                        headers.push_str(&format!("Authorization: Bearer {token}\r\n"));
                    }
                    let headers_w = wide(&headers);
                    // Pass the slice: the crate derives the length. It excludes
                    // the trailing NUL itself when given a slice.
                    let headers_slice = &headers_w[..headers_w.len() - 1];

                    WinHttpSendRequest(request, Some(headers_slice), None, 0, 0, 0)
                        .map_err(|error| transport_error(format!("send failed: {error}")))?;

                    let bytes = body.as_bytes();
                    if !bytes.is_empty() {
                        let mut written = 0u32;
                        WinHttpWriteData(
                            request,
                            Some(bytes.as_ptr() as *const core::ffi::c_void),
                            bytes.len() as u32,
                            &mut written,
                        )
                        .map_err(|error| transport_error(format!("body write failed: {error}")))?;
                    }

                    WinHttpReceiveResponse(request, std::ptr::null_mut()).map_err(|error| {
                        transport_error(format!("no response from {url}: {error}"))
                    })?;

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
        let result = post_json("http://127.0.0.1:1/v1/core/events", "{}", None);
        assert!(result.is_err(), "connecting to a dead port must fail");
    }
}
