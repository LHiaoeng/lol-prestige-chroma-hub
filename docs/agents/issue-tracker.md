# Issue 跟踪器：本地 Markdown

本仓库的规格与实施 Issue 统一保存在 `.scratch/` 中，不发布到 GitHub Issues，也不使用 `gh` 管理工单。

## 目录约定

每项功能使用一个小写 kebab-case 目录：

```text
.scratch/<feature-slug>/
├── spec.md
└── issues/
    ├── 01-<issue-slug>.md
    └── 02-<issue-slug>.md
```

- 功能规格固定为 `.scratch/<feature-slug>/spec.md`。
- 需要拆分实施工作时，在 `issues/` 下按依赖顺序使用两位数字编号。
- 标题与正文使用简体中文；目录名与文件名使用小写英文 kebab-case。
- 规格状态写在 YAML frontmatter 的 `status` 字段。
- 实施 Issue 状态写在文首的 `Status:` 字段。
- 补充讨论追加到文件的 `## Comments` 小节。

## 操作

在 `.scratch/` 中用 `rg` 查找工作项，连同评论读取。发布规格即写入本地 spec.md，包含问题、方案、用户故事、实现与测试决策及范围边界。关闭时将状态改为 `completed` 并记录结果与验证。

## Wayfinding 操作

供 wayfinding 工作流使用。地图与子项均为本地 Markdown：

- **地图**：`.scratch/<feature-slug>/map.md`，包含 Notes、Decisions-so-far 与 Fog。
- **子项**：`.scratch/<feature-slug>/issues/<NN>-<issue-slug>.md`，并在文首写入 `Part of: ../map.md`。
- **阻塞关系**：在子项文首写入 `Blocked by:`，值为相对文件路径。
- **前沿查询**：按数字前缀选择第一个未完成、未阻塞且未标记负责人的子项。
- **认领**：在子项文首写入 `Assignee:`。
- **解决**：将状态改为 `completed`，记录处理结果，并在地图的 Decisions-so-far 中追加相对链接。
