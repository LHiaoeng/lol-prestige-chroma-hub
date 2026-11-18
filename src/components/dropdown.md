# Dropdown 对照与支持范围

基准：[Antdv Next `839bec66` 的 Dropdown 实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/dropdown/dropdown.tsx)、[Dropdown 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/dropdown/style/index.ts)、[Menu 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/menu/style/index.ts)及[中文文档](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/dropdown/index.zh-CN.md)。本站以 `DESIGN.md` 的暗金 Token 替换上游主题色。

| 上游契约 | 本站落点与可观察结果 |
| --- | --- |
| 弹层透明；菜单使用 elevated 背景、4px 内边距、8px 圆角和暗色阴影 | `src/styles/global.css` 的 `.ant-dropdown-popup` / `.ant-dropdown-menu` |
| 菜单项 14/22px、5px 12px 内边距、4px 圆角；悬停、选中、禁用及危险状态 | `src/styles/global.css` 的菜单项规则；当前路由用 `aria-current`，版本选项用 `aria-checked` |
| 默认 `bottomLeft`，距触发器 4px，允许避开视口边缘 | `Dropdown.astro`、`dropdown-menu.ts`；本站还支持 `bottomRight` 和空间不足时向上翻转，长菜单在可用空间滚动 |
| Dropdown 只为调用方提供的触发元素绑定行为，不决定其 Button 外观 | `Dropdown.astro` 接受 `trigger` 插槽中的按钮；调用方使用 Button 类，Dropdown 负责菜单关联与展开状态；运行时构造器也接受调用方的按钮 |
| 关闭、菜单键盘导航与焦点管理 | `dropdown-menu.ts`；点击/触控触发，方向键、Home/End、Escape、失焦和外部点击；禁用项不激活 |

本站静态组件 `Dropdown.astro` 与运行时构造器 `createDropdown` 使用相同 class、ARIA 和交互绑定。静态调用方提供 `<button slot="trigger">` 并自行选择 Button 外观；Dropdown 绑定交互时设置触发器的展开状态和菜单关联属性。菜单内容由调用方提供 `<li role="none">` 与带 `data-ant-dropdown-item` 的按钮或链接；动态填充的资料页操作菜单也遵循此结构。

Header 的云顶菜单选项使用 `tft-companions` 和 `tft-arenas` 领域图标，与对应页面的图形语义一致。

本站目前没有采用上游的 hover/contextmenu 触发、完整十二方向定位、箭头、子菜单、分组、可控 `open`、`popupRender`、`Dropdown.Button`、自定义容器或语义样式 API。调用方只需点击触发的命令菜单；这些上游属性未在本站组件上声明，也不应按同名能力使用。上游默认 hover，本站为兼顾触控而使用 click；Astro 和原生 DOM 实现不引入 Vue 运行时。
