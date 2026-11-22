---
status: completed
---

# 快乐工作特效

## 问题

访客希望像在 Antdv Next 官网一样，从 Header 主题菜单开启控件点击特效，并在不同页面保留选择。

## 已确认方案

- 在三种配色选项下方加分隔线和独立的「快乐工作特效 / Happy Work Effect」开关。使用上游笑脸图标，开启时显示主题金色圆点，通过 `menuitemcheckbox` 与 `aria-checked` 表达状态。
- 开关默认关闭，与配色偏好独立，刷新、跨页、语言切换和同源标签页之间保持一致。
- 覆盖本站对应上游 Wave 的控件，包括共享 Button、Radio.Button，以及皮肤和 TFT 目录中对应的复选控件。静态与动态渲染共用同一套规则。普通导航链接、整卡链接、禁用及加载中的控件跳过特效。
- 系统要求减少动态效果时保留访客选择并暂停播放。系统恢复后，下一次符合条件的操作可以播放。

## 动画与触发

- 动画表现对齐上游 1.0.1 的 450ms 缩放与 7／10 点散射，颜色使用本站品牌金和按上游规则推导的第二种颜色。关闭时保留本站当前交互反馈。
- 触发覆盖鼠标点击、触摸点按和产生原生点击的键盘激活。复选控件点标签一次只播放一次，键盘仅移动焦点、程序更新或跨标签页同步时保持静止。菜单开关沿用共享 Dropdown 的关闭和焦点行为。

## 实现和验收

- 沿用 Astro、原生浏览器 API 和本站主题 Token。核对实际控件的可见动效目标，复用一个交互入口覆盖后续生成的控件。动画装饰不接管点击或焦点。
- 用相邻测试覆盖偏好默认值、切换、跨标签页同步、存储不可用、触发边界、减少动态效果及动画清理。实页检查中英文、浅暗主题、桌面和窄屏的菜单，以及静态与动态控件上的效果与键盘行为。

实现已接入 [Header 主题菜单](../../src/components/theme.md#快乐工作特效)。实际动画、触屏和窄屏由维护者验收。

## 上游依据

- [固定提交的 Header 主题菜单](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/layouts/base/components/theme-btn.vue)和[开关存储](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/composables/local-store.ts)
- [固定提交的 Wave](https://github.com/antdv-next/antdv-next/tree/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/_util/wave)和[官网锁定的快乐工作特效 1.0.1 发布产物](https://cdn.jsdelivr.net/npm/@antdv-next/happy-work-theme@1.0.1/dist/index.mjs)
