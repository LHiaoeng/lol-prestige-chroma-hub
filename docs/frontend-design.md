# CHROMA ART 前端设计文档

> 文档状态：当前实现的权威维护说明  
> 基线日期：2026-07-19  
> 适用项目：`lol-prestige-chroma-hub`

## 1. 文档定位

本文面向后续开发者，说明 CHROMA ART 当前前端的设计目标、页面结构、组件边界、响应式行为、浏览器端数据流和不可回退的质量约束。

发生冲突时采用以下优先级：

1. 当前工作区中可运行、可验证的代码；
2. 本文记录的设计契约；
3. `docs/design-system.md` 中的视觉规范；
4. `docs/superpowers/specs/` 和 `docs/superpowers/plans/` 中的历史决策与实施记录；
5. 早期总体方案文档。

历史文档可能包含已经放弃的 D1、Worker 搜索 API 或旧页面结构设想，不能直接视为现有能力。

## 2. 产品与体验目标

CHROMA ART 是面向公众的《英雄联盟》中国服务器独家臻彩原画图鉴。前端承担以下职责：

- 用原画优先的暗色画廊界面展示臻彩目录；
- 提供可分享、可索引的静态详情页；
- 支持名称、英雄、版本、分类、状态和排序筛选；
- 支持英文与中文即时切换；
- 在桌面端保持信息完整常显，在手机端压缩导航和次级信息；
- 在图片源失效、无筛选结果或脚本异常时提供明确降级；
- 保持少依赖、静态优先和可由数据持续扩展。

当前英文术语统一使用 `Prestige Chroma`。它表示具有独立原画的中国服务器专属皮肤炫彩，不应描述为传统 `Prestige Skin`。

## 3. 技术架构

### 3.1 技术栈

- Astro 7：静态页面、组件和页面级样式；
- TypeScript：领域模型、目录查询、客户端交互和 SEO 生成；
- 原生 HTML/CSS/JavaScript：表单、`details`、`dialog`、History API 和响应式行为；
- Vitest：领域逻辑、客户端逻辑、构建契约和响应式契约；
- Wrangler/Cloudflare：本地生产预览及部署目标。

项目不使用 React、Vue 或大型组件库。添加前端依赖前，应证明原生平台能力无法满足需求。

### 3.2 渲染模型

```text
data/prestige-chromas.json
        ↓ 构建期解析与校验
src/data/catalog.ts
        ├─→ Astro 静态首页首批内容
        ├─→ Astro 为每条记录生成详情页
        ├─→ 首页嵌入精简浏览器目录
        └─→ SEO、Sitemap、相关推荐和筛选选项

浏览器加载首页
        ↓
browser-app.ts 读取嵌入目录
        ↓
本地筛选、排序、分页、URL 同步和卡片重绘
```

当前筛选完全在浏览器内完成，不依赖 D1 或远程搜索 API。首页初始 HTML 直接渲染前 24 条记录；JavaScript 启动后根据 URL 查询参数重新计算列表。

### 3.3 渐进增强边界

- 页面标题、正文、首页首批卡片、详情字段、导航和 SEO 元数据在静态 HTML 中存在；
- 筛选、分页、语言持久化、图片回退、图片查看器和菜单外部关闭由脚本增强；
- 不应为了交互便利，把主要可索引内容改成纯客户端渲染；
- 客户端脚本失败时，用户仍应能浏览默认首页卡片并进入详情页。

## 4. 信息架构与路由

| 路由 | 作用 | 主要内容 |
| --- | --- | --- |
| `/` | 首页和完整目录 | Hero、筛选、状态、卡片、分页 |
| `/chromas/{slug}/` | 规范详情页 | 原画、完整资料、外部操作、相关推荐 |
| `/chromas/{skinId}/` | 数字兼容入口 | 与对应规范详情页相同，Canonical 指向描述性 slug |
| `/about/` | 概念说明 | 中英文介绍、示例原画、获取与更新说明 |
| `/404/` | 未找到状态 | 错误说明和返回目录入口 |
| `/sitemap.xml` | 搜索引擎入口 | 页面及详情原画索引 |
| `/robots.txt` | 抓取规则 | Sitemap 和抓取声明 |

页面顶部统一使用 `BaseLayout.astro`。品牌链接返回首页，桌面导航提供 About 和语言切换；手机使用语言切换与汉堡菜单，菜单当前仅包含 About。

## 5. 视觉语言

### 5.1 设计方向

整体风格是“暗色数字画廊”：背景负责衬托原画，金色只用于品牌和关键交互，不以大面积装饰抢夺作品视觉层级。

标题采用 Georgia 与 `Noto Serif SC` 形成典藏感；界面文字采用 Inter、苹方和微软雅黑的系统回退。正文和控制项保持清晰、克制，避免游戏客户端式的高密度装饰。

### 5.2 核心设计变量

变量定义在 `src/styles/global.css`：

| 变量 | 当前值 | 用途 |
| --- | --- | --- |
| `--bg` | `#090b15` | 页面主背景 |
| `--panel` | `#111526` | 卡片和信息面板 |
| `--panel2` | `#171c31` | 弹出菜单等提升层级 |
| `--text` | `#f4f0e6` | 主文字 |
| `--muted` | `#999fb3` | 次级文字和字段标签 |
| `--gold` | `#d7b56d` | 唯一主题强调色 |
| `--line` | `#2b3045` | 边框和分隔线 |
| `--danger` | `#ff8585` | 错误状态 |
| `--content-width` | `1240px` | 内容最大宽度 |
| `--page-gutter` | `24px` | 桌面页面边距 |
| `--touch-target` | `44px` | 最小移动触控高度 |

金色实心背景使用 `#121019` 深色文字。详细用色规则见 `docs/design-system.md`。

### 5.3 层级与形状

- 页面背景为深色底与低对比径向渐变；
- 卡片和面板以 1px 边框、8–12px 圆角和轻量阴影区分层级；
- 胶囊标签用于分类、版本和 NEW 状态；
- Header 使用半透明背景、模糊和底部分隔线，并固定在视口顶部；
- 发光、扫光、缩放和位移动画只能作为低频点缀。

## 6. 全局布局与导航

`BaseLayout.astro` 统一负责：

- HTML 语言、Viewport、Canonical、Open Graph、Twitter Card 和 JSON-LD；
- 品牌 Header、桌面/移动导航、语言按钮和版权 Footer；
- 语言首屏引导，避免中文偏好用户先看到英文闪烁；
- 全站图片回退绑定；
- 点击移动菜单外部时关闭菜单；
- 全局中英文内容显示规则。

Header 桌面高度为 72px，手机高度为 60px。布局边缘同时考虑 `env(safe-area-inset-*)`。移动菜单必须限制在视口宽度内，链接触控高度不得低于 44px。

## 7. 首页设计

### 7.1 Hero

首页 Hero 使用最新一条 `isNew` 记录的大图；没有新增记录时回退到目录第一条。

- 图片全宽覆盖，按顶部聚焦；
- 左侧叠加强暗渐变，保证标题和说明可读；
- 图片是装饰内容，使用空 `alt`；
- 首屏图片 `loading="eager"` 且 `fetchpriority="high"`；
- 精细指针且未开启减少动效时，支持轻量指针视差；
- Hero 还包含缓慢缩放，`prefers-reduced-motion` 下必须关闭；
- 手机加强遮罩并调整图片焦点，正文保持在安全文本区。

### 7.2 目录标题与计数

目录标题是页面第二层信息入口。总数由浏览器目录渲染逻辑维护，通过 `data-result-count` 更新。状态容器使用 `aria-live="polite"` 宣布结果数、页码、空状态和错误。

### 7.3 筛选器

完整字段固定为：

1. 名称搜索 `q`；
2. 英雄 `hero`；
3. 版本 `version`；
4. 分类 `category`；
5. 新增状态 `isNew`；
6. 排序 `sort`；
7. Apply；
8. Clear。

桌面和平板显示完整表单。手机显示“筛选与排序”折叠标题，默认收起；展开后搜索占整行，其余选择项双列排列，按钮占满自身列。

筛选容器当前使用原生 `<details>`，并遵守以下硬性规则：

- HTML 初始必须包含真实 `open` 属性，保证桌面无脚本首屏可见；
- `matchMedia('(min-width: 768px)')` 负责在断点变化时同步 `open`；
- 桌面始终打开，手机初始化后关闭；
- 不能依赖对子元素设置 `display:grid` 来绕过关闭的 `<details>`；浏览器会在原生布局层裁掉关闭内容；
- 修改相关 CSS 或脚本后，必须同时检查 `<details>` 自身高度和视觉截图，不能只检查子元素的计算 `display`。

### 7.4 卡片

`ChromaCard.astro` 展示：

- 1:1 裁切的中尺寸原画，焦点位于顶部中央；
- 居中靠下的分类图标；
- 可选 NEW 徽标；
- 当前语言的臻彩名称；
- 分类和版本标签。

整张卡片是详情链接。首批四张卡片可急切加载，其余延迟加载。桌面精细指针允许轻量上浮，触摸设备不依赖 Hover 表达信息。

### 7.5 浏览器筛选、分页与 URL

`src/catalog/browser-app.ts` 负责：

- 从 `#catalog-data` 读取精简目录；
- 将 URL 参数同步到表单；
- 调用纯函数完成筛选、排序和分页；
- 用模板重建卡片并重新绑定图片回退；
- 用 History API 写入筛选和页码；
- 处理浏览器前进/后退；
- 语言切换后按当前参数重新渲染卡片；
- 分页后把焦点放到当前页按钮。

筛选状态必须可由 URL 恢复。提交筛选或清除筛选时重置 `page`；分页只改变页码。默认每页 24 条，实际规则以 `browser-catalog.ts` 为准。

## 8. 详情页设计

### 8.1 桌面布局

桌面详情是双栏画廊布局：左侧原画，右侧资料列表。页面底层使用同一张大图作为低透明度氛围背景，并用横向和纵向渐变保证正文可读。

面包屑位于内容上方。可见标题位于资料栏，语义 H1 使用屏幕阅读器可见、视觉隐藏的形式，避免重复视觉标题同时保留 SEO 层级。

### 8.2 手机布局

小于 768px 时：

- 主图扩展到页面宽度，采用 420–680px 的海报高度；
- 页面氛围背景和页面内主图通过 `<picture>` 使用中图，降低移动端首屏图片体积；桌面展示和全屏预览继续使用大图；
- 标题、分类、英雄和版本叠加在图片底部渐变层；
- 完整资料放在图片下方独立面板；
- 资料面板默认折叠，用户通过至少 44px 高的 Summary 展开；
- 标签列使用紧凑固定宽度，值列允许长文本换行。

### 8.3 资料字段

详情资料按数据存在情况显示：

- Category；
- Category icon；
- Colors；
- Description / 描述；
- Base skin；
- Skinlines；
- Universes；
- Champions；
- Patch。

桌面资料必须真实常显。详情容器和首页筛选使用相同的 `<details open>` 与媒体查询同步契约，禁止只修改子容器 `display`。

### 8.4 外部操作

`DetailActionMenu.astro` 接收动作数组：

- 单个动作直接渲染外链按钮；
- 多个动作渲染原生 `<details>` 菜单；
- 链接在新标签打开并使用 `noopener noreferrer`；
- 点击菜单外部关闭已打开菜单；
- 桌面图标控制为 30px，手机提升到 44px；
- 菜单宽度不得超过视口。

外部动作当前覆盖 SkinSpotlights、KHADA、Google 和版本公告。URL 构造集中在 `src/domain/detail-actions.ts`，组件不拼接业务 URL。

### 8.5 图片查看器

点击详情主图打开原生 `<dialog>`：

- 支持关闭、按钮缩放、滚轮缩放、单指/指针拖拽和移动端双指缩放；
- 所有缩放入口统一限制在 `1×–4×`，回到 `1×` 时自动清除位移并居中；
- 双指缩放以两指中点为视觉锚点，手指移动时同步计算缩放与平移，避免画面从触点下跳开；
- 双指变为单指且当前倍率大于 `1×` 时，无缝切换为拖拽；重新形成双指时以当前画面状态建立新的缩放基线；
- `pointerup`、`pointercancel`、关闭和重新打开必须清理活动指针与手势状态，防止残留缩放或拖拽；
- 对话框使用完整动态视口且不设置内容内边距，控制按钮单独避让安全区；
- 控制按钮为 44×44px；
- 完整图按源图自身比例，在 `100vw × 100dvh` 范围内最大化 `contain` 完整显示，不强制为 16:9；图片元素只占实际显示区域，其余区域可点击关闭预览；
- 拖动或双指缩放期间禁用过渡并使用抓取光标；
- 图片区域使用 `touch-action:none`，手势由 Pointer Events 状态机统一处理，不引入第三方手势库；
- 行为实现在 `src/client/image-viewer.ts`，Astro 组件只提供结构和样式。

### 8.6 相关推荐

详情底部展示由 `src/domain/related.ts` 计算的相关臻彩，复用 `ChromaCard`，不维护独立的页面级推荐数据。

## 9. 响应式系统

### 9.1 断点

| 范围 | 页面行为 |
| --- | --- |
| `≥1024px` | 三列目录、详情双栏、完整筛选横向排列 |
| `768–1023px` | 两列目录、详情单栏、筛选三列网格，但筛选仍常显 |
| `<768px` | 单列目录、移动导航、筛选和资料默认折叠、详情海报化 |
| `<480px` | 品牌和标题进一步紧凑，区块标题改为纵向排列 |

`768px` 是“手机折叠/非手机常显”的统一行为边界。不要分别为首页和详情创建不同的折叠断点。

### 9.2 布局安全规则

- 320px 宽度不得出现页面级横向滚动；
- Grid 子项使用 `minmax(0, 1fr)` 或 `min-width:0`；
- 长标题、说明、标签和菜单内容必须换行或在自身容器截断；
- 面包屑可横向滚动，但不得撑宽页面；
- 移动弹层、菜单和表单必须考虑安全区和动态地址栏；
- 重要触控目标至少 44×44px；
- Hover 只作为增强，不承载唯一操作或状态信息。

## 10. 国际化

当前中英文共用同一 URL，不生成 `/zh/` 路由或 `hreflang`。

### 10.1 内容契约

- 短文本：`data-en` / `data-zh`；
- 完整语言区块：`data-language-content="en|zh"`；
- ARIA：`data-aria-en` / `data-aria-zh`；
- 输入提示：`data-placeholder-en` / `data-placeholder-zh`；
- 图片替代文本：`data-alt-en` / `data-alt-zh`。

### 10.2 状态流

1. Head 内联引导脚本在首屏前读取 `localStorage`；
2. `documentElement.dataset.language` 决定初始语言；
3. `initializeLanguage` 更新文案、ARIA、Placeholder、Alt 和 `<html lang>`；
4. 用户切换后写入 `chroma-art-language`；
5. 页面派发 `languagechange`，目录重新渲染动态卡片。

英文是默认且主要索引语言。任何新增动态内容必须响应语言切换，不能只更新静态 DOM。

## 11. 图片策略

图片加载链路统一为：

```text
img.chromaart.lol 规范图片
        ↓ 失败
腾讯源站计算地址
        ↓ 再失败
/placeholder.svg
```

图片元素使用 `data-fallback` 和 `data-placeholder`，由 `bindImageFallbacks` 绑定错误处理。新增图片组件时应复用该契约，不应在各组件内编写独立 `onerror`。

响应式图片的 `<source>` 可使用 `data-fallback` 声明同尺寸源站地址。当前媒体查询匹配时，回退顺序为该尺寸规范图、该尺寸源站图、占位图；不匹配时继续使用 `<img>` 自身的大图回退链路。详情页移动端背景与页面内展示使用中图，但打开图片查看器后的全屏图固定使用大图。

主要原画提供明确尺寸或宽高比，防止布局跳动。装饰背景和分类图标使用空 `alt`；内容原画的英文 Alt 由 SEO 模块生成，中文 Alt 随语言切换。

## 12. SEO 与语义

`src/seo/site.ts` 维护品牌、站点 URL、首页元数据和默认图；`src/seo/chroma-seo.ts` 从 `Chroma` 记录生成详情页标题、描述、Canonical、Alt 和 JSON-LD。

设计约束：

- 品牌统一写作 `CHROMA ART`；
- 首页覆盖宽泛的 China Exclusive Prestige Chroma 搜索意图；
- 详情页覆盖名称、英雄、原皮和原画长尾意图；
- 数字兼容路由不进入 Sitemap；
- Sitemap 为每个规范详情页附带大图；
- JSON-LD 只描述页面真实可见内容；
- 不暗示本站由 Riot Games 官方运营、赞助或销售皮肤；
- 新增有效目录记录后，不需要手工维护页面级 SEO。

## 13. 可访问性与动效

- 页面保持单一语义 H1 和正确标题层级；
- 表单控件必须有可见 Label；
- 状态变化通过 `aria-live="polite"` 宣布；
- 图标按钮必须有随语言变化的可访问名称；
- 原生 `details`、`summary`、`dialog` 和表单行为优先于自造控件；
- 键盘可操作筛选、分页、菜单和图片查看器；
- 焦点状态使用金色或清晰边框，不得只依赖颜色极弱的变化；
- `prefers-reduced-motion` 下关闭非必要动画和过渡；
- 装饰图片隐藏于辅助技术，内容图片提供准确 Alt。

## 14. 错误、空状态与边界

### 14.1 目录

- 无匹配结果：显示独立说明，引导清除筛选，不伪装为加载失败；
- 初始化或渲染异常：显示 `Unable to load` / `加载失败`；
- URL 参数：由纯查询层规范化，页面号超界时回落到有效页；
- 重置：清除筛选和页码，并写入浏览器历史；
- 前进/后退：恢复表单、结果和分页。

### 14.2 图片

- 规范图失败后只回退一次源站，再进入占位图；
- 避免无限错误循环；
- 图片失败不能阻塞其余页面交互。

### 14.3 详情与菜单

- 可选字段为空时不渲染空行；
- 外部操作只在动作存在时渲染；
- 菜单不得越出窄屏；
- 多个菜单可存在，但点击外部时统一关闭；
- 详情主内容不得因 `<details>` 关闭状态在桌面被原生裁切。

### 14.4 无数据与未知页面

- 目录为空时显示等待导入的空状态；
- 未知路径使用 404 页面，提供返回图鉴的明确入口。

## 15. 组件与文件职责

| 文件 | 职责 |
| --- | --- |
| `src/layouts/BaseLayout.astro` | 全局 Head、Header、Footer、语言启动和移动导航 |
| `src/pages/index.astro` | 首页静态结构、Hero、首批目录、模板和目录数据注入 |
| `src/pages/chromas/[slug].astro` | 详情静态生成、字段编排、背景、响应式资料面板和相关推荐 |
| `src/pages/about.astro` | 中英文概念说明和示例原画 |
| `src/components/Filters.astro` | 筛选选项生成、表单 DOM 契约和响应式开合 |
| `src/components/ChromaCard.astro` | 静态及动态卡片共同遵循的视觉结构 |
| `src/components/ImageViewer.astro` | 响应式页面展示图、固定大图预览、查看器控件和样式 |
| `src/components/DetailActionMenu.astro` | 单外链按钮和多动作菜单 |
| `src/components/CategoryIconPreview.astro` | 分类图标展示与预览 |
| `src/components/ChromaColorCircle.astro` | 颜色数据可视化 |
| `src/catalog/browser-catalog.ts` | 查询参数解析、筛选、排序和分页纯逻辑 |
| `src/catalog/browser-app.ts` | 首页浏览器状态、DOM 更新和 History API |
| `src/client/language.ts` | 语言读取、应用、持久化和事件 |
| `src/client/image-fallback.ts` | 普通图片及 `<picture>` 活动响应式源的三级回退 |
| `src/client/image-viewer.ts` | Dialog、按钮/滚轮缩放、Pointer Events 双指缩放、拖拽、手势重置和关闭行为 |
| `src/domain/detail-actions.ts` | 外部动作 URL 生成 |
| `src/domain/featured-chroma.ts` | 首页 Hero 数据选择 |
| `src/domain/related.ts` | 相关推荐计算 |
| `src/seo/site.ts` | 站点级 SEO 常量和首页元数据 |
| `src/seo/chroma-seo.ts` | 详情 SEO、Alt 和结构化数据 |
| `src/styles/global.css` | 全局变量、通用布局、卡片、筛选和响应式断点 |

组件应保持单一职责。业务 URL、查询规则、推荐算法和 SEO 生成不得回流到展示组件。

## 16. 测试与发布验证

### 16.1 自动测试层次

- 领域单元测试：数据模型、详情动作、Hero 选择和相关推荐；
- 目录单元测试：查询解析、筛选、排序、分页和浏览器状态；
- 客户端测试：图片回退、查看器开关、双指中点缩放、`1×–4×` 边界、单指拖拽接续、手势取消/重置和语言相关行为；
- 响应式契约测试：导航、折叠结构、完整字段和网格断点；
- 构建测试：静态路由、SEO、Sitemap、Cloudflare 配置和产物审计；
- Smoke：关键页面和资源的生产形态检查。

### 16.2 完整发布门禁

提交影响页面、样式、组件、数据或 SEO 的修改前运行：

```bash
pnpm release:build
```

该命令顺序执行：

1. `pnpm test`；
2. `pnpm typecheck`；
3. `pnpm data:validate`；
4. `pnpm build`；
5. `pnpm audit:build`。

### 16.3 视觉验收矩阵

至少覆盖：

- 320×568；
- 375×812；
- 430×932；
- 768×1024；
- 1024×768；
- 1440×900。

重点检查首页、详情、About、404 和图片查看器，并验证：

- 无页面级横向溢出；
- 桌面筛选和详情真实可见；
- 手机筛选和详情默认折叠且可展开；
- 中英文切换后没有错位、旧文案或错误 Alt；
- 菜单、Dialog 和触控目标不越界；
- 手机图片查看器可围绕双指中点平滑缩放，抬起一指后可继续拖拽，关闭重开后恢复 `1×` 居中；
- 减少动效设置有效。

## 17. 修改检查表

修改前端时逐项确认：

- [ ] 没有破坏静态首屏和主要内容的无脚本可读性；
- [ ] 首页完整保留六个筛选字段、Apply 和 Clear；
- [ ] 详情完整保留所有已有资料字段和相应外部操作；
- [ ] `≥768px` 的筛选与资料 `<details>` 具有真实 `open` 状态；
- [ ] `<768px` 初始化后默认折叠，Summary 可通过键盘和触摸操作；
- [ ] 320px 无页面级横向滚动；
- [ ] 所有重要触控目标至少 44px；
- [ ] 手机图片查看器双指缩放限制在 `1×–4×`，手势切换、取消、关闭和重开均无状态残留；
- [ ] 新增文案、ARIA、Placeholder 和 Alt 同时支持中英文；
- [ ] 动态目录在语言切换、前进/后退、清除和分页后保持一致；
- [ ] 图片继续遵守规范源、腾讯源、占位图三级回退；
- [ ] SEO 标题、Canonical、JSON-LD 和 Sitemap 继续由数据生成；
- [ ] 动画尊重 `prefers-reduced-motion`；
- [ ] `pnpm release:build` 通过；
- [ ] 对真实页面做桌面和手机视觉验证，而不只检查 DOM 或计算样式。

## 18. 已知技术注意事项

### 18.1 原生 `<details>` 的桌面显示

关闭的 `<details>` 会在浏览器原生布局层隐藏除 Summary 外的内容。即使内部元素的 `getComputedStyle(...).display` 返回 `block` 或 `grid`，内容仍可能不可见，父元素高度也可能为零。

因此验证时必须同时确认：

- `<details open>` 状态；
- `<details>` 自身实际高度；
- 内容在真实截图中出现。

这是首页筛选和详情资料共同的回归风险。

### 18.2 静态卡片与动态卡片双实现

首批卡片由 `ChromaCard.astro` 生成，筛选后的卡片由 `browser-app.ts` 使用 `<template>` 生成。修改卡片结构、标签、Alt、ARIA 或图片字段时，必须同步更新两条路径及其测试。

### 18.3 客户端目录体积

首页当前嵌入完整精简目录以支持纯浏览器筛选。目录增长时，应监测 HTML 体积、解析成本和交互启动时间；在没有实测瓶颈前，不恢复历史 D1/Worker 方案。

### 18.4 中英文共用 URL

语言状态保存在本地，不形成独立可索引页面。若未来引入 `/zh/` 或 `hreflang`，需要作为信息架构和 SEO 项目单独设计，不能只修改语言按钮。

## 19. 相关文档

- `docs/design-system.md`：主题色与视觉使用规则；
- `docs/数据源与JSON结构.md`：目录数据来源和 JSON 字段；
- `docs/superpowers/specs/2026-07-16-responsive-mobile-design.md`：移动响应式历史决策；
- `docs/superpowers/specs/2026-07-16-visible-desktop-collapsible-mobile-content-design.md`：桌面常显、手机折叠决策；
- `docs/superpowers/specs/2026-07-16-latest-chroma-hero-background-design.md`：首页 Hero 决策；
- `docs/superpowers/specs/2026-07-16-detail-action-menu-design.md`：详情操作菜单决策；
- `docs/superpowers/specs/2026-07-17-prestige-chroma-seo-design.md`：SEO 术语、路由和数据生成规则。
