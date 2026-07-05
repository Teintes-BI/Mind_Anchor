# Core Phase Test Report

- Started: `2026-03-29T15:42:48.296Z`
- Completed: `2026-03-29T15:42:50.404Z`
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
- Issues：`2`
- Provider auth probe：`failed`
- Provider auth accepted via：`—`
- Provider auth endpoint：`—`
- Provider config drift：`drifted`
- Gateway baseUrl：`https://cdn-gmn.chuangzuoli.com`
- OpenClaw baseUrl：`https://gmncode.cn`
- [invalid_provider_api_key] 真实 provider 认证探针失败：所有候选 endpoint 都返回 HTTP 401。 请检查 `MINDANCHOR_DEFAULT_MODEL_API_KEY` 是否有效，并确认它和 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 属于同一服务。
- [provider_base_url_drift] Gateway 默认模型 base URL 与 OpenClaw real profile 的 provider base URL 不一致。 建议先把两边对齐，再判断 provider-direct 和 cluster-preferred 的差异是否真来自主链逻辑。


## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-2/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-2/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-preflight-20260329-2/responses`


