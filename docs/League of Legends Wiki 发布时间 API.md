# League of Legends Wiki 发布时间 API

本文记录从英文 [League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/) 获取《英雄联盟》英雄与皮肤发布时间的入口，供后续全量皮肤时间轴的数据导入使用。入口复核时间：2026-10-22。这里的日期采用 Wiki 自身口径，不代表国服的游戏内开放或商城开售时间。

## 数据在哪里

[Aatrox 页的 Champion skins 区块](https://wiki.leagueoflegends.com/en-us/Aatrox#Champion_skins)由 `{{#invoke:SkinData|skintabber|Aatrox}}` 生成。日期保存在 `Module:SkinData/data` 的 `release` 字段，英雄发布日期另存于 `Module:ChampionData/data` 的 `date` 字段。两者可能不同：Aatrox 的 Original 皮肤为 `2013-06-12`，英雄为 `2013-06-13`。

**时间轴口径**：皮肤英文名取 CommunityDragon `latest` 正式版 `global/default/v1/skins.json` 的 `name`，中文名取 `global/zh_cn/v1/skins.json` 的 `name`；日期按 `skinId` 使用本 Wiki `SkinData/data` 中对应皮肤的 `release`。默认皮肤本地 ID 为 `0`（合成 `skinId` 后通常以 `000` 结尾），名称改用对应语言 `champion-summary.json` 拼接：英文为 `description` + `name`，中文为 `name` + `description`，例如 `1000` 为 `the Dark Child Annie`、`黑暗之女 安妮`；Wiki 将默认皮肤称为 `Original`。英雄 `date` 只用于核对，不覆盖默认皮肤日期。没有有效皮肤日期时不推断。

## Wiki 源码入口

2026-10-22 实测：`api.php`、普通模块页及部分 raw 请求返回带有“Please wait”的 HTTP 403；更换 User-Agent 或重试不能稳定恢复。导入程序先尝试[模块 raw 源码](https://wiki.leagueoflegends.com/en-us/Module:SkinData/data?action=raw)，该入口曾返回完整 Lua 表，但也可能遇到相同的 403。此时程序仍读取 CommunityDragon，保留已有日期，让新增记录的直营服日期保持 `null`，并在报告的 `unavailableSources` 中标明来源不可用；若本地尚无日期快照则直接报错。若从 Wiki 页面取得当前模块源码并保存为本地 Lua 文件，可运行 `pnpm skin-dates:update --wiki-source <path>` 完成日期核对；预览和 `--apply` 须使用同一份文件。

以下 MediaWiki Action API 请求在 2026-10-16 曾返回 JSON，目前只作历史参考；URL 中的 `text` 是经过 URL 编码的 Wiki 模板语法。

| 用途 | 请求与结果 |
| --- | --- |
| 单款皮肤日期 | [Aatrox Original 示例](https://wiki.leagueoflegends.com/en-us/api.php?action=expandtemplates&format=json&prop=wikitext&text=%7B%7B%23invoke%3ASkinData%7CgetRelease%7Cchampion%3DAatrox%7Cskin%3DOriginal%7D%7D)：`expandtemplates.wikitext` 为 `2013-06-12`。模板为 `{{#invoke:SkinData\|getRelease\|champion=Aatrox\|skin=Original}}`。 |
| 英雄日期 | [Aatrox 示例](https://wiki.leagueoflegends.com/en-us/api.php?action=expandtemplates&format=json&prop=wikitext&text=%7B%7Bccd%7CAatrox%7Cdate%7D%7D)：`expandtemplates.wikitext` 为 `2013-06-13`。模板为 `{{ccd\|Aatrox\|date}}`。 |
| 获取全量皮肤来源 | [查询 `Module:SkinData/data` 源码](https://wiki.leagueoflegends.com/en-us/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Module%3ASkinData%2Fdata&format=json)：位于 `query.pages[pageid].revisions[0].slots.main["*"]`，内容是 Lua 表。 |
| 获取全量英雄来源 | [查询 `Module:ChampionData/data` 源码](https://wiki.leagueoflegends.com/en-us/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Module%3AChampionData%2Fdata&format=json)：响应结构相同，内容是 Lua 表。 |
| 获取来源版本 | [同时查询两个模块的修订号和时间](https://wiki.leagueoflegends.com/en-us/api.php?action=query&prop=revisions&rvprop=ids%7Ctimestamp&rvslots=main&titles=Module%3ASkinData%2Fdata%7CModule%3AChampionData%2Fdata&format=json)：记录每个模块的 `revid`，用于复核快照。 |

单条查询适合检查疑点。全量皮肤日期导入读取整个 `SkinData/data` 模块，而不是对数千款皮肤逐一调用 `expandtemplates`。模块约 2.2 MB；raw 响应是 Lua 源码，Action API 曾将同一源码放在 JSON 的 `slots.main["*"]` 中。导入程序解析并校验 Lua 结构，不执行远端代码。

## 版本号来源

`SkinData/data` 的皮肤记录没有 patch/version 字段；`release` 只能回填 `globalReleaseDate`。直营服版本号先查 [Riot 官方补丁说明](https://www.leagueoflegends.com/en-us/news/game-updates/)：以公告标题的补丁号和正文明确的首次推出皮肤清单匹配目标皮肤。例如 [26.18 补丁说明](https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-18-notes/)有 “Upcoming Skins & Chromas” 中的首次推出皮肤列表。返场、商店轮换和改动条目中的皮肤名称不算首次发行证据。

官方补丁说明未覆盖时，再网络搜索 Wiki 对应英雄的 `.../Cosmetics` 页面或具体补丁页面，查找明确把皮肤与首次发行补丁关联的正文（例如 “released in patch V8.9”）。可用 MediaWiki 搜索 API 辅助定位：

```text
https://wiki.leagueoflegends.com/en-us/api.php?action=query&list=search&srsearch=%22released%20in%20patch%22%20Teemo%20Cosmetics&format=json
```

搜索结果只用于找到来源页面；打开页面核对原文确实指向目标皮肤及其首次发行补丁。未找到明确关联时保持 `globalReleaseVersion: null`。不要从 `release` 日期、相邻皮肤、版本日历或 Data Dragon 构建版本推算。保存格式按来源原文保留，例如 `V8.9` 或 `25.05`，不要去掉 `V` 或把版本转为数字。

## 字段与关联

`SkinData/data` 按英雄名称分组；每组有英雄数字 `id`，`skins` 中每款皮肤有 `release`，通常也有组内 `id`。例如 Aatrox 组的英雄 ID 为 `266`，Original 的组内皮肤 ID 为 `0`。有组内 ID 时，与 CommunityDragon 皮肤记录关联可计算 `championId * 1000 + 组内皮肤 ID`，但仍需逐条核对；缺少 ID 的记录不能靠中英文名称或列表位置猜测关联。

导入时至少检查：英雄 ID 和已提供的皮肤 ID 为有效整数、组合 ID 唯一、日期为真实的 `YYYY-MM-DD`、来源记录与 CommunityDragon 的 ID 对应。来源也可能写 `N/A`；2026-10-16 的模块检查中，2146 个 `release` 字段有 11 个为 `N/A`，另有 8 款皮肤缺少组内 ID。这些记录应单独报告，时间轴不得为它们编造日期或 ID。阶段/形态如无独立 Wiki 皮肤记录与日期，应附在所属皮肤下。

## 本地 JSON 快照

[正式服皮肤发布时间数据](../data/skin-release-dates.json)以 CD `latest` 正式版中属于正常英雄的皮肤 ID 为收录范围，以 `skinId` 为唯一身份；`skinName` 和 `skinNameZh` 分别使用 CD 英文和简体中文名称，Wiki 的收录或可用状态不决定是否入库。每条记录含 `championId`、`skinId`、`skinName`、`skinNameZh`、`globalReleaseDate`、`chinaReleaseDate`、`globalReleaseVersion` 和 `chinaReleaseVersion`。日期和版本号未知时均为 `null`；来源页面与修订信息不存入正式 JSON。

导入报告保存到 `.tmp/skin-release-report.json`：当前有 8 条 Wiki 无 ID、11 条 Wiki ID 不在 CD `latest`、40 条 CD Jade 合成皮肤不属于正常英雄皮肤范围。6 条 `Canceled` 记录没有正式服皮肤 ID；Crimson Akali 与 Unmasked Kayle 是已移除旧名称，现役对应皮肤分别为 `84002` 和 `10003`。这些记录不进入正式服日期表。报告每次导入重新生成，供人工核对。

## 运行边界

- Wiki 返回 403 时，预览的 `unavailableSources` 会提示日期来源缺失；不要把 CD 中未查到的直营服日期推断为发布日，也不要把这次预览当成已完成的 Wiki 日期回填。
- 把审核后的精简日期表保存为仓库快照；普通构建和浏览器页面不实时请求 Wiki。Wiki 内容是社区维护资料，模块结构或日期可能改变；更新时查看差异并在解析结构变化时失败报错。
- 页面上的日期应标为“League of Legends Wiki 发布时间”，不标为国服上线日期。两类日期的差异见[国服与直营服发布时间口径调研](国服与直营服发布时间口径调研.md)。

## 维护链路

目标数据源只收录 CommunityDragon `latest` 正式版中存在的正常英雄皮肤，并为每款皮肤分别保存直营服与国服的发布时间和版本号。Wiki 的 `release` 提供直营服日期；版本号优先采用对应地区官方版本公告中明确列出的首次推出皮肤，官方未覆盖时再搜索 Wiki 等来源并核对原文。国服公告正文的停机维护日期提供国服日期。来源没有明确值时保持空值。

1. 运行 `pnpm skin-dates:update` 预览，再追加 `--apply` 写入。预览在 `.tmp/` 生成报告和候选 JSON；只有重新读取后仍形成相同候选时，`--apply` 才会写入。常规更新读取 Wiki raw 模块与 CD `latest`；Wiki 返回 403 时仅用 CD 更新收录和名称，已有日期照旧。带 `--china-input` 的国服回填只读本地快照和输入。普通站点构建只读本地快照。
2. Wiki 源码可用时解析 Lua 表，以 CD 的正式服数字皮肤 ID 为数据范围，用 ID 关联 Wiki 日期；Wiki 独有和缺少 ID 的记录只进入人工核对报告。解析和日期校验失败时保持旧快照。
3. 与旧快照合并时只新增 CD 正式版皮肤、回填空的有效日期和版本号。已确认值保持原值；来源后续给出不同值时只报告差异。Wiki 标注的 Upcoming 或 Canceled 不阻止 CD 已收录皮肤回填日期。未来日期先报告，不作为已确认发布时间。日期通过 `--china-input <path>` 回填；版本通过 `--version-input <path>` 回填，数组每项按需包含 `globalReleaseVersion` 和/或 `chinaReleaseVersion`。两个字段均为来源原样字符串或 `null`。
4. Wiki 中不在 CD `latest` 的记录不进入正式服数据源，并在报告中保留其来源状态；无法确定身份的记录不得用名称或顺序猜 ID。
5. 生成新增、回填和冲突报告；全部校验通过后原子替换 JSON。页面按服务器分别使用对应的已确认日期。
