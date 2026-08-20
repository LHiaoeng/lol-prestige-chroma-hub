<#
.SYNOPSIS
    Compress an image to JPEG under a target file size.

.DESCRIPTION
    Resizes and compresses an image to JPEG format using .NET System.Drawing.
    Automatically degrades quality if the first pass exceeds the target size.

.PARAMETER Source
    Path to the input image (PNG, JPG, WebP, BMP, TIFF).

.PARAMETER Output
    Path to the output JPEG file.

.PARAMETER MaxWidth
    Maximum width in pixels. Height is scaled proportionally. Default: 1920.

.PARAMETER Quality
    Initial JPEG quality (1-100). Default: 82.

.PARAMETER MaxSizeMB
    Maximum output file size in MB. Default: 1.

.PARAMETER MinQuality
    Minimum quality to try during auto-degradation. Default: 30.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .agents/skills/compress-image/scripts/compress-image.ps1 -Source input.png -Output output.jpg
    powershell -ExecutionPolicy Bypass -File .agents/skills/compress-image/scripts/compress-image.ps1 -Source input.png -Output output.jpg -MaxWidth 1280 -Quality 75 -MaxSizeMB 0.5
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [int]$MaxWidth = 1920,

    [int]$Quality = 82,

    [float]$MaxSizeMB = 1,

    [int]$MinQuality = 30
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
    Write-Error "Source file not found: $Source"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($Source)
$srcWidth = $img.Width
$srcHeight = $img.Height

# Calculate target dimensions (only downscale)
if ($srcWidth -gt $MaxWidth) {
    $ratio = $MaxWidth / $srcWidth
    $targetWidth = $MaxWidth
    $targetHeight = [int]($srcHeight * $ratio)
} else {
    $targetWidth = $srcWidth
    $targetHeight = $srcHeight
}

$resized = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
$graphics = [System.Drawing.Graphics]::FromImage($resized)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($img, 0, 0, $targetWidth, $targetHeight)

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-WithQuality {
    param([int]$q)
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$q)
    $resized.Save($Output, $encoder, $encoderParams)
    return (Get-Item $Output).Length / 1MB
}

# First pass
$size = Save-WithQuality -q $Quality
Write-Host "Quality $Quality`: $([math]::Round($size, 2)) MB"

# Auto-degrade if needed
$currentQuality = $Quality
while ($size -gt $MaxSizeMB -and $currentQuality -gt $MinQuality) {
    $currentQuality = [math]::Max($currentQuality - 10, $MinQuality)
    $size = Save-WithQuality -q $currentQuality
    Write-Host "Quality $currentQuality`: $([math]::Round($size, 2)) MB"
}

if ($size -gt $MaxSizeMB) {
    Write-Warning "Could not reach target size ${MaxSizeMB}MB. Final: $([math]::Round($size, 2)) MB at quality $currentQuality"
} else {
    Write-Host "Done: $([math]::Round($size, 2)) MB (${targetWidth}x${targetHeight})"
}

$graphics.Dispose()
$resized.Dispose()
$img.Dispose()
