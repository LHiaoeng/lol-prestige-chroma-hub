---
name: compress-image
description: 压缩图片为限宽、限体积的 JPEG，或保存站内博客封面。
---

使用仓库内的[压缩脚本](scripts/compress-image.ps1)，参数和默认值见脚本帮助。脚本按比例缩放并逐步降低 JPEG 质量。输入格式取决于本机解码器，遇到解码失败须明确报告。

```powershell
powershell -File .agents/skills/compress-image/scripts/compress-image.ps1 -Source input.png -Output output.jpg
```

博客封面保存到 `public/img/blog/`，命名为 `{slug}-cover.jpg` 或 `{slug}-{description}.jpg`。验收输出为可解码的 JPEG、宽度 ≤ 1920px、体积 ≤ 1MB；已有文件三项均满足时可直接复制。只将最终图片纳入版本控制，保留用户原件，清理本次产生的临时副本。
