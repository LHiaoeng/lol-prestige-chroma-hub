# 博客文章交付检查清单

## 元数据与路由

- [ ] `src/blog/articles.ts` 在头部新增条目，slug 全小写连字符，href 为 `/blog/{slug}/`
- [ ] 中英文标题、摘要、封面 alt、阅读时长和 `adEligible` 已填写；`publishedAt` 为 `YYYY-MM-DD`
- [ ] `category` 按文章类型填写；标题、正文和来源明确对应游戏，跨游戏内容分别核对
- [ ] `src/pages/blog/{slug}.astro` 与 `src/pages/zh-cn/blog/{slug}.astro` 均已创建
- [ ] 中文页只有 Article 导入和 `<Article locale="zh-cn" />`
- [ ] 新文章在博客列表中的发布时间排序正确

## 页面与 SEO

- [ ] 英文和中文均为独立完整内容，包含标题、导语和正文
- [ ] 页面查找正确 article，设置 `title`、`description`、`canonical`、面包屑和 `BlogAdjacentNavigation`
- [ ] BaseLayout props 已传 `image`、`ogType="article"`、`publishedTime`、`modifiedTime`、`jsonLd`，自动获得 canonical、hreflang(en/zh-CN/x-default)、Open Graph、article:published/modified_time、Twitter summary_large_image
- [ ] JSON-LD 至少包含 `BlogPosting` 与 `BreadcrumbList`；`datePublished`、`dateModified` 与页面内容一致
- [ ] 如有 FAQ，同一份本地化 `faqEntries` 驱动正文 `<details>` 和 `FAQPage`；无 FAQ 时不输出对应结构化数据
- [ ] 可选追加 `ItemList`（臻彩奖励列表）、`HowTo`、`WebPage` 等业务结构化数据
- [ ] 首图 eager，其余图片 lazy；图片有 `alt`、`data-alt-en`、`data-alt-zh`、`data-fallback`、`data-placeholder`、宽高
- [ ] 外部链接使用 `target="_blank" rel="noreferrer"`

## 臻彩展示组件（仅含目录臻彩卡片时）

- [ ] 目录卡片网格使用 `BlogChromaGrid` + `BlogPrestigeChromaCard`，没有手写重复卡片 HTML
- [ ] 活动专属名称/碎片数通过 `labelEn` 与 `labelZh` 传入，而不是在卡片中复制图片、颜色圆点或链接代码
- [ ] 目录不存在的奖励没有详情链接，并同时提供双语标签，由共享组件渲染占位卡
- [ ] 页面没有 `.chroma-grid`、`.chroma-card-*` 的重复 CSS；网格由组件统一处理 `padding: 0` 和移动端列数
- [ ] `references/chroma-grid.md` 中的接口说明仍与组件实现一致

## 内容与领域

- [ ] 已读取 `GLOSSARY.md`，使用领域主称呼并排除相关 `_Avoid_` 表述
- [ ] 官网新闻/活动只写公告确认的事实；概率、结束时间、可用性等不确定信息已明确标注并链接官方页
- [ ] 常青指南才登记 `src/blog/evergreen-guides.ts`；新闻/活动文章不强行加入维护数据
- [ ] 常青指南渲染 `ArticleMaintenance`，双语可见作者、来源、最后核验日期、纠错入口和两条相关指南
- [ ] 正文、FAQ 和旧文回链仅在直接相关时添加；非臻彩主题未套用臻彩内链

## 测试与验证

- [ ] `src/blog/articles.test.ts` 的数量/顺序断言已更新（如受影响）
- [ ] `scripts/blog-feature.test.ts` 覆盖页面结构、共享臻彩组件和官方来源（如适用）
- [ ] `scripts/site-build.test.ts` 覆盖新英文/中文路由；使用共享臻彩网格时检查 padding 回归
- [ ] 按改动运行相关测试，例如 `pnpm test src/blog/articles.test.ts scripts/blog-feature.test.ts`，并验证受影响的静态路由
- [ ] `pnpm release:build`（发布前，包含全量测试、类型检查、数据校验、构建和产物审计）
- [ ] `pnpm data:validate`（修改 catalog 数据时）
- [ ] `git diff --check`
- [ ] 修改技能后，使用系统 `skill-creator` 的 `quick_validate.py` 校验 `.agents/skills/blog-article`
