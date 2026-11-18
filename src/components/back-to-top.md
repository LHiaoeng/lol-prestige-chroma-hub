# FloatButton.BackTop

[官网 BackTop 示例](https://www.antdv-next.com/components/float-button-cn#float-button-demo-back-top) 使用默认圆形、独立图标按钮，滚动目标为整页。[BaseLayout](../layouts/BaseLayout.astro) 在中英文页面各挂载一个 [BackToTop](BackToTop.astro)。本站范围是这个默认用法。进度圈、按钮组、其他外形及自定义容器超出本组件的范围。

| 契约 | 固定上游源码 | 本站实现与验收 |
| --- | --- | --- |
| 按钮与图标 | [BackTop](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/float-button/BackTop.tsx)、[FloatButton](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/float-button/FloatButton.tsx) | 原生按钮包含 18px 的 VerticalAlignTopOutlined 图标，支持鼠标、触控和键盘，提供中英文可访问名称。隐藏时保留静态节点，通过 inert 退出焦点顺序与无障碍树。 |
| 外观与位置 | [FloatButton 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/float-button/style/button.ts)、[尺寸与间距](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/float-button/style/index.ts)、[Button 默认 Token](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/button/style/token.ts) | 40px 圆形，距右 24px、距底 48px。背景、边框、图标、阴影分别映射到 `--panel`、`--line`、`--text`、`--shadow-popup`。悬停和按下时边框与图标使用 `--gold-hover`、`--gold-active`，焦点采用本站共享 Button 样式。本站计入手机安全区，层级沿用站点浮动导航约定。 |
| 显隐与滚动 | [useScroll](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/float-button/hooks/useScroll.ts)、[滚动动画](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/_util/scrollTo.ts)、[淡入淡出](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/style/motion/fade.ts) | 滚动达到 400px 时显示，进出使用 200ms 线性淡入淡出，激活后以 450ms 三次缓动回到顶部。开启减少动态效果时立即滚动和切换显隐。详见 [滚动逻辑](back-to-top.ts) 与相邻测试。 |

本站使用按下时的金色边框与图标作为点击反馈。上游圆形按钮另有点击波纹，来自 [Button 的 Wave 包装](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/button/Button.tsx)。

本地浏览器已核对英文首页的键盘激活、中文窄屏首页的点击及双语可访问名称。两页的按钮均为 40 × 40px、图标 18px、距右 24px、距底 48px。中文皮肤详情窄屏切换栏与按钮区域之间留有 16px。
