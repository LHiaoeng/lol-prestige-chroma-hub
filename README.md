# LoL Chroma Art

面向海外用户、以英文为默认语言的《英雄联盟》国服臻彩原画图鉴，定位语为 **China-Exclusive Chroma Splash Art Archive**。这里的“中国服专属”限定的是中国大陆服为臻彩单独提供的臻彩原画，不表示对应炫彩一定仅限中国大陆服。英文使用现有无前缀 URL，简体中文使用 `/zh-cn/` 独立静态 URL。Astro 在构建时读取 `data/prestige-chromas.json`，生成双语静态首页、详情页、博客和 SEO 文件，再由 Cloudflare Worker 仅托管 `dist/` 静态资产。站点没有运行时数据库或数据接口。

臻彩原画（Prestige Chroma Splash Art）是国服将炫彩升级为臻彩后单独提供的原画；炫彩本身并不天然拥有独立原画。站内将“臻彩”译作 `Prestige Chroma`，但不将其描述为传统 `Prestige Skin`。

图片由管理后台上传和维护在 R2，通过 `https://img.chromaart.lol` 公开；本仓库只保存 JSON 中的图片相对路径，不保存图片文件。

## 博客

英文博客位于 `/blog/`，简体中文博客位于 `/zh-cn/blog/`；两种语言使用相同文章 slug。文章正文直接由共享 Astro 页面维护，列表元数据集中在 `src/blog/articles.ts`。英雄覆盖率文章由已提交的 `data/champion-coverage.snapshot.json` 生成完整静态正文；浏览器打开页面后可以显式刷新辅助数据，失败时保留快照。普通构建不在线更新快照，维护者使用 `pnpm coverage:snapshot` 在核对两个区域数据视图、来源 URL、抓取时间和内容版本后更新它。公开页面不公开 `data/prestige-chromas.json`，也不增加站点运行时内容接口。需要本地维护或便于迁移的文章素材放入 `public/images/blog/<article>/`。

图鉴首页和中英文博客列表、文章页保留广告位；所有中英文臻彩详情页均标记为 `noindex`，并从 `sitemap.xml` 排除。英雄、皮肤系列和宇宙保留双语静态列表与详情壳，运行时皮肤只保留独立详情壳；这些运行时资料页通过浏览器直接读取当前本地化视图和数据通道的 CommunityDragon 资料，动态详情由客户端标记 `noindex`，旧实体 URL 不提供兼容页。臻彩详情页仍保持完整静态正文，浏览器只渐进补充对应英雄和炫彩所属皮肤资料。详情页不加载广告脚本，博客页面通过显式广告边界统一加载广告；隐私页、关于页和其他资料页不承载广告。

运行时资料入口包括 `/champions/`、`/skinlines/`、`/universes/` 和 `/pbe-additions/` 四个双语目录/比较壳，以及独立的英雄、皮肤、系列和宇宙详情壳；英雄详情使用 `/champions/detail/?id={championId}`，皮肤详情使用 `/skins/detail/?id={skinId}&champion={championId}`，系列和宇宙详情分别使用 `/skinlines/detail/?id={skinlineId}` 与 `/universes/detail/?id={universeId}`。静态臻彩详情还会渐进加载可失败的英雄、所属皮肤和炫彩补充资料。默认通道是 `pbe`，显式 `channel=pbe` 与 `channel=latest` 都有效；两类浏览器入口共享取消、迟到响应保护、成功后提交 URL、保留旧内容和失败重试的通道生命周期。`data/prestige-chromas.json` 仍是中国服臻彩编辑型目录，不决定 CommunityDragon 实体是否存在。

系列详情、宇宙详情和 PBE 新增页才会按需读取完整 `skins.json`；英雄目录/详情、运行时皮肤详情、首页、臻彩详情和博客不会加载它。PBE 新增在同一本地化视图内比较 `pbe` 与 `latest`，同时校验 `compat-version-metadata.json` 的版本字段；必要数据失败时不展示部分差集。运行时实体详情初始 HTML 保持 `noindex`，目录壳和 PBE 新增页进入双语 sitemap，站点不生成逐实体 HTML。

CommunityDragon 的通用 RAW 访问规则、版本与区域数据视图，以及英雄联盟和云顶之弈资源说明，见 [CommunityDragon 资源指南](docs/CD资源指南.md)。

作者与编辑说明位于 `/editorial-policy/`，简体中文位于 `/zh-cn/editorial-policy/`。页面公开本站的维护主体、编辑原则、资料来源、核验方式和纠错渠道；该页与 About、Privacy 等资料页不承载广告。

## 本地开发

要求 Node.js 22+ 与 pnpm 10。

```bash
pnpm install
pnpm data:validate
```

`data/prestige-chromas.json` 是唯一目录数据源。首次没有数据时它是空数组；不要把完整 JSON 放入 `public/`。

### 开发模式（推荐日常使用）

```bash
pnpm dev
```

浏览器打开 `http://localhost:4321`。Astro 会监听源码和 JSON 变化并自动刷新；如果端口被占用，请使用终端实际输出的地址。

### 生产产物预览（发布前检查）

```bash
pnpm build
pnpm preview
```

`pnpm build` 先生成 `dist/`，`pnpm preview` 再通过当前项目配置的 `wrangler dev` 提供这些静态产物，行为更接近 Cloudflare Workers Static Assets。浏览器访问 Wrangler 在终端输出的本地地址。

两种模式下的图片都会从 `https://img.chromaart.lol` 加载，本地仓库不保存图片文件。断网或远程对象不存在时，页面会尝试外部回退图片，最终显示本地占位图。

可选的导入器用于处理不符合最终契约的外部导出；管理后台已生成标准 JSON 时，直接覆盖目标文件即可。

```bash
pnpm data:import --input ./exports/prestige-chromas.json --dry-run
pnpm data:import --input ./exports/prestige-chromas.json
```

## 日常更新

每次目录更新按以下流程执行：

1. 用管理后台生成的文件覆盖 `data/prestige-chromas.json`。
2. 运行 `pnpm data:validate`；发布前运行 `pnpm release:build`。
3. 提交 JSON 并推送到 `main`，Cloudflare Workers Builds 会自动重新构建和部署。

图片不随 Git 更新；新增或替换图片应先由管理后台同步到 `img.chromaart.lol` 对应的 R2 对象路径。

## 验证与发布构建

```bash
pnpm test
pnpm typecheck
pnpm data:validate
pnpm release:build
```

`release:build` 会依次运行测试、类型检查、JSON 校验、Astro 构建和产物审计。审计会阻止完整目录 JSON、源数据路径或 source map 进入部署产物。

## 部署到 Cloudflare

私有仓库应在 Cloudflare Dashboard 中使用已登录的 GitHub 身份连接 `LHiaoeng/lol-prestige-chroma-hub`，创建 Workers Builds 项目。Deploy to Cloudflare 按钮只支持公开仓库；只有将仓库设为 public 后才能使用：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LHiaoeng/lol-prestige-chroma-hub)

无论使用 Dashboard 连接还是按钮，都必须在首次部署前核对并设置：

- Production branch：`main`
- Build command：`pnpm release:build`
- Deploy command：`pnpm exec wrangler deploy`

不要接受把 package script `build` 自动识别为发布构建的结果。Worker 名称必须与 `wrangler.jsonc` 中的 `lol-prestige-chroma-hub` 一致，否则 Workers Build 会失败。项目是纯静态部署，不需要添加 Secrets、环境变量或运行时 bindings。

英文隐私说明位于 `/privacy/`，简体中文位于 `/zh-cn/privacy/`，涵盖静态语言 URL、Cloudflare 托管信息以及预计接入的 Google AdSense。正式启用广告时，还需根据投放地区在 AdSense 中配置适用的同意管理平台（CMP）。国际化维护规则见 [国际化与多语言 SEO](docs/国际化与多语言SEO.md)。

生产域名只把 `chromaart.lol` 绑定为 Worker Custom Domain；`www.chromaart.lol` 使用代理的占位 DNS 记录和 Redirect Rule 301 到根域名，`img.chromaart.lol` 继续使用现有 R2 Custom Domain。详细步骤见 [Cloudflare 部署手册](docs/chromaart.lol-Cloudflare部署手册.md)。
