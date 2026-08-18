---
name: compress-image
description: 将图片压缩到 1MB 以内，输出为 JPEG 格式。支持 PNG/JPG/WebP 输入，使用 .NET System.Drawing 实现，无需额外依赖。当用户要求压缩图片、优化图片大小、或保存博客封面图时使用。
---

# 压缩图片到 1MB 以内

## 触发条件

- 用户要求压缩图片、减小图片体积
- 保存博客封面图到 `public/img/blog/` 时
- 任何需要控制图片大小的场景

## 压缩脚本

项目根目录下提供可复用脚本 `scripts/compress-image.ps1`：

```powershell
# 用法
powershell -ExecutionPolicy Bypass -File scripts/compress-image.ps1 -Source <输入路径> -Output <输出路径> [-MaxWidth 1920] [-Quality 82] [-MaxSizeMB 1]
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `-Source` | string | **必填** | 输入图片路径（PNG/JPG/WebP） |
| `-Output` | string | **必填** | 输出图片路径（建议 `.jpg`） |
| `-MaxWidth` | int | `1920` | 最大宽度，等比缩放 |
| `-Quality` | int | `82` | JPEG 质量（1-100） |
| `-MaxSizeMB` | float | `1` | 最大文件大小（MB） |

### 自动降级策略

脚本先按指定参数压缩一次，如果结果仍超过 `MaxSizeMB`，会自动降低 quality 重试，直到满足大小要求或 quality 降至 30。

## 手动压缩（不依赖脚本）

如果脚本不可用，使用 PowerShell + .NET System.Drawing：

```powershell
Add-Type -AssemblyName System.Drawing

$src = '<输入路径>'
$dst = '<输出路径>.jpg'
$img = [System.Drawing.Image]::FromFile($src)

$maxWidth = 1920
$ratio = $maxWidth / $img.Width
$newHeight = [int]($img.Height * $ratio)

$resized = New-Object System.Drawing.Bitmap($maxWidth, $newHeight)
$graphics = [System.Drawing.Graphics]::FromImage($resized)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($img, 0, 0, $maxWidth, $newHeight)

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

$resized.Save($dst, $encoder, $encoderParams)
$size = (Get-Item $dst).Length / 1MB
Write-Host "Output: $([math]::Round($size, 2)) MB"

$graphics.Dispose()
$resized.Dispose()
$img.Dispose()
```

## 博客封面图规范

保存到 `public/img/blog/` 的图片必须满足：

- 格式：JPEG（`.jpg`）
- 大小：**≤ 1MB**
- 宽度：≤ 1920px
- 命名：`{slug}-cover.jpg` 或 `{slug}-{description}.jpg`

## 注意事项

- 压缩后删除原始大图，只保留压缩版本
- 不要提交临时压缩脚本（`_compress.*`）到版本控制
- 如果图片已经 ≤ 1MB，可以跳过压缩直接复制
