# MindAnchor Gateway + OpenClaw 引导式安装指南

这份文档面向 V1 的真实目标用户：

- 单用户
- 自己持有服务器或家用主机
- 希望 Mac 客户端连接到“自己的大脑”

它不要求你先理解整个仓库，只要求你按顺序完成：

1. 准备运行环境
2. 配置 Gateway
3. 配置 OpenClaw
4. 跑预检
5. 让 Mac 客户端连上

---

## 1. 推荐部署拓扑

V1 推荐固定拓扑：

`Mac 客户端 -> Gateway -> OpenClaw`

建议：

- Gateway 与 OpenClaw 放在同一台非工作设备或云主机
- Mac 客户端只保存会话、队列和诊断文件
- 不在工作电脑上跑模型

---

## 2. 机器要求

至少准备一台可常驻运行的机器：

- 家用 Mac mini / Linux 主机 / NAS / 云主机
- 能开放一个 Gateway 地址给你的 Mac 访问
- 能运行 Node 22+

推荐端口：

- Gateway: `3001`
- OpenClaw local runtime: `8787`

---

## 3. 基本环境

在服务器工作目录中：

```bash
cd /path/to/mindanchor
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
```

---

## 4. Gateway 必要环境

最小必填：

```bash
export MINDANCHOR_API_PORT=3001
export MINDANCHOR_AGENT_MODE=openai-compatible
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn
export MINDANCHOR_DEFAULT_MODEL_API_KEY=你的密钥
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
```

如果你要走 OpenClaw cluster-first：

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787
```

如果你要让 macOS 客户端走 Supabase 登录：

```bash
export MINDANCHOR_SUPABASE_URL=...
export MINDANCHOR_SUPABASE_JWKS_URL=...
export MINDANCHOR_SUPABASE_JWT_ISSUER=...
```

---

## 5. 启动顺序

### 5.1 启动 OpenClaw

```bash
corepack pnpm dev:openclaw
```

### 5.2 启动 Gateway

```bash
corepack pnpm dev:api
```

---

## 6. 跑预检

在仓库根目录执行：

```bash
bash scripts/preflight-v1-stack.sh \
  --gateway-url http://127.0.0.1:3001 \
  --openclaw-url http://127.0.0.1:8787
```

你至少应该看到：

- Gateway health reachable
- OpenClaw health reachable
- Gateway adapter status reachable

---

## 7. 成功标准

当下面都成立时，服务器侧就算准备好了：

1. `GET /health` 返回 `ok: true`
2. OpenClaw `/health` 可达
3. Gateway `openClawBaseUrl` 与你预期一致
4. Mac 客户端可用这个 Gateway 地址完成登录和 bootstrap

---

## 8. 下一步

服务器预检通过后，继续看：

- `docs/macos-v1-install-guide.md`
- `docs/macos-mainline-runbook.md`

这样你就从“服务端已就绪”进入“Mac 客户端可用”。
