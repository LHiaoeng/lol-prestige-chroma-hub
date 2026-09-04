---
name: "tendraws-activity-list"
description: "获取国服「璀璨臻彩召唤」（Brilliant Prestige Chroma Summoning，官方活动类型标识 tendraws）各期活动信息：完整活动链接、缩略图 URL、开放时间、奖池与概率。当用户询问璀璨臻彩召唤各期/往期活动、活动链接或缩略图，或撰写相关博客需要核对活动数据时调用。"
---

# 璀璨臻彩召唤活动列表

获取国服限时活动系列「璀璨臻彩召唤」（**Brilliant Prestige Chroma Summoning**，英文名以 `CONTEXT.md` 领域术语为准）的各期活动数据。**数据来源是腾讯官方的静态 JS 文件，不是 JSON API**，所有期页面共用同一份导航数据。

## 术语与标识：tendraws 是什么

`tendraws` **不是活动名称**，玩家在页面上看不到它；它是腾讯为该活动系列分配的内部技术标识：

- **领域名称（面向玩家）**：中文「璀璨臻彩召唤」，英文 **Brilliant Prestige Chroma Summoning**（CONTEXT.md 定义，全站统一，勿另造译名）。
- **`tendraws`（技术标识）**：腾讯内部的活动类型码。每期 `js/actInfo.js` 里 `"actType":"tendraws"` 是判定某活动属于本系列的权威依据；它同时被用作官网活动目录和静态资源的 URL 关键字。

一期活动有三个并行标识，不要混用：

| 标识 | 示例 | 说明 |
|---|---|---|
| 活动目录 ID（`act` / `actNameZZ`） | `a202608077548tendraws34` | 活动页 URL 目录名，也是各数据文件路径的一部分 |
| 内部期序 | 「璀璨臻彩34期」（actName 中） | 等于目录名里 `tendraws{N}` 的序号 N |
| 展示期号（`season`） | `202619` → 页面显示「第202619期」 | 年份 + 年内期序 |

关系与边界：

- 展示期号与内部期序的观测换算：年内期序 = N − 15（`tendraws16` = 第202601期，`tendraws34` = 第202619期，`tendraws35` = 第202620期）。该偏移仅用于交叉核对，正式数据以 nav.js 的 `season` 为准。
- **目录名不一定包含 tendraws**：第202611期目录是 `a20260506vuzq`（URL 无 tendraws 字样），但其 `actInfo.js` 中 `actType` 仍为 `tendraws`、`actName` 为「璀璨臻彩26期自助配置」。因此判定系列归属看 `actType`，不要用 URL 是否含 tendraws 推断。
- 站内代码侧：往期数据模块为 `src/domain/brilliant-summon.ts`（`brilliantSummonSessions`），文章 slug 前缀 `prestige-chroma-summon-`。

## 核心数据源（唯一权威列表）

```
https://lol.qq.com/act/a20260109tendraws17/js/nav.js
```

- 该文件挂在 `a20260109tendraws17`（第202602期）目录下，被所有期页面的 `js/adaptviewport.js` 动态加载。
- 内容为自执行函数 `setCommNav()`，内含硬编码数组 `commNavAllList`，每项结构：

```js
{ act: "a202608077548tendraws34", endTime: 'September,6,2026 23:59:59', season: '202619' }
```

- `act`：活动目录 ID；`endTime`：活动结束时间（英文月份格式）；`season`：展示期号（显示为「第202619期」）。
- 文件为 GBK 编码，但 act / endTime / season 均为 ASCII，可直接用正则提取；主题文案「璀璨臻彩召唤」固定写死，无需解码。
- **重要**：该数组每期由官方手工追加，**刚上线的最新一期可能还没被加进去**（见下文「最新期发现」）。
- 页面渲染逻辑：只显示 `endTime > 当前时间` 的期（即仍在进行中的其它期，不是"往期"）；当前期通过页内变量 `var brilliantName = "{act}"` 匹配高亮。

## URL 构造规律

拿到活动目录 ID（如 `a202608077548tendraws34`）后：

| 内容 | URL 模式 |
|---|---|
| 活动页 | `https://lol.qq.com/act/{act}/index.html` |
| 导航缩略图 | `https://game.gtimg.cn/images/lol/act/a20260109tendraws17/nav/{act}.png` |
| 导航样式 | `https://lol.qq.com/act/a20260109tendraws17/css/nav-pc.css` |
| 活动配置 | `https://lol.qq.com/act/{act}/js/actInfo.js` |
| 随机皮肤池 | `https://lol.qq.com/act/{act}/js/skins-data.js` |

注意：

- 缩略图统一存在 `a20260109tendraws17` 目录下；**最新一期在 nav.js 更新前，其缩略图可能 404**（可用 HTTP 状态码验证）。
- 期号与目录序号的换算见上文「术语与标识」，不要凭 `tendraws{N}` 直接猜展示期号。

## 单期详情数据

需要某一期的开放时间、奖池、概率时，抓取该期目录下的文件：

1. **`js/actInfo.js`**：`var actInfo = JSON.parse('...')`，关键字段：
   - `sTime` / `eTime`：开放与结束时间（`YYYY-MM-DD HH:mm:ss`）
   - `actType`（系列归属，应为 `tendraws`）、`actName`、`actNameZZ`（= 目录 ID）、`actId`
   - `level0Probability`～`level7Probability`：各档位中奖概率（%），level0 为特等奖
   - 其余为 AMS 支付/道具 ID，一般无需使用。
2. **`js/skins-data.js`**：`var skinList = {'sj': [...]}`，三等奖随机皮肤池（约 500+ 条），每条含 `skinName`、`iPackageId`、`skinInstanceId`。
3. **活动页 HTML**（GBK 编码）：特等奖/一等奖的自选臻彩**写死在 HTML** 中（`.gift-name` / `.tit-grade` 文案），例如第202620期为「灵魂莲华 阿卡丽 朝花」「斗魂觉醒 格温 狡之魂焰」。PowerShell 读取需按 GBK（codepage 936）解码：
   ```powershell
   $gbk = [System.Text.Encoding]::GetEncoding(936)
   $html = $gbk.GetString([System.IO.File]::ReadAllBytes($path))
   ```

## 最新期发现

nav.js 尚未收录的新期（如第202620期 `a202609047293tendraws35`）：

1. 从英雄联盟官网活动中心（lol.qq.com）搜索「璀璨臻彩召唤」获取当期链接，或使用浏览器访问官网活动列表。
2. 验证候选活动是否属于本系列且存在：请求 `https://lol.qq.com/act/{候选act}/js/actInfo.js`，返回 200、可解析且 `"actType":"tendraws"` 即有效。
3. 目录 ID 通常形如 `a{YYYYMMDD}{4位数字}tendraws{序号}`，序号逐期 +1，但日期段不可猜测、且存在 `vuzq` 这类不含 tendraws 的例外，必须从官方链接获取。

## 抓取要点

- Windows PowerShell 下 `curl` 是 `Invoke-WebRequest` 别名，须用 `curl.exe`。
- nav.js / actInfo.js / skins-data.js 均为公开静态资源，无需登录或鉴权。
- 数据仅用于资料核对与文章撰写；活动规则、奖池、时间以当期官方页面为准，不要把某期概率或自选臻彩沿用到其它期。
- 英文文案统一使用 Brilliant Prestige Chroma Summoning；与「幸运之门召唤」（Lucky Gate Summoning，prizewheel 系列）、「华彩秘宝·召唤」（Splendid Treasure Summoning，aprilpray 系列）是不同活动系列，勿混称（见 CONTEXT.md）。

## 参考：nav.js 已收录的期（2026-09 核对，以线上文件为准）

第202601期 `a20260101tendraws16` 起，至第202619期 `a202608077548tendraws34`（endTime 2026-09-06）；第202620期为 `a202609047293tendraws35`（2026-09-01 ～ 2026-10-04，nav.js 尚未收录）。
