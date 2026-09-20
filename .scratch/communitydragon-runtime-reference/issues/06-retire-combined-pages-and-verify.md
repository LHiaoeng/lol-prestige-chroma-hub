# 06: 移除旧双模式页面并完成验收

**What to build:** 收缩旧的列表/详情共用页面模式，确保全部 CommunityDragon 运行时入口使用职责单一的独立页面，并以真实浏览器、离线构建、SEO 和公开产物审计证明整体可用。

**Blocked by:** 01/修复英雄列表与运行时页面基础；02/建立独立英雄详情页；03/拆分皮肤系列列表与详情页；04/拆分宇宙列表与详情页；05/建立独立皮肤详情页。

**Status:** complete

- [x] 移除英雄、系列、宇宙列表页通过 `id` 切换详情的旧控制器分支，以及普通皮肤旧入口壳；不存在仍生成旧详情链接的消费者。
- [x] 旧的列表页 `?id=` 形式不提供详情、重定向或兼容渲染，旧逐实体静态 URL 继续永久返回 404。
- [x] 英雄、系列、宇宙列表保留目录 canonical；英雄、皮肤、系列、宇宙详情壳均在初始 HTML 中带 `noindex`，且不进入 sitemap。
- [x] CommunityDragon 通道相关 UI、无障碍文案、测试、领域词汇、资源指南、ADR、规格、任务和最终 HTML 只使用小写 `pbe` / `latest`。
- [x] 完整 CommunityDragon 目录 JSON 和仓库私有目录数据不会进入公开产物，CommunityDragon 不可访问时静态构建仍成功。
- [x] 对全部中英文运行时入口执行真实浏览器验收，覆盖列表、详情、普通跨页面导航、刷新、返回、语言切换、通道切换和失败重试；未观察到阻断性页面异常。
- [x] 首页、臻彩详情、博客、覆盖率文章及其他原有静态页面的内容、数据链路、交互、SEO 和测试保持现状，本任务不修改这些页面。
- [x] CommunityDragon 资源指南、ADR 和维护文档与最终独立页面架构一致，不保留旧双模式说明。

**Verification:** `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm audit:build`, `git diff --check`, plus manual browser acceptance against the local static preview for bilingual lists/details, independent navigation, `pbe`/`latest`, history, invalid links, the retired `/skins/` route, and retry UI.
