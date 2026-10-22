# Antdv Next 设计体系研究与项目借鉴建议

记录日期：2026-10-14。本文核对 Antdv Next 官方站点、官方仓库与 Ant Design 设计文档，并对照本站现有规范、共享样式和首页实现。后续全站借鉴决策见 [ADR 0003](adr/0003-adapt-antdv-next-design-to-astro.md)；根目录 [DESIGN.md](../DESIGN.md) 是新的视觉主规范。

## 结论

Antdv Next 的主要价值是把一套成熟的 Ant Design 设计语言落实为可复用组件、分层 token、主题算法和组件语义接口。对本站最有用的是“设计决定集中表达、组件共享语义、变更后按真实页面验证”的方法。本站是 Astro 静态内容站，已有原画展馆品牌与原生 Astro/CSS 组件；应该借鉴设计系统组织方式，按本站品牌改写成 CSS 自定义属性和现有组件契约，不应引入 Vue、Antdv Next 或它的 CSS-in-JS 运行时。

Ant Design 将其设计价值概括为自然、确定、有意义、成长，并强调减少认知成本、保持克制、模块化和清晰反馈。这些是通用设计判断，可用于检查本站搜索筛选、目录扫描和作品详情是否易懂；企业后台的组件外观、密度和布局则不适合直接移植到原画展馆。[Ant Design 设计价值](https://ant-design.antgroup.com/docs/spec/values/)、[Ant Design 介绍](https://ant-design.antgroup.com/docs/spec/introduce)

Antdv Next 自述为基于 Ant Design 设计体系的 Vue 3 组件库，采用 TypeScript 和 CSS-in-JS，并提供主题定制能力。仓库工程指南列出 Vue 3、TypeScript、Vite 和 `@antdv-next/cssinjs` 等实现层。这里的组件 API、Vue Composition API、ConfigProvider 上下文、样式注册和运行时主题计算属于 Vue 组件库实现，不能视为框架无关的本站规范。[Antdv Next README](https://github.com/antdv-next/antdv-next)、[Antdv Next AGENTS.md](https://github.com/antdv-next/antdv-next/blob/main/AGENTS.md)

## 可借鉴内容

### 0. 设计说明与实现保持同源

Antdv Next 的 [`design.md` 指南](https://github.com/antdv-next/antdv-next/blob/main/docs/src/pages/docs/vue/design-md.zh-CN.md)说明：发布给 AI 设计工具的文件由组件库主题 Token 生成，包含机器可读的颜色、字体、尺寸，以及按钮、输入框和卡片等组件范式。它还给出 `lint` 与 `diff` 命令，用于检查文件结构、对比度及 Token 变更。这种「实际实现 → 可阅读规范 → 可检查差异」的关系比文件名本身更值得借鉴。

本站已决定将原有视觉规范合并为根目录 [DESIGN.md](../DESIGN.md)，作为暗色金色主题的主规范，并让 CSS 与组件实现对齐。它不复制 Antdv Next 的浅色 Token；`lint` 无法判断首页构图与原画展示是否美观，仍需真实页面检查。

### 1. 设计 token 的分层

Ant Design 将 token 分为 Seed、Map、Alias 三层：Seed 表达少量基础设计意图；Map 从基础值推导色阶、尺寸等值；Alias 给常用组件语义命名。官方建议大多数主题调整从 Seed 开始，需要细化时才覆盖 Map 或组件 token；算法负责维持相关值之间的关系。[主题定制与 token 生命周期](https://github.com/ant-design/ant-design/blob/master/docs/react/customize-theme.en-US.md)

本站已经有 `--bg`、`--panel`、`--text`、`--muted`、`--gold`、`--line`、版心宽度、页面边距、触控尺寸和 Header 高度等 CSS 变量，但排版比例、间距、圆角和边框层级仍有不少局部值。建议先给现有属性补上稳定的语义分组与少数复用值，不复制 Ant Design 的 token 名称，也不为了覆盖每个数字而扩充变量：

| 本地语义 | 当前/可用基准 | 用法 |
| --- | --- | --- |
| 品牌色 | `--gold: #d7b56d` | 主操作、选中、焦点等强调 |
| 页面表面 | `--bg`、`--panel`、`--panel2` | 页面背景、卡片、悬浮/次级表面 |
| 文字与分隔 | `--text`、`--muted`、`--line`、`--danger` | 文字层级、边界、错误反馈 |
| 布局 | `--content-width`、`--page-gutter`、`--site-header-height` | 版心、统一横向边距、Header 几何 |
| 交互 | `--control-height-sm`、`--control-height`、`--control-height-lg` | 24/32/40px 控件尺寸及焦点状态 |
| 待收敛项 | 字号/行高、少量间距档位、圆角档位 | 仅在两个以上真实消费者有一致需求时提升为共享值 |

这是把 Ant Design 的“基础值 → 语义用途”思想映射到本站 CSS，而不是照搬其动态色板生成。本站单一暗色品牌主题已明确，静态 CSS 变量足够；亮暗主题切换、运行时算法、组件局部主题编辑目前没有产品需求。

### 2. 组件范式强调职责与契约

Ant Design 设计体系主张将重复复杂部分模块化；Antdv Next 的组件文档还暴露语义子区的 `classes`/`styles` 接口，并逐个说明组件语义 DOM 结构。这带来的通用经验是：共享样式围绕可识别的语义部位组织，使用者可以定点调整，同时保留控件状态与可访问语义。[Ant Design 设计价值](https://ant-design.antgroup.com/docs/spec/values/)、[Antdv Next Empty 文档](https://antdv-next.com/components/empty)

本站已有 Astro 组件和相邻样式，例如 `PrestigeChromaCard`、`Filters`、分页、面包屑和 `ImageViewer`。优先继续复用它们；当同类部位在多个页面重复且规则确实相同，再提取共用 CSS 规则或组件。不要只为模仿 Antdv 的 API 而给 Astro 组件增加 `classes/styles` 泛化入口。

### 3. 主题实现与静态站的适配

Ant Design 的主题接口以 Seed token 和算法生成关联值，并可设全局、组件级或嵌套主题；Antdv Next 使用对应 Vue/CSS-in-JS 实现。该动态机制解决组件库在运行时切换主题、隔离组件覆盖等问题。[Ant Design 主题机制](https://github.com/ant-design/ant-design/blob/master/docs/react/customize-theme.en-US.md)、[Antdv Next 仓库实现概览](https://github.com/antdv-next/antdv-next/blob/main/AGENTS.md)

本站应保留 CSS-first 方案：`:root` 定义设计值，公共选择器消费 CSS 变量，页面样式保留内容特有编排。当前首页和组件有少量重复/硬编码值（例如首页部分版心/间距、控件和卡片局部颜色），可在实际发现跨页不一致后逐个收敛。不要为暂时不存在的动态主题能力加客户端脚本，也不要把完整样式重写成 CSS-in-JS。

## LLMs.txt 对本站的指导意义

[Antdv Next 的 LLMs.txt 指南](https://www.antdv-next.com/docs/vue/llms-cn.md)将 `llms.txt` 定位为帮助 AI 工具找到组件文档、API 和使用模式的入口，并提供汇总全文的 `llms-full.txt`。实际发布的 [`llms.txt`](https://www.antdv-next.com/llms.txt)还列出中英文文档、语义文档及各组件的独立 Markdown 链接。使用时先通过索引定位，再只读取相关组件文档；是否被 AI 工具使用，取决于该工具的配置或当前任务是否引用它。它解决的是**文档发现与供给**，上文的 `design.md` 解决的是**视觉规则表达**，两者都不能代替页面渲染验收。

对本站的直接启发是按任务提供最小、准确的文档路径：视觉改动读根目录 [DESIGN.md](../DESIGN.md)及实际 CSS，页面行为查 [前端契约](frontend-design.md)相关章节，具体样式再看对应组件。无需新建 `public/llms.txt`、复制 Antdv Next 的组件文档，或把整站资料一次性塞进上下文。旧 `frontend-design` skill 已移除。[本站现状与改进方向](前端现状与改进方向.md)

若将来需要让站外工具发现本站的公开文档，可以再评估生成站点级 `llms.txt` 索引。索引只指向实际公开且维护中的页面，不发布完整目录数据 `data/prestige-chromas.json`；这属于未来的站点分发需求，不是解决当前页面样式不统一的前置工作。[本站项目边界](../AGENTS.md)

## 可验证流程

### 夜间版实测与后续定制

用户已确认夜间主规范采用官方黑灰表面及完整无衬线字体层级。已执行 `antdv-next@1.6.0` 发布包的 `theme.getDesignToken` 与 `darkAlgorithm`：页面/容器/浮层分别为 `#000000`、`#141414`、`#1f1f1f`；金色种子 `#d7b56d` 的实际主色会派生为 `#ba9d60`。本定制仅将最终主色与主色文字覆盖回 `#d7b56d`，悬停 `#cebb8b`、按下 `#937d4e` 及暗色反馈色保留算法结果。默认链接跟随 info 蓝色，本站明确映射到主色色阶。[暗色算法源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/theme/themes/dark/index.ts)、[Token 输出入口](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/theme/getDesignToken.ts)

根目录 [DESIGN.md](../DESIGN.md) 保留已发布文件的全部26个原始颜色键、10档字体、7档圆角、7个间距/尺寸项、22个组件范式及9节正文；新增必要的夜间语义色和两个容器映射。Table、Tag、Dropdown的暗色填色对应不同底层，静态导出使用经官方色彩工具验证的合成色 `#1d1d1d`、`#272727`、`#313131`，避免简化为一个表面值。文字保留真实白色alpha层级。[原始设计文件](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/public/design.md)、[Tag实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/tag/style/index.ts)

金色按钮不保留上游白字：白字配金色仅约1.96:1。组件文字改用 `#141414`，默认/悬停/按下对比度约9.40/9.74/4.64:1，满足14px正文AA。此覆盖限于品牌按钮，不改变Tooltip等反色组件的白字。页面已按此规范迁移到共享 CSS；迁移与代表页验证记录见下方「全站落地」。

### 页面验证流程

Antdv Next 官网页面提供组件示例和主题定制入口；仓库 README 描述单元测试与发布工作流，版本发布还暴露 token 数据与元数据供编辑器/设计工具消费。这说明它把设计系统验证拆成可操作的组件示例、token 检视和自动化检查，而不只依赖一段原则文字。[Antdv Next 官方站](https://www.antdv-next.com/)、[仓库 README](https://github.com/antdv-next/antdv-next)、[发布记录](https://github.com/antdv-next/antdv-next/releases)

本站最小验证闭环应为：

1. 改共享 token 或组件规则前，选取会受影响的代表页与真实内容；至少包括首页、目录/详情中的同类控件，涉及博客基础排版时再纳入博客页。
2. 对桌面与窄屏检查内容边距、卡片密度、标题换行和横向溢出；检查中英文长度差异、键盘焦点、触控尺寸、减少动态效果和图片失败状态。
3. 用项目既定可检查条件记录结论：同类组件状态一致，核心内容可读，长内容未遮挡，窄屏无页面级横向溢出，键盘操作可见。视觉喜好仍需人工判断，代码扫描不能替代实际渲染。
4. 按变更风险运行仓库 `AGENTS.md` 要求的相关检查；只改文档时运行 `git diff --check`。无需照搬 Antdv 的 Vitest 覆盖率和发布流程到本站。

此流程与现有改进记录提出的真实渲染检查、代表页比较和明确验收条件一致；共享规则覆盖所有路由，真实渲染检查按代表页进行。[本站现状与改进方向](前端现状与改进方向.md)、[本站前端检查契约](frontend-design.md)

## 全站落地（2026-10-14）

用户确认推广到所有页面和组件，采用「共享默认样式，必要定制再局部定义」：

- `BaseLayout` 加载统一主题和文章样式，中英文路由共用实现；所有静态页面与运行时资料页消费相同主题。
- 控件统一为 14/22px、6px 圆角，桌面 32px、手机及粗指针 44px；卡片 8px、Tag 4px，状态共用金色色阶及暗色语义。
- 博客基础排版、表格与来源框集中维护；局部只保留专属网格、列宽、图表、媒体比例和功能几何。原画颜色样本属于内容，不替换为品牌色。
- 保留 Astro、文章正文、双语、SEO、目录数据和浏览器交互。没有增加 Vue 或主题运行时依赖。
- 已检查桌面与手机的首页、详情、博客及加载完成的英雄/皮肤资料；窄屏导航、筛选与图片查看器按真实页面验证。检查发现的 320px 页眉挤出和小字号文本对比问题已修正。

共享规则覆盖全部页面；逐路由的视觉检查未全部进行，外部原画和 CommunityDragon 资料的可用性仍取决于来源服务。`pnpm release:build` 已通过：42 个测试文件、363 项测试；类型检查 0 错误；489 条目录数据及 1480 个图片引用校验通过；生成 2057 个页面，审计 2102 个产物文件。

## 对照本站现状

本站的视觉规范已经明确暗色数字原画展馆方向、Chroma Gold、共享 Header、响应式 Hero 和详情展签等品牌规则。[本站设计规范](../DESIGN.md)

研究时，共享样式已有按钮、输入、分页、焦点和减少动态效果规则，但字体、圆角与颜色仍分散在页面中。全站迁移后，`src/styles/tokens.css` 集中主题值，`src/styles/global.css` 提供基础控件和运行时资料样式，`src/styles/article.css` 提供共享长文排版。首页及组件只保留专属布局与媒体几何。

改进记录指出，首页若干区域使用局部 `1240px`/`48px`，与共享 `--content-width`/`--page-gutter` 分别维护，且首页和全局断点不同。这些是适合从“单一共享值、语义用途、代表页验证”方法切入的具体位置。具体数值是否合并，应在后续授权的页面改动中依据实际渲染判定，而非仅为整齐而抽变量。[本站现状与改进方向](前端现状与改进方向.md)

## 建议分类与实施顺序

### 可直接借鉴

- 少数基础设计值作为单一事实来源；组件消费语义变量，不在多个页面重复维护同一颜色/边距。
- 按语义部位设计共享组件契约，焦点、禁用、错误和空状态均是控件的一部分。
- 用真实页面验证 token 变化造成的全局影响，区分代码存在与视觉结果已确认。
- 以用户任务组织页面；本站目录强调比较和扫描，详情强调作品和资料，博客强调阅读，不强迫所有页面同密度。

### 需要本地改写

- Ant Design 的 Seed/Map/Alias 映射为本站 CSS 变量的“原始品牌/布局值 → 页面语义变量 → 组件消费”；维持简单、静态且与 Astro 相容。
- Ant Design 模块化规范应映射到现有 Astro 组件与普通 CSS；只有重复规则稳定时才抽取。
- Ant Design 的确定性与一致性需和本站明确的“原画是视觉焦点”规则结合，避免把后台 UI 的控件密度和大量容器搬进展馆。
- 把主题验证改为本站真实路由、双语内容、移动端和交互状态的检查矩阵。

### 不要照搬

- 不直接引入 Vue、Antdv Next、Ant Design Vue 或 CSS-in-JS 运行时；这与 Astro 静态站边界和现有样式体系不匹配。
- 不照搬 ConfigProvider、Vue props/slots、语义 DOM 的类名 API、嵌套主题上下文等框架特定机制。
- 不移植 Ant Design 蓝白配色、后台页面模板或组件全集；用户已决定尽量采用其 4px 间距基数、控件尺寸与圆角，但移动端触控区域和原画展示允许例外，详见 [ADR 0003](adr/0003-adapt-antdv-next-design-to-astro.md)。
- 不为不存在的暗色/亮色切换、主题编辑器或 token 算法添加运行时功能。

### 最小落地顺序

1. 在首批基准改动中，先统一首页与共享样式已经重复的版心、页面边距和受影响断点；只有多处一致消费的值才进入全局变量。
2. 按实际影响补齐最少量的排版、间距或圆角 token，并同步更新 `DESIGN.md` 与消费者。
3. 用首页和一类受影响页面做桌面/手机、中英文及关键状态的实际渲染比较；记录具体问题与结果。
4. 经历一次实际变更后再判断是否需要更多 token、共享基础排版或可重复视觉检查工具；当前不建议新增依赖或自动化框架。

## 来源

- [Antdv Next 官方网站](https://www.antdv-next.com/)：产品定位、组件示例和主题定制入口。
- [Antdv Next `design.md` 指南](https://github.com/antdv-next/antdv-next/blob/main/docs/src/pages/docs/vue/design-md.zh-CN.md)：Token 与组件范式的发布来源、获取和校验方式。
- [Antdv Next `LLMs.txt` 指南](https://github.com/antdv-next/antdv-next/blob/main/docs/src/pages/docs/vue/llms.zh-CN.md)与[已发布的 `llms.txt`](https://www.antdv-next.com/llms.txt)：AI 文档入口、全文资源、中英文和按组件定位的 Markdown 链接。
- [Antdv Next 官方仓库 README](https://github.com/antdv-next/antdv-next)：Vue 3、TypeScript、CSS-in-JS、支持环境和测试说明。
- [Antdv Next 仓库 AGENTS.md](https://github.com/antdv-next/antdv-next/blob/main/AGENTS.md)：Vue + TypeScript + Vite 工程架构与 CSS-in-JS 实现层。
- [Antdv Next Empty 组件文档](https://antdv-next.com/components/empty)：组件用途、语义结构、`classes`/`styles` API 及 token 文档入口。
- [Antdv Next 发布记录](https://github.com/antdv-next/antdv-next/releases)：主题/tokens 发布元数据与版本化实现信息。
- [Ant Design 设计价值](https://ant-design.antgroup.com/docs/spec/values/) 与 [设计体系介绍](https://ant-design.antgroup.com/docs/spec/introduce)：Antdv Next 所继承设计语言的价值背景。
- [Ant Design 主题定制文档](https://github.com/ant-design/ant-design/blob/master/docs/react/customize-theme.en-US.md)：Seed/Map/Alias、算法、组件级主题和静态消费机制。此处用于追溯 Antdv 所基于的 Ant Design 设计体系；React API 不作为本站实现建议。
- 仓库本地对照：[设计规范](../DESIGN.md)、[前端现状与改进方向](前端现状与改进方向.md)、[前端契约](frontend-design.md)、[全局样式](../src/styles/global.css)、[首页](../src/pages/index.astro)、[臻彩卡片](../src/components/PrestigeChromaCard.astro)、[筛选组件](../src/components/Filters.astro)。
