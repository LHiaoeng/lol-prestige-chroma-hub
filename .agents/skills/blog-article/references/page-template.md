# 博客页面骨架

这是页面结构参考，不是需要逐字复制的完整文件。文章壳层 CSS 由文章页面维护；臻彩卡片网格必须改用 [`chroma-grid.md`](chroma-grid.md) 的共享组件。

## Frontmatter

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogAdjacentNavigation from '../../components/BlogAdjacentNavigation.astro';
import { blogArticles, formatBlogDate } from '../../blog/articles';
import { localizedPath, resolveLocale, type Locale } from '../../i18n/config';
import { SITE } from '../../seo/site';

interface Props { locale?: Locale }
const locale = Astro.props.locale ?? resolveLocale(Astro.currentLocale);
const isZh = locale === 'zh-cn';
const article = blogArticles.find((entry) => entry.slug === 'your-slug');
if (!article) throw new Error('Article metadata is missing');
const title = `${isZh ? article.titleZh : article.titleEn} | ${SITE.name}`;
const description = isZh ? article.summaryZh : article.summaryEn;
const canonical = new URL(localizedPath(locale, article.href), SITE.origin).toString();
const homeUrl = new URL(localizedPath(locale, '/'), SITE.origin).toString();
const blogUrl = new URL(localizedPath(locale, '/blog/'), SITE.origin).toString();

const jsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: isZh ? article.titleZh : article.titleEn,
    description, image: `${SITE.origin}${article.coverUrl}`,
    datePublished: article.publishedAt, dateModified: article.publishedAt,
    mainEntityOfPage: canonical, inLanguage: isZh ? 'zh-CN' : 'en',
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
```

## Layout、导航与内容

```astro
<BaseLayout
  {title} {description} {canonical}
  image={article.coverUrl}
  ogType="article"
  publishedTime={article.publishedAt}
  modifiedTime={article.publishedAt}
  {jsonLd} {locale}
>
  <nav class="blog-breadcrumbs" aria-label={isZh ? '面包屑' : 'Breadcrumb'}>
    <a href={localizedPath(locale, '/')}>{isZh ? '首页' : 'Home'}</a>
    <span>/</span>
    <a href={localizedPath(locale, '/blog/')}>{isZh ? '博客' : 'Blog'}</a>
    <span>/</span>
    <span aria-current="page">{isZh ? '分类标签' : 'Category label'}</span>
  </nav>

  {!isZh && <article class="blog-article">
    <header class="article-header">
      <p class="kicker">UPPERCASE KICKER</p>
      <h1>{article.titleEn}</h1>
      <p class="article-deck">One or two sentences that state the answer or event scope.</p>
      <p class="article-meta"><time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'en')}</time><span>·</span><span>{article.readingMinutes} min read</span></p>
    </header>
    <figure class="article-hero">
      <img src={article.coverUrl} alt={article.coverAltEn} data-alt-en={article.coverAltEn} data-alt-zh={article.coverAltZh} data-fallback="/placeholder.svg" data-placeholder="/placeholder.svg" width="1788" height="880" loading="eager" decoding="async" />
      <figcaption>Caption.</figcaption>
    </figure>
    <!-- Sections, FAQ and official sources. Use localizedPath for internal links. -->
  </article>}

  {isZh && <article class="blog-article">
    <header class="article-header">
      <p class="kicker">中文标签</p>
      <h1>{article.titleZh}</h1>
      <p class="article-deck">中文导语，直接说明文章结论或活动范围。</p>
      <p class="article-meta"><time datetime={article.publishedAt}>{formatBlogDate(article.publishedAt, 'zh')}</time><span>·</span><span>阅读约 {article.readingMinutes} 分钟</span></p>
    </header>
    <!-- The Chinese article is independently written, not a line-by-line translation. -->
  </article>}

  <BlogAdjacentNavigation currentSlug={article.slug} {locale} />
</BaseLayout>
```

## 图片与列表

普通正文图片沿用 `data-alt-en`、`data-alt-zh`、`data-fallback`、`data-placeholder`，并设置实际宽高。目录卡片网格不要手写 `<ul>`；使用共享组件：

```astro
<BlogChromaGrid>
  {chromas.map((chroma) => <BlogChromaCard chroma={chroma} {locale} />)}
</BlogChromaGrid>
```

详情见 [`chroma-grid.md`](chroma-grid.md)。FAQ 使用 `<details><summary>...</summary><p>...</p></details>`；外部来源链接使用 `target="_blank" rel="noreferrer"`。

## 页面级样式边界

页面可以保留文章壳层、封面、`showcase`、表格、FAQ 和官方来源的样式。不要复制完整旧博客 `<style>`，也不要添加 `.chroma-grid`、`.chroma-card-link`、`.chroma-card-img-wrap`、`.chroma-card-color` 或 `.chroma-card-name`；这些样式属于共享组件。

页面确实需要普通文字列表时，避免让 `.blog-article ul` 覆盖共享网格；全局已有 `.blog-article ul.chroma-grid{padding-left:0}` 作为回归保护。
