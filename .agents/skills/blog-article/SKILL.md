---
name: blog-article
description: 为博客系统新增中英双语文章。涵盖元数据注册、Astro 页面编写、SEO 结构化数据、测试更新与构建验证。当用户要求新增博客文章、博文或 blog post 时使用。
---

# 新增博客文章

为站点新增一篇可维护的中英双语文章：元数据、英文主页面、中文路由包装页、SEO、内链、测试和构建结果必须一起交付。先判断文章类型，再只加载对应参考文件。

## 触发与前置

- 用户要求新增博客、博文、新闻改写或文章页面时触发。
- 提供 `lol.qq.com` 新闻链接时，先使用 `league-of-legends-cn-official-news` 或 `lol-news-detail` skill 获取标题、发布时间、正文和图片；不得凭链接猜正文。
- 先读取 `CONTEXT.md`，确认“臻彩”“璀璨臻彩”“华彩秘宝”“至臻皮肤”等领域术语和 `_Avoid_` 表述。
- 新建或修改文章前，读取 `references/checklist.md`；文章包含目录臻彩卡片网格时，再读取 `references/chroma-grid.md`。
- 仅在常青指南文章中读取 `src/blog/evergreen-guides.ts` 的维护要求；新闻/活动文章不登记为常青指南。

## 交付边界

每篇文章都需要：

1. `src/blog/articles.ts` 头部的双语元数据；`publishedAt` 使用完整 ISO 时间（含时区或 `Z`），排序按发布时间从新到旧。
2. `src/pages/blog/{slug}.astro`，同时渲染英文和中文内容块，并向 `BaseLayout` 传入 `image`、`ogType="article"`、`publishedTime`、`modifiedTime`、`jsonLd`；`BaseLayout` 据此自动输出 canonical、hreflang(en/zh-CN/x-default)、Open Graph、`article:published_time` / `article:modified_time`、Twitter summary_large_image 和 JSON-LD `<script>`。文章自己在 `jsonLd` 数组里放 `BlogPosting`、`BreadcrumbList`、`FAQPage` 和视文章类型追加的 `ItemList`/`HowTo`/`WebPage`。只要页面有 FAQ 段落就必须带 `FAQPage`；FAQ 问答统一为双语 `faqEntries` 数组，同一份数据既渲染正文 `<details>` 也驱动 `FAQPage.mainEntity`，避免手写两套。
3. `src/pages/zh-cn/blog/{slug}.astro` 只做包装：`import Article` 与 `<Article locale="zh-cn" />`。
4. `scripts/blog-feature.test.ts` 的页面契约和 `scripts/site-build.test.ts` 的路由/产物回归；必要时更新 `src/blog/articles.test.ts` 的数量与排序断言。
5. 至少两条正文内链、FAQ 中一条基础文章内链，并在 `references/internal-links.md` 和至少两篇相关旧文中回链新文章。

条件交付：

- 常青指南：登记 `evergreenGuideMaintenance`，渲染 `ArticleMaintenance`，显示作者、来源、最后核验日期、纠错入口和两条相关指南；`modifiedTime` 与可见核验日期一致。
- 官网新闻/活动文章：保留官方 `sourceUrl`、官方来源链接和公告明确的时间/获取条件；不把未公布的概率、结束日期或可用性写成事实。
- 本地封面图：保存到 `public/img/blog/`，使用 `compress-image` skill 压到 1MB 以内；目录原画继续使用 `img.chromaart.lol` 路径，不复制远程图片。

## 元数据与页面结构

元数据至少包含：`slug`、`href`、`titleEn`、`titleZh`、`summaryEn`、`summaryZh`、`publishedAt`、`readingMinutes`、`coverUrl`、`coverAltEn`、`coverAltZh`。标题和摘要要能独立说明文章价值，不把英文翻译腔带入中文。

页面 frontmatter 通常需要：

```ts
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogAdjacentNavigation from '../../components/BlogAdjacentNavigation.astro';
import { blogArticles, formatBlogDate } from '../../blog/articles';
import { localizedPath, resolveLocale, type Locale } from '../../i18n/config';
import { SITE } from '../../seo/site';
```

从 `Astro.props.locale ?? resolveLocale(Astro.currentLocale)` 得到 locale；用 `localizedPath(locale, ...)` 生成站内链接。每个页面都要设置 `title`、`description`、`canonical`，并向 `BaseLayout` 传入 `image`、`ogType="article"`、`publishedTime`、`modifiedTime` 与 `jsonLd`。

图片必须有稳定的 `width`/`height`、描述性 `alt`、`data-alt-en`、`data-alt-zh`、`data-fallback`、`data-placeholder`；首图 `loading="eager"`，正文图 `loading="lazy"`。外部链接使用 `target="_blank" rel="noreferrer"`。

## 双语写作

- 英文和中文分别组织信息，不逐句翻译；两种语言都要有完整事实、内链和 FAQ。
- 开头直接给结论或读者要解决的问题；小标题写具体信息；数字、日期、版本和获取限制优先于空泛形容。
- 避免模板化 AI 词和广告腔：英文少用 `delve`、`explore`、`comprehensive`、`seamless`、`robust`、`leverage`、`unlock`、`empower`；中文少用“此外”“至关重要”“深入探讨”“值得一提的是”“不可否认”。
- 官网公告只支持公告明确的事实；活动规则有歧义时链接官方活动页并明确不确定性。

## 内容组件与样式边界

- 目录臻彩原画的大图说明可沿用文章自己的 `showcase`/`figure`，但目录卡片网格必须使用 `BlogChromaGrid` + `BlogChromaCard`，接口和示例见 `references/chroma-grid.md`。
- 不在文章页面复制臻彩卡片 HTML、颜色圆点、图片回退、详情链接或 `.chroma-grid`/`.chroma-card-*` CSS。共享组件统一处理 3/6 列、移动端两列、`padding: 0`、颜色圆点、catalog 图片回退、双语 alt、详情链接与未收录奖励的占位卡。
- 文章页面只维护文章壳层、表格、FAQ、官方来源和该文章独有的布局。通用列表规则不得重新给 `.chroma-grid` 添加左内边距；共享网格使用更高优先级的 `padding: 0`。
- `BlogChromaCard` 的 `chroma` 缺省时必须同时提供 `labelEn` 与 `labelZh`，用于公告提到但尚未进入目录的奖励；不要伪造详情链接。

## 测试与验证

新增行为先补相邻测试。博客契约测试应关注可交付行为：元数据、双语路由、结构化数据、官方来源、共享组件使用和构建路由；不要把每篇文章的重复 CSS 作为契约。

```powershell
pnpm typecheck
pnpm test
pnpm data:validate       # 修改 catalog 数据时
pnpm release:build
git diff --check
```

技能文件本身修改后运行：

Use `quick_validate.py` from the system `skill-creator` skill with `.agents/skills/blog-article` as its argument.

失败的测试、类型检查、数据校验或构建不得绕过；最终说明实际运行的验证命令。

## 参考路由

- 组件用法：`references/chroma-grid.md`
- 页面骨架与 SEO 片段：`references/page-template.md`
- 交付检查：`references/checklist.md`
- 内链矩阵：`references/internal-links.md`
- 维护组件：`src/components/ArticleMaintenance.astro`
- 常青指南登记：`src/blog/evergreen-guides.ts`
- 完整示例：`src/pages/blog/what-are-prestige-chromas.astro`
