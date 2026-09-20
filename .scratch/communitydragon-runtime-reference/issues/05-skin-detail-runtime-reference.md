# 05: 建立独立皮肤详情页

**What to build:** 让访客从英雄详情进入独立的中英文皮肤详情页面，在不下载完整皮肤目录的前提下查看皮肤核心资料，并继续导航到英雄、系列和宇宙详情。

**Blocked by:** 02/建立独立英雄详情页；03/拆分皮肤系列列表与详情页；04/拆分宇宙列表与详情页。

**Status:** complete

- [x] 中英文分别生成独立皮肤详情壳，不提供普通皮肤全量列表，也不为每张皮肤生成静态 HTML。
- [x] 详情同时要求正安全整数皮肤 ID 和英雄定位提示；非法或缺失参数在请求前被拒绝。
- [x] 正常路径通过英雄定位提示读取单英雄资源，再按皮肤 ID 查找并复核身份；不得猜测英雄 ID，也不得请求完整 `skins.json`。
- [x] 皮肤核心资料优先显示，系列和宇宙随后独立加载；关联失败不移除核心内容，媒体失败不妨碍文字阅读。
- [x] 页面提供返回英雄详情及前往系列、宇宙详情的普通链接，并在语言和页面导航中保留皮肤 ID、英雄提示与数据通道。
- [x] 详情初始 HTML 带 `noindex`；目标通道没有该皮肤时显示明确不存在状态，不跨通道或跨区域回退。
- [x] 在真实浏览器中，中英文用户能够从英雄进入皮肤、刷新分享、返回英雄、导航关联、切换通道并恢复关联或媒体失败，无阻断性控制台异常。
- [x] 自动化测试覆盖参数校验、英雄定位、皮肤身份复核、定位不一致、目标不存在、渐进关联、并发取消、媒体失败和禁止完整皮肤目录请求。

**Implementation notes:**

- The only skin route is `/skins/detail/?id={skinId}&champion={championId}`; Simplified Chinese routes add the `/zh-cn/` prefix. There is no `/skins/` directory entry.
- Skin detail loads the hinted champion resource, then resolves the requested skin by ID without reading `skins.json`; an old `/skins/?id=...` URL is not a compatibility entry.
- Core skin content renders before skinline and universe relations; failed relations and media do not remove the core text. Links use ordinary cross-page navigation and preserve language, hint, and explicit `pbe`/`latest` channel state.

**Verification:** `pnpm test` (36 files, 264 tests), `pnpm typecheck` (0 errors), `git diff --check`, and manual browser checks for bilingual loading/navigation, legacy list URLs, channel switching, back/forward restoration, invalid parameters, and console errors.
