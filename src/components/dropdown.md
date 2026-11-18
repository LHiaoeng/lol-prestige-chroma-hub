# Dropdown 对照与支持范围

基准：[Antdv Next `839bec66` 的 Dropdown 实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/dropdown/dropdown.tsx)、[Dropdown 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/dropdown/style/index.ts)、[Menu 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/menu/style/index.ts)及[中文文档](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/dropdown/index.zh-CN.md)。本站以 `DESIGN.md` 的暗金 Token 替换上游主题色。

| 上游契约 | 本站落点与可观察结果 |
| --- | --- |
| 弹层透明；菜单使用 elevated 背景、4px 内边距、8px 圆角和暗色阴影 | `src/styles/global.css` 的 `.ant-dropdown-popup` / `.ant-dropdown-menu` |
| 菜单项 14/22px、5px 12px 内边距、4px 圆角；悬停、选中、禁用及危险状态 | `src/styles/global.css` 的菜单项规则；当前路由用 `aria-current`，版本选项用 `aria-checked` |
| 普通菜单项悬停使用 `controlItemBgHover` | 本站保留暗色悬停背景，并为普通项的悬停和键盘聚焦增加主色前景。选中项悬停使用主文本色，保证文字在选中悬停背景上的可读性 |
| 默认 `bottomLeft`，距触发器 4px，允许避开视口边缘 | `Dropdown.astro`、`dropdown-menu.ts`；本站还支持 `bottomRight` 和空间不足时向上翻转，长菜单在可用空间滚动 |
| [Basic 示例](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/dropdown/demo/basic.vue) 由调用方提供触发元素，默认鼠标悬停打开 | `Dropdown.astro` 与 `createDropdown` 支持调用方提供的按钮或链接，由调用方决定外观。站点导航、资料版本和详情操作均使用默认悬停。鼠标可从触发器移到菜单，移出后关闭。触屏与键盘可激活触发器 |
| 关闭、菜单键盘导航与焦点管理 | `dropdown-menu.ts` 负责方向键、Home/End、Escape、失焦和外部点击；禁用触发器及禁用项不激活 |

Astro 的 `trigger` 插槽接受一个直接子元素 `<button>` 或 `<a>`。运行时构造器使用 `createDropdown(id, trigger, items, mode?)`，触发模式也默认为 `hover`。用作触发器的链接承担菜单按钮语义，点击时取消导航，按 Enter 或空格激活。菜单内容由调用方提供 `<li role="none">` 与带 `data-ant-dropdown-item` 的按钮或链接。

Header 的云顶菜单选项使用 `tft-companions` 和 `tft-arenas` 领域图标，与对应页面的图形语义一致。

上游 Basic 用 `<a>` 包住 Space、文字和下箭头。资料版本和详情操作复用该行内文字样式，左右内边距为零，内部图文间距为 8px。Header 调用方为其触发器选择共享的文字按钮样式。所有 `<a>` 触发器通过 `role="button"` 和 `tabindex="0"` 提供键盘操作。展开后的菜单项按上游 Dropdown 样式显示悬停底色。

本站目前没有采用上游的 contextmenu 触发、完整十二方向定位、弹层箭头、子菜单、分组、可控 `open`、`popupRender`、自定义容器或语义样式 API。本站用原生 DOM 适配 Astro。
