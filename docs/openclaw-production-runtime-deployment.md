# OpenClaw Production Runtime 部署说明

## 1. 目标范围

本说明对应 `M5 — Production OpenClaw Runtime` 的**单用户自部署生产版**目标：

- 只面向单用户、单节点、自部署；
- 当前优先支持 `macOS + LAN`；
- Gateway / Web 与 runtime 分离，runtime 作为独立常驻服务运行；
- provider 凭据只保留在 runtime 所在机器。

当前不覆盖：

- 多节点集群
- 多租户平台
- 云厂商级高可用

## 2. 前置条件

- 机器内已有仓库目录，例如 `/Users/claw/mindanchor`
- 已安装便携 Node：`/Users/claw/mindanchor/.tools/node`
- 已安装 OpenClaw CLI：`$HOME/.openclaw/bin/openclaw`
- 已能访问 OpenAI-compatible provider，例如 `https://gmncode.cn`
- 已准备 provider API Key，并写入本机 `~/.codex/auth.json` 或对应环境变量

补充说明：

- `start-openclaw-runtime-lan` 现在会优先尝试找到兼容 OpenClaw 的 Node（当前要求 `>=22.16.0`）
- 如果仓库自带 `.tools/node/bin/node` 偏旧，会自动回退到 PATH 中第一个兼容版本
- 如需固定，显式设置 `OPENCLAW_NODE_BIN=/absolute/path/to/node`

## 3. 首次部署

### 3.1 安装依赖

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
```

### 3.2 初始化 OpenClaw profile

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
OPENCLAW_REAL_PROFILE=dev \
MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn \
MINDANCHOR_DEFAULT_MODEL_API_KEY=your-key \
MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4 \
bash scripts/setup-openclaw-real-profile.sh
```

如果已经把 key 放进 `~/.codex/auth.json` 并复用当前脚本逻辑，也可以直接运行：

```bash
bash scripts/setup-openclaw-real-profile.sh
```

### 3.3 启动 runtime

前台调试模式：

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
OPENCLAW_HOST=0.0.0.0 OPENCLAW_PORT=8800 \
node openclaw/production-runtime-server.mjs
```

后台常驻模式：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm start:openclaw-runtime-lan
```

如果脚本报：

- `Node runtime not found`
- `No compatible Node runtime found for OpenClaw`

先执行：

```bash
node -v
echo "$OPENCLAW_NODE_BIN"
```

再用兼容版本显式重试：

```bash
OPENCLAW_NODE_BIN=/absolute/path/to/node corepack pnpm start:openclaw-runtime-lan
```

### 3.4 查看当前状态

```bash
corepack pnpm status:openclaw-runtime-lan
corepack pnpm health:openclaw-runtime-lan
```

运行后会生成：

- 默认端口 `8800`：
  - pid：`.logs/openclaw-real-lan.pid`
  - 日志：`.logs/openclaw-real-lan.log`
  - 环境快照：`.logs/openclaw-real-lan.env`
- 非默认端口：
  - pid：`.logs/openclaw-real-lan-<port>.pid`
  - 日志：`.logs/openclaw-real-lan-<port>.log`
  - 环境快照：`.logs/openclaw-real-lan-<port>.env`

也可以直接运行：

```bash
corepack pnpm status:openclaw-runtime-lan
```

查看当前实例实际使用的 `FILE_PREFIX` / `PID_FILE` / `LOG_FILE` / `ENV_FILE`。

### 3.5 获取 Base URL

常驻脚本会自动探测局域网 IP，并写入：

- 默认端口 `8800` 时的 `.logs/openclaw-real-lan.env`
- 非默认端口时的 `.logs/openclaw-real-lan-<port>.env`

关键字段：

- `OPENCLAW_BASE_URL`
- `OPENCLAW_HEALTH_URL`

默认访问方式：

- 健康检查：`http://127.0.0.1:8800/health`
- 局域网访问：`http://<LAN-IP>:8800`

`corepack pnpm health:openclaw-runtime-lan` 当前会优先检查：

- loopback 健康地址：`OPENCLAW_HEALTH_URL`
- 如果 env snapshot 里存在 `OPENCLAW_BASE_URL`，还会继续检查 `OPENCLAW_BASE_URL/health`

这一步的目标是不只确认“本机进程活着”，还要确认 Gateway 侧实际要访问的 LAN URL 也可达。

## 4. Gateway 接入

在 Gateway 所在环境中设置：

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=http://<LAN-IP>:8800
```

验证：

```bash
curl -fsS http://127.0.0.1:3024/debug/openclaw/adapter
curl -fsS http://127.0.0.1:3024/debug/model-probe/chief-agent
```

预期：

- `executionStrategy = cluster-preferred`
- `route = cluster`

## 5. 自启动方式

### 5.1 推荐：launchd

安装：

```bash
corepack pnpm install:openclaw-runtime-launchd
```

查看状态：

```bash
corepack pnpm status:openclaw-runtime-launchd
```

卸载：

```bash
corepack pnpm uninstall:openclaw-runtime-launchd
```

### 5.2 兼容：nohup 后台常驻

如果当前只需要最小常驻方式，也可以继续使用：

```bash
corepack pnpm start:openclaw-runtime-lan
corepack pnpm stop:openclaw-runtime-lan
```

## 6. 新机器恢复最小步骤

在一台新机器上，最少按以下顺序恢复：

1. 安装 Node 与 OpenClaw CLI
2. 拉取仓库并执行 `corepack pnpm install`
3. 配置 provider key / base URL
4. 运行 `bash scripts/setup-openclaw-real-profile.sh`
5. 启动 `corepack pnpm start:openclaw-runtime-lan`
6. 运行 `corepack pnpm status:openclaw-runtime-lan`，读取当前实例对应的 `ENV_FILE` 获取 Base URL
7. 在 Gateway 机器设置 `MINDANCHOR_OPENCLAW_BASE_URL`
8. 运行 `corepack pnpm health:openclaw-runtime-lan`
9. 再运行一次 `corepack pnpm smoke:cluster`

## 7. 当前限制

- 当前 runtime 已从单文件包装器升级为结构化模块，但底层执行仍依赖本机 OpenClaw CLI。
- 目前默认验证形态仍以 `LAN` 为主，`Tailscale` 只作为后续可扩展方式。
- 真正的跨机器恢复验收仍需要在另一台机器上再跑一次完整 smoke。

## 8. 相关文档

- `docs/m5-production-runtime-completion-checklist.md`
- `docs/openclaw-production-runtime-ops-guide.md`
- `docs/spec.md`
- `docs/development-handoff-2026-03-07.md`
