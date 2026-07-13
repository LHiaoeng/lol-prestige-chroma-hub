# chromaart.lol Cloudflare 部署手册

## 1. 文档目标

本文说明如何将 `lol-prestige-chroma-hub` 部署到 Cloudflare 免费生态，并将 NameSilo 注册的 `chromaart.lol` 接入 Cloudflare。

目标拓扑：

```text
NameSilo
  └─ 负责域名注册、续费、Nameserver 和 DS 记录
              ↓ 委派权威 DNS
Cloudflare DNS
  ├─ chromaart.lol      → Worker
  ├─ www.chromaart.lol  → Worker，301 跳转到根域名
  └─ img.chromaart.lol  → R2

Cloudflare
  ├─ Worker: lol-prestige-chroma-hub
  ├─ D1:     lol-prestige-chroma-hub-db
  └─ R2:     lol-prestige-chroma-hub-images
```

本项目保留 NameSilo 作为注册商，只把权威 DNS 切换到 Cloudflare，不转移域名。`chromaart.lol` 当前按空域名处理，无旧网站、邮箱或第三方 DNS 记录需要迁移。

## 2. 当前状态说明

仓库当前只有设计文档，应用代码、`package.json`、`wrangler.jsonc`、初始化脚本和 GitHub Actions 尚未实现。因此：

- 第 3 节的账号与域名接入可以先完成。
- 第 4 节的 Cloudflare 资源可以手工创建，也可以等项目实现后由初始化命令创建。
- `pnpm bootstrap:cloudflare`、`pnpm data:import`、`pnpm deploy` 是项目实现后的目标命令，当前不可执行。
- 不要为了提前执行本文命令而手工创建同名占位脚本。

## 3. 将 NameSilo 域名接入 Cloudflare

### 3.1 准备账号

准备以下账号，并启用双重验证：

- NameSilo：持有 `chromaart.lol`。
- Cloudflare：用于 DNS、Worker、D1 和 R2。
- GitHub：私有仓库 `LHiaoeng/lol-prestige-chroma-hub`。

### 3.2 在 Cloudflare 添加域名

1. 登录 Cloudflare Dashboard。
2. 选择 **Add a domain**。
3. 输入 `chromaart.lol`。
4. 选择 Free 方案。
5. Cloudflare 扫描 DNS 记录后，确认没有需要保留的旧记录。
6. 记下 Cloudflare 分配的两条 Nameserver。Nameserver 由 Cloudflare 针对 Zone 分配，必须使用页面实际显示的值，不要复制其他域名的 Nameserver。

Cloudflare Free/Pro 使用 Full setup，要求 Cloudflare 成为权威 DNS。官方流程见 [Cloudflare Full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)。

### 3.3 修改 Nameserver 前检查 DNSSEC

在 NameSilo 修改 Nameserver 前，先检查 `chromaart.lol` 是否已有 DS 记录：

```powershell
Resolve-DnsName -Name chromaart.lol -Type DS -Server 1.1.1.1
```

处理规则：

- 查询不到 DS 记录：继续下一节。
- 查询到 DS 记录：先在 NameSilo 删除旧 DS 记录或关闭 DNSSEC，再等待旧 DS TTL 过期。
- 旧 DS 仍可查询时，不要修改 Nameserver，否则验证型 DNS 解析器可能返回 `SERVFAIL`。

Cloudflare 明确要求接入已有域名时先关闭注册商侧旧 DNSSEC，再切换 Nameserver；详细原因见 [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/)。

### 3.4 在 NameSilo 修改 Nameserver

1. 登录 NameSilo。
2. 打开 **Domain Manager**。
3. 勾选 `chromaart.lol`。
4. 在域名列表上方选择 **Change Nameservers**。
5. 删除原有 Nameserver。
6. 填入 Cloudflare 在第 3.2 节分配的两条 Nameserver。
7. 保存修改。

NameSilo 官方入口说明见 [Name Server Management Information](https://www.namesilo.com/support/v2/articles/domain-manager/nameserver-manager)。切换后，NameSilo 的 DNS Manager 不再是日常 DNS 事实源；后续 DNS 记录统一在 Cloudflare 管理。

### 3.5 验证 Nameserver 生效

使用公共解析器检查：

```powershell
Resolve-DnsName -Name chromaart.lol -Type NS -Server 1.1.1.1
Resolve-DnsName -Name chromaart.lol -Type NS -Server 8.8.8.8
```

两次查询都应返回 Cloudflare 分配的 Nameserver。随后在 Cloudflare Dashboard 点击 **Check nameservers now**，等待 Zone 状态变为 `Active`。

若本地 DNS 查询超时，可改用其他网络或在线 DNS 查询工具复核；不要只依赖浏览器缓存判断是否生效。

### 3.6 重新启用 DNSSEC

仅在 Cloudflare Zone 变为 `Active` 后执行：

1. 打开 Cloudflare **DNS > Settings > DNSSEC**。
2. 启用 DNSSEC。
3. 记录 Cloudflare 生成的 Key Tag、Algorithm、Digest Type 和 Digest。
4. 回到 NameSilo 的域名 DNSSEC/DS 管理入口。
5. 按 Cloudflare 页面原样录入新的 DS 参数。
6. 保存后验证：

```powershell
Resolve-DnsName -Name chromaart.lol -Type DS -Server 1.1.1.1
Resolve-DnsName -Name chromaart.lol -Type A -Server 1.1.1.1
```

DS 参数必须来自当前 `chromaart.lol` Cloudflare Zone，不得复用旧 DS 或其他域名的值。

## 4. 初始化 Cloudflare 资源

### 4.1 本地前置条件

项目实现完成后，本地需要：

- Git
- 项目锁定版本的 Node.js
- pnpm
- 项目依赖中锁定版本的 Wrangler

使用项目本地 Wrangler，不全局安装漂移版本：

```powershell
pnpm install --frozen-lockfile
pnpm exec wrangler --version
pnpm exec wrangler login
```

### 4.2 推荐初始化方式

目标命令：

```powershell
pnpm bootstrap:cloudflare
```

该命令实现后必须具备幂等性，并负责：

1. 检查当前 Cloudflare Account。
2. 检查或创建 D1 `lol-prestige-chroma-hub-db`。
3. 检查或创建 R2 `lol-prestige-chroma-hub-images`。
4. 将 D1 Database ID 写入 `wrangler.jsonc` 的绑定配置。
5. 校验 Worker 名称、D1 绑定和 R2 配置。
6. 输出仍需在 Dashboard 完成的 R2 自定义域名步骤。

### 4.3 手工创建资源的备用方式

初始化脚本不可用时，可以使用 Wrangler：

```powershell
pnpm exec wrangler d1 create lol-prestige-chroma-hub-db
pnpm exec wrangler r2 bucket create lol-prestige-chroma-hub-images
```

D1 创建命令会输出 Database ID 和绑定片段。将实际值写入 `wrangler.jsonc`，不要在文档或代码中虚构 ID。官方命令参考：[D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/) 和 [R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/)。

如果同名资源已经存在，先核对它是否属于本项目，不要通过添加随机后缀绕过冲突，也不要删除未知资源。

## 5. 配置生产域名

### 5.1 Worker 自定义域名

`wrangler.jsonc` 的生产路由应绑定：

```text
chromaart.lol
www.chromaart.lol
```

两者均使用 Worker Custom Domain。Worker 对 `www.chromaart.lol` 的所有请求返回到 `https://chromaart.lol` 对应路径的永久 301；根域名正常提供应用。

Custom Domain 建立后，Cloudflare 自动创建所需 DNS 记录并签发证书，不需要手工添加占位 A/CNAME。绑定前确认同名 DNS 记录不存在，避免冲突。参考 [Cloudflare Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

### 5.2 R2 图片域名

1. 打开 Cloudflare **R2 object storage**。
2. 选择 `lol-prestige-chroma-hub-images`。
3. 打开 **Settings > Public access**。
4. 添加自定义域名 `img.chromaart.lol`。
5. 等待状态变为 Active，并确认 TLS 证书生效。
6. `r2.dev` 只用于开发检查；生产页面只引用 `https://img.chromaart.lol`。

R2 自定义域名会使 Bucket 中可猜到路径的对象公开，因此 Bucket 只能存放计划公开的臻彩图片和 Tag 图标，禁止上传原始 JSON、完整清单、密钥或构建日志。官方说明：[R2 Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)。

## 6. 创建最小权限凭据

### 6.1 Worker/D1 部署 Token

在 Cloudflare **My Profile > API Tokens** 创建自定义 Token，名称建议：

```text
github-lol-prestige-chroma-hub-deploy
```

权限限制到承载本项目的 Account 和 `chromaart.lol` Zone。实现阶段按 Wrangler 实际操作收紧权限，预期至少包括：

- Account：Workers Scripts Edit
- Account：D1 Edit
- Account：Workers R2 Storage Edit
- Zone：Workers Routes Edit

如果初始化资源由本地交互登录完成，CI Token 不需要为“未来可能使用”而增加 DNS 或账号管理权限。Cloudflare 官方建议 Token 只限定到部署所需 Account 和 Zone，见 [Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)。

### 6.2 R2 S3 凭据

在 Cloudflare **Storage & databases > R2 > Manage API Tokens** 创建单独 Token：

- Permission：Object Read & Write
- Bucket scope：仅 `lol-prestige-chroma-hub-images`

创建后立即安全保存：

- Access Key ID
- Secret Access Key

Secret Access Key 创建后不能再次查看。不得将它写入仓库、Issue、Actions 日志或截图。R2 S3 Endpoint 使用：

```text
https://<Cloudflare Account ID>.r2.cloudflarestorage.com
```

认证方式参考 [R2 S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/)。

## 7. 配置 GitHub Actions

打开 GitHub 私有仓库：

```text
LHiaoeng/lol-prestige-chroma-hub
```

进入 **Settings > Secrets and variables > Actions > Repository secrets**，创建：

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

规则：

- Secret 值不写入 `wrangler.jsonc`。
- D1 Database ID、R2 Bucket 名和域名属于非敏感配置，写入版本控制内的 `wrangler.jsonc`。
- Workflow 禁止输出环境变量全集。
- Workflow 只使用固定大版本或提交 SHA 的第三方 Action。
- 生产部署使用 concurrency group；同一时间只运行一个部署，后来的任务排队，不并发覆盖生产状态。

Workflow 支持两个入口：

- 推送 `main`：自动部署。
- `workflow_dispatch`：手动重跑或恢复部署。

## 8. 首次部署

### 8.1 导入数据与图片

项目实现完成后，将现有数据库导出的 JSON 放在仓库外临时目录，然后执行：

```powershell
pnpm data:import --input D:\path\to\prestige-chromas.json
```

检查生成内容：

```text
data/prestige-chromas.json
assets/chromas/{instanceId}/site3.jpg
assets/chromas/{instanceId}/site4.jpg
assets/chromas/{instanceId}/site5.jpg
assets/tags/{tagId}.png
```

原始输入文件若包含不需要提交的内部字段，应由导入脚本规范化后再写入 `data/prestige-chromas.json`，不要直接复制未经校验的数据库导出文件。

### 8.2 本地预检

目标命令以最终 `package.json` 为准，至少覆盖：

```powershell
pnpm test
pnpm data:validate
pnpm build
```

构建后确认部署目录不存在：

- 原始 JSON
- 完整搜索索引
- source map
- Cloudflare/R2 密钥

### 8.3 推送触发部署

```powershell
git add data assets
git commit -m ":new: feat(data): 更新臻彩皮肤数据"
git push origin main
```

GitHub Actions 必须按顺序完成：

1. 安装依赖并运行测试。
2. 校验 JSON Schema 与图片完整性。
3. 计算唯一 `releaseId`。
4. 按 SHA-256 增量上传图片到 R2。
5. 将公开检索字段按 `releaseId` 导入 D1。
6. 使用相同 `releaseId` 构建静态首页和详情页。
7. 扫描部署目录中的敏感或禁止文件。
8. 使用 Wrangler 部署 Worker 与静态资源。
9. 运行生产烟测。
10. 烟测成功后清理过旧 D1 发布版本。

任何关键步骤失败都必须停止发布，不得继续执行“模拟成功”或清理旧版本。

## 9. 生产验证

### 9.1 DNS 与 TLS

```powershell
Resolve-DnsName -Name chromaart.lol -Type NS -Server 1.1.1.1
Resolve-DnsName -Name chromaart.lol -Type DS -Server 1.1.1.1
curl.exe -I https://chromaart.lol/
curl.exe -I https://www.chromaart.lol/
curl.exe -I https://img.chromaart.lol/
```

预期：

- NS 返回 Cloudflare Nameserver。
- 启用 DNSSEC 后 DS 查询有结果，普通解析不返回 `SERVFAIL`。
- 根域名返回成功响应。
- `www` 返回 301，`Location` 指向根域名相同路径。
- 图片域名根路径可以返回 404；这不代表 Bucket 绑定失败，应继续检查一个真实对象。

### 9.2 页面与 API

```powershell
curl.exe -I https://chromaart.lol/
curl.exe -I https://chromaart.lol/chromas/<已存在的-slug>
curl.exe "https://chromaart.lol/api/chromas?page=1&pageSize=1"
```

将 `<已存在的-slug>` 替换为本次数据生成的真实 Slug。验证：

- 首页正常显示静态首屏。
- 详情页返回 200，并包含独立 Canonical。
- API 仅返回一页数据，不包含仓库相对路径或内部字段。
- 首页筛选、URL 状态恢复、翻页和详情跳转实际可操作。

### 9.3 R2 图片

从 JSON 中选择一个真实 `instanceId` 和 `tagId`：

```powershell
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site3.jpg
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site4.jpg
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site5.jpg
curl.exe -I https://img.chromaart.lol/tags/<tagId>.png
```

四个对象都应成功返回图片 Content-Type。不要只验证 R2 Dashboard 中“对象存在”。

### 9.4 禁止的完整数据入口

以下代表性路径应返回 404，不得返回完整数据：

```powershell
curl.exe -I https://chromaart.lol/prestige-chromas.json
curl.exe -I https://chromaart.lol/data/prestige-chromas.json
curl.exe -I https://chromaart.lol/api/chromas/export
curl.exe -I https://img.chromaart.lol/prestige-chromas.json
```

同时确认生产部署不包含 `.map` 文件。公开页面展示过的数据仍可能被逐页采集，本检查只证明不存在单个完整数据下载入口。

## 10. 日常版本更新

每个游戏版本执行一次：

```powershell
git pull --ff-only
pnpm install --frozen-lockfile
pnpm data:import --input D:\path\to\new-prestige-chromas.json
pnpm test
pnpm data:validate
pnpm build
git status --short
git diff --stat
```

人工检查：

- 新增、删除和变化记录符合预期。
- 每个新增 `instanceId` 有三种尺寸图片。
- 每个有效 `tagId` 有 Tag 图标。
- JSON 图片相对路径与仓库文件一致。
- 没有 `.idea/`、临时目录、密钥或未经规范化的导出文件。

确认后提交并推送，观察 GitHub Actions 直到生产烟测完成。

## 11. 手动部署与回滚

### 11.1 手动重跑当前提交

优先在 GitHub Actions 选择生产部署 Workflow，使用 `workflow_dispatch` 重跑。这样可以复用与自动发布相同的测试、R2、D1、构建和烟测步骤。

不要直接在 Cloudflare Dashboard 修改线上 Worker 代码；Dashboard 热修复会造成线上代码与 Git 不一致。

### 11.2 应用回滚

首选方式：

1. 找到最近一次生产验证成功的 Git 提交。
2. 从该提交创建正常的回滚提交或恢复分支状态。
3. 通过同一 GitHub Actions Workflow 重新部署。
4. 完整执行生产烟测。

紧急 Worker 回滚：

```powershell
pnpm exec wrangler rollback --message "紧急回滚到上一稳定版本"
```

也可以在 Cloudflare **Workers & Pages > lol-prestige-chroma-hub > Deployments** 选择指定版本回滚。Wrangler 不指定 Version ID 时默认回滚到最新版本之前的版本；该操作会立即影响全部生产域名，执行前必须确认目标版本。参考 [Cloudflare Worker rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)。

### 11.3 数据与图片回滚

- D1 至少保留当前和上一个 `releaseId`；旧 Worker 必须能查询其固化的旧版本数据。
- 普通回滚不删除 R2 图片，因为图片是不可变或版本化资产。
- 不单独把 D1 “恢复到大概相同的数据”；代码、静态页和 `releaseId` 必须作为一个发布单元恢复。
- 回滚成功并稳定运行后，再由后续维护任务清理无引用旧版本。

### 11.4 DNS 不参与应用回滚

应用故障时不要修改 NameSilo Nameserver、Cloudflare DNSSEC 或域名注册配置。DNS 切换传播慢，且可能把局部应用故障扩大成全域名不可用。

## 12. 常见故障排查

### 12.1 Cloudflare Zone 长时间 Pending

检查：

- NameSilo 是否只保留 Cloudflare 分配的两条 Nameserver。
- 是否误填了其他 Zone 的 Nameserver。
- 公共解析器是否仍缓存旧 NS。
- 旧 DNSSEC DS 是否还存在。

### 12.2 域名返回 SERVFAIL

最常见原因是 Nameserver 已更换，但父 Zone 仍存在旧 DS。立即核对 DS；不要通过反复添加 A/CNAME 记录解决 DNSSEC 校验错误。

### 12.3 Worker 自定义域名绑定失败

检查 `chromaart.lol` 或 `www.chromaart.lol` 是否已有冲突 CNAME/A 记录。Worker Custom Domain 会自行创建 DNS 记录和证书，先移除冲突记录再重新绑定。

### 12.4 GitHub Actions 认证失败

检查：

- Secret 名称大小写是否完全一致。
- Cloudflare API Token 是否限制到了正确 Account 和 Zone。
- Token 是否具备 Worker、D1、R2 和 Workers Routes 的必要权限。
- Token 或 R2 Secret 是否已被撤销或重新生成。

不要把 Secret 输出到日志排查；使用 Cloudflare Token Verify 或最小只读命令验证身份。

### 12.5 R2 图片 404

依次检查：

1. JSON 相对路径是否正确。
2. Git 中对应文件是否存在。
3. Actions R2 上传步骤是否成功。
4. R2 对象键是否去掉了 `assets/` 前缀。
5. `img.chromaart.lol` 是否绑定到了正确 Bucket。
6. 对象 Content-Type 是否正确。

### 12.6 筛选 API 500

检查：

- Worker D1 binding 是否指向 `lol-prestige-chroma-hub-db`。
- 当前 Worker 固化的 `releaseId` 在 D1 中是否存在。
- 数据导入是否在 Worker 部署前成功提交。
- 查询是否使用已迁移的表结构和索引。

不得把数据库错误降级为“空列表”。

## 13. 免费额度与监控

至少每个版本发布后检查：

- Workers 请求量与 CPU 时间。
- D1 rows read、rows written 和存储。
- R2 存储量、Class A、Class B 操作量。
- GitHub Actions 运行时长和失败率。

当前官方免费额度与限制可能变化，发布前以官方页面为准：

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 limits](https://developers.cloudflare.com/r2/platform/limits/)

接近额度时，先检查 D1 索引、分页上限、静态资源缓存和 R2 增量上传是否正常，再决定是否升级套餐。不要通过吞掉查询错误或返回旧数据隐藏超额问题。

## 14. 首次上线检查清单

- [ ] Cloudflare Zone 为 Active。
- [ ] NameSilo Nameserver 与 Cloudflare 分配值一致。
- [ ] 旧 DS 已清理，新 DNSSEC DS 已正确生效。
- [ ] D1 和 R2 名称与设计一致。
- [ ] Worker、D1、R2 绑定已写入版本控制配置。
- [ ] GitHub 四项 Secrets 已配置。
- [ ] `chromaart.lol` 返回生产站点。
- [ ] `www.chromaart.lol` 301 到根域名相同路径。
- [ ] `img.chromaart.lol` 的真实图片对象可访问。
- [ ] 首页筛选、翻页和详情页通过实际烟测。
- [ ] 三种尺寸图片和 Tag 图标均从 R2 返回正确 Content-Type。
- [ ] 原始 JSON、完整索引和 source map 不在部署产物中。
- [ ] 常见完整数据猜测路径返回 404。
- [ ] Worker 回滚路径和上一 D1 `releaseId` 可用。
- [ ] `.idea/`、密钥和临时文件未进入 Git。

## 15. 官方资料

- [Cloudflare：添加已有域名并修改 Nameserver](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Cloudflare：DNSSEC](https://developers.cloudflare.com/dns/dnssec/)
- [NameSilo：修改 Nameserver](https://www.namesilo.com/support/v2/articles/domain-manager/nameserver-manager)
- [Cloudflare：Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare：GitHub Actions 部署 Worker](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare：D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Cloudflare：R2 S3 API](https://developers.cloudflare.com/r2/get-started/s3/)
- [Cloudflare：R2 Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare：Worker Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
