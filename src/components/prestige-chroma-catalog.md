# 臻彩原画列表

## 上游依据

固定提交为 `839bec66f18a78eeef5c6843b78ea4a54d73b248`。

| 项目 | 上游表现 | 本站实现与验收 |
| --- | --- | --- |
| [Listy 无限滚动示例](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/listy/demo/infinite.vue) | 列表距离滚动底部 200px 时追加数据，加载中避免重复触发 | `browser-app.ts` 检查网格底部与页面视口的距离，通过单个待处理动画帧合并滚动、尺寸和图片加载事件。浏览器适配测试覆盖整行批量、追加无重复和末批停止。 |
| 列表呈现 | 示例为固定高度、虚拟化 Listy，单批 50 项 | 本站采用普通页面卡片网格，手机两列。每批最多 24 张，按当前列数排满整行；列数变化保留已有卡片，后续追加补齐当前行。数据已随页面提供，追加同步完成。 |
| 标题、图标与分隔 | 沿用站内现有 DomainIcon 和 Divider 的契约 | `PrestigeChromaCatalog.astro` 组装标题、命中数量、筛选与卡片，筛选及键盘操作复用现有组件。卡片全名由共享标题 Tooltip 提供。 |

首页由 `HomeChromaCatalog.astro` 输出全部新增条目和完整列表入口。完整列表的筛选与排序状态写入 URL，恢复条件时从首批重新展示。追加保持既有卡片节点和焦点。

筛选表单复用本站 Input、Select 和 Button 样式。「清除」使用默认描边按钮。名称搜索停输 200ms 后生效，回车立即生效；下拉选项变更立即应用当前表单并取消待执行的搜索。手机筛选区吸顶，常驻搜索与分类，其他筛选和排序通过底部抽屉展示。摘要显示全目录总数，筛选区在控件下方居中显示命中数，使用次要文字样式。手机端搜索、分类和筛选按钮同排，间隔 8px。本站当前没有共享 Drawer，抽屉参照 [Antdv Next Drawer 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/drawer/style/index.ts) 的遮罩与页头、内容、页脚结构，使用原生 `dialog.showModal()` 提供焦点和 Esc 行为。按钮、输入和下拉复用共享组件，Select 弹层挂载到打开的对话框内。宽屏仍直接展示同一组筛选字段。参照固定提交的 [Button 示例](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/docs/src/pages/components/button/demo/basic.vue)。

脚本初始化前使用浏览器原生选择框。初始化后由共享 Select 接管样式、下拉和状态。筛选区仅设置网格、间距和响应式布局，控件沿用共享样式。参照固定提交的 [Select 样式](https://github.com/antdv-next/antdv-next/blob/839bec66f18a78eeef5c6843b78ea4a54d73b248/packages/antdv-next/src/select/style/index.ts)。

筛选区直接调用共享 Input、Select 和 Button。Input 与 Select 使用默认尺寸和描边样式。Input 聚焦按上游描边变体使用主题色边框和 2px 浅色阴影，关闭额外 outline。「清除」使用默认描边 Button 和 `htmlType="reset"`。Select 与上游一致，默认关闭清空。筛选区对英雄、版本、分类和新增状态显式开启清空，前三项也开启选项搜索。抽屉触发器、清除和查看结果使用共享 Button。官方用法见 [Select](https://www.antdv-next.com/components/select-cn.md)、[Input](https://www.antdv-next.com/components/input-cn.md) 和 [Button](https://www.antdv-next.com/components/button-cn.md)。

## 验证记录

底部抽屉采用上游默认尺寸 378px，页头内边距 16px × 24px，内容内边距 24px，页脚内边距 8px × 16px，起始侧关闭按钮为 24px。遮罩、分隔线和前景色映射到站内对应主题 Token。原生 `dialog` 适配当前未实现上游开合动效。

浏览器适配测试验证五列首批 20 张、两列首批 24 张、列数切换后的补行、短视口自动续载、筛选清除与历史恢复。构建测试验证双语路由、首页卡片选择、完整目录数据与面包屑。

脚本初始化前，五列容器通过容器查询从静态首批中显示 20 张。初始化后由客户端根据实际列数控制首批和后续加载。

Chrome 已核对中英文页面在 390、980、1020、1160 和 1220 CSS px 下的静态首批，以及五列布局中启用脚本后的滚动追加。完整的视觉、触屏和键盘验收待补。
