---
name: lol-skin-release-dates
description: 维护正式服英雄皮肤发布时间与版本 JSON；以 CommunityDragon latest 皮肤 ID 为收录范围，Wiki 提供直营服日期，两地官方版本公告优先提供版本号，国服公告或百度百科提供国服日期。用于新增皮肤、回填或检查来源差异。
---

# 英雄皮肤发布时间

维护 `data/skin-release-dates.json`。以 CommunityDragon `latest` 正式版中能对应正常英雄的皮肤 ID 决定收录范围；英文 `skinName` 取 CD `default`，中文 `skinNameZh` 取 CD `zh_cn`，每次全量更新都刷新两种名称。默认皮肤 ID 的后三位为 `000`；英文名按英雄摘要的 `description` + `name` 拼接，中文名按 `name` + `description` 拼接。Wiki 的 `SkinData/data` 提供直营服日期，不作为命名来源；其 `release` 字段不含补丁版本。Wiki 缺失日期或将皮肤标为 Upcoming、Canceled，均不改变 CD 的收录结果。版本号先查直营服 Riot 官方补丁说明和国服官网版本公告，确认版本号与首次推出的皮肤清单对应；官方公告未覆盖时再网络搜索 Wiki 等来源并核对原文。国服公告正文的停机维护日期用于 `chinaReleaseDate`；公告未覆盖的日期可按完整中文皮肤名检索百度百科并人工核对。来源没有明确日期或版本时保留 `null`。已填值是权威值，本 skill 只添加皮肤和回填空字段。

维护脚本存放于本 skill 的 `scripts/`；通过仓库命令 `pnpm skin-dates:update` 调用。

## 默认执行

用户只指定本 skill 或要求维护数据时，默认直接完成全量更新和可确认的国服日期回填，并汇报结果；不只讲解命令，也不要求用户提供脚本参数。用户明确限定直营服、国服或某个英雄时，按指定范围执行。

1. 阅读 [Wiki API 与口径](../../../docs/League%20of%20Legends%20Wiki%20发布时间%20API.md)，运行 `pnpm skin-dates:update` 预览。脚本并行获取 Wiki、CD 英文/中文皮肤名和英雄摘要；报告与候选 JSON 写入 `.tmp/skin-release-report.json`、`.tmp/skin-release-candidate.json`。
2. 自行检查报告。CD 正式版决定收录；`wikiWithoutId`、`wikiWithoutCd`、`cdWithoutWiki`、`futureWikiDates`、`existingDateConflicts` 如实汇报，不猜 ID 或日期。`disappearedFromCd` 会阻止本轮写入并要求人工核对。
3. 分别处理空日期和空版本字段。直营服版本先查 [Riot 官方补丁说明](https://www.leagueoflegends.com/en-us/news/game-updates/)：以标题的补丁号和正文的首次推出皮肤清单（如 Patch Highlights、Upcoming Skins）精确匹配目标皮肤，返场、商店轮换或平衡改动中的提及不能当作首次发行。国服按[官网版本公告列表入口](../../../docs/国服版本公告列表接口.md)核对公告标题/正文的版本号与皮肤清单；维护日期填入 `chinaReleaseDate`，公告发布日期不代替维护日期。官方公告未覆盖的版本再网络搜索 [Wiki 皮肤页或补丁页](../../../docs/League%20of%20Legends%20Wiki%20发布时间%20API.md)等来源，只有原文明确关联目标皮肤与首次发行补丁时才填入。国服日期公告无法覆盖时可查百度百科并确认 PC 国服归属。不要从发布日期、Data Dragon 构建号或相邻皮肤推断版本。版本号按来源原样保存为字符串（例如 `V8.9`、`25.05`），有歧义或无证据时留空。把确认的版本写入临时数组 `{ "skinId": 1000, "globalReleaseVersion": "V8.9", "chinaReleaseVersion": "12.3" }`，省略未确认的地区字段，通过 `--version-input <path>` 预览。此模式只读本地数据，不请求 Wiki 或 CD。
4. 检查候选和报告后应用无阻塞的预览结果：全量更新运行 `pnpm skin-dates:update --apply`；日期输入使用 `--china-input <path>`；版本输入使用 `--version-input <path>`，均以相同参数再次加 `--apply`。脚本会确认来源和本地数据仍与预览一致，否则重新预览。最后运行 `pnpm data:validate`，汇报新增、日期/版本回填数量和待核对项。已有值冲突只报告并保留旧值；不自行修改已有日期或版本。

普通构建不联网更新日期或版本。每条皮肤记录含 `globalReleaseDate`、`chinaReleaseDate`、`globalReleaseVersion`、`chinaReleaseVersion`，未知值为 `null`。皮肤阶段或形态只在拥有独立正式服皮肤 ID 时成为本数据源中的记录。来源差异及字段说明以数据文件和上述 Wiki API 文档为准。
