---
name: "lucky-gate-activity-list"
description: "获取国服「幸运之门召唤」（Lucky Gate Summoning，官方活动 URL 标识 prizewheel）各期活动信息：完整活动链接、缩略图 URL、开放时间与奖池数据线索。当用户询问幸运之门召唤各期/往期活动、活动链接或缩略图，或撰写相关博客需要核对活动数据时调用。"
---

# 幸运之门召唤活动列表

获取国服限时活动系列「幸运之门召唤」（**Lucky Gate Summoning**，英文名以 `CONTEXT.md` 领域术语为准）的各期活动数据。**数据来源是腾讯官方的静态 JS 文件，不是 JSON API**，所有期页面共用同一份导航数据。

## 术语与标识：prizewheel 是什么

`prizewheel` **不是活动名称**，玩家在页面上看不到它；它只是腾讯为本系列活动 URL 分配的目录后缀：

- **领域名称（面向玩家）**：中文「幸运之门召唤」，英文 **Lucky Gate Summoning**（CONTEXT.md 定义，全站统一，勿另造译名）。
- **`prizewheel`（URL 技术后缀）**：本系列活动目录名均以 `prizewheel` 结尾（截至 2026-09 的 18 期无一例外），可作为目录 ID 的判定特征。
- **`actType` 不可用于判定系列**：与 tendraws 系列不同，本系列各期 `actInfo.js` 的 `actType` 并不统一——第202616期为 `"tendraws"`、第202618期为 `"blessingwish"`。判定系列归属看 nav.js 收录 + 目录 ID 以 `prizewheel` 结尾 + `actName` 交叉核对，不要用 `actType` 推断。

一期活动有三个并行标识，不要混用：

| 标识 | 示例 | 说明 |
|---|---|---|
| 活动目录 ID（`act` / `actNameZZ`） | `a202609139891prizewheel` | 活动页 URL 目录名，也是各数据文件路径的一部分 |
| 内部期序（`actName`） | 「幸运之门22期」 | 命名不统一：第202616期叫「幸运之门22期」，第202618期叫「门票抽奖24期」，仅供交叉核对 |
| 展示期号（`season`） | `202618` → 页面显示「第202618期」 | 年份 + 年内期序，正式数据以 nav.js 的 `season` 为准 |

关系与边界：

- 观测换算：内部期序 = season − 202594（202616 → 22期，202618 → 24期）。该关系仅基于两期观测，仅供交叉核对，正式数据以 nav.js 的 `season` 为准。
- 站内代码侧：文章 slug 前缀 `lucky-gate-`，后接主题与年月（如 `lucky-gate-ocean-song-202609`），无独立往期数据模块。

## 核心数据源（唯一权威列表）

```
https://lol.qq.com/act/a202601160002prizewheel/js/nav.js
```

- 该文件挂在 `a202601160002prizewheel`（第202602期）目录下，被所有期页面的 `js/adaptviewport.js` 动态加载。
- 内容为自执行函数 `setCommNav()`，内含硬编码数组 `commNavAllList`，每项结构与 tendraws 系列完全一致：

```js
{ act: "a202609139891prizewheel", endTime: 'October,11,2026 23:59:59', season: '202618' }
```

- `act`：活动目录 ID；`endTime`：活动结束时间（英文月份格式）；`season`：展示期号（显示为「第202618期」）。
- 文件为 GBK 编码，但 act / endTime / season 均为 ASCII，可直接用正则提取；主题文案「幸运之门召唤」固定写死，无需解码。
- **重要**：该数组每期由官方手工追加，**刚上线的最新一期可能还没被加进去**（见下文「最新期发现」）。
- 页面渲染逻辑：只显示 `endTime > 当前时间` 的期（即仍在进行中的其它期）；当前期通过页内变量 `var brilliantName = "{act}"` 匹配高亮（变量名与 tendraws 系列相同，属复用代码）。

## URL 构造规律

拿到活动目录 ID（如 `a202609139891prizewheel`）后：

| 内容 | URL 模式 |
|---|---|
| 活动页 | `https://lol.qq.com/act/{act}/index.html` |
| 导航缩略图 | `https://game.gtimg.cn/images/lol/act/a202601160002prizewheel/nav/{act}.png` |
| 导航样式 | `https://lol.qq.com/act/a202601160002prizewheel/css/nav-pc.css` |
| 活动配置 | `https://lol.qq.com/act/{act}/js/actInfo.js` |
| 随机皮肤池 | `https://lol.qq.com/act/{act}/js/skins-data.js` |

注意：

- 缩略图统一存在 `a202601160002prizewheel` 目录下；**最新一期在 nav.js 更新前，其缩略图可能 404**（可用 HTTP 状态码验证）。
- 首期目录 ID `a20260106prizewheel` 是「日期 + 后缀」的短格式，其余为 `a{YYYYMMDD}{6位数字}prizewheel`，两者都合法。

## 单期详情数据

需要某一期的开放时间、奖池线索时，抓取该期目录下的文件：

1. **`js/actInfo.js`**：`var actInfo = JSON.parse('...')`。**字段结构因期而异**，不要假设某期字段存在于所有期：
   - 通用字段：`sTime` / `eTime`（`YYYY-MM-DD HH:mm:ss`）、`actName`、`actNameZZ`（= 目录 ID）、`actId`、`pageUrl`。
   - 第202616期风格：`ext` 数组（`random_logo/emoji/color_complement` 补充包）+ `levelN: [{iProbabilityValue, type, ...}]` 分档概率。
   - 第202618期风格：无概率字段，改为 `shSkinConf` / `xyzcSkinConf` / `xyxdSkinConf` / `xdSkinConf` 四组 `{code, pid}` 奖池配置 + `FireworkPid` / `MythicPid`（神话皮肤道具 ID）。
   - 其余为 AMS 支付/道具 ID，一般无需使用。
2. **`js/skins-data.js`**：`var skinList = {"sj": [...]}`，随机皮肤池（数百条）。**字段与 tendraws 系列不同**：每条是 `{name, id}`，且文件为 UTF-8 编码，直接按 UTF-8 解码即可。
3. **活动页 HTML**（GBK 编码）：页面正文基本由图片构成，**奖池档位名称几乎不出现在 HTML 文本中**，从页面提取档位信息收益很低；核对奖池与档位名称以官方新闻公告或活动页图片为准。

## 最新期发现

nav.js 尚未收录的新期：

1. 从英雄联盟官网活动中心（lol.qq.com）搜索「幸运之门」获取当期链接，或使用浏览器访问官网活动列表。
2. 验证候选活动是否属于本系列且存在：请求 `https://lol.qq.com/act/{候选act}/js/actInfo.js`，返回 200、可解析即有效；**不要用 `actType` 判定系列**（见上文「术语与标识」），用目录 ID 是否以 `prizewheel` 结尾 + `actName` 交叉核对。
3. 目录 ID 中的日期段不可猜测，必须从官方链接或 nav.js 获取。

## 抓取要点

- Windows PowerShell 下 `curl` 是 `Invoke-WebRequest` 别名，须用 `curl.exe`。
- nav.js / actInfo.js / index.html 为 GBK 编码，PowerShell 读取需按 GBK（codepage 936）解码；skins-data.js 为 UTF-8：
  ```powershell
  $gbk = [System.Text.Encoding]::GetEncoding(936)
  $html = $gbk.GetString([System.IO.File]::ReadAllBytes($path))
  ```
- nav.js / actInfo.js / skins-data.js 均为公开静态资源，无需登录或鉴权。
- 数据仅用于资料核对与文章撰写；活动规则、奖池、时间以当期官方页面为准，不要把某期奖池、概率或档位结构沿用到其它期。
- 英文文案统一使用 Lucky Gate Summoning；与「璀璨臻彩召唤」（Brilliant Prestige Chroma Summoning，tendraws 系列）、「华彩秘宝·召唤」（Splendid Treasure Summoning，aprilpray 系列）是不同活动系列，勿混称（见 CONTEXT.md）。

## 参考：nav.js 已收录的期（2026-09 核对，以线上文件为准）

| 期号 | 目录 ID | endTime |
|---|---|---|
| 202601 | `a20260106prizewheel` | 2026-02-04 |
| 202602 | `a202601160002prizewheel` | 2026-02-15 |
| 202603 | `a202602048641prizewheel` | 2026-03-29 |
| 202604 | `a202602100948prizewheel` | 2026-03-29 |
| 202605 | `a202602278948prizewheel` | 2026-04-05 |
| 202606 | `a202603198452prizewheel` | 2026-04-19 |
| 202607 | `a202603277845prizewheel` | 2026-04-26 |
| 202608 | `a202604179841prizewheel` | 2026-05-17 |
| 202609 | `a202604299891prizewheel` | 2026-05-27 |
| 202610 | `a202605158641prizewheel` | 2026-06-14 |
| 202611 | `a202605291517prizewheel` | 2026-06-28 |
| 202612 | `a202606117610prizewheel` | 2026-07-15 |
| 202613 | `a202606264151prizewheel` | 2026-07-26 |
| 202614 | `a202607303912prizewheel` | 2026-08-30 |
| 202615 | `a202608134003prizewheel` | 2026-09-13 |
| 202616 | `a202608199962prizewheel` | 2026-09-20 |
| 202617 | `a202608277402prizewheel` | 2026-09-27 |
| 202618 | `a202609139891prizewheel` | 2026-10-11 |

endTime 为活动结束日 23:59:59；单期精确起止时间以该期 `actInfo.js` 的 `sTime`/`eTime` 为准。
