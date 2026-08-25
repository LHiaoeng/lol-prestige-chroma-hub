# 01：收敛图鉴索引与广告范围

> 本地实施草稿：权威 Issue 与状态以 GitHub Issues 为准，详见 `docs/agents/issue-tracker.md`。

**What to build:** 保留图鉴首页和博客广告，将详情页稳定为无广告参考资料，减少低价值页面进入搜索索引，并消除空白成功页面。

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] 所有中英双语图鉴详情页输出 `noindex`，且不再出现在 sitemap。
- [x] 图鉴首页展示广告，图鉴详情页不展示广告。
- [x] 除图鉴首页外，广告出现在博客列表页和全部博客文章；其他资料页不展示广告。
- [x] 空白但返回 200 的路由已删除，或改为提供有效内容与正确状态。
- [x] 中英文、移动端、无障碍和 SEO 表现保持可用。
