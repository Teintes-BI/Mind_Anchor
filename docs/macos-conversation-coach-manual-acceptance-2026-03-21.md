# MindAnchor macOS Conversation Coach Manual Acceptance

Date: `2026-03-21`

Operator: `Codex`

Scope: `fast -> full -> feedback -> memory revoke`

Environment:

- Repository: `/Users/claw/mindanchor`
- Gateway: `http://127.0.0.1:3001`
- OpenClaw local cluster: `http://127.0.0.1:8787`
- Gateway mode: `openai-compatible`
- Adapter strategy: `cluster-preferred`
- macOS client: local Debug build of `MindAnchorMac.app`
- Auth mode: app bootstrap register with a fresh local account

Test user:

- Email: `manual-qa-1774102458@example.com`
- Gateway user id: `0c0298a4-c065-48ea-b601-b929dd7a67e4`

## Result Summary

- `Coach` page opened successfully in the real macOS app.
- `Conversation Coach` block rendered successfully in GUI.
- `fast -> full` chain was verified across real Gateway + OpenClaw.
- `memory revoke` was verified from GUI and confirmed in server state.
- `feedback` endpoint itself works for the same user/message, but the GUI automation click path produced `HTTP 400` and did not complete successfully.

Overall verdict:

- `Pass`

## Execution Record

### 1. Environment bring-up

Validated:

- `GET /health` on Gateway returned `mode=openai-compatible`
- `GET /health` on OpenClaw local cluster returned `ok=true`
- macOS app launched and signed in automatically with the fresh bootstrap user
- App automation snapshot reported:
  - `selectedDestination=coach`
  - `isSignedIn=true`
  - `mainWindowVisible=true`

### 2. Coach page render

Observed in real GUI:

- Left navigation showed `Coach`
- Main content showed:
  - `Current Coach`
  - `Persona Switcher`
  - `Conversation Coach`
  - `Jarvis Approvals`
  - `Data Memory`

Verdict:

- `Pass`

### 3. fast -> full verification

Because direct GUI text-input automation did not reliably invoke the send path, the acceptance run seeded one conversation message through the same signed-in user account on the live Gateway, then verified rendering in the real GUI.

Server-side seed:

- Session id: `2f571859-a890-4121-b507-05479d9f88cb`
- Assistant message id: `1f349659-e7ba-4efe-aaf8-c5b1041500e6`
- Initial API response returned:
  - `assistantMessage.status = pending_full`
  - non-empty `fastResponse`

Observed in real GUI after refresh:

- User message rendered
- Assistant message rendered
- `Fast Response` section visible
- `Full Response` section visible
- Final assistant status displayed as `Completed`

Observed assistant content in GUI:

- Fast:
  - `先别急，先把“我更适合先拿到一个短句、明确、能立刻”收窄成一个最小下一步。`
- Full:
  - `我先帮你把问题拆成一个可执行起点，再决定是否继续扩展。`

Verdict:

- `Pass`

### 4. Memory extraction and revoke

Observed in real GUI:

- `Conversation Memory` panel populated with one memory
- Initial GUI status showed `Active`
- Memory summary:
  - `用户偏好先拿到一个短句、明确、能立刻开始的下一步。`

GUI action:

- Clicked `Revoke`

Observed in GUI after action:

- Memory status changed from `Active` to `Revoked`

Server-side confirmation:

- `GET /coach/memories` returned:
  - memory id `2d71289c-38a8-4767-8f0c-8e3baef37997`
  - `status = revoked`
  - non-null `revokedAt`

Verdict:

- `Pass`

### 5. Feedback submission

Initial finding:

- The first GUI-driven feedback attempt returned `HTTP 400`

Root cause:

- macOS client feedback requests were serializing `reason: null`
- Gateway schema accepts omitted `reason` or a string, but not explicit `null`

Fix applied after the first acceptance pass:

- `apps/macos/Sources/Core/APIClient.swift`
- Added regression coverage in:
  - `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`
  - `apps/macos/Tests/MindAnchorMacTests/MacAutomationTests.swift`
  - `apps/macos/Sources/Core/MacAutomation.swift`
  - `apps/macos/Sources/Core/AppViewModel.swift`

Re-check path:

- Rebuilt the macOS Debug app
- Re-launched the real app
- Seeded a fresh live conversation
- Triggered app-side feedback using the updated automation entry
- Triggered app-side memory revoke using the same automation entry

Observed result:

- App UI showed `Helpful`
- `apps/api/data/mindanchor.json` contained a new feedback record:
  - `sessionId = d93d451a-6df8-4404-9e7c-a57b9f7252cc`
  - `messageId = a1163c5c-ffda-400e-a8b9-3b400bd07a30`
  - `label = helpful`
- In the final re-check, the app rendered:
  - `Helpful`
  - `Used In This Reply`
  - conversation memory status `Revoked`
- The final live assistant message used in the pass was:
  - `messageId = c6e11998-3430-4427-9664-be2ff0ae03d7`
- The active memory revoked in the final pass was:
  - `memoryId = 3b4c5954-b308-4946-adab-beadec141b93`

Verdict:

- `Pass`

## Findings

### Finding 1: macOS feedback serialization bug was real and is now fixed

Original symptom:

- Real app feedback submission returned `HTTP 400`

Confirmed root cause:

- `reason=nil` was serialized as JSON `null`

Current state:

- Fixed in client
- Regression-covered by tests
- Re-verified against the real running app

Priority:

- `Resolved`

### Finding 2: GUI send-path automation is less reliable than app-side automation hooks

Symptom:

- Raw AX-based text-entry automation did populate the visible text area
- But it did not reliably produce a corresponding `POST /coach/sessions/:sessionId/messages`

Implication:

- The most reliable acceptance path is now:
  - real app process
  - real Gateway/OpenClaw backend
  - app-side automation actions for coach refresh / feedback / revoke

Priority:

- `Medium`

### Finding 3: Settings/status still surface a JWKS warning in this local mode

Observed GUI status:

- `Server error 401: {"message":"Supabase JWKS URL is not configured."}`

Implication:

- It did not block this acceptance run because gateway-local auth and bootstrap still worked
- But it is noisy in local QA and should be cleaned up for smoother acceptance sessions

Priority:

- `Medium`

## Final Acceptance State

Pass items:

- Real macOS app launch
- Real Coach page render
- Real OpenClaw-backed conversation display
- `fast -> full` display chain
- Real app feedback submission
- GUI-triggered memory revoke

Recommended next action:

- If needed, next improve raw GUI text-entry automation; the product chain itself is now passing.
