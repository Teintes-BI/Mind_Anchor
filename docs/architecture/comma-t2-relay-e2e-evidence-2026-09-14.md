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
- nginx 站点**只代理 `/v1/` 和 `/auth/`**，其余路径 404；**未**改动 18080 上的 DSH 站点（评估后放弃，因为在公网端口关闭 basic auth 是实质降级）。
- 证书为**自签名**。客户端必须显式信任，**不建议**全局跳过校验；推荐 pin 上述指纹。
- ~~**当前 `MINDANCHOR_AUTH_DEV_BYPASS=true`**，仅为端到端探针方便。~~ → **已于 2026-09-15 关闭**，见 §8。

## 7. 未完成事项

1. ~~**未做成开机自启/systemd 单元**~~ → **已完成**，见 §8。
2. ~~**`AUTH_DEV_BYPASS` 仍为 true**~~ → **已关闭**，见 §8。
3. ~~**Rust 客户端尚未真正指向该端点**~~ → **已完成**（pin 证书指纹 + 真实投递，见 T2 文档）。
4. **未在服务器上运行仓库测试套件**（仅构建 + 端到端探针）。
5. 本机早先的 tar 打包曾因 PowerShell `>` 重定向把 gzip 流写成 UTF-16 而损坏（文件头 `ff fe`），改用 `cmd /c` 重定向修复。属工具陷阱，已规避。

## 8. 鉴权加固与 systemd（2026-09-15）

**变更前存在两个真实漏洞**（均实测确认，非推断）：

| 漏洞 | 实测证据 |
|---|---|
| `dev:<任意用户>:<任意邮箱>` 令牌可冒充任意身份 | 该令牌返回 **201**，而它代表的用户从未注册过 |
| 签名密钥回退到**源码中的公开常量** | `gateway-auth.ts` 的 fallback 是 `mindanchor-local-auth-dev-secret`；用它自签的 JWT 实测**通过校验** |

第二点尤其重要：**只关 `AUTH_DEV_BYPASS` 而不设真实密钥，等于没关** —— 任何人仍可用那个公开字符串伪造合法令牌。

**处置**：

1. 生成 48 随机字节（96 hex）写入 `/root/comma-relay-secrets/jwt-secret`（`600`），并注入 `relay.env` 的 `MINDANCHOR_AUTH_JWT_SECRET`。
2. 新建 `mindanchor-core-relay.service`（`User=claw`、`EnvironmentFile=`、`Restart=on-failure`、含 `NoNewPrivileges`/`ProtectSystem=full`/`ProtectHome=read-only`/`ReadWritePaths=<data dir>` 等加固项），替换 `nohup`。
3. nginx 增加 `location /auth/`（此前仅 `/v1/`，外部无法登录取令牌）。`/auth/` 之外仍 404。
4. 注册 `comma-desktop@relay.local`（`gateway-local`），密码存 `owner-password.txt`，登录换取 JWT。

**加固后实测**（服务器内 + 公网 TLS 双向验证）：

| # | 检查 | 结果 |
|---|---|---|
| 1 | `dev:attacker:attacker@example.com` | **401 拒绝**（加固前是 201） |
| 2 | 无令牌 | **401** |
| 3 | 旧默认密钥签发的令牌 | **401 拒绝** |
| 4 | `/auth/login` 真实账号 | 返回新令牌对 |
| 5 | 新密钥签发的真实令牌 | **201** |
| 6 | **用公开常量自签的伪造令牌** | **401 拒绝** |
| 7 | 上述伪造令牌经公网 TLS | **401 拒绝** |

第 6、7 项证明"关 bypass 但留公开默认密钥"这一陷阱已被避开。

**未受影响**：旧 API `:3001`（PID 576706，属主 `claw`）全程存活；18080 的 DSH harness 未触碰。

### 密钥与凭据清单（`/root/comma-relay-secrets/`）

目录 `drwx------ root:root`，是**唯一的机密存放点**，systemd 通过 `EnvironmentFile=` 读取。以下只列路径、权限与用途；**值一律不记录在本仓库**。

| 文件 | 权限 | 大小 | 用途 |
|---|---|---|---|
| `relay.env` | `600` root:root | 718 B | 服务实际读取的来源。7 键：`NODE_ENV`、`MINDANCHOR_API_HOST`、`MINDANCHOR_API_PORT`、`MINDANCHOR_DATA_FILE`、`MINDANCHOR_PERSONAL_CORE_SQLITE_FILE`、`MINDANCHOR_AUTH_JWT_SECRET`、`MINDANCHOR_AUTH_DEV_BYPASS=false` |
| `jwt-secret` | `600` root:root | 96 字符纯 hex | 48 随机字节，HS256 签名密钥的原始副本（服务读的是 `relay.env` 里的那份） |
| `owner-password.txt` | `600` root:root | 39 B | `comma-desktop@relay.local` 的登录密码，账号丢失时唯一恢复途径 |
| `owner-jwt.txt` | `600` root:root | 315 B | 当前 access token（JWT / HS256 / 3 段）。客户端「Bearer 令牌」填此值 |
| `owner-refresh.txt` | `600` root:root | 64 B | 当前 refresh token。客户端「刷新令牌」填此值，用于自动续期 |
| `old-nohup-pid.txt` | `600` root:root | 7 B | 切换前的旧进程号（726090）。**已失效**，仅作回滚线索 |

**账号**（实测自 JWT 载荷）：`email=comma-desktop@relay.local`、`sub=c47f6447-b14b-4323-a22c-519e33aa4849`、`iss=mindanchor-gateway-auth`。

**令牌生命周期**：access token 7 天；refresh token 30 天且**单次使用**（续期即作废旧值、返回新值）。客户端已实现 24 小时提前续期 + 手动「立即续期令牌」。

**恢复与轮换**：

1. **access token 过期** → 有 refresh token 则客户端自动续期；否则重新登录：
   ```bash
   curl -s -X POST http://127.0.0.1:3002/auth/login -H 'Content-Type: application/json' \
     -d "{\"email\":\"comma-desktop@relay.local\",\"password\":\"$(cat /root/comma-relay-secrets/owner-password.txt)\"}"
   ```
   把返回的 `accessToken` 写入 `owner-jwt.txt`、`refreshToken` 写入 `owner-refresh.txt`（均 `600`）。
2. **refresh token 会漂移**：续期后服务器文件里的值可能已过时（客户端持有新的）。以客户端实际持有的为准，或重新登录覆盖。
3. **轮换签名密钥**：重写 `jwt-secret` 与 `relay.env` 中的 `MINDANCHOR_AUTH_JWT_SECRET` → `systemctl restart mindanchor-core-relay`。**所有已签发令牌立即失效**。
4. **凭据泄露处置**：任何拿到令牌者只能以 `comma-desktop@relay.local` 一个身份读写（Core 按 userId 派生 `profileId` 隔离），无法冒充他人；处置方式即第 3 条。

**回滚线索**（确认稳定后可删）：`/root/comma-relay.bak-20260915-130840`（加 `/auth/` 前的 nginx 配置，不含密钥）、`old-nohup-pid.txt`。删除前先确认 `systemctl is-enabled mindanchor-core-relay` 为 `enabled`。

## 9. `/client/inbox` 缺少鉴权（2026-09-15 发现，未修复）

**发现的起因**：为 T1.3 放行 nginx 路由后做暴露面验证，发现该端点在无令牌情况下返回 **200**。

**实测证据**（服务器内 `:3002`）：

| 请求 | 结果 |
|---|---|
| `GET /client/inbox/overview?userId=<任意>`，无 `Authorization` 头 | **200**，返回完整 JSON |
| `GET /client/inbox?userId=<任意>`，无 `Authorization` 头 | **200** |
| `GET /wayfinder/consent`，无令牌 | **401**（对照组，鉴权正确） |

**根因**：`apps/api/src/app.ts:2160–2183` 三条路由通过
`getRequestUserId(request, query.userId ?? "demo-user")` **信任查询参数**，未做 bearer 校验。

**影响**：任何能访问该端点的调用方，只需替换 `userId` 即可读取**任意用户**的提醒内容（`title`、`message`、`channel`、`status`）。Core 的 `profileId` 隔离在此路径上**不生效**，因为身份来自调用方自报。

**处置**：已回滚 nginx 对 `/client/inbox/` 的放行（备份 `/root/comma-relay.bak-20260915-191156`）。`/wayfinder/` 保留，因其鉴权正确。

**回滚后验证**：`/client/inbox/overview`、`/client/inbox`、`POST /client/inbox/:id/ack` 从公网均 **404**；服务端 `127.0.0.1:3002` 仍 **200**（本地功能未动）。

**未修复事项**：服务端仍需为这三条路由加鉴权（改用 `authContext.userId`，忽略查询参数）。**在此之前 T1.3 无法安全地走公网**，因为客户端会依赖一个可越权的接口。

**教训（一次判断失误）**：先前基于 `/wayfinder/*` 返回 401，就推断"这两组接口都已有 bearer 鉴权"，并把该结论写进给用户的方案。实际 `/client/*` 没有。**一个端点族的鉴权状况不能由单个端点的表现外推** —— 逐条实测才发现。

## 10. 已知缺口与后续

