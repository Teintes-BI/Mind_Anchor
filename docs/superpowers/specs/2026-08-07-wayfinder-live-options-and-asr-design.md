# Wayfinder Live Options and ASR Design

## Goal

Complete the first personal-alpha vertical slice: a consented situation is confirmed, three explainable options are generated and stored automatically, the user chooses one, and the result is recorded. Short mobile audio is transcribed locally first; raw audio may reach the configured cloud ASR provider only when the matching consent grant explicitly permits provider sharing.

## Decision Flow

1. A manual note or voice candidate creates an `awaiting_confirmation` situation.
2. Confirming the situation invokes a dedicated option-generation service.
3. The service asks `analyst-agent` for exactly three structurally distinct option drafts. It converts drafts into scoped `DecisionOption` records and persists them before returning the confirmation response.
4. If the model route is unavailable or invalid, the existing deterministic Wayfinder option worker supplies the same three-option contract. The response remains usable and traceable.
5. The user selects an option and later records an outcome through the existing decision ledger APIs.

## Speech Flow

1. Android records foreground five-second PCM chunks only after explicit audio consent.
2. The paired desktop attempts local Whisper transcription with `@huggingface/transformers` and a configurable Whisper model. The model is loaded lazily and cached by the library.
3. When local transcription succeeds, only the transcript and bounded audio metadata are sent to the core API.
4. When local transcription is unavailable, raw audio is forwarded only if the current audio consent uses `selected_provider` or `any_configured_provider`. The Android UI exposes this as an off-by-default switch before recording starts.
5. The API validates the stored consent grant again before calling the configured OpenAI-compatible `/audio/transcriptions` endpoint. Raw audio is converted to WAV in memory and is never persisted by the API.
6. Without local text or provider-sharing consent, the chunk produces no voice candidate.

## Configuration

- Desktop local model: `MINDANCHOR_LOCAL_WHISPER_MODEL`, default `onnx-community/whisper-small`.
- Desktop local ASR disable switch: `MINDANCHOR_LOCAL_WHISPER_ENABLED=0`.
- API cloud ASR: `MINDANCHOR_ASR_BASE_URL`, `MINDANCHOR_ASR_API_KEY`, and `MINDANCHOR_ASR_MODEL`, falling back to the default provider URL/key and `whisper-1` only when provider-sharing consent exists.
- Existing `MINDANCHOR_WAYFINDER_ASR_REMOTE=1` remains the operator-side cloud capability gate; user consent is an additional mandatory gate.

## Error Handling

- Model option failures use the deterministic option worker and never leave a confirmed situation with an unusable contract.
- Local Whisper loading or inference failures are reported in desktop status and do not silently upload audio.
- Cloud ASR rejects missing configuration, missing consent, non-2xx responses, empty transcripts, and malformed payloads.
- Replayed audio keeps the existing session/sequence idempotency key.

## Automatic Scenario

The scenario is: `I am finishing the main analysis, but a colleague asks me to send a preliminary result this afternoon.` The automated test grants manual consent, creates and confirms the situation, asserts exactly three explainable options, chooses one, records an outcome, and verifies the decision ledger contains the situation, selected option, and outcome.

## Acceptance

- Confirmation returns exactly three persisted options.
- Each option has a first step, rationale, costs, projected consequences, reversibility, value alignment, evidence, risk, and trace provenance.
- Local transcript wins over cloud ASR.
- Cloud ASR is impossible under `local_only` consent and possible under explicit provider-sharing consent.
- No raw audio is stored in Wayfinder events or API state.
- API, Web, desktop, domain, and scenario tests pass.
