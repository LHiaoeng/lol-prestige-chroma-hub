# 博客页面完整模板参考

本文件提供博客 Astro 页面的完整结构参考，包括 CSS 样式块。新建文章时从此复制。

## Frontmatter 导入清单

```ts
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogAdjacentNavigation from '../../components/BlogAdjacentNavigation.astro';
import { blogArticles, formatBlogDate } from '../../blog/articles';
import { catalog } from '../../data/catalog';
import { imageUrl, sourceImageUrl, type Chroma } from '../../domain/chroma';
import { localizedPath, resolveLocale, type Locale } from '../../i18n/config';
import { SITE } from '../../seo/site';
// 如需颜色圆点组件：
// import ChromaColorCircle from '../../components/ChromaColorCircle.astro';
// 如需中国服专属定义：
// import { CHINA_EXCLUSIVE_DEFINITION } from '../../seo/site';
```

## JSON-LD 模板

```ts
const jsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: isZh ? article.titleZh : article.titleEn,
    description,
    image: `${SITE.origin}${article.coverUrl}`,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
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
```

## BaseLayout 调用

```astro
<BaseLayout
  {title}
  {description}
  {canonical}
  image={article.coverUrl}
  ogType="article"
  publishedTime={article.publishedAt}
  modifiedTime={article.publishedAt}
  {jsonLd}
  {locale}
>
```

## 面包屑导航

```astro
<nav class="blog-breadcrumbs" aria-label={isZh ? '面包屑' : 'Breadcrumb'}>
  <a href={localizedPath(locale, '/')}>{isZh ? '首页' : 'Home'}</a>
  <span>/</span>
  <a href={localizedPath(locale, '/blog/')}>{isZh ? '博客' : 'Blog'}</a>
  <span>/</span>
  <span aria-current="page">{isZh ? '分类标签' : 'Category Label'}</span>
</nav>
```

## 文章头部

### 英文头部
```astro
<header class="article-header">
  <p class="kicker">UPPERCASE KICKER LABEL</p>
  <h1>{article.titleEn}</h1>
  <p class="article-deck">1-2 sentence deck summarizing the article.</p>
  <p class="article-meta">
    <time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'en')}</time>
    <span>·</span>
    <span>{article.readingMinutes} min read</span>
  </p>
</header>
```

### 中文头部
```astro
<header class="article-header">
  <p class="kicker">中文标签</p>
  <h1>{article.titleZh}</h1>
  <p class="article-deck">中文导语，1-2 句话。</p>
  <p class="article-meta">
    <time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'zh')}</time>
    <span>·</span>
    <span>阅读约 {article.readingMinutes} 分钟</span>
  </p>
</header>
```

## 图片组件

### 普通图片
```astro
<figure>
  <img src="/img/blog/image.jpg"
       data-fallback="/placeholder.svg"
       data-placeholder="/placeholder.svg"
       data-alt-en="English alt text"
       data-alt-zh="中文替代文字"
       alt="Fallback alt text"
       width="1920" height="1080"
       loading="lazy" decoding="async" />
  <figcaption>English caption / 中文说明</figcaption>
</figure>
```

### 英雄图（首图）
```astro
<figure class="article-hero">
  <img src={article.coverUrl}
       alt={article.coverAltEn}
       data-alt-en={article.coverAltEn}
       data-alt-zh={article.coverAltZh}
       data-fallback="/placeholder.svg"
       data-placeholder="/placeholder.svg"
       width="1788" height="880"
       loading="eager" decoding="async" />
  <figcaption>Caption text</figcaption>
</figure>
```

### 臻彩原画展示网格
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

### 臻彩卡片网格（带颜色圆点）
```astro
<ul class="chroma-grid">
  {chromas.map((chroma) => (
    <li>
      <a class="chroma-card-link" href={localizedPath(locale, `/chromas/${chroma.slug}/`)}>
        <div class="chroma-card-img-wrap">
          <img src={imageUrl(chroma.images.medium)}
               data-fallback={sourceImageUrl('medium', chroma.instanceId)}
               data-placeholder="/placeholder.svg"
               alt={chroma.nameEn}
               width="960" height="540"
               loading="lazy" decoding="async" />
          <div class="chroma-card-color">
            <ChromaColorCircle colors={chroma.colors} />
          </div>
        </div>
        <span class="chroma-card-name">{chroma.nameEn}</span>
      </a>
    </li>
  ))}
</ul>
```

## 官方来源链接

```astro
<aside class="official-sources" aria-label="Official sources">
  <strong>Official sources</strong>
  <ul>
    <li><a class="official-source-link" href="https://..." target="_blank" rel="noreferrer">Link text</a></li>
  </ul>
</aside>
```

## 底部导航

```astro
<BlogAdjacentNavigation currentSlug={article.slug} {locale} />
```

## 完整 CSS 样式块

**新建页面时必须完整复制以下样式，不做任何修改：**

```css
.blog-breadcrumbs,.blog-article{width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)));margin-inline:auto}
.blog-breadcrumbs{display:flex;gap:9px;padding:28px 0 0;color:var(--muted);font-size:.84rem;white-space:nowrap;overflow-x:auto}
.blog-article{padding:clamp(52px,8vw,90px) 0 110px}
.article-header,.blog-article>section,.blog-article>figure,.showcase{width:100%;margin-inline:auto}
.article-header{margin-bottom:42px}
.article-header h1{font-family:Georgia,"Noto Serif SC",serif;font-size:clamp(2.7rem,6vw,5rem);line-height:1.05;font-weight:500;margin:.34em 0 .35em;overflow-wrap:anywhere}
.article-deck{color:#c7cad4;font-size:clamp(1.05rem,2vw,1.25rem);line-height:1.7}
.article-meta{display:flex;flex-wrap:wrap;gap:9px;color:var(--muted);font-size:.8rem}
.blog-article section{margin-top:48px}
.blog-article h2{font-family:Georgia,"Noto Serif SC",serif;color:var(--gold);font-size:clamp(1.65rem,3.3vw,2.25rem);line-height:1.2;margin:0 0 18px}
.blog-article h3{color:#e4c880;font-size:1.12rem;margin:30px 0 8px}
.blog-article section p{color:#c7cad4;font-size:1.06rem;line-height:1.9;margin:0 0 1.2em}
.blog-article a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}
.blog-article figure{margin-top:42px}
.blog-article figure img{display:block;width:100%;height:auto;object-fit:cover;border:1px solid var(--line);background:#15182a;box-shadow:0 22px 64px #0007}
.blog-article figcaption{color:var(--muted);font-size:.78rem;line-height:1.6;margin-top:10px;overflow-wrap:anywhere}
.showcase{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:42px}
.showcase-row-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.showcase figure{width:auto;margin:0}
.showcase img{aspect-ratio:1920/1080}
.showcase figcaption{text-align:center}
.faq details{border-top:1px solid var(--line);padding:16px 0}
.faq details:last-child{border-bottom:1px solid var(--line)}
.faq summary{color:#e6e8ee;font-weight:700;line-height:1.5;cursor:pointer}
.faq details p{margin:12px 0 0}
.chroma-art-link{display:block}
.chroma-art-link:focus-visible{outline:2px solid var(--gold);outline-offset:4px}
.official-sources{width:100%;margin:20px auto 0;padding:18px 20px;border-left:2px solid var(--gold);background:color-mix(in srgb,var(--panel) 88%,transparent);color:var(--muted)}
.official-sources strong{display:block;margin-bottom:8px;color:var(--text);font-size:.82rem;letter-spacing:.06em;text-transform:uppercase}
.official-sources ul{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0;padding:0;list-style:none}
.official-sources li{font-size:.88rem;line-height:1.6}
.official-source-link:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@media(max-width:767px){
  .blog-breadcrumbs{padding-top:18px}
  .blog-article{padding:42px 0 76px}
  .article-header{margin-bottom:28px}
  .article-header h1{font-size:clamp(2.35rem,12vw,3.4rem)}
  .blog-article section{margin-top:36px}
  .blog-article section p{font-size:1rem;line-height:1.78}
  .showcase{grid-template-columns:1fr;gap:26px;margin-top:32px}
}
```

### 可选附加样式

数据表格（排行榜类文章）：
```css
.leaderboard-table-wrapper{overflow-x:auto;margin-top:20px}
.leaderboard-table{width:100%;border-collapse:collapse;font-size:.95rem}
.leaderboard-table th{text-align:left;padding:10px 14px;border-bottom:2px solid var(--gold);color:var(--gold);font-weight:700}
.leaderboard-table td{padding:10px 14px;border-bottom:1px solid var(--line)}
.rank-cell{color:var(--muted);font-variant-numeric:tabular-nums}
.count-cell{font-variant-numeric:tabular-nums;font-weight:700}
.leaderboard-highlight td{background:color-mix(in srgb,var(--gold) 8%,transparent)}
```

臻彩卡片网格：
```css
.chroma-grid{display:flex;flex-wrap:wrap;gap:16px;list-style:none;padding:0;margin:0}
.chroma-grid-wide{justify-content:flex-start}
.chroma-card-link{display:block;width:calc(33.333% - 11px);text-decoration:none;color:inherit}
.chroma-card-img-wrap{position:relative;overflow:hidden;border:1px solid var(--line);background:#15182a}
.chroma-card-img-wrap img{display:block;width:100%;height:auto;aspect-ratio:16/9}
.chroma-card-color{position:absolute;bottom:8px;right:8px}
.chroma-card-name{display:block;padding:8px 0;font-size:.88rem;color:#c7cad4}
```
