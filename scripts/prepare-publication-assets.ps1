param(
  [Parameter(Mandatory = $true)][string]$IconInput,
  [Parameter(Mandatory = $true)][string]$CoverInput,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null

function Save-FittedImage([string]$inputPath, [string]$outputPath, [int]$width, [int]$height) {
  $source = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $inputPath).Path)
  $canvas = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $sourceRatio = $source.Width / $source.Height
  $targetRatio = $width / $height
  if ($sourceRatio -gt $targetRatio) {
    $cropHeight = $source.Height
    $cropWidth = [int]($source.Height * $targetRatio)
    $cropX = [int](($source.Width - $cropWidth) / 2)
    $cropY = 0
  } else {
    $cropWidth = $source.Width
    $cropHeight = [int]($source.Width / $targetRatio)
    $cropX = 0
    $cropY = [int](($source.Height - $cropHeight) / 2)
  }
  $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $width, $height), [System.Drawing.Rectangle]::new($cropX, $cropY, $cropWidth, $cropHeight), [System.Drawing.GraphicsUnit]::Pixel)
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $canvas.Dispose(); $source.Dispose()
}

Save-FittedImage $IconInput (Join-Path $OutputDirectory 'icon.png') 512 512
Save-FittedImage $CoverInput (Join-Path $OutputDirectory 'cover.png') 800 470
