//! Phase 0 entry point.
//!
//! Kept intentionally thin: resolve the local store path, hand it to
//! [`comma_desktop::build_app`], run. All behaviour lives in the library so it
//! stays unit-testable without launching a window.

// Hide the console window in release builds; keep it in debug for logs.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use comma_desktop::store::LocalStore;

fn main() {
    let store_path = std::env::var("COMMA_DESKTOP_DB")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            let mut dir = dirs_fallback();
            dir.push("comma-desktop-phase0.sqlite");
            dir
        });

    if let Some(parent) = store_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    let store = match LocalStore::open(&store_path) {
        Ok(store) => store,
        Err(error) => {
            eprintln!("comma-desktop: cannot open local store: {error}");
            std::process::exit(1);
        }
    };

    comma_desktop::build_app(store)
        .run(tauri::generate_context!())
        .expect("error while running comma desktop");
}

/// Data directory for the local store. Falls back to the working directory if
/// the environment gives us nothing, so the app never fails to start.
fn dirs_fallback() -> std::path::PathBuf {
    if let Ok(appdata) = std::env::var("APPDATA") {
        let mut path = std::path::PathBuf::from(appdata);
        path.push("CommaDesktop");
        return path;
    }
    std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
}
