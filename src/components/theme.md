# Header 主题菜单

基准：[固定提交的 ThemeBtn](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/components/theme-btn.vue)、[ThemeIcon](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/components/icons/theme.vue)、[主题布局](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/index.vue)、[首屏初始化](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/index.html)与[主题切换](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/composables/theme.ts)。基线固定在提交 `839bec66f18a78eeef5c6843b78ea4a54d73b248`。

| 上游契约 | 本站实现与可观察结果 |
| --- | --- |
| 主题图标使用画笔形自定义 SVG；入口为文字按钮，Dropdown 鼠标悬停打开并靠右定位 | Header 最右侧使用相同 SVG 的 `theme-switch` 图标，按钮为 16px 图标；复用本站共享 Dropdown 的右对齐、视口避让和触屏／键盘行为 |
| 菜单顺序为系统、浅色、暗色，图标依次为 Sync、Sun、Moon；当前偏好右侧显示 6px 蓝点 | 使用同一顺序和图标；右侧 6px 指示点按生效主题映射为品牌金或浅色主题的深金，并以 `aria-checked` 暴露当前偏好 |
| 官网分别持久化偏好和当前亮暗状态；系统模式监听 `prefers-color-scheme`，主题改变同步根节点 data 属性和 `color-scheme` | `theme-mode` 存储 `system`、`light` 或 `dark`；根节点 `data-theme-preference` 保存选择，`data-theme` 标记生效主题。同源标签页监听 storage 事件。系统变化只影响 system 偏好 |
| 官网默认偏好为 light，支持基于 View Transition 的点击位置圆形切换 | 本站默认 `dark`，沿用既有暗色基线。减少动态效果、键盘操作和系统／跨标签变化直接切换；有指针起点且浏览器支持时从点击处展开 |
| 主题算法由 ConfigProvider 将 `defaultAlgorithm`、`darkAlgorithm` 和其他主题算法组合后推导 Token | 主题由离线核对后的 CSS 语义变量实现，不引入 Vue、ConfigProvider 或主题运行时。浅色使用 `#8a6b38` 作文字和焦点金，按钮填充仍用 `#d7b56d` |

首屏同步脚本在页面绘制前从 localStorage 读取偏好，并根据系统设置解析生效主题。读写存储失败时本页仍可切换，默认暗色；存储清除或值无效时回退为暗色。主题颜色同时更新 `meta[name="theme-color"]`。按钮菜单通过共享 Dropdown 管理焦点、方向键与 Escape。

浅色主题对比度复查将活动输入占位符、Select 分组标题和广告位标签从 `disabled`／`tertiary` 弱化色提升到 `muted`。它们是正常可读内容，不是不可用状态或装饰文案；在白色表面上保持至少 4.5:1 的文字对比度。

需要传达选中或进度的卡片标签下划线与皮肤目录时间线使用 `gold-border`，因此浅色下采用深金，避免亮金在白底上低于非文字对比度要求。按钮填充、徽标和媒体装饰继续使用亮金种子。

验证入口为实际页面 Header 菜单。逐项检查浅／暗系统首次访问、三种选择、刷新、跨页和语言切换、系统变化、同源跨标签同步、存储禁用、减少动态效果、窄屏，以及浅暗主题下菜单位置、指示点和焦点对比度。代表页面至少包括首页、臻彩目录与详情、运行时目录、TFT 目录和博客。
