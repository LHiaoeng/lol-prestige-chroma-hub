---
status: completed
---

# 统一皮肤资料项 identity 与排序规格

## Problem Statement

LoL Chroma Art 的运行时皮肤资料需要把皮肤本体、有效皮肤阶段和关联皮肤集合转换为统一的皮肤资料项。现有皮肤资料投影 module 已经负责阶段展开、稳定 identity、去重、关系筛选和常规排序，但 PBE 新增比较仍在自己的 implementation 中复制了一套 `RuntimeSkinReferenceItem` 比较规则。

两套规则当前大致相同，但它们分别维护皮肤 ID、阶段 kind、阶段顺序、阶段 ID和名称的比较。如果以后阶段来源、重复 identity 或排序优先级变化，只更新其中一处就可能让英雄详情、皮肤系列、皮肤宇宙和 PBE 新增页面显示不同顺序或不同重复项。对访客而言，同一批皮肤资料在不同页面中顺序漂移会降低可核对性；对维护者而言，皮肤 identity 的事实没有集中在一个 deep domain module。

## Solution

让一个皮肤资料投影 module 成为所有 `RuntimeSkinReferenceItem` identity、阶段展开、去重和稳定排序的唯一 seam。PBE 新增 module 继续负责比较 PBE 与 latest 的顶层实体集合，但不再复制皮肤资料项的比较 implementation；它在得到新增顶层皮肤后复用同一投影和排序规则。

保持现有领域口径：PBE 的皮肤数量仍按新增顶层皮肤实体统计，展示列表可以包含由这些皮肤展开出的有效阶段；阶段仍不是新的 CommunityDragon 实体。统一的是资料项 identity 和顺序，不是改变 PBE 差集的统计口径。

## User Stories

1. 作为访客，我希望英雄详情中的皮肤本体和阶段按照稳定顺序显示，以便可以重复查找同一项。
2. 作为访客，我希望皮肤系列详情中的皮肤资料项使用与英雄详情相同的 identity 规则，以便不会出现重复或遗漏。
3. 作为访客，我希望皮肤宇宙按皮肤系列分组时保持稳定的皮肤项顺序，以便不同分组之间容易核对。
4. 作为访客，我希望 PBE 新增皮肤的展示顺序与其他运行时皮肤集合一致，以便新增页面不会产生另一套排序直觉。
5. 作为访客，我希望有有效数字 ID 的阶段作为可定位资料项显示，以便可以打开正确的阶段详情。
6. 作为访客，我希望没有有效阶段 ID 的阶段不会被伪造为可导航资料项，以便链接不会指向猜测的实体。
7. 作为访客，我希望同一英雄、皮肤和阶段 identity 的重复来源只显示一次，以便页面不会重复展示相同资料。
8. 作为访客，我希望不同英雄拥有相同数字皮肤 ID 时仍被视为不同资料，以便不会跨英雄错误去重。
9. 作为访客，我希望皮肤本体与阶段 ID 冲突时遵守既定的阶段优先规则，以便阶段资料不会被本体卡片遮蔽。
10. 作为访客，我希望排序相同的资料项使用名称作为稳定的最后比较因素，以便结果不会因来源对象顺序变化而漂移。
11. 作为维护者，我希望 identity、去重和排序只在一个 domain module 中定义，以便修改一次即可影响所有资料集合。
12. 作为维护者，我希望 PBE 比较 module 只处理集合差异，不再知道阶段排序细节，以便它的 interface 更小、更深。
13. 作为维护者，我希望皮肤资料项继续保留所属英雄、皮肤、阶段、关系、媒体和稀有度事实，以便统一排序不会丢失页面展示所需数据。
14. 作为维护者，我希望排序规则对空名称、空阶段索引和缺失关系保持确定性，以便缺失数据不会导致不同页面顺序不稳定。
15. 作为测试维护者，我希望通过投影 module 的行为测试证明 identity 和排序规则，而不是分别测试每个页面的数组顺序实现。
16. 作为测试维护者，我希望 PBE 差集测试同时证明顶层数量口径和展示项展开口径没有被统一排序意外改变。

## Implementation Decisions

- 以现有皮肤资料投影 module 作为最高 domain seam，集中提供资料项 identity、阶段展开、去重和稳定排序。
- 公开的资料项 identity 必须同时包含所属英雄、所属皮肤和可选阶段；名称、描述、媒体和稀有度不能作为 identity。
- 皮肤本体和阶段使用同一资料项形状，但 kind、阶段 ID和阶段索引继续区分它们；阶段不是独立 CommunityDragon Entity。
- 同一投影入口负责把皮肤本体与有效阶段展开为资料项，并过滤没有有效阶段 ID的阶段导航项。
- 普通关系集合、英雄详情集合、皮肤系列集合、皮肤宇宙分组和 PBE 新增展示都使用同一 canonical comparator；页面只能在 canonical 顺序之上增加明确的用户排序，例如稀有度排序。
- canonical comparator 保留现有稳定优先级：皮肤 ID、资料项 kind、阶段索引、阶段 ID和名称；如果实现需要改变优先级，应明确记录用户可见变化并同步所有调用方。
- 去重必须先使用包含所属英雄的稳定 identity，再执行排序；不能先按显示名称或单一皮肤 ID去重。
- PBE module 继续按顶层皮肤实体 ID比较 PBE 与 latest，并继续用顶层新增皮肤数量计算统计；展开后的阶段数量不改变 `counts.skins`。
- PBE module 得到新增顶层皮肤后，使用 canonical projection 生成展示资料项，并使用同一个 comparator 排序；不保留本地 `compareSkinItems` implementation。
- 关系筛选仍由领域 projection module 负责；页面和 client adapter 不重新实现阶段过滤、关系 ID或排序。
- 缺失名称、阶段索引和关系数据必须遵守现有缺失状态语义，不通过跨本地化视图补值来获得排序字段。
- 不改变皮肤资料项的媒体、炫彩、稀有度、External Reference Link、URL target 或页面文案。
- 不改变 PBE 新增页面的实体差集定义、版本比较、总数、四类统计或失败原子性。

## Testing Decisions

- 测试只验证资料项的外部领域行为：identity、阶段展开、去重、canonical 顺序、页面排序选项和 PBE 展示口径。
- 主要测试 seam 是皮肤资料投影 module；使用固定的 RuntimeSkin 和 RuntimeSkinSummary 夹具，不访问浏览器或 CommunityDragon。
- 覆盖同一皮肤本体、多个有效阶段、无效阶段、重复阶段和阶段 ID冲突。
- 覆盖相同皮肤 ID属于不同英雄的情况，证明 identity 不会跨英雄合并。
- 覆盖缺失名称、缺失阶段索引、缺失稀有度和缺失关系 ID，证明排序确定且不伪造字段。
- 覆盖英雄详情、皮肤系列、皮肤宇宙和普通皮肤资料集合都使用相同 canonical 顺序。
- 覆盖 PBE 的新增顶层皮肤计数与展开后的资料项数量不同但语义正确的情况。
- 覆盖 PBE 与 latest 同一顶层皮肤、不同顶层皮肤、重复阶段和不同英雄相同皮肤 ID。
- 覆盖 PBE 展示项和常规展示项最终 comparator 顺序一致。
- 保留现有页面测试对可观察卡片顺序和阶段链接的断言，但避免在 DOM 测试中复制 comparator 的每一条排序规则。
- 运行 `pnpm test`、`pnpm typecheck`、`pnpm data:validate` 和 `git diff --check`；需要时执行运行时页面浏览器验收确认顺序和链接未改变。

## Out of Scope

- 不改变 PBE 新增的实体差集定义、统计口径、版本显示或页面结构。
- 不改变皮肤阶段是否为 CommunityDragon Entity 的领域定义。
- 不改变皮肤、阶段、皮肤系列和皮肤宇宙的 URL 结构或导航行为。
- 不改变稀有度排序的用户选择，只统一其 tie-breaker 与资料项 canonical 顺序。
- 不改变 CommunityDragon 解析、资源路径、缓存、错误处理或本地化视图规则。
- 不在页面、DOM view 或 client adapter 中新增第二套资料项 identity 或排序规则。
- 不处理 URL 状态、通道生命周期或 DOM view 拆分问题。

## Implementation Status

- 已统一皮肤资料项的 canonical identity、阶段展开、去重和排序规则。
- PBE 差集已复用统一投影与 comparator，同时保留顶层皮肤统计口径。
- 实现 commit：`f795aba refactor(runtime): 统一皮肤资料项 identity 与排序`。
- 验证：`pnpm test`（40 个测试文件、329 个测试全部通过）；`pnpm typecheck`（0 errors，存在既有 22 个 hints）。

## Further Notes

- 这是一个纯 domain deepening，最高 seam 已存在于 `RuntimeSkinReferenceItem` 投影 module；不需要新增外部 adapter。
- “一套 comparator”不是为了追求抽象，而是因为已有多个真实调用方：英雄、系列、宇宙和 PBE 页面都消费同一资料项形状。
- 实现后应优先删除 PBE module 中重复的比较 implementation，使用 deletion test 确认复杂度集中而不是转移到页面调用方。
