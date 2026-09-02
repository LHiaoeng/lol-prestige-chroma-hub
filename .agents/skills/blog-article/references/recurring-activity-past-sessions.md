# 周期性活动：往期场次表格

当新增的博客文章属于一个定期举办的系列活动（如腾讯心悦巅峰盛典、满额礼赠、云顶之弈某系列主题）时，必须在奖励/结算章节之后、资格/FAQ 之前插入"往期活动"模块，让同一活动系列的各期互相链接。

## 识别条件

- 活动有稳定的系列名称和期号规则（如 `joyclubgala{YYYYMM}` → 期号 202606、202607、202608…）。
- 目录下已存在至少一篇同系列文章；或新建一期后，预期后续还会有同系列文章。
- 每期都有独立的统计窗口、奖励臻彩和活动 URL，适合结构化复用。

## 操作流程

1. **检查是否已有数据模块**：查看 `src/domain/` 下是否存在对应活动的文件（如 `joy-club-gala.ts`）。没有则新建。
2. **追加当前期数据**：在数据模块中追加当前 session 的记录（sessionId、eventUrl、articleSlug、windowStart/End、rewardHeroId、rewardSkinNameEn、rewardChromaNameEn）。
3. **更新本期文章页面**：在 frontmatter 引入数据模块，过滤掉当前期并按期号从大到小排序，渲染表格。
4. **不修改往期文章**：往期文章不要求补此模块，只保证下一篇新文章能继承。

## 数据模块模板

`src/domain/joy-club-gala.ts`（以心悦巅峰盛典为例）：

```ts
export interface JoyClubPeakGalaSession {
  sessionId: string;           // e.g. "202608"
  eventUrl: string;            // 官方活动页
  articleSlug: string;         // 博客 slug
  windowStart: string;         // ISO 日期
  windowEnd: string;
  rewardHeroId: string;
  rewardSkinNameEn: string;    // 原皮肤英文名，用于 catalog 查找
  rewardChromaNameEn: string;  // 臻彩英文名
}

export const joyClubPeakGalaSessions: readonly JoyClubPeakGalaSession[] = [
  { sessionId: '202606', … },
  { sessionId: '202607', … },
  { sessionId: '202608', … }, // 按 sessionId 从小到大排列
];
```

新增一期时 append 到数组末尾；渲染时在文章页面 filter + sort 处理。

## 文章页面用法

frontmatter：

```ts
import { joyClubPeakGalaSessions } from '../../domain/joy-club-gala';

const currentSessionId = '202608';
const sessionChromas = joyClubPeakGalaSessions
  .filter((s) => s.sessionId !== currentSessionId)
  .sort((a, b) => b.sessionId.localeCompare(a.sessionId))
  .map((s) => ({
    session: s,
    chroma: catalog.find(
      (item) => item.heroId === s.rewardHeroId
            && item.skinNameEn === s.rewardSkinNameEn
            && item.nameEn === s.rewardChromaNameEn,
    ),
  }));
```

英文版表格（放在 Rewards section 之后）：

```html
<section class="gala-sessions">
  <h2>Past Peak Gala sessions</h2>
  <div class="gala-table-wrapper">
    <table class="gala-table">
      <thead><tr><th>Session</th><th>Counting window</th><th>Reward chroma</th><th>Article</th></tr></thead>
      <tbody>
        {sessionChromas.map(({ session, chroma }) => {
          const chromaUrl = chroma ? localizedPath(locale, `/chromas/${chroma.slug}/`) : '#';
          const articleUrl = localizedPath(locale, `/blog/${session.articleSlug}/`);
          return <tr>
            <td class="gala-col-session">{session.sessionId}</td>
            <td class="gala-col-window">{session.windowStart.replace(/-/g, '/')}–{session.windowEnd.replace(/-/g, '/')}</td>
            <td>{chroma ? <a href={chromaUrl}>{chroma.nameEn}</a> : <em>Unknown reward</em>}</td>
            <td class="gala-col-link"><a href={articleUrl}>Read</a></td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>
</section>
```

中文版表头和正文改用中文术语（"往期巅峰盛典"、"期号"、"统计窗口"、"奖励臻彩"、"查看"，期号显示为 "第 {session.sessionId} 期"）。

## 样式片段

与项目内 `.leaderboard-table` 风格保持一致，放在文章 `<style is:global>` 块中：

```css
.gala-sessions{margin-top:32px}
.gala-table-wrapper{overflow-x:auto;-webkit-overflow-scrolling:touch}
.gala-table{width:100%;border-collapse:collapse;font-size:.96rem}
.gala-table th{text-align:left;color:var(--muted);font-weight:600;font-size:.78rem;letter-spacing:.06em;padding:0 16px 12px;border-bottom:1px solid var(--line)}
.gala-table td{padding:14px 16px;color:#c7cad4;border-bottom:1px solid var(--line)}
.gala-table tbody tr:last-child td{border-bottom:none}
.gala-table tbody tr:hover td{background:#15182a}
.gala-table a{text-decoration:none}
.gala-table a:hover{text-decoration:underline}
.gala-col-session{width:112px;color:var(--gold);font-family:Georgia,"Noto Serif SC",serif;font-weight:700;white-space:nowrap}
.gala-col-window{width:160px;color:var(--muted);font-size:.88rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.gala-col-link{width:64px;text-align:right}
.gala-col-link a{font-size:.88rem}

@media(max-width:767px){
  .gala-table th,.gala-table td{padding:10px 12px;font-size:.88rem}
  .gala-col-session{width:100px}
  .gala-col-window{width:auto;white-space:normal}
}
```

## 约束

- 数据模块的 `sessionId` 必须可按字符串字典序比较且等于时间序（如 `"202606"` < `"202607"`），这样 `localeCompare` 即可排序。
- `rewardHeroId`、`rewardSkinNameEn`、`rewardChromaNameEn` 三字段组合必须在 `catalog` 中唯一定位一个臻彩；查找失败时文章页面应 throw，不要静默渲染空行。
- 表头列数与 `<td>` 数量必须一致；移动端表格允许横向滚动，不强制折行。
- 同一页面只维护一份数据模块引用；不要在文章页面内硬编码同一活动系列的事实。
