# Core Phase Test Report

- Started: `2026-03-29T15:12:32.370Z`
- Completed: `2026-03-29T15:12:34.876Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |


## Failures

- 无失败记录。

## Preflight

- 状态：`failed`
- Issues：`1`
- Provider auth probe：`failed`
- Provider auth accepted via：`—`
- Provider auth endpoint：`—`
- [invalid_provider_api_key] 真实 provider 认证探针失败：所有候选 endpoint 都返回 HTTP 401。 请检查 `MINDANCHOR_DEFAULT_MODEL_API_KEY` 是否有效，并确认它和 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 属于同一服务。


## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-1/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-1/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-1/responses`


