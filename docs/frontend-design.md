# 前端视觉统一与治理

本文供修改本站前端的 Agent 和开发者使用，只规定视觉规则的来源、落地方式、检查与维护流程。页面行为、数据、双语和 SEO 的细节见文末入口；仓库边界与版本控制遵循 [AGENTS.md](../AGENTS.md)。本站保留 Astro 静态架构、单一暗色金色主题和原画视觉焦点，不为借鉴 Antdv Next 而引入 Vue 或主题运行时。

## 1. 单一事实来源：Design Tokens

| 层次 | 事实来源 | 职责 |
| --- | --- | --- |
| 视觉语义与组件范式 | [DESIGN.md](../DESIGN.md) | 规定颜色层级、字体、尺寸、状态和允许的例外 |
| 浏览器主题基础值 | [tokens.css](../src/styles/tokens.css) | 集中定义实际消费的 CSS 变量 |
| 共享实现 | [global.css](../src/styles/global.css)、[backgrounds.css](../src/styles/backgrounds.css)、[article.css](../src/styles/article.css) | 控件、固定背景媒体、布局、响应式覆盖和长文排版 |
| 局部实现 | 对应 Astro 组件或页面 | 仅定义媒体比例、专属网格、图表及功能几何 |

修改视觉规则时，先核对 `DESIGN.md` 与 Token，再更新共享组件和所有消费者。本文件不复制 Token 数值。独立控件触控目标、原画展示等例外须符合 `DESIGN.md`，不能靠页面私有颜色或字号建立另一套主题。

Select 的输入框、弹层、选中与悬停项统一使用暗色语义 Token；下拉列表保留可见的细滚动条，滑块随暗色文本层级显示，悬停时增强对比。长选项可按上游 `popupMatchSelectWidth={false}` 让弹层至少与控件同宽并随内容展开；视口不足时选项换行。与上游单选默认值一致，搜索须由 `showSearch` 显式开启；首页英雄、版本、分类，小小英雄类别、种类及宇宙系列等选项较多的筛选已开启。开启后默认按选项标签进行不区分大小写的包含匹配，`optionFilterProp="value"` 可改为匹配选项值，`filterOption={false}` 关闭本地过滤；搜索输入在原生 `<select>` 上派发带查询字符串 `detail` 的冒泡 `search` 事件，供远程搜索监听，行为对照 [固定版本 Antdv Next Select 搜索示例](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/select/demo/search.vue)。无脚本时仍保留原生选择框。

Dropdown 对照 [Antdv Next Dropdown 样式源码](https://github.com/antdv-next/antdv-next/tree/main/packages/antdv-next/src/dropdown/style)：弹层本身透明，菜单承载 elevated 背景、4px 内边距、8px 圆角与阴影；菜单项使用 5px 12px 内边距，并覆盖悬停、选中、禁用和危险状态。触控输入不改变菜单项的默认尺寸。
边框菜单的触发箭头使用独立 SVG 图标节点，在按钮的 flex 布局中垂直居中；不以文字字形充当箭头。

目录数据、语言路由和 SEO 各有自己的事实来源，分别查 [领域模型](../src/domain/)、[国际化配置](../src/i18n/config.ts) 和 [SEO 模块](../src/seo/)；视觉治理不覆盖这些规则。

## 2. 组件库和模式库

“组件库”指仓库内 [src/components/](../src/components/) 的复用组件、相邻逻辑、样式和测试，不是独立软件包。先复用已有的 Input、Select、Dropdown、Button、Divider、Masonry、Tree、[领域图标映射](../src/components/domain-icons.ts)、分页、臻彩卡片、图片查看器和操作菜单；表格等共享外观目前由全局或文章样式承担。Checkbox 和 Toast 等尚无实际需求的组件不因范式清单而预建。需要 Antdv Next 组件行为时，在本站技术栈内新增本地组件适配，避免引入 Vue 运行时。

| 页面模式 | 当前入口 | 重点状态 |
| --- | --- | --- |
| 首页博客、导航与图鉴 | [首页](../src/pages/index.astro)、[HomeLatestBlog](../src/components/HomeLatestBlog.astro)、[HomeToolNavigation](../src/components/HomeToolNavigation.astro)、[Card](../src/components/Card.astro)、[Menu](../src/components/Menu.astro)、[Alert](../src/components/Alert.astro)、[HomeChromaCatalog](../src/components/HomeChromaCatalog.astro) | “博客”和“英雄联盟”分层标题；无卡片标题的双语页签链接包住目录；目录 Alert 简述臻彩并以带无障碍名称的外链图标链接双语指南；空结果、错误；静态首批与动态重绘一致 |
| 臻彩详情与预览 | [详情页](../src/pages/chromas/[slug].astro)、[ImageViewer](../src/components/ImageViewer.astro)、[MediaViewer](../src/components/MediaViewer.astro)、[DetailActionMenu](../src/components/DetailActionMenu.astro) | 缺失字段、图片回退、图片/视频分组预览、缩放与媒体播放 |
| 运行时资料 | [RuntimeReferenceRoot](../src/components/RuntimeReferenceRoot.astro)、[RuntimeDetailSummary](../src/components/RuntimeDetailSummary.astro)、[Breadcrumb](../src/components/Breadcrumb.astro)、[Typography](../src/components/Typography.ts)、[Carousel](../src/components/Carousel.ts)、[Radio.Button](../src/components/RadioButtonGroup.ts)、[Button](../src/components/Button.ts)、[Tooltip](../src/components/tooltip.ts)、[Divider](../src/components/Divider.ts)、[Masonry/Tree 样式](../src/styles/global.css)、[Tree](../src/components/Tree.ts)、[Dropdown](../src/components/Dropdown.astro)、[Skeleton](../src/components/Skeleton.astro)、[Spin](../src/components/Spin.astro)、[Empty](../src/components/Empty.astro)、[Alert](../src/components/Alert.astro)、[chroma-card](../src/components/chroma-card/) | 无分页瀑布流、宇宙与皮肤系列层级、首次加载占位、保留结果刷新、空结果、错误与重试、数据通道 |
| 博客列表与长文 | [BlogIndexView](../src/components/BlogIndexView.astro)、[article.css](../src/styles/article.css) | 分页、双语长标题、来源信息 |
| 说明与错误页 | [About](../src/pages/about.astro)、[404](../src/pages/404.astro) | 可读性、返回入口、无脚本内容 |

新增或修改组件时明确：**尺寸、变体、默认/悬停/焦点/禁用等适用状态、交互、无障碍、双语、响应式**。交互控件使用 `small`、`medium`、`large` 三档，高度分别为 24、32、40px，默认 `medium`；Card 的 `size` 只有 `small` 与 `medium` 两档控制密度和页签字号。页签命中区遵守 `DESIGN.md`。Card 页签支持页面链接与面板切换两种模式；本地面板初始页签由 `activeTabKey` 或 `defaultActiveTabKey` 指定，随后用方向键、Home/End 键切换，并触发 `card-tab-change` 事件；页面链接保留原生导航语义。只有浏览器状态或事件需要脚本时才加客户端代码。两个页面出现同一规则时，先检查能否放回现有组件或共享样式；局部差异必须有内容或功能原因。

新增或重做页面时，按 [页面模板契约](page-templates.md) 选类型并核对骨架；页面布局或响应式改动按其中的 [响应式适配](page-templates.md#响应式适配) 验收。复用 `BaseLayout` 和现有页面组件。

需要复刻 Antdv Next 控件的外观或交互时，查看 [Antdv Next 源码仓库](https://github.com/antdv-next/antdv-next) 中对应的组件、样式和主题实现；按 [DESIGN.md](../DESIGN.md) 记录的上游版本核对源码，再映射到本站 Token 与 Astro 组件。媒体预览以 [Image 组件](https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/image/index.tsx)、[PreviewGroup](https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/image/PreviewGroup.tsx) 和 [预览样式](https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/image/style/index.ts) 为行为与结构依据；本站使用原生 dialog 和 DOM 脚本适配 Astro，图片与视频共用视口内等比最大展示、缩放、拖动、旋转、双轴翻转、重置、当前媒体原文件下载及分组切换；工具栏位置保持一致，视频播放、进度和音量控件独立于画面变换层并固定在工具栏上方。打开预览继承视频的进度、音量和播放状态，切换时暂停并记录视频，关闭时同步进度并恢复页面视频进入预览前的播放状态。画面区域承担滚轮/双指缩放和放大后的拖动；播放控件的键盘与指针操作不触发画面变换或媒体切换。媒体加载、失败、重试、焦点返回及滚动锁定由共享预览器统一处理。

媒体下载支持 `downloadMediaFile(url, filename?)`；静态 `ImageViewer` 通过 `downloadFilename` 属性、动态触发器通过 `data-preview-filename` 传入文件名。未传时使用当前媒体名称，无名称时沿用资源文件名；皮肤轮播与预览使用相同的实体名称和媒体类别。可传基础文件名或含媒体扩展名的完整文件名，优先保留源地址中的扩展名，缺失时保留传入文件名的扩展名。共享下载方法按 [Windows 文件命名规则](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file) 处理非法字符、控制字符、保留设备名及首尾点和空白；保留中文并进行 Unicode 规范化，名称按 Unicode 码点截到最多 240 个 UTF-8 字节且保留扩展名。保存目录、完整路径限制及重名处理由浏览器和操作系统负责。

BorderBeam 使用本地 [border-beam](../src/components/border-beam/) 组件，按 [Antdv Next 839bec6 的样式源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/border-beam/style/index.ts) 复刻遮罩和圆角运动路径。皮肤详情炫彩板块中，只有目录匹配到的臻彩卡片启用“系统主题金色 + 该目录记录的全部 `colors`”独立流光；流光数量随臻彩颜色数量变化，没有臻彩颜色时只显示系统主题流光。颜色来自本地臻彩目录，不从图片取色，也不使用固定紫、蓝配色。基础皮肤与普通炫彩不启用。组件 `createBorderBeams({ colors, duration })` 以颜色数组长度决定流光数量，将各条相位均匀分布在一圈内；`duration` 为正数秒，未配置时仍默认单条流光、6 秒一圈、1px 线宽、100px 光束；可通过 `--border-beam-duration`、`--border-beam-line-width`、`--border-beam-size`、`--border-beam-gradient`、`--border-beam-delay` 和 `--border-beam-inset` 调整。宿主提供定位上下文与圆角；按 [Card 源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/card/style/index.ts) 保留根节点 `overflow: visible`，封面单独设置顶部 8px 圆角并以 -1px 上、左、右边距贴合 1px 外边框，流光层使用 `inset: -1px` 覆盖同一条外圆角，不在内容区绘制第二条内弧；装饰层不捕获指针，不替代卡片焦点与状态边框。减少动态效果或浏览器不支持遮罩/运动路径时隐藏流光，保留原有边框。上游 MIT 许可保存在组件目录。

首页 Card Tabs 通过 `tabBorderBeam` 渐变数组启用三条独立流光（金→品红、紫→青、青→主题金）；静态 `BorderBeam.astro` 为每条渐变渲染装饰层并均匀错开相位，复用上述动画与无障碍降级规则。配色来自主题金色和上游 purple/cyan/magenta Token；臻彩卡片仍使用目录自身颜色。

## 3. 代码层强制约束

现有自动门禁是相关 Vitest 测试、`pnpm typecheck`、`pnpm data:validate` 和 `pnpm release:build`。它们验证行为、类型、数据和产物，**目前没有独立的 Stylelint、Token 一致性检查或自动视觉回归**，不能把人工约定说成已由工具强制。

代码约束按以下范围逐步接入工具：

- 共享控件的品牌色、字号、圆角、间距和动效时长使用语义 Token；原画内容色、媒体比例和专属布局允许局部值。先审计现有合法值，再用 Stylelint 或小型仓库检查限制新增硬编码，避免对所有 `px` 一刀切。
- 新图标优先复用现有资产或 SVG，界面图标的颜色尽量继承 `currentColor`；尺寸与线宽按所在组件统一。当前没有独立图标库，不为此新增依赖。
- 动效时长使用共享 Token，新增重复缓动规则时再收敛。
- 本站只有暗色主题，没有亮暗切换需求。未来若增加主题，先调整语义 Token 和组件状态，不在页面中分叉一套样式。

视觉检查工具真正接入 `package.json` 和发布命令后，才列为必过门禁。工具必须报告具体文件与位置，并允许可审查的内容专属例外；截图或静态扫描不能替代真实页面的视觉判断。

## 4. 流程与协作

1. **修改前**：检查工作区已有改动；按任务查 `DESIGN.md`、相关组件、调用方、静态与动态渲染路径以及中英文页面。确认改动会触及哪些测试、文档与 SEO 输出。
2. **实现时**：先改共享层，再改页面特有布局；同步处理默认、焦点、禁用、空、错误和图片失败等适用状态。需要新组件或新 Token 时说明复用场景，不为单页差异扩充系统。
3. **验证时**：先运行相关测试。文档修改运行 `git diff --check`；数据变更运行 `pnpm data:validate`；发布相关改动运行 `pnpm release:build`。视觉改动还要查看真实页面；布局和响应式改动按 [响应式适配](page-templates.md#响应式适配) 验收，其他改动核对受影响的语言、浏览器、交互与状态。
4. **交付前**：检查 diff 与状态，只报告本次文件。同步更新失效规范；关键架构或视觉边界决策写入 [ADR](adr/)。未经用户要求不提交、推送或部署。

若使用 Figma 设计稿，应使用共享组件和 Variables，并与 `DESIGN.md` 对齐；当前仓库没有连接的 Figma 组件库。若采用 PR 流程，评审描述应回答：是否复用了 Token 和组件、是否新增硬编码或例外、检查了哪些语言/视口/浏览器/状态、运行了哪些门禁。当前仓库没有已接入的 PR 模板，模板建立前由提交者在描述中逐项说明。

## 5. 存量治理

全站已完成一轮暗金主题和共享样式迁移，后续按问题增量收敛，不重新启动全站改造：

1. 按页面模式审计真实画面，记录颜色、排版、间距、控件状态和信息层级的不一致，并区分设计缺陷与内容特有差异。
2. 优先修复影响多个页面的 Token 或组件；局部问题留在对应页面。修改卡片时同时检查静态首批与浏览器重绘。
3. 在现有代码可通过的基础上接入针对性的样式检查，再评估视觉回归；不要为了工具通过掩盖合法例外或绕过失败检查。
4. 新页面直接使用共享体系。每季度复核代表页面和文档，由负责人记录问题、处理结果与仍需跟进的例外；失效规则及时修改或删除。

**相关细节**：[数据源与 JSON](数据源与JSON结构.md) · [国际化与多语言 SEO](国际化与多语言SEO.md) · [英雄联盟资料页面信息规范](英雄联盟资料页面信息规范.md) · [Antdv Next 设计研究](antdv-next-design-research.md) · [ADR 0003](adr/0003-adapt-antdv-next-design-to-astro.md)。具体页面行为以对应组件、领域模块及相邻测试为准。
