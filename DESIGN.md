---
version: alpha
name: LoL Chroma Art — Antdv Next Dark Gold
description: Antdv Next 1.6.0 darkAlgorithm tokens with final Chroma Gold primary, complete upstream typography and component
  patterns, adapted for an Astro splash art archive.
colors:
  primary: '#d7b56d'
  success: '#49aa19'
  warning: '#d89614'
  error: '#dc4446'
  info: '#1668dc'
  blue: '#1677FF'
  blue-7: '#3c89e8'
  purple: '#722ED1'
  cyan: '#13C2C2'
  green: '#52C41A'
  magenta: '#EB2F96'
  red: '#F5222D'
  orange: '#FA8C16'
  yellow: '#FADB14'
  volcano: '#FA541C'
  geekblue: '#2F54EB'
  gold: '#FAAD14'
  lime: '#A0D911'
  surface: '#141414'
  surface-container: '#1d1d1d'
  surface-layout: '#000000'
  on-surface: rgba(255,255,255,0.85)
  on-surface-variant: rgba(255,255,255,0.65)
  on-surface-disabled: rgba(255,255,255,0.25)
  outline: '#424242'
  outline-variant: '#303030'
  on-primary: '#141414'
  surface-elevated: '#1f1f1f'
  surface-spotlight: '#424242'
  surface-tag: '#272727'
  surface-hover: '#313131'
  on-surface-tertiary: rgba(255,255,255,0.45)
  primary-hover: '#cebb8b'
  primary-active: '#937d4e'
  primary-bg: '#4f442f'
  primary-bg-hover: '#6c5c3c'
  primary-border: '#4f442f'
  primary-border-hover: '#6c5c3c'
  success-bg: '#162312'
  success-border: '#274916'
  warning-bg: '#2b2111'
  warning-border: '#594214'
  error-bg: '#2c1618'
  error-border: '#5b2526'
  info-bg: '#111a2c'
  info-border: '#15325b'
  mask: rgba(0,0,0,0.45)
typography:
  display-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 46px
  headline-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
  code:
    fontFamily: '''SFMono-Regular'', Consolas, ''Liberation Mono'', Menlo, Courier, monospace'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  none: 0px
  sm: 2px
  md: 4px
  DEFAULT: 6px
  lg: 8px
  xl: 16px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  control-height: 32px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
    padding: 0 15px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-primary-active:
    backgroundColor: '{colors.primary-active}'
  button-default:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
    padding: 0 15px
  button-default-hover:
    textColor: '{colors.primary-hover}'
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
    padding: 4px 11px
  input-field-focus:
    backgroundColor: '{colors.surface}'
  select-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
    padding: 0 11px
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 24px
  modal:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 20px 24px
  menu-item-selected:
    backgroundColor: '{colors.primary-bg}'
    textColor: '{colors.primary}'
    typography: '{typography.body-md}'
  tabs-tab-active:
    textColor: '{colors.primary}'
    typography: '{typography.body-md}'
  table-header:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface}'
    typography: '{typography.title-md}'
    padding: 16px
  tag:
    backgroundColor: '{colors.surface-tag}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: 0 7px
  tooltip:
    backgroundColor: '{colors.surface-spotlight}'
    textColor: '#FFFFFF'
    typography: '{typography.body-md}'
    rounded: '{rounded.md}'
    padding: 6px 8px
  dropdown-item-hover:
    backgroundColor: '{colors.surface-hover}'
    textColor: '{colors.on-surface}'
  alert-success:
    backgroundColor: '{colors.success-bg}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 8px 12px
  alert-warning:
    backgroundColor: '{colors.warning-bg}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 8px 12px
  alert-error:
    backgroundColor: '{colors.error-bg}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 8px 12px
  alert-info:
    backgroundColor: '{colors.info-bg}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 8px 12px
  badge-status-error:
    backgroundColor: '{colors.error}'
    rounded: '{rounded.full}'
    width: 6px
    height: 6px
  tag-blue:
    backgroundColor: '{colors.info-bg}'
    textColor: '{colors.blue-7}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: 0 7px
  page:
    backgroundColor: '{colors.surface-layout}'
    textColor: '{colors.on-surface}'
  dropdown-menu:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding-block: 5px
    width: 160px
    item-height: 40px
    item-margin-block: 4px
    item-margin-inline: 4px
    item-width: calc(100% - 8px)
    item-padding-inline: 16px
---

# LoL Chroma Art 夜间设计规范

## Overview

本文件基于 [Antdv Next 已发布的 design.md](https://antdv-next.com/design.md) 定制，保留其完整 Token 分类、10 档字体、7 档圆角、7 个间距/尺寸项和全部 22 个组件范式；增加夜间表面与状态语义，以及页面和下拉菜单两项容器映射。颜色来自 `antdv-next@1.6.0` 的真实 `darkAlgorithm` 输出，提取日期为 2026-10-14。源文件对应仓库提交 `839bec66f18a78eeef5c6843b78ea4a54d73b248`。

本站是暗色金色的臻彩原画图鉴。原画承担视觉焦点，控件遵循 Antdv Next 的比例、密度与交互语义，页面共享同一套规则。遵循熟悉的操作模式、明确的反馈、与任务相关的强调和可持续复用的组件；保留 Astro 静态架构，通过现有 CSS 和组件消费本规范。

本规范已推广至共享主题、控件、所有页面与文章排版。主题值集中在 `src/styles/tokens.css`，文件校验之外仍需真实页面的桌面、手机与中英文验证。

## Colors

页面、内容容器和浮层分别使用 `surface-layout`（#000000）、`surface`（#141414）和 `surface-elevated`（#1f1f1f）。表头等弱化区域使用 `surface-container`（#1d1d1d），普通 Tag 使用 `surface-tag`（#272727），下拉菜单悬停使用 `surface-hover`（#313131）。这些是静态文件中的合成色：分别由白色4%叠在内容表面、白色8%叠在内容表面、白色8%叠在浮层表面得到。实现如果使用原始 rgba 填色，须保留相同底层；不可把其中一个合成色当作通用遮罩。

主文本、次级文本、说明文本和禁用文本分别使用白色 85%、65%、45% 和 25% 的透明度。文字保留真实暗色 Token，避免用一个合成灰色覆盖不同底层。说明文字的对比度应在实际背景上复核；禁用色只用于确实不可操作的内容。

Chroma Gold 是最终可见主色 `primary: #d7b56d`。普通暗色算法会把同值种子派生为 #ba9d60；本定制明确覆盖最终 `colorPrimary` 和 `colorPrimaryText`，其余主色色阶保持算法输出：悬停 #cebb8b、按下 #937d4e、选中背景 #4f442f、边框悬停 #6c5c3c。按钮三个状态均使用 `on-primary: #141414`，14px 文字的对比度分别约为 9.40、9.74、4.64，满足 WCAG AA。链接及其悬停/按下也使用这一主色色阶；不得直接沿用默认蓝色链接。

成功、警告、错误与信息保留官方暗色语义色及其背景、边框。Alert 正文用主文本，颜色与图标共同表达状态；不要把所有正文染成状态色。`blue` 到 `lime` 是上游预设色种子，供分类与可视化使用；其中 `gold` 是上游预设金色，本站品牌操作使用 `primary`，两者用途不同。

## Typography

完整采用上游的系统无衬线字体栈，展墙、页面标题、控件与正文都使用该体系。保留原文件的 display-lg 38/46、headline-lg 30/38、headline-md 24/32、headline-sm 20/28、title-lg 16/24、title-md 14/22、body-lg 16/24、body-md 14/22、body-sm 12/20 和 code 13/20px 字号/行高。

界面字体使用 400 与 600 两档字重，通过颜色、边框和下划线表达选中状态。控件默认 14/22px；博客长文允许使用 body-lg 并增加行高以适应中文连续阅读。Kicker 仅在能补充标题没有表达的类别或语境时使用，不重复面包屑或主标题。窄屏长标题允许自然换行，不以无限缩小字号或隐藏关键名称保持单行。品牌 Logo 作为已有图形资产保留其字标。

## Layout

采用 4px 间距基数和 4、8、16、24、32px 尺度；保留上游 Input 的 11px、Button 的 15px 内边距等组件原始尺寸。按钮、表单字段和图标操作等独立控件默认 32px 高。皮肤详情媒体轮播控制条按 Antdv Next 组件尺寸：Radio.Button 与下载图标按钮均使用默认 32px，并通过组件 `size` 属性控制；尺寸不随视口或触控类型放大。文字链接按 [WCAG 2.2 目标尺寸最低要求](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)检查尺寸或间距，正文行内链接不强制扩大到 44px。

本站版心与横向边距继续通过 `--content-width` 和 `--page-gutter` 共享。首页直接呈现工具导航、筛选与原画目录；目录便于比较；详情突出完整作品和资料；博客维持连续阅读。原画展示面积、完整媒体比例和触控可用性是密度规则的明确例外，其余同类控件不逐页另定尺寸。

## Elevation & Depth

容器靠表面色与边框建立层级；阴影只用于浮层及确需分离的卡片。暗色 `boxShadow` 为 `0 6px 16px 0 rgba(255,255,255,.016), 0 3px 6px -4px rgba(255,255,255,.024), 0 9px 28px 8px rgba(255,255,255,.01)`；`boxShadowTertiary` 为 `0 1px 2px 0 rgba(255,255,255,.01), 0 1px 6px -1px rgba(255,255,255,.006), 0 2px 4px 0 rgba(255,255,255,.006)`。这些来自官方暗色输出，按需复用，不能用浅色主题黑影冒充暗色算法结果。

状态变化、组件内部过渡和浮层变化分别采用 0.1、0.2、0.3s。减少动态效果开启时关闭非必要动画和光滑滚动。原画上的渐变遮罩与文字阴影只服务可读性。

## Shapes

完整保留上游 0、2、4、6、8、16 和 9999px 圆角尺度：常用控件 6px、Card/Modal/菜单容器 8px、Tag/Tooltip 4px。全圆角只用于圆形头像、状态点、返回顶部等明确圆形元素，不将普通按钮和标签改成胶囊。

## Components

YAML 保留所有上游组件键和几何参数，并替换为真实暗色语义。实际产品按需使用这些模式；规范中存在某个组件不表示本站必须新增它。

- Button：同一操作组仅突出一个主操作；主按钮使用金色与深色文字，默认按钮使用内容表面、主文本和细边框。悬停与按下使用明确的主色色阶。禁用时取消交互反馈，并使用禁用文本及暗色填色。
- Input/Select：同尺寸、同圆角；默认细边框，悬停边框使用 primary-hover，聚焦边框与可见焦点环使用 primary。错误边框使用 error，但错误说明须有文本；Placeholder 使用禁用/占位文本色。聚焦不靠改变尺寸实现。
- Card：内容表面、8px 圆角、24px 内边距；卡片标题、额外操作、封面、加载占位、底部操作和 Card Tabs 由共享组件承载。臻彩图卡媒体区使用本地游戏场景背景图作为原画衬底。Card Tabs 嵌入卡片头部，选中项使用主色文字与2px底部指示条，不使用选中背景色；页面导航页签保留链接语义，本地内容页签使用键盘可操作的 Tabs 语义。原画卡片可保留更大的媒体区与16px资料内边距。Modal 使用浮层表面、20×24px 内边距和 mask 遮罩。
- Masonry：内容高度不一的列表使用响应式列数与统一水平、垂直间距；图片尺寸稳定后及时重排，过滤和排序后保持当前 DOM 顺序。
- Tree：父子资料保持嵌套关系；`expandable: false` 时常显子节点并隐藏展开控件，默认支持展开/收起；可按节点类型定制标题前图标，装饰图标对辅助技术隐藏，展开控件使用明确的可访问名称和状态。
- 领域图标：统一在 [domain-icons.ts](src/components/domain-icons.ts) 按领域词语映射；页面标题、导航与树节点复用同一图标，不在调用处重复绘制。
- Menu/Tabs：水平 Menu 用主色文字与 2px 底部指示条标记选中项，不使用选中背景色；Tabs 用主色文字和 2px 下划线。键盘焦点与当前位置分别可辨识。
- Table/Tag：表头用弱填色和14px/600字体；Tag用独立暗色填色、12px文字、4px圆角。彩色 Tag 对应预设色系，关键信息不只靠颜色。
- Alert/Badge：四类 Alert 用对应暗色背景和边框，正文保持主文本；状态点必须有文字或可访问名称。
- Tooltip/Dropdown：Tooltip 使用 spotlight 表面与白字；Dropdown 使用 elevated 表面，默认宽度160px、纵向内边距5px；菜单项高40px、内外横向间距16px/4px、纵向外间距4px。窄屏或触控输入时菜单项点击区域至少44px；条目悬停叠加 surface-hover。浮层检查层级、键盘关闭与焦点返回，避开手机安全区。
- Divider：内容区水平分隔和行内垂直分隔使用共享组件，线条使用 outline Token；带文字时文字与分隔线保持清晰间距。

## Do's and Don'ts

- 从语义 Token 读取颜色与尺寸；同类组件共享默认、悬停、聚焦、按下、禁用以及适用的加载、空和错误状态。
- 用真实中文长名称与英文标题验证换行、表单密度和窄屏溢出；图片失败时保留说明与回退能力。
- 使用主文本显示正文，状态色承担辅助表达；金色按钮不使用白色小字。
- 全站共用主题、控件和基础排版；仅图片比例、专属网格、图表及功能几何等需求在局部定义。检查代码、结构与对比度后仍需检查代表页渲染。
- 视觉任务读取本文件；页面行为与数据规则按相关契约执行。

## Customization

夜间 Token 的提取依据为 [Antdv Next 1.6.0 发布包](https://unpkg.com/antdv-next@1.6.0/dist/antd.js)中的 `theme.getDesignToken` 与 `theme.darkAlgorithm`。在暗色结果上仅覆盖最终 `colorPrimary`、`colorPrimaryText` 为 #d7b56d；链接映射到主色色阶。Button 的文字色只在组件级使用 #141414，保持 Tooltip 与其他反色组件的白字。没有对全局 `colorTextLightSolid` 做深色覆盖。主题源码见 [darkAlgorithm](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/theme/themes/dark/index.ts) 与 [Token 输出入口](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/theme/getDesignToken.ts)。

本文件定义一套静态夜间主题。本站继续使用 Astro 与 CSS 变量；设计来源的 Vue 算法仅用于离线核对，页面不增加主题运行时。上游数值有更新时应重新提取、比较差异，再更新规范和消费者。

### 站点品牌与页面契约

品牌正式拼写为 `LoL Chroma Art`，SEO与正文均保持这一拼写。现有 Logo 中 `LoL CHROMA` 为金色，`ART` 为白色；占位图保留低对比水印，徽标约20%、字标约32%不透明度。广告品牌图保持5:1、600×120px且不超过150KB。

Header 保留透出原画轮廓的玻璃表面，模糊约4px、亮度不低于.95；不支持 backdrop-filter 时回退为近不透明的暗色表面。语言控件默认高度32px，窄屏或存在触控输入时点击区域至少44px。遮罩上的文字检查最亮原画区域的对比度。

博客使用响应式原画背景，767px以下读取中图；背景延伸到Header之后，使用svh适应移动浏览器栏。首页直接展开最新博客、工具导航和臻彩目录，不使用全屏 Hero。减少动态效果时关闭原画漂移和视差。返回顶部仍在滚动超过480px后显示，使用金色及深色图标，并适配安全区。

英雄与皮肤资料保持可扫描的布局、明确的加载/缺失/失败/重试状态。英雄小头像与皮肤缩略图保持来源比例；手机皮肤卡片可保持两列，但长名称须可读。皮肤展签以名称和稀有度标识构成标题，长名称允许换行，背景故事与后续资料区对齐；完整原画与炫彩图片不因控件密度而被错误裁切。

具体路由、双语、稀有度本地化、CommunityDragon通道、无脚本内容、图片回退和第三方入口契约见 [前端功能文档](docs/frontend-design.md)。目录唯一数据源、静态SEO及图片保存规则见 [项目指令](AGENTS.md)。本文件合并了旧视觉文档；旧 frontend-design skill 已移除。
