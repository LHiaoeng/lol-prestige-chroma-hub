# 01: 修复炫彩所属皮肤校验并接通关系导航

**What to build:** 修正臻彩 CommunityDragon 补充数据的三段 ID 关系，按 `heroId → sourceSkinId → skinId` 精确匹配英雄、所属皮肤和嵌套炫彩；同时让臻彩详情页的英雄、所属皮肤、皮肤系列、皮肤宇宙和相关臻彩都跳转到对应的站内页面。

**Blocked by:** None (can start immediately).

**Status:** ready-for-review

- [x] 所属皮肤只按当前英雄皮肤集合中的稳定 ID 与 `sourceSkinId` 精确匹配。
- [x] 删除 `isBase: true` 作为所属皮肤合法条件的校验；`isBase` 仍仅表示英雄默认外观。
- [x] 找不到 `sourceSkinId` 或嵌套 `skinId` 时返回明确的 `not-found` 错误，不回退到其他对象。
- [x] 将补充数据模型和相关内部变量由 `baseSkin` 改为 `sourceSkin`，并新增匹配的 `chroma`。
- [x] 保留静态详情正文，使用“所属皮肤 / Chroma parent skin”文案，并维持频道、本地化、重试、取消与错误降级行为。
- [x] 新增 `isBase: false` 的所属皮肤成功回归测试，并保留 `isBase: true` 的成功场景。
- [x] 覆盖所属皮肤缺失、炫彩缺失和 DOM 关系链接场景。
- [x] 为英雄、所属皮肤、皮肤系列、皮肤宇宙和相关臻彩生成中英文站内链接，并保留 `latest` 渠道状态。
- [x] 臻彩详情页不展示或加载独立的“皮肤补充资料”区块，CD 资料由目标运行时详情页负责。
- [x] 运行全量 Vitest、类型检查、数据校验、静态构建和产物审计。
