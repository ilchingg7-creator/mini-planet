param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory,
  [Parameter(Mandatory = $true)][string]$Biome,
  [Parameter(Mandatory = $true)][string[]]$Names,
  [int]$Columns = 4,
  [int[]]$CellIndices = @()
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $InputPath).Path)
$cellCount = $Names.Count
if ($CellIndices.Count -gt 0) {
  $cellCount = ($CellIndices | Measure-Object -Maximum).Maximum + 1
}
$rows = [Math]::Ceiling($cellCount / $Columns)
$cellWidth = [int]($source.Width / $Columns)
$cellHeight = [int]($source.Height / $rows)
$canvasSize = 512
$contentSize = 440
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null

try {
  for ($outputIndex = 0; $outputIndex -lt $Names.Count; $outputIndex++) {
    $index = if ($CellIndices.Count -gt 0) { $CellIndices[$outputIndex] } else { $outputIndex }
    $column = $index % $Columns
    $row = [int][Math]::Floor($index / $Columns)
    $cell = [System.Drawing.Bitmap]::new($cellWidth, $cellHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($cell)
    $graphics.DrawImage($source, 0, 0, [System.Drawing.Rectangle]::new($column * $cellWidth, $row * $cellHeight, $cellWidth, $cellHeight), [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()

    $minX = $cellWidth; $minY = $cellHeight; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $cellHeight; $y++) {
      for ($x = 0; $x -lt $cellWidth; $x++) {
        $pixel = $cell.GetPixel($x, $y)
        $distance = [Math]::Sqrt([Math]::Pow(255 - $pixel.R, 2) + [Math]::Pow($pixel.G, 2) + [Math]::Pow(255 - $pixel.B, 2))
        if ($distance -le 35) { $cell.SetPixel($x, $y, [System.Drawing.Color]::Transparent); continue }
        if ($distance -lt 125) {
          $alpha = [int](255 * (($distance - 35) / 90))
          $cell.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, [Math]::Min($pixel.R, $pixel.G + 36), $pixel.G, [Math]::Min($pixel.B, $pixel.G + 36)))
        }
        if ($cell.GetPixel($x, $y).A -gt 16) { $minX = [Math]::Min($minX, $x); $minY = [Math]::Min($minY, $y); $maxX = [Math]::Max($maxX, $x); $maxY = [Math]::Max($maxY, $y) }
      }
    }

    if ($maxX -lt $minX) { throw "No visible pixels for $($Names[$outputIndex])" }
    $visibleWidth = $maxX - $minX + 1; $visibleHeight = $maxY - $minY + 1
    $scale = [Math]::Min($contentSize / $visibleWidth, $contentSize / $visibleHeight)
    $drawWidth = [int]($visibleWidth * $scale); $drawHeight = [int]($visibleHeight * $scale)
    $output = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $outputGraphics = [System.Drawing.Graphics]::FromImage($output)
    $outputGraphics.Clear([System.Drawing.Color]::Transparent)
    $outputGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $outputGraphics.DrawImage($cell, [System.Drawing.Rectangle]::new([int](($canvasSize-$drawWidth)/2), [int](($canvasSize-$drawHeight)/2), $drawWidth, $drawHeight), [System.Drawing.Rectangle]::new($minX, $minY, $visibleWidth, $visibleHeight), [System.Drawing.GraphicsUnit]::Pixel)
    $output.Save((Join-Path $OutputDirectory ("{0}_{1}.png" -f $Biome, $Names[$outputIndex])), [System.Drawing.Imaging.ImageFormat]::Png)
    $outputGraphics.Dispose(); $output.Dispose(); $cell.Dispose()
  }
} finally { $source.Dispose() }
