param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [int]$CanvasSize = 1024,
  [int]$ContentSize = 940
)

Add-Type -AssemblyName System.Drawing

$resolvedInputPath = (Resolve-Path -LiteralPath $InputPath).Path
$loaded = [System.Drawing.Bitmap]::new($resolvedInputPath)
$source = [System.Drawing.Bitmap]::new(
  $loaded.Width,
  $loaded.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$sourceGraphics = [System.Drawing.Graphics]::FromImage($source)
$sourceGraphics.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
$sourceGraphics.Dispose()
$loaded.Dispose()
$minX = $source.Width
$minY = $source.Height
$maxX = -1
$maxY = -1

try {
  for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
      $pixel = $source.GetPixel($x, $y)
      $distance = [Math]::Sqrt(
        [Math]::Pow(255 - $pixel.R, 2) +
        [Math]::Pow($pixel.G, 2) +
        [Math]::Pow(255 - $pixel.B, 2)
      )

      if ($distance -le 40) {
        $source.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        continue
      }

      if ($distance -lt 130) {
        $alpha = [int](255 * (($distance - 40) / 90))
        $red = [Math]::Min($pixel.R, $pixel.G + 36)
        $blue = [Math]::Min($pixel.B, $pixel.G + 36)
        $source.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $red, $pixel.G, $blue))
      }

      if ($source.GetPixel($x, $y).A -gt 16) {
        $minX = [Math]::Min($minX, $x)
        $minY = [Math]::Min($minY, $y)
        $maxX = [Math]::Max($maxX, $x)
        $maxY = [Math]::Max($maxY, $y)
      }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    throw 'No visible pixels found after chroma-key removal.'
  }

  $visibleWidth = $maxX - $minX + 1
  $visibleHeight = $maxY - $minY + 1
  $scale = [Math]::Min($ContentSize / $visibleWidth, $ContentSize / $visibleHeight)
  $drawWidth = [int]($visibleWidth * $scale)
  $drawHeight = [int]($visibleHeight * $scale)
  $targetX = [int](($CanvasSize - $drawWidth) / 2)
  $targetY = [int](($CanvasSize - $drawHeight) / 2)
  $output = [System.Drawing.Bitmap]::new($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($output)

  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage(
      $source,
      [System.Drawing.Rectangle]::new($targetX, $targetY, $drawWidth, $drawHeight),
      [System.Drawing.Rectangle]::new($minX, $minY, $visibleWidth, $visibleHeight),
      [System.Drawing.GraphicsUnit]::Pixel
    )

    $outputDirectory = Split-Path -Parent $OutputPath
    New-Item -ItemType Directory -Force $outputDirectory | Out-Null
    $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $output.Dispose()
  }
} finally {
  $source.Dispose()
}
