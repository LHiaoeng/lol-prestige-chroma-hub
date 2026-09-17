# AdSense 低价值内容整改规格

## Problem Statement

当前站点以中英双语图鉴详情页为主，页面数量多但独特文本较少，原创内容、编辑责任与来源说明不足，因而被 AdSense 判定为“低价值内容”。

## Solution

保留图鉴的查询价值与首页、博客广告，但将图鉴详情页明确定位为无广告参考资料；收敛搜索索引范围，补齐编辑可信度信息，并发布六篇中英双语原创常青指南。完成后通过发布构建统一审计，再申请抓取和 AdSense 复审。

## User Stories

1. 作为图鉴访客，我希望继续通过图鉴首页查找臻彩，以便快速进入所需资料。
2. 作为图鉴详情页访客，我希望页面专注于参考资料且不展示广告，以便清楚阅读条目信息。
3. 作为博客读者，我希望获得具有独立价值的原创指南，以便理解臻彩而不只是查看结构化字段。
4. 作为 Global Server 玩家，我希望准确理解 China Server、臻彩和中国服专属炫彩原画，以便避免将不同服务器体系的概念混淆。
5. 作为读者，我希望查看作者、编辑原则、资料来源和纠错方式，以便判断内容是否可信。
6. 作为搜索用户，我希望从索引中进入具有独立价值的页面，以便减少遇到内容贫乏页面的机会。
7. 作为广告审核方，我希望只在图鉴首页和博客页面看到广告，以便确认广告范围清晰且一致。
8. 作为站点维护者，我希望通过一次发布构建检查全部整改边界，以便在申请复审前发现回退。

## Implementation Decisions

- 所有中英双语图鉴详情页设为 `noindex`，并从 sitemap 移除。
- 图鉴首页可以展示广告；图鉴详情页不展示广告。
- 除图鉴首页外，广告允许出现在博客列表页和全部标记 `adEligible: true` 的博客文章；图鉴详情页及其他资料页不展示广告。
- 广告位不预留固定高度、边框或额外留白；广告脚本未加载时不产生占位空间，仅保留审计所需的 `data-ad-boundary` 标记。
- 删除或修复返回空白内容但状态为 200 的路由。
- 新增中英双语作者、编辑原则、资料来源和纠错说明；作者署名统一为“LoL Chroma Art 编辑团队”（英文 `LoL Chroma Art Editorial Team`），不附带个人笔名。
- 编辑可信度信息合并进 `/about/` 与 `/zh-cn/about/`（不再单独维护 `/editorial-policy/`），进入 sitemap、不设 `noindex` 且不承载广告。
- 常青指南通过 `ArticleMaintenance` 组件渲染作者、资料来源、最后核验日期、纠错入口和两条相关指南内链；作者字段链接到 `/about/`。
- 发布七篇中英双语原创常青指南，包括 `what-is-league-of-legends`、`what-are-chroma-skins`、`what-are-prestige-chromas`、`kaisa-prestige-chroma`、`champion-most-prestige-chromas`、`champions-without-prestige-chroma` 和 `brilliant-prestige-chroma-summoning-guide`。
- 术语遵循项目领域文档：China Server 是中国大陆服，Global Server 是拳头直营服，Server Region 是游戏服务器内的大区；国服属于 LPL 电竞赛区，但游戏服务器与电竞赛区是不同概念。
- `臻彩` 是 China Server 概念，英文使用 `Prestige Chroma`；不使用“普通炫彩”概念。
- 面向非 China Server 玩家解释时，可使用“中国服专属炫彩原画（China-Exclusive Chroma Splash Art）”。

## Testing Decisions

- 单一最高价值测试缝为 `pnpm release:build` 的产物审计。
- 审计应覆盖 `noindex`、sitemap、广告边界、可信度页面、中英双语路由、空白 HTML、敏感部署产物和必备静态页面。
- 审计应拒绝以下情况：图鉴详情页缺少 `noindex` 或出现广告、广告位缺少显式 `data-ad-boundary` 边界、广告出现在未授权路径、博客文章未标记 `adEligible: true` 却渲染广告、sitemap 含图鉴详情页、静态产物包含 `prestige-chromas.json` 或 `.map` 等敏感文件、双语页面缺少中文对应产物。
- 测试只验证用户、搜索引擎和广告审核方可观察到的最终产物，不绑定页面内部实现。
- 沿用现有发布构建、SEO 产物审计和博客功能测试模式，不新增更低层的重复测试缝。

## Out of Scope

- 为所有图鉴详情页补写长篇内容。
- 改变图鉴数据源或移除图鉴功能。
- 自动部署、自动申请抓取或自动提交 AdSense 复审。

## Further Notes

全部整改上线后，先请求搜索引擎重新抓取；确认新索引边界生效后，再提交 AdSense 复审。
