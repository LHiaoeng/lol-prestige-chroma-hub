---
status: completed
---

# 统一运行时 URL 状态规格

## Problem Statement

LoL Chroma Art 的运行时资料使用 `id`、`champion`、`stage` 和 `channel` 表达实体、皮肤定位提示、皮肤阶段和数据通道。当前这些 URL 事实分散在 URL 状态 module、运行时页面状态解析、臻彩详情页构建逻辑、运行时视图链接构建和通道链接绑定中。

这种分散让同一个 URL interface 出现多份 implementation：有的地方把缺省 channel 表示为没有参数，有的地方显式保留 `channel=pbe`；有的地方只复制 channel，有的地方还需要复制实体定位参数；运行时页面与静态臻彩页面也各自读取和格式化 channel。以后新增参数或修改语言切换规则时，容易出现链接丢失实体、丢失阶段、丢失显式 PBE 意图，或者技术 token 与玩家文案不一致。

对访客而言，复制、刷新、语言切换、从静态臻彩详情进入运行时资料，以及在运行时页面之间导航，都应该保留必要的 URL 状态。对维护者而言，URL 参数的验证、缺省值、格式化和跨页面转发应该集中在一个 deep module；DOM 事件绑定和具体页面路由不应重新发明这些规则。

## Solution

建立一个无 DOM 依赖的运行时 URL 状态 module，统一读取、校验、格式化和转发运行时 URL 状态。该 module 负责技术 token 和参数保留规则；页面路由 parser 仍负责判断某个页面需要哪些参数，DOM adapter 仍负责把规则应用到语言切换和页面链接。

所有页面使用同一个 URL 状态 interface：合法的正安全整数实体参数、可选的英雄和阶段定位提示、`pbe` / `latest` channel，以及显式 `pbe` 是否需要在生成链接中保留。默认 channel、显式 channel、语言切换和跨页面链接的差异由 module 的实现集中处理。

## User Stories

1. 作为访客，我希望打开没有 `channel` 的旧合法链接时默认读取 `pbe`，以便缺省 URL 继续可用。
2. 作为访客，我希望显式的 `channel=pbe` 在链接转发时可以保留，以便分享者的来源意图不被静默删除。
3. 作为访客，我希望 `channel=latest` 在列表、详情、关系和语言切换链接中保持不变，以便始终查看正式服资料。
4. 作为访客，我希望非法 channel 被识别为无效状态，而不是被当作 `pbe`，以便不会误读资料来源。
5. 作为访客，我希望实体详情链接保留 `id`，以便目标页面打开正确实体。
6. 作为访客，我希望皮肤详情链接保留 `champion` 定位提示，以便目标页面能够读取正确的英雄资料。
7. 作为访客，我希望皮肤阶段链接保留 `stage`，以便目标页面打开指定阶段而不是皮肤本体。
8. 作为访客，我希望语言切换保留当前实体、英雄定位提示、阶段和 channel，以便切换语言后仍停留在同一资料。
9. 作为访客，我希望从臻彩详情进入英雄、所属皮肤、皮肤系列和皮肤宇宙时保留当前 channel，以便关联资料使用相同来源。
10. 作为访客，我希望运行时列表卡片进入详情时保留当前 channel，以便导航不会意外回到默认来源。
11. 作为访客，我希望 URL 中重复、无关或非法的运行时参数不会污染生成的目标链接，以便链接保持稳定和可读。
12. 作为访客，我希望 URL 编码和 query 参数顺序稳定，以便分享链接、历史导航和测试结果具有可预测性。
13. 作为键盘用户，我希望语言切换和通道链接在点击后携带与视觉状态一致的参数，以便不因交互方式不同而看到不同资料。
14. 作为维护者，我希望 URL 规则可以在浏览器和 Astro 构建代码中复用，以便静态页面和动态页面不会分别解析 channel。
15. 作为维护者，我希望页面路由语义与通用 URL 参数语义分开，以便新增页面不会复制正整数和 channel 校验。
16. 作为维护者，我希望 URL module 不依赖 DOM，以便可以通过纯函数测试所有参数组合。
17. 作为维护者，我希望 `pbe` / `latest` 技术 token 与 `PBE` / “正式服” / `Live` 展示文案继续分离，以便 URL 规则不承担本地化文案职责。
18. 作为测试维护者，我希望用一组 URL 状态契约测试覆盖静态臻彩页和运行时资料页，以便规则修改不会只修复一个入口。

## Implementation Decisions

- 建立一个无 DOM 的运行时 URL 状态 module，作为读取、格式化和转发 URL 参数的唯一主要 seam。
- URL 状态 interface 只表达通用技术状态：实体 ID、英雄定位提示、阶段 ID、数据通道和显式 channel 保留意图；页面模式、实体种类和路由合法性由页面 parser 负责。
- 所有实体参数必须是正安全整数；非法值不应被猜测、截断或转换为默认值。
- `channel` 只接受 `pbe` 与 `latest`。缺少 channel 表示默认 `pbe`；显式 `channel=pbe` 的保留由调用方的链接策略明确指定。
- URL module 提供从当前 URL 提取状态、把状态写入目标 URL、按目标页面筛选允许参数的能力；它不直接操作 DOM，也不监听浏览器事件。
- 语言切换和运行时关联链接使用同一套参数复制规则；目标路径由调用方提供，参数转发由 URL module 完成。
- URL module 不决定玩家界面如何显示 channel；`communityDragonChannelLabel` 等展示规则继续属于本地化与视图 module。
- 运行时页面的完整 route parser 继续负责列表、详情、皮肤定位提示和 PBE 页面之间的页面模式判断，但应复用通用参数读取和格式化规则。
- 静态臻彩 Astro 页面生成的运行时入口链接应复用同一 URL 状态规则，不再手写 channel query 拼接。
- DOM 中的语言切换和 channel link binder 保留为 adapter，只负责查找链接、读取当前 URL、调用 URL module 并更新 `href`。
- 生成目标链接时应删除目标页面不允许的参数，避免把皮肤阶段或无关实体参数泄漏到列表页面。
- 不改变现有路由结构、`pbe` / `latest` token、默认 channel、实体参数名称、详情 `noindex` 或 CommunityDragon 请求规则。
- 不把 URL module 与 History API、请求生命周期、DOM renderer 或页面数据读取 module 合并；每个 module 保持自己的 interface。

## Testing Decisions

- 测试只验证 URL 的外部行为：读取、合法性、缺省 channel、显式 channel 保留、参数筛选、目标 URL 格式化和语言/关联链接转发。
- 主要测试 seam 是无 DOM 的 URL 状态 module，使用 URL 输入和 URL 输出，不依赖浏览器 document 或具体页面节点。
- 覆盖缺少 channel、显式 `pbe`、显式 `latest`、未知 channel、大小写错误、空值和重复参数。
- 覆盖合法正安全整数、零、负数、小数、超出安全整数和非数字实体参数。
- 覆盖 `id`、`champion`、`stage` 的独立存在、组合存在和目标页面参数筛选。
- 覆盖语言切换保留实体、英雄、阶段和 channel，同时不保留目标语言不需要的页面参数。
- 覆盖从静态臻彩详情生成英雄、皮肤、系列和宇宙链接时的 channel 保留。
- 覆盖运行时列表、详情和皮肤阶段链接的格式化结果，并证明显式 PBE 与缺省 PBE 的策略可区分。
- 保留现有 DOM binder 测试，但将断言重点放在最终 `href` 和用户可观察导航结果，不绑定 binder 内部调用顺序。
- 运行时 controller 的页面模式测试继续验证它如何消费 URL 状态 module；不在 controller 测试中重复所有底层 query 组合。
- 运行 `pnpm test`、`pnpm typecheck`、`pnpm build` 和 `git diff --check`；需要时补充真实浏览器检查语言切换、跨页面链接、刷新和返回。

## Out of Scope

- 不改变运行时页面、皮肤详情、静态臻彩详情或中文路由的路径结构。
- 不改变 CommunityDragon 的数据通道、本地化视图、请求 URL、缓存键或错误分类。
- 不重做运行时通道生命周期 module，不处理请求取消、generation 或 History API 提交时机。
- 不拆分 DOM view，不改变页面文案、布局、SEO、sitemap 或无障碍结构。
- 不把 URL 参数转换成 slug、名称或其他非数字实体身份。
- 不增加新的 URL 参数、实体类型或外部导航目标。
- 不为非法旧 URL 增加隐式猜测、跨页面重定向或服务端兼容逻辑。

## Implementation Status

- 已完成共享运行时 URL 状态 module，并接入静态臻彩页、运行时页面和语言/通道链接 adapter。
- 已统一实体、英雄定位提示、阶段和 `pbe` / `latest` channel 的读取、校验、格式化与转发规则。
- 实现 commit：`daf134c refactor: 统一运行时 URL 状态`。
- 验证：`pnpm test`（40 个测试文件、329 个测试全部通过）；`pnpm typecheck`（0 errors，存在既有 22 个 hints）。

## Further Notes

- 这是一个偏规则一致性的 deepening；最高价值来自让静态页面、运行时 controller 和 DOM adapter 共用同一个 URL seam。
- 现有 `RuntimeChannelLifecycle` 继续负责“加载成功后提交 URL”的生命周期语义；本规格只统一 URL 状态的读取和生成事实。
- 如果某个页面确实需要特殊参数，应在页面 parser 的 interface 中显式表达，而不是让通用 URL module 接受任意 query 参数。
