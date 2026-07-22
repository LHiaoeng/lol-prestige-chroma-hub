# 全站国际化与多语言 SEO 设计

## 目标

将当前依赖浏览器脚本切换中英文、共用单一 URL 的站点，改造成英文与简体中文分别拥有独立、可索引静态 URL 的全站国际化架构。英文继续使用现有路径，简体中文统一使用 `/zh-cn/` 前缀；未来可在不迁移现有中文 URL 的前提下增加 `/zh-tw/` 繁体中文版本。

站点继续保持 Astro 静态构建、构建时读取唯一目录数据源、无运行时内容 API，并部署到 Cloudflare Workers Static Assets。

## 语言与 URL 约定

当前发布语言如下：

| 用途 | 英文 | 简体中文 |
| --- | --- | --- |
| 内部 locale | `en` | `zh-cn` |
| URL 前缀 | 无 | `/zh-cn/` |
| HTML `lang` | `en` | `zh-CN` |
| `hreflang` | `en` | `zh-CN` |
| Open Graph locale | `en_US` | `zh_CN` |

未来繁体中文使用内部 locale `zh-tw`、URL 前缀 `/zh-tw/`、HTML 与 hreflang 值 `zh-TW`，以及 Open Graph locale `zh_TW`。不使用含义不明确的 `/zh/`。

英文为默认语言且不加前缀：

- `/` ↔ `/zh-cn/`
- `/blog/` ↔ `/zh-cn/blog/`
- `/blog/<slug>/` ↔ `/zh-cn/blog/<slug>/`
- `/chromas/<slug>/` ↔ `/zh-cn/chromas/<slug>/`
- `/about/` ↔ `/zh-cn/about/`
- `/privacy/` ↔ `/zh-cn/privacy/`

两种语言共享稳定的英文 slug。现有英文 URL 不变，因此不需要迁移或重定向。`/zh/` 不建立索引页，也不重定向到任一中文变体。

## Astro 路由架构

启用 Astro 原生 i18n 路由：默认 locale 为 `en`，`prefixDefaultLocale` 保持 `false`，简体中文页面位于 `src/pages/zh-cn/`。站点继续使用 `output: 'static'` 与目录式构建产物。

路由文件保持轻量，只负责确定 locale、取得静态路径并调用共享页面视图。首页、详情页、博客、About 与 Privacy 的实际渲染逻辑抽取为 locale-aware Astro 组件或纯函数，避免维护两套完整模板。

新增集中式 locale 配置与 URL 工具，负责：

- locale、HTML lang、hreflang 与 Open Graph locale 映射；
- 为任意站内 pathname 增加或移除 locale 前缀；
- 生成当前页面 canonical、对应语言 alternate 和 `x-default`；
- 为导航、面包屑、卡片、博客相邻文章及详情链接生成当前语言 URL；
- 在未来加入新 locale 时，通过单一注册表扩展全站行为。

## 单语静态输出

每个 URL 只输出该 URL 对应语言的可见内容与可访问文本。当前依赖 `data-en`、`data-zh`、`data-language-content` 和 localStorage 修改正文的模式退出页面渲染主流程。

短文案维护在类型安全的翻译资源中。博客等长正文可以继续使用共享 Astro 模板，但必须由构建时 locale 条件选择内容，不能把另一语言全文作为隐藏 DOM 输出。目录卡片、筛选、分页、图片 Alt、ARIA、Placeholder 和动态状态文本都由当前 locale 初始化。

发布语言的必要翻译缺失时构建失败，不静默回退为英文。未来繁体中文只有在对应页面与必要文案完整后才加入已发布 locale 列表。

## SEO 规则

每个可索引页面必须满足：

1. canonical 指向当前语言页面自身；
2. `<head>` 同时列出自身与全部已发布对应语言版本；
3. `x-default` 指向英文页面；
4. 每个语言版本中的 alternate 集合完全一致并使用绝对 URL；
5. `<html lang>`、title、description、Open Graph、Twitter、图片 Alt、面包屑与 JSON-LD 使用当前页面语言；
6. JSON-LD `inLanguage` 只标记当前版本，不再把同一页面声明为双语；
7. Open Graph 输出当前 `og:locale`，并为其他已发布语言输出 `og:locale:alternate`。

英文 canonical 不得指向中文，中文 canonical 也不得指向英文。不同语言页面通过 hreflang 建立对应关系，不通过跨语言 canonical 合并。

Sitemap 增加 XHTML 命名空间。每个英文和简体中文 URL 都作为独立 `<url>` 条目出现，并在条目内列出包含自身在内的完整语言 alternate 集合与 `x-default`。博客 `lastmod`、图片地址及本地化图片标题继续由数据生成。robots.txt 继续只引用主 sitemap。

404 页面不加入 sitemap、不输出 canonical 或 hreflang；页面提供英文与简体中文主页入口。

## 导航与客户端行为

语言切换器改为普通 `<a>`，链接到相同内容的对应语言 URL，并带有正确的可访问名称、`lang` 和 `hreflang`。禁用 JavaScript 后仍可完成语言切换。

不根据浏览器语言、IP、`Accept-Language` 或历史 localStorage 值自动重定向。可以在用户主动点击语言链接时记住最近选择，但该值不能覆盖当前 URL 的语言，也不能让搜索引擎看到不同内容。

首页在语言切换时保留可跨语言复用的筛选、排序和分页查询参数。其他页面仅切换 pathname，保留 URL fragment；无法证明语义一致的参数不跨语言复制。

目录浏览器不再监听全局 `languagechange` 事件。构建产物只嵌入当前页面渲染与筛选所需的目录字段，继续禁止把完整源 JSON 发布到 `public/`。

英雄覆盖率文章仍在构建时生成完整静态快照。英文页渲染英文内容，简体页渲染中文内容；浏览器刷新逻辑只更新当前页面语言的 DOM，并在请求失败时保留对应语言的静态快照。

## 内容模型

博客文章元数据保留语言无关的 slug、发布日期、阅读时间、封面和来源信息，将标题、摘要与图片 Alt 组织为明确的 locale 映射。文章 URL 由统一路由工具从 slug 与 locale 派生，不再把单一英文 `href` 当作所有语言的地址。

详情页 SEO 生成器接收 locale，分别从目录的英文或中文字段生成标题、描述、图片 Alt、面包屑与结构化数据。`China Exclusive` 的既有定义保持不变：它描述中国服务器提供独立炫彩原画，不声称炫彩本身仅限中国服务器。

## 错误处理与一致性

以下情况必须使测试或构建失败：

- 已发布 locale 缺少必要配置或翻译；
- 同一内容的语言 URL 无法互相映射；
- canonical、hreflang 或 JSON-LD URL 与当前路由不一致；
- hreflang 缺少自身、缺少对应版本、不是双向关系或存在重复；
- sitemap 缺少已发布页面、包含非 canonical URL，或 alternate 集合与 HTML 不一致；
- 中文静态页面仍依赖客户端脚本才能显示主要内容；
- 构建产物泄露完整目录 JSON。

## 测试与验收

采用相邻单元测试与构建产物测试覆盖：

- locale 注册表、路径前缀、对应 URL 与查询参数处理；
- BaseLayout 的 lang、canonical、hreflang、Open Graph 和单语输出；
- 首页、About、Privacy、博客列表、全部博客文章及全部臻彩详情的英文/简体路由；
- 博客元数据、相邻文章链接和动态英雄覆盖的本地化行为；
- 详情页 SEO、图片 Alt、面包屑与 JSON-LD；
- sitemap 中全部 URL、XHTML alternate、图片与 lastmod；
- 构建产物中不存在隐藏的另一语言正文和完整源 JSON；
- 404 不参与索引元数据。

最终运行 `pnpm release:build`，要求 Vitest、Astro/TypeScript 检查、数据校验、静态构建和产物审计全部通过。抽查英文与简体首页、博客文章和详情页，确认站内链接不跨语言、语言切换互相对应，并在 320px 至桌面宽度保持现有响应式与无障碍质量。

## 文档更新

新增 `docs/国际化与多语言SEO.md`，记录 locale 注册、URL 规范、文案添加流程、hreflang/canonical 规则、未来增加繁体中文的步骤及验证命令。

同步更新：

- `README.md`：站点定位、语言 URL、博客地址、开发与验证说明；
- `docs/frontend-design.md`：替换“共用 URL 与客户端切换”架构，更新路由、组件、客户端、SEO 和验收章节；
- `docs/数据源与JSON结构.md`：更新目录与英雄覆盖内容如何按 locale 进入静态页面；
- 其他直接声明旧语言路由或 SEO 行为的现行文档。

历史设计与已完成计划保留为历史记录，不为追溯一致性批量改写。

## 非目标

- 本次不发布繁体中文内容，只预留可扩展结构；
- 不引入运行时数据库、内容 API、服务端渲染或基于请求头的语言协商；
- 不翻译 slug、品牌名、外部官方活动名称或缺乏官方译名的专有名词；
- 不进行与国际化无关的视觉重构、数据契约调整或部署流程变更。
