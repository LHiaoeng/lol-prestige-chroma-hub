# LOL Prestige Chroma Hub

面向公众的英雄联盟臻彩皮肤只读展示站。Astro 在构建时读取 `data/prestige-chromas.json`，生成静态首页、详情页和 SEO 文件，再由 Cloudflare Worker 仅托管 `dist/` 静态资产。站点没有运行时数据库或数据接口。

图片由管理后台上传和维护在 R2，通过 `https://img.chromaart.lol` 公开；本仓库只保存 JSON 中的图片相对路径，不保存图片文件。

## 本地开发

要求 Node.js 22+ 与 pnpm 10。

```bash
pnpm install
pnpm data:validate
```

`data/prestige-chromas.json` 是唯一目录数据源。首次没有数据时它是空数组；不要把完整 JSON 放入 `public/`。

### 开发模式（推荐日常使用）

```bash
pnpm dev
```

浏览器打开 `http://localhost:4321`。Astro 会监听源码和 JSON 变化并自动刷新；如果端口被占用，请使用终端实际输出的地址。

### 生产产物预览（发布前检查）

```bash
pnpm build
pnpm preview
```

`pnpm build` 先生成 `dist/`，`pnpm preview` 再通过当前项目配置的 `wrangler dev` 提供这些静态产物，行为更接近 Cloudflare Workers Static Assets。浏览器访问 Wrangler 在终端输出的本地地址。

两种模式下的图片都会从 `https://img.chromaart.lol` 加载，本地仓库不保存图片文件。断网或远程对象不存在时，页面会尝试外部回退图片，最终显示本地占位图。

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

私有仓库应在 Cloudflare Dashboard 中使用已登录的 GitHub 身份连接 `LHiaoeng/lol-prestige-chroma-hub`，创建 Workers Builds 项目。Deploy to Cloudflare 按钮只支持公开仓库；只有将仓库设为 public 后才能使用：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LHiaoeng/lol-prestige-chroma-hub)

无论使用 Dashboard 连接还是按钮，都必须在首次部署前核对并设置：

- Production branch：`main`
- Build command：`pnpm release:build`
- Deploy command：`pnpm exec wrangler deploy`

不要接受把 package script `build` 自动识别为发布构建的结果。Worker 名称必须与 `wrangler.jsonc` 中的 `lol-prestige-chroma-hub` 一致，否则 Workers Build 会失败。项目是纯静态部署，不需要添加 Secrets、环境变量或运行时 bindings。

生产域名只把 `chromaart.lol` 绑定为 Worker Custom Domain；`www.chromaart.lol` 使用代理的占位 DNS 记录和 Redirect Rule 301 到根域名，`img.chromaart.lol` 继续使用现有 R2 Custom Domain。详细步骤见 [Cloudflare 部署手册](docs/chromaart.lol-Cloudflare部署手册.md)。
