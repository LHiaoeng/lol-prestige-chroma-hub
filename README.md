# LOL Prestige Chroma Hub

面向公众的英雄联盟臻彩皮肤只读展示站。Astro 在构建时读取 `data/prestige-chromas.json`，生成静态首页、详情页和 SEO 文件，再由 Cloudflare Worker 仅托管 `dist/` 静态资产。站点没有运行时数据库或数据接口。

图片由管理后台上传和维护在 R2，通过 `https://img.chromaart.lol` 公开；本仓库只保存 JSON 中的图片相对路径，不保存图片文件。

## 本地开发

要求 Node.js 22+ 与 pnpm 10。

```bash
pnpm install
pnpm data:validate
pnpm dev
```

`data/prestige-chromas.json` 是唯一目录数据源。首次没有数据时它是空数组；不要把完整 JSON 放入 `public/`。

可选的导入器用于处理不符合最终契约的外部导出；管理后台已生成标准 JSON 时，直接覆盖目标文件即可。

```bash
pnpm data:import --input ./exports/prestige-chromas.json --dry-run
pnpm data:import --input ./exports/prestige-chromas.json
```

## 日常更新

每次目录更新按以下流程执行：

1. 用管理后台生成的文件覆盖 `data/prestige-chromas.json`。
2. 运行 `pnpm data:validate`；发布前运行 `pnpm release:build`。
3. 提交 JSON 并推送到 `main`，Cloudflare Workers Builds 会自动重新构建和部署。

图片不随 Git 更新；新增或替换图片应先由管理后台同步到 `img.chromaart.lol` 对应的 R2 对象路径。

## 验证与发布构建

```bash
pnpm test
pnpm typecheck
pnpm data:validate
pnpm release:build
```

`release:build` 会依次运行测试、类型检查、JSON 校验、Astro 构建和产物审计。审计会阻止完整目录 JSON、源数据路径或 source map 进入部署产物。

## 部署到 Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LHiaoeng/lol-prestige-chroma-hub)

也可以在 Cloudflare Dashboard 中连接 GitHub 仓库 `LHiaoeng/lol-prestige-chroma-hub` 并创建 Workers Builds 项目，使用以下设置：

- Production branch：`main`
- Build command：`pnpm release:build`
- Deploy command：`pnpm exec wrangler deploy`

Worker 名称必须与 `wrangler.jsonc` 中的 `lol-prestige-chroma-hub` 一致。项目是纯静态部署，不需要添加 Secrets、环境变量或运行时 bindings。详细步骤见 [Cloudflare 部署手册](docs/chromaart.lol-Cloudflare部署手册.md)。
