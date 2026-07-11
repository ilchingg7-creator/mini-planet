param(
  [string]$InputPath = "art/source/green_biome_sheet_v2.png",
  [string]$OutputDirectory = "public/assets/approved/green-v2"
)

Add-Type -AssemblyName System.Drawing

$names = @(
  "sprout",
  "flower",
  "mushroom",
  "tree",
  "house",
  "pond",
  "mill",
  "rainbow",
  "garden_bench",
  "bird_house",
  "sun_tower",
  "rainbow_palace"
)

$resolvedInputPath = (Resolve-Path -LiteralPath $InputPath).Path
$source = [System.Drawing.Bitmap]::new($resolvedInputPath)
$cellWidth = [int]($source.Width / 4)
$cellHeight = [int]($source.Height / 3)
$cellInset = 18
$canvasSize = 512
$contentSize = 440

New-Item -ItemType Directory -Force $OutputDirectory | Out-Null

try {
  for ($index = 0; $index -lt $names.Count; $index++) {
    $column = $index % 4
    $row = [int][Math]::Floor($index / 4)
    $cell = [System.Drawing.Bitmap]::new($cellWidth, $cellHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($cell)

    try {
      $sourceRectangle = [System.Drawing.Rectangle]::new(
        $column * $cellWidth + $cellInset,
        $row * $cellHeight + $cellInset,
        $cellWidth - $cellInset * 2,
        $cellHeight - $cellInset * 2
      )
      $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $cellWidth, $cellHeight), $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
      $graphics.Dispose()
    }

    $minX = $cellWidth
    $minY = $cellHeight
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $cellHeight; $y++) {
      for ($x = 0; $x -lt $cellWidth; $x++) {
        $pixel = $cell.GetPixel($x, $y)
        $distance = [Math]::Sqrt(
          [Math]::Pow(255 - $pixel.R, 2) +
          [Math]::Pow($pixel.G, 2) +
          [Math]::Pow(255 - $pixel.B, 2)
        )

        if ($distance -le 18) {
          $cell.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
          continue
        }

        if ($distance -lt 110) {
          $alpha = [int](255 * (($distance - 18) / 92))
          $red = [Math]::Min($pixel.R, $pixel.G + 36)
          $blue = [Math]::Min($pixel.B, $pixel.G + 36)
          $cell.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $red, $pixel.G, $blue))
        }

        if ($cell.GetPixel($x, $y).A -gt 16) {
          $minX = [Math]::Min($minX, $x)
          $minY = [Math]::Min($minY, $y)
          $maxX = [Math]::Max($maxX, $x)
          $maxY = [Math]::Max($maxY, $y)
        }
      }
    }

    if ($maxX -lt $minX -or $maxY -lt $minY) {
      throw "No visible pixels found for $($names[$index])"
    }

    $visibleWidth = $maxX - $minX + 1
    $visibleHeight = $maxY - $minY + 1
    $scale = [Math]::Min($contentSize / $visibleWidth, $contentSize / $visibleHeight)
    $drawWidth = [int]($visibleWidth * $scale)
    $drawHeight = [int]($visibleHeight * $scale)
    $targetX = [int](($canvasSize - $drawWidth) / 2)
    $targetY = [int](($canvasSize - $drawHeight) / 2)
    $output = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $outputGraphics = [System.Drawing.Graphics]::FromImage($output)

    try {
      $outputGraphics.Clear([System.Drawing.Color]::Transparent)
      $outputGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $outputGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $outputGraphics.DrawImage(
        $cell,
        [System.Drawing.Rectangle]::new($targetX, $targetY, $drawWidth, $drawHeight),
        [System.Drawing.Rectangle]::new($minX, $minY, $visibleWidth, $visibleHeight),
        [System.Drawing.GraphicsUnit]::Pixel
      )

      $outputPath = Join-Path $OutputDirectory ("green_{0}.png" -f $names[$index])
      $output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $outputGraphics.Dispose()
      $output.Dispose()
      $cell.Dispose()
    }
  }
} finally {
  if ($null -ne $source) {
    $source.Dispose()
  }
}
