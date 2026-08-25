# 国际化与多语言 SEO

## 当前语言

| 内部 locale | URL | HTML `lang` | hreflang | Open Graph |
| --- | --- | --- | --- | --- |
| `en` | 无前缀 | `en` | `en` | `en_US` |
| `zh-cn` | `/zh-cn/` | `zh-CN` | `zh-CN` | `zh_CN` |

英文是默认语言，保留 `/`、`/blog/`、`/chromas/<slug>/` 等现有路径。简体中文使用 `/zh-cn/`、`/zh-cn/blog/` 和 `/zh-cn/chromas/<slug>/`。详情页同时保留基于 `skinId` 的中英文兼容入口，例如 `/chromas/147063/` 与 `/zh-cn/chromas/147063/`；数字入口的 canonical、hreflang 和站内链接始终指向可读 slug 主地址。图鉴详情页仍可访问，但统一输出 `noindex, nofollow`，且不进入 sitemap。不要创建含义不明确的 `/zh/`。

语言由 URL 决定。页面不会根据浏览器语言、IP、请求头或本地偏好自动跳转。Header 的语言入口是普通链接，禁用 JavaScript 后仍可使用。

## 代码入口

- `astro.config.mjs`：Astro i18n 路由注册；
- `src/i18n/config.ts`：locale 元数据、路径转换与 alternate URL；
- `src/layouts/BaseLayout.astro`：`lang`、canonical、hreflang、Open Graph 与全局语言导航；
- `src/pages/zh-cn/`：简体中文静态路由 wrapper；
- `src/seo/chroma-seo.ts`：详情页本地化 SEO；
- `src/seo/sitemap.ts`：双语固定资料页和博客文章 URL、图片与 XHTML alternate；不输出图鉴详情页。

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

发布前抽查英文与简体首页、博客列表、文章、详情、Editorial Policy、About、Privacy、404 与 sitemap，确认可索引页面 canonical 自引用、alternate 双向、详情页 `noindex`、站内链接保持当前语言，且构建产物不包含完整 `prestige-chromas.json`。
