param(
  [Parameter(Mandatory = $true)]
  [string]$EpisodeDir,

  [string]$FfmpegPath = '',

  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

function Add-Issue {
  param(
    [System.Collections.Generic.List[string]]$List,
    [string]$Message
  )
  $List.Add($Message) | Out-Null
}

function Resolve-Ffmpeg {
  param([string]$Candidate)
  if ($Candidate -and (Test-Path -LiteralPath $Candidate)) {
    return (Resolve-Path -LiteralPath $Candidate).Path
  }

  $known = @(
    'C:\Users\25506\AppData\Local\Temp\codex-audio-tools\node_modules\ffmpeg-static\ffmpeg.exe',
    'ffmpeg'
  )
  foreach ($path in $known) {
    try {
      if ($path -eq 'ffmpeg') {
        & ffmpeg -version *> $null
        if ($LASTEXITCODE -eq 0) { return 'ffmpeg' }
      } elseif (Test-Path -LiteralPath $path) {
        return $path
      }
    } catch {
      continue
    }
  }
  throw 'ffmpeg was not found. Pass -FfmpegPath explicitly.'
}

function Invoke-FFmpeg {
  param(
    [string]$Ffmpeg,
    [Parameter(ValueFromRemainingArguments = $true)]
    [object[]]$FfmpegArgs
  )
  $flatArgs = @()
  foreach ($arg in $FfmpegArgs) {
    if ($arg -is [System.Array]) {
      foreach ($inner in $arg) { $flatArgs += [string]$inner }
    } else {
      $flatArgs += [string]$arg
    }
  }
  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $Ffmpeg @flatArgs
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $oldPreference
  }
  if ($exitCode -ne 0) {
    throw "ffmpeg failed with exit code $exitCode`: $($flatArgs -join ' ')"
  }
}

function Get-MediaInfoText {
  param([string]$Ffmpeg, [string]$Path)
  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $info = & $Ffmpeg -hide_banner -i $Path 2>&1
  } finally {
    $ErrorActionPreference = $oldPreference
  }
  return ($info -join "`n")
}

function Get-DurationSeconds {
  param([string]$InfoText)
  if ($InfoText -match 'Duration:\s*(\d+):(\d+):(\d+\.?\d*)') {
    return [Math]::Round(([double]$Matches[1] * 3600 + [double]$Matches[2] * 60 + [double]$Matches[3]), 3)
  }
  return $null
}

function Get-ProgressWidth {
  param([string]$ImagePath)
  Add-Type -AssemblyName System.Drawing
  $bmp = [System.Drawing.Bitmap]::FromFile($ImagePath)
  try {
    $y = [Math]::Min($bmp.Height - 1, 1915)
    $last = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $p = $bmp.GetPixel($x, $y)
      $bright = [int]$p.R + [int]$p.G + [int]$p.B
      if ($bright -gt 120 -and ($p.R -gt 60 -or $p.G -gt 60 -or $p.B -gt 60)) {
        $last = $x
      }
    }
    return ($last + 1)
  } finally {
    $bmp.Dispose()
  }
}

$episode = (Resolve-Path -LiteralPath $EpisodeDir).Path
$delivery = Join-Path $episode '交付文件'
$assets = Join-Path $episode 'assets'
$qcDir = Join-Path $assets 'qc_delivery_check'
New-Item -ItemType Directory -Path $qcDir -Force | Out-Null

$errors = New-Object 'System.Collections.Generic.List[string]'
$warnings = New-Object 'System.Collections.Generic.List[string]'
$ffmpeg = Resolve-Ffmpeg $FfmpegPath

$required = @(
  'douyin_publish.mp4',
  'xiaohongshu_publish.mp4',
  'cover.jpg',
  'douyin_cover_horizontal_4x3.jpg',
  'video_script.md',
  'voiceover_script.txt',
  'subtitles.srt',
  'publish_copy.md',
  'complete_prompt_template.md',
  'delivery_readme.md'
)

if (-not (Test-Path -LiteralPath $delivery)) {
  Add-Issue $errors "Missing delivery folder: $delivery"
}

foreach ($name in $required) {
  $path = Join-Path $delivery $name
  if (-not (Test-Path -LiteralPath $path)) {
    Add-Issue $errors "Missing required delivery file: $name"
  }
}

$douyin = Join-Path $delivery 'douyin_publish.mp4'
$xiaohongshu = Join-Path $delivery 'xiaohongshu_publish.mp4'
$hashDouyin = $null
$hashXhs = $null
$duration = $null
$progressWidths = @()

if ((Test-Path -LiteralPath $douyin) -and (Test-Path -LiteralPath $xiaohongshu)) {
  $hashDouyin = (Get-FileHash -Algorithm SHA256 -LiteralPath $douyin).Hash
  $hashXhs = (Get-FileHash -Algorithm SHA256 -LiteralPath $xiaohongshu).Hash
  if ($hashDouyin -ne $hashXhs) {
    Add-Issue $errors 'douyin_publish.mp4 and xiaohongshu_publish.mp4 SHA256 do not match.'
  }
}

if (Test-Path -LiteralPath $douyin) {
  $infoText = Get-MediaInfoText $ffmpeg $douyin
  $duration = Get-DurationSeconds $infoText
  if ($infoText -notmatch 'Video:.*1080x1920') {
    Add-Issue $errors 'Final video is not reported as 1080x1920.'
  }
  if ($infoText -notmatch 'Audio:') {
    Add-Issue $errors 'Final video has no audio stream.'
  }
  if (-not $duration) {
    Add-Issue $warnings 'Could not parse final video duration.'
  } else {
    $times = @(1.0, [Math]::Max(1.0, $duration / 2), [Math]::Max(1.0, $duration - 2.0))
    for ($i = 0; $i -lt $times.Count; $i++) {
      $frame = Join-Path $qcDir ('progress_{0}.jpg' -f $i)
      Invoke-FFmpeg $ffmpeg @('-hide_banner','-loglevel','error','-y','-ss',('{0:F3}' -f $times[$i]),'-i',$douyin,'-frames:v','1',$frame)
      $progressWidths += (Get-ProgressWidth $frame)
    }
    if ($progressWidths.Count -eq 3) {
      if (-not ($progressWidths[0] -lt $progressWidths[1] -and $progressWidths[1] -lt $progressWidths[2])) {
        Add-Issue $errors "Bottom progress bar does not advance monotonically: $($progressWidths -join ', ')"
      }
    }
  }
}

$srtPath = Join-Path $delivery 'subtitles.srt'
if (Test-Path -LiteralPath $srtPath) {
  $lines = Get-Content -LiteralPath $srtPath -Encoding UTF8
  $subtitleLines = $lines | Where-Object {
    $_.Trim().Length -gt 0 -and
    $_ -notmatch '^\d+$' -and
    $_ -notmatch '-->'
  }
  $punctuation = @($subtitleLines | Where-Object { $_ -match '[。！？.!?]\s*$' })
  $singleCjk = @($subtitleLines | Where-Object { $_ -match '^[一-龥]$' })
  $splitEnglish = @($subtitleLines | Where-Object { $_ -match '^[A-Za-z]$' })
  if ($punctuation.Count -gt 0) {
    Add-Issue $errors "Subtitle lines end with sentence punctuation: $($punctuation.Count)"
  }
  if ($singleCjk.Count -gt 0) {
    Add-Issue $errors "Subtitle contains single-character CJK fragments: $($singleCjk.Count)"
  }
  if ($splitEnglish.Count -gt 0) {
    Add-Issue $errors "Subtitle contains split English single-token fragments: $($splitEnglish.Count)"
  }
}

$readmePath = Join-Path $delivery 'delivery_readme.md'
if (Test-Path -LiteralPath $readmePath) {
  $readme = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
  foreach ($needle in @('扫光', '进度条', 'SHA256', 'Token', '耗时')) {
    if ($readme -notmatch [regex]::Escape($needle)) {
      Add-Issue $warnings "delivery_readme.md does not mention required item: $needle"
    }
  }
}

$result = [pscustomobject]@{
  episodeDir = $episode
  deliveryDir = $delivery
  checkedAt = (Get-Date).ToString('o')
  ffmpeg = $ffmpeg
  durationSeconds = $duration
  sha256 = @{
    douyin = $hashDouyin
    xiaohongshu = $hashXhs
  }
  progressWidths = $progressWidths
  errors = @($errors.ToArray())
  warnings = @($warnings.ToArray())
}

$jsonPath = Join-Path $qcDir 'delivery_check.json'
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
$result | ConvertTo-Json -Depth 8

if ($Strict -and $errors.Count -gt 0) {
  exit 1
}

