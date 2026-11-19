---
name: blog-article
description: 为英雄联盟、云顶之弈或英雄联盟手游新增双语博文，或将新闻改写为站内文章。
---

# 新增博客文章

## 触发与前置

- 先读取 [术语表](../../../GLOSSARY.md) 的「内容聚合」「游戏归属」「文章类型」，再查本文涉及的术语与 `_Avoid_`。博客有选择地报道三款游戏的版本、活动、指南和专题；臻彩原画是核心主题之一，不是每篇文章的前提。
- 分别确定文章涉及的游戏和编辑类型。跨游戏文章可同时讨论多款游戏；标题、正文和来源须明确每条事实所属的游戏，不能因皮肤同名或共用原画就混用资料。新闻与活动核对对应游戏的官方来源。
- 提供 `lol.qq.com` 新闻链接时，使用[官网新闻技能](../league-of-legends-cn-official-news/SKILL.md)获取原文；需要核验实际页面时使用[浏览器核验](../lol-news-detail/SKILL.md)。
- 撰写「璀璨臻彩召唤」（Brilliant Prestige Chroma Summoning，官方活动类型标识 `tendraws`）活动文章时，先使用 `tendraws-activity-list` skill 核对当期活动目录 ID、期号、完整活动链接、导航缩略图 URL、开放时间与奖池概率，并获取往期活动链接；不要凭记忆或 URL 规律猜测期号与链接。
- 撰写「幸运之门召唤」（Lucky Gate Summoning，官方活动 URL 标识 `prizewheel`）活动文章时，先使用 `lucky-gate-activity-list` skill 核对当期活动目录 ID、期号、完整活动链接、导航缩略图 URL 与开放时间，并获取往期活动链接；不要凭记忆或 URL 规律猜测期号与链接。
- 新建或修改文章前，读取[交付检查](references/checklist.md)。需要页面骨架或 SEO 示例时读[页面模板](references/page-template.md)；需要目录臻彩卡片时才读[臻彩网格](references/chroma-grid.md)。
- 心悦巅峰盛典、满额礼赠等需要复用往期臻彩奖励资料的活动，读取[往期场次流程](references/recurring-activity-past-sessions.md)。
- 仅在常青指南文章中读取 `src/blog/evergreen-guides.ts` 的维护要求；新闻/活动文章不登记为常青指南。

## 交付边界

元数据、共享页面、中文包装页、本地封面与测试均为应纳入版本控制的文章文件。路由、SEO 和验收标准见交付检查。

### 内链与 FAQ

- 内链只有在能补充当前主题、核对资料或帮助读者继续查阅时才添加。非臻彩内容不默认链接臻彩文章；同一款游戏也不代表主题相关。没有合适的目标时，可以不加正文内链或旧文回链，不设数量配额。站点的上下篇导航照常渲染。
- 需要查找已有关联时读[内链地图](references/internal-links.md)，用 `localizedPath(locale, ...)` 保持链接语言一致。只在旧文读者确实受益且属于本次编辑范围时添加回链，地图仅记录实际新增的关系。
- 只有遇到读者可能提出、正文未充分解答的问题时才加 FAQ；不为放内链而凑问答。

条件交付：

- 常青指南的 `modifiedTime` 与可见核验日期一致。官网新闻和活动保留官方 `sourceUrl`、可见来源与公告明确的时间和获取条件。
- 本地封面图：按[封面图规范](../compress-image/SKILL.md)保存。

## 元数据与页面结构

按编辑用途选择现有 `category`：资讯 `news`、指南 `guide`、分析 `analysis`、专题 `spotlight`。游戏名不填入 `category`，不为单篇文章新增游戏字段或筛选。标题和摘要要能独立说明文章价值，不把英文翻译腔带入中文。

## 双语写作

- 英文和中文分别组织信息，不逐句翻译；两种语言都要完整表达同一组关键事实。
- 开头直接给结论或读者要解决的问题；小标题写具体信息；数字、日期、版本和获取限制优先于空泛形容。
- 避免模板化 AI 词和广告腔：英文少用 `delve`、`explore`、`comprehensive`、`seamless`、`robust`、`leverage`、`unlock`、`empower`；中文少用“此外”“至关重要”“深入探讨”“值得一提的是”“不可否认”。
- 中文正文不得保留英文术语括号标注（如『中国大陆服（China Server）』），用 `GLOSSARY.md` 的中文称呼直接替换；英文原词仅用于 JSON-LD `inLanguage`、`author` 等结构化字段和允许的专有名词（如 `LoL Chroma Art`、`QQ`、`LPL`）。
- 官网公告只支持公告明确的事实；活动规则有歧义时链接官方活动页并明确不确定性。

目录卡片仅用于对应端游臻彩内容，按[臻彩网格](references/chroma-grid.md)传入数据。大图说明可用文章自己的 showcase 或 figure。
