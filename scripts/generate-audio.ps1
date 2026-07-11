param([string]$OutputDirectory = 'public/assets/audio')

$sampleRate = 22050
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function Write-Wave([string]$Name, [double]$Duration, [scriptblock]$Sample) {
  $count = [int]($sampleRate * $Duration)
  $path = Join-Path $OutputDirectory ($Name + '.wav')
  $stream = [IO.File]::Create($path)
  $writer = [IO.BinaryWriter]::new($stream)
  try {
    $dataSize = $count * 2
    $writer.Write([Text.Encoding]::ASCII.GetBytes('RIFF'))
    $writer.Write(36 + $dataSize)
    $writer.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
    $writer.Write(16); $writer.Write([int16]1); $writer.Write([int16]1)
    $writer.Write($sampleRate); $writer.Write($sampleRate * 2)
    $writer.Write([int16]2); $writer.Write([int16]16)
    $writer.Write([Text.Encoding]::ASCII.GetBytes('data')); $writer.Write($dataSize)
    for ($i = 0; $i -lt $count; $i++) {
      $value = & $Sample ($i / $sampleRate) $Duration
      $writer.Write([int16]([Math]::Max(-1, [Math]::Min(1, $value)) * 24575))
    }
  } finally { $writer.Dispose(); $stream.Dispose() }
}

$tracks = @{
  music_green = @{ bpm = 84; notes = @(261.63,329.63,392.00,523.25,392.00,329.63,293.66,349.23) }
  music_sweet = @{ bpm = 92; notes = @(523.25,659.25,783.99,659.25,587.33,698.46,880.00,698.46) }
  music_sea = @{ bpm = 80; notes = @(220.00,277.18,329.63,415.30,329.63,277.18,246.94,311.13) }
  music_moon = @{ bpm = 76; notes = @(196.00,246.94,293.66,369.99,440.00,369.99,293.66,246.94) }
}

foreach ($entry in $tracks.GetEnumerator()) {
  $beat = 60.0 / $entry.Value.bpm
  $notes = $entry.Value.notes
  $duration = $beat * 64
  Write-Wave $entry.Key $duration {
    param($t, $length)
    $index = [int]([Math]::Floor($t / $beat)) % $notes.Count
    $local = $t % $beat
    $envelope = [Math]::Min(1, $local / 0.025) * [Math]::Exp(-2.8 * $local / $beat)
    $frequency = $notes[$index]
    $pad = 0.07 * [Math]::Sin(2 * [Math]::PI * ($frequency / 4) * $t)
    $tone = 0.22 * [Math]::Sin(2 * [Math]::PI * $frequency * $t) + 0.06 * [Math]::Sin(4 * [Math]::PI * $frequency * $t)
    ($pad + $tone * $envelope) * [Math]::Min(1, [Math]::Min($t, $length - $t) / 0.02)
  }
}

$effects = @{
  sfx_button = @(440, 0.10); sfx_create = @(587.33, 0.24); sfx_select = @(659.25, 0.12)
  sfx_merge = @(783.99, 0.42); sfx_coin = @(1046.50, 0.28); sfx_invalid = @(196, 0.22)
  sfx_level = @(880, 0.65); sfx_reward = @(987.77, 0.48)
}
foreach ($entry in $effects.GetEnumerator()) {
  $frequency = $entry.Value[0]; $duration = $entry.Value[1]
  Write-Wave $entry.Key $duration {
    param($t, $length)
    $sweep = $frequency * (1 + 0.22 * $t / $length)
    0.38 * [Math]::Sin(2 * [Math]::PI * $sweep * $t) * [Math]::Sin([Math]::PI * $t / $length)
  }
}
