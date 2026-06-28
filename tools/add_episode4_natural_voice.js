const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const repo = "D:\\Code\\AiCoding\\MyAI";
const episodeDir = "D:\\6.AI\\自媒体\\AI工具第4期";
const ffmpeg = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const ffprobe = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe");
const nodeEdgeTtsBin = path.join(repo, "tools", "node-edge-tts", "node_modules", "node-edge-tts", "bin.js");

const assetsDir = path.join(episodeDir, "assets");
const audioDir = path.join(assetsDir, "audio");
const backupDir = path.join(assetsDir, "backup");
const dataDir = path.join(assetsDir, "render_data");
const workAudioDir = path.join(repo, "tools", "episode4_natural_voice_work");

for (const dir of [audioDir, backupDir, dataDir, workAudioDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const voiceName = "zh-CN-YunxiNeural";

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
      subtitle: lines.slice(2).join(" ")
    };
  });
}

function srtTime(seconds) {
  const ms = Math.round((seconds % 1) * 1000);
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function assTime(seconds) {
  const cs = Math.round((seconds % 1) * 100);
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function assEscape(text) {
  return text.replace(/\r?\n/g, "\\N");
}

function writeSubtitles(segments) {
  const srt = segments.map((seg, index) => {
    const displayText = (seg.display || seg.text).replace(/\\N/g, "\n");
    return `${index + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.end)}\n${displayText}\n`;
  }).join("\n");
  writeFile(path.join(episodeDir, "subtitles.srt"), srt);

  const ass = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Default,Microsoft YaHei,44,&H00FFFFFF,&H000000FF,&H00333333,&H99000000,1,0,0,0,100,100,0,0,1,4,1,2,96,96,220,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...segments.map(seg => `Dialogue: 0,${assTime(seg.start)},${assTime(seg.end)},Default,,0,0,0,,${assEscape(seg.display || seg.text)}`)
  ].join("\n");
  const assPath = path.join(dataDir, "natural_subtitles_burn.ass");
  writeFile(assPath, ass);
  return assPath;
}

function ffPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
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

function synthesizeToMp3(text, output, options = {}) {
  const {
    voice = voiceName,
    rate = "+8%",
    pitch = "default",
    volume = "default"
  } = options;

  run(process.execPath, [
    nodeEdgeTtsBin,
    "-t", text,
    "-f", output,
    "-v", voice,
    "-l", "zh-CN",
    "-o", "audio-24khz-96kbitrate-mono-mp3",
    "-r", rate,
    "--pitch", pitch,
    "--volume", volume,
    "--timeout", "20000"
  ]);
}

function buildSegments() {
  const times = parseSrt(path.join(episodeDir, "subtitles.srt"));
  const spoken = [
    "再也不用偷偷看手机看行情了。",
    "股票、基金、板块，最烦的是信息散得到处都是。",
    "所以这期，我让 AI 做了一个一屏行情工具。",
    "鼠标现在先停在今日涨跌建议。这里先给大盘方向，再把风险点写成短结论。",
    "这里切到模型和板块选择。比如沪深三百、半导体，都可以让智能体重新分析。",
    "往下看板块动向热度。上涨和下跌分开，旁边的小趋势线能直接看方向。",
    "右边这里是基金交易排行。基金名称、趋势线、涨跌幅，都放在一屏里。",
    "鼠标切到半导体、通信、有色这些方向，就能看对应板块的走势变化。",
    "最后这个区域是智能体总结。高位风险、关注点和结论，会整理成一段人话。",
    "这样上班也能安静看全局，不用手机来回切。",
    "想要这个工具的完整生成提示词，评论区留言。",
    "欢迎留言获取提示词。"
  ];
  const display = [
    "再也不用偷偷看手机看行情了。",
    "股票、基金、板块，最烦的是\\N信息散得到处都是。",
    "所以这期，我让 AI 做了一个一屏行情工具。",
    "鼠标现在先停在今日涨跌建议。\\N这里先给大盘方向，再把风险点写成短结论。",
    "这里切到模型和板块选择。\\N沪深三百、半导体，都能让智能体重新分析。",
    "往下看板块动向热度。\\N上涨和下跌分开，小趋势线直接看方向。",
    "右边是基金交易排行。\\N名称、趋势线、涨跌幅都放在一屏里。",
    "鼠标切到半导体、通信、有色，\\N就能看对应板块走势。",
    "最后这个区域是智能体总结。\\N高位风险、关注点和结论，会整理成一段人话。",
    "上班也能安静看全局，\\N不用手机来回切。",
    "想要完整生成提示词，\\N评论区留言。",
    "欢迎留言获取提示词。"
  ];

  return times.map((item, index) => ({
    ...item,
    text: spoken[index],
    display: display[index],
    index,
    duration: item.end - item.start,
    raw: path.join(workAudioDir, `natural_raw_${String(index + 1).padStart(2, "0")}.mp3`),
    fit: path.join(workAudioDir, `natural_fit_${String(index + 1).padStart(2, "0")}.wav`)
  }));
}

async function main() {
  const segments = buildSegments();
  const assPath = writeSubtitles(segments);
  const voiceoverScript = segments.map((seg, index) => `${index + 1}. ${seg.text}`).join("\n\n")
    + "\n\n说明：当前配音为 Edge 神经语音生成的可替换临时 TTS；如果提供真人录音，应以真人声作为主配音。";
  writeFile(path.join(episodeDir, "voiceover_script.txt"), voiceoverScript);
  writeFile(path.join(audioDir, "README_voiceover.txt"), `当前音轨：${voiceName} 临时 TTS，可替换。\n规则：无用户真人录音时，仅作为临时配音；后续提供真人录音后应替换为真人声。\n`);

  for (const seg of segments) {
    console.log(`Synth ${seg.index + 1}/${segments.length}: ${seg.text}`);
    if (!fs.existsSync(seg.raw) || fs.statSync(seg.raw).size === 0) {
      await synthesizeToMp3(seg.text, seg.raw, { rate: seg.duration <= 3.5 ? "+12%" : "+7%" });
    } else {
      console.log(`Reusing ${seg.raw}`);
    }
  }

  for (const seg of segments) {
    const rawDuration = duration(seg.raw);
    const target = Math.max(0.25, seg.duration);
    const usable = Math.max(0.2, target - 0.16);
    const filters = ["aresample=44100"];
    if (rawDuration > usable) {
      filters.push(atempoChain(rawDuration / usable));
    }
    filters.push("apad");
    filters.push("acompressor=threshold=-18dB:ratio=2.2:attack=8:release=120");
    filters.push("alimiter=limit=0.95");
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

  const concat = path.join(workAudioDir, "natural_voice_concat.txt");
  writeFile(concat, segments.map(seg => `file '${seg.fit.replace(/\\/g, "/")}'`).join("\n"));
  const voiceWav = path.join(workAudioDir, "voiceover_natural_aligned.wav");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat,
    "-c", "copy",
    voiceWav
  ]);

  fs.copyFileSync(voiceWav, path.join(audioDir, "voiceover_natural_aligned.wav"));

  const douyin = path.join(episodeDir, "douyin_publish.mp4");
  const xhs = path.join(episodeDir, "xiaohongshu_publish.mp4");
  copyIfExists(douyin, path.join(backupDir, "douyin_publish_huihui_tts.mp4"));
  copyIfExists(xhs, path.join(backupDir, "xiaohongshu_publish_huihui_tts.mp4"));

  const baseConcat = path.join(assetsDir, "clips", "base_concat.mp4");
  const voicedTemp = path.join(workAudioDir, "publish_natural_tmp.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", baseConcat,
    "-i", voiceWav,
    "-vf", `subtitles='${ffPath(assPath)}'`,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "libx264",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-af", "volume=5dB,alimiter=limit=0.95",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    "-movflags", "+faststart",
    voicedTemp
  ]);

  fs.copyFileSync(voicedTemp, douyin);
  fs.copyFileSync(voicedTemp, xhs);

  console.log("\nNatural temporary TTS added.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
