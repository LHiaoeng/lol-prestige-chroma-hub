# 01: 棋盘资料投影与查询

**What to build:** 浏览者能看到来源中的每个有效棋盘条目，并按本地化名称、分组和等级进行稳定搜索、筛选及排序；PBE 新增只由 `itemId` 差集决定。

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] 校验必需 ID、名称、分组、`TFTRarity` 与媒体路径；描述可缺省，忽略 `rarity` 和 `IsWIP`。
- [ ] 固定夹具覆盖全部条目独立保留（含 Base）、重复或非法值报错及等级以 `TFTRarity` 为准。
- [ ] 跨语言别名按 `itemId`、`groupId` 匹配；组合搜索与筛选后卡片事实仍取当前语言视图。
- [ ] 默认按 ID 降序；支持 ID、等级和名称的升降序，其他排序以 ID 降序打破平局。
- [ ] PBE 新增按 `itemId` 差集标记并置顶，置顶项与其他项各自遵循所选排序。
