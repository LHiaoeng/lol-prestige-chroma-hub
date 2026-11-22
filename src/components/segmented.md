# Segmented

小小英雄目录使用横向文本单选模式，复用 [Antdv Next 的样式源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/segmented/style/index.ts)中的轨道内边距、默认控件高度与独立选中背景。已选项映射到浮层背景和正文色。原生同名单选输入提供键盘操作，焦点、悬停和禁用使用本站主题。当前适配仅覆盖横向文本选项，选中底块按上游时长同时滑动并调整宽度。系统启用减少动态效果时立即切换。

轨道使用独立的横向组容器作为滑块定位基准。参照锁定依赖 [@v-c/segmented 1.0.6 的 MotionThumb](https://unpkg.com/@v-c/segmented@1.0.6/dist/MotionThumb.js)，选中项平时直接绘制背景和阴影，切换时由临时滑块同时过渡位置与宽度，结束后恢复选中项自身的背景。选中阴影映射到上游 boxShadowTertiary。悬停与按压使用 colorFillSecondary 和 colorFill，作用于未选中且可用的选项，滑块移动期间暂停绘制这两种底色。

组件颜色与阴影默认继承站点语义 Token。主题可以覆盖 `--segmented-*` 变量来单独调整轨道、文字、交互状态和焦点。小小英雄页直接使用组件轨道。

[上游基础示例](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/segmented/demo/basic.vue)对应本站默认尺寸的横向文本模式。`segmented.css` 使用 32px 控件高度、2px 轨道内边距、14px 字号和 11px 标签横向内边距。键盘焦点按上游使用 3px 外描边与 1px 偏移，颜色使用本站主题金色。

`tokens.css` 将浅色 `colorBgLayout` 映射为 #f5f5f5 的轨道，`colorBgElevated` 映射为白色选中块。浅色悬停与按压分别使用 6% 和 15% 黑色填充，选中块使用 `boxShadowTertiary`。尺寸变体、胶囊、图标、纵向和等宽铺满模式不在本站适配范围内。

上游暗色轨道和选中块分别是 #000000 和 #1f1f1f。本站在纯黑页面上使用 #141414 轨道和 #292929 选中块，让轨道可见，并保留接近上游的两层亮度对比。这两个主题变量由共享 Segmented 样式读取，适用于所有 Segmented 实例。
