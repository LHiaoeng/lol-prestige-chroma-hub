# README 本地预览说明设计

## 目标

让首次接触项目的人只看 README 就能启动页面，并明确开发预览与生产产物预览的区别。

## 内容设计

在 README 的“本地开发”部分加入两个层次：

1. 日常开发使用 `pnpm dev`。说明它启动 Astro 开发服务器、支持热更新，默认访问 `http://localhost:4321`，并提醒以终端实际输出为准。
2. 发布前使用 `pnpm build` 后运行 `pnpm preview`。说明 `preview` 对应当前 `package.json` 中的 `wrangler dev`，用于预览已经生成的 `dist/` 静态产物，更接近 Cloudflare Workers Static Assets 的线上行为，访问地址以 Wrangler 终端输出为准。

同时说明本地页面的图片仍从 `https://img.chromaart.lol` 加载，所以断网或远程图片不存在时会进入页面已有的回退/占位逻辑。

## 验证

- 核对 README 中的命令与 `package.json` 当前脚本一致。
- 执行 `pnpm dev --host 127.0.0.1`，确认 Astro 启动并可访问首页。
- 执行 `pnpm build` 和 `pnpm preview --host 127.0.0.1`，确认 Wrangler 使用 `dist/` 启动预览。
- 检查 README Markdown 与 Git diff，无占位内容或旧架构说明。
