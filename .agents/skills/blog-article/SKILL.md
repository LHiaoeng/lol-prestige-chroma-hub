---
name: blog-article
description: 为《英雄联盟》《云顶之弈》或《英雄联盟手游》新增中英双语博客文章，涵盖元数据、Astro 页面、SEO、测试与构建验证。用户要求新增博文或改写新闻为站内文章时使用。
---

# 新增博客文章

为站点新增一篇可维护的中英双语文章，交付元数据、共享页面、中文路由包装页和 SEO。先判断游戏与文章类型，再按需查阅参考。

## 触发与前置

- 先读取 [术语表](../../../GLOSSARY.md) 的「内容聚合」「游戏归属」「文章类型」，再查本文涉及的术语与 `_Avoid_`。博客有选择地报道三款游戏的版本、活动、指南和专题；臻彩原画是核心主题之一，不是每篇文章的前提。
- 分别确定文章涉及的游戏和编辑类型。跨游戏文章可同时讨论多款游戏；标题、正文和来源须明确每条事实所属的游戏，不能因皮肤同名或共用原画就混用资料。新闻与活动核对对应游戏的官方来源。
- 提供 `lol.qq.com` 新闻链接时，先使用 `league-of-legends-cn-official-news` 或 `lol-news-detail` skill 获取标题、发布时间、正文和图片；不得凭链接猜正文。
- 撰写「璀璨臻彩召唤」（Brilliant Prestige Chroma Summoning，官方活动类型标识 `tendraws`）活动文章时，先使用 `tendraws-activity-list` skill 核对当期活动目录 ID、期号、完整活动链接、导航缩略图 URL、开放时间与奖池概率，并获取往期活动链接；不要凭记忆或 URL 规律猜测期号与链接。
- 撰写「幸运之门召唤」（Lucky Gate Summoning，官方活动 URL 标识 `prizewheel`）活动文章时，先使用 `lucky-gate-activity-list` skill 核对当期活动目录 ID、期号、完整活动链接、导航缩略图 URL 与开放时间，并获取往期活动链接；不要凭记忆或 URL 规律猜测期号与链接。
- 新建或修改文章前，读取[交付检查](references/checklist.md)。需要页面骨架或 SEO 示例时读[页面模板](references/page-template.md)；需要目录臻彩卡片时才读[臻彩网格](references/chroma-grid.md)。
- 心悦巅峰盛典、满额礼赠等需要复用往期臻彩奖励资料的活动，读取[往期场次流程](references/recurring-activity-past-sessions.md)。
- 仅在常青指南文章中读取 `src/blog/evergreen-guides.ts` 的维护要求；新闻/活动文章不登记为常青指南。

## 交付边界

每篇文章都需要：

1. 在 `src/blog/articles.ts` 头部登记符合 `BlogArticle` 类型的双语元数据，包括 `adEligible`。按公告核验发布日期，`publishedAt` 使用 `YYYY-MM-DD`（现有日期格式化函数只接受日期）；确认新文章在列表中的排序正确。
2. `src/pages/blog/{slug}.astro`，按 locale 渲染对应语言正文。向 `BaseLayout` 传入标题、描述、canonical、封面、`ogType="article"`、发布日期、更新日期、`locale` 和 `jsonLd`；文章提供 `BlogPosting` 与 `BreadcrumbList`。
3. `src/pages/zh-cn/blog/{slug}.astro` 只做包装：`import Article` 与 `<Article locale="zh-cn" />`。

### 内链与 FAQ

- 内链只有在能补充当前主题、核对资料或帮助读者继续查阅时才添加。非臻彩内容不默认链接臻彩文章；同一款游戏也不代表主题相关。没有合适的目标时，可以不加正文内链或旧文回链，不设数量配额。站点的上下篇导航照常渲染。
- 需要查找已有关联时读[内链地图](references/internal-links.md)，用 `localizedPath(locale, ...)` 保持链接语言一致。只在旧文读者确实受益且属于本次编辑范围时添加回链，地图仅记录实际新增的关系。
- 只有遇到读者可能提出、正文未充分解答的问题时才加 FAQ；不为放内链而凑问答。若有 FAQ，按 locale 从同一份 `faqEntries` 渲染可见问答和 `FAQPage.mainEntity`；没有 FAQ 就不输出 `FAQPage`。

条件交付：

- 常青指南：登记 `evergreenGuideMaintenance`，渲染 `ArticleMaintenance`，显示作者、来源、最后核验日期、纠错入口和两条相关指南；`modifiedTime` 与可见核验日期一致。常青指南仍须渲染 `BlogAdjacentNavigation`，与所有博客一致；维护组件不替代上下篇导航。
- 官网新闻/活动文章：保留官方 `sourceUrl`、官方来源链接和公告明确的时间/获取条件；不把未公布的概率、结束日期或可用性写成事实。
- 适用往期场次流程的活动：在奖励/结算章节之后插入往期场次表格，更新共享数据模块，不补改往期文章。
- 本地封面图：保存到 `public/img/blog/`，使用 `compress-image` skill 压到 1MB 以内；目录原画继续使用 `img.chromaart.lol` 路径，不复制远程图片。

## 元数据与页面结构

按编辑用途选择现有 `category`：资讯 `news`、指南 `guide`、分析 `analysis`、专题 `spotlight`。游戏名不填入 `category`，不为单篇文章新增游戏字段或筛选。标题和摘要要能独立说明文章价值，不把英文翻译腔带入中文。

图片必须有稳定的 `width`/`height`、描述性 `alt`、`data-alt-en`、`data-alt-zh`、`data-fallback`、`data-placeholder`；首图 `loading="eager"`，正文图 `loading="lazy"`。外部链接使用 `target="_blank" rel="noreferrer"`。

## 双语写作

- 英文和中文分别组织信息，不逐句翻译；两种语言都要完整表达同一组关键事实。
- 开头直接给结论或读者要解决的问题；小标题写具体信息；数字、日期、版本和获取限制优先于空泛形容。
- 避免模板化 AI 词和广告腔：英文少用 `delve`、`explore`、`comprehensive`、`seamless`、`robust`、`leverage`、`unlock`、`empower`；中文少用“此外”“至关重要”“深入探讨”“值得一提的是”“不可否认”。
- 中文正文不得保留英文术语括号标注（如『中国大陆服（China Server）』），用 `GLOSSARY.md` 的中文称呼直接替换；英文原词仅用于 JSON-LD `inLanguage`、`author` 等结构化字段和允许的专有名词（如 `LoL Chroma Art`、`QQ`、`LPL`）。
- 官网公告只支持公告明确的事实；活动规则有歧义时链接官方活动页并明确不确定性。

## 内容组件与样式边界

- 目录臻彩原画的大图说明可沿用文章自己的 `showcase`/`figure`，但目录卡片网格必须使用 `BlogChromaGrid` + `BlogPrestigeChromaCard`，接口和示例见 `references/chroma-grid.md`。
- 臻彩组件、目录数据和召唤活动流程仅用于对应的端游臻彩内容；其他游戏文章使用与主题匹配的资料和组件。
- 不在文章页面复制臻彩卡片 HTML、颜色圆点、图片回退、详情链接或 `.chroma-grid`/`.chroma-card-*` CSS。共享组件统一处理 3/6 列、移动端两列、`padding: 0`、颜色圆点、catalog 图片回退、双语 alt、详情链接与未收录奖励的占位卡。
- 文章页面只维护文章壳层、表格、FAQ、官方来源和该文章独有的布局。通用列表规则不得重新给 `.chroma-grid` 添加左内边距；共享网格使用更高优先级的 `padding: 0`。
- `BlogPrestigeChromaCard` 的 `chroma` 缺省时必须同时提供 `labelEn` 与 `labelZh`，用于公告提到但尚未进入目录的奖励；不要伪造详情链接。

## 测试与验证

按[交付检查](references/checklist.md)先跑相关测试，发布前再运行完整发布构建。测试关注双语路由、元数据、结构化数据和本篇适用的行为，不复制样式断言。报告实际验证结果，不绕过失败。
