# Issue 跟踪器：GitHub

本仓库的 Issue 与规格均记录在 GitHub Issues 中。所有操作使用 `gh` CLI。

## 约定

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行正文使用 here-document。
- **读取 Issue**：`gh issue view <编号> --comments`，使用 `jq` 筛选评论并同时获取标签。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，并按需添加 `--label` 与 `--state` 筛选条件。
- **评论 Issue**：`gh issue comment <编号> --body "..."`
- **添加或移除标签**：`gh issue edit <编号> --add-label "..."` / `--remove-label "..."`
- **关闭 Issue**：`gh issue close <编号> --comment "..."`

仓库信息从 `git remote -v` 推断；在仓库克隆目录中运行时，`gh` 会自动完成推断。

## 是否将 Pull Request 纳入分诊

**将 PR 作为请求入口：否。** _（如果本仓库将外部 PR 视为功能请求，可改为“是”；`/triage` 会读取此标志。）_

设为“是”后，PR 与 Issue 使用相同的标签和状态，并改用对应的 `gh pr` 命令：

- **读取 PR**：`gh pr view <编号> --comments`；使用 `gh pr diff <编号>` 查看差异。
- **列出待分诊的外部 PR**：运行 `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，仅保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的 PR。
- **评论、标记或关闭**：使用 `gh pr comment`、`gh pr edit --add-label` / `--remove-label`、`gh pr close`。

GitHub 的 Issue 与 PR 共用编号空间，因此 `#42` 可能指向任意一种对象。先运行 `gh pr view 42`，失败后再运行 `gh issue view 42`。

## 当 skill 要求“发布到 Issue 跟踪器”时

创建一个 GitHub Issue。

## 当 skill 要求“获取相关工单”时

运行 `gh issue view <编号> --comments`。

## Wayfinding 操作

供 `/wayfinder` 使用。**地图**是一个 Issue，**子项**是关联到地图的其他 Issue。

- **地图**：一个带有 `wayfinder:map` 标签的 Issue，正文包含 Notes、Decisions-so-far 与 Fog。使用 `gh issue create --label wayfinder:map` 创建。
- **子项**：作为 GitHub 子 Issue 关联到地图。如果仓库未启用子 Issue，则将子项加入地图正文的任务列表，并在子项正文顶部写入 `Part of #<地图编号>`。
- **阻塞关系**：使用 GitHub 原生 Issue 依赖。如果不可用，则在子项正文顶部使用 `Blocked by: #<编号>`。
- **前沿查询**：按地图顺序选择第一个仍开启、未被阻塞且未分配负责人的子项。
- **认领**：运行 `gh issue edit <编号> --add-assignee @me`。
- **解决**：评论处理结果、关闭 Issue，然后在地图的 Decisions-so-far 中追加上下文链接。
