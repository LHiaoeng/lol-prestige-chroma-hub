# 国际化与多语言 SEO

## 当前语言

| 内部 locale | URL | HTML `lang` | hreflang | Open Graph |
| --- | --- | --- | --- | --- |
| `en` | 无前缀 | `en` | `en` | `en_US` |
| `zh-cn` | `/zh-cn/` | `zh-CN` | `zh-CN` | `zh_CN` |

英文是默认语言，保留 `/`、`/blog/`、`/chromas/<slug>/` 等现有路径。简体中文使用 `/zh-cn/`、`/zh-cn/blog/` 和 `/zh-cn/chromas/<slug>/`。云顶之弈小小英雄列表使用 `/tft/companions/` 与 `/zh-cn/tft/companions/`。静态臻彩详情页保持可索引；CommunityDragon 运行时详情使用数字查询参数并由客户端设置 `noindex`，不生成实体 sitemap 条目。不要创建含义不明确的 `/zh/`。

页面的正文语言由 URL 决定。直接或从外站打开 `/` 时，Cloudflare Worker 优先使用已保存的站点语言偏好，否则按 `Accept-Language` 的优先级匹配。匹配简体中文时，在返回 HTML 前以 `302` 跳到 `/zh-cn/` 并保留查询参数。缺少有效偏好时显示英文。请求带有同源导航信号时沿用站内链接指向的语言，来源未知时按直接访问处理。`/zh-cn/` 与所有内页直接按 URL 展示。

页头的语言入口是原生提交按钮。Worker 接收同源表单，在 `site-language` Cookie 中保存手动选择一年，然后以 `303` 打开对应语言的页面。禁用 JavaScript 后仍可使用。清除站点 Cookie 后恢复浏览器判断。首页语言选择和手动切换的响应均使用 `Cache-Control: private, no-store`。

页头按钮沿用文字型图标按钮的样式、尺寸、焦点反馈和双语可访问名称。生产构建使用原生 `type="submit"` 提交偏好。开发时，`pnpm dev` 直接打开对应页面。可通过 `pnpm build` 和 `pnpm preview --config wrangler.jsonc` 验证完整的 Worker 行为。[固定版本 Antdv Next Button 源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/button/Button.tsx#L406)

首页标题使用本地化的三款游戏内容聚合站标语和品牌名，页面描述突出臻彩原画、目录、版本与活动。站点结构化数据使用品牌名 LoL Chroma Art，不把标语或板块名称当作站点别名。

## 代码入口

- `astro.config.mjs`：Astro i18n 路由注册；
- `src/i18n/config.ts`：locale 元数据、路径转换与 alternate URL；
- `src/i18n/language-preference.ts` 和 `src/worker.ts`：浏览器语言匹配、首页跳转和手动切换；
- `src/layouts/BaseLayout.astro`：`lang`、canonical、hreflang、Open Graph、全站唯一的 Google 代码与全局语言导航；
- `src/pages/zh-cn/`：简体中文静态路由 wrapper；
- `src/seo/chroma-seo.ts`：详情页本地化 SEO；
- `src/seo/sitemap.ts`：双语固定资料页和博客文章 URL、图片与 XHTML alternate；不输出图鉴详情页。

可索引的 CommunityDragon 资料列表与臻彩详情标题、描述应自然包含本地化游戏名（“英雄联盟”/“League of Legends”）。运行时详情仍为 `noindex`，除非为具体实体提供稳定 URL、独立元数据和可索引的静态正文。`BreadcrumbList` 必须与页面可见的面包屑层级一致。

云顶之弈小小英雄列表的 `CollectionPage` 使用本地化游戏名；其面包屑包含首页、云顶之弈和小小英雄三级。

页面模板在构建时根据 locale 选择文案。每个公开 URL 只显示对应语言正文；新增页面必须同时提供英文和简体中文路由、标题、描述、可访问名称、JSON-LD 与站内链接，页面实际包含图片时还必须提供对应语言的图片 Alt。

## Canonical 与 hreflang

每个可索引页面使用自引用 canonical，并输出完整的：

- `hreflang="en"` 指向英文页面；
- `hreflang="zh-CN"` 指向简体中文页面；
- `hreflang="x-default"` 指向英文页面。

两种页面的 alternate 集合必须完全一致。禁止中文页面 canonical 到英文，也禁止用 canonical 代替 hreflang。404 页面使用 `noindex, nofollow`，不输出 canonical 或 alternate。

Sitemap 为每种语言分别输出 `<url>`，并在每个条目中重复相同的 XHTML alternate 集合。固定资料页和博客封面标题按当前条目语言生成；图鉴详情页虽然保留语言切换所需的 canonical 与 alternate，但不输出 sitemap 条目。

## 新增页面或文章

1. 在英文路由实现共享页面模板，并接收或解析 `Locale`；
2. 在 `src/pages/zh-cn/` 创建对应 wrapper；
3. 所有站内链接通过 `localizedPath()` 或文章 URL helper 生成；
4. JSON-LD 的 URL、面包屑与 `inLanguage` 使用当前 locale；
5. 只有符合索引策略的页面才加入 sitemap 的 canonical pathname 集合；图鉴详情页不加入；
6. 扩展相邻单元测试和 `scripts/site-build.test.ts` 的产物断言。

必要中文文案缺失时应阻止发布，不静默显示英文正文。

## 未来增加繁体中文

繁体中文预留方案为：内部 locale `zh-tw`、URL `/zh-tw/`、HTML/hreflang `zh-TW`、Open Graph `zh_TW`。启用步骤：

1. 在 Astro 与 `src/i18n/config.ts` 注册 `zh-tw`；
2. 完成所有必要繁体文案与 `/zh-tw/` wrapper；
3. 扩展 URL helper、layout、sitemap 与构建审计测试；
4. 确认所有三语页面互相声明 `en`、`zh-CN`、`zh-TW` 与 `x-default`；
5. 完整发布构建通过后再上线，不能用简体正文冒充繁体页面。

## 验证

```bash
pnpm test
pnpm typecheck
pnpm data:validate
pnpm release:build
```

发布前抽查英文与简体首页、博客列表、文章、静态臻彩详情、运行时目录壳、About、Privacy、404 与 sitemap，确认可索引页面 canonical 自引用、alternate 双向、运行时详情 `noindex`、站内链接保持当前语言，且构建产物不包含完整 `prestige-chromas.json`。

用本地 Wrangler 验证中文浏览器的首页跳转、不带 `Accept-Language` 的英文首页、站内导航、手动选择优先级及普通内页。检查两种语言的页头在桌面、手机和禁用 JavaScript 时均可切换。
