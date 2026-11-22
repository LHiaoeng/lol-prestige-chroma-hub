# Segmented

小小英雄目录使用横向文本单选模式，复用 [Antdv Next 的样式源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/segmented/style/index.ts)中的轨道内边距、默认控件高度与独立选中背景。暗色轨道映射到本站页面背景，已选项映射到浮层背景和正文色。原生同名单选输入提供键盘操作，焦点、悬停和禁用使用本站主题。当前适配仅覆盖横向文本选项，选中底块按上游时长同时滑动并调整宽度。系统启用减少动态效果时立即切换。

轨道使用独立的横向组容器作为滑块定位基准。选中阴影按上游暗色算法的 boxShadowTertiary 映射到主题 Token。悬停与按压分别使用上游 colorFillSecondary 和 colorFill，滑块使用上游缓动曲线。悬停和按压只作用于未选中且可用的选项。

组件颜色与阴影默认继承站点语义 Token。主题可以覆盖 `--segmented-*` 变量来单独调整轨道、文字、交互状态和焦点。小小英雄页直接使用组件轨道。
