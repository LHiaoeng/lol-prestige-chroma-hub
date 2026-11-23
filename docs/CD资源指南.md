# CommunityDragon 资源指南

> 本文用于处理 CommunityDragon 的公开 JSON、图片、客户端资源和资源目录。
> CommunityDragon 的内容会随数据通道和本地化视图变化；本文只定义本项目认可的读取方式和边界。
> 文档先说明英雄联盟与云顶之弈共用的规则，再分别列出两款游戏的资源、字段和读取方式。

## 1. 通用规则

### 1.1 文档范围与基本概念

CommunityDragon 提供 Riot 客户端和游戏资源的公开导出。官方 RAW 资源域名为：

```text
https://raw.communitydragon.org/
```

本项目将资源分为两类：

```text
仓库数据 / 快照 → Astro 构建 → 首页、臻彩详情、博客和固定说明
CommunityDragon RAW → 浏览器加载 → 英雄联盟和云顶之弈的运行时资料
```

- 静态页面不在普通构建时在线刷新 CommunityDragon；CommunityDragon 不可访问时，静态站仍应能够构建。
- 运行时资料是可失败的辅助内容，不承担静态页面正文或实体详情 SEO。
- 资源事实以 CommunityDragon JSON 和官方目录为准；第三方项目只能作为字段展示和解析方式的参考。

### 1.2 RAW URL 与版本选择

通用 URL：

```text
https://raw.communitydragon.org/{version}/{relativePath}
```

常用入口：

| 用途 | URL |
| --- | --- |
| RAW 根目录 | `https://raw.communitydragon.org/{version}/` |
| 目录 JSON 列表 | `https://raw.communitydragon.org/json/{version}/` |
| 游戏客户端资源 | `https://raw.communitydragon.org/{version}/game/` |
| 客户端插件资源 | `https://raw.communitydragon.org/{version}/plugins/` |
| CDragon 便利数据 | `https://raw.communitydragon.org/{version}/cdragon/` |
| Bin 文件浏览器 | [`https://raw.communitydragon.org/binviewer/`](https://raw.communitydragon.org/binviewer/) |

版本值：

- `pbe`：当前滚动资源。本项目运行时默认使用它。
- `latest`：当前滚动资源。运行时只有显式指定 `channel=latest` 时使用。
- `{patch}`：固定补丁目录，例如 `16.18`，用于人工研究或显式维护，不作为运行时通道。

`pbe` 和 `latest` 都是滚动数据源，不是不可变快照。需要复现历史状态时使用明确补丁号，并记录抓取时间和内容版本。

数据源 token 与玩家界面名称分层使用：

| 数据源 token | 中文界面 | 英文界面 |
| --- | --- | --- |
| `pbe` | `PBE` | `PBE` |
| `latest` | 正式服 | `Live` |

URL、请求、缓存键和领域值使用数据源 token；按钮、当前来源、状态反馈和无障碍文案使用玩家界面名称。

### 1.3 本地化视图

数据通道和本地化视图是两个独立维度：

| 页面语言 | 本地化视图 token |
| --- | --- |
| 英文 | `default` |
| 简体中文 | `zh_cn` |

常用 JSON 模板：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/{file}.json
```

规则：

- 数字 ID 用于识别实体；名称、slug、描述、稀有度和可用性属于当前数据通道与本地化视图的事实。
- 当前视图缺失字段时保留缺失，不从另一语言或另一版本补值。
- 当前本地化记录引用 `global/default` 下的共享媒体，不代表业务字段发生跨视图回退。
- 其他语言目录只能用于人工研究，不能直接接入本项目现有页面语言映射。
- `default` 与 `zh_cn` 是资源 token，不代表直营服或国服；玩家界面通常不显示它们。

### 1.4 路径转换规则

JSON 中的资源路径通常不是完整 URL。先读取 JSON 字段，再转换为 RAW 相对路径：

| JSON 路径 | RAW 相对路径 |
| --- | --- |
| `/lol-game-data/assets/ASSETS/UX/TFT/{path}` | `game/assets/ux/tft/{path}` |
| `/lol-game-data/assets/{path}` | `plugins/rcp-be-lol-game-data/global/default/assets/{path}` |
| `assets/{path}` 或 `ASSETS/{path}` | `plugins/rcp-be-lol-game-data/global/default/assets/{path}` |
| `plugins/...` | 原样保留，包括其中的区域和语言目录 |
| `game/...` | 原样保留，从版本根目录拼接 |
| 官方 RAW 完整 URL | 先提取相对路径，再按目标版本重新拼接 |

处理路径时：

1. 去除首尾空白并统一为小写。
2. 不重复添加 `assets`，避免产生 `assets/assets/...`。
3. 不把 `game/...` 转换成 `plugins/rcp-be-lol-game-data/...`。
4. 不因为 JSON 使用 `zh_cn` 就强行把共享媒体路径改成 `zh_cn`。

TFT 客户端图标字段如 `/lol-game-data/assets/ASSETS/UX/TFT/OutOfGame/...` 是专用映射例外：转换到 `game/assets/ux/tft/outofgame/...`，不要套用通用插件路径。

图片或其他媒体的最终地址为：

```text
https://raw.communitydragon.org/{version}/{relativePath}
```

JSON 和媒体必须使用同一 `{version}`。路径来自 JSON 字段或已验证的官方目录，不根据名称、slug 或数字格式猜测。

### 1.5 响应与失败处理

- 目录为空、文件不存在、404、缺失字段和格式不符合预期，都保留为真实状态。
- 不自动改用另一版本、另一语言、另一数据通道或未经批准的镜像、代理和域名。
- 运行时界面分别提供加载中、空状态、失败和可重试状态；媒体失败不应清除已经成功加载的文字资料。
- 页面切换、重新加载或销毁时取消旧请求，迟到响应不得覆盖当前页面状态。
- 通道切换应先加载目标数据，成功后再更新内容和 URL；失败时保留旧内容和旧 URL。

### 1.6 缓存、请求和安全边界

- 浏览器只请求当前页面所需的版本、区域和资源，不预取另一语言、不轮询，也不在重新获得焦点时刷新。
- 页面内可以按“数据通道 + 本地化视图 + 资源键”缓存进行中的 Promise 和已完成响应；跨导航缓存交给浏览器 HTTP 缓存和验证器。
- 不使用 `localStorage`、`sessionStorage`、IndexedDB 或 Service Worker 持久保存 CommunityDragon 响应。
- 请求省略凭据与 Referer；查询参数只允许选择已批准的版本、区域和数字实体 ID。
- 无 JavaScript 时，页面壳仍应提供标题、导航、版本选择说明和启用脚本提示。
- 隐私说明必须披露浏览器会直接连接 CommunityDragon 获取资料和媒体。

### 1.7 通用检查清单

- [ ] 使用 `raw.communitydragon.org` 作为资源域名。
- [ ] 已明确版本：运行时只能使用 `pbe` 或 `latest`，且 JSON 与媒体版本一致。
- [ ] 已按页面语言选择 `default` 或 `zh_cn`。
- [ ] 实体身份使用数字 ID，没有从名称、slug 或数字格式推导身份。
- [ ] 图片路径来自 JSON 字段或已验证的官方目录。
- [ ] 已正确区分 `plugins/...`、`game/...` 和 `/lol-game-data/assets/...`。
- [ ] 404、空目录和缺失字段没有被静默回退或伪造默认值。
- [ ] 运行时请求可取消、可重试，旧响应不能覆盖新状态。
- [ ] 需要复现时记录版本、区域、抓取时间、内容版本和原始 URL。

## 2. 英雄联盟资源

英雄、皮肤、皮肤系列、皮肤宇宙与 PBE 新增页面应展示的信息范围，见 [英雄联盟资料页面信息规范](./英雄联盟资料页面信息规范.md)。本指南继续负责数据来源、身份、本地化视图和路径规则，不规定页面布局。

### 2.1 常用 JSON

英雄联盟客户端数据通常位于：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/
```

| 资源 | 文件或路径 | 用途 |
| --- | --- | --- |
| 英雄摘要 | `champion-summary.json` | 英雄列表、数字 ID、名称、角色和头像 |
| 英雄详情 | `champions/{championId}.json` | 单个英雄及其皮肤正向集合 |
| 完整皮肤目录 | `skins.json` | 皮肤系列、皮肤宇宙和 PBE 新增页面按需读取；不作为其他运行时页面的默认依赖 |
| 皮肤系列 | `skinlines.json` | 系列名称、描述和数字 ID |
| 皮肤宇宙 | `universes.json` | 皮肤宇宙名称、描述、图片和皮肤系列关系 |
| 召唤师图标 | `summoner-icons.json` | 图标标题、图片路径、发行年份、描述和地区品质；外观目录和 PBE 新增页面读取 |
| 表情 | `summoner-emotes.json` | 表情名称、图片路径和关联英雄标签；外观目录和 PBE 新增页面读取 |
| 皮肤边框 | `skinborders.json` | 边框名称与图片路径（主键 `itemId`）；PBE 新增页面读取 |
| 守卫皮肤 | `ward-skins.json` | 守卫名称、图片路径、描述和地区品质（主键 `id`）；外观目录和 PBE 新增页面读取 |
| 守卫皮肤套装 | `ward-skin-sets.json` | 套装 `id`、`hidden`、本地化 `displayName`、`description` 及成员守卫 ID 数组 `wards` |
| 终结特效 | `nexusfinishers.json` | 终结特效本地化名称、图标和 `videoPath`（主键 `itemId`）。目录按当前数据通道加载悬停视频，PBE 新增页读取图标 |

召唤师图标和守卫皮肤的品质来自 `rarities[]`，按客户端收藏规则优先使用当前地区（中文 `TENCENT`，英文 `riot`），缺少地区记录时回退到 `riot`。等级为 0 时不显示品质。终结特效沿用客户端收藏中的 `kExalted`，表情目录暂不显示品质。 [客户端收藏模块](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.js) · [客户端品质映射](https://raw.communitydragon.org/latest/plugins/rcp-fe-common-libs/global/default/rcp-fe-common-libs.js)

守卫皮肤收藏的「套装」来自独立的 `ward-skin-sets.json`。客户端将 `wards[]` 与守卫的 `id` 匹配，并用 `displayName` 分组。没有套装的条目使用客户端的默认无套装分组。正式服和 PBE 的 `default`、`zh_cn` 都可读取。已核对截图中的奥德赛（62）、胜利诸神（32）与荣誉（13）。 [中文正式服套装](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/ward-skin-sets.json) · [客户端关联逻辑](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.js)

单个英雄详情：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/{championId}.json
```

### 2.2 英雄、皮肤、皮肤系列与皮肤宇宙的关联

- 英雄列表使用 `champion-summary.json`。
- 英雄详情使用真实的 `championId`，并从该英雄记录的 `skins` 集合及其中有效的 `questSkinInfo.tiers` 阶段生成统一皮肤入口；顶层项按皮肤 ID 去重，阶段项按所属皮肤 ID 与阶段 ID 去重，tier ID 与顶层记录冲突时 tier 优先。
- 皮肤切换列表沿用项目英雄详情列表规则，使用 `projectChampionSkinListItems` 的投影顺序：按所属皮肤 ID 升序；同一皮肤先列皮肤本体，再按阶段序号和阶段 ID 排列有效阶段；默认皮肤按此顺序参与切换，不另行插入或重排。阶段详情 URL 的 `id` 是阶段 ID，但解析后的 `id` 仍是所属皮肤 ID，`stageId` 才标识当前阶段；定位当前列表项必须匹配 `stageId ?? id`，首尾循环也沿用这套列表顺序。
- 皮肤详情必须携带英雄定位提示，读取对应 `champions/{championId}.json` 后按皮肤 ID 复核身份。
- 皮肤系列和皮肤宇宙通过各自列表中的数字 ID 关联；系列与宇宙的皮肤列表也按阶段独立投影，同一英雄的阶段 ID 与顶层皮肤 ID 重合时只保留阶段卡片。关联失败不得清除已经显示的核心实体资料。
- 运行时不提供全量皮肤目录；只有皮肤系列详情、皮肤宇宙详情和 PBE 新增页可以显式读取完整 `skins.json`，按稳定数字 ID 投影关联皮肤集合。英雄目录、英雄详情、普通皮肤详情、首页、臻彩详情和博客不得因此加载该资源。
- 当前 `skins.json` 不提供 `championId`。参考 Skin Explorer 的数据处理方式，完整皮肤集合使用 CommunityDragon 的皮肤 ID 所属英雄约定：`Math.floor(skin.id / 1000)`；这只用于该官方集合的英雄归属，不把名称、资源路径或数组位置当作身份。
- 完整皮肤记录的本地化 `name` 可能为空字符串或缺失；有效 ID 与归属仍保留，名称规范化为缺失状态。界面只显示当前视图的本地化缺失标签，不跨视图补名，也不因单条缺名而让整份 PBE 比较失败。
- 若皮肤 ID 无法按该约定得到正数英雄 ID，资料校验失败；显式 `championId` 或英雄分组 ID 仍优先使用。
- `previewVideoUrl` 可能是源数据提供的外部 HTTPS 视频地址；它保持原地址，不经过 CommunityDragon 资源路径转换。

推荐的运行时 URL：

```text
/champions/
/champions/detail/?id={championId}
/skins/detail/?id={skinId}&champion={championId}
/skins/detail/?id={stageId}&champion={championId}
/skinlines/detail/?id={skinlineId}
/universes/detail/?id={universeId}
```

阶段作为独立皮肤，详情链接以阶段 ID 作为 `id`，并携带英雄 ID。旧版 `stage` 参数不再接受。只有缺少有效正整数 ID 的阶段不会形成独立资料项。阶段名称缺失时保留资料项并显示缺失状态，不生成来源不存在的阶段名称。

英文与 `/zh-cn/` 页面均保持相同的列表/详情职责：`/champions/`、`/skinlines/` 与 `/universes/` 只负责列表发现，列表卡片使用对应的 `/detail/` 普通链接；皮肤不提供目录页，只从英雄详情、系列详情或宇宙详情进入 `/skins/detail/`。列表页不会因存在 `id` 查询参数而渲染详情，详情壳统一使用 `noindex`。系列和宇宙详情按需读取完整 `skins.json`，只通过稳定数字 ID 形成关联集合；其他页面不加载该资源。

### 2.3 英雄与皮肤字段、分类和图片

英雄分类直接使用 `champion-summary.json` 中的 `roles`，不根据名称、ID 或图片路径推导：

- 可选分类键固定为 `assassin`、`fighter`、`mage`、`marksman`、`support`、`tank`。
- 筛选使用精确成员匹配 `roles.includes(role)`。
- 英雄可以同时属于多个分类；未知角色保留供校验，但不自动新增界面分类。
- 页面展示本地化后的分类名称，不向用户暴露字段名和内部路径。

常见字段：

| JSON | 字段 | 用途 |
| --- | --- | --- |
| 英雄摘要或英雄详情 | `squarePortraitPath` | 英雄方形头像 |
| 英雄详情或皮肤目录 | `splashPath`、`uncenteredSplashPath`、`tilePath`、`loadScreenPath` | 聚焦原画、非聚焦原画、缩略图和载入图 |
| 皮肤记录或阶段记录 | `splashVideoPath`、`previewVideoUrl`、`collectionSplashVideoPath`、`collectionCardHoverVideoPath`、`loadScreenVintagePath` | 详情轮播展示动态原画、预览和合集媒体；皮肤列表卡片的边框选项和详情的“带边框载入图”媒体项使用 `loadScreenVintagePath`，详情的透明边框图独立展示 |
| 英雄详情或皮肤目录 | `chromaPath` | 炫彩资源 |
| 皮肤记录 | `skinLines`、`isBase`、`questSkinInfo.tiers` | 系列关系、英雄默认外观标记和阶段信息 |
| 皮肤记录 | `skinAugments.borders` | 透明边框图层：跨层叠加、同层互斥；皮肤详情独立展示边框图，默认每层选择最高 `priority`，列表卡片在无预合成图时将所选边框叠到载入图 |
| 皮肤记录或阶段记录 | `rarity`、`regionRarityId`、`rarityGemPath` | 英文全球稀有度、中文区域稀有度及对应图标 |
| 中文皮肤记录 | `emblems[].name`、`emblemPath.large`、`emblemPath.small`、`positions` | 皮肤徽章及其来源名称、大小图路径和位置元数据 |
| 炫彩记录 | `colors` | 来源提供的炫彩颜色，缺失时保持缺失 |
| 系列 | `imagePath` 等实际存在的媒体字段 | 系列图片 |
| 皮肤宇宙 | `imagePath` | 皮肤宇宙图片 |

常用目录：

| 资源类型 | RAW 相对目录 |
| --- | --- |
| 英雄详情 | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/` |
| 英雄炫彩图片 | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champion-chroma-images/` |
| 英雄与皮肤图片 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/characters/` |
| 成就头衔 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/playertitles/` |
| 终结特效 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/loadouts/nexusfinishers/` |
| 稀有度图标 | `plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/` |
| 皮肤徽章 | `plugins/rcp-be-lol-game-data/global/zh_cn/v1/emblem-images/` |

#### 皮肤徽章映射

CommunityDragon 的通用 JSON 资源路径说明将 `/lol-game-data/assets/<path>` 映射到 `global/default/<path>`，但中文 `skins.json` 的 `emblems` 图有单独的实存目录。以当前 [`zh_cn/skins.json`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/skins.json) 为准：每条 `emblems[]` 含来源名称 `name`，以及 `emblemPath.large`、`emblemPath.small`；两种路径的文件名对应 [`zh_cn/v1/emblem-images/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/emblem-images/) 下的同名 PNG，例如 `emblemPath.large: "/lol-game-data/assets/v1/emblem-images/28.png"` 对应 `28.png`。

这些皮肤徽章与 `regionRarityId` / `rarityGemPath` 是分开的字段，不能根据稀有度 ID 拼出徽章文件名。例如皮肤 ID `1001` 的 `regionRarityId` 为 `7`，但来源徽章名为 `Wisdom of Pioneer`、路径为 `28.png`；皮肤 ID `1005` 的 `regionRarityId` 为 `4`，徽章名为 `Epic`、路径为 `29.png`。页面应读取当前视图皮肤记录实际提供的 `emblems[].emblemPath`；无徽章数据时不猜测或补图。`latest` 为滚动目录，以上路径关系应在资源改动时重新核验。

稀有度规则：

- `default` 视图使用记录中的 `rarity`，已知类型按参考项目映射到 `epic.png`、`legendary.png`、`mythic.png`、`ultimate.png`、`transcendent.png` 或 `exalted.png`；未知类型才保留源记录提供的图标路径。
- `zh_cn` 视图的国服展示等级以 `regionRarityId` 为准，不能与 `rarity` 的标签或直营服图标混用；按参考项目使用 `cn-gem-{regionRarityId}.png`，例如 `5` 为 `cn-gem-5.png`、`7` 为 `cn-gem-7.png`。原始 `rarityGemPath` 的 `*_large.png` 不直接作为稀有度图标；稀有度图标仍由 `regionRarityId` 映射为 `cn-gem`。
- 官方数据中的 `kNoRarity`、直营服 `kRare` 或 `regionRarityId: 0` 在本页面都按没有可展示的稀有度处理：不显示稀有度字段、文字或宝石。`kRare` 虽是原始枚举值，但不在页面上另造一个 `Rare` 等级。

#### 英雄联盟稀有度与相近名称资源目录

以下目录属于英雄联盟皮肤稀有度、藏品边框或英雄联盟客户端；不要与 TFT 的 `game/assets/ux/tft/outofgame/raritygems/` 混用：

| 资源归属 | RAW 相对目录（点击访问） | 文件与用途 |
| --- | --- | --- |
| 英雄联盟皮肤稀有度图标 | [`plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/) | `epic.png`、`legendary.png` 等皮肤稀有度图标 |
| 英雄联盟藏品边框 | [`plugins/rcp-fe-lol-collections/global/default/images/item-element/borders/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/images/item-element/borders/) | `border-legendary-current.svg`、`border-legendary-gradient.svg`、`border-legendary-selected.svg` 等 |
| 通用客户端稀有度边框 | [`plugins/rcp-fe-lol-static-assets/global/default/rarity/gem-borders/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/rarity/gem-borders/) | `klegendary.svg`、`kmythic.svg` 等；不是 TFT 专属资源 |
| 通用客户端稀有度边框副本 | [`plugins/rcp-fe-lol-static-assets/global/default/images/rarity/gem-borders/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/rarity/gem-borders/) | 上述边框的同内容副本 |
| 英雄联盟 Hall of Legends（名称检索误命中） | [`plugins/rcp-be-lol-game-data/global/default/assets/halloflegends/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/halloflegends/) | `hol_bxp.svg`；不是稀有度图标 |

#### 客户端图标资源

##### 货币图标

PBE 客户端货币资源位于 [`plugins/rcp-fe-lol-static-assets/global/default/currency/`](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/currency/)。目录下的 [`icons/`](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/currency/icons/) 收录货币图标，[`tokens/`](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/currency/tokens/) 收录代币素材。

##### 英雄联盟分路 SVG

以下五枚 SVG 来自 Riot 客户端的静态资源，由 CommunityDragon 提供。这里的分路指对局位置。战士、坦克、法师等六种英雄职业使用收藏模块的另一套图集。

| 分路 | PBE 资源路径 |
| --- | --- |
| 上路 | [position-top.svg](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg/position-top.svg) |
| 打野 | [position-jungle.svg](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg/position-jungle.svg) |
| 中路 | [position-middle.svg](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg/position-middle.svg) |
| 下路 | [position-bottom.svg](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg/position-bottom.svg) |
| 辅助 | [position-utility.svg](https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg/position-utility.svg) |

##### 战利品分类栏

战利品分类栏按类别从 [`rcp-fe-lol-loot/global/default/assets/category_icons/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/) 加载 PNG。客户端的 `getCategoryIconPath` 将类别名转为小写文件名。 [战利品模块源码](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/rcp-fe-lol-loot.js)

| 分类 | 正式服资源 |
| --- | --- |
| 全部 | [`all.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/all.png) |
| 宝箱 | [`chest.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/chest.png) |
| 英雄 | [`champion.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/champion.png) |
| 皮肤 | [`skin.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/skin.png) |
| 小小英雄 | [`companion.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/companion.png) |
| 永恒星碑 | [`eternals.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/eternals.png) |
| 表情 | [`emote.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/emote.png) |
| 守卫皮肤 | [`wardskin.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/wardskin.png) |
| 召唤师图标 | [`summonericon.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/summonericon.png) |
| 传送门宝箱 | [`portal_chest.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/portal_chest.png) |

**终结特效分类标识**。Riot 将终结特效列为神话商城精选物品。客户端收藏导航的 `finishers` 项使用本地化文本 `collections_sub_nav_collectibles_finishers`，并使用通用的待查看提示。该导航模板没有引用终结特效分类图形，战利品的 `category_icons/` 也没有对应文件。 [Riot 神话商城说明](https://support.riotgames.com/zh-cn/league-of-legends/rewards/mythic-shop-and-mythic-essence-faq) · [客户端收藏模块](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.js) · [战利品分类目录](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/category_icons/)

客户端收藏模块为默认终结特效条目（`itemId=0`）指定 `BaseFinisher.png`。其用途是默认物品图。其他终结特效的物品图由 `nexusfinishers.json` 的 `iconPath` 提供。 [默认终结特效图](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/images/finisher/basefinisher.png) · [物品数据](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/nexusfinishers.json)

**终结特效发行年份**。客户端收藏页从商城目录的 `releaseDate` 提取年份，公开的 `nexusfinishers.json` 无该字段。本站按客户端收藏截图核对物品图与 ID，记录客户端显示的分组：2024 年为 1，2025 年为 2、3、4、5，2026 年为 6、7。ID 5 在客户端显示为 2025 年，CD 正式服归档从 16.1 才含该物品。归档首次出现时间与收藏分组使用的字段不同。新条目年份未核实时放入「其它」，PBE 独有条目沿用「PBE 新增」专组。 [客户端收藏模块](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.js) · [16.1 归档](https://raw.communitydragon.org/16.1/plugins/rcp-be-lol-game-data/global/default/v1/nexusfinishers.json)

战利品模块通过 `NEXUS_FINISHER` 判断物品类型，神话商城配方预览按 `itemId` 查找同一份终结特效资料里的 `videoPath`。商城模块将该类型映射到本地化名称。上述映射未提供专属分类图形。 [战利品模块](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/rcp-fe-lol-loot.js) · [商城模块](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-store/global/default/rcp-fe-lol-store.js)

##### 皮肤预览栏

图标位于 [`rcp-fe-lol-static-assets/global/default/images/skin-viewer/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/)。在客户端样式中，皮肤系列对应 `.skinline .icon`，任务皮肤形态对应 `.quest-forms .icon`，显示或隐藏界面对应 `.toggle-ui .icon`。 [收藏模块样式](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/rcp-fe-lol-collections.css)

| 用途 | 正式服资源 |
| --- | --- |
| 炫彩（彩色圆环） | [`icon-chroma-default.png`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/icon-chroma-default.png) |
| 皮肤系列（双面具） | [`icon-themes-default.svg`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/icon-themes-default.svg) |
| 普通任务皮肤形态（`.quest-forms .icon`；本站复用三面具作为皮肤宇宙图标） | [`icon-three-masks-default.svg`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/icon-three-masks-default.svg) |
| 分档皮肤形态（单面具带进阶标记，`.quest-forms .icon.tiered`，例如联盟不朽 阿狸） | [`tiered/evolution-icon.svg`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/tiered/evolution-icon.svg) |
| 显示或隐藏界面（眼睛） | [`magnifier.svg`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/skin-viewer/magnifier.svg) |

### 2.4 运行时读取规则

- 英文页面使用 `default`，中文页面使用 `zh_cn`；运行时默认通道为 `pbe`。
- PBE 新增按同一本地化视图比较 `pbe` 与 `latest` 的实体数字 ID，只包含 `pbe` 独有的英雄、皮肤、皮肤系列和皮肤宇宙；已有实体的字段或媒体变化不计入新增。
- 英雄目录由静态页面壳和浏览器控制器组成；浏览器完成搜索、排序、分类、分页和详情读取。
- 核心实体优先加载；皮肤系列和皮肤宇宙属于独立的关联请求，最多并发读取必要数据。
- 网络、HTTP、404、取消和响应格式错误分别显示明确状态，并支持重试。
- 英雄、皮肤、皮肤系列和皮肤宇宙详情属于运行时资料，客户端确认有效实体后设置 `noindex`；静态臻彩页面不依赖这些资料即可保持正文和 SEO 可用。
- 多阶段皮肤中具有有效数字 ID 的阶段生成独立可查看的皮肤资料项，但仍是所属皮肤的子记录，不成为新的 CommunityDragon 实体；阶段自己的名称和媒体优先，缺失的描述、稀有度、皮肤系列和皮肤宇宙只从同一响应所属皮肤继承。
- 运行时皮肤投影按当前本地化视图选择稀有度：英文使用 `rarity`，中文使用 `regionRarityId`；阶段没有自己的描述、稀有度、系列或宇宙关系时才继承所属皮肤，同一响应中缺失的媒体和炫彩不从其他阶段补齐。
- 皮肤详情展示聚焦原画、非聚焦原画、缩略图、原始载入图、动态原画和来源实际提供的历史版本原画；来源提供的 `loadScreenVintagePath` 与透明边框图各自作为独立媒体项进入轮播和相册。透明边框图仅由 `skinAugments.borders` 的层合成，不叠加到原始或带边框载入图；同层只选一个变体、跨层叠加，切换只更新边框图。动态原画静音循环并自动播放，不显示原生控制条；单个媒体失败只移除该媒体，不清除已加载的文字资料。
- 皮肤详情中的炫彩数量只统计真正的炫彩；当前皮肤本身可以作为皮肤本体项与炫彩并列显示，但不属于炫彩，也不携带炫彩颜色。
- PBE 新增页面在同一本地化视图内比较 `pbe` 与 `latest` 的英雄摘要、`skins.json`、皮肤系列、皮肤宇宙、召唤师图标、表情、皮肤边框、守卫皮肤和终结特效；页面先展示各分类骨架占位，分类数据到达后异步填充。差集键只由实体类型与顶层数字 ID 组成（炫彩按两通道 `skins.json` 内的炫彩 ID 比较）。已有实体的字段、媒体或阶段变化不计入新增，新皮肤的有效阶段只在新增皮肤资料项内展开。
- PBE 比较按分类异步进行：单个分类失败时只在该分类内提示重试，不影响其他分类。分类为空时显示该分类的空状态，全部分类为空时显示无新增状态；存在失败分类时总数仅统计已加载分类并明确提示加载不完整。

静态臻彩页面只把 CommunityDragon 作为炫彩所属皮肤补充：

- 标题、正文、主图、SEO 和主要操作来自仓库目录。
- 浏览器根据当前英雄和 `sourceSkinId` 读取炫彩所属皮肤，并复核英雄 ID 与皮肤 ID；`isBase` 仅表示英雄默认外观，不是炫彩所属关系的判据。
- 补充请求失败只影响补充区，不清空静态正文；媒体失败只移除对应媒体。

英雄覆盖率文章使用提交到仓库的 `data/champion-coverage.snapshot.json`。普通构建不联网更新快照；维护快照时分别读取 `default` 和 `zh_cn` 的 `pbe` 摘要，并校验来源 URL、HTTP 状态、`ETag` 或 `Last-Modified`、补丁版本和覆盖计数。

### 2.5 英雄联盟参考资料

- [直营服 Skin Explorer](https://github.com/BennyExtreme00/lol-skin-explorer)：`default` 数据视图的字段展示、英雄角色和实体关联参考。
- [国服 Skin Explorer](https://github.com/BuguoguoLoLCreator/lol-skin-explorer)：`zh_cn` 数据视图、国服名称和稀有度参考。
- [Riot Skins 101](https://www.leagueoflegends.com/en-ph/news/dev/skins-101/)：Legacy 和 Limited 等概念参考。

这些项目不是本项目的数据源；引用其字段解析或展示逻辑前，仍需按当前 CommunityDragon 响应重新验证。

## 3. 云顶之弈资源

### 3.1 常用 JSON

云顶相关客户端数据通常位于：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/
```

常见资源：

| 资源 | 文件 | 用途 |
| --- | --- | --- |
| 进攻特效 | `tftdamageskins.json` | 云顶进攻特效目录 |
| 棋盘 | `tftmapskins.json` | 云顶棋盘目录 |
| 传送门 | `tftzoomskins.json` | 云顶传送门目录 |
| 小小英雄 | `companions.json` | 小小英雄资料集；`companionType` 标识具体类别 |
| 外观标签元数据 | `tftcontentdata.json` | 以内容 ID 查询外观自身的稀有度和功能标签 |
| 标签显示定义 | `tftdisplaytags.json` | 提供功能、稀有度和内容类型标签的本地化名称与图标 |
| 物品类型 | `lolinventorytype.json` | 注册表的 `gipJsonPath` 指向物品数据表，`gipItemId` 指定条目 ID 字段 |
| 表情 | `summoner-emotes.json` | 与英雄联盟共用的 LCU 表情资料，含 `inventoryIcon` 和 `taggedChampionsIds` |
| 货币 | `lolcurrency.json` | LCU 货币总表，包含 TFT 以外的货币 |

棋盘目录按页面语言读取 `tftmapskins.json` 的 `default` 或 `zh_cn` 视图，并按 `pbe`／`latest` 通道拼接同通道的 `loadoutsIcon` 图片。条目按 `itemId` 保留，`groupId` 标识分组，显示等级使用 `TFTRarity`；不要改用来源 `rarity` 或 `IsWIP` 推断等级和 PBE 新增。

`companions.json` 中的伙伴形象在本项目统称为“小小英雄”，不按 `companionType` 排除；该字段用于区分具体类别。当前 `latest` 与 `pbe` 的 `zh_cn` 数据中有以下三种值。国服类别名参考[腾讯国服公告](https://lol.qq.com/news/detail.shtml?docid=8273734045633503022)，Riot 英文类别名参考[外观等级调整公告](https://teamfighttactics.leagueoflegends.com/en-sg/news/game-updates/simplifying-cosmetics-tiering/)：

| `companionType` | 国服类别名（`zh_cn`） | Riot 英文类别名 | 国服数据示例 |
| --- | --- | --- | --- |
| `kLittleLegend` | 小小英雄 | Little Legends | `itemId: 13010`「节奏大师 奥希雅」 |
| `kChibi` | 英雄级小小英雄 | Chibis | `itemId: 49001`「小小阿狸」 |
| `kStyle2` | 不朽弈士形象 | Unbound | `itemId: 133001`「不朽阿狸」 |

Riot 英文公告用 **Tacticians** 统称这组玩家角色外观，Little Legends、Chibis、Unbound 是其类别。类别与稀有度、升级等级是不同维度。例如 `itemId: 49001` 的 `companionType` 是 `kChibi`，`TFTRarity` 是 `kLegendary`，`level` 是 `1`。

当前站内小小英雄列表页展示以上三种 `companionType`，并在卡片中标明具体类别。

CommunityDragon 也提供 CDragon 便利数据：

```text
https://raw.communitydragon.org/{version}/cdragon/
```

使用 CDragon 数据前，必须确认目标版本中实际存在对应文件和字段；不能把便利数据路径当成所有云顶资源的固定契约。

例如 [`cdragon/tft/en_us.json`](https://raw.communitydragon.org/latest/cdragon/tft/en_us.json) 和 [`zh_cn.json`](https://raw.communitydragon.org/latest/cdragon/tft/zh_cn.json) 提供 `items`、`setData`、`sets`，与 LCU 外观数据表各有用途。[CommunityDragon Explore TFT](https://explore.communitydragon.org/tft/latest/) 是另一个资源入口。附件记录的 TFT 18.7.0 pin `tft-live-windows-rls-18.7.0-5964148` 不能直接用作 RAW LCU 版本路径，实测该路径下的 `tftcontentdata.json` 返回 404。

### 3.2 云顶资源目录与图片路径

常用 RAW 相对目录：

| 资源 | RAW 相对目录 |
| --- | --- |
| 进攻特效 | [`plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/) |
| 棋盘 | [`plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/) |
| 传送门 | [`plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/) |
| 移动端礼包 | [`plugins/rcp-be-lol-game-data/global/default/assets/ux/tftmobile/store/bundleoffers/`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tftmobile/store/bundleoffers/) |

图片路径仍按[通用路径转换规则](#14-路径转换规则)处理：优先读取 JSON 返回的字段，不根据资源名称或编号拼接路径。

#### 云顶图标资源获取

四个 TFT 目录的标题与导航使用 [CommunityDragon 客户端分类图标](https://raw.communitydragon.org/json/latest/game/assets/ux/tft/outofgame/contenttypeicons/)。小小英雄、棋盘、进攻特效和传送门分别对应 `tft_icon_tactician.png`、`tft_icon_arena.png`、`tft_icon_boom.png`、`tft_icon_portal.png`。另可查到 `tft_emote_icon.png`，语义为 TFT 表情。

云顶图标按用途从 JSON 字段或客户端静态目录获取：单个小小英雄读取 `companions.json` 的 `loadoutsIcon`；稀有度图标见[稀有度等级](#33-稀有度等级)；统称和界面分类图标使用下方列出的已核验 RAW 相对路径。JSON 提供的路径按[通用路径转换规则](#14-路径转换规则)解析，静态目录则拼接目标版本与相对路径。JSON 和图标必须使用同一版本，不根据 ID、名称或相似文件名猜路径。

##### 小小英雄统称图标

当前 `latest` 中，与小小英雄/伙伴统称相关的通用图标位于以下目录。它们不替代 `companions.json` 每条记录的 `loadoutsIcon`：列表卡片仍使用数据字段提供的单个伙伴图片。

| 用途 | RAW 相对目录（点击访问） | 文件名 | 说明 |
| --- | --- | --- | --- |
| 小小英雄统称图标 | [`plugins/rcp-fe-lol-parties/global/default/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/) | `little_legends_icon.svg` | 名称直接对应 Little Legends；页面使用裁去留白的本地副本 `public/img/icons/tft-little-legends.svg` |
| 小小英雄蛋图标 | [`plugins/rcp-fe-lol-parties/global/default/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/) | `companion_icon.svg` | 小小英雄蛋图标 |
| TFT Tactician 内容类型图标 | [`game/assets/ux/tft/outofgame/contenttypeicons/`](https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/contenttypeicons/) | `tft_icon_tactician.png` | PNG 版本 |
| Tactician 变形专用图标 | [`game/assets/ux/tft/outofgame/contenttypeicons/`](https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/contenttypeicons/) | `tft_icon_tactician_tranformation.png` | PNG 专用变体；文件名按 CD 原样保留 `tranformation` 拼写 |

##### 云顶物品领域图标

进攻特效、棋盘和传送门的类别图形与以下 CommunityDragon PNG 一一对应；已按小小英雄标题图标的金色与裁去留白方式，转制为站内 SVG。三个来源在 `latest` 和 PBE 均存在，但已核对的相关目录没有同图的原生 SVG，因此站内 SVG 是从 32×32 PNG 描摹而来，不应标作 CommunityDragon 原生 SVG。

| 类别 | 来源目录（`latest`，点击访问） | 来源文件 | 站内 SVG |
| --- | --- | --- | --- |
| 传送门 | [`game/assets/ux/tft/outofgame/contenttypeicons/`](https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/contenttypeicons/) | `tft_icon_portal.png` | `public/img/icons/tft-portals.svg` |
| 进攻特效 | 同上 | `tft_icon_boom.png` | `public/img/icons/tft-booms.svg` |
| 棋盘 | 同上 | `tft_icon_arena.png` | `public/img/icons/tft-arenas.svg` |

小小英雄仍使用上表的原生 `little_legends_icon.svg`；棋盘页面标题使用站内 `tft-arenas.svg`。`companion_icon.svg` 表示小小英雄蛋，`tft_icon_tactician.png` 表示 Tactician 内容类型，不代替全部云顶物品类别图标。各条目的 `loadoutsIcon` 是物品缩略图，也不代替类别图标。

名称检索还会命中 TFT 伙伴数量奖励资源；它不是稀有度图标：

| RAW 相对目录（点击访问） | 命中资源与用途 |
| --- | --- | --- |
| [`plugins/rcp-fe-lol-static-assets/global/default/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/) | `loyaltytftcompanioncount_rewards.svg`，TFT 小小英雄数量奖励图标 |
| [`plugins/rcp-fe-lol-static-assets/global/default/images/`](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/) | 上述奖励图标的同内容副本 |

英雄联盟和通用客户端的相近目录见[英雄联盟稀有度与相近名称资源目录](#英雄联盟稀有度与相近名称资源目录)。上表仅核对了 `latest`，未确认 PBE 是否同步；TFT 专属 `raritygems/` 已确认 `latest` 与 PBE 均有，使用其他目录时仍需按目标版本确认文件存在。

### 3.3 稀有度等级

TFT 的 `tftdisplaytags.json` 中，`TFTRarityDisplayTag` 项用 `rarityType` 标识稀有度等级，用 `name` 提供当前本地化视图名称，并提供 `icon`、`iconHover`、`iconTop`、`iconTopHover`、`iconBottom`、`iconBottomHover` 等图片路径。小小英雄 `companions.json` 的 `TFTRarity` 与 `rarityType` 对应；不要把 `level` 当作稀有度。

`tftdisplaytags.json` 的 `name` 会随本地化视图变化。当前 `zh_cn` 名称与 `default` 视图英文名称、主图字段如下；等级调整另见[腾讯国服公告](https://lol.qq.com/news/detail.shtml?docid=8273734045633503022)和[Riot 英文公告](https://teamfighttactics.leagueoflegends.com/en-sg/news/game-updates/simplifying-cosmetics-tiering/)：

| `rarityType` | 国服名称（`zh_cn`） | 英文名称（`default` 视图） | `icon` 文件名 |
| --- | --- | --- | --- |
| `kStandard` | 经典 | Standard | `TFT_StandardGem_Retier.png` |
| `kLegendary` | 传说 | Legendary | `TFT_LegendaryGem_Retier.png` |
| `kMythic` | 神话 | Mythic | `TFT_MythicGem_Retier.png` |
| `kPrestige` | 至臻 | Prestige | `TFT_PrestigeGem_Retier.png` |

其他图像变体也应直接读取对应字段；文件名中的 `Retier`、`Top`、`Bot` 与 `_Hover` 变体由数据提供，不从稀有度值自行拼接。TFT 专属 RAW 目录：[`game/assets/ux/tft/outofgame/raritygems/`（latest）](https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/) · [`game/assets/ux/tft/outofgame/raritygems/`（PBE）](https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/)。这组是分类宝石图；小小英雄自身图片仍读取 `companions.json` 的 `loadoutsIcon`，不能用稀有度或等级拼出图片路径。

JSON 地址按数据通道和本地化视图拼接：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/tftdisplaytags.json
```

JSON 中的 TFT 图标路径以 `/lol-game-data/assets/ASSETS/UX/TFT/` 开头；按上述 TFT 专用规则映射到 `game/assets/ux/tft/` 并转为小写。比如 `icon` 的 `TFT_StandardGem_Retier.png` 对应：

```text
https://raw.communitydragon.org/{version}/game/assets/ux/tft/outofgame/raritygems/tft_standardgem_retier.png
```

名称读取所选视图（如 `zh_cn`），图标媒体按 JSON 路径转换；版本必须与 JSON 一致。实际使用时优先转换 JSON 返回的完整字段路径，不硬编码类别和文件名。

### 3.4 云顶资源的版本与语言规则

- 运行时只使用 `pbe` 或显式指定的 `latest`，JSON 与媒体必须使用同一版本。
- 当前云顶资源目录主要位于 `global/default`；如果目标 JSON 明确返回其他区域路径，保留 JSON 中的真实路径。
- 不因页面语言是中文就强行把云顶资源改到 `zh_cn`；目标目录不存在时保留缺失状态。
- 小小英雄页按页面语言读取 `companions.json` 的 `default` 或 `zh_cn` 视图；名称与筛选字段不跨视图回退，图片路径按同一数据通道转换。
- 云顶资源可能随版本新增、删除或更换目录；优先以目标版本 JSON 和目录列表为准。
- 资源列表和详情应使用数字 ID 或 JSON 提供的稳定身份字段，不根据名称或图片文件名推导身份。

### 3.5 云顶运行时读取规则

- 云顶资源属于运行时资料时，遵循通用的加载、取消、缓存、失败和重试规则。
- 某一类资源失败时，只显示该资源区的失败状态，不影响其他已加载资源。
- 资源只用于页面明确需要的列表或详情，不预取完整目录，也不把滚动数据写入持久化浏览器存储。
- 小小英雄资料按 `itemId` 保持独立；`companionType` 区分类别，`speciesId`、`TFTRarity` 与 `level` 保持各自含义，不相互推断，也不据此推断持有、在售状态或发布日期。
- 构建流程不依赖云顶 CommunityDragon 在线可用性；需要固定内容时，应先生成并提交经过校验的仓库快照。

### 3.6 云顶示例

```text
JSON：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tftmapskins.json

资源目录：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/
```

以上仅为路径模板示例；实际文件、字段和媒体可用性必须以目标版本响应为准。

### 3.7 外观标签与内容 ID

LCU 外观表的 `contentId` 对应 [`tftcontentdata.json`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftcontentdata.json) 记录中的 `id`。后者是数组，每个元素以 `CompanionData`、`TFTMapSkin` 等物品类型为外层键，内含 `id` 和 `contentData`。其中 `contentData.rarityTag` 对应 `rarityType`，`contentData.featureTags[].featureType` 对应 `featureType`。当前目录直接使用物品表的 `TFTRarity`。小小英雄、棋盘、进攻特效和传送门按各自物品类型与 `contentId` 匹配功能标签，四类目录均用于筛选及详情浮层。

TFT 进攻特效和传送门分别读取 [`tftdamageskins.json`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftdamageskins.json) 与 [`tftzoomskins.json`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftzoomskins.json)，两类表都提供 `contentId`、`itemId`、`name`、`description`、`TFTRarity` 和 `loadoutsIcon`。传送门另有 `largeLoadoutsIcon`，适合作为看图预览；字段缺失时回退到 `loadoutsIcon`。跨 `pbe` 与 `latest` 的新增对比只在同一物品表内按 `itemId` 进行，不能把两类物品的编号视为全局唯一。

详情和功能标签筛选按 `contentId` 找到对应内容记录，在进攻特效目录读取 `TFTDamageSkin`，在传送门目录读取 `TFTZoomSkin`；再把 `contentData.featureTags[].featureType` 与当前语言 [`tftdisplaytags.json`](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftdisplaytags.json) 的 `TFTFeatureDisplayTag.featureType` 连接，显示该标签的 `name` 和 `icon`。标签元数据可选加载，失败时仍可使用基础目录资料。

[`tftdisplaytags.json` 英文](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftdisplaytags.json)和[中文](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/tftdisplaytags.json)视图通过以下字段标识标签：

| 外层键 | 匹配字段 | 已核对的标签 |
| --- | --- | --- |
| `TFTFeatureDisplayTag` | `featureType` | `kAfkPlatform` 底座、`kEvolvingArena` 可进化型棋盘、`kEvolvingBoom` 可进化型进攻特效、`kFinisherAnimation` 淘汰动画、`kIntroCutScene` 介绍过场动画、`kTransformation` 转变 |
| `TFTRarityDisplayTag` | `rarityType` | 经典、传说、神话、至臻，见 3.3 |
| `TFTContentDisplayTag` | `contentType` | `kArena` 棋盘、`kBoom` 进攻特效、`kCurrency` 货币、`kEmote` 表情、`kTactician` 小小英雄、`kZoom` 传送门 |

2026-11-23 核对时，`latest` 有 5,064 条内容标签记录，包含小小英雄 2,040、进攻特效 356、棋盘 142、传送门 67、表情 2,452、TFT 货币 7 条。[`lolcurrency.json` 总表](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/lolcurrency.json)有 20 条。功能标签计数为小小英雄淘汰动画 110、底座 34、转变 1，棋盘介绍过场动画 37、可进化型棋盘 36，进攻特效可进化 2。同一条内容可有多个标签。这些数字随 `latest` 更新。

### 3.8 小小英雄与其他外观的关联

**装备可用性。** 客户端区分开发中（WIP）与禁止装备（Disabled）。现有公开目录的 `IsWIP` 字段和 `tftcontentdata.json` 的功能标签无法判定禁止装备状态。例如「第六天魔龙王 爆爆龙」的三个星级（`43028`、`43029`、`43030`）在客户端样例中显示为禁止装备，公开物品表中均为 `IsWIP=false`。如需提供「只看不可用」筛选，需要可与目录物品 ID 对照的禁用状态来源。[Riot 外观可用性说明](https://support.riotgames.com/zh-my/tft/store/tft-unreal-cosmetics-faq)

在已核对的 LCU 表中，`contentId` 用来查单个物品的标签。跨类型比较 `itemId` 时须带物品类型，例如棋盘和小小英雄表有 66 个重复编号。名称、主题词和文件名适合找候选，专属或赠送关系需有对应活动或商品资料支持。

| 外观 | 可用线索 | 水晶玫瑰 小小格温 `68004` 示例 |
| --- | --- | --- |
| 表情 | `inventoryIcon` 中的物种、英雄与主题词。文件名中的数字位置会变动。可用 `taggedChampionsIds` 辅助查英雄，该字段使用英雄联盟英雄 ID，与小小英雄的 `speciesId` 各自独立 | `10052` 致胜眨眼、`10053` 没时间解释了快上玫瑰小车、`10139` 双手比心均带格温与水晶玫瑰主题。已从[腾讯活动页](https://lol.qq.com/act/a20261020crystalrosegwen/index.html)核对 `10052` 的专属赠送关系 |
| 进攻特效 | 中文名可按小小英雄完整名称做最长前缀匹配，图标主题可辅助核对。已核对样本的 `groupId` 为 `0`、`groupName` 为空字符串 | `194003` 水晶玫瑰 小小格温 快刀剪乱，名称和图标主题均吻合 |
| 传送门 | 名称和图标可能含英雄或主题。文件名前缀 `Portal1_` 和 `Portal2_` 都可能出现英雄名 | `35` 馥郁晶昙使用 `Portal1_CrystalRose`，对应同主题。`46` 丝缕缠流使用 `Portal1_Gwen`，`58` 神秘格温仪式使用 `Portal2_GwenMoment`，两者都有格温线索 |
| 棋盘 | 棋盘名称或主题可提供候选，`groupId` 标识棋盘自身的分组 | `1020` 格温的剪剪尖尖塔以格温命名，名称对应英雄层级 |

表情使用共用的 LCU 数据表，`inventoryIcon` 的 `/SummonerEmotes/TFT/` 子目录可用于识别 TFT 主题素材。表情出现在 TFT 标签表或目录中，只能说明数据归类。客户端装备和使用范围需按实际客户端或 Riot 说明确认。

### 3.9 静态图、游戏内演出与模型

- **大厅静态图**使用物品表的 `loadoutsIcon`，按 1.4 转为 RAW PNG 地址。传送门表另有 `largeLoadoutsIcon`。棋盘和小小英雄的图片目录见 3.2。
- **淘汰演出**的配置可在 [`game/loadouts/companions/` 目录索引](https://raw.communitydragon.org/json/latest/game/loadouts/companions/)中查找，包含动画引用、相机、UI 和时间轴信息。与 `kFinisherAnimation` 标签分别统计，已核对时共有 109 个 `.cutscene.bin.json`，其中 106 个以 `_tier1.cutscene.bin.json` 结尾。参考[水晶玫瑰 小小格温演出配置](https://raw.communitydragon.org/latest/game/loadouts/companions/chibigwen_crystalrose_crystalrose_tier1.cutscene.bin.json)。
- **游戏内模型**从 `game/` 的角色与皮肤配置定位。水晶玫瑰 小小格温的 [`skin4.bin.json`](https://raw.communitydragon.org/latest/game/data/characters/petchibigwen/skins/skin4.bin.json) 用 `skinMeshProperties.simpleSkin` 引用 [`.skn` 主网格](https://raw.communitydragon.org/latest/game/assets/characters/petchibigwen/themes/crystalrose/tier1/petchibigwen_crystalrose_tier1.skn)，可进一步查看 `materialOverride`、`initialSubmeshToHide` 与[动画配置](https://raw.communitydragon.org/latest/game/data/characters/petchibigwen/animations/crystalrose.bin)。棋盘可用 `tft_arenaskin_*` 查找角色资源，例如 [Noxus Ring](https://raw.communitydragon.org/latest/game/data/characters/tft_arenaskin_noxusring/tft_arenaskin_noxusring.bin)。
- **网页预览**可直接显示 PNG。若源资源为 Bink 视频（`.bk2`），网页播放需另备浏览器支持的视频格式。静态 3D 预览可调研用 [LeagueToolkit](https://github.com/LeagueToolkit/LeagueToolkit) 将 `.skn` 转为 glTF/GLB，再由网页加载。已核对的 [RAW 导出清单](https://raw.communitydragon.org/latest/cdragon/files.exported.txt)有 15,592 个 `.skn`，没有列出 `.skl`、`.anm` 或 glTF/GLB。骨骼动画、实时材质和表情切换需要额外资源与渲染逻辑。附件报告的格温 GLB 包含 6 个 primitive、16,346 个顶点和 7 张内嵌贴图，该结果尚未在本站复现。源配置将 `Car` 列为默认隐藏，附件的导出结果却保留该子网格，复现时需确认筛选规则。

## 4. 官方来源与参考资料

- [CommunityDragon RAW](https://raw.communitydragon.org/)
- [CommunityDragon RAW assets](https://raw.communitydragon.org/latest/)
- [CommunityDragon Docs](https://github.com/CommunityDragon/Docs)
- [CommunityDragon Docs — Asset paths](https://github.com/CommunityDragon/Docs/blob/master/assets.md)
- [CommunityDragon CDTB](https://github.com/CommunityDragon/CDTB)
