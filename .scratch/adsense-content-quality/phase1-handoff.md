# AdSense 低价值内容修复 — 阶段一交接

**分支**: `feat/adsense-trust-repair`
**日期**: 2026-09-15
**状态**: 阶段一完成，未提交复审

## 已完成事项

### 1. About 页重写
- 新增"建站缘起""收录范围""编辑原则""资料来源与核验方式""纠错与更新"完整段落
- 合并原 editorial-policy 页面全部内容到 about 页，删除 `/editorial-policy/` 路由
- JSON-LD author 改为 Organization 类型 "LoL Chroma Art Editorial Team"
- @BreadJ 标为官方 X 账号，链接指向 `https://x.com/LiaoHeng3364`
- 中英双语同步

### 2. 博客文章署名统一
- 23 篇博客文章 JSON-LD author 统一为 `Organization` name `LoL Chroma Art Editorial Team`
- 17 篇新闻文章可见署名行改为 "LoL Chroma Art Editorial Team" / "LoL Chroma Art 编辑团队"
- 6 篇常青指南通过 ArticleMaintenance 组件显示署名，链接改为 `/about/`
- 去掉个人名 BreadJ，统一为团队名

### 3. 首页编辑导览
- 在 hero 和 latest-section 之间新增 intro-section
- 标题"关于"/"About"，样式与 latest-section 一致
- 一句话说明图鉴收录范围 + 筛选器使用方式 + about 页链接
- 不重复 about 页详细内容

### 4. editorial-policy 页面合并
- 删除 `src/pages/editorial-policy.astro` 和 `src/pages/zh-cn/editorial-policy.astro`
- 更新所有引用：BaseLayout footer、ArticleMaintenance、BlogAdjacentNavigation、sitemap、首页 intro-section
- 测试断言全部更新

### 5. 测试验证
- `pnpm typecheck`: 0 errors, 0 warnings, 6 hints（均为既有未使用变量）
- `pnpm test`: 179/179 通过

## 未完成事项

### 阶段二：内容精简
- [ ] 对 13 篇模板化活动文章（非 patch、非 evergreen）添加 `noindex, follow`
- [ ] 在 `articles.ts` 中为这些文章设置 `adEligible: false`
- [ ] 提交 sitemap 更新，确保被 noindex 的文章不在 sitemap 中

### 提交复审前置条件
- [ ] 确认 Google Search Console 中支柱页已显示"已收录"
- [ ] 距首批内容上线约 90 天
- [ ] 阶段二 noindex 生效且已被 Google 爬虫处理

## 变更文件清单

**修改** (28 文件):
- `scripts/site-build.test.ts` — 测试断言更新
- `src/components/ArticleMaintenance.astro` — 署名和链接改为 /about/
- `src/components/BlogAdjacentNavigation.astro` — 链接改为 /about/
- `src/layouts/BaseLayout.astro` — footer 移除 editorial-policy 链接
- `src/pages/about.astro` — 重写，合并 editorial-policy 内容
- `src/pages/index.astro` — 新增 intro-section
- `src/pages/blog/*.astro` (23 篇) — JSON-LD author + 可见署名
- `src/seo/sitemap.ts` — 移除 /editorial-policy/ 路径
- `src/seo/sitemap.test.ts` — 断言更新

**删除** (2 文件):
- `src/pages/editorial-policy.astro`
- `src/pages/zh-cn/editorial-policy.astro`
