param(
  [Parameter(Mandatory = $true)]
  [string]$ReferenceUrl,

  [Parameter(Mandatory = $true)]
  [string]$Topic,

  [string]$MusicPath = "",

  [string]$EpisodeRoot = "",

  [string]$VoiceSkillPath = "D:\Code\AiCoding\MyAI\skills\douyin-xiaohongshu-video-producer-1.0.0"
)

$ErrorActionPreference = "Stop"

function U([int[]]$Codes) {
  return -join ($Codes | ForEach-Object { [char]$_ })
}

function Get-DefaultMediaRoot() {
  return "D:\6.AI\" + (U @(0x81EA, 0x5A92, 0x4F53))
}

function Convert-ToChineseNumber([int]$Number) {
  $digits = @(
    "",
    (U @(0x4E00)),
    (U @(0x4E8C)),
    (U @(0x4E09)),
    (U @(0x56DB)),
    (U @(0x4E94)),
    (U @(0x516D)),
    (U @(0x4E03)),
    (U @(0x516B)),
    (U @(0x4E5D))
  )
  $ten = U @(0x5341)
  if ($Number -le 10) {
    if ($Number -eq 10) { return $ten }
    return $digits[$Number]
  }
  if ($Number -lt 20) {
    return "$ten$($digits[$Number - 10])"
  }
  if ($Number -lt 100) {
    $tens = [math]::Floor($Number / 10)
    $ones = $Number % 10
    if ($ones -eq 0) { return "$($digits[$tens])$ten" }
    return "$($digits[$tens])$ten$($digits[$ones])"
  }
  return [string]$Number
}

function Convert-FromChineseNumber([string]$Text) {
  $one = U @(0x4E00)
  $two = U @(0x4E8C)
  $three = U @(0x4E09)
  $four = U @(0x56DB)
  $five = U @(0x4E94)
  $six = U @(0x516D)
  $seven = U @(0x4E03)
  $eight = U @(0x516B)
  $nine = U @(0x4E5D)
  $ten = U @(0x5341)
  $map = @{}
  $map[$one] = 1; $map[$two] = 2; $map[$three] = 3; $map[$four] = 4; $map[$five] = 5
  $map[$six] = 6; $map[$seven] = 7; $map[$eight] = 8; $map[$nine] = 9; $map[$ten] = 10

  if ($Text -match '^\d+$') { return [int]$Text }
  if ($Text -eq $ten) { return 10 }
  if ($Text -match "^$ten(.+)$") { return 10 + $map[$Matches[1]] }
  if ($Text -match "^(.+)$ten$") { return $map[$Matches[1]] * 10 }
  if ($Text -match "^(.+)$ten(.+)$") { return ($map[$Matches[1]] * 10) + $map[$Matches[2]] }
  if ($map.ContainsKey($Text)) { return $map[$Text] }
  return 0
}

if ([string]::IsNullOrWhiteSpace($MusicPath)) {
  $MusicPath = Join-Path (Get-DefaultMediaRoot) (U @(0x80CC, 0x666F, 0x97F3, 0x4E50, 0x005F, 0x6D2A, 0x8352, 0x4E4B, 0x529B, 0x002E, 0x004D, 0x004F, 0x0056))
}

if ([string]::IsNullOrWhiteSpace($EpisodeRoot)) {
  $EpisodeRoot = Join-Path (Get-DefaultMediaRoot) (U @(0x0041, 0x0049, 0x7528, 0x6CD5))
}

if (!(Test-Path -LiteralPath $EpisodeRoot)) {
  New-Item -ItemType Directory -Force -Path $EpisodeRoot | Out-Null
}

if (!(Test-Path -LiteralPath $MusicPath)) {
  throw "Music file not found: $MusicPath"
}

$di = U @(0x7B2C)
$qi = U @(0x671F)
$max = 0
Get-ChildItem -LiteralPath $EpisodeRoot -Directory | ForEach-Object {
  if ($_.Name -match "^$di(.+)$qi$") {
    $n = Convert-FromChineseNumber $Matches[1]
    if ($n -gt $max) { $max = $n }
  }
}

$next = $max + 1
$episodeName = "$di$(Convert-ToChineseNumber $next)$qi"
$episodeDir = Join-Path $EpisodeRoot $episodeName
$projectDir = Join-Path $episodeDir "remotion_project"
$publicDir = Join-Path $projectDir "public"

New-Item -ItemType Directory -Force -Path $publicDir | Out-Null

$musicExt = [IO.Path]::GetExtension($MusicPath)
$musicDestName = "episode-bgm$musicExt"
$musicDest = Join-Path $publicDir $musicDestName
Copy-Item -LiteralPath $MusicPath -Destination $musicDest -Force
$voiceDir = Join-Path $VoiceSkillPath "assets\audio"
$voiceManifest = Join-Path $voiceDir "audio-manifest.json"
$voiceSampleWebm = Join-Path $voiceDir "voice-yunxi-sample.webm"
$voiceSampleWav = Join-Path $voiceDir "voice-yunxi-sample.wav"
if (Test-Path -LiteralPath $voiceManifest) {
  Copy-Item -LiteralPath $voiceManifest -Destination (Join-Path $publicDir "audio-manifest.json") -Force
}
if (Test-Path -LiteralPath $voiceSampleWebm) {
  Copy-Item -LiteralPath $voiceSampleWebm -Destination (Join-Path $publicDir "voice-yunxi-sample.webm") -Force
}
if (Test-Path -LiteralPath $voiceSampleWav) {
  Copy-Item -LiteralPath $voiceSampleWav -Destination (Join-Path $publicDir "voice-yunxi-sample.wav") -Force
}
$finalVideoPath = Join-Path $episodeDir (U @(0x672C, 0x671F, 0x6210, 0x7247, 0x002E, 0x006D, 0x0070, 0x0034))
$coverPath = Join-Path $episodeDir (U @(0x53D1, 0x5E03, 0x5C01, 0x9762, 0x002E, 0x0070, 0x006E, 0x0067))
$publishCopyPath = Join-Path $episodeDir (U @(0x53D1, 0x5E03, 0x6587, 0x6848, 0x002E, 0x006D, 0x0064))
$narrationPath = Join-Path $episodeDir (U @(0x65C1, 0x767D, 0x97F3, 0x9891, 0x002E, 0x0077, 0x0065, 0x0062, 0x006D))
$subtitlePath = Join-Path $episodeDir (U @(0x5B57, 0x5E55, 0x002E, 0x0073, 0x0072, 0x0074))
$subtitledVideoPath = Join-Path $episodeDir (U @(0x5B57, 0x5E55, 0x7248, 0x6210, 0x7247, 0x002E, 0x006D, 0x0070, 0x0034))

$metadata = [ordered]@{
  episode_number = $next
  episode_name = $episodeName
  reference_url = $ReferenceUrl
  topic = $Topic
  source_music_path = $MusicPath
  project_dir = $projectDir
  public_music_file = $musicDestName
  voice_provider = "Microsoft Edge TTS"
  voice_id = "zh-CN-YunxiNeural"
  voice_rate = "+0%"
  voice_pitch = "+0Hz"
  voice_volume = "+0%"
  voice_sample_webm = "voice-yunxi-sample.webm"
  voice_sample_wav = "voice-yunxi-sample.wav"
  narration_audio_path = $narrationPath
  subtitle_path = $subtitlePath
  final_video_path = $finalVideoPath
  subtitled_video_path = $subtitledVideoPath
  cover_path = $coverPath
  publish_copy_path = $publishCopyPath
  created_at = (Get-Date).ToString("s")
}

$metadataPath = Join-Path $episodeDir "episode.json"
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $metadataPath -Encoding UTF8

[ordered]@{
  episodeDir = $episodeDir
  projectDir = $projectDir
  publicDir = $publicDir
  metadataPath = $metadataPath
  musicFile = $musicDest
  narrationAudioPath = $narrationPath
  subtitlePath = $subtitlePath
  finalVideoPath = $finalVideoPath
  subtitledVideoPath = $subtitledVideoPath
  coverPath = $coverPath
  publishCopyPath = $publishCopyPath
} | ConvertTo-Json -Depth 5
