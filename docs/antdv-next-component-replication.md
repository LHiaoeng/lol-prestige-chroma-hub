# Antdv Next 组件复刻规范

新增、重做或调整以 Antdv Next 为上游的组件时，按本文件执行。任务称“复刻组件”时，默认覆盖该组件的上游公开能力；任务只要求某项能力时，明确支持范围，并核对与它关联的状态。本站继续使用 Astro、原生浏览器 API 和 [DESIGN.md](../DESIGN.md) 定义的暗色金色主题。

## 1. 锁定上游契约

以 `DESIGN.md` 指定的 [GitHub 提交 `839bec66f18a78eeef5c6843b78ea4a54d73b248`](https://github.com/antdv-next/antdv-next/tree/839bec66f18a78eeef5c6843b78ea4a54d73b248) 为最高权威和必须查阅的实现、验收基准。先在该提交下查目标组件实现、样式及子样式、Token 计算、图标、依赖的基础组件和示例，并记录具体源码路径；例如 [Select 样式源码](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/select/style/index.ts)。仓库 `main`、本站 `node_modules` 和打包 CSS 只能辅助定位，不能代替固定提交的源码。

再从官方 [组件总览](https://www.antdv-next.com/components/overview-cn) 找到目标组件，阅读 [For Agents](https://www.antdv-next.com/docs/vue/for-agents-cn)（[Markdown](https://www.antdv-next.com/docs/vue/for-agents-cn.md)）的资料入口，并从 [llms.txt](https://www.antdv-next.com/llms.txt) 打开单组件中文 Markdown，例如 [Button 页面](https://www.antdv-next.com/components/button-cn) 对应的 [button-cn.md](https://www.antdv-next.com/components/button-cn.md)。这些在线资料用于查找用法、示例、API、语义结构和 Token；交互演示在组件页面查看。在线文档可能随版本更新，与固定提交不一致时记录差异并以固定源码为准。读取文档无需安装 Vue、CLI 或运行时依赖。

对目标组件逐项记录上游依据和本站落点：

| 契约 | 必须核对的内容 |
| --- | --- |
| API 与默认值 | 属性、默认值、尺寸、变体、事件、受控与非受控状态 |
| 结构与语义 | 实际 DOM 层级、图标、ARIA、键盘操作、焦点和弹层行为 |
| 样式 | 几何尺寸、内外边距、定位、颜色、字体、圆角、动效及 Token 推导 |
| 状态 | 默认、悬停、聚焦、展开、选中、清空、禁用、空值、长内容及适用的错误状态 |

完成条件：支持范围内每一项都有固定提交的源码依据、本站实现位置和可观察的预期；不支持的能力在对应组件文档中明确列出，不以同名 API 暗示已经实现。

## 2. 在本站复刻

先改 `src/components/` 的共享组件及其样式，再更新静态和动态消费者。按上游默认值、状态切换和事件顺序实现交互；样式逐项映射到 [DESIGN.md](../DESIGN.md) 与 [tokens.css](../src/styles/tokens.css) 的本站主题值，保留上游的尺寸、布局与状态关系。若 Astro 架构、品牌主题、无障碍或明确的产品需求必须产生差异，在组件文档写明上游表现、本站表现和原因。

检查全局 CSS、浏览器默认样式和页面私有规则对组件的叠加。上游写了 `height: 12px`，实际按钮仍可能被本站通用 `min-height` 撑高；以浏览器计算样式和元素边界为准，消除这种冲突，使最终画面与上游契约一致。样式应由共享组件负责，消费者只提供内容或有据可查的局部差异。

完成条件：每项契约都能指向实际代码；复刻范围内不存在未经说明的默认值、行为、DOM 语义或视觉差异。

## 3. 验收真实结果

运行与改动相关的测试和 [AGENTS.md](../AGENTS.md) 要求的检查。行为测试覆盖会改变结果的事件和状态；源码字符串断言只能辅助守住静态契约，不能证明浏览器中的布局正确。在真实页面检查组件的适用尺寸与状态，核对中英文、桌面与手机宽度、键盘与触控，并覆盖静态首屏和浏览器动态生成的消费者。对定位或尺寸问题，读取计算样式和元素边界，再与固定提交的样式推导对照。

完成条件：相关检查通过；真实页面的结构、行为和计算后样式与上游契约对应；所有刻意差异已写入组件文档，未解决差异在交付时逐项说明。
