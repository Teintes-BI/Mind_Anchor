# OpenClaw Production Runtime Android LAN Verification（2026-04-24）

用于记录一台安卓手机作为第二客户端访问当前 OpenClaw production runtime 的 LAN 验收结果。

## 1. 基本信息

- 日期：`2026-04-24`
- 执行人：Codex
- 验收设备：Android phone via ADB
- 设备序列号：`320146882257`
- 设备型号：`NX733J`
- Android 版本：`15`
- 手机侧 Wi-Fi 地址：`192.168.0.100/24`
- Runtime LAN Base URL：`http://192.168.0.104:8800`
- Runtime entrypoint：`openclaw/production-runtime-server.mjs`

## 2. ADB 与网络状态

ADB 设备状态：

```text
List of devices attached
320146882257	device
```

手机侧路由摘要：

```text
192.168.0.0/24 dev wlan0 proto kernel scope link src 192.168.0.100
```

手机侧可用 HTTP 工具：

```text
/system/bin/curl
```

## 3. 手机侧 `/health` 验收

执行位置：安卓手机侧 shell。

```bash
curl -sS -m 5 -w "\nHTTP_STATUS=%{http_code}\n" \
  http://192.168.0.104:8800/health
```

关键结果：

- HTTP status：`200`
- `ok`：`true`
- `runtime`：`openclaw-local-cluster`
- `runtimeVersion`：`structured-local-runtime-phase1`
- `agentCount`：`15`
- `endpoints` 包含：
  - `/v1/tasks/execute`
  - `/tasks/execute`
  - `/api/tasks/execute`

## 4. 手机侧 `POST /v1/tasks/execute` 验收

执行位置：安卓手机侧 shell。

Payload：

```json
{
  "taskId": "android-lan-smoke-001",
  "target": "chief-agent",
  "createdAt": "2026-04-24T00:00:00.000Z",
  "trace": {
    "traceId": "android-lan-smoke-001",
    "source": "android-adb",
    "operation": "probe",
    "agentName": "chief-agent",
    "userId": "android-lan-user"
  },
  "payload": {
    "systemPrompt": "Return JSON only.",
    "userPrompt": "Return exactly {\"probe\":\"ok\"}.",
    "config": {
      "wireApi": "responses",
      "reasoningEffort": "xhigh",
      "disableResponseStorage": true
    },
    "promptSummary": {
      "systemPromptHash": "android-smoke",
      "userPromptHash": "android-smoke",
      "systemPromptLength": 17,
      "userPromptLength": 31
    },
    "kind": "probe"
  },
  "mode": "probe"
}
```

执行命令：

```bash
curl -sS -m 10 -w "\nHTTP_STATUS=%{http_code}\n" \
  -H "Content-Type: application/json" \
  --data @/data/local/tmp/openclaw-execute.json \
  http://192.168.0.104:8800/v1/tasks/execute
```

关键结果：

- HTTP status：`200`
- `success`：`true`
- `taskId`：`android-lan-smoke-001`
- `metadata.runtime`：`openclaw-local-cluster`
- `metadata.worker`：`chief-agent-worker`
- `metadata.agent`：`chief-agent`
- `metadata.responseMode`：`parsed`
- `parsed`：`{"probe":"ok"}`

## 5. 判定

本次安卓手机 LAN 验收通过：

- 证明 `OPENCLAW_BASE_URL=http://192.168.0.104:8800` 不只在本机 loopback 可用；
- 证明同一 Wi-Fi 网段中的第二客户端可以访问 runtime `/health`；
- 证明同一 Wi-Fi 网段中的第二客户端可以直接调用 `/v1/tasks/execute` 并得到结构化 probe 成功响应。

但这不是完整的 `M5` 跨机器部署验收：

- 安卓手机作为第二客户端，只验证“外部客户端访问当前 runtime”；
- 尚未验证“第二台机器按文档从零部署 runtime”；
- 因此 `M5` 总结论仍保持：`M4 已完成，M5 未完成`。
