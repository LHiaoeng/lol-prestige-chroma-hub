# 博客文章交付检查清单

## 元数据与路由

- [ ] `src/blog/articles.ts` 在头部新增条目，slug 全小写连字符，href 为 `/blog/{slug}/`
- [ ] 中英文标题、摘要、封面 alt、阅读时长已填写；`publishedAt` 为完整 ISO 时间
- [ ] `src/pages/blog/{slug}.astro` 与 `src/pages/zh-cn/blog/{slug}.astro` 均已创建
- [ ] 中文页只有 Article 导入和 `<Article locale="zh-cn" />`
- [ ] 文章元数据按发布时间从新到旧排列

## 页面与 SEO

- [ ] 英文和中文均为独立完整内容，包含标题、导语、正文、至少一个 FAQ 和相关内链
- [ ] 页面查找正确 article，设置 `title`、`description`、`canonical`、面包屑和 `BlogAdjacentNavigation`
- [ ] BaseLayout props 已传 `image`、`ogType="article"`、`publishedTime`、`modifiedTime`、`jsonLd`，自动获得 canonical、hreflang(en/zh-CN/x-default)、Open Graph、article:published/modified_time、Twitter summary_large_image
- [ ] JSON-LD 至少包含 `BlogPosting` 与 `BreadcrumbList`；`datePublished`、`dateModified` 与页面内容一致
- [ ] JSON-LD 含 `FAQPage`（只要页面有 FAQ 段落就必须带，Google 搜索问答卡富媒体必需）；FAQ 使用 `faqEntries` 双语数组统一驱动正文 `<details>` 和 JSON-LD，不手写两套
- [ ] 可选追加 `ItemList`（臻彩奖励列表）、`HowTo`、`WebPage` 等业务结构化数据
- [ ] 首图 eager，其余图片 lazy；图片有 `alt`、`data-alt-en`、`data-alt-zh`、`data-fallback`、`data-placeholder`、宽高
- [ ] 外部链接使用 `target="_blank" rel="noreferrer"`

## 臻彩展示组件

- [ ] 目录卡片网格使用 `BlogChromaGrid` + `BlogChromaCard`，没有手写重复卡片 HTML
- [ ] 活动专属名称/碎片数通过 `labelEn` 与 `labelZh` 传入，而不是在卡片中复制图片、颜色圆点或链接代码
- [ ] 目录不存在的奖励没有详情链接，并同时提供双语标签，由共享组件渲染占位卡
- [ ] 页面没有 `.chroma-grid`、`.chroma-card-*` 的重复 CSS；网格由组件统一处理 `padding: 0` 和移动端列数
- [ ] `references/chroma-grid.md` 中的接口说明仍与组件实现一致

## 内容与领域

- [ ] 已读取 `CONTEXT.md`，使用领域主称呼并排除相关 `_Avoid_` 表述
- [ ] 官网新闻/活动只写公告确认的事实；概率、结束时间、可用性等不确定信息已明确标注并链接官方页
- [ ] 常青指南才登记 `src/blog/evergreen-guides.ts`；新闻/活动文章不强行加入维护数据
- [ ] 常青指南渲染 `ArticleMaintenance`，双语可见作者、来源、最后核验日期、纠错入口和两条相关指南
- [ ] 至少两条文章内链、一条 FAQ 基础文章内链；至少两篇旧文已回链新文；内链矩阵已更新

## 测试与验证

- [ ] `src/blog/articles.test.ts` 的数量/顺序断言已更新（如受影响）
- [ ] `scripts/blog-feature.test.ts` 覆盖页面结构、共享臻彩组件和官方来源（如适用）
- [ ] `scripts/site-build.test.ts` 覆盖新英文/中文路由和共享网格 padding 回归
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm release:build`
- [ ] `pnpm data:validate`（修改 catalog 数据时）
- [ ] `git diff --check`
- [ ] 修改技能后，使用系统 `skill-creator` 的 `quick_validate.py` 校验 `.agents/skills/blog-article`
