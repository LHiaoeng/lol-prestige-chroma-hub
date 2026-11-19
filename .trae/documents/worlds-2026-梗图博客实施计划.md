# 2026 世界赛梗图双语博客实施计划

## Context

用户要求基于两条国服官网新闻（BLG 夺得 2026 全球总决赛冠军）与本地收集的 13 张梗图（11 张 JPG + 2 张 GIF，均已放入 `public/img/blog/`），新增一篇中英双语博客。用户明确：`publishedAt` 固定为 **2026-11-15**；除必要审查外**不运行测试套件**。

前置工作已完成：两条官方新闻事实已抓取、官方封面已下载压缩为 `public/img/blog/worlds-2026-blg-champion-cover.jpg`（1600×900），13 张梗图已压缩到 `public/img/blog/worlds-2026-*.jpg`（均 <330KB）。两张 GIF（7MB / 3.5MB）已转为动图 WebP（1.7MB / 535KB），分别对应大飞鼠与 TheShy 的奥恩梗。AI 性转小节另补三张图：两张 Bin 大小姐与 Zeus 的短剧截图（来源：17173 报道，62/69KB）与一张全员女版后宫图（126KB），全文共 16 张图。

已核实的官方事实（只写这些，不扩展未公布信息）：

- BLG 3-1 击败 GEN，夺得 2026 全球总决赛冠军，为队史首冠、LPL 第 4 座召唤师奖杯。
- Knight 成为 S3 以来首位中国冠军中单，终结韩国中单十三连冠。
- 来源 1：`https://lol.qq.com/news/detail.shtml?docid=2933519305216867218`（2026-11-15 07:51:22，英雄联盟官方）。
- 来源 2：`https://lol.qq.com/news/detail.shtml?docid=2073746607360656592`（2026-11-15 08:03:08，英雄联盟赛事官方）。
- 官方夺冠庆典：2026-11-15 至 2026-12-20，链接 `https://lol.qq.com/act/a20261115champion/preview.html?exchangeType=1&autoRefreshCookie=1&page=1&qd=true&zmGameId=lol`。

关键定位：梗图均为**网络流传的粉丝二创**，不声称官方出品；标识不清的战队/选手不强行点名。

## 变更文件

### 1. `src/blog/articles.ts`（头部插入第 1 条）

```ts
slug: 'worlds-2026-blg-champion-memes'
href: '/blog/worlds-2026-blg-champion-memes/'
publishedAt: '2026-11-15'
readingMinutes: 7
coverUrl: '/img/blog/worlds-2026-blg-champion-cover.jpg'
category: 'news'
adEligible: true
sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=2933519305216867218'
```

标题/摘要拟定（执行时可按正文微调，保持可独立说明价值）：

- EN：`2026 World Championship: BLG's First Title and Some Memes`
- ZH：`2026 全球总决赛：BLG 首冠和一些梗图`
- 摘要需覆盖：BLG 3-1 GEN、队史首冠、LPL 第 4 冠、Knight 终结韩中单纪录、16 张粉丝二创（含 2 张动图与 3 张 Bin 性转图）。

### 2. `src/pages/blog/worlds-2026-blg-champion-memes.astro`（新建）

沿用 `patch-26-22-prestige-chromas.astro` 的单 `<article class="blog-article">` + `isZh` 三元结构，避免中英两份重复 16 张图的宽高与 alt：

- frontmatter：`BaseLayout`、`Breadcrumb`、`BlogAdjacentNavigation`、`blogArticles`/`formatBlogDate`、`localizedPath`/`resolveLocale`/`Locale`、`SITE`；查找 slug 不存在即 throw。
- 定义共享 `memes` 数组：`key, src, width, height, altEn, altZh, captionEn, captionZh`，正文按 key 分组渲染 `<figure>`。
- `BlogPosting` 的 `datePublished` / `dateModified` = `2026-11-15`；`BreadcrumbList`；`FAQPage` 由双语 `faqEntries` 驱动，正文 `<details>` 同源渲染；`inLanguage` 中英分别 `zh-CN` / `en`。
- BaseLayout props：`image={article.coverUrl}`、`ogType="article"`、`publishedTime`/`modifiedTime`、`{jsonLd}`、`adPlacement="editorial-article"`。
- 图片规范：hero `loading="eager"`，正文全部 `loading="lazy"`；每张都有 `width`/`height`、`alt`、`data-alt-en`、`data-alt-zh`、`data-fallback="/placeholder.svg"`、`data-placeholder="/placeholder.svg"`；外链 `target="_blank" rel="noreferrer"`。
- 页面级 `<style>` 只写本页 `.meme-grid` / `.meme-card`：桌面 2–3 列、手机 1 列、`figure` 内图片 `width:100%;height:auto`。**不复制 `.chroma-*` / `.blog-article` 宽度规则**。

正文结构（中英各自完整，非逐句翻译）：

1. **导语**：BLG 3-1 GEN、队史首冠、LPL 第 4 冠；明确「梗图是赛后二创，不是官方物料」。
2. **冠军与纪录**：官方事实 + 庆典时间（2026-11-15 至 2026-12-20）；内链 `what-is-league-of-legends`（全球总决赛与赛区概念）。
3. **赛前的旗子**：`t1-14-0-lpl`（960×1203）、`faker-transformers`（1084×1449）。说明这两张是决赛前流传、决赛对阵为 BLG vs GEN，因此「T1 14-0 LPL」叙事的落点被改写；不评判选手。
4. **王朝终结**：`knight-ends-dynasty`（1280×1502）、`lck-mids-silenced`（839×1024）。对应 Knight 终结韩国中单十三连冠的官方事实。
5. **赛区群像**：`lpl-band-masks`（2271×1278）、`lpl-team-coins`（1260×1025）、`top-four-sign`（636×804）、`tom-lpl-orchestra`（1260×940）。对队徽不清晰的图（熊猫/红帽）只作描述，不强行认队。
6. **赛场与二创**：`champion-pool-stage`（796×1344）、`blg-panda-guitar`（1080×1068）、`player-genderbend`（1279×2274）。性别转换图注明为 AI/修图二创，不指名选手。
7. **官方来源 aside**：两条新闻链接 + 庆典链接，标注发布时间与发布方。
8. **FAQ**（3 条，`faqEntries`）：冠军与比分；LPL 第几冠 / Knight 纪录；梗图是否官方发布、如何理解。FAQ 中内链 `what-are-prestige-chromas`（基础文章内链）与 `patch-26-22-prestige-chromas`（同期版本资讯）。
9. `<BlogAdjacentNavigation currentSlug={article.slug} {locale} />`。

### 3. `src/pages/zh-cn/blog/worlds-2026-blg-champion-memes.astro`（新建）

仅 `import Article from '../../blog/worlds-2026-blg-champion-memes.astro';` 与 `<Article locale="zh-cn" />`。

### 4. 旧文回链（中英各一条）

- `src/pages/blog/patch-26-22-prestige-chromas.astro`：26.22 概览段落补一句「同期 BLG 夺冠与赛事梗图见……」，中英各一。
- `src/pages/blog/what-is-league-of-legends.astro`：电竞/赛事段落补一句链接，中英各一。

### 5. 内链日志

`.agents/skills/blog-article/references/internal-links.md` 末尾追加 2026-11-15 记录：新增 slug、正文内链目标、两篇旧文回链位置。

### 6. 测试文件同步（只改断言，不新增自造测试）

- `src/blog/articles.test.ts`：数量 36 → 37；`blogArticlesNewestFirst[0].slug` 改为新 slug；新增 `blogArticles[1]` 新条目断言；原有 `blogArticles[1..33]` 全部 **+1**（按降序 33→34、32→33 … 1→2 批量替换，含第 306–311、324 行的语义断言）；第 0 条仍为 `patch-26-22-prestige-chromas`。
- `scripts/site-build.test.ts`（1519–1599 段）：首页最新 3 篇断言改为「包含新 slug、不再包含 `prestige-chroma-summon-2026-23`」，中英各一处；文章总数断言由 `blogArticles.length` 自动更新。
- `scripts/blog-feature.test.ts`：第 15/186 行按 `blogArticles` 遍历，新页面与 zh 包装页存在即通过；页面白名单无需新增（本文不使用臻彩网格）。

## 验证

用户限制：**不运行 `pnpm test` / 测试套件**。执行：

1. `pnpm typecheck`
2. `git diff --check`
3. 人工审查：`git diff` 确认只新增本文相关文件与最小回链/测试断言改动，未触碰用户已有未提交改动。

可选（仅当页面编译存疑）：`pnpm release:build`，不算测试套件；若执行需报告产物路由。
