const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");

const repo = "D:\\Code\\AiCoding\\MyAI";
const episodeDir = "D:\\6.AI\\自媒体\\AI工具第4期";
const rawVideo = path.join(episodeDir, "2f3c8e338f9366dcb84e54e8ede5a85b_raw.mp4");
const toolScreenshotSource = "C:\\Users\\25506\\AppData\\Local\\Temp\\codex-clipboard-6cce8b5a-2748-497b-bbda-82d95113d12e.png";
const skillDir = "C:\\Users\\25506\\.codex\\skills\\douyin-xiaohongshu-video-producer-1.0.0";
const endingTemplate = path.join(skillDir, "assets", "ending", "like-ending-template.mp4");
const ffmpeg = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const ffprobe = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe");
const nodeEdgeTtsBin = path.join(repo, "tools", "node-edge-tts", "node_modules", "node-edge-tts", "bin.js");

const assetsDir = path.join(episodeDir, "assets");
const refinedDir = path.join(assetsDir, "refined_spark_style");
const clipsDir = path.join(refinedDir, "clips");
const audioDir = path.join(assetsDir, "audio");
const bgmDir = path.join(assetsDir, "bgm");
const backupDir = path.join(assetsDir, "backup");
const dataDir = path.join(assetsDir, "render_data");
const workAudioDir = path.join(repo, "tools", "episode4_spark_voice_work");
const toolScreenshot = path.join(refinedDir, "tool_real_screenshot.png");

for (const dir of [refinedDir, clipsDir, audioDir, bgmDir, backupDir, dataDir, workAudioDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const voiceName = "zh-CN-YunxiNeural";
const voiceRate = "+8%";
const musicReferenceVideo = "D:\\LenovoSoftstore\\Install\\OBSReclupingdashi\\save\\video\\20260627-2008.mp4";

function run(cmd, args) {
  console.log(`\n> ${path.basename(cmd)} ${args.join(" ")}`);
  cp.execFileSync(cmd, args, { stdio: "inherit" });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function backupIfExists(filePath, suffix) {
  if (!fs.existsSync(filePath)) return;
  const parsed = path.parse(filePath);
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const dest = path.join(backupDir, `${parsed.name}_${suffix}_${stamp}${parsed.ext}`);
  fs.copyFileSync(filePath, dest);
}

function srtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const total = Math.floor(totalMs / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function assTime(seconds) {
  const totalCs = Math.max(0, Math.round(seconds * 100));
  const cs = totalCs % 100;
  const total = Math.floor(totalCs / 100);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function ffPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
}

function escText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\r?\n/g, "\\n");
}

function drawText(text, x, y, size, color, extra = {}) {
  const font = extra.bold ? "C\\:/Windows/Fonts/msyhbd.ttc" : "C\\:/Windows/Fonts/msyh.ttc";
  const spacing = extra.spacing ? `:line_spacing=${extra.spacing}` : "";
  const box = extra.box ? `:box=1:boxcolor=${extra.box.color}:boxborderw=${extra.box.border || 16}` : "";
  const alpha = extra.alpha ? `:alpha='${extra.alpha}'` : "";
  return `drawtext=fontfile='${font}':text='${escText(text)}':fontcolor=${color}:fontsize=${size}:x=${x}:y=${y}${spacing}${box}${alpha}`;
}

function glowText(text, x, y, size, color = "0xFF9F2A") {
  const pulse = "0.86+0.14*sin(2*PI*t/1.35)";
  return [
    drawText(text, `${x}+5`, y + 5, size, "0xFF5A00@0.34", { bold: true, alpha: "0.55+0.45*sin(2*PI*t/1.35)" }),
    drawText(text, `${x}-4`, y - 3, size, "0xFFB347@0.18", { bold: true, alpha: "0.45+0.35*sin(2*PI*t/1.35)" }),
    drawText(text, x, y, size, color, { bold: true, alpha: pulse })
  ];
}

function breatheBox(x, y, w, h, color = "0xFF9A1F") {
  return [
    `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}@0.18:t=5:enable='lt(mod(t\\,1.45)\\,0.72)'`,
    `drawbox=x=${x + 10}:y=${y + 10}:w=${w - 20}:h=${h - 20}:color=${color}@0.10:t=3:enable='gte(mod(t\\,1.45)\\,0.72)'`
  ];
}

function sparkFilters() {
  const filters = [
    "format=yuv420p",
    "drawbox=x=0:y=0:w=1080:h=1920:color=0x03050A:t=fill",
    "noise=alls=3:allf=t+u",
    "vignette=PI/5"
  ];
  const colors = ["0xFF9A1F", "0xFF5AA5", "0x7DD3FC", "0xFFCA7A", "0xE5E7EB"];
  for (let i = 0; i < 58; i += 1) {
    const x = (83 + i * 173) % 1040;
    const baseY = (260 + i * 137) % 1920;
    const speed = 30 + (i % 8) * 13;
    const size = 2 + (i % 4);
    const alpha = (0.35 + (i % 5) * 0.10).toFixed(2);
    const color = colors[i % colors.length];
    filters.push(`drawbox=x=${x}:y='mod(${baseY}+1920-${speed}*t,1920)':w=${size}:h=${size}:color=${color}@${alpha}:t=fill`);
  }
  for (let i = 0; i < 18; i += 1) {
    const x = (46 + i * 251) % 1060;
    const baseY = (1720 + i * 211) % 1920;
    const speed = 105 + (i % 6) * 18;
    const h = 12 + (i % 5) * 5;
    filters.push(`drawbox=x=${x}:y='mod(${baseY}+1920-${speed}*t,1920)':w=3:h=${h}:color=0xFF8A1F@0.55:t=fill`);
  }
  return filters;
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

function hashText(text) {
  return crypto.createHash("sha1").update(text, "utf8").digest("hex").slice(0, 8);
}

function ensureToolScreenshot() {
  if (fs.existsSync(toolScreenshotSource)) {
    fs.copyFileSync(toolScreenshotSource, toolScreenshot);
  }
  if (!fs.existsSync(toolScreenshot)) {
    run(ffmpeg, [
      "-hide_banner", "-y",
      "-ss", "0",
      "-i", rawVideo,
      "-frames:v", "1",
      toolScreenshot
    ]);
  }
  return toolScreenshot;
}

function synthesizeToMp3(text, output, options = {}) {
  run(process.execPath, [
    nodeEdgeTtsBin,
    "-t", text,
    "-f", output,
    "-v", options.voice || voiceName,
    "-l", "zh-CN",
    "-o", "audio-24khz-96kbitrate-mono-mp3",
    "-r", options.rate || voiceRate,
    "--pitch", options.pitch || "default",
    "--volume", options.volume || "default",
    "--timeout", "20000"
  ]);
}

function makeProgressSubtitleFilter(assPath, totalDuration) {
  const duration = Number(totalDuration).toFixed(3);
  const barX = 78;
  const barY = 1842;
  const barW = 924;
  const segments = 60;
  const segmentW = barW / segments;
  const progressSegments = [];
  for (let i = 0; i < segments; i++) {
    const x = (barX + i * segmentW).toFixed(2);
    const w = Math.ceil(segmentW + 0.5);
    const at = (Number(duration) * i / segments).toFixed(3);
    progressSegments.push(
      `drawbox=x=${x}:y=${barY + 3}:w=${w}:h=3:color=0x7DD3FC@0.86:t=fill:enable='gte(t\\,${at})'`,
      `drawbox=x=${x}:y=${barY + 2}:w=${w}:h=3:color=0xFFB000@0.94:t=fill:enable='gte(t\\,${at})'`,
      `drawbox=x=${x}:y=${barY + 5}:w=${w}:h=2:color=0xFF4FA3@0.90:t=fill:enable='gte(t\\,${at})'`
    );
  }
  return [
    `drawbox=x=${barX}:y=${barY}:w=${barW}:h=9:color=0x05070C@0.70:t=fill`,
    `drawbox=x=${barX}:y=${barY + 3}:w=${barW}:h=3:color=0x475569@0.52:t=fill`,
    ...progressSegments,
    `subtitles='${ffPath(assPath)}'`
  ].join(",");
}

function makeBackgroundMusic(totalDuration) {
  const output = path.join(bgmDir, "spark_pulse_bgm.wav");
  const duration = Number(totalDuration).toFixed(3);
  const fadeOutStart = Math.max(0, Number(totalDuration) - 2.2).toFixed(3);
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "lavfi", "-t", duration, "-i", "sine=frequency=55:sample_rate=44100",
    "-f", "lavfi", "-t", duration, "-i", "sine=frequency=110:sample_rate=44100",
    "-f", "lavfi", "-t", duration, "-i", "sine=frequency=440:sample_rate=44100",
    "-f", "lavfi", "-t", duration, "-i", "sine=frequency=880:sample_rate=44100",
    "-f", "lavfi", "-t", duration, "-i", "anoisesrc=color=pink:sample_rate=44100:amplitude=0.018",
    "-filter_complex",
    [
      "[0:a]volume=0.55,lowpass=f=130[bass]",
      "[1:a]volume=0.38,tremolo=f=2.00:d=0.45,lowpass=f=380[mid]",
      "[2:a]volume=0.30,tremolo=f=2.00:d=0.82,highpass=f=220,lowpass=f=1800[pulse]",
      "[3:a]volume=0.16,tremolo=f=4.00:d=0.70,highpass=f=520,lowpass=f=3200[shine]",
      `[4:a]volume=0.08,lowpass=f=1100,afade=t=in:st=0:d=2.0,afade=t=out:st=${fadeOutStart}:d=2.0[noise]`,
      "[bass][mid][pulse][shine][noise]amix=inputs=5:duration=first:dropout_transition=0:normalize=0,acompressor=threshold=-22dB:ratio=1.6:attack=18:release=220,alimiter=limit=0.72[bgm]"
    ].join(";"),
    "-map", "[bgm]",
    "-ac", "2",
    "-ar", "44100",
    output
  ]);
  writeFile(path.join(bgmDir, "README_bgm.txt"), `原创低音量电子氛围底乐：参考 ${musicReferenceVideo} 的短视频节奏、底部播放器感和明亮脉冲氛围重新生成，不直接使用样例里混有人声的音轨。最终混音中保持低音量，不盖过口播。\n`);
  return output;
}

const oldTimeline = [
  {
    type: "card",
    name: "01_hook_spark",
    duration: 4.0,
    voice: "有了这个智能工具，我股票和基金都赚麻了？先别急，这不是荐股，是一屏看懂行情重点。",
    display: "有了这个智能工具，\\N股票基金都赚麻了？"
  },
  {
    type: "card",
    name: "02_smooth_intro",
    duration: 3.2,
    voice: "想知道这个工具的效果到底啥样？请耐心看完接下来的真实操作。",
    display: "想知道效果到底啥样？\\N请耐心看完接下来的操作。"
  },
  {
    type: "screen",
    name: "03_today_advice",
    duration: 5.2,
    rawStart: 0,
    title: "真实录屏：今日涨跌建议",
    note: "先给方向，再给风险",
    crop: { x: 70, y: 112, w: 1180, h: 650 },
    highlight: { x: 68, y: 110, w: 1800, h: 325 },
    voice: "鼠标先停在今日涨跌建议附近。这里不是堆数据，而是先给方向，再把风险写成短结论。",
    display: "鼠标先停在今日涨跌建议。\\N先给方向，再把风险写成短结论。"
  },
  {
    type: "screen",
    name: "04_sector_heat",
    duration: 4.8,
    rawStart: 9.6,
    title: "真实录屏：板块热度",
    note: "左边先看上涨方向",
    crop: { x: 62, y: 278, w: 940, h: 690 },
    highlight: { x: 62, y: 274, w: 1030, h: 690 },
    voice: "往下滚动后，鼠标指到左侧板块热度。上涨方向、趋势线、涨幅，全在这一列。",
    display: "往下滚动到板块热度。\\N上涨方向、趋势线、涨幅，全在这一列。"
  },
  {
    type: "screen",
    name: "05_fund_ranking",
    duration: 4.8,
    rawStart: 12.5,
    title: "真实录屏：基金排行",
    note: "右边对照基金趋势",
    crop: { x: 985, y: 278, w: 865, h: 690 },
    highlight: { x: 1035, y: 274, w: 805, h: 690 },
    voice: "镜头转到右边，基金排行也同步摆出来。基金名称、趋势线和涨跌幅，不用再单独开页面查。",
    display: "镜头转到右边看基金排行。\\N名称、趋势线和涨跌幅都摆出来。"
  },
  {
    type: "screen",
    name: "06_downside",
    duration: 5.2,
    rawStart: 17.4,
    title: "真实录屏：下跌榜对比",
    note: "风险方向同屏看",
    crop: { x: 62, y: 278, w: 940, h: 700 },
    highlight: { x: 62, y: 274, w: 1030, h: 700 },
    voice: "再切到下跌榜。绿色趋势线往下走的方向，会和右边基金排行放在同一屏对比。",
    display: "再切到下跌榜。\\N下跌方向和右边基金排行同屏对比。"
  },
  {
    type: "screen",
    name: "07_switch_agent",
    duration: 6.0,
    rawStart: 24,
    title: "真实录屏：切换板块",
    note: "鼠标选择后重新分析",
    crop: { x: 62, y: 150, w: 720, h: 760 },
    highlight: { x: 62, y: 150, w: 455, h: 640 },
    voice: "鼠标这里打开板块选择，换到半导体之后，Agent 会按这个方向重新跑一遍分析。",
    display: "鼠标打开板块选择，切到半导体。\\NAgent 会按这个方向重新分析。"
  },
  {
    type: "screen",
    name: "08_agent_summary",
    duration: 7.5,
    rawStart: 30.5,
    title: "真实录屏：Agent 总结",
    note: "风险、关注点、结论写成人话",
    crop: { x: 70, y: 165, w: 1320, h: 730 },
    highlight: { x: 70, y: 160, w: 1765, h: 625 },
    voice: "切完之后，看这个高位谨慎总结。它把涨幅、风险因素、基金建议都整理成人话，少看好几张表。",
    display: "切完之后看 Agent 总结。\\N涨幅、风险因素、基金建议都整理成人话。"
  },
  {
    type: "card",
    name: "09_result",
    duration: 4.8,
    voice: "所以它真正解决的不是预测涨跌，而是把分散的信息集中到一屏。想要完整工具生成提示词，评论区留言获取。",
    display: "它不是预测涨跌，\\N而是把行情重点集中到一屏。"
  },
  {
    type: "ending",
    name: "10_like_ending",
    duration: 1.2,
    voice: "留言拿提示词。",
    display: null
  }
];

const timeline = [
  {
    type: "card",
    name: "01_hook_spark",
    duration: 14.0,
    voice: "先说结论啊，这个工具不是帮你预测涨跌的。它真正有用的地方，是把股票、基金、板块这些分散的信息，放到一屏里，让你不用一直切手机，也能先看个大概。",
    display: "这个工具不是预测涨跌，\\N而是把行情重点放到一屏。"
  },
  {
    type: "card",
    name: "02_smooth_intro",
    duration: 8.8,
    voice: "接下来我就不讲太多概念了，直接看真实操作。你可以留意一下，鼠标点到哪里，我就讲哪里。",
    display: "接下来直接看真实操作。\\N鼠标点到哪里，我就讲哪里。"
  },
  {
    type: "screen",
    name: "03_today_advice",
    duration: 11.5,
    rawStart: 0,
    title: "真实录屏：今日涨跌建议",
    note: "先看方向，再看风险",
    crop: { x: 70, y: 112, w: 1180, h: 650 },
    highlight: { x: 68, y: 110, w: 1800, h: 325 },
    voice: "这里鼠标先停在今日涨跌建议。你看，它不是把一堆数据丢给你，而是先把方向说出来，然后再把风险压成几句短结论。",
    display: "鼠标先停在今日涨跌建议。\\N先看方向，再看风险结论。"
  },
  {
    type: "screen",
    name: "04_sector_heat",
    duration: 13.2,
    rawStart: 9.6,
    title: "真实录屏：板块热度",
    note: "左边先看上涨方向",
    crop: { x: 62, y: 278, w: 940, h: 690 },
    highlight: { x: 62, y: 274, w: 1030, h: 690 },
    voice: "往下滚动之后，鼠标来到左边的板块热度。这里重点看三个东西：上涨方向、趋势线，还有涨幅。扫一眼就能知道今天哪些方向比较热。",
    display: "往下滚动到板块热度。\\N上涨方向、趋势线、涨幅，放在一起看。"
  },
  {
    type: "screen",
    name: "05_fund_ranking",
    duration: 10.5,
    rawStart: 12.5,
    title: "真实录屏：基金排行",
    note: "右边对照基金趋势",
    crop: { x: 985, y: 278, w: 865, h: 690 },
    highlight: { x: 1035, y: 274, w: 805, h: 690 },
    voice: "然后镜头看右边，这里是基金排行。基金名称、趋势线、涨跌幅都放在同一块，不用你再开好几个页面来回对。",
    display: "右边是基金排行。\\N名称、趋势线、涨跌幅都在同一块。"
  },
  {
    type: "screen",
    name: "06_downside",
    duration: 9.0,
    rawStart: 17.4,
    title: "真实录屏：下跌榜对比",
    note: "风险方向同屏看",
    crop: { x: 62, y: 278, w: 940, h: 700 },
    highlight: { x: 62, y: 274, w: 1030, h: 700 },
    voice: "接着再切到下跌榜。这个地方主要是看风险，哪些方向在往下走，再和右边基金排行放在一起对比。",
    display: "再切到下跌榜。\\N下跌方向和基金排行同屏对比。"
  },
  {
    type: "screen",
    name: "07_switch_agent",
    duration: 11.2,
    rawStart: 24,
    title: "真实录屏：切换板块",
    note: "选中后重新分析",
    crop: { x: 62, y: 150, w: 720, h: 760 },
    highlight: { x: 62, y: 150, w: 455, h: 640 },
    voice: "这里鼠标打开板块选择。比如我切到半导体，它就会按这个方向重新分析一遍，相当于你换一个关注点，它马上跟着重新整理。",
    display: "鼠标打开板块选择，切到半导体。\\N关注点一换，Agent 跟着重新分析。"
  },
  {
    type: "screen",
    name: "08_agent_summary",
    duration: 13.6,
    rawStart: 30.5,
    title: "真实录屏：Agent 总结",
    note: "把风险和关注点写成人话",
    crop: { x: 70, y: 165, w: 1320, h: 730 },
    highlight: { x: 70, y: 160, w: 1765, h: 625 },
    voice: "切完之后，看这个 Agent 总结。它会把涨幅、风险因素、基金建议这些内容整理成人话。对我来说，最省时间的就是这一步，少看很多张表。",
    display: "最后看 Agent 总结。\\N风险、涨幅、基金建议，整理成人话。"
  },
  {
    type: "card",
    name: "09_result",
    duration: 12.8,
    voice: "所以它解决的不是让你买哪只，也不是承诺涨跌。而是把分散的行情信息整理清楚。最后你只需要看重点、看风险，再决定要不要继续研究。",
    display: "它不是承诺涨跌，\\N而是把行情信息整理清楚。"
  },
  {
    type: "card",
    name: "10_final_cta",
    duration: 5.8,
    voice: "要是觉得这个工具不错，欢迎大家评论区留言。",
    display: "感谢大家支持，\\N多多点赞收藏加关注吧！"
  }
];

function assignStarts() {
  let cursor = 0;
  for (const item of timeline) {
    item.start = Number(cursor.toFixed(3));
    item.end = Number((cursor + item.duration).toFixed(3));
    cursor += item.duration;
  }
  return Number(cursor.toFixed(3));
}

function hookCardFilters(cover = false) {
  return [
    ...sparkFilters(),
    drawText("牛一样的程序猿", 790, 38, 24, "0x6B7280", { bold: true }),
    "drawbox=x=146:y=286:w=788:h=62:color=0xFF8A1F:t=fill",
    "drawbox=x=702:y=286:w=232:h=62:color=0xFF4FA3:t=fill",
    drawText("AI工具实测 · 股票基金一屏看懂", "(w-text_w)/2", 301, 28, "0x080B12", { bold: true }),
    ...glowText("有了这个智能工具", "(w-text_w)/2", 462, 76),
    ...glowText("股票基金", "(w-text_w)/2", 586, 112),
    ...glowText("赚麻了?", "(w-text_w)/2", 726, 122, "0xFFB347"),
    ...glowText("不是荐股 · 是把行情重点一屏看清", "(w-text_w)/2", 936, 34, "0xFFB347"),
    ...breatheBox(70, 1048, 940, 456, "0xFF9A1F"),
    "drawbox=x=82:y=1060:w=916:h=432:color=0x060A13@0.92:t=fill",
    "drawbox=x=82:y=1060:w=916:h=432:color=0xFF9A1F@0.96:t=3",
    "drawbox=x=92:y=1070:w=896:h=412:color=0xF8FAFC@1:t=fill",
    drawText("工具演示，不构成投资建议", "(w-text_w)/2", 1708, 24, "0x6B7280")
  ];
}

function hookCardCompositeFilter(cover = false) {
  return [
    `[0:v]${hookCardFilters(cover).join(",")}[bg]`,
    "[1:v]scale=896:412:force_original_aspect_ratio=decrease:flags=lanczos,pad=896:412:(ow-iw)/2:(oh-ih)/2:color=0xF8FAFC,unsharp=5:5:0.55[shot]",
    "[bg][shot]overlay=92:1070[v]"
  ].join(";");
}

function introCardFilters() {
  return [
    ...sparkFilters(),
    drawText("真实操作来了", "(w-text_w)/2", 286, 34, "0xFFB347", { bold: true }),
    ...glowText("想知道效果", "(w-text_w)/2", 496, 90),
    ...glowText("到底啥样?", "(w-text_w)/2", 620, 98, "0xFFB347"),
    "drawbox=x=150:y=820:w=780:h=74:color=0x000000@0.82:t=fill",
    drawText("请耐心看完接下来的真实操作", "(w-text_w)/2", 840, 34, "0xFFFFFF", { bold: true }),
    "drawbox=x=150:y=1016:w=780:h=78:color=0x111827@0.84:t=fill",
    "drawbox=x=150:y=1120:w=780:h=78:color=0x111827@0.84:t=fill",
    "drawbox=x=150:y=1224:w=780:h=78:color=0x111827@0.84:t=fill",
    "drawbox=x=182:y=1038:w=36:h=36:color=0xFF8A1F:t=fill",
    "drawbox=x=182:y=1142:w=36:h=36:color=0xFF8A1F:t=fill",
    "drawbox=x=182:y=1246:w=36:h=36:color=0xFF8A1F:t=fill",
    drawText("1", 194, 1042, 22, "0x080B12", { bold: true }),
    drawText("2", 194, 1146, 22, "0x080B12", { bold: true }),
    drawText("3", 194, 1250, 22, "0x080B12", { bold: true }),
    drawText("先看今日建议", 244, 1035, 29, "0xE5E7EB", { bold: true }),
    drawText("再看板块和基金排行", 244, 1139, 29, "0xE5E7EB", { bold: true }),
    drawText("最后看 Agent 总结", 244, 1243, 29, "0xE5E7EB", { bold: true }),
    drawText("工具演示，不构成投资建议", "(w-text_w)/2", 1708, 24, "0x6B7280")
  ];
}

function resultCardFilters() {
  return [
    ...sparkFilters(),
    drawText("最后说清楚", "(w-text_w)/2", 286, 34, "0xFFB347", { bold: true }),
    ...glowText("它解决的", "(w-text_w)/2", 486, 90),
    ...glowText("不是预测涨跌", "(w-text_w)/2", 610, 86, "0xFFB347"),
    "drawbox=x=118:y=828:w=844:h=90:color=0x111827@0.86:t=fill",
    "drawbox=x=118:y=946:w=844:h=90:color=0x111827@0.86:t=fill",
    drawText("把行情重点集中到一屏", 162, 850, 34, "0xFFFFFF", { bold: true }),
    drawText("看重点、看风险，再决定要不要继续研究", 162, 968, 30, "0xFFB347", { bold: true }),
    "drawbox=x=190:y=1330:w=700:h=78:color=0x000000@0.88:t=fill",
    drawText("仅作工具演示，不构成投资建议", "(w-text_w)/2", 1352, 27, "0xCBD5E1", { bold: true })
  ];
}

function finalCtaCardFilters() {
  return [
    ...sparkFilters(),
    drawText("感谢大家支持", "(w-text_w)/2", 330, 38, "0xFFB347", { bold: true }),
    ...glowText("多多点赞", "(w-text_w)/2", 520, 94),
    ...glowText("收藏加关注吧!", "(w-text_w)/2", 662, 86, "0xFFB347"),
    "drawbox=x=128:y=920:w=824:h=92:color=0x111827@0.88:t=fill",
    "drawbox=x=128:y=1040:w=824:h=92:color=0x111827@0.88:t=fill",
    drawText("评论区留言交流", 178, 944, 34, "0xFFFFFF", { bold: true }),
    drawText("点赞  ·  收藏  ·  关注", 178, 1064, 34, "0xFFB347", { bold: true }),
    "drawbox=x=250:y=1354:w=580:h=74:color=0x000000@0.78:t=fill",
    drawText("牛一样的程序猿", "(w-text_w)/2", 1375, 28, "0xCBD5E1", { bold: true })
  ];
}

function makeCoverImage() {
  const coverAsset = path.join(refinedDir, "cover_spark_style.jpg");
  const shot = ensureToolScreenshot();
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "lavfi", "-t", "1", "-i", "color=c=0x03050A:s=1080x1920:r=30",
    "-loop", "1", "-t", "1", "-i", shot,
    "-filter_complex", hookCardCompositeFilter(true),
    "-map", "[v]",
    "-frames:v", "1",
    "-q:v", "2",
    coverAsset
  ]);
  fs.copyFileSync(coverAsset, path.join(episodeDir, "cover.jpg"));
  return coverAsset;
}

function makeCardClip(item, index) {
  const output = path.join(clipsDir, `${String(index + 1).padStart(2, "0")}_${item.name}.mp4`);
  if (item.name === "01_hook_spark") {
    const shot = ensureToolScreenshot();
    run(ffmpeg, [
      "-hide_banner", "-y",
      "-f", "lavfi", "-t", String(item.duration), "-i", "color=c=0x03050A:s=1080x1920:r=30",
      "-loop", "1", "-t", String(item.duration), "-i", shot,
      "-f", "lavfi", "-t", String(item.duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-filter_complex", hookCardCompositeFilter(false),
      "-map", "[v]", "-map", "2:a",
      "-r", "30",
      "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k",
      "-shortest",
      output
    ]);
    return output;
  }

  const filters = item.name === "01_hook_spark"
    ? hookCardFilters(false)
    : item.name === "02_smooth_intro"
      ? introCardFilters()
      : item.name === "10_final_cta"
        ? finalCtaCardFilters()
        : resultCardFilters();

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "lavfi", "-t", String(item.duration), "-i", "color=c=0x03050A:s=1080x1920:r=30",
    "-f", "lavfi", "-t", String(item.duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-vf", filters.join(","),
    "-map", "0:v", "-map", "1:a",
    "-r", "30",
    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest",
    output
  ]);
  return output;
}

function scaledBox(box) {
  const s = 1000 / 1908;
  return {
    x: Math.round(box.x * s),
    y: Math.round(box.y * s),
    w: Math.round(box.w * s),
    h: Math.round(box.h * s)
  };
}

function makeScreenClip(item, index) {
  const output = path.join(clipsDir, `${String(index + 1).padStart(2, "0")}_${item.name}.mp4`);
  const hi = scaledBox(item.highlight);
  const c = item.crop;
  const bgFilters = [
    ...sparkFilters(),
    "drawbox=x=54:y=54:w=972:h=174:color=0x090D18@0.90:t=fill",
    "drawbox=x=54:y=54:w=972:h=8:color=0xFF8A1F:t=fill",
    "drawbox=x=54:y=220:w=972:h=2:color=0x334155@0.90:t=fill",
    drawText(item.title, 84, 92, 38, "0xFFF7ED", { bold: true }),
    drawText(item.note, 86, 154, 25, "0xCBD5E1"),
    "drawbox=x=40:y=250:w=1000:h=590:color=0x060A13@0.92:t=fill",
    "drawbox=x=40:y=250:w=1000:h=590:color=0xFF8A1F@0.82:t=2",
    "drawbox=x=40:y=880:w=1000:h=620:color=0x060A13@0.94:t=fill",
    "drawbox=x=40:y=880:w=1000:h=620:color=0x2563EB@0.82:t=2",
    "drawbox=x=60:y=912:w=160:h=44:color=0xFF8A1F:t=fill",
    drawText("放大看这里", 82, 921, 22, "0x080B12", { bold: true }),
    drawText("工具演示，不构成投资建议", 72, 1518, 22, "0x64748B")
  ];

  const filter = [
    "[0:v]fps=30,split=2[fullsrc][zoomsrc]",
    `[fullsrc]scale=1000:-1:flags=lanczos,unsharp=5:5:0.35,drawbox=x=${hi.x}:y=${hi.y}:w=${hi.w}:h=${hi.h}:color=0xFF8A1F@0.95:t=5[full]`,
    `[zoomsrc]crop=${c.w}:${c.h}:${c.x}:${c.y},scale=960:520:force_original_aspect_ratio=decrease:flags=lanczos,pad=960:520:(ow-iw)/2:(oh-ih)/2:color=0x060A13,unsharp=5:5:0.70[zoom]`,
    `[1:v]${bgFilters.join(",")}[bg]`,
    "[bg][full]overlay=40:262[tmp1]",
    "[tmp1][zoom]overlay=60:962[v]"
  ].join(";");

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-ss", String(item.rawStart),
    "-t", String(item.duration),
    "-i", rawVideo,
    "-f", "lavfi", "-t", String(item.duration), "-i", "color=c=0x03050A:s=1080x1920:r=30",
    "-f", "lavfi", "-t", String(item.duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex", filter,
    "-map", "[v]", "-map", "2:a",
    "-r", "30",
    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest",
    output
  ]);
  return output;
}

function makeEndingClip(item, index) {
  const output = path.join(clipsDir, `${String(index + 1).padStart(2, "0")}_${item.name}.mp4`);
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", endingTemplate,
    "-f", "lavfi", "-t", String(item.duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex",
    "[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,unsharp=5:5:0.65,setsar=1,format=yuv420p[v]",
    "-map", "[v]", "-map", "1:a",
    "-t", String(item.duration),
    "-r", "30",
    "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest",
    output
  ]);
  return output;
}

function stripCaptionEnding(text) {
  return String(text).trim().replace(/[。！？!?；;，,、：:]+$/u, "");
}

function stripCaptionEdges(text) {
  return stripCaptionEnding(String(text).trim().replace(/^[。！？!?；;，,、：:]+/u, ""));
}

function splitLongCaption(text, maxChars = 24) {
  const clean = stripCaptionEdges(text);
  if (!clean) return [];
  const chars = Array.from(clean);
  if (chars.length <= maxChars) return [clean];

  const chunks = [];
  for (let start = 0; start < chars.length; start += maxChars) {
    chunks.push(stripCaptionEdges(chars.slice(start, start + maxChars).join("")));
  }
  return chunks.filter(Boolean);
}

function wrapCaption(text, maxLineChars = 14) {
  const clean = stripCaptionEdges(text);
  const chars = Array.from(clean);
  if (chars.length <= maxLineChars) return clean;

  const splitAt = Math.ceil(chars.length / 2);
  const first = stripCaptionEdges(chars.slice(0, splitAt).join(""));
  const second = stripCaptionEdges(chars.slice(splitAt).join(""));
  return [first, second].filter(Boolean).join("\\N");
}

function voiceCaptionPieces(item) {
  const clauses = item.voice.match(/[^。！？!?；;]+[。！？!?；;]?/gu) || [item.voice];
  return clauses.flatMap(clause => splitLongCaption(clause));
}

function subtitleEvents() {
  const events = [];
  for (const item of timeline) {
    const pieces = voiceCaptionPieces(item);
    if (!pieces.length) continue;

    const weights = pieces.map(piece => Math.max(6, Array.from(piece).length));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = item.start;

    pieces.forEach((piece, index) => {
      const end = index === pieces.length - 1
        ? item.end
        : Number((cursor + item.duration * weights[index] / totalWeight).toFixed(3));
      events.push({
        start: cursor,
        end,
        text: wrapCaption(piece)
      });
      cursor = end;
    });
  }
  return events;
}

function writeSubtitles() {
  const events = subtitleEvents();
  const srt = events.map((event, index) => {
    return `${index + 1}\n${srtTime(event.start)} --> ${srtTime(event.end)}\n${event.text.replace(/\\N/g, "\n")}\n`;
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
    "Style: Default,Microsoft YaHei,43,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,1,0,0,0,100,100,0,0,3,2,0,2,70,70,245,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events.map(event => `Dialogue: 0,${assTime(event.start)},${assTime(event.end)},Default,,0,0,0,,${event.text}`)
  ].join("\n");
  const assPath = path.join(dataDir, "refined_spark_style_subtitles.ass");
  writeFile(assPath, ass);
  return assPath;
}

function buildVoiceover() {
  const voiceSegments = timeline.map((item, index) => {
    const key = hashText(`${voiceRate}|${item.duration}|${item.voice}`);
    return {
      ...item,
      index,
      raw: path.join(workAudioDir, `spark_raw_${String(index + 1).padStart(2, "0")}_${key}.mp3`),
      fit: path.join(workAudioDir, `spark_fit_${String(index + 1).padStart(2, "0")}_${key}.wav`)
    };
  });

  for (const seg of voiceSegments) {
    console.log(`Synth ${seg.index + 1}/${voiceSegments.length}: ${seg.voice}`);
    if (!fs.existsSync(seg.raw) || fs.statSync(seg.raw).size === 0) {
      synthesizeToMp3(seg.voice, seg.raw, { rate: voiceRate });
    } else {
      console.log(`Reusing ${seg.raw}`);
    }
  }

  for (const seg of voiceSegments) {
    const rawDuration = duration(seg.raw);
    const target = Math.max(0.25, seg.duration);
    const usable = Math.max(0.2, target - 0.12);
    const filters = ["aresample=44100"];
    if (rawDuration > usable) {
      filters.push(atempoChain(rawDuration / usable));
    }
    filters.push("apad");
    filters.push("acompressor=threshold=-18dB:ratio=2.4:attack=6:release=110");
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

  const concat = path.join(workAudioDir, "spark_voice_concat.txt");
  writeFile(concat, voiceSegments.map(seg => `file '${seg.fit.replace(/\\/g, "/")}'`).join("\n"));
  const voiceWav = path.join(workAudioDir, "voiceover_spark_aligned.wav");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat,
    "-c", "copy",
    voiceWav
  ]);
  fs.copyFileSync(voiceWav, path.join(audioDir, "voiceover_spark_aligned.wav"));
  writeFile(path.join(audioDir, "README_voiceover.txt"), `当前音轨：${voiceName} 临时 TTS，可替换。\n规则：无用户真人录音时，仅作为临时配音；后续提供真人录音后应替换为真人声。\n本版处理：按录屏鼠标、模块和字幕节奏重写口播；转入录屏前的引导只出现在视频/字幕，不写入发布文案。\n`);
  return voiceWav;
}

function writeTextDeliverables(totalDuration) {
  const voiceover = timeline.map((item, index) => `${index + 1}. ${item.voice}`).join("\n\n")
    + "\n\n说明：当前配音为 Edge 神经语音生成的可替换临时 TTS；如果提供真人录音，应以真人声作为主配音。\n";
  writeFile(path.join(episodeDir, "voiceover_script.txt"), voiceover);

  const shotList = timeline.map((item, index) => {
    const label = `${srtTime(item.start)} - ${srtTime(item.end)}`.replace(/,/g, ".");
    if (item.type === "screen") {
      return `${index + 1}. ${label} ${item.title}：${item.note}。画面为暗色星火背景 + 全局录屏 + 局部放大，橙色框跟随当前讲解模块。`;
    }
    if (item.type === "ending") {
      return `${index + 1}. ${label} LIKE 结尾：完整使用 skill 原始 LIKE 片段，等比缩放完整适配竖屏，不裁切边缘。`;
    }
    if (item.name === "02_smooth_intro") {
      return `${index + 1}. ${label} 转场口播图卡：只在视频和字幕里做圆滑引导，不进入发布文案。`;
    }
    if (item.name === "10_final_cta") {
      return `${index + 1}. ${label} 结尾 CTA 图卡：补回结束语口播，画面显示点赞、收藏、关注引导文案。`;
    }
    return `${index + 1}. ${label} 图卡：暗色星火背景，高对比橙色发光标题。`;
  }).join("\n");

  writeFile(path.join(episodeDir, "video_script.md"), `# 视频脚本：一屏看清股票基金行情工具\n\n账号：牛一样的程序猿\n主题：再也不用偷偷看手机分析股市基金行情了，用这个工具一目了然。\n成片时长：约 ${totalDuration.toFixed(1)} 秒。\n\n## 本版修改重点\n- 封面、首帧和标题统一为暗色星火粒子风格，强化痛点钩子：有了这个智能工具，股票基金都赚麻了？\n- 录屏前新增圆滑口播转场：想知道这个工具的效果到底啥样？请耐心看完接下来的真实操作。\n- 转场引导只体现在视频和字幕中，不写入发布文案。\n- 录屏段保持全局画面可见，同时用局部放大和橙色框跟随鼠标/模块节奏。\n- 结尾补回自然结束语口播，画面文案引导点赞、收藏、关注。\n- 按用户最新要求删除背景音乐，最终音频只保留口播。\n\n## 分镜\n${shotList}\n\n## 风险说明\n本期仅演示工具与信息组织方式，不构成任何投资建议。\n`);

  writeFile(path.join(episodeDir, "publish_copy.md"), `# 发布文案\n\n## 抖音\n标题：有了这个智能工具，股票基金终于一屏看懂了\n\n文案：\n上班想看行情，但又不想一直切手机？\n这个工具把今日建议、板块热度、基金排行和 Agent 总结放到一屏里，重点直接拎出来。\n仅作工具演示，不构成投资建议。\n\n#AI工具 #股票基金 #效率工具 #程序员 #行情分析\n\nCTA：评论区留言，获取完整工具生成提示词。\n\n## 小红书\n标题：一个适合上班族看的股票基金行情看板工具\n\n正文：\n这期实测的是一个股票/基金行情看板思路：\n1. 先看今日涨跌建议和风险提示\n2. 再看板块热度、涨跌榜、基金排行\n3. 最后用 Agent 把风险因素和关注点整理成人话\n\n适合想快速扫一眼行情重点的人。仅作工具演示，不构成投资建议。\n\n#AI工具 #基金工具 #股票看板 #效率软件 #程序员日常 #AI实测 #工作流\n\nCTA：需要完整生成提示词，可以评论区留言。\n`);

  const renderData = timeline.map(({ type, name, start, end, duration, voice, display, rawStart, crop, highlight }) => ({
    type, name, start, end, duration, voice, display, rawStart, crop, highlight
  }));
  writeFile(path.join(dataDir, "refined_spark_style_timeline.json"), JSON.stringify(renderData, null, 2));
}

function writeSlowRevisionNotes(totalDuration) {
  const shotList = timeline.map((item, index) => {
    const label = `${srtTime(item.start)} - ${srtTime(item.end)}`.replace(/,/g, ".");
    if (item.type === "screen") {
      return `${index + 1}. ${label} ${item.title}：${item.note}。画面保留全局录屏和局部放大；放大区标题只保留“放大看这里”，删除后方说明文字。`;
    }
    if (item.name === "02_smooth_intro") {
      return `${index + 1}. ${label} 转场图卡：用口语化引导自然转入真实操作。`;
    }
    return `${index + 1}. ${label} 图卡：暗色星火背景，高对比标题，口播慢速讲完。`;
  }).join("\n");

  writeFile(path.join(episodeDir, "video_script.md"), `# 视频脚本：一屏看清股票基金行情工具

账号：牛一样的程序猿
主题：再也不用偷偷看手机分析股市基金行情了，用这个工具一目了然。
成片时长：约 ${totalDuration.toFixed(1)} 秒。

## 本版修改重点
- 录屏讲解阶段删除“放大看这里”后面的说明文字，只保留标签本身。
- 按要求剪掉 LIKE 结尾，补回独立结尾 CTA 图卡和结束语口播。
- 结尾口播：要是觉得这个工具不错，欢迎大家评论区留言。
- 结尾文案：感谢大家支持，多多点赞收藏加关注吧！
- 按用户最新要求删除背景音乐，最终成片只保留口播音轨。
- 底部彩色进度条改为随时间逐步点亮，到结尾才满。
- 录屏段继续保留全局画面 + 局部放大 + 当前模块框选，口播跟随鼠标和模块变化。

## 分镜
${shotList}

## 风险说明
本期仅演示工具与信息组织方式，不构成任何投资建议。
`);

  writeFile(path.join(episodeDir, "publish_copy.md"), `# 发布文案

## 抖音
标题：有了这个智能工具，股票基金终于一屏看懂了

文案：
上班想看行情，但又不想一直切手机？
这个工具把今日建议、板块热度、基金排行和 Agent 总结放到一屏里，重点直接拎出来。
仅作工具演示，不构成投资建议。

#AI工具 #股票基金 #效率工具 #程序员 #行情分析

CTA：评论区留言，获取完整工具生成提示词。

## 小红书
标题：一个适合上班族看的股票基金行情看板工具

正文：
这期实测的是一个股票/基金行情看板思路：
1. 先看今日涨跌建议和风险提示
2. 再看板块热度、涨跌榜、基金排行
3. 最后用 Agent 把风险因素和关注点整理成人话

适合想快速扫一眼行情重点的人。仅作工具演示，不构成投资建议。

#AI工具 #基金工具 #股票看板 #效率软件 #程序员日常 #AI实测 #工作流

CTA：需要完整生成提示词，可以评论区留言。
`);
}

function render() {
  if (!fs.existsSync(rawVideo)) throw new Error(`Missing raw video: ${rawVideo}`);
  if (!fs.existsSync(endingTemplate)) throw new Error(`Missing ending template: ${endingTemplate}`);

  const totalDuration = assignStarts();
  const assPath = writeSubtitles();
  writeTextDeliverables(totalDuration);
  writeSlowRevisionNotes(totalDuration);

  backupIfExists(path.join(episodeDir, "cover.jpg"), "before_spark_style");
  backupIfExists(path.join(episodeDir, "douyin_publish.mp4"), "before_spark_style");
  backupIfExists(path.join(episodeDir, "xiaohongshu_publish.mp4"), "before_spark_style");
  makeCoverImage();

  const clips = timeline.map((item, index) => {
    if (item.type === "card") return makeCardClip(item, index);
    if (item.type === "screen") return makeScreenClip(item, index);
    if (item.type === "ending") return makeEndingClip(item, index);
    throw new Error(`Unknown segment type: ${item.type}`);
  });

  const concatFile = path.join(refinedDir, "concat_spark_style.txt");
  writeFile(concatFile, clips.map(file => `file '${file.replace(/\\/g, "/")}'`).join("\n"));
  const baseVideo = path.join(refinedDir, "base_spark_no_voice.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    baseVideo
  ]);

  const voiceWav = buildVoiceover();
  writeFile(path.join(bgmDir, "README_bgm.txt"), "本版已按用户要求删除背景音乐，最终成片只保留口播音轨。\n");
  const refinedTemp = path.join(refinedDir, "publish_spark_style_tmp.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", baseVideo,
    "-i", voiceWav,
    "-filter_complex",
    [
      `[0:v]${makeProgressSubtitleFilter(assPath, totalDuration)}[v]`,
      "[1:a]volume=5.5dB,acompressor=threshold=-18dB:ratio=2.2:attack=6:release=110,alimiter=limit=0.95[a]"
    ].join(";"),
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-crf", "16",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    "-movflags", "+faststart",
    refinedTemp
  ]);

  fs.copyFileSync(refinedTemp, path.join(episodeDir, "douyin_publish.mp4"));
  fs.copyFileSync(refinedTemp, path.join(episodeDir, "xiaohongshu_publish.mp4"));
  console.log(`\nSpark style version done: ${totalDuration.toFixed(1)}s`);
}

function renderFinalOnly() {
  const totalDuration = assignStarts();
  const assPath = writeSubtitles();
  writeTextDeliverables(totalDuration);
  writeSlowRevisionNotes(totalDuration);

  const finalIndex = timeline.length - 1;
  makeCardClip(timeline[finalIndex], finalIndex);

  const clips = timeline.map((item, index) => path.join(clipsDir, `${String(index + 1).padStart(2, "0")}_${item.name}.mp4`));
  for (const clip of clips) {
    if (!fs.existsSync(clip)) throw new Error(`Missing existing clip for final-only render: ${clip}`);
  }

  const concatFile = path.join(refinedDir, "concat_spark_style.txt");
  writeFile(concatFile, clips.map(file => `file '${file.replace(/\\/g, "/")}'`).join("\n"));
  const baseVideo = path.join(refinedDir, "base_spark_no_voice.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    baseVideo
  ]);

  const voiceWav = buildVoiceover();
  writeFile(path.join(bgmDir, "README_bgm.txt"), "本版已按用户要求删除背景音乐，最终成片只保留口播音轨。\n");
  const refinedTemp = path.join(refinedDir, "publish_spark_style_tmp.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", baseVideo,
    "-i", voiceWav,
    "-filter_complex",
    [
      `[0:v]${makeProgressSubtitleFilter(assPath, totalDuration)}[v]`,
      "[1:a]volume=5.5dB,acompressor=threshold=-18dB:ratio=2.2:attack=6:release=110,alimiter=limit=0.95[a]"
    ].join(";"),
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-crf", "16",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    "-movflags", "+faststart",
    refinedTemp
  ]);

  fs.copyFileSync(refinedTemp, path.join(episodeDir, "douyin_publish.mp4"));
  fs.copyFileSync(refinedTemp, path.join(episodeDir, "xiaohongshu_publish.mp4"));
  console.log(`\nSpark style final-only version done: ${totalDuration.toFixed(1)}s`);
}

if (process.env.EPISODE4_RENDER_MODE === "final-only") {
  renderFinalOnly();
} else {
  render();
}
