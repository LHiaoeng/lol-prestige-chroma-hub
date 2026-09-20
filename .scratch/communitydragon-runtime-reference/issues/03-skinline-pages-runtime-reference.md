# 03: 拆分皮肤系列列表与详情页

**What to build:** 让中英文皮肤系列目录和单个系列资料使用两个独立页面，使列表只负责发现系列，详情只负责展示指定系列及其当前可得关联信息。

**Blocked by:** 01/修复英雄列表与运行时页面基础。

**Status:** complete

- [x] 中英文分别生成独立系列列表壳和系列详情壳，不为每个系列生成静态 HTML。
- [x] 系列列表支持名称搜索、稳定排序和分页；系列卡片使用普通链接进入相同语言和数据通道下的系列详情。
- [x] 系列列表永远只解析列表状态，旧的列表页 `?id=` 形式不会在当前页面渲染系列详情。
- [x] 系列详情要求合法数字 ID，展示当前区域视图中的名称、描述和可用媒体；非法或不存在的系列具有明确状态。
- [x] 系列详情初始 HTML 带 `noindex`，并提供返回系列列表的普通链接；数据通道切换失败时保留旧内容与 URL。
- [x] 系列详情为后续宇宙关系保留明确的独立关联区域，但本任务不读取完整皮肤目录或承诺完整皮肤反向集合。
- [x] 在真实浏览器中，中英文系列列表与详情能够加载、导航、刷新、切换 `pbe` / `latest` 和重试失败，无阻断性控制台异常。
- [x] 自动化测试覆盖两个页面模式、列表控件、详情参数、独立路由、区域隔离、初始 `noindex`、错误状态和禁止完整皮肤目录请求。

**Implementation notes:**

- English routes are `/skinlines/` and `/skinlines/detail/?id={skinlineId}`; Simplified Chinese routes add the `/zh-cn/` prefix.
- List cards and universe relations use ordinary detail links and preserve the active `pbe`/`latest` channel, including explicit `channel=pbe`.
- The runtime controller keeps the previous content and committed URL when a channel or history-driven load fails; the detail shell remains `noindex` in initial HTML.

**Verification:** `pnpm test` (36 files, 260 tests), `pnpm typecheck` (0 errors), `git diff --check`, and manual browser checks for bilingual loading/navigation, channel switching, back navigation, invalid-series retry, and console errors.
