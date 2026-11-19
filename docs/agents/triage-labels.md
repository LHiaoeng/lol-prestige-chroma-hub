# 分诊状态

相关 skill 使用五种标准分诊角色；下表将这些角色映射到本地 Markdown 规格和实施 Issue 中的状态值。

| mattpocock/skills 中的标签 | 本地状态值          | 含义                         |
| -------------------------- | ------------------- | ---------------------------- |
| `needs-triage`             | `needs-triage`      | 需要维护者评估此 Issue       |
| `needs-info`               | `needs-info`        | 等待报告者补充信息           |
| `ready-for-agent`          | `ready-for-agent`   | 规格完整，可交由自主代理处理 |
| `ready-for-human`          | `ready-for-human`   | 需要人工实现                 |
| `wontfix`                  | `wontfix`           | 不会处理                     |

按[工单约定](issue-tracker.md)更新状态字段。表中五项只用于分诊；完成工作时使用工单约定的完成状态。
