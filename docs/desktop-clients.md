# Desktop client foundations

MindAnchor now has two desktop client foundations that share the Wayfinder API:

- **macOS native**: `apps/macos` uses SwiftUI, Keychain-backed auth, local snapshot persistence, and a native Wayfinder workspace. The Today screen exposes the active situation and the Wayfinder destination can switch between recent situations.
- **Windows desktop**: `apps/desktop-tauri` uses Tauri 2 and Rust. The Wayfinder client lives in `src-tauri/src/wayfinder/` and the inbox in `src-tauri/src/inbox/`; the webview never holds an API token, since every request goes through the Rust side. The workspace supports consent, manual capture, confirmation, option selection, the reminder inbox, refresh, and explicit connection/error states.

  The previous Electron client is retired. It is preserved under the `archive/electron-desktop` tag; restore any file with `git checkout archive/electron-desktop -- apps/desktop`.

## Windows setup

Configure the relay in the app itself (endpoint, bearer token, certificate fingerprint) and start it:

```powershell
corepack pnpm --filter @mindanchor/desktop-tauri dev
```

The relay settings are stored locally and survive a restart. Uploads need the collection and upload switches on; the Wayfinder and inbox panels additionally need a valid token, and will say so when one is missing rather than failing silently.

## Shared foundation boundary

The desktop clients intentionally stop at the first usable decision loop:

1. Load consent and active situations.
2. Capture a manual context event after consent.
3. Confirm or dismiss the proposed situation.
4. Load and select a proposed option.

Automatic task creation, external side effects, continuous listening, and background model calls remain outside the client foundation.
