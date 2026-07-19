# AGENTS.md

## 项目边界

- Astro 静态站；构建时读取 `data/prestige-chromas.json`，无运行时数据库或数据 API。
- 使用 Node.js 22+、pnpm、TypeScript strict、Zod 和 Vitest；部署目标为 Cloudflare Workers Static Assets。
- `src/domain/` 放领域模型与纯业务逻辑，`src/client/` 仅放必要的浏览器交互，`src/seo/` 放 SEO 规则。
- `data/prestige-chromas.json` 是唯一目录数据源；完整 JSON 不得进入 `public/`。

## 执行效率

- 需求明确时直接执行；仅在存在会改变结果的实质歧义时提问。
- 单文件、文档、配置和小型修复不创建设计文档或实施计划，除非用户要求。
- 只检查任务相关文件；优先用 `rg` 定位，不读取生成目录、大型数据文件或完整锁文件。
- 不重复读取本轮已有信息，不复述需求或大段命令输出。
- 默认不使用子代理、联网搜索、浏览器或可视化；任务明确需要时除外。
- 过程更新仅用于开始、阻塞或超过 60 秒的工作；最终回复通常不超过 5 条。

## 开发与验证

- 遵循邻近文件风格，不引入无关重构。
- 领域规则优先写成可独立测试的纯函数；页面和组件只负责组装与展示。
- 新增或修改行为时补充相邻的 `*.test.ts`；仅在需要浏览器状态或事件时新增客户端脚本。
- 面向用户的改动同时考虑中英文、移动端、无障碍与 SEO。
- 验证范围与风险匹配：文档运行 `git diff --check`；代码先运行相关测试；数据变更运行 `pnpm data:validate`；发布改动运行 `pnpm release:build`。
- 常用命令：`pnpm dev`、`pnpm test`、`pnpm typecheck`、`pnpm data:validate`、`pnpm release:build`。

## 数据规则

- JSON 契约以 `src/domain/chroma.ts` 和 `docs/数据源与JSON结构.md` 为准。
- 修改字段时同步更新 Schema、类型、消费者、导入/校验脚本及测试。
- 正常更新应完整替换 JSON，不手工维护生成字段。
- 图片只保存 `img.chromaart.lol` 对应的仓库相对路径，不提交远程图片副本。
- 数据与路径校验必须失败即报错，不用宽松默认值掩盖非法输入。

## 版本控制与安全

- 保留并避开用户已有或无关改动；禁止用破坏性 Git 命令覆盖它们。
- 本次任务新增文件默认加入版本控制，用户明确要求排除时除外。
- 提交保持单一目的，使用 Conventional Commits；未经要求不提交、不推送、不部署。
- 提交前检查 `git diff` 与 `git status`，只暂存本次任务文件。
- 不编辑或提交生成目录、密钥、凭据、私有数据、本机绝对路径或远程图片。
- 不绕过失败的测试、类型检查、数据校验或产物审计。
- 不擅自改变 Cloudflare Worker 名称、生产分支、域名或部署流程。
