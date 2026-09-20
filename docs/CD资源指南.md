# CommunityDragon 资源指南

> 本文用于处理 CommunityDragon 的公开 JSON、图片、客户端资源和资源目录。
> CommunityDragon 的内容会随版本和区域数据视图变化；本文只定义本项目认可的读取方式和边界。

## 1. 文档范围与基本概念

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

## 2. 通用规则

### 2.1 RAW URL 与版本选择

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

- `pbe`：当前测试服滚动资源。本项目运行时默认使用它。
- `latest`：当前正式服滚动资源。运行时只有显式指定 `channel=latest` 时使用。
- `{patch}`：固定补丁目录，例如 `16.18`，用于人工研究或显式维护，不作为运行时通道。

`pbe` 和 `latest` 都是滚动数据源，不是不可变快照。需要复现历史状态时使用明确补丁号，并记录抓取时间和内容版本。

### 2.2 区域数据视图

版本数据源和区域数据视图是两个独立维度：

| 页面语言 | 区域数据视图 |
| --- | --- |
| 英文 | `default` |
| 简体中文 | `zh_cn` |

常用 JSON 模板：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/{file}.json
```

规则：

- 数字 ID 用于识别实体；名称、slug、描述、稀有度和可用性属于当前版本与区域视图的事实。
- 当前视图缺失字段时保留缺失，不从另一语言或另一版本补值。
- 当前区域记录引用 `global/default` 下的共享媒体，不代表业务字段发生跨区域回退。
- 其他语言目录只能用于人工研究，不能直接接入本项目现有页面语言映射。

### 2.3 路径转换规则

JSON 中的资源路径通常不是完整 URL。先读取 JSON 字段，再转换为 RAW 相对路径：

| JSON 路径 | RAW 相对路径 |
| --- | --- |
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

图片或其他媒体的最终地址为：

```text
https://raw.communitydragon.org/{version}/{relativePath}
```

JSON 和媒体必须使用同一 `{version}`。路径来自 JSON 字段或已验证的官方目录，不根据名称、slug 或数字格式猜测。

### 2.4 响应与失败处理

- 目录为空、文件不存在、404、缺失字段和格式不符合预期，都保留为真实状态。
- 不自动改用另一版本、另一语言、另一数据通道或未经批准的镜像、代理和域名。
- 运行时界面分别提供加载中、空状态、失败和可重试状态；媒体失败不应清除已经成功加载的文字资料。
- 页面切换、重新加载或销毁时取消旧请求，迟到响应不得覆盖当前页面状态。
- 通道切换应先加载目标数据，成功后再更新内容和 URL；失败时保留旧内容和旧 URL。

### 2.5 缓存、请求和安全边界

- 浏览器只请求当前页面所需的版本、区域和资源，不预取另一语言、不轮询，也不在重新获得焦点时刷新。
- 页面内可以按“数据通道 + 区域数据视图 + 资源键”缓存进行中的 Promise 和已完成响应；跨导航缓存交给浏览器 HTTP 缓存和验证器。
- 不使用 `localStorage`、`sessionStorage`、IndexedDB 或 Service Worker 持久保存 CommunityDragon 响应。
- 请求省略凭据与 Referer；查询参数只允许选择已批准的版本、区域和数字实体 ID。
- 无 JavaScript 时，页面壳仍应提供标题、导航、版本选择说明和启用脚本提示。
- 隐私说明必须披露浏览器会直接连接 CommunityDragon 获取资料和媒体。

### 2.6 通用检查清单

- [ ] 使用 `raw.communitydragon.org` 作为资源域名。
- [ ] 已明确版本：运行时只能使用 `pbe` 或 `latest`，且 JSON 与媒体版本一致。
- [ ] 已按页面语言选择 `default` 或 `zh_cn`。
- [ ] 实体身份使用数字 ID，没有从名称、slug 或数字格式推导身份。
- [ ] 图片路径来自 JSON 字段或已验证的官方目录。
- [ ] 已正确区分 `plugins/...`、`game/...` 和 `/lol-game-data/assets/...`。
- [ ] 404、空目录和缺失字段没有被静默回退或伪造默认值。
- [ ] 运行时请求可取消、可重试，旧响应不能覆盖新状态。
- [ ] 需要复现时记录版本、区域、抓取时间、内容版本和原始 URL。

## 3. 英雄联盟资源

### 3.1 常用 JSON

英雄联盟客户端数据通常位于：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/
```

| 资源 | 文件或路径 | 用途 |
| --- | --- | --- |
| 英雄摘要 | `champion-summary.json` | 英雄列表、数字 ID、名称、角色和头像 |
| 英雄详情 | `champions/{championId}.json` | 单个英雄及其皮肤正向集合 |
| 完整皮肤目录 | `skins.json` | 人工研究或显式维护，不作为运行时默认依赖 |
| 皮肤系列 | `skinlines.json` | 系列名称、描述和数字 ID |
| 宇宙 | `universes.json` | 宇宙名称、描述、图片和系列关系 |
| 其他客户端数据 | `nexusfinishers.json`、`summoner-icons.json` 等 | 终结特效、召唤师图标等附属资源 |

单个英雄详情：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/{championId}.json
```

### 3.2 英雄、皮肤、系列与宇宙的关联

- 英雄列表使用 `champion-summary.json`。
- 英雄详情使用真实的 `championId`，并从该英雄记录的 `skins` 集合生成皮肤入口。
- 皮肤详情必须携带英雄定位提示，读取对应 `champions/{championId}.json` 后按皮肤 ID 复核身份。
- 皮肤系列和宇宙通过各自列表中的数字 ID 关联；关联失败不得清除已经显示的核心实体资料。
- 运行时不使用完整 `skins.json` 生成皮肤列表、系列反向索引或宇宙反向索引。
- 不根据皮肤 ID 的数字格式猜测英雄 ID；缺少英雄定位提示时，只允许读取必要的小型索引。

推荐的运行时 URL：

```text
/champions/
/champions/detail/?id={championId}
/skins/?id={skinId}&champion={championId}
/skinlines/?id={skinlineId}
/universes/?id={universeId}
```

### 3.3 英雄与皮肤字段、分类和图片

英雄分类直接使用 `champion-summary.json` 中的 `roles`，不根据名称、ID 或图片路径推导：

- 可选分类键固定为 `assassin`、`fighter`、`mage`、`marksman`、`support`、`tank`。
- 筛选使用精确成员匹配 `roles.includes(role)`。
- 英雄可以同时属于多个分类；未知角色保留供校验，但不自动新增界面分类。
- 页面展示本地化后的分类名称，不向用户暴露字段名和内部路径。

常见字段：

| JSON | 字段 | 用途 |
| --- | --- | --- |
| 英雄摘要或英雄详情 | `squarePortraitPath` | 英雄方形头像 |
| 英雄详情或皮肤目录 | `splashPath`、`uncenteredSplashPath`、`tilePath`、`loadScreenPath` | 皮肤展示图、缩略图和载入图 |
| 英雄详情或皮肤目录 | `chromaPath` | 炫彩资源 |
| 皮肤记录 | `skinLines`、`isBase`、`questSkinInfo.tiers` | 系列关系、基础皮肤和阶段信息 |
| 系列 | `imagePath` 等实际存在的媒体字段 | 系列图片 |
| 宇宙 | `imagePath` | 宇宙图片 |

常用目录：

| 资源类型 | RAW 相对目录 |
| --- | --- |
| 英雄详情 | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/` |
| 英雄炫彩图片 | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champion-chroma-images/` |
| 英雄与皮肤图片 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/characters/` |
| 成就头衔 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/playertitles/` |
| 终结特效 | `plugins/rcp-be-lol-game-data/global/{lang}/assets/loadouts/nexusfinishers/` |
| 稀有度图标 | `plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/` |

稀有度规则：

- `default` 视图使用记录中的 `rarity` 和对应全球稀有度图标。
- `zh_cn` 视图的国服展示等级以 `regionRarityId` 为准，不能与 `rarity` 混用。
- 当前区域缺少稀有度或图标时保留缺失，不从另一视图补值。

### 3.4 运行时读取规则

- 英文页面使用 `default`，中文页面使用 `zh_cn`；运行时默认通道为 `pbe`。
- 英雄目录由静态页面壳和浏览器控制器组成；浏览器完成搜索、排序、分类、分页和详情读取。
- 核心实体优先加载；系列和宇宙属于独立的关联请求，最多并发读取必要数据。
- 网络、HTTP、404、取消和响应格式错误分别显示明确状态，并支持重试。
- 英雄、皮肤、系列和宇宙详情属于运行时资料，客户端确认有效实体后设置 `noindex`；静态臻彩页面不依赖这些资料即可保持正文和 SEO 可用。

静态臻彩页面只把 CommunityDragon 作为基础皮肤补充：

- 标题、正文、主图、SEO 和主要操作来自仓库目录。
- 浏览器根据当前英雄和 `sourceSkinId` 读取基础皮肤，并复核英雄 ID、皮肤 ID 和 `isBase`。
- 补充请求失败只影响补充区，不清空静态正文；媒体失败只移除对应媒体。

英雄覆盖率文章使用提交到仓库的 `data/champion-coverage.snapshot.json`。普通构建不联网更新快照；维护快照时分别读取 `default` 和 `zh_cn` 的 `pbe` 摘要，并校验来源 URL、HTTP 状态、`ETag` 或 `Last-Modified`、补丁版本和覆盖计数。

### 3.5 英雄联盟参考资料

- [直营服 Skin Explorer](https://github.com/BennyExtreme00/lol-skin-explorer)：`default` 数据视图的字段展示、英雄角色和实体关联参考。
- [国服 Skin Explorer](https://github.com/BuguoguoLoLCreator/lol-skin-explorer)：`zh_cn` 数据视图、国服名称和稀有度参考。
- [Riot Skins 101](https://www.leagueoflegends.com/en-ph/news/dev/skins-101/)：Legacy 和 Limited 等概念参考。

这些项目不是本项目的数据源；引用其字段解析或展示逻辑前，仍需按当前 CommunityDragon 响应重新验证。

## 4. 云顶之弈资源

### 4.1 常用 JSON

云顶相关客户端数据通常位于：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/
```

常见资源：

| 资源 | 文件 | 用途 |
| --- | --- | --- |
| 攻击特效 | `tftdamageskins.json` | 云顶攻击特效目录 |
| 棋盘皮肤 | `tftmapskins.json` | 云顶棋盘皮肤目录 |
| 传送门 | `tftzoomskins.json` | 云顶传送门目录 |

CommunityDragon 也提供 CDragon 便利数据：

```text
https://raw.communitydragon.org/{version}/cdragon/
```

使用 CDragon 数据前，必须确认目标版本中实际存在对应文件和字段；不能把便利数据路径当成所有云顶资源的固定契约。

### 4.2 云顶资源目录与图片路径

常用 RAW 相对目录：

| 资源 | RAW 相对目录 |
| --- | --- |
| 攻击特效 | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/` |
| 棋盘皮肤 | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/` |
| 传送门 | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/` |
| 移动端礼包 | `plugins/rcp-be-lol-game-data/global/default/assets/ux/tftmobile/store/bundleoffers/` |

图片路径仍按[通用路径转换规则](#23-路径转换规则)处理：优先读取 JSON 返回的字段，不根据资源名称或编号拼接路径。

### 4.3 云顶资源的版本与语言规则

- 运行时只使用 `pbe` 或显式指定的 `latest`，JSON 与媒体必须使用同一版本。
- 当前云顶资源目录主要位于 `global/default`；如果目标 JSON 明确返回其他区域路径，保留 JSON 中的真实路径。
- 不因页面语言是中文就强行把云顶资源改到 `zh_cn`；目标目录不存在时保留缺失状态。
- 云顶资源可能随版本新增、删除或更换目录；优先以目标版本 JSON 和目录列表为准。
- 资源列表和详情应使用数字 ID 或 JSON 提供的稳定身份字段，不根据名称或图片文件名推导身份。

### 4.4 云顶运行时读取规则

- 云顶资源属于运行时资料时，遵循通用的加载、取消、缓存、失败和重试规则。
- 某一类资源失败时，只显示该资源区的失败状态，不影响其他已加载资源。
- 资源只用于页面明确需要的列表或详情，不预取完整目录，也不把滚动数据写入持久化浏览器存储。
- 构建流程不依赖云顶 CommunityDragon 在线可用性；需要固定内容时，应先生成并提交经过校验的仓库快照。

### 4.5 云顶示例

```text
JSON：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tftmapskins.json

资源目录：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/
```

以上仅为路径模板示例；实际文件、字段和媒体可用性必须以目标版本响应为准。

## 5. 官方来源与参考资料

- [CommunityDragon RAW](https://raw.communitydragon.org/)
- [CommunityDragon RAW assets](https://raw.communitydragon.org/latest/)
- [CommunityDragon Docs](https://github.com/CommunityDragon/Docs)
- [CommunityDragon Docs — Asset paths](https://github.com/CommunityDragon/Docs/blob/master/assets.md)
- [CommunityDragon CDTB](https://github.com/CommunityDragon/CDTB)
