# Space 对照

基准为 Antdv Next `839bec66` 的 [Space 实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/space/index.tsx)、[Item 实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/space/Item.tsx)、[样式与 Token](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/space/style/index.ts)和[中文示例及 API](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/space/index.zh-CN.md)。

| 上游契约 | Astro 实现 |
| --- | --- |
| 默认水平、居中、单行及 `small` 间距 | 根元素使用 `inline-flex`，小、中、大间距映射至 `--space-2`、`--space-3`、`--space-4` |
| 自定义间距与方向 | `size` 接受单值和 `[横向, 纵向]`，数字以 px 计。方向按 `orientation`、`vertical`、`direction` 的顺序解析。水平排列支持 `wrap`，两种方向均支持 `align` |
| 每项有包装元素，分隔符只出现在实际内容之间 | 每个 Astro 插槽包在 `.ant-space-item` 内，空插槽被跳过。分隔符接受文本或 `separator` 插槽 |
| 根、项目、分隔符的语义类名与样式 | `classes` 和 `styles` 接受对象或回调。根内联样式接受对象，RTL 继承 HTML `dir` |

多项内容通过 `items` 指定命名插槽及顺序，例如 `items={['primary', 'secondary']}`。单项内容可以使用默认插槽。这个约定让 Astro 在构建时为每项生成独立包装，并保留插槽内组件的脚本。Vue ConfigProvider、SpaceCompact 和 SpaceAddon 属于独立能力，本站当前只提供 Space。
