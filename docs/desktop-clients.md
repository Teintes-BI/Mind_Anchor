# Desktop client foundations

MindAnchor now has two desktop client foundations that share the Wayfinder API:

- **macOS native**: `apps/macos` uses SwiftUI, Keychain-backed auth, local snapshot persistence, and a native Wayfinder workspace. The Today screen exposes the active situation and the Wayfinder destination can switch between recent situations.
- **Windows desktop**: `apps/desktop` uses Electron. Its Wayfinder client is isolated in `wayfinder-client.js` and is exposed through preload IPC, so the renderer never receives an API token. The workspace supports consent, manual capture, confirmation/dismissal, option selection, refresh, and explicit connection/error states.

## Windows setup

Start the API, set `MINDANCHOR_API_URL`, and provide the authenticated token before launching Electron:

```powershell
$env:MINDANCHOR_API_URL = "http://localhost:3001"
$env:MINDANCHOR_API_TOKEN = "<gateway-token>"
corepack pnpm --filter @mindanchor/desktop dev
```

Without `MINDANCHOR_API_TOKEN`, the desktop window still opens and the existing collector/reminder surfaces remain available; the Wayfinder section shows that it is not configured and blocks network actions.

## Shared foundation boundary

The desktop clients intentionally stop at the first usable decision loop:

1. Load consent and active situations.
2. Capture a manual context event after consent.
3. Confirm or dismiss the proposed situation.
4. Load and select a proposed option.

Automatic task creation, external side effects, continuous listening, and background model calls remain outside the client foundation.
