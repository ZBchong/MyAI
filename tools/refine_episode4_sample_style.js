const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");

const repo = "D:\\Code\\AiCoding\\MyAI";
const episodeDir = "D:\\6.AI\\自媒体\\AI工具第4期";
const rawVideo = path.join(episodeDir, "2f3c8e338f9366dcb84e54e8ede5a85b_raw.mp4");
const skillDir = "C:\\Users\\25506\\.codex\\skills\\douyin-xiaohongshu-video-producer-1.0.0";
const endingTemplate = path.join(skillDir, "assets", "ending", "like-ending-template.mp4");
const ffmpeg = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const ffprobe = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe");
const nodeEdgeTtsBin = path.join(repo, "tools", "node-edge-tts", "node_modules", "node-edge-tts", "bin.js");

const assetsDir = path.join(episodeDir, "assets");
const refinedDir = path.join(assetsDir, "refined_sample_style");
const clipsDir = path.join(refinedDir, "clips");
const audioDir = path.join(assetsDir, "audio");
const backupDir = path.join(assetsDir, "backup");
const dataDir = path.join(assetsDir, "render_data");
const workAudioDir = path.join(repo, "tools", "episode4_refined_voice_work");

for (const dir of [refinedDir, clipsDir, audioDir, backupDir, dataDir, workAudioDir]) {
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
  return `drawtext=fontfile='${font}':text='${escText(text)}':fontcolor=${color}:fontsize=${size}:x=${x}:y=${y}${spacing}${box}`;
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

function synthesizeToMp3(text, output, options = {}) {
  run(process.execPath, [
    nodeEdgeTtsBin,
    "-t", text,
    "-f", output,
    "-v", options.voice || voiceName,
    "-l", "zh-CN",
    "-o", "audio-24khz-96kbitrate-mono-mp3",
    "-r", options.rate || "+8%",
    "--pitch", options.pitch || "default",
    "--volume", options.volume || "default",
    "--timeout", "20000"
  ]);
}

const timeline = [
  {
    type: "card",
    name: "01_hook",
    duration: 2.4,
    title: ["上班看行情", "不用偷偷切手机"],
    eyebrow: "这期直切痛点",
    body: ["股票 / 基金 / 板块", "一屏看重点，不来回翻 App"],
    voice: "上班想看行情，不用再偷偷切手机。",
    display: "上班想看行情，\\N不用再偷偷切手机。"
  },
  {
    type: "card",
    name: "02_map",
    duration: 3.2,
    title: ["录屏里", "只看 4 个重点"],
    eyebrow: "先把前情压缩掉",
    body: ["今日建议：先看方向和风险", "板块热度：上涨下跌分开", "基金排行：趋势和涨跌幅同屏", "Agent 总结：把结论写成人话"],
    voice: "这期直接看四个点：今日建议、板块热度、基金排行，还有 Agent 总结。",
    display: "这期直接看四个点：\\N今日建议、板块热度、基金排行、Agent 总结。"
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
    voice: "鼠标先在今日涨跌建议附近停住。这里不是堆数据，而是先给方向，再把风险写成短结论。",
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
    voice: "切完之后，看这个高位谨慎总结。它把涨幅、风险因子、基金建议都整理成人话，少看好几张表。",
    display: "切完之后看 Agent 总结。\\N涨幅、风险因子、基金建议都整理成人话。"
  },
  {
    type: "card",
    name: "09_result",
    duration: 4.8,
    title: ["它解决的", "不是预测涨跌"],
    eyebrow: "最后说清楚",
    body: ["而是把行情重点集中到一屏", "上班也能安静看全局", "仅作工具演示，不构成投资建议"],
    voice: "重点就是，把行情集中到一屏。想要完整生成提示词，评论区留言获取。",
    display: "行情重点集中到一屏，\\N完整生成提示词评论区获取。"
  },
  {
    type: "ending",
    name: "10_like_ending",
    duration: 1.2,
    voice: "留言拿提示词。",
    display: null
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

function makeCardClip(item, index) {
  const output = path.join(clipsDir, `${String(index + 1).padStart(2, "0")}_${item.name}.mp4`);
  const filters = [
    "drawbox=x=70:y=78:w=940:h=1764:color=white:t=fill",
    "drawbox=x=70:y=78:w=940:h=14:color=0x2563EB:t=fill",
    drawText("牛一样的程序猿", 118, 128, 30, "0x111827", { bold: true }),
    drawText("AI 工具实测 / 工作流 / 玩法", 118, 174, 24, "0x64748B"),
    "drawbox=x=118:y=306:w=250:h=56:color=0x111827:t=fill",
    drawText(item.eyebrow, 144, 320, 24, "white", { bold: true })
  ];

  let y = 430;
  for (const line of item.title) {
    filters.push(drawText(line, 118, y, 66, "0x0F172A", { bold: true }));
    y += 86;
  }

  y += 44;
  if (item.name === "02_map") {
    let py = y + 18;
    for (const [idx, line] of item.body.entries()) {
      filters.push(`drawbox=x=118:y=${py - 14}:w=844:h=78:color=0xF8FAFC:t=fill`);
      filters.push(`drawbox=x=146:y=${py + 10}:w=38:h=38:color=0x2563EB:t=fill`);
      filters.push(drawText(String(idx + 1), 158, py + 13, 22, "white", { bold: true }));
      filters.push(drawText(line, 208, py, 29, "0x334155", { bold: idx === 0 }));
      py += 104;
    }
  } else {
    for (const line of item.body) {
      filters.push(drawText(line, 122, y, 34, "0x475569"));
      y += 54;
    }
    filters.push(`drawbox=x=118:y=${y + 70}:w=844:h=340:color=0xF8FAFC:t=fill`);
    if (item.name === "09_result") {
      filters.push(drawText("评论区留言", 158, y + 116, 38, "0x111827", { bold: true }));
      filters.push(drawText("获取完整工具生成提示词", 158, y + 184, 30, "0x2563EB", { bold: true }));
      filters.push(drawText("仅作工具演示，不构成投资建议", 158, y + 254, 24, "0x94A3B8"));
    } else {
      filters.push(drawText("真实录屏马上开始", 158, y + 116, 38, "0x111827", { bold: true }));
      filters.push(drawText("前期解释压缩成图卡，后面直接跟鼠标看模块", 158, y + 184, 26, "0x64748B"));
      filters.push(drawText("仅作工具演示，不构成投资建议", 158, y + 254, 24, "0x94A3B8"));
    }
  }

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "lavfi", "-t", String(item.duration), "-i", "color=c=0xEEF2F7:s=1080x1920:r=30",
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
    "format=yuv420p",
    "drawbox=x=0:y=0:w=1080:h=1920:color=0xEEF2F7:t=fill",
    "drawbox=x=70:y=68:w=940:h=154:color=white:t=fill",
    "drawbox=x=70:y=68:w=940:h=10:color=0x2563EB:t=fill",
    drawText(item.title, 98, 102, 40, "0x0F172A", { bold: true }),
    drawText(item.note, 100, 162, 26, "0x475569"),
    "drawbox=x=40:y=250:w=1000:h=590:color=white:t=fill",
    "drawbox=x=40:y=250:w=1000:h=590:color=0xCBD5E1:t=2",
    "drawbox=x=40:y=880:w=1000:h=620:color=white:t=fill",
    "drawbox=x=40:y=880:w=1000:h=620:color=0xCBD5E1:t=2",
    "drawbox=x=60:y=912:w=150:h=44:color=0x2563EB:t=fill",
    drawText("放大看这里", 78, 922, 22, "white", { bold: true }),
    drawText("跟随鼠标和当前讲解模块，不做永久裁切", 232, 918, 24, "0x64748B"),
    drawText("仅作工具演示，不构成投资建议", 72, 1518, 22, "0x94A3B8")
  ];

  const filter = [
    `[0:v]fps=30,split=2[fullsrc][zoomsrc]`,
    `[fullsrc]scale=1000:-1:flags=lanczos,drawbox=x=${hi.x}:y=${hi.y}:w=${hi.w}:h=${hi.h}:color=0x2563EB@0.95:t=5[full]`,
    `[zoomsrc]crop=${c.w}:${c.h}:${c.x}:${c.y},scale=960:520:force_original_aspect_ratio=decrease:flags=lanczos,pad=960:520:(ow-iw)/2:(oh-ih)/2:color=white,unsharp=5:5:0.55[zoom]`,
    `[1:v]${bgFilters.join(",")}[bg]`,
    `[bg][full]overlay=40:262[tmp1]`,
    `[tmp1][zoom]overlay=60:962[v]`
  ].join(";");

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-ss", String(item.rawStart),
    "-t", String(item.duration),
    "-i", rawVideo,
    "-f", "lavfi", "-t", String(item.duration), "-i", "color=c=0xEEF2F7:s=1080x1920:r=30",
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

function writeSubtitles() {
  const items = timeline.filter(item => item.display);
  const srt = items.map((item, index) => {
    return `${index + 1}\n${srtTime(item.start)} --> ${srtTime(item.end)}\n${item.display.replace(/\\N/g, "\n")}\n`;
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
    "Style: Default,Microsoft YaHei,43,&H00FFFFFF,&H000000FF,&H00333333,&H99000000,1,0,0,0,100,100,0,0,1,4,1,2,92,92,145,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...items.map(item => `Dialogue: 0,${assTime(item.start)},${assTime(item.end)},Default,,0,0,0,,${item.display}`)
  ].join("\n");
  const assPath = path.join(dataDir, "refined_sample_style_subtitles.ass");
  writeFile(assPath, ass);
  return assPath;
}

function buildVoiceover() {
  const voiceSegments = timeline.map((item, index) => {
    const key = hashText(`${item.duration}|${item.voice}`);
    return {
      ...item,
      index,
      raw: path.join(workAudioDir, `refined_raw_${String(index + 1).padStart(2, "0")}_${key}.mp3`),
      fit: path.join(workAudioDir, `refined_fit_${String(index + 1).padStart(2, "0")}_${key}.wav`)
    };
  });

  for (const seg of voiceSegments) {
    console.log(`Synth ${seg.index + 1}/${voiceSegments.length}: ${seg.voice}`);
    if (!fs.existsSync(seg.raw) || fs.statSync(seg.raw).size === 0) {
      synthesizeToMp3(seg.voice, seg.raw, { rate: seg.duration <= 3.2 ? "+12%" : "+7%" });
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

  const concat = path.join(workAudioDir, "refined_voice_concat.txt");
  writeFile(concat, voiceSegments.map(seg => `file '${seg.fit.replace(/\\/g, "/")}'`).join("\n"));
  const voiceWav = path.join(workAudioDir, "voiceover_refined_aligned.wav");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat,
    "-c", "copy",
    voiceWav
  ]);
  fs.copyFileSync(voiceWav, path.join(audioDir, "voiceover_refined_aligned.wav"));
  writeFile(path.join(audioDir, "README_voiceover.txt"), `当前音轨：${voiceName} 临时 TTS，可替换。\n规则：无用户真人录音时，仅作为临时配音；后续提供真人录音后应替换为真人声。\n本版处理：按录屏鼠标和模块节奏重写口播，减少前期铺垫，保留模块间停顿。\n`);
  return voiceWav;
}

function writeTextDeliverables(totalDuration) {
  const voiceover = timeline.map((item, index) => `${index + 1}. ${item.voice}`).join("\n\n")
    + "\n\n说明：当前配音为 Edge 神经语音生成的可替换临时 TTS；如果提供真人录音，应以真人声作为主配音。";
  writeFile(path.join(episodeDir, "voiceover_script.txt"), voiceover);

  const shotList = timeline.map((item, index) => {
    const label = `${srtTime(item.start)} - ${srtTime(item.end)}`.replace(/,/g, ".");
    if (item.type === "screen") {
      return `${index + 1}. ${label} ${item.title}：${item.note}。画面采用全局录屏 + 局部放大，蓝框跟随当前讲解模块。`;
    }
    if (item.type === "ending") {
      return `${index + 1}. ${label} LIKE 结尾：完整使用 skill 原始 LIKE 片段，按等比缩放完整适配竖屏，不裁切边缘。`;
    }
    return `${index + 1}. ${label} 图卡：${item.title.join(" / ")}。`;
  }).join("\n");

  writeFile(path.join(episodeDir, "video_script.md"), `# 视频脚本：一屏看清股票基金行情工具\n\n账号：牛一样的程序猿\n主题：再也不用偷偷看手机分析股市基金行情了，用这个工具一目了然。\n成片时长：约 ${totalDuration.toFixed(1)} 秒。\n\n## 本版修改重点\n- 开头只保留两张图卡，把前情压缩到 5.6 秒内。\n- 录屏段参考样例做全局画面 + 局部放大，蓝框跟随当前讲解模块。\n- 口播按鼠标位置和可见模块重写，避免文不对体。\n- 结尾 LIKE 部分完整使用原始片段，等比缩放完整放入竖屏画布，不裁切。\n\n## 分镜\n${shotList}\n\n## 风险说明\n本期仅演示工具与信息组织方式，不构成任何投资建议。\n`);

  const renderData = timeline.map(({ type, name, start, end, duration, voice, display, rawStart, crop, highlight }) => ({
    type, name, start, end, duration, voice, display, rawStart, crop, highlight
  }));
  writeFile(path.join(dataDir, "refined_sample_style_timeline.json"), JSON.stringify(renderData, null, 2));
}

function render() {
  const totalDuration = assignStarts();
  const assPath = writeSubtitles();
  writeTextDeliverables(totalDuration);

  backupIfExists(path.join(episodeDir, "douyin_publish.mp4"), "before_refine_sample_style");
  backupIfExists(path.join(episodeDir, "xiaohongshu_publish.mp4"), "before_refine_sample_style");

  const clips = timeline.map((item, index) => {
    if (item.type === "card") return makeCardClip(item, index);
    if (item.type === "screen") return makeScreenClip(item, index);
    if (item.type === "ending") return makeEndingClip(item, index);
    throw new Error(`Unknown segment type: ${item.type}`);
  });

  const concatFile = path.join(refinedDir, "concat_refined.txt");
  writeFile(concatFile, clips.map(file => `file '${file.replace(/\\/g, "/")}'`).join("\n"));
  const baseVideo = path.join(refinedDir, "base_refined_no_voice.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    baseVideo
  ]);

  const voiceWav = buildVoiceover();
  const refinedTemp = path.join(refinedDir, "publish_refined_sample_style_tmp.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", baseVideo,
    "-i", voiceWav,
    "-vf", `subtitles='${ffPath(assPath)}'`,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "libx264",
    "-crf", "16",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-af", "volume=5dB,alimiter=limit=0.95",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    "-movflags", "+faststart",
    refinedTemp
  ]);

  fs.copyFileSync(refinedTemp, path.join(episodeDir, "douyin_publish.mp4"));
  fs.copyFileSync(refinedTemp, path.join(episodeDir, "xiaohongshu_publish.mp4"));
  console.log(`\nRefined sample-style version done: ${totalDuration.toFixed(1)}s`);
}

render();
