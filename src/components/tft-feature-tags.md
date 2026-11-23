# TFT 功能标签

[Antdv Next Tag 实现](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/tag/index.tsx)与[样式及 Token](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/tag/style/index.ts)为固定版本依据。

详情使用有边框的默认 Tag，沿用 7px 水平内边距、20px 文本行高、小号字体、标签圆角及主题标签背景。CommunityDragon 图标为 PNG，本地用行内 flex 对齐图标和文字，图标加载失败时保留标签名称。该用法是纯信息展示。

筛选沿用 CheckableTag 的透明默认状态、悬停填色和主色选中态。本地以 label 和原生 checkbox 支持焦点、空格切换及禁用，选项显示与移动端抽屉共用原有 DOM。

实现见 [tft-feature-tags.ts](tft-feature-tags.ts) 和 [tag.css](tag.css)。数据类型匹配由 [tft-cosmetics.test.ts](../domain/tft-cosmetics.test.ts) 验证。
