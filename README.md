# LOL Prestige Chroma Hub

面向公众的英雄联盟臻彩皮肤只读展示站。Astro 生成首页、详情页和 SEO 文件；Cloudflare Worker + D1 提供受限的筛选分页 API；R2 承载图片。

## 本地开发

要求 Node.js 22+ 与 pnpm 10。

```bash
pnpm install
pnpm data:validate
pnpm dev
```

`data/prestige-chromas.json` 是构建时唯一数据源。首次没有数据时它是空数组；不要把数据库导出的原始 JSON 放到 `public/`。

## 导入数据

输入数组使用设计文档中的字段，但不需要 `images`；导入器会计算路径并下载三种尺寸和去重后的 Tag 图片。

```bash
pnpm data:import --input ./exports/prestige-chromas.json --dry-run
pnpm data:import --input ./exports/prestige-chromas.json
pnpm data:import --input ./exports/prestige-chromas.json --refresh
```

所有文件先写入 `.tmp/`，图片状态、Content-Type、大小和魔数全部通过后才替换正式 `data/` 与 `assets/`。输入项可用 `tagImageUrl` 覆盖默认 Tag 来源。

## 验证与构建

```bash
pnpm test
pnpm typecheck
pnpm data:validate
pnpm release:prepare
pnpm build
pnpm audit:build
```

`release:prepare` 生成 `.release/release-id.txt` 和幂等的 `.release/import.sql`。发布产物审计会阻止原始 JSON、`assets/` 数据目录或 source map 被部署。

## Cloudflare

复制 `.env.example` 配置本地变量，在 `wrangler.jsonc` 中替换 D1 database ID。首次部署需创建 `lol-prestige-chroma-hub-db` D1 数据库、`lol-prestige-chroma-hub-images` R2 Bucket、自定义域名与最小权限 API Token，然后运行迁移：

```bash
pnpm cloudflare:init
pnpm wrangler d1 migrations apply lol-prestige-chroma-hub-db --remote
```

GitHub 仓库需配置 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN` Secrets。推送 `main` 后流水线依次执行测试、校验、R2 增量同步、D1 新版本导入、静态构建、产物审计、Worker 部署、生产烟测和旧 D1 版本清理。烟测失败时流水线自动执行 `wrangler rollback` 恢复上一个 Worker 版本；D1 会保留最近两个发布版本。
