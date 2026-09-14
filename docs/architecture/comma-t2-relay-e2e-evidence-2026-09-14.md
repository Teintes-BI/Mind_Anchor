# T2 端到端验证证据：Windows 采集端 → ali-2v2g 中继

> 日期：2026-09-14
> 目的：补齐 `comma-desktop-tauri-t2-upload-2026-09-14.md` §9 遗留项 1——WinHTTP 传输此前只验证过失败路径。
> 结论：**已通过**。以下命令与输出均为实测。

## 1. 服务器与部署位置

| 项 | 值 |
|---|---|
| 主机 | `ali-2v2g` → `47.104.73.144:22`，Ubuntu 22.04.5，2 vCPU / 1.6GB RAM |
| 新部署目录 | `/home/claw/workspace/Mind_Anchor_core`（**与旧仓库 `Mind_Anchor` 并存**） |
| 新 API | `127.0.0.1:3002`，数据目录 `/home/claw/.local/share/comma-core-relay` |
| 对外入口 | `https://47.104.73.144:18443/v1/`（nginx，TLS，仅 `/v1/`） |
| 证书 | 复用 `/etc/nginx/dsh-selfsigned.crt`（SAN 含 `IP:47.104.73.144`，**自签名**） |
| 证书指纹 (SHA256) | `28:26:41:9B:80:E2:5B:78:89:00:2D:A0:1C:B2:64:80:2A:C6:B3:12:4B:5E:EA:4B:65:6E:2B:9E:ED:B5:A2:80` |

**旧服务全程未受影响**：`)3001` 上的 PID 576706（已运行 38 天）在每个步骤后都做过存活检查。

## 2. 为什么需要新建部署而非更新旧树

服务器旧仓库停在 `724d7656`，是当前分支的**祖先，落后 19 个提交**，且**没有 `apps/api/src/core/` 目录**——即不含 Personal Core。实测：

```
POST /v1/core/events (旧 :3001) -> 404 {"message":"Route POST:/v1/core/events not found"}
```

因此新版必须并行部署。选择独立目录 + 独立端口，使旧服务零风险、新服务可随时停用回滚。

## 3. 部署步骤（均已执行并验证）

| 步骤 | 动作 | 证据 |
|---|---|---|
| 1 | 加 2GB swap `/swapfile2` + 写入 fstab | `swapon --show` 显示 2047MB |
| 2 | corepack 固定 pnpm **10.30.3**（与仓库 `packageManager` 一致） | `pnpm --version` → 10.30.3 |
| 3 | `git archive` 打包本机 worktree → `Mind_Anchor_core` | 9143 文件 / 151MB；MD5 本机与服务器一致 |
| 4 | `pnpm install --frozen-lockfile` | 349 包；**`better_sqlite3.node` 编译成功**；**swap 用量 0** |
| 5 | `pnpm --filter @mindanchor/api build` | exit 0，16.8s；`dist/src/routes/core.js` 含 `v1/core/events` |
| 6 | 启动 :3002 | 日志 `Server listening at http://127.0.0.1:3002` |
| 7 | nginx 加 `comma-relay` 站点（18443） | `nginx -t` OK，reload 成功，配置已备份 |

### 原生模块验证（关键，因为本机架构与服务器不同）

本机是 Windows，`.node` 产物为 PE 格式，**无法在 Linux 加载**。所以采用服务器侧编译，并做真实加载测试：

```
$ node -e 'const D=require("better-sqlite3"); ...'
LOADED_OK x=42 sqlite=3.49.2
FTS5_OK
```

`better-sqlite3` 可加载且 FTS5 可用——后者是 Core schema 的硬性依赖。

## 4. 端到端验证（从 Windows 经公网 TLS）

用**与 Rust 客户端 `payload.rs` 完全一致的字段形态**发送（`camelCase`、`confidence` 为数字、`hourlyActivity` 为二元组数组）：

| # | 检查 | 结果 |
|---|---|---|
| 1 | 正常 P1 事件 | **201**，用时 **0.097s** |
| 2 | 幂等重放（同 `clientEventId`） | **201**，**同一 id** |
| 3 | **P3 必须被拒** | **403** `core_p3_egress_blocked` |
| 4 | 无鉴权 | **401** |
| 5 | 非 `/v1/` 路径（如 `/wayfinder/`） | **404**（范围限制生效） |

事件 id 示例：`0f751d94-f9c5-4a2b-a82b-10485d585ab9`（201 返回，重放返回同一 id）。

服务器内独立探针亦 6/6 通过（401 / 201 / 幂等同 id / 读回 / P3 403）。

## 5. 一次被误判为服务器缺陷的现象（记录以免复现）

从 Windows 首次发 P3 请求时返回 **500**，而服务器内同样请求返回 **403**。查应用日志得到真实原因：

```
FST_ERR_CTP_INVALID_JSON_BODY
"Body is not valid JSON but content-type is set to 'application/json'"
```

原因是 PowerShell 对内联 `-d '{"..."}'` 的引号做了转义，把畸形 JSON 发出去了。**属我的测试命令缺陷，不是服务器问题。** 改为 `--data-binary @file` 后即正确返回 403。

教训：跨 PowerShell + SSH 传递 JSON 一律走文件，不要内联。

## 6. 安全边界（当前状态）

- `/v1/` 通过 TLS 暴露于公网，**受 Core API 自身的 bearer 鉴权保护**；无鉴权请求 401。
- P3 出境界守在服务端强制，实测 403。
- nginx 站点**只代理 `/v1/`**，其余路径 404；**未**改动 18080 上的 DSH 站点（评估后放弃，因为在公网端口关闭 basic auth 是实质降级）。
- 证书为**自签名**。客户端必须显式信任，**不建议**全局跳过校验；推荐 pin 上述指纹。
- **当前 `MINDANCHOR_AUTH_DEV_BYPASS=true`**，仅为端到端探针方便。**上线前必须改为 `false` 并配置真实 JWT 密钥**，否则 `dev:` 令牌可任意伪造身份。

## 7. 未完成事项

1. **未做成开机自启/systemd 单元**：新 API 目前是 `nohup` 启动，主机重启后不会自动恢复。
2. **`AUTH_DEV_BYPASS` 仍为 true**，属临时状态。
3. **Rust 客户端尚未真正指向该端点**：本次验证用 curl 复刻了客户端 payload；Tauri 侧还需实现"pin 证书指纹"的连接配置，并跑一次真实的 `flush_uploads`。
4. **未在服务器上运行仓库测试套件**（仅构建 + 端到端探针）。
5. 本机早先的 tar 打包曾因 PowerShell `>` 重定向把 gzip 流写成 UTF-16 而损坏（文件头 `ff fe`），改用 `cmd /c` 重定向修复。属工具陷阱，已规避。
