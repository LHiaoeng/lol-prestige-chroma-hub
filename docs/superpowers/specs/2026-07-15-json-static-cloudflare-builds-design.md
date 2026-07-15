# JSON 静态数据源与 Cloudflare 自动部署设计

## 目标

将展示站收缩为以 `data/prestige-chromas.json` 为唯一数据源的静态 Astro 站点。管理系统可以持续覆盖更新该 JSON；更新提交到 GitHub `main` 后，Cloudflare Workers Builds 自动校验、构建并部署，无需 D1、运行时数据 API、GitHub Actions 或本仓库内的 R2 同步流程。

## 范围

本次改造包括：

- 保留并校验更新后的 JSON 契约，包括 `skinSets`、`universes` 与实际 Tag PNG 文件名。
- 使用 JSON 在构建时生成首页、详情页、SEO 文件和浏览器筛选所需数据。
- 将搜索、筛选、排序和分页改为浏览器本地处理。
- 将 Cloudflare 配置收缩为静态资产部署。
- 使用 Cloudflare Workers Builds 连接 GitHub，并在 README 提供 Deploy to Cloudflare 按钮和首次配置说明。
- 删除 D1、运行时 `/api/chromas`、数据库迁移、发布 SQL、R2 上传、旧 GitHub Actions 及其专用测试和脚本。

图片不纳入本仓库发布流程。JSON 中的 `images` 是图片对象键的仓库相对表达，页面继续把它们映射到 `https://img.chromaart.lol/`；管理系统负责把图片同步到对应 R2 Bucket。

## 数据架构

`data/prestige-chromas.json` 是唯一业务数据事实源。`src/data/catalog.ts` 在 Astro 构建时读取它，并通过 `src/domain/chroma.ts` 完成结构、路径、唯一性和 slug 校验。校验失败时构建必须失败，旧线上部署保持不变。

JSON 会持续更新。日常发布流程固定为：

1. 管理系统覆盖生成 `data/prestige-chromas.json`。
2. 本地可选执行数据校验和测试。
3. 提交并推送到 GitHub `main`。
4. Cloudflare Workers Builds 自动安装依赖、校验、构建并部署新静态产物。

不生成数据库导入文件，不维护发布 ID，也不要求在 Cloudflare 上执行数据迁移。每次构建都是当前 Git 提交中 JSON 的完整快照，因此代码、页面和数据天然属于同一个可回滚版本。

## 页面与客户端数据流

Astro 在构建时完成以下工作：

- 首页静态渲染第一批卡片，保证首屏内容和无 JavaScript 基础体验。
- 为全部臻彩生成详情页。
- 生成 sitemap 与 robots 文件。
- 在首页嵌入经过字段裁剪的目录数据，供浏览器筛选和分页使用。

嵌入数据只包含列表展示和筛选需要的字段，不部署原始 `prestige-chromas.json`，也不提供完整 JSON 下载路由。浏览器脚本读取嵌入数据后，在内存中完成关键词、英雄、版本、分类、是否新品、排序和分页，并同步 URL 查询参数。450 条当前记录及可预见增长量适合这一方式；图片继续懒加载，不随目录数据进入页面。

详情页仍由静态路由生成，因此不依赖客户端目录数据，也不依赖 Worker 运行时代码。

## Cloudflare 部署

`wrangler.jsonc` 仅声明 Worker 名称、兼容日期和 `dist` 静态资产目录，不包含 `main`、D1 binding 或发布变量。部署命令使用项目锁定的 Wrangler 版本。

Cloudflare Workers Builds 首次连接配置为：

- 仓库：`LHiaoeng/lol-prestige-chroma-hub`
- 生产分支：`main`
- 构建命令：项目的发布校验与 Astro 构建命令
- 部署命令：`pnpm exec wrangler deploy`

README 中加入官方 Deploy to Cloudflare 按钮。按钮用于首次复制/连接和部署；对现有仓库，直接在 Cloudflare Worker 的 Builds 设置中连接 GitHub。连接完成后，每次推送 `main` 自动触发生产构建与部署，非生产分支可使用 Cloudflare 的预览版本。

自定义域名 `chromaart.lol`、`www.chromaart.lol` 与图片域名 `img.chromaart.lol` 仍在 Cloudflare Dashboard 管理。应用发布不修改 Nameserver、DNSSEC 或 R2 公共域名。

## 删除与保留

删除以下不再需要的内容：

- `worker/` 下的 D1 API 和查询代码及测试。
- `migrations/`。
- D1 发布 SQL、release ID、R2 同步、Cloudflare 资源初始化等脚本及专用测试。
- `.github/workflows/deploy.yml`。
- `wrangler.jsonc` 中的 D1、Worker 入口和发布变量。
- README 与部署手册中关于 D1、GitHub Secrets、R2 上传和复杂回滚的说明。

保留以下能力：

- JSON Schema 与业务约束校验。
- 外部数据导入工具；它作为可选的图片下载与规范化工具存在，不参与日常 JSON 直写发布流程。
- Astro 静态构建、详情页、SEO、图片回退和构建产物审计。
- 与静态站相适应的生产烟测。

## 错误处理与回滚

- JSON 不合法：数据校验或构建失败，Cloudflare 不部署新版本。
- 客户端筛选异常：保留服务端首屏卡片并显示明确错误，不请求运行时 API。
- 图片缺失：继续使用现有外部图片回退和本地占位图。
- 生产问题：在 Cloudflare Deployments 中回滚到上一成功版本，或回退 Git 提交后重新推送。因为数据包含在构建产物中，不存在代码与数据库版本不一致的问题。

## 验证策略

自动验证覆盖：

- 新 JSON 契约、路径和唯一性校验。
- 首页嵌入目录数据的安全序列化。
- 客户端筛选、排序、分页和 URL 状态恢复。
- 全部详情页和 SEO 文件静态生成。
- 构建产物不含原始 JSON、source map、D1 配置或数据库文件。
- Wrangler 静态资产配置可被本地预览和部署命令识别。

实施完成前执行项目测试、类型检查、数据校验、生产构建和产物审计。现有工作区中与新版 JSON 契约相关的未提交修改视为用户改动，实施时在其基础上完成，不回滚或覆盖。
