# 01：收敛图鉴索引与广告范围

> 本地实施草稿：权威 Issue 与状态以 GitHub Issues 为准，详见 `docs/agents/issue-tracker.md`。

**What to build:** 保留图鉴首页和博客广告，将详情页稳定为无广告参考资料，减少低价值页面进入搜索索引，并消除空白成功页面。

**Blocked by:** None (can start immediately)

**Status:** in-progress

- [x] 所有中英双语图鉴详情页输出 `noindex`，且不再出现在 sitemap。
- [x] 图鉴首页展示广告，图鉴详情页不展示广告。
- [x] 除图鉴首页外，广告出现在博客列表页和全部博客文章；其他资料页不展示广告。
- [ ] 广告位不预留固定高度、边框或额外留白；广告未加载时不产生占位空间。
- [x] 空白但返回 200 的路由已删除，或改为提供有效内容与正确状态。
- [x] 中英文、移动端、无障碍和 SEO 表现保持可用。

## 实施证据

- 索引边界由 `src/pages/chromas/[slug].astro` 统一输出 `noindex, nofollow`；`src/seo/sitemap.ts` 只生成首页、固定资料页和博客文章 URL，不生成图鉴详情页。
- 运行时广告由 `BaseLayout.astro` 根据页面传入的 `adPlacement` 渲染：图鉴首页使用 `catalog-index`，博客列表与 15 篇文章使用 `editorial-article`，详情页和其他资料页不传入广告位；`src/domain/ad-policy.ts` 与 `scripts/audit-build.ts` 负责校验允许范围。
- `src/blog/articles.ts` 中 15 篇博客文章全部标记为 `adEligible: true`，构建审计会遍历最终 HTML，校验广告脚本必须有显式边界，并拒绝详情页广告、错误投放路径和空白 HTML。
- `scripts/site-build.test.ts` 与 `scripts/audit-build.test.ts` 覆盖中英文首页、博客、详情页、sitemap、广告边界和空白产物；`scripts/responsive-layout.test.ts` 覆盖详情页移动端布局、触控目标和可访问标题结构。

## 验证记录

2026-08-25 已通过 `pnpm release:build`（测试、类型检查、数据校验、Astro 构建及发布产物审计）。广告位不预留固定空间属于新增待实现验收项，因此本 Issue 暂保持 `in-progress`。
