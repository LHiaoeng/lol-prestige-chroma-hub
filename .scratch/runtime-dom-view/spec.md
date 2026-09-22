---
status: completed
---

# 运行时 DOM view 深化规格

## Problem Statement

LoL Chroma Art 的运行时 DOM view 已经把页面状态 interface 收敛为统一的 `render(state)`，但它的 implementation 仍集中在一个约 75 KB 的 module 中。这个 module 同时负责列表工具栏、搜索筛选、分页、英雄卡片、皮肤卡片、皮肤详情媒体、历史原画、炫彩颜色、PBE 差集、关系区域、错误重试、channel 控件和双语文案。

外部 interface 已经较窄，但实现的知识仍然过度集中。维护者修改一个页面模式时，需要在同一个 module 中穿过大量共享 DOM helper、页面分支、slot 状态和本地化文案；测试文件也把列表、详情、PBE、关系和媒体行为混在同一个 DOM 测试 surface 中。继续向这个 module 添加页面能力会让实现变浅：调用方必须知道更多页面模式细节，测试也更难定位失败原因。

对访客而言，目标不是改变页面外观，而是保持现有的加载、空状态、失败、重试、媒体错误、键盘操作和双语行为，同时让每种页面模式的实现变化集中在自己的 locality 中。对维护者而言，DOM view 的公开 seam 应继续是统一页面状态，页面模式的内部变化不应泄漏到 controller 或领域 module。

## Solution

保留一个对外的 deep DOM view interface，以统一页面状态作为输入；在其 implementation 内部按真实页面模式和稳定展示职责组织 renderer。列表、详情和 PBE 页面保留独立的内部 renderer，媒体/卡片/关系等共享行为只保留真正跨模式复用的 helper，不为每个 DOM 节点制造浅 module。

DOM view orchestration module 负责选择页面 renderer、准备根节点、维护全局可访问状态和把重试动作绑定到页面状态。内部 renderer 负责各自页面模式的 DOM 结构和局部行为。controller、页面编排 module 和领域 projection 继续只看到统一的 view interface，不依赖具体 renderer。

## User Stories

1. 作为访客，我希望英雄列表的搜索、职业筛选、排序和分页行为保持不变，以便重构不会影响目录使用。
2. 作为访客，我希望英雄列表的卡片、头像、角色和缺失状态保持不变，以便资料可读性不受影响。
3. 作为访客，我希望皮肤系列列表和皮肤宇宙列表保持相同的卡片和关系展示，以便目录之间具有一致体验。
4. 作为访客，我希望英雄详情的皮肤资料项、稀有度排序和阶段链接保持不变，以便可以继续浏览皮肤集合。
5. 作为访客，我希望皮肤详情继续显示英雄、稀有度、描述、媒体、历史原画、阶段、皮肤本体项、炫彩颜色和第三方入口，以便资料完整性不受内部拆分影响。
6. 作为访客，我希望皮肤系列详情继续显示宇宙关系和系列内皮肤，并且关系或集合失败时保留核心内容。
7. 作为访客，我希望皮肤宇宙详情继续显示系列关系和按系列分组的皮肤资料，以便关系结构不因 renderer 变化而改变。
8. 作为访客，我希望 PBE 新增页面继续显示版本、总数、四类统计、空状态和详情链接，以便差集结果保持可核对。
9. 作为访客，我希望核心资料成功后补充资料能独立更新，以便页面不会等待所有 DOM 区域同时完成。
10. 作为访客，我希望补充资料失败时只显示对应区域的错误和重试按钮，以便核心内容不会被清空。
11. 作为访客，我希望媒体资源失败时保留文字资料并移除失效媒体，以便单个图片或视频失败不会破坏整页。
12. 作为访客，我希望中英文页面的标签、缺失提示、错误文案、按钮和无障碍名称保持一致，以便语言切换不会改变功能。
13. 作为键盘用户，我希望搜索、筛选、排序、分页、链接和重试控件继续可操作，以便重构不降低键盘可用性。
14. 作为屏幕阅读器用户，我希望加载、成功、空状态和失败状态继续通过正确的 status、label 和 aria 属性表达，以便可以理解页面状态。
15. 作为维护者，我希望修改一个页面模式时主要影响对应的内部 renderer，以便实现获得更好的 locality。
16. 作为维护者，我希望 controller 只调用统一的 view interface，不需要知道列表、详情、PBE renderer 的具体方法，以便 interface 保持 deep。
17. 作为维护者，我希望共享媒体、链接、缺失字段和本地化 helper 只在存在真实复用时共享，以便不会通过过度抽象制造浅 module。
18. 作为测试维护者，我希望每个页面模式仍能通过最高的 DOM 行为 seam 验证，以便测试关注用户可观察输出而不是内部 renderer 名称。
19. 作为测试维护者，我希望页面模式的测试夹具只提供所需的最小页面状态，以便新增字段不会迫使所有测试构造完整实体图谱。
20. 作为站点维护者，我希望 DOM view 拆分不改变 CommunityDragon 请求、页面编排、URL、SEO、sitemap 或部署行为，以便本次改造边界清晰。

## Implementation Decisions

- 保留一个对外的 DOM view interface，输入统一的 runtime page state；不把列表、详情和 PBE renderer 暴露给 controller 或页面编排 module。
- DOM view orchestration module 负责选择内部 renderer、准备根节点、维护 `aria-busy`、状态消息、channel 控件绑定和 view 生命周期。
- 建立列表内部 renderer，负责英雄、皮肤系列、皮肤宇宙列表的工具栏、过滤、排序、分页、卡片、空状态和列表补充关系。
- 建立详情内部 renderer，负责英雄、皮肤、皮肤系列、皮肤宇宙详情的核心结构、媒体、阶段、炫彩、关系 slot 和第三方入口。
- 建立 PBE 内部 renderer，负责版本、统计、四类新增实体、空状态和导航卡片；PBE 的原子失败由页面编排状态决定，renderer 不自行请求资料。
- 共享 helper 只保留真正跨 renderer 的深行为：本地化缺失提示、媒体资源错误处理、运行时链接、稀有度、颜色圆圈和可访问文本。
- 不为单个标签、单个卡片或单个 DOM 节点建立公开 module；小 helper 可以留在所属 renderer 内，避免 interface 与 implementation 等量增长。
- 关系 slot 的 loading、ready、empty、failed 和 retry 状态来自页面编排 state；renderer 不维护第二份请求状态或自行判断旧结果是否有效。
- renderer 不创建 CommunityDragon runtime、不生成数据请求、不修改 History API；它只把给定状态映射为 DOM，并触发调用方提供的 retry 行为。
- 保持现有 DOM 类名、data 属性、页面文案、媒体 fallback、错误状态、链接 target、`noindex` 更新和 channel 控件行为，除非测试证明某个属性只属于旧内部结构且没有外部契约。
- 统一处理根节点的加载与状态语义，避免列表、详情和 PBE renderer 各自设置互相覆盖的 `aria-busy` 或 status 文案。
- renderer 的选择根据页面状态中的 page/mode 和实体 kind 完成；无效页面状态由 orchestration module 交给统一 invalid view，不进入具体 renderer。
- 领域 module、页面编排 module、运行时通道生命周期 module 和 URL state module 的 interface 不因 DOM 拆分而扩大。
- 不引入客户端框架、模板编译器或新的 UI 依赖；继续使用现有 TypeScript DOM implementation。

## Testing Decisions

- 测试只验证 DOM view 的外部行为：节点结构、文本、链接、状态、错误、重试、媒体失败、键盘属性和双语输出；不验证内部 renderer 的函数调用顺序或文件拆分。
- 主要测试 seam 是统一 DOM view interface 加真实页面状态输入；页面状态由固定夹具构造，不访问真实 CommunityDragon。
- 保留英雄、皮肤系列、皮肤宇宙列表的搜索、筛选、排序、分页和卡片测试。
- 保留英雄、皮肤、皮肤系列、皮肤宇宙详情的媒体、阶段、关系、炫彩、稀有度和链接测试。
- 保留 PBE 版本、统计、四类卡片、空状态、关系导航和失败显示测试。
- 覆盖核心 ready 加补充 loading/ready/empty/failed 的组合，证明 renderer 不会清空核心内容或错误区域。
- 覆盖每个补充 slot 的独立 retry，证明点击一个 retry 不触发其他 slot 的 DOM 重建。
- 覆盖失效媒体移除、缺失字段提示、错误消息和 status/aria 属性。
- 覆盖英文与简体中文的标签、错误、缺失、按钮、频道名称和 aria 文本。
- 覆盖无效页面状态和未知实体 kind 的统一失败行为，不让内部 renderer 产生未捕获异常。
- 复用现有运行时 DOM 测试 prior art；测试可按页面模式分组，但不应把内部 renderer 名称当作长期契约。
- 运行 `pnpm test`、`pnpm typecheck`、`pnpm build`、`pnpm audit:build` 和 `git diff --check`；需要时进行真实浏览器验收确认桌面与移动断点的可操作性。

## Out of Scope

- 不改变运行时 page state、页面编排、通道生命周期、URL state、领域 projection 或 CommunityDragon runtime interface。
- 不改变任何页面的视觉设计、CSS token、布局断点、文案、SEO、sitemap 或广告策略。
- 不新增页面模式、实体类型、请求、数据字段或外部媒体入口。
- 不把 DOM renderer 改成客户端框架或引入新的渲染依赖。
- 不为每个 helper 强行建立独立 module，也不以文件数量作为拆分目标。
- 不改变页面核心优先、关联资料局部失败、空状态和独立重试的用户行为。
- 不处理 URL 参数分散或皮肤资料项排序重复问题；它们分别由其他 spec 负责。

## Implementation Status

- 已保留统一 DOM view interface，并按列表、详情、PBE 和共享展示职责拆分内部 renderer。
- 已保持现有页面状态、双语文案、无障碍状态、关系失败和独立重试行为。
- 实现 commit：`e675e77 refactor(runtime): 拆分运行时 DOM renderer`。
- 验证：`pnpm test`（40 个测试文件、329 个测试全部通过）；`pnpm typecheck`（0 errors，存在既有 22 个 hints）。

## Further Notes

- 这是当前三项中最后的展示 implementation deepening；第一项和第二项已为它提供了稳定的生命周期和页面状态 seam。
- 目标不是把一个大 module 拆成许多浅 module，而是保持一个小而稳定的外部 interface，把页面模式变化集中在内部 implementation。
- 使用 deletion test：如果删除列表或详情内部 renderer，复杂 DOM 规则应重新集中到 orchestration module，而不是扩散到 controller、领域 module或页面脚本。
