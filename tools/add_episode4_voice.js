const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const repo = "D:\\Code\\AiCoding\\MyAI";
const episodeDir = "D:\\6.AI\\自媒体\\AI工具第4期";
const ffmpeg = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const ffprobe = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe");

const assetsDir = path.join(episodeDir, "assets");
const audioDir = path.join(assetsDir, "audio");
const backupDir = path.join(assetsDir, "backup");
const dataDir = path.join(assetsDir, "render_data");
const workAudioDir = path.join(repo, "tools", "episode4_audio_work");

for (const dir of [audioDir, backupDir, dataDir, workAudioDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(cmd, args) {
  console.log(`\n> ${path.basename(cmd)} ${args.join(" ")}`);
  cp.execFileSync(cmd, args, { stdio: "inherit" });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function copyIfExists(src, dest) {
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

function parseTime(value) {
  const match = value.match(/^(\d+):(\d+):(\d+),(\d+)$/);
  if (!match) throw new Error(`Bad SRT timestamp: ${value}`);
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

function parseSrt(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
  return content.trim().split(/\n\n+/).map(block => {
    const lines = block.split("\n");
    const timing = lines[1].match(/(.+?) --> (.+)/);
    return {
      start: parseTime(timing[1]),
      end: parseTime(timing[2]),
      text: lines.slice(2).join(" ")
    };
  });
}

function duration(filePath) {
  const out = cp.execFileSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ], { encoding: "utf8" }).trim();
  return Number(out);
}

function atempoChain(factor) {
  const parts = [];
  let current = factor;
  while (current > 2) {
    parts.push("atempo=2");
    current /= 2;
  }
  while (current < 0.5) {
    parts.push("atempo=0.5");
    current /= 0.5;
  }
  parts.push(`atempo=${current.toFixed(4)}`);
  return parts.join(",");
}

function makeSpeechPowerShell(items) {
  const voiceName = "Microsoft Huihui Desktop";
  const lines = [
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    `$synth.SelectVoice('${voiceName}')`,
    "$synth.Rate = 1",
    "$synth.Volume = 100",
  ];

  for (const item of items) {
    const encodedText = Buffer.from(item.text, "utf8").toString("base64");
    const out = item.raw.replace(/\\/g, "\\\\").replace(/'/g, "''");
    lines.push(`$text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedText}'))`);
    lines.push(`$synth.SetOutputToWaveFile('${out}')`);
    lines.push("$synth.Speak($text)");
    lines.push("$synth.SetOutputToNull()");
  }

  lines.push("$synth.Dispose()");
  return lines.join("\r\n");
}

function main() {
  const srtPath = path.join(episodeDir, "subtitles.srt");
  const spokenOverrides = new Map([
    [4, "这里可以选沪深三百、半导体，再让智能体分析。"],
    [8, "最后智能体会整理高位风险、关注点和结论。"],
    [11, "留言拿提示词。"]
  ]);
  const segments = parseSrt(srtPath).map((item, index) => ({
    ...item,
    text: spokenOverrides.get(index) || item.text,
    index,
    duration: item.end - item.start,
    raw: path.join(workAudioDir, `voice_raw_${String(index + 1).padStart(2, "0")}.wav`),
    fit: path.join(workAudioDir, `voice_fit_${String(index + 1).padStart(2, "0")}.wav`)
  }));

  const ps1 = path.join(workAudioDir, "speak_segments.ps1");
  writeFile(ps1, makeSpeechPowerShell(segments));
  cp.execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1], { stdio: "inherit" });

  for (const seg of segments) {
    const rawDuration = duration(seg.raw);
    const target = Math.max(0.25, seg.duration);
    const usable = Math.max(0.2, target - 0.12);
    const filters = ["aresample=44100"];
    if (rawDuration > usable) {
      filters.push(atempoChain(rawDuration / usable));
    }
    filters.push("apad");
    run(ffmpeg, [
      "-hide_banner", "-y",
      "-i", seg.raw,
      "-af", filters.join(","),
      "-t", target.toFixed(3),
      "-ac", "2",
      "-ar", "44100",
      seg.fit
    ]);
  }

  const concat = path.join(workAudioDir, "voice_concat.txt");
  writeFile(concat, segments.map(seg => `file '${seg.fit.replace(/\\/g, "/")}'`).join("\n"));
  const voiceWav = path.join(workAudioDir, "voiceover_aligned.wav");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat,
    "-c", "copy",
    voiceWav
  ]);

  fs.copyFileSync(voiceWav, path.join(audioDir, "voiceover_aligned.wav"));

  const douyin = path.join(episodeDir, "douyin_publish.mp4");
  const xhs = path.join(episodeDir, "xiaohongshu_publish.mp4");
  copyIfExists(douyin, path.join(backupDir, "douyin_publish_silent.mp4"));
  copyIfExists(xhs, path.join(backupDir, "xiaohongshu_publish_silent.mp4"));

  const voicedTemp = path.join(workAudioDir, "douyin_publish_voiced_tmp.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", douyin,
    "-i", voiceWav,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    voicedTemp
  ]);

  fs.copyFileSync(voicedTemp, douyin);
  fs.copyFileSync(voicedTemp, xhs);

  console.log("\nVoice added.");
  console.log(`voiceover: ${voiceWav}`);
}

main();
