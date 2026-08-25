# LoL Chroma Art 品牌与搜索实体消歧设计

## 目标

将站点品牌从 `CHROMA ART` 更新为 `LoL Chroma Art`，在保留 `https://chromaart.lol` 域名、暗色数字画廊视觉和现有目录定位的前提下，与 `chromaart.com` 的艺术教育品牌形成清晰区分。

站点继续面向海外用户，以英文作为默认和主要索引语言；中文作为辅助语言保留，并为未来增加独立的多语言路由预留空间。

## 品牌体系

- 正式品牌名：`LoL Chroma Art`
- 定位语：`China-Exclusive Chroma Splash Art Archive`
- 中文定位：`英雄联盟中国服专属炫彩原画图鉴`
- 生产域名：`https://chromaart.lol`
- 图片域名：`https://img.chromaart.lol`

品牌名在所有语言中保持 `LoL Chroma Art`，不得翻译或恢复为单独的 `CHROMA ART`。视觉字标使用 `LoL CHROMA` 金色、`ART` 主文字白的双色样式；徽标与文字保持紧凑间距并作为一个完整品牌锁定组合出现。Header 与占位图必须保持一致。可索引文本、元数据和结构化数据使用正式拼写。

占位图沿用同一图形和双色关系，但作为低对比水印处理：徽标约 `20%`、字标约 `32%` 不透明度。该降级状态不得具有正式品牌展示位的视觉强度。

## 内容边界

`Chroma Splash Art` 对应“炫彩原画”，指为特定炫彩单独创作的原画；炫彩并不天然拥有独立的 Chroma Splash Art。

本站只收录拥有独立炫彩原画的特定炫彩，不应描述成完整的中国服炫彩目录，也不应暗示所有炫彩都有专属原画。

英文定义使用：

> A chroma splash art is a unique splash artwork created for a specific chroma. Most chromas reuse their base skin's splash art and do not have one of their own.

中文定义使用：

> 炫彩原画是为特定炫彩单独创作的原画；炫彩并不天然拥有独立的炫彩原画。

## 术语规则

| 中文概念 | 英文用法 | 使用位置 |
| --- | --- | --- |
| 炫彩 | `Chroma` | 通用产品类型和基础解释 |
| 臻彩 | `Prestige Chroma` | 分类标签、筛选项和详情资料 |
| 炫彩原画 | `Chroma Splash Art` | 站点主题、图片内容和通用 SEO |
| 臻彩原画 | `Prestige Chroma Splash Art` | 臻彩分类记录的标题和说明 |

`Prestige Chroma` 是本站对“臻彩”分类采用的规范英文译名，不代表 Riot Games 全球版本中的独立产品类型。内容首次解释该词时，应说明它是中国版本中的炫彩分类，并明确它不同于 `Prestige Skin`。

不得把整个站点或全部目录统称为 `Prestige Chroma Archive`。站点的内容类型是 `Chroma Splash Art`，`Prestige Chroma` 只是其中一个分类。

## 中国版本与运营关系

涉及地区范围时，正文使用 `in the Chinese version of League of Legends`；涉及运营关系时使用 `operated by Tencent`。

不得使用以下表达：

- `Tencent-created splash arts`，因为腾讯运营中国版本不等于所有原画均由腾讯直接创作；
- `distributed by Tencent`，因为本项目采用“由腾讯运营”作为更准确的关系描述；
- 暗示本站由 Riot Games 或腾讯运营、赞助或认可的表述。

About 页面和 Footer 应提供独立站声明：

> LoL Chroma Art is an independent fan archive and is not affiliated with or endorsed by Riot Games or Tencent.

## 首页品牌与 SEO 文案

首页品牌区使用：

```text
LoL Chroma Art
China-Exclusive Chroma Splash Art Archive
```

首页 SEO 标题使用：

```text
LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art
```

首页 H1 使用：

```text
League of Legends China-Exclusive Chroma Splash Arts
```

站点描述使用：

```text
Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.
```

中文辅助描述使用：

```text
探索由腾讯运营的《英雄联盟》中国版本中，为特定炫彩单独创作的原画。
```

SEO description 为纯文本，不包含链接。About 等可见正文可以在首次出现 Tencent 时提供外部参考链接。

## 详情页 SEO

通用详情页标题模板为：

```text
{Chroma Name} Chroma Splash Art | LoL Chroma Art
```

臻彩分类记录可以使用：

```text
{Chroma Name} Prestige Chroma Splash Art | LoL Chroma Art
```

描述必须基于记录数据自然生成，并说明该原画属于哪个炫彩和基础皮肤。通用句式为：

```text
View the unique splash art for {Chroma Name}, a chroma of {Base Skin} featured in the Chinese version of League of Legends.
```

分类为臻彩时可以补充 `Prestige Chroma`，但不能把它描述为传统 `Prestige Skin`。

## 结构化数据

首页继续使用 `WebSite` 和 `CollectionPage`。`WebSite` 的实体信息统一为：

```json
{
  "@type": "WebSite",
  "@id": "https://chromaart.lol/#website",
  "name": "LoL Chroma Art",
  "alternateName": "China-Exclusive Chroma Splash Art Archive",
  "url": "https://chromaart.lol/"
}
```

`CollectionPage` 通过 `isPartOf` 指向该 `WebSite`，并描述本站收录的是 selected chromas 的独立原画。

当前不新增 `Organization`。本站是独立资料站，使用 `Organization` 会增加被误解为 Riot Games、腾讯或其官方合作方的风险。

品牌名还必须同步用于：

- 页面标题后缀；
- `og:site_name`；
- Open Graph 和 Twitter 文案；
- Header、Footer 和 About 可见品牌；
- Sitemap 关联页面的品牌上下文；
- 所有站点级 JSON-LD。

## 多语言边界

英文继续作为默认静态内容和主要索引语言。中文通过现有客户端语言切换作为辅助内容，中英文暂时共用同一 URL。

当前不添加 `hreflang`，因为同一 URL 不能形成相互独立的语言版本。未来增加 `/zh/`、`/ja/` 或 `/ko/` 等独立路由时，再单独设计本地化 URL、Canonical、`hreflang` 和 `x-default`。

无论页面语言如何变化，品牌名始终为 `LoL Chroma Art`；定位语、说明、ARIA、Alt 和正文可以本地化。

## 文档优先级与迁移

本设计批准后覆盖历史 SEO 设计中以下规则：

- 品牌统一写作 `CHROMA ART`；
- 整个目录统一围绕 `Prestige Chroma` 命名。

历史 spec 和 plan 保留原文作为决策记录，不回改。实施时更新当前权威文档：

- `docs/frontend-design.md`；
- `docs/design-system.md`；
- `README.md`。

内部仓库名、数据文件名和使用 `prestige-chroma` 的源码标识暂不因品牌变更而重命名，除非它们直接生成用户可见或 SEO 内容。

## 验收标准

1. 可见品牌、SEO 元数据和结构化数据统一使用 `LoL Chroma Art`。
2. 定位语严格使用 `China-Exclusive Chroma Splash Art Archive`。
3. 站点描述明确限定为中国版本中特定炫彩的独立原画，并说明该版本由腾讯运营。
4. 页面不暗示所有炫彩均有独立原画。
5. `Prestige Chroma` 只用于“臻彩”分类，不作为整个站点的内容统称。
6. 页面明确区分 `Prestige Chroma` 与 `Prestige Skin`。
7. 页面不暗示本站与 Riot Games 或腾讯存在官方关系。
8. 英文默认索引和现有中英文共用 URL 的行为保持不变。
9. 现有目录、筛选、详情页、图片查看器和数据驱动 SEO 行为保持不变。
