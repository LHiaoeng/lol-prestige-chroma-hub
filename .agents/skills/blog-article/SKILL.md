---
name: blog-article
description: 为博客系统新增中英双语文章。涵盖元数据注册、Astro 页面编写、SEO 结构化数据、测试更新与构建验证。当用户要求新增博客文章、博文或 blog post 时使用。
---

# 新增博客文章

## 触发条件

用户要求新增博客文章、博文、blog post，或要求为博客添加某个主题的内容。

## 交付清单

每篇新文章必须完成以下 **四层** 变更，缺一不可：

| 层 | 文件 | 动作 |
|---|---|---|
| 元数据 | `src/blog/articles.ts` | 在 `blogArticles` 数组**头部**插入新条目 |
| 页面 | `src/pages/blog/{slug}.astro` | 创建双语 Astro 页面 |
| 路由 | `src/pages/zh-cn/blog/{slug}.astro` | 创建中文路由包装页（3 行） |
| 测试 | `src/blog/articles.test.ts` | 更新文章数量断言 |
| 测试 | `scripts/blog-feature.test.ts` | 新增页面结构断言 |
| 测试 | `scripts/site-build.test.ts` | 新增构建产物路由断言 |

## 第一步：元数据注册

在 `src/blog/articles.ts` 的 `blogArticles` 数组**最前面**添加新条目：

```ts
{
  slug: 'kebab-case-slug',
  href: '/blog/kebab-case-slug/',
  titleEn: 'English Title',
  titleZh: '中文标题',
  summaryEn: 'English summary, 1-2 sentences, for SEO and index page.',
  summaryZh: '中文摘要，1-2 句，用于 SEO 和首页。',
  publishedAt: 'YYYY-MM-DD',
  readingMinutes: 5,  // 根据内容量估算
  coverUrl: '/img/blog/cover-filename.jpg',  // 或外部 URL
  coverAltEn: 'English alt text for cover image',
  coverAltZh: '中文封面替代文字',
  sourceUrl: 'https://...',  // 可选，内容来源
}
```

**规则**：
- `slug` 全小写、连字符分隔
- `publishedAt` 使用 ISO 日期格式
- `coverUrl` 本地图片放 `public/img/blog/`，也可使用 `https://img.chromaart.lol/...` 外部地址
- 保存到 `public/img/blog/` 的图片**必须压缩到 ≤ 1MB**，使用 `compress-image` skill 或 `scripts/compress-image.ps1`
- 数组按发布时间**从新到旧**排列，新文章插在最前

## 第二步：创建 Astro 页面

需要创建 **两个** 文件：

### 2a. 主页面（双语内容）

文件路径：`src/pages/blog/{slug}.astro`

这是包含中英文双语内容的完整页面，通过 `locale` prop 切换语言。

### 2b. 中文路由包装页

文件路径：`src/pages/zh-cn/blog/{slug}.astro`

这是一个 **3 行的薄包装**，让 `/zh-cn/blog/{slug}/` URL 可以正确渲染中文内容：

```astro
---
import Article from '../../blog/{slug}.astro';
---
<Article locale="zh-cn" />
```

**不要跳过这一步**。没有这个文件，中文博客页面将无法打开。

### 页面结构（主页面）

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogAdjacentNavigation from '../../components/BlogAdjacentNavigation.astro';
import { blogArticles, formatBlogDate } from '../../blog/articles';
import { catalog } from '../../data/catalog';
import { imageUrl, sourceImageUrl, type Chroma } from '../../domain/chroma';
import { localizedPath, resolveLocale, type Locale } from '../../i18n/config';
import { SITE } from '../../seo/site';

interface Props { locale?: Locale }
const locale = Astro.props.locale ?? resolveLocale(Astro.currentLocale);
const isZh = locale === 'zh-cn';
const article = blogArticles.find((entry) => entry.slug === 'YOUR_SLUG');
if (!article) throw new Error('Article metadata is missing');
const title = `${isZh ? article.titleZh : article.titleEn} | ${SITE.name}`;
const description = isZh ? article.summaryZh : article.summaryEn;
const canonical = new URL(localizedPath(locale, article.href), SITE.origin).toString();
const homeUrl = new URL(localizedPath(locale, '/'), SITE.origin).toString();
const blogUrl = new URL(localizedPath(locale, '/blog/'), SITE.origin).toString();

// 如需展示特定臻彩，通过 instanceId 从 catalog 查找
// const showcase: Chroma[] = [
//   catalog.find((c) => c.instanceId === 'uuid-here'),
// ].filter((c): c is Chroma => c != null);

const jsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: isZh ? article.titleZh : article.titleEn,
    description, image: `${SITE.origin}${article.coverUrl}`,
    datePublished: article.publishedAt, dateModified: article.publishedAt,
    mainEntityOfPage: canonical,
    inLanguage: isZh ? 'zh-CN' : 'en',
    articleSection: isZh ? '英雄联盟指南' : 'League of Legends Guides',
    author: { '@type': 'Organization', name: SITE.name, url: homeUrl },
    publisher: { '@type': 'Organization', name: SITE.name, url: homeUrl },
  },
  {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: isZh ? '博客' : 'Blog', item: blogUrl },
      { '@type': 'ListItem', position: 3, name: isZh ? article.titleZh : article.titleEn, item: canonical },
    ],
  },
];
---
<BaseLayout {title} {description} {canonical} image={article.coverUrl} ogType="article" publishedTime={article.publishedAt} modifiedTime={article.publishedAt} {jsonLd} {locale}>
  <nav class="blog-breadcrumbs" aria-label={isZh ? '面包屑' : 'Breadcrumb'}>
    <a href={localizedPath(locale, '/')}>{isZh ? '首页' : 'Home'}</a>
    <span>/</span>
    <a href={localizedPath(locale, '/blog/')}>{isZh ? '博客' : 'Blog'}</a>
    <span>/</span>
    <span aria-current="page">{isZh ? '分类标签' : 'Category'}</span>
  </nav>

  {!isZh && <article class="blog-article">
    <header class="article-header">
      <p class="kicker">ENGLISH KICKER LABEL</p>
      <h1>{article.titleEn}</h1>
      <p class="article-deck">English deck summarizing the article in 1-2 sentences.</p>
      <p class="article-meta">
        <time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'en')}</time>
        <span>·</span>
        <span>{article.readingMinutes} min read</span>
      </p>
    </header>

    <section>
      <h2>Section Title</h2>
      <p>Paragraph content...</p>
    </section>

    <section class="faq">
      <h2>FAQ</h2>
      <details>
        <summary>Question?</summary>
        <p>Answer.</p>
      </details>
    </section>
  </article>}

  {isZh && <article class="blog-article">
    <header class="article-header">
      <p class="kicker">中文标签</p>
      <h1>{article.titleZh}</h1>
      <p class="article-deck">中文导语，1-2 句话概括文章核心内容。</p>
      <p class="article-meta">
        <time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'zh')}</time>
        <span>·</span>
        <span>阅读约 {article.readingMinutes} 分钟</span>
      </p>
    </header>

    <section>
      <h2>章节标题</h2>
      <p>段落内容……</p>
    </section>

    <section class="faq">
      <h2>常见问题解答</h2>
      <details>
        <summary>问题？</summary>
        <p>答案。</p>
      </details>
    </section>
  </article>}

  <BlogAdjacentNavigation currentSlug={article.slug} {locale} />

  <style>
    /* 复制现有博客页面的完整 CSS，确保样式一致 */
  </style>
</BaseLayout>
```

### 双语内容规则

- **英文和中文是完全独立的两个 `<article>` 块**，不是逐句翻译
- 英文块在 `{!isZh && ...}` 中，中文块在 `{isZh && ...}` 中
- 英文内容面向国际玩家，语气直接、信息密集
- 中文内容面向国服玩家，可用口语化表达，避免翻译腔
- 图片 `alt` 属性：英文用 `data-alt-en`，中文用 `data-alt-zh`

### 写作规范（中英文通用）

**英文去 AI 味**：
- 禁用词：`delve`, `explore`, `comprehensive`, `meticulous`, `meticulously`, `it's worth noting`, `important to note`, `seamless`, `seamlessly`, `robust`, `leverage`, `utilize`, `cutting-edge`, `game-changer`, `unlock`, `empower`, `elevate`, `enhance`, `streamline`, `revolutionize`
- 避免过度完整的三段式（intro → body → conclusion）
- 避免每段开头用 `Furthermore`、`Moreover`、`Additionally`、`In conclusion`
- 避免空洞修饰：`very`, `really`, `extremely`, `incredibly`（换成具体数据或直接删掉）
- 语气直接，像跟朋友聊游戏，不像写论文

**中文去 AI 味**：
- 禁用词：`此外`、`至关重要`、`深入探讨`、`值得一提的是`、`不可否认`、`综上所述`、`一言以蔽之`
- 避免机械排比和过度完整的三段式结构
- 可用"看看"、"相当于"、"说白了"等口语化表达
- 游戏术语使用国服官方译名

### 写作质量（参考 Sentry 博客规范）

**开头 2-3 句必须做一件事**：直接点明问题或给出结论。不用背景铺垫、不用历史回顾、不用噱头。

- 好："卡莎目前有 8 款臻彩，横跨 5 个皮肤系列，是所有英雄中最多的。"
- 坏："在《英雄联盟》丰富的皮肤生态中，臻彩作为一种珍稀的收藏内容，一直以来都备受玩家关注……"

**围绕读者的问题组织内容**，不是围绕自己的叙事：
1. 这东西是什么？（1-2 段）
2. 具体怎么运作/怎么获取？（主体部分，给具体数据）
3. 有什么值得注意的？（这是好文章和伟大文章的分水岭）
4. 下一步怎么做？（给具体行动建议）

**小标题必须传递信息**：
- 弱：`背景`、`获取方式`、`总结`
- 强：`三种召唤活动对比`、`神话精粹兑换的性价比`、`为什么卡莎排第一`

**段落在转折处断开**。当一句出现"但"、"不过"、"然而"时，另起一段。不要把转折埋在长段落中间。

**数字胜过形容词**：
- 坏："臻彩非常稀有"
- 好："全目录 300+ 款炫彩中，只有 47 款是臻彩，占比不到 16%"

**AI 写作的典型模式要警惕**：
- **短句堆砌制造节奏感**：坏："没有原画。没有配色。什么都没有。" → 好："这款皮肤目前没有任何臻彩原画。"
- **标语式金句**：坏："看不到的原画，不值得收藏。" → 好："没有原画的臻彩在藏馆里只显示配色，收藏感弱很多。"
- **三段式揭秘**：坏："不是配色问题。不是模型问题。是原画缺失。" → 好："问题不在配色或模型，而是缺少独立原画。"
- **假亲切**：代码/图片后面写"就这么简单！" → 直接解释内容或继续下一段
- **排比式广告腔**：坏："配色告诉你风格，原画告诉你故事。" → 好："配色只是风格上的变化，但原画让每款臻彩有了自己的故事。"
- **只有开头结尾有个性**：开头讲个故事，中间 80% 变成百科，结尾又突然热情 → 个人语气应该贯穿全文

**结尾要有用**：给一个有用的下一步（链向相关文章、给行动建议），不用"我们迫不及待地想让你看到……"这种空话，也不用复述刚说过的内容。

**"你会分享这篇吗？"测试**：发布前问自己——一个玩家会不会把这篇发到群里？如果不会，要么深度不够，要么没有原创数据，要么它只适合放在更新日志里。

值得分享的文章至少包含以下之一：
- 用数据支撑的独到分析
- 其他地方找不到的整理/对比
- 诚实的局限性说明（"目前只覆盖了部分英雄"）
- 真正帮读者省时间的指南

### 内容组件

**图片展示**：
```astro
<figure>
  <img src="/img/blog/image.jpg" 
       data-fallback="/placeholder.svg" 
       data-placeholder="/placeholder.svg" 
       data-alt-en="English alt" 
       data-alt-zh="中文替代文字" 
       alt="Fallback alt" 
       width="1920" height="1080" 
       loading="lazy" decoding="async" />
  <figcaption>Caption text</figcaption>
</figure>
```

**臻彩原画展示**（需从 catalog 查找）：
```astro
<div class="showcase">
  {showcase.map((chroma) => (
    <figure>
      <a class="chroma-art-link" 
         href={localizedPath(locale, `/chromas/${chroma.slug}/`)}
         aria-label={`View ${chroma.nameEn} details`}>
        <img src={imageUrl(chroma.images.large)} 
             data-fallback={sourceImageUrl('large', chroma.instanceId)} 
             data-placeholder="/placeholder.svg" 
             alt={`${chroma.nameEn} prestige chroma splash art`} 
             width="1920" height="1080" 
             loading="lazy" decoding="async" />
      </a>
      <figcaption>{chroma.nameEn}</figcaption>
    </figure>
  ))}
</div>
```

**官方来源链接**：
```astro
<aside class="official-sources" aria-label="Official sources">
  <strong>Official sources</strong>
  <ul>
    <li><a class="official-source-link" href="https://..." target="_blank" rel="noreferrer">Link text</a></li>
  </ul>
</aside>
```

**FAQ 折叠**：
```astro
<section class="faq">
  <h2>FAQ</h2>
  <details>
    <summary>Question?</summary>
    <p>Answer.</p>
  </details>
</section>
```

### CSS 样式

**必须**从现有博客页面复制完整的 `<style>` 块，包括：
- 面包屑、文章容器、标题、段落、图片、FAQ 等所有样式
- 响应式断点 `@media(max-width:767px)` 
- `.chroma-art-link`、`.official-sources` 等组件样式
- 不要修改或简化，保持完全一致

## 内链策略

每篇新文章必须融入站内内链网络。孤立页面（零入链）对 SEO 和用户导航都有害。

### 内链原则

1. **每篇新文章至少 2 条出站博客内链**（链向其他博客文章）
2. **每篇新文章争取被至少 2 篇已有文章链入**（需回改已有文章）
3. 锚文字使用描述性关键词，不用"点击这里"、"了解更多"
4. 中英文各自独立添加内链，锚文字用各自语言
5. 博客间内链使用 `localizedPath(locale, '/blog/slug/')` 确保多语言正确

### 内链层级

```
首页
├── /blog/what-is-league-of-legends/     ← 入门（最底层）
│   └── 链向 → what-are-chroma-skins
├── /blog/what-are-chroma-skins/         ← 基础概念
│   └── 链向 → what-are-prestige-chromas
├── /blog/what-are-prestige-chromas/     ← 核心枢纽（最多入链）
│   └── 链向 → kaisa, champion-most, patch-26-15, champions-without
├── /blog/kaisa-prestige-chroma/         ← 英雄专题
│   └── 链向 → what-are-prestige-chromas, champion-most, patch-26-15
├── /blog/champion-most-prestige-chromas/ ← 数据分析
│   └── 链向 → what-are-prestige-chromas, kaisa, champions-without, patch-26-15
├── /blog/champions-without-prestige-chroma/ ← 追踪器
│   └── 链向 → what-are-prestige-chromas, what-are-chroma-skins, champion-most
└── /blog/patch-26-15-prestige-chromas/  ← 版本更新
    └── 链向 → what-are-prestige-chromas, what-are-chroma-skins, champion-most, kaisa
```

### 新文章内链检查

新增文章时：

1. **正文中**自然插入链向相关博客的链接（至少 2 条）
2. **FAQ 中**用"详见我们的 XXX 介绍"链向基础文章
3. **回改已有文章**：找到内容相关的已有文章，在合适位置添加链向新文章的链接
4. 更新 `references/internal-links.md` 中的内链地图

详细内链地图见 `references/internal-links.md`。

## 第三步：更新测试

### 1. `src/blog/articles.test.ts`

更新文章总数断言：
```ts
expect(blogArticles).toHaveLength(NEW_COUNT);
```

### 2. `scripts/blog-feature.test.ts`

新增页面结构测试：
```ts
test('new article page has expected structure', async () => {
  const html = await readBuildOutput('/blog/your-slug/index.html');
  expect(html).toContain('English title or key content');
  expect(html).toContain('中文标题或关键内容');
});
```

### 3. `scripts/site-build.test.ts`

新增构建产物路由测试：
```ts
test('new article route exists in build output', () => {
  assertRouteExists('/blog/your-slug/index.html');
});
```

## 第四步：验证

运行以下命令确保所有变更正确：

```bash
# 1. 类型检查
pnpm typecheck

# 2. 运行所有测试
pnpm test

# 3. 构建验证
pnpm release:build

# 4. 数据校验（如涉及 catalog 数据）
pnpm data:validate
```

## 常见问题

**Q: 封面图用什么？**
A: 本地图片放 `public/img/blog/`，命名 `kebab-case-cover.jpg/png`。也可用 `https://img.chromaart.lol/...` 外部地址。

**Q: 需要同时更新中英文吗？**
A: 是的。每篇文章必须有完整的中英文内容，不是机器翻译，而是针对各自受众独立撰写。

**Q: 文章内容可以引用外部来源吗？**
A: 可以，但必须用 `<aside class="official-sources">` 标注来源链接。

**Q: 阅读时间怎么算？**
A: 英文约 200-250 词/分钟，中文约 300-400 字/分钟。取整数。

## 参考文件

- 完整页面模板：`references/page-template.md`
- 交付检查清单：`references/checklist.md`
- 内链地图：`references/internal-links.md`
- 现有博客示例：`src/pages/blog/what-are-prestige-chromas.astro`
