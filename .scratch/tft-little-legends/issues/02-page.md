Status: completed
Part of: ../spec.md

# 双语页面、导航与 SEO

新增英文和中文小小英雄资料集静态壳，接入共享导航、领域图标、sitemap、canonical/hreflang、面包屑结构化数据及隐私说明。页面展示 `kLittleLegend`、`kChibi` 和 `kStyle2` 三类，并在卡片上标明类别。面包屑显示“首页 → 云顶之弈 → 小小英雄”，“云顶之弈”链接到 TFT 官方首页，并在页眉、标题与面包屑统一使用 TFT 官方 Game Icon。

## 验收

两种语言均输出列表标题、描述、小小英雄图标与 h1、共享页面骨架与禁用脚本提示；SEO 测试和离线静态构建能识别 `/tft/companions/` 新路由与三级面包屑。

## 结果与验证

已接入双语路由、导航、TFT 面包屑图标、三级面包屑、canonical/hreflang、面包屑结构化数据、sitemap 与隐私说明。当前路由为 `/tft/companions/` 和 `/zh-cn/tft/companions/`，小小英雄标题图标使用 CommunityDragon 的 `little_legends_icon.svg`。小于等于 420px 时压缩全站页眉文字入口，确保 320px 布局不横向溢出。`pnpm exec vitest run src/seo/tft-little-legends-seo.test.ts src/seo/sitemap.test.ts` 通过；定向静态构建断言通过。
