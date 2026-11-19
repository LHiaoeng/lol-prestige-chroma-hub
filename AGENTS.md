# AGENTS.md

## 项目边界

- Astro 静态站，使用 Node.js 22+、pnpm、TypeScript strict、Zod、Vitest，部署到 Cloudflare Workers Static Assets。本站无运行时数据库或自建数据 API；浏览器按相关 ADR 加载 CommunityDragon 辅助资料。
- 臻彩原画目录在构建时只读 `data/prestige-chromas.json`，完整 JSON 不得进入 `public/`。正常更新整体替换，禁止手改生成字段。以 [Schema](src/domain/chroma.ts) 和[数据契约](docs/数据源与JSON结构.md)为准；字段变更同步类型、消费者、导入与校验脚本及测试。非法数据和路径必须报错。目录图片只存 `img.chromaart.lol` 对应的仓库相对路径。
- 共享组件、专属辅助逻辑和相邻测试放 `src/components/`；领域模型与跨业务纯逻辑放 `src/domain/`；页面和组件组装展示，`src/client/` 仅放必要的浏览器交互，SEO 规则放 `src/seo/`。

## 执行与验收

- 需求明确就执行，仅就影响结果的歧义提问。用 `rg` 定位相关文件、按需读取；小型改动仅在用户要求时写计划或设计文档。联网、浏览器与可视化按任务需要使用。
- 主代理修改并验证。可将独立检索、核对或失败分析交给一名子代理，仅显式要求双代理审查时用两名。委派只给目标、必要引用与交付要求，子代理返回证据和结论，不再委派；不可用时主代理接手。
- 在开始、遇阻或工作超过 60 秒时简报。最终通常不超过五条。
- 遵循邻近代码风格，避免无关重构。行为变更补相邻 `*.test.ts`，功能变更更新受影响文档。面向用户的改动覆盖中英文、移动端、无障碍与 SEO。
- 文档运行 `git diff --check`；代码先跑相关测试；目录数据运行 `pnpm data:validate`；发布改动运行 `pnpm release:build`。测试、类型检查、数据校验与产物审计的失败均须处理。

## 版本控制与安全

- 保留已有改动，禁止破坏性 Git 覆盖。新增任务文件默认纳入版本控制。提交前检查 diff 和 status，只暂存本次文件；单一目的，Conventional Commits 配简体中文说明。
- 未经要求不提交、推送或部署，不擅改 Worker 名称、生产分支、域名或部署流程。不编辑或提交生成目录、密钥、凭据、私有数据、本机绝对路径或远程图片副本；文章本地封面按博客技能处理。

## 按任务读取

- 新增或修改共享组件契约（含单一状态、图标或间距）前按[组件复刻规范](docs/antdv-next-component-replication.md)核对上游；交付源码依据、本站差异与实际验收结果。
- 修改视觉或动效前查 [DESIGN.md](DESIGN.md) 和[前端规范](docs/frontend-design.md)相关段落；排版检查中英文桌面与手机。新增页面或调整布局、响应式按[页面模板](docs/page-templates.md)验收实页。

## Agent skills

### Issue tracker

规格与工单按[本地跟踪约定](docs/agents/issue-tracker.md)维护。

### Triage labels

分诊使用[状态映射](docs/agents/triage-labels.md)。

### Domain docs

工程探索按[领域文档约定](docs/agents/domain.md)查术语与相关 ADR。
