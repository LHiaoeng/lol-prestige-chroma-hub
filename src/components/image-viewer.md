# 图片预览入口

四个英雄联盟外观目录使用相册模式。打开图片时从该图开始，按当前已加载结果的页面顺序切换，显示序号与总数。只有一张图时隐藏切换控件，首尾停住并禁用对应箭头。预览继续使用站内查看器的键盘和焦点处理。相册内容随列表分批加载，缺图或图片加载失败后禁用的入口不加入相册。 [Antdv Next PreviewGroup](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/image/PreviewGroup.tsx) · [上游切换边界](https://unpkg.com/@v-c/image@1.1.2/dist/Preview/index.js)

固定版本的 [Antdv Next Image 遮罩](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/image/style/index.ts#L58-L77) 使用手形光标。本站在 [全局样式](../styles/global.css) 通过 `data-media-preview-trigger` 为可用的预览入口统一使用 `cursor: pointer`，静态图片、运行时卡片和轮播共用此规则。原生禁用的运行时入口继续显示等待光标，预览弹层中的拖拽光标沿用已有状态。已核对所有入口的标记及样式来源。
