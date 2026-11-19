# 前端规范

视觉规则见 [DESIGN.md](../DESIGN.md)，浏览器主题变量见 [tokens.css](../src/styles/tokens.css)。组件实现与测试在 [src/components](../src/components/)。组件变更执行 [上游对照与验收](antdv-next-component-replication.md)，页面结构与响应式见 [页面模板](page-templates.md)。

## 共用规则

- 使用语义 Token 表达主题色、字号、间距、圆角和动效。布局和媒体比例由调用方决定。只有浏览器状态或事件需要客户端脚本。
- 通用图标使用 [命名 Astro 组件](../src/components/icons/) 或客户端 [createIcon](../src/components/icons/create-icon.ts)。颜色继承 `currentColor`。装饰图标对辅助技术隐藏，纯图标控件由调用方提供双语名称。领域图标的名称和 Tooltip 统一在 [domain-icons.ts](../src/components/domain-icons.ts) 维护。
- 回归检查以 [AGENTS.md](../AGENTS.md) 为准。当前项目使用相关测试和真实页面检查验证视觉改动。

## 组件用法

- **FloatButton.BackTop**。[BaseLayout](../src/layouts/BaseLayout.astro) 统一挂载中英文返回顶部按钮。默认圆形按钮达到 400px 时显示，距右 24px、距底 48px，计入安全区。皮肤详情的底部切换栏避开按钮。[上游对照与验收](../src/components/back-to-top.md)

- **Header**。英雄联盟和云顶之弈使用 [Dropdown](../src/components/dropdown.md)。当前路由在菜单项上用 `aria-current`。右侧入口使用 [上游文字按钮](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/button/style/variant.ts) 横向紧邻排列，桌面采用默认尺寸，窄屏采用小号。语言切换和博客保留链接语义。语言字牌参照 [官网 SwitchBtn](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/components/switch-btn.vue)。游戏图标使用同一 `1em` 外框，LOL 图形按可见轮廓映射到 24 单位画布。窄屏隐藏标签时保留可访问名称。
- **Radio.Button**。[RadioButtonGroup](../src/components/RadioButtonGroup.ts) 默认描边，选中项使用主色文字和边框。皮肤目录加载时同步禁用，窄屏横向滚动。Tooltip 包装后仍只让首尾项保留外侧圆角，相邻边框重叠 1px。皮肤媒体和小小英雄视图显式使用实色。 [上游 Radio 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/radio/style/index.ts)
- **Select**。[Select.astro](../src/components/Select.astro) 默认可清空，用 `allowClear={false}` 关闭。清空在原生 `<select>` 上派发冒泡 `change`。`showSearch` 默认关闭，开启后按标签做不区分大小写的包含匹配，支持 `optionFilterProp="value"` 和 `filterOption={false}`。输入通过可冒泡的 `search` 事件传出查询字符串。长选项可用 `popupMatchSelectWidth={false}`，视口不足时换行。下拉滚动条保持可见，边框菜单使用独立 SVG 箭头并垂直居中。无脚本时保留原生选择框。 [上游 Select 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/select/style/index.ts)
- **Card Tabs**。[Card.astro](../src/components/Card.astro) 支持 `small` 和 `medium`。页面链接保留原生导航语义。本地页签通过 `activeTabKey` 或 `defaultActiveTabKey` 选定面板，支持方向键、Home/End 和 `card-tab-change`。
- **Card 悬停**。通用 Card 默认 `hoverable`；全站卡片复用同一悬停表现：鼠标悬停显示手形光标、透明边框和 `--shadow-card`，边框与阴影按 `--motion-mid` 过渡，不改变卡片位置、背景或封面尺寸。预览和卡片操作入口仍由各自规则显隐。实现依据为固定版本 [Antdv Next Card](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/card/style/index.ts#L1817)。
- **Card 标题**。固定上游 [Card 头部样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/card/style/index.ts#L98) 默认采用 16px 强字重，小号卡头使用 14px；[Card.Meta 标题样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/card/style/index.ts#L230) 使用 16px、`colorTextHeading`、强字重和文本省略。本站有意将这些卡头与正文标题合并为 14/22px、600 字重和主文本色，以增加窄卡名称与资料空间。卡头、正文、封面叠字、文章卡和资料树顶层名称均单行省略；仅溢出标题显示全名。样式集中于 [global.css](../src/styles/global.css)，溢出状态由 [card-title.ts](../src/components/card-title.ts) 按实际布局同步，动态列表、视图切换和视口变化也会重新检查。读屏仍读取完整文本，已有详情或资料入口保留原语义；博文占位卡用原生 `details/summary` 提供触屏和键盘的全名展开。
- **Tooltip**。上游 [Tooltip 文档](https://www.antdv-next.com/components/tooltip-cn.md) 将其用于鼠标移入显示、移出隐藏的简短提示，并可代替系统 `title`。本站在 Astro 中用 [tooltip.ts](../src/components/tooltip.ts) 复刻浮层：`createTooltip` 包装已有触发器，`bindTooltip` 原位绑定卡片标题以避免改变卡片布局。卡片标题只有实际溢出时才绑定 Tooltip；悬停和键盘聚焦显示全名，尺寸或内容变化后移除／更新提示。本站保留顶部／底部自动定位；上游其他方向、自定义对齐、箭头开关和受控显隐不属于本次标题使用范围。
- **媒体预览与下载**。[页面模板](page-templates.md#详情页媒体相册) 规定预览交互。[ImageViewer](../src/components/ImageViewer.astro) 的 `downloadFilename` 和动态触发器的 `data-preview-filename` 均使用共享下载方法。文件名优先取指定名，其次取当前媒体名和资源文件名，优先保留源扩展名。按 Windows 命名规则清理并进行 Unicode 规范化，文件名最多 240 个 UTF-8 字节。
- **BorderBeam**。[共享实现](../src/components/border-beam/) 按 [上游样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/border-beam/style/index.ts) 绘制遮罩与圆角路径。皮肤详情只为目录匹配的臻彩启用流光，颜色来自主题金和该记录的全部 `colors`。每种颜色独立渲染并均匀错开相位。首页 Card Tabs 通过 `tabBorderBeam` 提供三条渐变。动画层贴合外边框，卡片根保持 `overflow: visible`，装饰层不捕获指针。减少动态效果或能力不支持时保留静态边框。
