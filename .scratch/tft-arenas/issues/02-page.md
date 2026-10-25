# 02: 双语棋盘目录入口与页面壳

**What to build:** 访客能从页头的云顶之弈入口进入英文 Arenas 或中文棋盘目录，并获得符合本站双语 SEO、面包屑与隐私说明的静态页面壳。

**Blocked by:** None (can start immediately).

**Status:** in-progress

- [x] `/tft/arenas/` 与 `/zh-cn/tft/arenas/` 显示各自的标题、领域图标、面包屑和 JavaScript 启用提示。
- [ ] 页头云顶之弈入口提供小小英雄与棋盘两个同级导航链接，键盘和触控均可操作；集成后的真实浏览器验收待完成。
- [x] 页面提供双语 canonical、`hreflang`、CollectionPage 与 BreadcrumbList 结构化数据，并列入 sitemap。
- [x] 中英文隐私说明与 README、CommunityDragon 资源指南描述浏览器直连 `tftmapskins.json` 和媒体。

## 当前结果与验证

已新增双语棋盘静态页面壳、原生页头菜单、SEO、sitemap 条目及隐私和资源说明。SEO 与 sitemap 定向测试通过；`pnpm build` 输出了两个本地化路由，页面包含 canonical、三条 alternate hreflang、结构化数据、标题、目录图标、原生导航菜单和启用脚本提示。

`pnpm typecheck` 仍被现有 `src/client/runtime-reference-detail-renderer.ts` 类型错误阻断；已显示的诊断未指向本票新增页面文件。集成后的真实浏览器键盘与触控验收由主代理完成。
