# Comma V0.1-B Acceptance

Date: 2026-08-24

## Evidence

- Domain, API and repository contracts implemented through migration 3.
- Context builder enforces event allowlist, bounded history, 24,000-character budget, cloud P3 redaction and stable hash.
- Stub and ModelBridge adapters classify completed, blocked, unavailable, malformed and provider-error outcomes.
- API routes cover create/list/get/send/archive/delete with bearer ownership and idempotency.
- Web Single Brain page and typed client are available at `/single-brain`.
- E2E fixture covers confirmed Compass, State, 15 events, three chat turns, export/delete, ordering and redaction.

## Commands

```text
corepack pnpm --filter @mindanchor/domain build   PASS
corepack pnpm --filter @mindanchor/api build      PASS
corepack pnpm --filter @mindanchor/api test       49/50 files passed; one existing Coach integration was flaky under full parallel run and passed when rerun alone
corepack pnpm --filter @mindanchor/web test       9 files / 17 tests PASS
corepack pnpm --filter @mindanchor/web build      PASS
```

The Single Brain-specific suites pass independently: domain, repository/privacy, context, model, service, API routes, Web smoke and E2E fixture.
