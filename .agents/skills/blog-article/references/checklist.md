# 博客文章交付检查清单

新增博客文章时，按此清单逐项确认。

## 元数据层

- [ ] `src/blog/articles.ts` 中 `blogArticles` 数组**头部**插入新条目
- [ ] `slug` 全小写、连字符分隔
- [ ] `href` 格式为 `/blog/{slug}/`
- [ ] `titleEn` 和 `titleZh` 均已填写
- [ ] `summaryEn` 和 `summaryZh` 均已填写，1-2 句话
- [ ] `publishedAt` 使用 `YYYY-MM-DD` 格式
- [ ] `readingMinutes` 为正整数
- [ ] `coverUrl` 指向有效图片（本地 `/img/blog/...` 或外部 `https://img.chromaart.lol/...`）
- [ ] 保存到 `public/img/blog/` 的图片已压缩到 ≤ 1MB（使用 `compress-image` skill）
- [ ] `coverAltEn` 和 `coverAltZh` 均已填写
- [ ] 数组顺序按发布时间从新到旧

## 页面层

- [ ] 文件路径 `src/pages/blog/{slug}.astro` 已创建
- [ ] 文件路径 `src/pages/zh-cn/blog/{slug}.astro` 已创建（中文路由包装页）
- [ ] 中文路由包装页内容为 `import Article` + `<Article locale="zh-cn" />`
- [ ] Frontmatter 导入完整（BaseLayout、BlogAdjacentNavigation、blogArticles、formatBlogDate、localizedPath、resolveLocale、SITE）
- [ ] `article` 查找使用正确的 slug
- [ ] `title`、`description`、`canonical` 正确拼接
- [ ] JSON-LD 包含 `BlogPosting` 和 `BreadcrumbList` 两个结构
- [ ] 面包屑导航已添加，层级正确
- [ ] 英文 `{!isZh && ...}` 块内容完整
- [ ] 中文 `{isZh && ...}` 块内容完整
- [ ] 英文和中文是独立撰写，不是逐句翻译
- [ ] 英文 kicker 使用大写英文
- [ ] 中文 kicker 使用中文
- [ ] 所有图片包含 `data-alt-en` 和 `data-alt-zh`
- [ ] 所有图片包含 `data-fallback` 和 `data-placeholder`
- [ ] 所有图片标注 `width` 和 `height`
- [ ] 首图 `loading="eager"`，其余 `loading="lazy"`
- [ ] FAQ 使用 `<details>/<summary>` 结构
- [ ] 外部链接使用 `target="_blank" rel="noreferrer"`
- [ ] `<BlogAdjacentNavigation>` 已添加
- [ ] `<style>` 块完整复制，未做修改
- [ ] 响应式样式 `@media(max-width:767px)` 包含在内

## 内容质量（中英文各自检查）

- [ ] 英文无 AI 禁用词（delve, explore, comprehensive, seamless, robust, leverage, unlock, empower 等）
- [ ] 英文无空洞修饰（very, really, extremely, incredibly）
- [ ] 英文无机械过渡词（Furthermore, Moreover, Additionally, In conclusion）
- [ ] 中文无 AI 禁用词（此外、至关重要、深入探讨、值得一提的是、不可否认等）
- [ ] 中英文均无机械排比和过度完整的三段式
- [ ] 中文语气自然，可用口语化表达
- [ ] 已完整读取 `CONTEXT.md`，领域术语使用其中定义的中英文主称呼
- [ ] 已检查并排除 `CONTEXT.md` 中相关术语的全部 `_Avoid_` 表述

## 写作质量

- [ ] 开头 2-3 句直接点明问题或给出结论，无背景铺垫
- [ ] 内容围绕读者问题组织，不是围绕自己的叙事
- [ ] 小标题传递具体信息，不是泛泛的"背景"、"总结"
- [ ] 转折处另起段落，不埋在长段落中间
- [ ] 用具体数据代替形容词（数字胜过修饰）
- [ ] 无 AI 写作典型模式（短句堆砌、标语金句、三段式揭秘、假亲切、排比广告腔）
- [ ] 结尾给出有用的下一步，无空话、不复述
- [ ] 通过"你会分享这篇吗？"测试

## 常青指南附加项

- [ ] 文章解决一个长期稳定的玩家问题，并提供可核验的原创分析、整理、比较、方法或实用指南
- [ ] 正文不是现有页面的翻译、图鉴字段改写或模板段落复用
- [ ] 中英文均为面向各自读者的完整文章，不是逐句翻译或摘要版
- [ ] 常青指南维护数据已登记最后核验日期、能支撑关键事实的来源和两条相关指南
- [ ] 中英文文章均渲染 `ArticleMaintenance`
- [ ] 作者、来源、最后核验日期、纠错入口和两条相关指南在两种语言中均可见
- [ ] 由本站图鉴计算的数据注明图鉴快照、统计口径和必要的局限
- [ ] 页面 `modifiedTime`、`BlogPosting.dateModified` 与可见的最后核验日期一致

## 内链层

- [ ] 新文章正文包含至少 2 条链向其他博客的内链
- [ ] 新文章 FAQ 中包含至少 1 条链向基础文章的内链
- [ ] 中英文各自独立添加了内链（不是只加了一种语言）
- [ ] 锚文字使用描述性关键词，非"点击这里"、"了解更多"
- [ ] 博客间内链使用 `localizedPath(locale, '/blog/slug/')` 格式
- [ ] 已回改至少 2 篇已有文章，添加链向新文章的内链
- [ ] `references/internal-links.md` 内链矩阵已更新

## 测试层

- [ ] `src/blog/articles.test.ts`：文章总数断言已更新
- [ ] `scripts/blog-feature.test.ts`：新增页面结构测试
- [ ] `scripts/site-build.test.ts`：新增构建产物路由测试
- [ ] 常青指南的中英文构建产物包含作者、来源、最后核验日期、纠错入口和两条相关指南
- [ ] 常青指南的 `article:modified_time` 与可见的最后核验日期一致

## 验证层

- [ ] `pnpm typecheck` 通过，0 错误
- [ ] `pnpm test` 全部通过
- [ ] `pnpm release:build` 构建成功
- [ ] `pnpm data:validate` 通过（如涉及 catalog 数据）

## SEO 检查

- [ ] `canonical` URL 正确
- [ ] `og:type` 为 `article`
- [ ] `article:published_time` 和 `article:modified_time` 已设置
- [ ] JSON-LD `BlogPosting` 包含 headline、description、image、datePublished
- [ ] JSON-LD `BreadcrumbList` 层级正确（首页 > 博客 > 文章）
- [ ] 图片 `alt` 文字描述性强，包含关键信息
