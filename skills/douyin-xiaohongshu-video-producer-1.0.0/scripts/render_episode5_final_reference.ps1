$ErrorActionPreference = 'Stop'

# Canonical reference render script from the approved AI工具第5期 delivery.
# For a new episode, copy this file into the episode assets folder and replace
# only the episode paths, source video, BGM, card images, TTS script, and segment
# manifest. Preserve the Episode 5 hook sweep, proof-stage geometry, subtitles,
# progress bar, BGM ducking, stats, and delivery-copy behavior unless the user
# explicitly requests a style change.

Add-Type -AssemblyName System.Drawing

$episode = 'D:\6.AI\自媒体\AI工具第5期'
$srcVideo = Join-Path $episode '6月28日.mp4'
$bgmFile = 'D:\6.AI\自媒体\背景音乐_世界杯.MOV'
$ffmpeg = 'C:\Users\25506\AppData\Local\Temp\codex-audio-tools\node_modules\ffmpeg-static\ffmpeg.exe'
$node = 'D:\SoftWareInstall\node\node.exe'
$ttsScript = 'C:\Users\25506\AppData\Local\Temp\codex-audio-tools\generate_ep5_yunxi.mjs'
$render = Join-Path $episode 'assets\render_ep5_ep4style'
$clipsDir = Join-Path $render 'clips'
$audioDir = Join-Path $episode 'assets\audio'
$yunxiDir = Join-Path $audioDir 'yunxi'
$delivery = Join-Path $episode '交付文件'
$qcDir = Join-Path $episode 'assets\qc_ep4style'
$statsPath = Join-Path $render 'generation_stats_ep4style.json'

New-Item -ItemType Directory -Path $render,$clipsDir,$audioDir,$yunxiDir,$delivery,$qcDir -Force | Out-Null
$revStart = Get-Date
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Invoke-FFmpeg {
  param([Parameter(ValueFromRemainingArguments = $true)][object[]]$FfmpegArgs)
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
    & $ffmpeg @flatArgs
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $oldPreference
  }
  if ($exitCode -ne 0) {
    throw "ffmpeg failed with exit code $exitCode`: $($flatArgs -join ' ')"
  }
}

function Get-MediaDuration {
  param([string]$Path)
  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $info = & $ffmpeg -hide_banner -i $Path 2>&1
  } finally {
    $ErrorActionPreference = $oldPreference
  }
  $line = ($info | Select-String -Pattern 'Duration:' | Select-Object -First 1).Line
  if ($line -match 'Duration:\s*(\d+):(\d+):(\d+\.?\d*)') {
    return ([double]$Matches[1] * 3600 + [double]$Matches[2] * 60 + [double]$Matches[3])
  }
  throw "Cannot read duration: $Path"
}

function New-RoundedRectPath {
  param([System.Drawing.RectangleF]$Rect, [float]$Radius)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $Radius * 2
  $path.AddArc($Rect.X, $Rect.Y, $d, $d, 180, 90)
  $path.AddArc($Rect.Right - $d, $Rect.Y, $d, $d, 270, 90)
  $path.AddArc($Rect.Right - $d, $Rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-Text {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.Color]$Color,
    [string]$Align = 'Left'
  )
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = if ($Align -eq 'Center') { [System.Drawing.StringAlignment]::Center } else { [System.Drawing.StringAlignment]::Near }
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $sf.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $brush = New-Object System.Drawing.SolidBrush($Color)
  $G.DrawString($Text, $Font, $brush, $Rect, $sf)
  $brush.Dispose()
  $sf.Dispose()
}

function Draw-SparkBackground {
  param([System.Drawing.Graphics]$G, [int]$Seed)
  $rect = New-Object System.Drawing.Rectangle 0,0,1080,1920
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255, 1, 3, 9), [System.Drawing.Color]::FromArgb(255, 1, 17, 25), 90)
  $G.FillRectangle($bg, $rect)
  $bg.Dispose()
  $rnd = New-Object System.Random($Seed)
  for ($i = 0; $i -lt 135; $i++) {
    $x = $rnd.Next(20, 1060)
    $y = $rnd.Next(0, 1920)
    $len = $rnd.Next(4, 24)
    $alpha = $rnd.Next(60, 190)
    $palette = @(
      [System.Drawing.Color]::FromArgb($alpha,255,139,25),
      [System.Drawing.Color]::FromArgb($alpha,255,78,158),
      [System.Drawing.Color]::FromArgb($alpha,50,190,255),
      [System.Drawing.Color]::FromArgb($alpha,255,225,110)
    )
    $pen = New-Object System.Drawing.Pen($palette[$rnd.Next(0,$palette.Count)], $rnd.Next(1,3))
    if ($rnd.NextDouble() -gt 0.5) { $G.DrawLine($pen, $x, $y, $x, [Math]::Max(0, $y - $len)) } else { $G.DrawEllipse($pen, $x, $y, 2, 2) }
    $pen.Dispose()
  }
}

function Save-ProofBg {
  param([string]$Path, [string]$Title, [string]$Subtitle, [string]$Hint, [int]$Seed)
  $bmp = New-Object System.Drawing.Bitmap 1080,1920
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  Draw-SparkBackground $g $Seed

  $panelPath = New-RoundedRectPath ([System.Drawing.RectangleF]::new(54,58,972,170)) 4
  $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(238, 8, 14, 24))
  $g.FillPath($panelBrush, $panelPath)
  $panelBrush.Dispose()
  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,255,144,25), 7)
  $g.DrawLine($linePen, 54, 58, 1026, 58)
  $linePen.Dispose()
  $panelPath.Dispose()

  $titleFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 43, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 27, [System.Drawing.FontStyle]::Regular)
  Draw-Text $g $Title $titleFont ([System.Drawing.RectangleF]::new(84,90,910,58)) ([System.Drawing.Color]::White)
  Draw-Text $g $Subtitle $subFont ([System.Drawing.RectangleF]::new(84,152,910,44)) ([System.Drawing.Color]::FromArgb(235,220,225,235))
  $titleFont.Dispose()
  $subFont.Dispose()

  $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,255,139,25))
  $g.FillRectangle($labelBrush, 60, 865, 220, 56)
  $labelBrush.Dispose()
  $labelFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 24, [System.Drawing.FontStyle]::Bold)
  Draw-Text $g '放大看这里' $labelFont ([System.Drawing.RectangleF]::new(72,870,196,46)) ([System.Drawing.Color]::FromArgb(255,20,20,20)) 'Center'
  $labelFont.Dispose()
  $smallFont = New-Object System.Drawing.Font('Microsoft YaHei UI', 23, [System.Drawing.FontStyle]::Regular)
  Draw-Text $g '工具演示，仅供娱乐参考' $smallFont ([System.Drawing.RectangleF]::new(65,1560,520,42)) ([System.Drawing.Color]::FromArgb(175,200,205,210))
  $smallFont.Dispose()

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function Clean-SubtitleText {
  param([string]$Text)
  return ($Text -replace '[，。！？；：、,.!?;:]', ' ' -replace '\s+', ' ').Trim()
}

function Split-LongSubtitlePart {
  param([string]$Text, [int]$MaxLen)
  $items = New-Object 'System.Collections.Generic.List[string]'
  $remaining = $Text.Trim()
  while ($remaining.Length -gt $MaxLen) {
    $cut = $MaxLen
    $leftSpace = $remaining.LastIndexOf(' ', [Math]::Min($MaxLen, $remaining.Length - 1))
    if ($leftSpace -ge 6) { $cut = $leftSpace }
    $part = $remaining.Substring(0, $cut).Trim()
    if ($part.Length -gt 0) { $items.Add($part) | Out-Null }
    $remaining = $remaining.Substring($cut).Trim()
  }
  if ($remaining.Length -gt 0) {
    if ($remaining.Length -lt 4 -and $items.Count -gt 0) {
      $items[$items.Count - 1] = ($items[$items.Count - 1] + ' ' + $remaining).Trim()
    } else {
      $items.Add($remaining) | Out-Null
    }
  }
  return @($items.ToArray())
}

function Split-SubtitleChunks {
  param([string]$Text, [int]$MaxLen = 21)
  $rawParts = @($Text -split '[，。！？；：、,.!?;:]' | ForEach-Object { Clean-SubtitleText $_ } | Where-Object { $_.Length -gt 0 })
  $parts = New-Object 'System.Collections.Generic.List[string]'
  foreach ($part in $rawParts) {
    foreach ($piece in (Split-LongSubtitlePart $part $MaxLen)) {
      if ($piece.Trim().Length -gt 0) { $parts.Add($piece.Trim()) | Out-Null }
    }
  }
  $lines = New-Object 'System.Collections.Generic.List[string]'
  $line = ''
  foreach ($part in $parts) {
    $candidate = if ($line.Length -eq 0) { $part } else { "$line $part" }
    if ($candidate.Length -le $MaxLen) {
      $line = $candidate
    } else {
      if ($line.Length -gt 0) { $lines.Add($line) | Out-Null }
      $line = $part
    }
  }
  if ($line.Length -gt 0) { $lines.Add($line) | Out-Null }
  $groups = New-Object 'System.Collections.Generic.List[string]'
  for ($i = 0; $i -lt $lines.Count; $i += 2) {
    if ($i + 1 -lt $lines.Count) { $groups.Add($lines[$i] + "\N" + $lines[$i+1]) | Out-Null } else { $groups.Add($lines[$i]) | Out-Null }
  }
  return @($groups.ToArray())
}

function Format-SrtTime {
  param([double]$Seconds)
  $ts = [TimeSpan]::FromSeconds([Math]::Max(0, $Seconds))
  return '{0:00}:{1:00}:{2:00},{3:000}' -f [int]$ts.TotalHours, $ts.Minutes, $ts.Seconds, $ts.Milliseconds
}

function Format-AssTime {
  param([double]$Seconds)
  $ts = [TimeSpan]::FromSeconds([Math]::Max(0, $Seconds))
  $cs = [Math]::Floor($ts.Milliseconds / 10)
  return '{0}:{1:00}:{2:00}.{3:00}' -f [int]$ts.TotalHours, $ts.Minutes, $ts.Seconds, $cs
}

function Get-PropValue {
  param([object]$Object, [string]$Name)
  return $Object.PSObject.Properties[$Name].Value
}

$segments = @(
  [pscustomobject]@{ Kind='card'; Name='01_hook'; Desired=14.5; Image='D:\6.AI\自媒体\AI工具第5期\assets\render_ep5\01_hook.png'; Voice='只需一分钟，我把世界杯装进了一个 AI 工具里。赛程、比分、高光、预测、射手榜，打开就是一整套看板。废话不多说，直接看演示效果吧。' },
  [pscustomobject]@{ Kind='screen'; Name='02_schedule_score'; Desired=14.0; Bg='proof_schedule.png'; RawStart=0.2; Speed=2.0; Title='真实录屏：赛程和比分'; Subtitle='左边看比赛列表，右边看比分和赛场'; Hint='跟随鼠标看赛程列表和比赛详情'; Upper='0:0:1920:1020'; Track='150:430:1180:590'; Voice='开头先看总览页。北京赛程、比赛数量、最新赛况都在这里。点某一天，左边是比赛列表，右边直接出比分、场地和阶段。' },
  [pscustomobject]@{ Kind='screen'; Name='03_highlights'; Desired=11.0; Bg='proof_highlights.png'; RawStart=29.0; Speed=1.15; Title='真实录屏：高光进球'; Subtitle='热点视频和新闻卡片集中到一页'; Hint='跟随鼠标看高光卡片，不用来回翻网页'; Upper='0:0:1920:1020'; Track='250:360:1180:590'; Voice='再切到高光进球。这里把 ESPN 和新闻里的视频卡片集中到一页，想看热点内容，就不用在网页之间来回翻。' },
  [pscustomobject]@{ Kind='screen'; Name='04_prediction'; Desired=16.0; Bg='proof_prediction.png'; RawStart=42.0; Speed=1.0; Title='真实录屏：赛事预测'; Subtitle='不是玄学猜球，是把影响因素摊开看'; Hint='跟随鼠标看预测卡片和模型因子'; Upper='0:0:1920:1020'; Track='150:300:1220:710'; Voice='然后看赛事预测。它不是玄学猜比分，而是把基础实力、近期表现、进攻效率、历史交锋这些因子摊开。每张卡给一个倾向和百分比，方便你先抓变量。' },
  [pscustomobject]@{ Kind='screen'; Name='05_scorer'; Desired=10.5; Bg='proof_scorer.png'; RawStart=58.0; Speed=1.35; Title='真实录屏：射手榜'; Subtitle='球员、国家、总进球、本届进球同屏看'; Hint='跟随鼠标看表格排行和关键数据'; Upper='0:0:1920:1020'; Track='520:180:1150:780'; Voice='最后是射手榜。球员、国家、总进球和本届进球都在一张表里，追数据的时候就不用到处切页面。' },
  [pscustomobject]@{ Kind='card'; Name='06_summary'; Desired=11.0; Image='D:\6.AI\自媒体\AI工具第5期\assets\render_ep5\07_summary.png'; Voice='所以这个工具解决的不是让你变成解说员，而是把世界杯赛程、资讯和数据集中到一屏。想看球的时候，打开就能抓重点。' },
  [pscustomobject]@{ Kind='card'; Name='07_cta'; Desired=6.0; Image='D:\6.AI\自媒体\AI工具第5期\assets\render_ep5\08_cta.png'; Voice='要是觉得这个工具不错，欢迎大家评论区留言。' }
)

& $node $ttsScript
if ($LASTEXITCODE -ne 0) { throw "Yunxi TTS generation failed" }

$timeline = @()
$audioConcat = New-Object 'System.Collections.Generic.List[string]'
$cursor = 0.0
for ($i = 0; $i -lt $segments.Count; $i++) {
  $segObj = $segments[$i]
  $segName = [string](Get-PropValue -Object $segObj -Name 'Name')
  $segKind = [string](Get-PropValue -Object $segObj -Name 'Kind')
  $segVoice = [string](Get-PropValue -Object $segObj -Name 'Voice')
  $segDesired = [double](Get-PropValue -Object $segObj -Name 'Desired')
  $rawWebm = Join-Path $yunxiDir ('voice_yunxi_raw_{0:00}.webm' -f ($i + 1))
  $rawWav = Join-Path $yunxiDir ('voice_yunxi_raw_{0:00}.wav' -f ($i + 1))
  $segWav = Join-Path $yunxiDir ('voice_yunxi_seg_{0:00}.wav' -f ($i + 1))
  Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-i',$rawWebm,'-ar','48000','-ac','2',$rawWav)
  $rawDur = Get-MediaDuration $rawWav
  $duration = [Math]::Max($segDesired, $rawDur + 0.45)
  Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-i',$rawWav,'-af',("apad,atrim=0:{0:F3}" -f $duration),'-ar','48000','-ac','2',$segWav)
  $audioConcat.Add(("file '{0}'" -f ($segWav.Replace('\','/')))) | Out-Null
  $timeline += [pscustomobject]@{
    Index = $i + 1
    Name = $segName
    Kind = $segKind
    Start = [Math]::Round($cursor,3)
    End = [Math]::Round($cursor + $duration,3)
    Duration = [Math]::Round($duration,3)
    Voice = $segVoice
  }
  $cursor += $duration
}
$totalDuration = [Math]::Round($cursor,3)
$audioConcatPath = Join-Path $yunxiDir 'voice_yunxi_concat.txt'
[System.IO.File]::WriteAllLines($audioConcatPath, $audioConcat, $utf8NoBom)
$voiceAligned = Join-Path $yunxiDir 'voiceover_yunxi_aligned.wav'
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',$audioConcatPath,'-c','copy',$voiceAligned)

for ($i = 0; $i -lt $segments.Count; $i++) {
  $seg = $segments[$i]
  $kind = [string](Get-PropValue -Object $seg -Name 'Kind')
  if ($kind -eq 'screen') {
    $bgName = [string](Get-PropValue -Object $seg -Name 'Bg')
    $title = [string](Get-PropValue -Object $seg -Name 'Title')
    $subtitle = [string](Get-PropValue -Object $seg -Name 'Subtitle')
    $hint = [string](Get-PropValue -Object $seg -Name 'Hint')
    Save-ProofBg (Join-Path $render $bgName) $title $subtitle $hint (730 + $i)
  }
}

$videoConcat = New-Object 'System.Collections.Generic.List[string]'
for ($i = 0; $i -lt $segments.Count; $i++) {
  $seg = $segments[$i]
  $dur = [double]$timeline[$i].Duration
  $kind = [string](Get-PropValue -Object $seg -Name 'Kind')
  $name = [string](Get-PropValue -Object $seg -Name 'Name')
  $clip = Join-Path $clipsDir ('{0}_{1}.mp4' -f ($i + 1).ToString('00'), $name)
  if ($kind -eq 'card') {
    $image = [string](Get-PropValue -Object $seg -Name 'Image')
    $frames = [int][Math]::Ceiling($dur * 30)
    $vf = "zoompan=z='1+0.006*sin(on/10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,format=yuv420p"
    if ($name -eq '01_hook') {
      $sweepSource = "color=c=0xfff2b5@0.17:s=170x650:r=30:d=$([Math]::Round($dur,3)),format=yuva420p"
      $filter = "[0:v]zoompan=z='1+0.006*sin(on/10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,format=rgba[base];" +
        "[1:v]format=yuva420p[sweep];[base][sweep]overlay=x='mod(t*390\,1540)-260':y=120:format=auto:alpha=straight,format=yuv420p[v]"
      Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-loop','1','-i',$image,'-f','lavfi','-i',$sweepSource,'-filter_complex',$filter,'-map','[v]','-t',("{0:F3}" -f $dur),'-an','-c:v','libx264','-preset','veryfast','-crf','20',$clip)
    } else {
      Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-loop','1','-i',$image,'-t',("{0:F3}" -f $dur),'-vf',$vf,'-an','-c:v','libx264','-preset','veryfast','-crf','20',$clip)
    }
  } else {
    $bgName = [string](Get-PropValue -Object $seg -Name 'Bg')
    $rawStart = [double](Get-PropValue -Object $seg -Name 'RawStart')
    $speed = [double](Get-PropValue -Object $seg -Name 'Speed')
    $upperSpec = [string](Get-PropValue -Object $seg -Name 'Upper')
    $trackSpec = [string](Get-PropValue -Object $seg -Name 'Track')
    $bg = Join-Path $render $bgName
    $sourceDur = [Math]::Min(73.0 - $rawStart, $dur * $speed + 0.7)
    $upper = $upperSpec.Split(':')
    $track = $trackSpec.Split(':')
    $upperCrop = "crop=$($upper[2]):$($upper[3]):$($upper[0]):$($upper[1])"
    $tx = [int]$track[0]
    $ty = [int]$track[1]
    $tw = [int]$track[2]
    $th = [int]$track[3]
    $trackCrop = "crop=${tw}:${th}:${tx}:${ty}"
    $filter = "[1:v]setpts=(PTS-STARTPTS)/$speed,split=2[rawu][rawl];" +
      "[rawu]$upperCrop,drawbox=x=${tx}:y=${ty}:w=${tw}:h=${th}:color=0xff8f18@1:t=12,scale=1000:560:force_original_aspect_ratio=decrease,pad=1000:560:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba[upper];" +
      "[rawl]$trackCrop,scale=1000:590:force_original_aspect_ratio=decrease,pad=1000:590:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba[lower];" +
      "[0:v]fps=30,format=rgba[bg];[bg][upper]overlay=40:260[tmp1];[tmp1][lower]overlay=40:930[tmp2];" +
      "[tmp2]drawbox=x=40:y=260:w=1000:h=560:color=0xff8f18@1:t=3,drawbox=x=40:y=930:w=1000:h=590:color=0x1f6dff@1:t=3,format=yuv420p[v]"
    Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-loop','1','-t',("{0:F3}" -f $dur),'-i',$bg,'-ss',("{0:F3}" -f $rawStart),'-t',("{0:F3}" -f $sourceDur),'-i',$srcVideo,'-filter_complex',$filter,'-map','[v]','-t',("{0:F3}" -f $dur),'-an','-c:v','libx264','-preset','veryfast','-crf','19',$clip)
  }
  $videoConcat.Add(("file 'clips/{0}'" -f (Split-Path $clip -Leaf))) | Out-Null
}
$videoConcatPath = Join-Path $render 'video_concat.txt'
[System.IO.File]::WriteAllLines($videoConcatPath, $videoConcat, $utf8NoBom)
Push-Location $render
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i','video_concat.txt','-c','copy','base_no_audio_ep4style.mp4')
Pop-Location

$srt = New-Object System.Text.StringBuilder
$ass = New-Object System.Text.StringBuilder
[void]$ass.AppendLine('[Script Info]')
[void]$ass.AppendLine('ScriptType: v4.00+')
[void]$ass.AppendLine('PlayResX: 1080')
[void]$ass.AppendLine('PlayResY: 1920')
[void]$ass.AppendLine('')
[void]$ass.AppendLine('[V4+ Styles]')
[void]$ass.AppendLine('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding')
[void]$ass.AppendLine('Style: Default,Microsoft YaHei UI,42,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,1,0,0,0,100,100,0,0,3,2,0,2,70,70,230,1')
[void]$ass.AppendLine('')
[void]$ass.AppendLine('[Events]')
[void]$ass.AppendLine('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')
$subtitlePlan = @(
  @('只需一分钟\N我把世界杯装进了一个 AI 工具里', '赛程 比分 高光 预测 射手榜\N打开就是一整套看板', '废话不多说\N直接看演示效果吧'),
  @('开头先看总览页 北京赛程 比赛数量\N最新赛况都在这里 点某一天', '左边是比赛列表 右边直接出比分\N场地和阶段'),
  @('再切到高光进球 这里把 ESPN\N和新闻里的视频卡片集中到一页', '想看热点内容 就不用在网页之间来回翻'),
  @('然后看赛事预测 它不是玄学猜比分\N而是把基础实力 近期表现 进攻效率', '历史交锋这些因子摊开\N每张卡给一个倾向和百分比', '方便你先抓变量'),
  @('最后是射手榜 球员 国家\N总进球和本届进球都在一张表里', '追数据的时候就不用到处切页面'),
  @('所以这个工具解决的不是让你变成解说员\N而是把世界杯赛程', '资讯和数据集中到一屏 想看球的时候\N打开就能抓重点'),
  @('要是觉得这个工具不错\N欢迎大家评论区留言')
)
$subIndex = 1
$timelineIndex = 0
foreach ($item in $timeline) {
  $chunks = @($subtitlePlan[$timelineIndex])
  $itemDuration = [double]$item.PSObject.Properties['Duration'].Value
  $itemStart = [double]$item.PSObject.Properties['Start'].Value
  $itemEnd = [double]$item.PSObject.Properties['End'].Value
  $chunkDur = $itemDuration / [Math]::Max(1, $chunks.Count)
  for ($j = 0; $j -lt $chunks.Count; $j++) {
    $st = $itemStart + $j * $chunkDur
    $ed = if ($j -eq $chunks.Count - 1) { $itemEnd } else { $st + $chunkDur }
    $chunkText = [string]$chunks[$j]
    [void]$srt.AppendLine($subIndex.ToString())
    [void]$srt.AppendLine((Format-SrtTime $st) + ' --> ' + (Format-SrtTime $ed))
    [void]$srt.AppendLine($chunkText.Replace('\N', "`r`n"))
    [void]$srt.AppendLine('')
    [void]$ass.AppendLine(("Dialogue: 0,{0},{1},Default,,0,0,0,,{2}" -f (Format-AssTime $st), (Format-AssTime $ed), $chunkText))
    $subIndex++
  }
  $timelineIndex++
}
[System.IO.File]::WriteAllText((Join-Path $episode 'subtitles.srt'), $srt.ToString(), $utf8Bom)
[System.IO.File]::WriteAllText((Join-Path $render 'subtitles.ass'), $ass.ToString(), $utf8NoBom)

$progressDir = Join-Path $render 'progress_frames'
$resolvedRender = (Resolve-Path -LiteralPath $render).Path
if (Test-Path -LiteralPath $progressDir) {
  $resolvedProgress = (Resolve-Path -LiteralPath $progressDir).Path
  if (-not $resolvedProgress.StartsWith($resolvedRender, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to clean unexpected progress directory: $resolvedProgress" }
  Remove-Item -LiteralPath $progressDir -Recurse -Force
}
New-Item -ItemType Directory -Path $progressDir -Force | Out-Null
$frameCount = [int][Math]::Ceiling($totalDuration * 30)
for ($i = 0; $i -lt $frameCount; $i++) {
  $bmp = New-Object System.Drawing.Bitmap 1080,8
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,20,20,20))
  $g.FillRectangle($bgBrush, 0, 0, 1080, 8)
  $bgBrush.Dispose()
  $w = [Math]::Max(1, [Math]::Floor(1080 * ($i + 1) / $frameCount))
  $rect = New-Object System.Drawing.Rectangle 0,0,$w,8
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255,255,148,31), [System.Drawing.Color]::FromArgb(255,255,79,163), 0)
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()
  $g.Dispose()
  $bmp.Save((Join-Path $progressDir ('bar_{0:00000}.png' -f $i)), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
$progressVideo = Join-Path $render 'progress_bar.mp4'
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-framerate','30','-i',(Join-Path $progressDir 'bar_%05d.png'),'-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',$progressVideo)

$base = Join-Path $render 'base_no_audio_ep4style.mp4'
$tmpFinal = Join-Path $render 'publish_ep4style_tmp.mp4'
$videoFilter = "[0:v]ass=subtitles.ass[vsub];[3:v]format=rgba[bar];[vsub][bar]overlay=0:1912[v]"
$fadeOut = [Math]::Max(0, $totalDuration - 2)
$audioFilter = "[1:a]aresample=48000,asetpts=PTS-STARTPTS,asplit=2[voice_mix][voice_sc];[2:a]aresample=48000,atrim=0:$totalDuration,asetpts=PTS-STARTPTS,volume=0.10,afade=t=in:st=0:d=1,afade=t=out:st=${fadeOut}:d=2[bgm0];[bgm0][voice_sc]sidechaincompress=threshold=0.018:ratio=8:attack=20:release=320:makeup=1[ducked];[voice_mix][ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]"
Push-Location $render
Invoke-FFmpeg @('-hide_banner','-y','-i',$base,'-i',$voiceAligned,'-stream_loop','-1','-i',$bgmFile,'-i',$progressVideo,'-filter_complex',("$videoFilter;$audioFilter"),'-map','[v]','-map','[a]','-c:v','libx264','-preset','medium','-crf','19','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',$tmpFinal)
Pop-Location

Copy-Item -LiteralPath $tmpFinal -Destination (Join-Path $episode 'douyin_publish.mp4') -Force
Copy-Item -LiteralPath $tmpFinal -Destination (Join-Path $episode 'xiaohongshu_publish.mp4') -Force
Copy-Item -LiteralPath $tmpFinal -Destination (Join-Path $delivery 'douyin_publish.mp4') -Force
Copy-Item -LiteralPath $tmpFinal -Destination (Join-Path $delivery 'xiaohongshu_publish.mp4') -Force
Copy-Item -LiteralPath (Join-Path $episode 'subtitles.srt') -Destination (Join-Path $delivery 'subtitles.srt') -Force

$voiceText = ($segments | ForEach-Object -Begin { $n = 1 } -Process { "$n. $([string](Get-PropValue -Object $_ -Name 'Voice'))"; $n++ }) -join "`r`n"
$voiceText += "`r`n配音说明：当前成片使用 zh-CN-YunxiNeural 临时 TTS，按第4期口播配音风格重配；背景音乐使用用户提供的《背景音乐_世界杯.MOV》，低音量混入并做人声避让。"
[System.IO.File]::WriteAllText((Join-Path $episode 'voiceover_script.txt'), $voiceText, $utf8Bom)
Copy-Item -LiteralPath (Join-Path $episode 'voiceover_script.txt') -Destination (Join-Path $delivery 'voiceover_script.txt') -Force

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $episode 'douyin_publish.mp4')).Hash
$revEnd = Get-Date
$elapsed = $revEnd - $revStart
$stats = [pscustomobject]@{
  revisionStartedAt = $revStart.ToString('o')
  revisionCompletedAt = $revEnd.ToString('o')
  revisionElapsedSeconds = [Math]::Round($elapsed.TotalSeconds, 2)
  durationSeconds = $totalDuration
  sha256 = $hash
  voice = 'zh-CN-YunxiNeural'
  screenStyle = 'Episode 4 tracking-box proof layout'
  tokenUsage = $null
  tokenUsageNote = 'Exact token usage is not exposed by the current runtime.'
  timeline = $timeline
}
$stats | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $statsPath -Encoding UTF8

$readmePath = Join-Path $episode 'delivery_readme.md'
$readme = Get-Content -LiteralPath $readmePath -Raw
$readme = $readme -replace '背景音乐使用用户提供的 `背景音乐_世界杯.MOV`，低音量混入并做人声避让。', '背景音乐使用用户提供的 `背景音乐_世界杯.MOV`，低音量混入并做人声避让。录屏讲解阶段已按第4期双层录屏证明版式重做：上层完整上下文，下层当前模块放大。'
$readme = $readme -replace '抖音版和小红书版 SHA256 一致：`[A-F0-9]+`', ('抖音版和小红书版 SHA256 一致：`' + $hash + '`')
$readme = $readme -replace '完成时间：.*', ('完成时间：' + $revEnd.ToString('yyyy-MM-dd HH:mm:ss zzz'))
$readme = $readme -replace '整体耗时：.*', ('整体耗时：' + [Math]::Round($elapsed.TotalMinutes, 2) + ' 分钟（本次按第4期风格重做修订耗时）')
[System.IO.File]::WriteAllText($readmePath, $readme, $utf8Bom)
Copy-Item -LiteralPath $readmePath -Destination (Join-Path $delivery 'delivery_readme.md') -Force

Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-ss','1','-i',(Join-Path $episode 'douyin_publish.mp4'),'-frames:v','1',(Join-Path $qcDir 'frame_001.jpg'))
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-ss',("{0:F3}" -f ($totalDuration / 2)),'-i',(Join-Path $episode 'douyin_publish.mp4'),'-frames:v','1',(Join-Path $qcDir 'frame_mid.jpg'))
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-ss',("{0:F3}" -f ([Math]::Max(0,$totalDuration - 2))),'-i',(Join-Path $episode 'douyin_publish.mp4'),'-frames:v','1',(Join-Path $qcDir 'frame_end.jpg'))
Invoke-FFmpeg @('-hide_banner','-loglevel','error','-y','-i',(Join-Path $episode 'douyin_publish.mp4'),'-vf',"select='eq(n,30)+eq(n,900)+eq(n,1500)+eq(n,2400)',scale=270:-1,tile=4x1:padding=8:margin=8:color=black",'-frames:v','1',(Join-Path $qcDir 'contact_ep4style.jpg'))

Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $delivery 'douyin_publish.mp4'),(Join-Path $delivery 'xiaohongshu_publish.mp4') | Select-Object Path,Hash | Format-Table -AutoSize
