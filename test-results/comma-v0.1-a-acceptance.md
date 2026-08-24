# Comma Personal Core v0.1-A acceptance

Date: 2026-08-24

## Delivered

- Separate SQLite Personal Core with replayable migrations, WAL, foreign keys, and FTS5.
- Bearer-scoped profile, append-only events and state snapshots, idempotency, optimistic revisions, retention, and cascade deletion.
- Life Compass candidate -> explicit confirmation -> append-only version flow.
- Permission records, P3 local-only egress guard, export without system trace payloads, and trace count isolation.
- Fastify `/v1/core` routes with authentication and stable error mapping.
- Explicit legacy JSON dry-run/apply migration with source hashing and idempotent legacy keys.
- Legacy JSON Store and Wayfinder remain separate.

This phase does not implement Chat, Choice Engine, Intervention Loop, Memory Retrieval, Agent/Skill, Voice, Decision Window, or external devices.

## Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm --filter @mindanchor/domain build` | exit 0 |
| `corepack pnpm --filter @mindanchor/api build` | exit 0 |
| Core Vitest suite: 7 files / 12 tests | exit 0, 12 passed, 0 failed |
| Wayfinder regression suite: 3 files / 13 tests | exit 0, 13 passed, 0 failed |
| `node --test scripts/__tests__/migrate-json-to-core.test.mjs` | exit 0, 1 passed, 0 failed |

Core coverage includes migration idempotency/FTS5, event idempotency and isolation, state revisions, Life Compass confirmation/versioning, P3/trace/export/delete behavior, and HTTP auth/lifecycle/API contracts.

## Data-control evidence

- P3 event write without local-only permission is rejected with `core_p3_egress_blocked`.
- `buildCloudProjection` rejects P3 and returns only the event summary allowlist for lower privacy levels.
- Export returns user data and `systemTraceCount`; raw prompt/model/route payloads are not included.
- Profile deletion runs in one SQLite transaction with foreign-key cascade and the profile is no longer readable.
- Migration dry-run creates no SQLite target; apply uses `legacy:<id>` idempotency keys and rejects source-hash changes on the same target.

## Rollback

Keep the original legacy JSON unchanged. To roll back a Core import, stop the API, remove only the target Core SQLite file after backup, and re-run the dry-run/apply process against a new target path if needed. Existing JSON Store data is not removed by Core deletion.
