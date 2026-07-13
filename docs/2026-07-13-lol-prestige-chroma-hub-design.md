# 臻彩皮肤独立展示站设计

## 1. 项目概述

- 项目名称：LOL Prestige Chroma Hub
- 本地目录：`D:\WebstormProjects\lol-prestige-chroma-hub`
- GitHub 仓库：`https://github.com/LHiaoeng/lol-prestige-chroma-hub.git`
- 生产域名：`https://chromaart.lol`
- 图片域名：`https://img.chromaart.lol`
- 更新频率：每个英雄联盟游戏版本更新一次，约两周一次

本项目将臻彩皮肤展示能力从现有管理系统中独立出来，建设一个面向公众的只读展示站。项目优先使用 Cloudflare 免费生态，并通过私有 Git 仓库驱动数据更新和自动部署。

## 2. 目标与非目标

### 2.1 目标

1. 提供响应式臻彩皮肤首页，首页同时承担列表、搜索、筛选、排序和分页功能。
2. 为每条臻彩皮肤生成独立、可分享、可被搜索引擎收录的详情页。
3. 原始 JSON 和完整搜索索引不进入网站部署产物，不提供可直接下载完整数据的公开 URL。
4. 将三种尺寸的臻彩图片和 Tag 图标同时保存在私有 Git 仓库及 Cloudflare R2。
5. 通过本地导入命令完成数据规范化、图片下载和资产生成。
6. 推送 `main` 分支后自动完成校验、R2 同步、D1 导入、构建、部署和烟测。
7. 在免费额度内运行，并允许后续平滑升级 Cloudflare 付费套餐。

### 2.2 非目标

- 不迁移原管理系统的后台权限、CRUD、Redis、XXL-Job 和 Word/Markdown 导出能力。
- 不提供在线上传 JSON 或网页内编辑数据的管理后台。
- 不提供完整数据导出接口。
- 首版不建设独立列表页、英雄聚合页、版本时间线、分类专题页或用户账号体系。
- 不保证公开展示过的字段无法被逐页采集；本项目只阻止通过单个公开 URL 直接下载完整原始数据。

## 3. 技术方案

采用 Astro 静态页面、Cloudflare Worker API、D1 和 R2 的混合架构：

```text
私有 Git 仓库
  ├─ data/prestige-chromas.json
  └─ assets/
       ├─ chromas/{instanceId}/site3.jpg
       ├─ chromas/{instanceId}/site4.jpg
       ├─ chromas/{instanceId}/site5.jpg
       └─ tags/{tagId}.png
            ↓ GitHub Actions
       ├─ 校验数据与图片
       ├─ 增量同步图片到 R2
       ├─ 导入公开检索字段到 D1
       ├─ Astro 生成首页和详情页
       └─ 部署 Worker 与静态资源
                    ↓
              chromaart.lol
       ├─ 静态首页首屏
       ├─ 静态详情页
       └─ 筛选 API → Worker → D1
```

### 3.1 组件职责

- Astro：生成首页首屏、全部详情页、404 页面、Sitemap 和 SEO 元数据。
- TypeScript 导入脚本：读取数据库导出的 JSON，规范化数据并下载图片到仓库。
- Cloudflare Workers Static Assets：托管静态页面和前端资源。
- Worker API：处理首页筛选、排序和分页，只返回当前页数据。
- D1：保存列表检索需要的公开字段，并按发布版本隔离数据。
- R2：保存公开图片，使用 `img.chromaart.lol` 对外服务。
- GitHub Actions：执行完整 CI/CD 流程。

## 4. 页面与路由

首版只有两类页面。

### 4.1 首页 `/`

首页同时承担列表页功能：

- 顶部展示 Chroma Art 品牌和简短介绍。
- 下方直接展示臻彩卡片列表。
- 支持名称关键词、英雄、游戏版本、分类、新增状态筛选。
- 支持白名单排序和分页，默认每页 24 条，接口最多返回 48 条。
- 默认按 `rank DESC, skinId DESC` 排序。
- 构建时静态生成默认条件下的前 24 条，确保首屏和基础 SEO 不依赖 JavaScript。
- 用户筛选、排序或翻页后，通过 Worker API 查询 D1。
- 筛选状态写入 URL，例如 `/?hero=morgana&version=26.13&page=2`。
- 所有筛选组合的 Canonical 均指向 `/`，避免大量重复页面被收录。
- 卡片默认使用 `site5` 中图，较小屏幕可使用 `site4` 小图。
- 点击卡片进入对应详情页。

### 4.2 详情页 `/chromas/{slug}`

- 每条有效臻彩在构建时生成独立静态 HTML。
- Slug 使用 `{英雄英文名}-{臻彩英文名}-{skinId}`，经过统一 URL 规范化。
- 英文名称缺失、Slug 冲突或关键字段不完整时阻止构建。
- 主视觉使用 `site3` 大图。
- 展示中英文名称、英雄、原皮、游戏版本、分类和新增状态。
- 展示同英雄或同分类相关推荐，但不生成独立聚合页面。
- 生成独立标题、描述、Canonical、Open Graph、面包屑和结构化数据。

### 4.3 其他路由

- 未知页面返回带首页入口的静态 404 页面。
- Sitemap 只包含 `/` 和全部 `/chromas/{slug}`。
- 不提供 `/chromas`、数据导出或原始 JSON 路由。

## 5. 数据模型

### 5.1 Git 源数据

`data/prestige-chromas.json` 是构建时唯一数据源。每条记录至少包含：

- 标识：`id`、`skinId`、`instanceId`
- 名称：臻彩中英文名、英雄中英文名、原皮中英文名
- 分类：`categoryId`、`categoryName`、`tagId`
- 版本与状态：`gameVer`、`isNew`、`rank`
- 图片相对路径：`images.large`、`images.medium`、`images.small`、`images.tag`

图片字段示例：

```json
{
  "instanceId": "example-instance-id",
  "tagId": "example-tag-id",
  "images": {
    "large": "assets/chromas/example-instance-id/site3.jpg",
    "small": "assets/chromas/example-instance-id/site4.jpg",
    "medium": "assets/chromas/example-instance-id/site5.jpg",
    "tag": "assets/tags/example-tag-id.png"
  }
}
```

路径必须满足以下约束：

- 统一使用 `/`，禁止 Windows 反斜杠。
- 必须是仓库相对路径，禁止盘符、绝对路径和 `..`。
- 臻彩图片必须位于 `assets/chromas/{instanceId}/`。
- Tag 图片必须位于 `assets/tags/`。
- JSON 引用的文件必须存在。
- 未被 JSON 引用的孤立图片必须在校验报告中列出。

### 5.2 D1 检索数据

D1 仅保存首页检索所需的公开字段：

- `release_id`
- `slug`
- `skin_id`、`instance_id`
- 臻彩中英文名
- 英雄 ID 及中英文名
- 原皮中英文名
- 分类 ID 与名称
- 游戏版本、是否新增、排序值
- 三种 R2 图片对象键和 Tag 图片对象键

D1 不保存原始 JSON、仓库路径、内部构建字段或未用于展示的管理字段。高频筛选和排序字段建立必要索引，避免全表扫描消耗免费行读取额度。

## 6. 本地数据导入

项目提供统一导入命令：

```bash
pnpm data:import --input ./exports/prestige-chromas.json
```

导入流程：

1. 校验输入 JSON 的结构和必填字段。
2. 检查重复 `instanceId`、无效 `skinId` 和 Slug 冲突。
3. 规范化数据字段并生成图片相对路径。
4. 根据 `instanceId` 计算并下载三种尺寸图片。
5. 根据 `tagId` 下载并去重 Tag 图标。
6. 校验 HTTP 状态、Content-Type、文件大小和真实图片格式。
7. 全部成功后，原子替换正式 JSON 和图片目录。

腾讯源地址规则：

```text
大图：https://game.gtimg.cn/images/lol/act/a20230715chromahub/skin/site3-{instanceId}.jpg
小图：https://game.gtimg.cn/images/lol/act/a20230715chromahub/skin/site4-{instanceId}.jpg
中图：https://game.gtimg.cn/images/lol/act/a20230715chromahub/skin/site5-{instanceId}.jpg
Tag：https://game.gtimg.cn/images/lol/act/a20230715chromahub/tag/x-{tagId}.png
```

输入数据包含有效 Tag 图片覆盖地址时优先使用覆盖地址，否则按 `tagId` 计算。命令支持：

- 默认跳过已经存在的有效图片。
- `--refresh` 强制重新下载指定或全部图片。
- `--dry-run` 只输出新增、变化和异常清单。
- 所有下载先进入被 `.gitignore` 排除的临时目录。
- 任一必需图片失败时返回失败，不修改正式数据和资产。

完成后，开发者检查变更并将 `data` 与 `assets` 作为同一次 Git 提交推送。

## 7. R2 图片策略

R2 对象路径由仓库相对路径去除 `assets/` 前缀得到：

```text
assets/chromas/{instanceId}/site3.jpg
→ chromas/{instanceId}/site3.jpg
→ https://img.chromaart.lol/chromas/{instanceId}/site3.jpg
```

同步规则：

1. CI 计算每个本地图片的 SHA-256。
2. R2 对象不存在或哈希变化时才上传。
3. 未变化图片跳过，避免重复写入。
4. Tag 图标按 `tagId` 去重。
5. R2 上传失败时阻止发布。
6. 图片对象使用长缓存；路径内容发生变化时以内容哈希或版本元数据保证缓存正确。
7. R2 只公开图片对象，不上传原始 JSON 或完整图片清单。

页面优先加载 R2。浏览器加载失败时，根据 `instanceId` 或 `tagId` 计算腾讯源地址并回退；腾讯源也失败时显示统一占位图并记录错误。

## 8. 搜索 API

首页筛选 API 只允许：

- 名称关键词
- 英雄
- 游戏版本
- 分类
- 新增状态
- 白名单排序
- 页码和分页大小

安全约束：

- 分页大小默认 24，最大 48。
- 不存在取消分页或全量导出的参数。
- SQL 全部参数化。
- 对关键词长度、页码、筛选值和排序字段进行严格校验。
- 非法请求返回明确的 HTTP 400。
- 响应不包含原始 JSON、仓库路径和内部构建字段。
- 不部署完整前端搜索索引。

## 9. SEO、性能与可访问性

- 首页和详情页均提供稳定 Canonical。
- 每个详情页提供独立标题、描述和 Open Graph 信息。
- 生成 `ImageObject`、`BreadcrumbList` 等适用结构化数据。
- 生成 Sitemap 和 robots.txt。
- 首屏之外图片使用懒加载。
- 图片设置固定宽高比，避免布局跳动。
- 图片提供准确的中文替代文本。
- 搜索、筛选和图片预览支持键盘操作。
- 遵循 `prefers-reduced-motion`。
- 不引入大型 UI 组件库，控制客户端 JavaScript 体积。
- 生产构建不输出 source map。

## 10. 一键部署

### 10.1 首次初始化

首次需要：

1. 将 `chromaart.lol` 接入 Cloudflare。
2. 创建 D1 数据库和 R2 Bucket。
3. 创建权限最小化的 Cloudflare API Token。
4. 将 Token、Account ID 等写入 GitHub Actions Secrets。
5. 配置 `img.chromaart.lol` 为 R2 图片域名。
6. 配置 `chromaart.lol` 为 Worker 自定义域名。

项目提供初始化脚本，尽量自动创建资源和生成配置。账号授权和 GitHub Secret 录入是首次必需操作；完成后日常更新仅需导入、提交和推送。

### 10.2 GitHub Actions 发布流程

推送 `main` 分支后自动执行：

1. 安装锁定版本的依赖。
2. 运行单元测试和数据完整性校验。
3. 计算唯一 `releaseId`。
4. 增量上传图片到 R2。
5. 将检索字段按 `releaseId` 导入 D1。
6. 使用相同 `releaseId` 构建首页和详情页。
7. 扫描部署目录，确认不存在原始 JSON、完整索引和 source map。
8. 部署 Worker 与静态资源。
9. 实际访问首页、筛选 API、随机详情页和 R2 图片。
10. 烟测成功后清理过旧 D1 数据版本。

### 10.3 版本一致性与回滚

- D1 每条检索记录都携带 `releaseId`。
- Worker 构建时固化同一 `releaseId`，只查询对应版本。
- 新数据导入不影响仍在线的旧 Worker。
- 至少保留当前和上一个 D1 数据版本。
- R2 图片采用不可变或版本化策略，新上传不破坏旧页面。
- 构建或发布失败时旧 Worker 继续服务。
- 发布后烟测失败时回滚 Worker，旧 D1 版本仍可用。
- 未完成的 D1 发布版本由 CI 清理。

## 11. 错误处理

- 首页首次打开使用静态首屏，不依赖筛选 API。
- 筛选和翻页只显示局部加载状态。
- API 失败时显示“加载失败，请重试”，不伪装为空列表。
- 查询成功但无结果时显示独立空状态和“清除筛选”操作。
- 详情数据不完整时构建失败，不发布残缺页面。
- JSON、图片、R2、D1、构建或测试任一步骤失败均阻止发布。
- 不新增静默兜底、模拟成功路径或宽泛异常吞噬。

## 12. 测试策略

### 12.1 数据导入测试

- 三种尺寸 URL 计算和 `site3/site4/site5` 映射。
- Tag URL 计算、覆盖地址和去重。
- 相对路径生成和目录穿越拦截。
- 临时目录与原子替换。
- 已存在跳过、强制刷新和 dry-run。
- 下载或图片校验失败时不修改正式资产。

### 12.2 数据与构建测试

- JSON Schema、必填字段和唯一性。
- JSON 引用图片完整性和孤立资产报告。
- Slug 生成与冲突检查。
- 首页静态首屏和详情页生成数量。
- SEO 元数据、Sitemap、robots.txt 和 404 页面。
- 部署目录敏感文件扫描。

### 12.3 Worker 与 D1 测试

- 所有筛选、排序和分页组合。
- 非法参数和分页上限。
- 参数化查询。
- `releaseId` 隔离、重复导入和旧版本清理。
- API 响应字段白名单。

### 12.4 R2 与浏览器测试

- 新增上传、未变化跳过、哈希变化更新和失败阻断。
- 首页筛选、URL 状态恢复、分页和详情跳转。
- 移动端与桌面端响应式布局。
- R2 到腾讯源再到占位图的回退链路。
- 键盘操作和基础可访问性。

### 12.5 生产烟测

- 实际访问 `https://chromaart.lol/`。
- 使用至少一组筛选条件调用生产 API。
- 随机访问至少一个新详情页和一个已有详情页。
- 验证三种尺寸图片与 Tag 图标均能从 R2 访问。
- 验证常见 `.json` 猜测路径和数据导出路径返回 404。

## 13. 验收标准

1. 网站只有首页、详情页和必要的 404 页面。
2. 首页可按约定字段筛选、排序和分页。
3. 每条有效臻彩都有唯一静态详情页。
4. 每个 `instanceId` 在仓库和 R2 中都有三种尺寸图片。
5. 每个有效 `tagId` 都有对应 Tag 图标。
6. JSON 中的图片相对路径与实际仓库文件完全一致。
7. 部署产物不存在原始 JSON、完整搜索索引或 source map。
8. 网站不存在可直接下载完整原始数据的 URL。
9. API 单次最多返回 48 条，且不提供全量模式。
10. Sitemap、Canonical、Open Graph 和结构化数据通过检查。
11. Git 推送后自动完成校验、同步、导入、构建、部署和烟测。
12. 任一关键步骤失败时旧站继续可用。

## 14. Cloudflare 免费额度适配

本项目将高频页面访问尽量落在静态资源层，只有筛选和分页请求进入 Worker 与 D1。臻彩数据规模远低于 D1 免费存储容量，图片规模预计可控制在 R2 免费存储范围内。实施阶段仍需加入用量监控；达到免费额度告警阈值时，应先优化缓存、索引和图片体积，再评估升级套餐。
