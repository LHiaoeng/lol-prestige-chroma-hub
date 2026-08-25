# 博客臻彩卡片网格

文章需要展示目录臻彩卡片时，使用 `src/components/BlogChromaGrid.astro` 包裹 `src/components/BlogChromaCard.astro`。页面只提供数据和文章专属标签，不维护卡片 HTML 或 CSS。

## 标准目录卡片

```astro
---
import BlogChromaCard from '../../components/BlogChromaCard.astro';
import BlogChromaGrid from '../../components/BlogChromaGrid.astro';
---

<BlogChromaGrid>
  {chromas.map((chroma) => <BlogChromaCard chroma={chroma} {locale} />)}
</BlogChromaGrid>
```

`BlogChromaGrid` 的 `columns` 只能是 `3` 或 `6`，默认 `6`；移动端统一为两列。三款同主题、需要更宽展示时使用 `columns={3}`。

## 活动专属标签与占位卡

卡片名称来自目录时无需额外标签。活动公告需要显示碎片数量、奖池层级等文章专属信息时，同时传入双语标签：

```astro
<BlogChromaCard
  chroma={findChroma(item.heroId, item.skinNameEn)}
  labelEn={`${item.nameEn} — ${item.fragments} fragments`}
  labelZh={`${item.nameZh} — ${item.fragments} 碎片`}
  {locale}
/>
```

若 `chroma` 不存在，必须仍提供 `labelEn` 和 `labelZh`。组件会显示无链接的 `/placeholder.svg` 占位卡，避免把未收录奖励伪装成目录详情页。

组件统一负责：

- `images.medium` 与 `sourceImageUrl('medium', instanceId)` 图片回退；
- 中英文 alt 文本、颜色圆点和 catalog 详情链接；
- 网格的 `list-style`、`padding: 0`、列数、间距和移动端布局；
- 卡片 hover/focus 样式与长名称换行。

不要在文章页面再次写 `.chroma-grid`、`.chroma-card-*`，也不要给共享网格套用通用 `.blog-article ul` 的左内边距。文章自己的文字列表可以继续使用普通 `<ul>`。
