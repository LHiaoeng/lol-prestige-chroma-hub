# Header 主题菜单

基准：[固定提交的 ThemeBtn](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/components/theme-btn.vue)、[ThemeIcon](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/components/icons/theme.vue)、[主题布局](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/index.vue)、[首屏初始化](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/index.html)与[主题切换](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/composables/theme.ts)。基线固定在提交 `839bec66f18a78eeef5c6843b78ea4a54d73b248`。

| 上游契约 | 本站实现与可观察结果 |
| --- | --- |
| 主题图标使用画笔形自定义 SVG；入口为文字按钮，Dropdown 鼠标悬停打开并靠右定位 | Header 最右侧使用相同 SVG 的 `theme-switch` 图标，按钮为 16px 图标；复用本站共享 Dropdown 的右对齐、视口避让和触屏／键盘行为 |
| 菜单顺序为系统、浅色、暗色，图标依次为 Sync、Sun、Moon；当前偏好右侧显示 6px 蓝点 | 使用同一顺序和图标；选中外观由右侧 6px 圆点表达，按生效主题映射为品牌金或浅色主题的深金，并以 `aria-checked` 暴露当前偏好。整行沿用普通菜单项的悬停与焦点样式 |
| 官网分别持久化偏好和当前亮暗状态；系统模式监听 `prefers-color-scheme`，主题改变同步根节点 data 属性和 `color-scheme` | `theme-mode` 存储 `system`、`light` 或 `dark`；根节点 `data-theme-preference` 保存选择，`data-theme` 标记生效主题。同源标签页监听 storage 事件。系统变化只影响 system 偏好 |
| 官网默认偏好为 light，支持基于 View Transition 的点击位置圆形切换 | 本站默认 `dark`，沿用既有暗色基线。减少动态效果、键盘操作和系统／跨标签变化直接切换；有指针起点且浏览器支持时从点击处展开 |
| 官网以 #141414 作为暗色页面首屏底色，Header 使用 80% 容器背景色 | 本站暗色页面 #141414，浅色页面 #ffffff，浏览器主题色与页面底色同步。Header 以容器背景色合成玻璃层。 |
| 主题算法由 ConfigProvider 将 `defaultAlgorithm`、`darkAlgorithm` 和其他主题算法组合后推导 Token | 主题由离线核对后的 CSS 语义变量实现，不引入 Vue、ConfigProvider 或主题运行时。浅色使用 `#8a6b38` 作文字和焦点金，按钮填充仍用 `#d7b56d` |

首屏同步脚本在页面绘制前从 localStorage 读取偏好，并根据系统设置解析生效主题。读写存储失败时本页仍可切换，默认暗色；存储清除或值无效时回退为暗色。主题颜色同时更新 `meta[name="theme-color"]`。按钮菜单通过共享 Dropdown 管理焦点、方向键与 Escape。

卡片使用容器底色和次级边框。Dropdown 使用浮层底色，Tooltip 采用上游聚光底色和白字。原画蒙层和目录吸顶跟随页面底色，折叠卡片使用共享渐隐遮罩。

浅色主题对比度复查将活动输入占位符、Select 分组标题和广告位标签从 `disabled`／`tertiary` 弱化色提升到 `muted`。它们是正常可读内容，不是不可用状态或装饰文案；在白色表面上保持至少 4.5:1 的文字对比度。

需要传达选中或进度的卡片标签下划线与皮肤目录时间线使用 `gold-border`，因此浅色下采用深金，避免亮金在白底上低于非文字对比度要求。按钮填充、徽标和媒体装饰继续使用亮金种子。

皮肤目录 PBE 标记在两套主题下都使用亮金文字与内侧焦点环，背景为原画上的黑色遮罩。遮罩覆盖白色原画区域时，亮金与遮罩仍有约 4.74:1 对比度。

验证入口为实际页面 Header 菜单。逐项检查浅／暗系统首次访问、三种选择、刷新、跨页和语言切换、系统变化、同源跨标签同步、存储禁用、减少动态效果、窄屏，以及浅暗主题下菜单位置、指示点和焦点对比度。代表页面至少包括首页、臻彩目录与详情、运行时目录、TFT 目录和博客。

## 快乐工作特效

| 上游契约 | 本站实现与预期表现 |
| --- | --- |
| 官网菜单使用笑脸图标和开启圆点，偏好由 `happy-mode` 独立保存且默认关闭。[主题菜单](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/components/theme-btn.vue) · [偏好存储](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/composables/local-store.ts) | [BaseLayout](../layouts/BaseLayout.astro) 使用中英文菜单复选项、品牌金圆点及共享 Dropdown 焦点行为。[控制器](happy-work-effect.ts) 同步同源标签页，存储失败时当前页面仍可切换。 |
| HappyProvider 为 Wave 提供额外点按反馈。控件缩放 450ms，最短边小于 20px 时散出 7 点，否则散出 10 点。[Wave](https://github.com/antdv-next/antdv-next/tree/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/_util/wave) · [快乐工作特效 1.0.1](https://cdn.jsdelivr.net/npm/@antdv-next/happy-work-theme@1.0.1/dist/index.mjs) | 原生控件激活监听覆盖有边框的 Button、Radio.Button、皮肤和 TFT 目录复选控件。标签以转发到输入控件的原生点击触发一次。皮肤目录粒子从复选框散出，TFT 目录使用可见的筛选标签。普通链接、禁用、忙碌、危险及错误状态跳过。 |
| 粒子用主题主色及 HSV 色相旋转 -30° 的变体，约 600ms 后清理。关闭时恢复官网默认 Wave。[快乐工作特效 1.0.1](https://cdn.jsdelivr.net/npm/@antdv-next/happy-work-theme@1.0.1/dist/index.mjs) | [特效样式](happy-work-effect.css)使用品牌金及其对应变体，粒子时长 300ms，装饰层不接管点击。关闭时恢复本站当前交互反馈；系统要求减少动态效果、关闭开关或离开页面时取消正在播放的特效。 |

回归检查覆盖独立偏好、存储、粒子数、缩放时长、清理和减少动态效果。实际动画、触屏和窄屏由维护者验收。

缩放在相邻关键帧之间分别使用 `ease-in-out`。粒子按上游的内外边界散开，以宽高变化控制尺寸，描边粒子保留 1px 边框。Radio.Button 的缩放目标为单个选项的可见外框。 [上游动效 1.0.1](https://cdn.jsdelivr.net/npm/@antdv-next/happy-work-theme@1.0.1/dist/index.mjs) · [上游 Radio](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/radio/radio.tsx)
