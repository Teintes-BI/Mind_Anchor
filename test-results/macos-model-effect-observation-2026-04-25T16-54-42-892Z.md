# M7 macOS 桌面模型效果观察

- generatedAt: `2026-04-25T16:54:42.893Z`
- startedAt: `2026-04-25T16:54:42.893Z`
- completedAt: `2026-04-25T16:55:44.247Z`
- durationMs: `61354`
- apiBaseUrl: `http://127.0.0.1:3011`
- openClawBaseUrl: `http://192.168.0.104:8800`
- accountEmail: `m7-desktop-model-effect@example.com`
- memoryMode: `compare`
- openChronicleMcpUrl: `http://127.0.0.1:8742/mcp`
- passed: `true`

## Summary

- plannedTurnCount: `6`
- completedTurnCount: `6`
- failedTurnCount: `0`
- openClawTrailCount: `6`
- feedbackPersistedCount: `6`
- fastResponseCount: `6`
- fullResponseCount: `6`
- baselineTurnCount: `3`
- openChronicleMemoryTurnCount: `3`
- memoryReadSuccessCount: `3`
- memoryReadFailedCount: `0`
- averageFullResponseLength: `177`

## Turns

| turn | memory | status | traceId | fullLength | feedback | errors |
| --- | --- | --- | --- | --- | --- | --- |
| next-action-baseline | `baseline:—` | `completed` | `—` | `27` | `helpful:persisted` | — |
| next-action-openchronicle | `openchronicle:read` | `completed` | `—` | `123` | `helpful:persisted` | — |
| interruption-recovery-baseline | `baseline:—` | `completed` | `—` | `229` | `helpful:persisted` | — |
| interruption-recovery-openchronicle | `openchronicle:read` | `completed` | `—` | `228` | `helpful:persisted` | — |
| over-notification-baseline | `baseline:—` | `completed` | `—` | `228` | `helpful:persisted` | — |
| over-notification-openchronicle | `openchronicle:read` | `completed` | `—` | `228` | `helpful:persisted` | — |

## Conclusion

- M7 桌面模型效果观察门槛: `达到`
- 说明：该观察验证桌面客户端真实链路、OpenClaw 执行轨迹、响应完成度与反馈闭环；不替代人工语义质量评审。

## Error Samples

- 无
