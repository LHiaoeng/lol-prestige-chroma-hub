# chromaart.lol Cloudflare 部署手册

## 1. 部署模型

本项目是静态 Astro 站点：构建时读取 `data/prestige-chromas.json`，输出 `dist/`，Cloudflare Worker 仅托管这些静态资产。推送 `main` 后由 Workers Builds 执行发布构建和 Wrangler 部署。

```text
管理后台 ──覆盖──> data/prestige-chromas.json ──Astro 构建──> dist/ ──Worker──> chromaart.lol
管理后台 ──上传图片──> R2 ──公开域名──> img.chromaart.lol
```

站点没有运行时数据库、数据服务、存储 binding 或部署密钥。R2 图片由管理后台独立维护，本仓库和 Workers Builds 不上传图片。

## 2. 首次部署并连接 GitHub

私有仓库的推荐方式是从 Cloudflare Dashboard 使用已登录的 GitHub 身份连接 Workers Builds；这不要求公开仓库。

### 2.1 Deploy to Cloudflare（仅公开仓库）

Deploy to Cloudflare 按钮只能读取公开仓库。只有将 `LHiaoeng/lol-prestige-chroma-hub` 设为 public 后才能使用；仓库保持 private 时跳过本节，使用第 2.2 节的 Dashboard Git integration。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LHiaoeng/lol-prestige-chroma-hub)

确认目标仓库和 Cloudflare Account。首次部署前必须在配置确认页把 Build command 设置为 `pnpm release:build`、Deploy command 设置为 `pnpm exec wrangler deploy`；不要接受自动检测出的 package script `build`。若页面创建了仓库副本，后续应以该副本的 `main` 为生产分支。

### 2.2 从 Dashboard 手工连接

仓库为 private 时使用此方式：

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
2. 创建 Worker，选择从 Git 仓库导入，授权 GitHub 后选择 `LHiaoeng/lol-prestige-chroma-hub`。
3. 将 Worker 名称设置为 `lol-prestige-chroma-hub`。它必须与 `wrangler.jsonc` 的 `name` 完全一致，否则构建或部署会失败。
4. 首次部署前核对并保存以下构建设置。不要接受把 package script `build` 自动识别为 Build command 的结果。

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | 留空（仓库根目录） |
| Build command | `pnpm release:build` |
| Deploy command | `pnpm exec wrangler deploy` |

不要配置 Secrets、环境变量或运行时 bindings。`wrangler.jsonc` 已声明静态目录 `./dist` 和自定义 404 行为。Workers Builds 的配置项说明见 [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

首次部署成功后，打开 Worker 的 Deployments 页面，确认生产部署来自 `main`，构建和部署命令与上表一致。

## 3. NameSilo 与 Cloudflare DNS

本项目保留 NameSilo 作为注册商，只把权威 DNS 委派给 Cloudflare，不转移域名。

### 3.1 切换 Nameserver

1. 在 Cloudflare 添加 `chromaart.lol`，选择 Free 方案并记下 Cloudflare 为该 Zone 分配的两条 Nameserver。
2. 切换前检查父区是否已有 DS 记录：

   ```powershell
   Resolve-DnsName -Name chromaart.lol -Type DS -Server 1.1.1.1
   ```

3. 如果存在旧 DS，先在 NameSilo 删除旧 DS 或关闭旧 DNSSEC，等待缓存过期；旧 DS 仍可查到时不要切换 Nameserver，否则验证型解析器可能返回 `SERVFAIL`。
4. 在 NameSilo **Domain Manager > Change Nameservers** 中只填写 Cloudflare 实际分配的两条 Nameserver。
5. 等待 Cloudflare Zone 变为 `Active`，并用公共解析器复核：

   ```powershell
   Resolve-DnsName -Name chromaart.lol -Type NS -Server 1.1.1.1
   Resolve-DnsName -Name chromaart.lol -Type NS -Server 8.8.8.8
   ```

官方参考：[Cloudflare Full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)；[NameSilo Nameserver 管理](https://www.namesilo.com/support/v2/articles/domain-manager/nameserver-manager)。切换后，日常 DNS 记录统一在 Cloudflare 管理。

### 3.2 重新启用 DNSSEC

仅在 Zone 为 `Active` 后执行：

1. 在 Cloudflare **DNS > Settings > DNSSEC** 启用 DNSSEC。
2. 将 Cloudflare 为当前 Zone 生成的 Key Tag、Algorithm、Digest Type 和 Digest 原样录入 NameSilo 的 DS 管理界面。
3. 验证 DS 可查询且普通解析不返回 `SERVFAIL`：

   ```powershell
   Resolve-DnsName -Name chromaart.lol -Type DS -Server 1.1.1.1
   Resolve-DnsName -Name chromaart.lol -Type A -Server 1.1.1.1
   ```

不要复用旧 DS 或其他域名的 DS。参考 [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/)。

## 4. 自定义域名与图片域名

### 4.1 站点域名

在 Worker **Settings > Domains & Routes** 中只添加 apex Custom Domain：

- `chromaart.lol`

Worker Custom Domain 会自动创建 apex 所需 DNS 记录并签发证书。添加前先移除 `chromaart.lol` 的冲突 A/CNAME；无需手工创建 apex 占位记录。参考 [Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

`www` 不绑定到 Worker。按以下方式配置重定向入口：

1. 在 Cloudflare DNS 创建 `AAAA` 记录：Name 为 `www`，IPv6 address 为 `100::`，Proxy status 为 **Proxied**。
2. 在 **Rules > Redirect Rules** 创建 Single Redirect，匹配 Hostname equals `www.chromaart.lol`。
3. 选择 301，动态目标表达式使用 `concat("https://chromaart.lol", http.request.uri.path)`，并启用保留查询字符串。

这样 `https://www.chromaart.lol/a?b=1` 会跳转到 `https://chromaart.lol/a?b=1`，且 `www` 请求不会进入静态 Worker。

### 4.2 图片域名

`img.chromaart.lol` 绑定到管理后台维护的 R2 Bucket。由图片管理员在 R2 Bucket **Settings > Public access** 中添加该自定义域名，并确认状态与 TLS 证书均为 Active。

R2 只存放计划公开的臻彩图片和 Tag 图标，不得上传完整 JSON、密钥或构建日志。站点只消费 JSON 中的相对路径，生产页面应使用 `https://img.chromaart.lol/...`。参考 [R2 Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)。

## 5. 日常 JSON 更新

图片已经由管理后台同步到 R2 后，在展示站仓库执行：

```powershell
git pull --ff-only
pnpm install --frozen-lockfile
# 用管理后台输出完整覆盖 data/prestige-chromas.json
pnpm data:validate
pnpm release:build
git add data/prestige-chromas.json
git commit -m "data: update prestige chroma catalog"
git push origin main
```

直接覆盖标准 JSON 是正常流程。`data:validate` 和 `release:build` 会在构建时校验字段、路径、唯一性和部署产物；本地不需要对应图片文件。推送 `main` 后 Workers Builds 自动重新构建和部署。

`pnpm data:import` 只用于规范化不符合最终契约的外部导出，不是日常更新的必经步骤。不要把完整目录 JSON 放入 `public/`。

## 6. 预览、发布与回滚

### 6.1 本地预览

```powershell
pnpm install
pnpm data:validate
pnpm dev
```

检查 Worker 静态资产行为时：

```powershell
pnpm release:build
pnpm preview
```

### 6.2 分支预览

在 Worker **Settings > Build > Branch control** 启用 non-production branch builds，再为非 `main` 分支创建 Pull Request。Workers Builds 会使用默认的非生产部署命令创建预览版本；通过预览 URL 检查页面、详情路径和图片。只有合并或直接推送到 `main` 才更新生产部署。

### 6.3 回滚

在 **Workers & Pages > lol-prestige-chroma-hub > Deployments** 选择上一条已验证部署并执行回滚。也可在已登录且确认目标版本的本地环境使用 Wrangler 的版本与回滚命令。回滚会立即影响自定义域名，操作前应核对提交和版本。

Worker 回滚只恢复站点构建产物，不更改 R2 图片。若某次 JSON 引用了错误图片路径，回滚站点后仍应由图片管理员修正或恢复对应 R2 对象。参考 [Worker Rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/)。

## 7. 上线验证

### 7.1 DNS、TLS 与页面

```powershell
Resolve-DnsName -Name chromaart.lol -Type NS -Server 1.1.1.1
curl.exe -I https://chromaart.lol/
curl.exe -I https://chromaart.lol/chromas/<已存在的-slug>
curl.exe -I https://chromaart.lol/404
curl.exe -I https://www.chromaart.lol/
```

预期：

- 根域名和真实详情页返回成功响应，TLS 有效。
- 不存在路径（例如 `/404`）返回站点 404 页面和 HTTP 404。
- `www` 返回 301，目标为根域名的相同路径和查询字符串。

### 7.2 图片

从 JSON 选择真实记录，验证三种尺寸和 Tag 图标：

```powershell
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site3.jpg
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site4.jpg
curl.exe -I https://img.chromaart.lol/chromas/<instanceId>/site5.jpg
curl.exe -I https://img.chromaart.lol/tags/<实际标签文件名.png>
```

真实对象应成功返回正确图片 Content-Type。`https://img.chromaart.lol/` 根路径返回 404 并不表示绑定失败，应以真实对象验证。

### 7.3 禁止公开的路径

以下代表性路径必须返回 404：

```powershell
curl.exe -I https://chromaart.lol/prestige-chromas.json
curl.exe -I https://chromaart.lol/data/prestige-chromas.json
curl.exe -I https://chromaart.lol/assets/chromas/example/site3.jpg
curl.exe -I https://img.chromaart.lol/prestige-chromas.json
```

同时确认部署产物不包含 `.map` 文件。公开页面内容仍可能被逐页采集；这些检查只证明没有完整目录文件的直接下载入口。

## 8. 常见故障

- **构建失败**：先在同一提交本地运行 `pnpm release:build`，检查 Node.js 版本、锁文件和 JSON 校验输出。
- **Workers Build 或部署报告名称不匹配**：确认 Dashboard Worker 名称和 `wrangler.jsonc` 的 `name` 都是 `lol-prestige-chroma-hub`；名称不一致会使构建或部署失败。
- **Zone 长期 Pending**：核对 NameSilo 只保留 Cloudflare 分配的两条 Nameserver，并确认旧 DS 已清除。
- **域名返回 `SERVFAIL`**：优先检查父区 DS 是否仍指向旧 DNSSEC 配置。
- **Custom Domain 添加失败**：移除冲突的 A/CNAME 后重试。
- **页面图片 404**：核对 JSON 相对路径、`img.chromaart.lol` 的 Bucket 绑定、R2 对象键和 Content-Type；图片由管理后台负责补传或修正。
- **不存在路径返回 200**：确认部署使用当前 `wrangler.jsonc`，其中 `assets.not_found_handling` 必须为 `404-page`。

## 9. 首次上线清单

- [ ] Workers Builds 已连接正确 GitHub 仓库，生产分支为 `main`。
- [ ] 仓库为 private 时使用 Dashboard Git integration；只有仓库为 public 时才使用 Deploy to Cloudflare 按钮。
- [ ] Build command 为 `pnpm release:build`，Deploy command 为 `pnpm exec wrangler deploy`。
- [ ] Worker 名称为 `lol-prestige-chroma-hub`，且没有 Secrets 或 bindings。
- [ ] Cloudflare Zone 为 Active，NameSilo Nameserver 与当前 Zone 一致。
- [ ] 旧 DS 已清除，新的 DNSSEC DS 已正确生效。
- [ ] `chromaart.lol` 和真实详情页正常，未知路径返回 HTTP 404。
- [ ] `www` 的代理 AAAA `100::` 与 Redirect Rule 已生效，301 保留路径和查询字符串。
- [ ] `img.chromaart.lol` 的真实图片对象可访问，图片责任人已确认对象完整。
- [ ] 完整 JSON 路径和站点本地图片猜测路径返回 404。
- [ ] 推送一次仅修改 JSON 的提交后，Workers Builds 自动完成生产部署。
