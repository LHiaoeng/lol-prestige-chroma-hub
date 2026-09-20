# CommunityDragon 资源指南（Agent）

> 读取条件：处理 CommunityDragon 公开资源、PBE/正式版本 JSON、图片路径、客户端资源或资源索引时读取本文件。
>
> 范围：记录 CommunityDragon 公开资源、官方 RAW 访问规则，以及本项目对这些资源的使用边界。
>
> 官方资源域名：`raw.communitydragon.org`。

## 0. Agent 执行契约

按以下顺序处理本项目的 CommunityDragon 资源：

1. 确定内容链路：首页、臻彩详情、博客和固定说明属于静态图鉴内容；英雄、普通皮肤、皮肤系列和皮肤宇宙属于运行时资料。
2. 确定数据通道：缺少显式选择时使用 `pbe`；只有 `channel=latest` 使用正式服滚动数据。
3. 确定区域数据视图：英文页面只使用 `default`；简体中文页面只使用 `zh_cn`。
4. 确定资源类型：区分 JSON、`plugins/...` 客户端资源和 `game/...` 游戏客户端资源。
5. 读取 JSON：以数字 ID 识别实体，从 JSON 字段获取图片路径，不从名称、slug 或业务 ID 格式猜测资源。
6. 归一化路径：按第 3 节规则把 JSON 中的资源路径转换为 RAW 相对路径。
7. 生成官方 URL：只使用批准的 HTTPS RAW 域名和白名单路径，格式为 `https://raw.communitydragon.org/{version}/{relativePath}`。
8. 完成检查：确认数据通道、区域数据视图和资源类型没有被混用，并保留真实的缺失、404 和空目录状态。

完成标准：每个资源都能明确给出来源 JSON 或目录、数据通道、区域数据视图、相对路径和官方 RAW URL；运行时页面还必须能够显示加载、缺失、失败和重试状态。

### 0.1 两个独立维度

本项目将 CommunityDragon 的数据通道和区域数据视图作为两个正交维度：

| 页面           | 数据通道 | 区域数据视图 |
| -------------- | -------- | ------------ |
| 英文默认页面   | `pbe`    | `default`    |
| 英文正式服页面 | `latest` | `default`    |
| 中文默认页面   | `pbe`    | `zh_cn`      |
| 中文正式服页面 | `latest` | `zh_cn`      |

- `pbe` 与 `latest` 是滚动数据通道，不是两套静态站点。
- `default` 与 `zh_cn` 是各自完整的区域数据视图，不是“英文原始数据 + 中文翻译覆盖”。
- 数字 ID 是跨数据通道和区域数据视图的共享身份；名称、描述、稀有度、限定状态和可用性等字段属于当前视图的事实。
- 当前视图缺失字段时保持缺失，不使用另一地区或另一数据通道补值。
- 当前区域记录引用 `global/default` 下的共享图片不构成数据回退；物理资源路径与区域业务事实是两件事。

### 0.2 静态内容与运行时资料

```text
仓库数据 / 仓库快照 → Astro 构建 → 首页、臻彩详情、博客、固定说明
CommunityDragon RAW → 浏览器加载 → 英雄、普通皮肤、皮肤系列、皮肤宇宙
```

- 静态构建必须在 CommunityDragon 不可访问时成功，不在普通构建中在线刷新数据。
- 运行时资料是可失败的辅助内容，不承担逐实体 SEO；运行时实体详情使用 `noindex`，静态臻彩详情保留 SEO 内容。
- 静态臻彩页可以在正文完成后加载少量关联资料，但失败不得影响静态正文、主要操作或 SEO。
- 英雄覆盖率文章由显式维护并提交的仓库快照生成；浏览器刷新只是可失败的渐进增强。

## 1. 官方 RAW 入口

| 用途             | 官方入口                                                                                   | 说明                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| RAW 根目录       | `https://raw.communitydragon.org/{version}/`                                               | 浏览指定版本的 `game/`、`plugins/`、`locales/`、`cdragon/` 等目录；PBE 使用 `pbe`，正式滚动版本使用 `latest`。 |
| 内容版本         | `https://raw.communitydragon.org/{version}/content-metadata.json`                          | 部分版本提供内容版本元数据；以实际目录为准。                                                                   |
| 目录 JSON 列表   | `https://raw.communitydragon.org/json/{version}/`                                          | 在 RAW 路径前加 `json/` 获取机器可读的目录列表。                                                               |
| 游戏客户端资源   | `https://raw.communitydragon.org/{version}/game/`                                          | 游戏客户端导出的图片、二进制和其他资源。                                                                       |
| 客户端插件资源   | `https://raw.communitydragon.org/{version}/plugins/`                                       | LCU/客户端插件资源。                                                                                           |
| CDragon 便利数据 | `https://raw.communitydragon.org/{version}/cdragon/`                                       | CommunityDragon 根据 Riot 文件整理的便利数据，例如 TFT 数据。                                                  |
| Bin 文件浏览器   | [`https://raw.communitydragon.org/binviewer/`](https://raw.communitydragon.org/binviewer/) | 浏览和检查 CommunityDragon bin 文件的官方 Web UI。                                                             |

通用 URL：

```text
https://raw.communitydragon.org/{version}/{relativePath}
```

常用版本值：

```text
pbe       当前 PBE 滚动资源
latest    当前正式滚动资源
{patch}   固定补丁目录，例如 16.18
```

## 2. 常用 JSON

### 2.1 JSON URL 模板

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/{file}.json
```

`{version}` 替换为 `pbe`、`latest` 或具体补丁号；`{lang}` 替换为 `default`、`zh_cn` 或目标目录中实际存在的语言代码。

### 2.2 常用资源清单

| 中文资源       | English            | 文件                      | 官方 RAW 相对路径                                                       |
| -------------- | ------------------ | ------------------------- | ----------------------------------------------------------------------- |
| 英雄摘要       | Champion Summary   | `champion-summary.json`   | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champion-summary.json`   |
| 完整皮肤目录   | Skins              | `skins.json`              | `plugins/rcp-be-lol-game-data/global/{lang}/v1/skins.json`              |
| 皮肤系列       | Skinlines          | `skinlines.json`          | `plugins/rcp-be-lol-game-data/global/{lang}/v1/skinlines.json`          |
| 宇宙           | Universes          | `universes.json`          | `plugins/rcp-be-lol-game-data/global/{lang}/v1/universes.json`          |
| 英雄           | Companions         | `companions.json`         | `plugins/rcp-be-lol-game-data/global/{lang}/v1/companions.json`         |
| 终结特效       | Nexus Finishers    | `nexusfinishers.json`     | `plugins/rcp-be-lol-game-data/global/{lang}/v1/nexusfinishers.json`     |
| 召唤师图标     | Summoner Icons     | `summoner-icons.json`     | `plugins/rcp-be-lol-game-data/global/{lang}/v1/summoner-icons.json`     |
| 召唤师图标套装 | Summoner Icon Sets | `summoner-icon-sets.json` | `plugins/rcp-be-lol-game-data/global/{lang}/v1/summoner-icon-sets.json` |
| 表情           | Summoner Emotes    | `summoner-emotes.json`    | `plugins/rcp-be-lol-game-data/global/{lang}/v1/summoner-emotes.json`    |
| 成就头衔       | Achievement Titles | `achievementtitles.json`  | `plugins/rcp-be-lol-game-data/global/{lang}/v1/achievementtitles.json`  |
| 守卫皮肤       | Ward Skins         | `ward-skins.json`         | `plugins/rcp-be-lol-game-data/global/{lang}/v1/ward-skins.json`         |
| 守卫皮肤套装   | Ward Skin Sets     | `ward-skin-sets.json`     | `plugins/rcp-be-lol-game-data/global/{lang}/v1/ward-skin-sets.json`     |
| 云顶攻击特效   | TFT Damage Skins   | `tftdamageskins.json`     | `plugins/rcp-be-lol-game-data/global/{lang}/v1/tftdamageskins.json`     |
| 云顶棋盘皮肤   | TFT Map Skins      | `tftmapskins.json`        | `plugins/rcp-be-lol-game-data/global/{lang}/v1/tftmapskins.json`        |
| 云顶传送门     | TFT Portals        | `tftzoomskins.json`       | `plugins/rcp-be-lol-game-data/global/{lang}/v1/tftzoomskins.json`       |

以下为 PBE 示例；将路径中的 `pbe` 替换为 `latest` 或具体补丁号即可访问其他版本。

示例：

```text
中文皮肤 JSON：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/skins.json

默认语言皮肤 JSON：
https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/skins.json
```

`skins.json` 只作为人工研究或显式维护资源。本项目的运行时页面不得把它用作皮肤列表、皮肤详情、系列反向索引或宇宙反向索引的默认依赖。2026-09-20 的核查中，该文件未压缩约为 5.9–6.2 MB。

### 2.3 英雄详情 JSON

英雄摘要是列表数据；单个英雄详情和该英雄的皮肤正向集合使用：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/{championId}.json
```

`{championId}` 必须替换为真实英雄数字 ID。目录为空、实体只存在于另一数据通道或当前快照未导出时，官方 RAW 可能返回 `404`。

皮肤详情通过 URL 中的皮肤 ID 与英雄定位提示读取对应英雄详情，再按皮肤 ID 查找并复核目标身份。不得根据皮肤 ID 的数字格式猜测英雄 ID；缺少英雄定位提示时，只允许读取必要的小型索引，不得回退到完整 `skins.json`。

## 3. 图片路径映射规则

### 3.1 官方 JSON 资源路径

CommunityDragon JSON 中常见的图片路径不是完整 URL。按以下规则映射：

| JSON 路径                                                                 | 官方 RAW 相对路径                                                                               |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/Ahri_Splash.png` | `plugins/rcp-be-lol-game-data/global/default/assets/characters/ahri/skins/base/ahri_splash.png` |
| `/lol-game-data/assets/v1/champion-icons/1.png`                           | `plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png`                           |
| `ASSETS/Characters/Ahri/Skins/Base/Ahri_Splash.png`                       | `plugins/rcp-be-lol-game-data/global/default/assets/characters/ahri/skins/base/ahri_splash.png` |
| `plugins/rcp-be-lol-game-data/global/zh_cn/v1/champions/1.json`           | 原样保留 `plugins/rcp-be-lol-game-data/global/zh_cn/v1/champions/1.json`                        |
| `/game/assets/characters/ahri/...`                                        | `game/assets/characters/ahri/...`                                                               |

核心映射：

```text
/lol-game-data/assets/<path>
    → plugins/rcp-be-lol-game-data/global/default/<lowercased-path>
```

其中：

- 路径先去除首尾空白，再统一为小写。
- 裸 `assets/...` 表示资源根下的 `assets/...`，直接映射为 `plugins/rcp-be-lol-game-data/global/default/assets/...`；不得再额外拼接一层 `assets`，因此不会产生 `assets/assets/...` 歧义。
- 已经是 `plugins/...` 的路径保留原有 `region`、`lang` 和文件层级。
- `game/...` 路径直接从目标版本根目录拼接，不转换到 `rcp-be-lol-game-data`。
- `/lol-game-data/assets/...` 映射到 `global/default`，不会根据 JSON 来源语言自动改成 `zh_cn`。
- 已经是官方 RAW 完整 URL 的地址可以直接使用；需要切换版本时，先提取相对路径，再按目标版本重新拼接。

### 3.2 完整图片 URL

```text
imageUrl = https://raw.communitydragon.org/{version}/{relativePath}
```

例：

```text
relativePath = plugins/rcp-be-lol-game-data/global/default/assets/characters/ahri/skins/base/ahri_splash.png
imageUrl = https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/characters/ahri/skins/base/ahri_splash.png
```

图片和 JSON 使用相同的版本：PBE JSON 配 PBE 图片，正式 JSON 配 `latest` 或同一补丁号图片。

## 4. 常用图片目录

完整目录 URL：

```text
https://raw.communitydragon.org/{version}/{relativeDirectory}
```

| 资源类型                                  | 官方 RAW 相对目录                                                                     | 常见语言           |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ |
| 英雄详情 / Champion Details               | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champions/`                            | `zh_cn`、`default` |
| 英雄炫彩 / Champion Chroma Images         | `plugins/rcp-be-lol-game-data/global/{lang}/v1/champion-chroma-images/`               | `zh_cn`、`default` |
| 头像 / Profile Icons                      | `plugins/rcp-be-lol-game-data/global/{lang}/v1/profile-icons/`                        | `zh_cn`、`default` |
| 成就头衔 / Player Titles                  | `plugins/rcp-be-lol-game-data/global/{lang}/assets/playertitles/`                     | `zh_cn`、`default` |
| 英雄与皮肤图片 / Characters               | `plugins/rcp-be-lol-game-data/global/{lang}/assets/characters/`                       | `zh_cn`、`default` |
| 表情事件 / Summoner Emote Events          | `plugins/rcp-be-lol-game-data/global/{lang}/assets/loadouts/summoneremotes/events/`   | `zh_cn`、`default` |
| 终结特效 / Nexus Finishers                | `plugins/rcp-be-lol-game-data/global/{lang}/assets/loadouts/nexusfinishers/`          | `zh_cn`、`default` |
| 守卫皮肤 / Ward Skin Images               | `plugins/rcp-be-lol-game-data/global/{lang}/content/src/leagueclient/wardskinimages/` | `zh_cn`、`default` |
| 稀有宝石图标 / Rarity Gem Icons           | `plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/`                    | `default`          |
| 云顶攻击特效 / TFT Damage Skins           | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/`         | `default`          |
| 云顶棋盘 / TFT Map Skins                  | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/`            | `default`          |
| 云顶传送门 / TFT Portals                  | `plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/`           | `default`          |
| 云顶移动端礼包 / TFT Mobile Bundle Offers | `plugins/rcp-be-lol-game-data/global/default/assets/ux/tftmobile/store/bundleoffers/` | `default`          |
| 徽章 / Emblem Images                      | `plugins/rcp-be-lol-game-data/global/zh_cn/v1/emblem-images/`                         | `zh_cn`            |

目录资源可能因版本、语言或当前快照返回空目录或 `404`。本项目保留真实失败状态，不自动改用另一数据通道或区域数据视图。

## 5. JSON 图片字段

先读取字段值，再应用第 3 节路径映射规则：

| JSON                                         | 字段                                                               | 资源                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `champion-summary.json`                      | `squarePortraitPath`                                               | 英雄方形头像                                                                                                                                                                                                         |
| `champions/{championId}.json`                | `squarePortraitPath`                                               | 英雄方形头像                                                                                                                                                                                                         |
| `champions/{championId}.json` / `skins.json` | `splashPath`、`uncenteredSplashPath`、`tilePath`、`loadScreenPath` | 皮肤原画、缩略图、载入图                                                                                                                                                                                             |
| `champions/{championId}.json` / `skins.json` | `chromaPath`                                                       | 炫彩资源                                                                                                                                                                                                             |
| `champions/{championId}.json` / `skins.json` | `rarity`、`regionRarityId`、`rarityGemPath`                        | `default` 按 `rarity` 映射全球稀有度；`zh_cn` 的国服展示等级以 `regionRarityId` 为准，4–11 分别对应史诗、传说、未知、限定、神话、终极、圣堂、卓越，图标使用 `rarity-gem-icons/cn-gem-{id}.png`。两套字段语义不可混用 |
| `universes.json`                             | `imagePath`                                                        | 宇宙图片                                                                                                                                                                                                             |
| `achievementtitles.json`                     | `iconPath`、`backgroundImagePath`                                  | 成就头衔图标和背景                                                                                                                                                                                                   |
| `nexusfinishers.json`                        | `iconPath`、`splashPath`、`videoPath`                              | 终结特效图标、展示图和视频                                                                                                                                                                                           |

`skinlines.json` 主要提供皮肤系列名称和描述；如果具体快照增加资源字段，沿用同一映射规则。

## 6. 官方资源边界

- 版本别名（如 `pbe`、`latest`）对应滚动资源时，名称、数值、资源路径和文件内容可能变化。
- `content-metadata.json` 的版本值会变化，适合用于缓存刷新和抓取记录。
- RAW 目录结构可能被重新组织；优先通过 JSON 或目录列表发现实际文件。
- JSON、图片、视频和 bin 文件的可用性不保证完全一致；缺失时记录真实状态。
- RAW 资源属于公开静态资源目录，不等同于 Riot 官方 API。
- 本文只定义官方 RAW 资源路径；其他域名不作为 CommunityDragon 资源地址。
- 浏览器只请求当前页面所需的区域数据视图，不预取另一语言，不轮询，也不在页面重新获得焦点时刷新。
- 请求省略凭据与 Referer。查询参数只能选择已批准的数据通道、区域数据视图和数字实体 ID，不能控制域名或任意资源路径。
- 页面内以数据通道、区域数据视图和资源键缓存进行中的 Promise 与已完成响应；跨导航缓存交给浏览器 HTTP 缓存和验证器。
- 不使用 `localStorage`、`sessionStorage`、IndexedDB 或 Service Worker 持久保存 CommunityDragon 响应。
- CommunityDragon 取消跨域或改变目录时应明确失败；本站代理、镜像或跨源后备需要新的架构决策。

## 7. Agent 完成检查清单

- [ ] 使用 `raw.communitydragon.org` 作为资源域名。
- [ ] 已明确数据通道：默认 `pbe` 或显式 `latest`，并让 JSON 与图片使用同一数据通道。
- [ ] 已按页面语言选择区域数据视图：英文 `default`，简体中文 `zh_cn`。
- [ ] 数字 ID 用于实体身份，名称和 slug 未被当作跨视图身份。
- [ ] 图片路径来自 JSON 字段或已验证的官方目录。
- [ ] `/lol-game-data/assets/...` 已映射到 `global/default`。
- [ ] `plugins/...` 和 `game/...` 路径没有被错误转换。
- [ ] 没有请求完整 `skins.json` 作为运行时默认依赖。
- [ ] 404、空目录或缺失字段保留真实状态，没有跨区域或跨通道补值。
- [ ] 运行时请求可取消、可重试，并不会让旧响应覆盖新的页面状态。
- [ ] 需要复现时保存数据通道、区域数据视图、抓取时间、内容版本和原始 RAW URL。

## 8. 中英文资源路径切换

资源语言由路径中的 `{lang}` 控制，资源版本由 `{version}` 控制；两者独立切换。

### 8.1 JSON 路径

统一模板：

```text
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/{lang}/v1/{file}.json
```

同一个资源的中英文路径示例：

```text
英文或默认语言：
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/default/v1/skins.json

简体中文：
https://raw.communitydragon.org/{version}/plugins/rcp-be-lol-game-data/global/zh_cn/v1/skins.json
```

切换规则：

- 英文或默认语言使用 `global/default`。
- 简体中文使用 `global/zh_cn`。
- 本项目页面目前只映射 `default` 与 `zh_cn`；研究其他语言时必须使用目标版本目录中真实存在的 locale，不得把它接入现有页面语言映射。
- 同一次读取中，相关 JSON 应使用同一个 `{version}` 和 `{lang}`。
- 语言目录不存在、文件缺失或返回 `404` 时，保留真实状态；本项目不自动改用 `default`。

### 8.2 图片路径

图片是否切换语言，先看 JSON 字段返回的路径类型：

| JSON 字段路径类型                             | 处理方式                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/lol-game-data/assets/...` 或裸 `ASSETS/...` | 按第 3 节映射到 `global/default`；这类资源不要仅因 JSON 使用 `zh_cn` 就强行改成 `global/zh_cn`。 |
| 已经是 `plugins/.../global/{lang}/...`        | 保留路径中的 `{lang}`；要切换语言时，将 `default` 替换为 `zh_cn`，并确认目标文件真实存在。       |
| `game/assets/...`                             | 直接从 `{version}/game/` 拼接；该路径不增加 `global/{lang}`。                                    |
| 已经是官方 RAW 完整 URL                       | 先提取相对路径，再按目标 `{version}` 重新拼接；不要重复追加域名或版本。                          |

完整 URL 模板：

```text
https://raw.communitydragon.org/{version}/{relativePath}
```

切换语言时，只替换资源路径中的 `{lang}`；切换版本时，只替换 URL 中的 `{version}`。如果路径本身不含 `{lang}`，说明该资源按版本共享，不要人为增加语言目录。

## 9. 运行时加载约束

- 运行时资料入口只接受 `pbe`、`latest` 两个数据通道；固定补丁目录保留给人工研究和显式维护流程。
- URL 缺少 `channel` 或显式使用 `channel=pbe` 时读取 PBE；其他非 `latest` 值属于无效链接，页面必须在发出 CommunityDragon 请求前拒绝。
- 英雄、系列和宇宙提供列表与详情；普通皮肤不提供全量列表，用户从英雄详情进入皮肤详情。
- 核心实体请求优先。核心成功后，相关系列或宇宙最多三个并发请求，各关联区独立处理失败。
- 通道切换先加载目标数据，成功后再更新内容和 URL；失败时保留旧内容与旧 URL。
- 页面切换、重新加载或销毁时取消旧请求，迟到响应不得覆盖当前状态。
- 无 JavaScript 时，页面壳仍需提供标题、来源、导航和启用脚本提示。
- 隐私说明必须披露浏览器会直接连接 CommunityDragon 获取资料和媒体。

### 9.1 当前英雄运行时实现

英雄目录现在由静态页面壳和浏览器控制器组成，不在 Astro 构建时读取 CommunityDragon：

| 用途         | URL 形态                      | 运行时数据        |
| ------------ | ----------------------------- | ----------------- |
| 英文英雄列表 | `/champions/`                 | `default` + `pbe` |
| 中文英雄列表 | `/zh-cn/champions/`           | `zh_cn` + `pbe`   |
| 英雄详情     | `/champions/?id={championId}` | 英雄数字 ID       |
| 正式服视图   | 上述 URL 加 `channel=latest`  | 仅切换运行时资料  |

- 英雄列表在浏览器中完成名称搜索、ID/名称排序和分页；页面只渲染当前分页，避免一次性建立全部卡片节点。
- 英雄详情使用 `champions/{championId}.json`，并从同一份英雄记录提供皮肤正向集合；普通皮肤入口必须继续携带 `champion={championId}`。
- 页面通过 `list` / `get` 运行时 seam 统一处理 RAW URL、`default`/`zh_cn`、`pbe`/`latest`、Schema、缓存、取消和结构化错误。`src/domain/communitydragon-runtime.ts` 只负责 Schema、身份复核与路径规范化等纯规则，`src/client/communitydragon-runtime.ts` 负责浏览器请求、页面内去重和取消；测试通过后者注入假请求，不探测真实站点。
- 首次加载显示静态标题、来源、区域视图、数据通道和启用脚本提示；请求成功后状态栏显示本次加载时间。运行时详情由客户端状态标记为 `noindex`，静态臻彩页不依赖该辅助资料即可保持可索引正文。
- 四个运行时目录共用带 canonical 的静态页面壳；由于静态托管无法按查询参数改变首响应，页面壳统一输出 `noindex`，确保 `?id=` 详情在脚本执行前也不会进入索引。
- 通道切换只有在目标请求成功后才提交 History URL；失败时保留旧内容和旧 URL。网络、HTTP、404、不识别的响应格式和非法参数分别显示不同的可重试状态。
- CommunityDragon 不可访问不会阻塞 `pnpm build`；静态首页、臻彩详情、博客和固定说明与该运行时链路分离。

### 9.2 系列与宇宙关联

- `/skinlines/?id={id}` 的核心记录来自系列列表；核心成功后再读取当前区域、当前通道的宇宙列表，并按双方记录中的数字 ID 关系筛选可导航链接。
- `/universes/?id={id}` 使用对称策略：先显示宇宙自身资料，再读取系列列表筛选所属系列。两条路径都不读取 `skins.json`，也不生成完整皮肤或英雄反向目录。
- 关联区独立显示“加载中 / 无可显示关系 / 失败并重试”；关联请求失败不会清空已显示的系列或宇宙名称、描述和图片。
- 关系名称始终来自当前 `default` 或 `zh_cn` 列表；当前视图没有名称或关系时保持缺失，不借用另一地区的字段。由当前记录引用的共享媒体仍按官方 RAW 路径加载，媒体失败只移除对应图片。

### 9.3 英雄到皮肤

- 英雄详情使用当前英雄 JSON 的 `skins` 正向集合生成入口，皮肤链接固定为 `/skins/?id={skinId}&champion={championId}`；不从皮肤 ID 的数字格式推断英雄。
- 皮肤核心请求只读取带英雄定位提示的 `champions/{championId}.json`，按皮肤 ID 再次校验身份；正常路径不会请求完整 `skins.json`。
- 核心皮肤成功后并行读取系列和宇宙列表（最多两个关联请求），按当前皮肤的 `skinLines` 与宇宙的系列 ID 过滤导航。关联失败只追加可重试提示，不删除皮肤名称、描述或主媒体。
- 皮肤阶段从当前英雄记录的 `questSkinInfo.tiers` 读取；每个阶段的图片和炫彩媒体独立按当前通道解析。图片加载失败会隐藏损坏媒体，文字资料仍保留。
- 皮肤定位提示缺失、响应英雄 ID 不一致、目标皮肤不存在以及目标通道没有该皮肤都属于明确失败，不回退到另一通道、另一地区或完整目录。

### 9.4 静态臻彩与覆盖率快照

- 臻彩详情页的标题、正文、图片、主要操作、SEO 和静态关联名称先由仓库目录直接输出；CommunityDragon 只在浏览器中补充当前英雄和 `sourceSkinId` 对应的基础皮肤资料。
- 补充请求只读取对应英雄 JSON，并在返回的 `skins` 集合中复核英雄 ID、基础皮肤 ID 和 `isBase`；失败只替换补充区，静态正文和主要操作保持可用。补充区可重试，图片失败只移除该图片。
- 臻彩页默认使用 `pbe`，只有显式 `channel=latest` 才读取正式服滚动资料；通道按钮和补充区后续运行时链接同步当前通道，不改变仓库中的臻彩事实。
- 覆盖率文章使用已提交的 `data/champion-coverage.snapshot.json` 生成双语静态正文。普通 `pnpm build` 不联网更新快照；需要维护时运行 `pnpm coverage:snapshot`，命令会分别读取 `default` 与 `zh_cn` 的 PBE 英雄摘要，并要求官方 URL、HTTP 成功状态、`ETag` 或 `Last-Modified`、补丁版本和计数校验全部通过。
- 覆盖率文章在浏览器中刷新时只通过 `src/client/communitydragon-runtime.ts` 的 `list("champions")` seam 读取当前页面区域：英文只请求 `default`，中文只请求 `zh_cn`，每次刷新只发一个当前区域请求；当前区域缺失或请求失败时保留仓库快照，不从另一地区补值。
- 快照记录 `schemaVersion`、来源通道、两个区域数据视图、来源 URL、抓取时间、内容版本、补丁版本、总数、已覆盖数、缺失数和缺失英雄列表。非法快照或覆盖计数不一致会阻止维护流程写入；浏览器刷新失败时保留提交的快照内容。

## 10. 官方来源与实现参考

### 10.1 区域数据展示权威参考

遇到 CommunityDragon 字段含义、区域稀有度、皮肤分组、系列与宇宙关联、资源路径或展示差异问题时，优先对照以下两个开源项目的对应区域实现：

| 区域数据视图     | 参考项目                                                                                        | 参考范围                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 国服 `zh_cn`     | [BuguoguoLoLCreator/lol-skin-explorer](https://github.com/BuguoguoLoLCreator/lol-skin-explorer) | 国服名称、国服稀有度与腾讯服务器专属内容的读取、整理和展示。该项目基于下方直营服项目分支，并针对国服数据扩展。 |
| 直营服 `default` | [BennyExtreme00/lol-skin-explorer](https://github.com/BennyExtreme00/lol-skin-explorer)         | 直营服英雄、皮肤、系列、宇宙和 PBE 数据的读取、关联及展示。                                                    |

使用规则：

- 这两个仓库是本项目认可的区域数据**展示实现参考**；CommunityDragon RAW JSON 和官方目录仍是数据事实与资源路径的最终来源。
- `zh_cn` 展示问题先检查国服参考项目，`default` 展示问题先检查直营服参考项目；不要用其中一个区域的处理逻辑覆盖另一区域事实。
- 可以参考其字段解析、稀有度映射、实体关联和资源定位思路，但应针对当前 CommunityDragon 响应重新验证，不能假定第三方仓库代码与滚动数据始终同步。
- 引用或移植具体代码前检查其许可证、当前分支和实现上下文；本项目既有 ADR、Schema、安全边界和测试要求仍然有效。

### 10.2 官方来源

- [CommunityDragon RAW](https://raw.communitydragon.org/)
- [CommunityDragon RAW assets](https://raw.communitydragon.org/latest/)
- [CommunityDragon Docs](https://github.com/CommunityDragon/Docs)
- [CommunityDragon Docs – Asset paths](https://github.com/CommunityDragon/Docs/blob/master/assets.md)
- [CommunityDragon CDTB](https://github.com/CommunityDragon/CDTB)
- [Skin Explorer rarity 映射参考](https://github.com/BennyExtreme00/lol-skin-explorer/blob/main/data/helpers.js)
- [Riot Skins 101：Legacy 与 Limited 的定义](https://www.leagueoflegends.com/en-ph/news/dev/skins-101/)
