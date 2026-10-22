---
status: completed
---

# PRD：云顶之弈小小英雄资料集

## 问题与目标

本站已有英雄联盟资料目录，但没有可集中查找云顶之弈小小英雄资料集的入口。按术语表，小小英雄是玩家伙伴外观资料集的统称；本页收录 `companions.json` 中已核对的三种类别：小小英雄（`kLittleLegend`）、英雄级小小英雄（`kChibi`）和不朽弈士形象（`kStyle2`）。访客需要按 CD 提供的 `name`、`speciesName`、`level` 和 `TFTRarity` 浏览资料，并能区分 PBE 与正式服。首期交付中英文列表页；页面展示来源事实，不推断持有状态、在售状态或发布日期。页面文案使用 CD 的本地化名称；稀有度按已核对的 TFT 分类名称显示，筛选和 URL 仍使用来源字段值。

## 数据依据与口径

2026-10-21 核对了 CommunityDragon 的 [`latest/default`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/companions.json)、[`latest/zh_cn`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/companions.json)、[`pbe/default`](https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/companions.json) 和 [`pbe/zh_cn`](https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/companions.json) 四份 `companions.json`。`latest` 各语言均有 2040 条 companion，其中 `kLittleLegend`、`kChibi`、`kStyle2` 分别为 1873、133、34 条；`pbe` 各语言为 2043 条，分别为 1873、135、35 条。数量只说明核对时的源数据，页面必须实时计算，不能硬编码。

| 用途 | CD 字段 | 产品规则 |
| --- | --- | --- |
| 收录范围 | `companionType` | 收录已核对的 `kLittleLegend`、`kChibi` 和 `kStyle2` 三类；未知类别视为来源格式错误。 |
| 唯一身份 | `itemId` | 一张卡片对应一个有效且唯一的正整数 `itemId`；不用名称或图片文件名合并记录。 |
| 本地化文案 | `name`、`speciesName`、`description` | 使用当前语言文件；描述当前有缺失，不作为列表必填字段，也不从另一语言补全。 |
| 图片 | `loadoutsIcon` | 使用来源路径及现有 CD 路径转换函数，JSON 与图片保持同一通道；图片失败显示等比占位，保留文字。 |
| `speciesName` | `speciesId`、`speciesName` | 按 `speciesId` 筛选，选项与卡片展示当前语言的 `speciesName`，不另造分类名。 |
| `level` | `level` | 页面作为星级显示；同一 `companionType` 与 `speciesId` 有多个不同星级时，在名称后追加当前星级（如“3星”），只有一个星级时不追加；资料项仍按 `itemId` 独立保留。 |
| `TFTRarity` | `稀有度` | 筛选和 URL 使用来源原始值；页面按已核对的 TFT 分类名称显示（`kStandard` 为经典、`kLegendary` 为传说、`kMythic` 为神话、`kPrestige` 为至臻），不与 `rarity`、`rarityValue` 混用。 |
| 不作结论的字段 | `IsWIP`、`TFTOnly`、`isDefault`、`upgrades` | 不用这些字段推断在售、已拥有或正式发布日期，也不据此静默删去小小英雄。 |

已核对的 `kLittleLegend` 数据中，`latest` 的 `TFTRarity` 为 `kStandard` 1454 条、`kLegendary` 385 条、`kMythic` 30 条；`level` 为 1 的有 543 条、2 的有 543 条、3 的有 783 条。`pbe` 为 1873 条，其中 275 条 `IsWIP` 为真；`latest` 也有 262 条为真，因此该字段不能被解释为“仅 PBE 内容”。源数据会滚动变化，遇到新增枚举值、重复 ID 或必需字段不合法时，应明确报告资料格式错误，不能悄悄归到其他分类。

## 用户故事

1. 访客能从导航进入本语言的小小英雄资料集，看到当前资料通道的三类总数与卡片。
2. 访客能按 CD 的 `name` 或 `speciesName` 搜索，并用 `companionType`、`speciesId`、`TFTRarity`、`level` 缩小结果。
3. 访客能切换 PBE／正式服，并在刷新、分享链接、前进和后退后恢复选择；PBE 数据按 `itemId` 与正式服对照，可选只看正式服没有的条目，并在新增卡片上显示 PBE 角标。
4. 使用手机、键盘或辅助技术的访客能读取 CD 的 `name`、`speciesName`、`level`、本地化稀有度名称，以及加载和失败状态。

## 页面与交互需求

- **入口与路由**：新增 `/tft/companions/` 和 `/zh-cn/tft/companions/`。共享 Header 增加本语言“云顶之弈 / Teamfight Tactics”入口，指向列表；不把云顶资料放入现有“英雄联盟”下拉。面包屑为“首页 → 云顶之弈 → 小小英雄 / Home → Teamfight Tactics → Tacticians”，“云顶之弈 / Teamfight Tactics”链接到 [TFT 官方首页](https://teamfighttactics.leagueoflegends.com/en-us/index/)。页面 `h1` 分别为“小小英雄 / Tacticians”，标题图标统一使用 CommunityDragon 的 `little_legends_icon.svg`；云顶之弈面包屑继续使用 TFT 领域图标。
- **骨架**：遵循列表页模板：面包屑 → 带领域图标的 `h1` → 共享版本切换、垂直 Divider、总数 → 水平 Divider → 搜索与筛选 → 结果网格。首次加载时显示与网格对应的骨架屏，不同时显示 Spin；切换通道并保留已有结果时才显示居中的 Spin。列表头不放重复说明段落。默认通道为项目现行 `pbe`，显式 `channel=latest` 为正式服／Live。
- **卡片**：每个有效 `itemId` 一张卡；图片区域为 1:1，以 `cover` 展示 `loadoutsIcon`，点击或键盘激活后通过共享媒体预览查看原图；悬停或聚焦显示预览图标。图片左上角显示 PBE 新增角标；右上角的信息图标沿用皮肤目录卡片的交互，悬停时显示详情 Popover，点击后固定显示，触屏上始终可见。Popover 显示名称、类别、种类、星级和稀有度，不显示 ID。图片下方只保留稀有度图标与名称标题，不重复显示类别、种类或星级说明。标题行由与标题字号同步的本地化稀有度图标和 `name` 组成，单行省略；同一类别和 `speciesId` 有多个星级时在名称后追加当前星级，只有一个星级时不追加。名称悬停或键盘聚焦时统一显示“稀有度名称 完整名称” Tooltip，稀有度图标 Tooltip 展示本地化稀有度名称。图片失败时保留占位和文本。卡片仅封面和详情按钮可操作，不把整张卡伪装成链接。
- **筛选与排序**：搜索匹配中英文视图的 `name` 与 `speciesName`，名称别名按 `itemId` 与 `speciesId` 关联，卡片仍只显示当前语言资料；忽略首尾空白及大小写。按 `companionType`、`speciesId`、`TFTRarity`、`level` 分别单选；类别按不朽弈士形象、英雄级小小英雄、小小英雄排列，稀有度按至臻、神话、传说、经典排列，均从高到低显示；其他选项只使用当前响应中的值。多个条件取交集。“全部”清除对应条件。PBE 通道按 `itemId` 对照正式服，提供默认关闭的“PBE 新增”筛选并在新增卡片图片左上角显示“PBE”角标；正式服对照加载失败时隐藏筛选且不标记新增。结果始终先显示 PBE 新增项；其余排序可选默认、稀有度、类别、名称或星级，并支持升序与降序。默认结果在 PBE 新增项后按稀有度从高到低、类别从高到低、当前语言 `name` 升序排序；同名按 `level` 升序、再按 `itemId` 升序，保证稳定结果。排序随其他筛选同步写入 URL。顶部总数为当前通道三类资料总数，结果区另显示命中数。
- **状态与 URL**：`channel`、搜索、`companionType`、`speciesId`、`TFTRarity`、`level` 和 `pbeOnly` 写入 URL；非法参数显示可恢复的提示并回到安全的默认选择，不请求任意源地址。直接打开、刷新、前进和后退恢复状态。切换通道时先加载目标数据，成功后更新内容和 URL；失败时保留旧内容与 URL，并提供重试。旧请求迟到不得覆盖新状态。
- **数据量**：约 1 MB 的 `companions.json` 只在进入本页时按需读取；同时读取相同通道的另一语言视图，仅为搜索建立名称别名；PBE 通道还读取相同语言的正式服数据以识别新增项。初次最多显示 50 张卡片，“加载更多”每次追加最多 50 张，并按当前网格列数取整到完整行；窗口尺寸变化时保持已加载行数。最终不足一整行的剩余项目仍全部显示。筛选变化后从首批重新显示。按钮隐藏于全部展示完毕时；不用无限滚动或浏览器持久缓存。
- **异常**：首次加载显示与网格同形的 Skeleton 和状态文字；源文件空或无匹配时分别显示清晰的 Empty 文案；请求、格式或路径错误显示 Alert 与重试。图片单独失败不清除列表。禁用脚本时页面仍有标题、导航和启用脚本提示。

## 视觉、无障碍与 SEO

- 复用 `DESIGN.md` 的暗色金色 Token、共享 `BaseLayout`、`Breadcrumb`、`RuntimeChannelSwitcher`、`Divider`、Input/Select、Card、Skeleton、Empty、Alert 与 Button 模式；不引入另一套主题或 Vue 运行时。领域图标需进入共享映射。列表内容沿用共享版心，卡片网格随容器宽度减少列数；320 CSS px 无页面级横向滚动。
- 搜索与筛选有可见标签；图标不单独传达 `level` 或稀有度；结果数量及加载状态有屏幕阅读器可读的文字。控件、重试和“加载更多”可键盘操作且焦点可见；减少动态效果时取消非必要动画。
- 两个列表壳提供本地化标题与描述、canonical、`hreflang`、一致的面包屑结构化数据和 sitemap 条目。动态卡片不宣称为已静态索引的实体页。隐私说明覆盖浏览器直连 CommunityDragon 获取资料和图片。

## 验收标准

1. 以固定夹具验证：收录 `kLittleLegend`、`kChibi`、`kStyle2` 并标明各自类别；同名不同 `itemId`／`level` 分开显示；无效或重复身份会报错；`name`、`speciesName`、`level`、`TFTRarity` 来自当前语言与通道。
2. 中文页可用英文名搜索、英文页可用中文名搜索；搜索、四个来源字段筛选与 PBE 新增筛选组合后，命中数、卡片与 URL 一致；直达链接、刷新及前进后退可恢复；每批最多增加 50 项。
3. PBE／正式服切换成功时 JSON 与图片同通道；PBE 新增按 `itemId` 对照正式服；失败、取消或旧响应迟到时不覆盖原列表和地址；重试可恢复。
4. 核对中英文、桌面与 320 CSS px 手机、键盘焦点、图片失败、无结果、加载失败、无脚本和减少动效；静态壳的 SEO 与导航可在离线构建中生成。
5. 实施时补充相邻行为测试，并同步更新受影响的导航、SEO、隐私及用户文档；运行相关测试、类型检查和发布构建。

## 范围外与已知边界

- 不包含棋盘、攻击特效、传送门，也不新建小小英雄详情页。
- 不展示账号持有、解锁方式、商店价格、在售状态或发布日期；`companions.json` 不提供这些可直接采用的事实。
- 不把完整 CD JSON 或媒体复制到 `public/`、构建产物或 `data/prestige-chromas.json`；不新增运行时数据库或代理。
- 本页的卡片需浏览器执行 JavaScript 才出现；可索引的是双语静态页面壳，而非每张动态卡片。
