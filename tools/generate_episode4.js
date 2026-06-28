const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const repo = "D:\\Code\\AiCoding\\MyAI";
const episodeDir = "D:\\6.AI\\自媒体\\AI工具第4期";
const rawVideo = path.join(episodeDir, "2f3c8e338f9366dcb84e54e8ede5a85b_raw.mp4");
const skillDir = "C:\\Users\\25506\\.codex\\skills\\douyin-xiaohongshu-video-producer-1.0.0";
const avatar = path.join(skillDir, "assets", "brand", "avatar.png");
const endingTemplate = path.join(skillDir, "assets", "ending", "like-ending-template.mp4");
const ffmpeg = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const ffprobe = path.join(repo, "tools", "ffmpeg-node", "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe");

const assetsDir = path.join(episodeDir, "assets");
const cardsDir = path.join(assetsDir, "cards");
const clipsDir = path.join(assetsDir, "clips");
const previewDir = path.join(assetsDir, "preview_frames");
const dataDir = path.join(assetsDir, "render_data");

for (const dir of [episodeDir, assetsDir, cardsDir, clipsDir, previewDir, dataDir]) {
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

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
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

function drawText(text, x, y, size, color, extra) {
  const font = extra && extra.bold ? "C\\:/Windows/Fonts/msyhbd.ttc" : "C\\:/Windows/Fonts/msyh.ttc";
  const spacing = extra && extra.spacing ? `:line_spacing=${extra.spacing}` : "";
  const box = extra && extra.box
    ? `:box=1:boxcolor=${extra.box.color}:boxborderw=${extra.box.border || 18}`
    : "";
  return `drawtext=fontfile='${font}':text='${escText(text)}':fontcolor=${color}:fontsize=${size}:x=${x}:y=${y}${spacing}${box}`;
}

function makeCard(name, config) {
  const output = path.join(cardsDir, `${name}.jpg`);
  const inputs = [
    "-hide_banner", "-y",
    "-f", "lavfi", "-i", "color=c=0xEEF2F7:s=1080x1920:r=30:d=1",
    "-i", avatar
  ];
  const hasPreview = Boolean(config.preview);
  if (hasPreview) inputs.push("-i", config.preview);

  const base = [
    "drawbox=x=70:y=76:w=940:h=1720:color=white:t=fill",
    "drawbox=x=70:y=76:w=940:h=14:color=0x2563EB:t=fill",
    drawText("牛一样的程序猿", 244, 128, 34, "0x111827", { bold: true }),
    drawText("重度AI工具使用者 + 生产者", 244, 174, 24, "0x4B5563"),
    drawText("AI实测 -> 工作流 | 工具 | 玩法 | 创意", 244, 210, 22, "0x64748B"),
    "drawbox=x=130:y=318:w=148:h=52:color=0x111827:t=fill",
    drawText(config.tag || "AI实测", 160, 329, 24, "white", { bold: true }),
  ];

  let y = 405;
  for (const line of config.titleLines) {
    base.push(drawText(line, 130, y, config.titleSize || 66, "0x0F172A", { bold: true }));
    y += config.titleGap || 84;
  }

  y += 24;
  for (const line of config.subLines || []) {
    base.push(drawText(line, 132, y, config.subSize || 30, "0x475569"));
    y += 48;
  }

  if (config.panel) {
    const p = config.panel;
    base.push(`drawbox=x=${p.x}:y=${p.y}:w=${p.w}:h=${p.h}:color=0xF3F4F6:t=fill`);
    base.push(`drawbox=x=${p.x + 26}:y=${p.y + 30}:w=${p.w - 52}:h=72:color=white:t=fill`);
    base.push(drawText(p.title, p.x + 48, p.y + 48, 30, "0x111827", { bold: true }));
    base.push(drawText(p.subtitle, p.x + 48, p.y + 108, 24, "0x64748B"));
    let chipX = p.x + 48;
    for (const chip of p.chips) {
      base.push(`drawbox=x=${chipX}:y=${p.y + 166}:w=${chip.w}:h=44:color=${chip.color}:t=fill`);
      base.push(drawText(chip.text, chipX + 18, p.y + 176, 20, chip.textColor || "white", { bold: chip.bold }));
      chipX += chip.w + 16;
    }
    base.push(`drawbox=x=${p.x + 36}:y=${p.y + 250}:w=${(p.w - 92) / 2}:h=116:color=white:t=fill`);
    base.push(`drawbox=x=${p.x + 56 + (p.w - 92) / 2}:y=${p.y + 250}:w=${(p.w - 92) / 2}:h=116:color=white:t=fill`);
    base.push(drawText(p.leftMetric, p.x + 62, p.y + 275, 24, "0xDC2626", { bold: true }));
    base.push(drawText(p.leftLabel, p.x + 62, p.y + 316, 21, "0x64748B"));
    base.push(drawText(p.rightMetric, p.x + 82 + (p.w - 92) / 2, p.y + 275, 24, "0x16A34A", { bold: true }));
    base.push(drawText(p.rightLabel, p.x + 82 + (p.w - 92) / 2, p.y + 316, 21, "0x64748B"));
  }

  if (config.points) {
    let py = config.pointsY || 790;
    for (const point of config.points) {
      base.push(`drawbox=x=132:y=${py - 12}:w=816:h=76:color=0xF8FAFC:t=fill`);
      base.push(drawText(point.k, 160, py, 28, point.color || "0x111827", { bold: true }));
      base.push(drawText(point.v, 160, py + 38, 22, "0x64748B"));
      py += 104;
    }
  }

  base.push(drawText("牛一样的程序猿｜想象力有多大，AI 的能力就有多大", 132, 1664, 25, "0x334155"));
  base.push(drawText("仅作工具演示，不构成投资建议", 132, 1712, 22, "0x94A3B8"));

  let filter = `[0:v]${base.join(",")}[base];[1:v]scale=96:96[avatar];[base][avatar]overlay=126:122`;

  if (hasPreview) {
    filter += `[withAvatar];[2:v]scale=820:-1[shot];[withAvatar]drawbox=x=130:y=1016:w=820:h=500:color=0xE5E7EB:t=fill[previewBg];[previewBg][shot]overlay=130:1060`;
  }

  run(ffmpeg, [
    ...inputs,
    "-filter_complex", filter,
    "-frames:v", "1",
    "-update", "1",
    "-q:v", "2",
    output
  ]);
  return output;
}

function makeClipFromImage(image, seconds, output) {
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-loop", "1", "-t", String(seconds), "-i", image,
    "-f", "lavfi", "-t", String(seconds), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-r", "30",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest", output
  ]);
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

function writeSubtitles(items) {
  const srt = items.map((item, index) => {
    return `${index + 1}\n${srtTime(item.start)} --> ${srtTime(item.end)}\n${item.text}\n`;
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
    "Style: Default,Microsoft YaHei,52,&H00FFFFFF,&H000000FF,&H00333333,&H99000000,1,0,0,0,100,100,0,0,1,4,1,2,72,72,250,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...items.map(item => `Dialogue: 0,${assTime(item.start)},${assTime(item.end)},Default,,0,0,0,,${assEscape(item.text)}`)
  ].join("\n");
  const assPath = path.join(dataDir, "subtitles_burn.ass");
  writeFile(assPath, ass);
  return assPath;
}

function writeTextDeliverables() {
  const videoScript = `# 视频脚本：再也不用偷偷看手机分析股市基金行情了

账号：牛一样的程序猿
主题：用一个本地行情分析工具，把股票、基金、板块趋势放在一屏里看清楚。
定位：AI 工具实测 + 工作流分享
时长：约 69 秒，按实际录屏完整讲解，不强行压到 45 秒。

## 片头 0-3s
画面：白底蓝线封面卡，标题“再也不用偷偷看手机 / 股市基金行情一屏看清”。
口播：再也不用偷偷看手机看行情了。

## 痛点 3-7s
画面：三条痛点卡。
口播：股票、基金、板块，最怕信息散得到处都是。上班时手机来回切，越看越乱。

## 方法 7-11s
画面：方法卡，突出 AI 生成工具。
口播：我直接让 AI 做了一个一屏行情工具，涨跌建议、板块热度、基金排行和 Agent 总结都放进去。

## 真实录屏证明 11-60.5s
画面：录屏竖屏包装，完整保留原始 49.5 秒主体录屏。先显示“股票基金趋势分析”的涨跌建议，再展示模型选择、板块热度、基金排行榜、板块切换和 Agent 分析结果。
口播：
1. 开头先看今日涨跌建议，工具会把大盘方向、风险点和注意事项写成短结论。
2. 这里可以选择沪深 300、半导体等方向，再切换模型让 Agent 重新分析。
3. 往下看板块动向热度，上涨和下跌一眼分开，还能看到每个方向的小趋势线。
4. 右边是基金排行榜，基金名称、趋势线和涨跌幅直接摆出来。
5. 鼠标切到半导体、通信、有色这些方向时，就能看对应板块的走势和排行变化。
6. 最后 Agent 会把高位谨慎、关注点、风险提示和结论整理成文字。

## 结果 60.5-67.5s
画面：总结卡，三条结果。
口播：上班也能安静看全局，不用手机来回切了。想要这个工具的完整生成提示词，评论区留言。

## 结尾 67.5-68.7s
画面：使用 skill 自带 LIKE 结尾模板。
口播/字幕：欢迎评论区留言获取工具生成提示词吧。

## 注意
本期只演示工具与信息组织方法，不构成任何投资建议。
`;

  const voiceover = `再也不用偷偷看手机看行情了。

股票、基金、板块，最怕信息散得到处都是。
上班时手机来回切，越看越乱。

我直接让 AI 做了一个一屏行情工具，
涨跌建议、板块热度、基金排行和 Agent 总结都放进去。

开头先看今日涨跌建议，
工具会把大盘方向和风险写成短结论。

这里可以切换模型，
再让 Agent 重新分析。

往下看板块热度，
上涨和下跌一眼分开。

右边是基金排行榜，
趋势线和涨跌幅直接摆出来。

点到半导体、有色、通信这些方向，
就能看对应走势。

最后 Agent 会把高位风险、关注点和结论整理成文字。

上班也能安静看全局，
不用手机来回切了。

想要这个工具的完整生成提示词，
评论区留言。

欢迎评论区留言获取工具生成提示词吧。

注：本期只演示工具与信息组织方法，不构成投资建议。
`;

  const publishCopy = `# 发布文案

## 抖音
标题：再也不用偷偷看手机看行情了，这个工具一屏看清股票基金趋势

文案：
上班想看股票、基金、板块行情，但又不想一直切手机？
我让 AI 做了一个一屏行情工具：涨跌建议、板块热度、基金排行、Agent 总结都放进去。

只演示工具和工作流，不构成投资建议。
想要完整生成提示词，评论区留言。

#AI工具 #AI实测 #股票基金 #效率工具 #程序员

## 小红书
标题：上班看行情不用偷偷切手机了｜AI 做了个股票基金趋势工具

正文：
这期做了一个股票/基金/板块行情分析小工具，适合想快速看全局的人。

它主要做 4 件事：
1. 自动整理当天涨跌建议和风险提示
2. 股票、基金、板块趋势放在同一屏
3. 支持切换模型，让 Agent 重新分析
4. 把关注点、风险和结论整理成短文字

我最喜欢的是：不用在手机 App、网页、表格之间来回切，一屏就能看到重点。

仅作工具演示和信息整理，不构成投资建议。
想要完整提示词，可以评论区留言。

#AI工具 #AI工作流 #股票基金 #基金工具 #效率工具 #程序员日常 #本地工具 #Agent
`;

  const promptTemplate = `# 角色
你是一名资深产品经理 + 前端工程师 + 用户体验设计师，同时了解股票、基金、板块行情工具的常见信息结构。你需要帮我生成一个可直接本地运行的网页工具。

# 背景
我想解决的问题是：平时想看股票、基金、板块行情时，信息分散在手机 App、网页和表格里，上班或学习时来回切换很不方便，也很容易只看到局部信息。
目标用户是：希望快速掌握市场概况、基金排行、板块热度和自选标的变化的个人投资者、研究者、内容创作者和效率工具爱好者。
我希望用一个本地网页工具来解决这个问题：把关键行情信息、趋势、提醒和 AI 总结集中在一屏里，方便快速浏览和复盘。

# 目标
请帮我生成一个可以直接在本地运行的网页工具，用来管理和查看股票、基金、板块趋势，支持自选关注、搜索筛选、模拟行情数据、AI 分析摘要和风险提示。

# 功能要求
1. 顶部展示“股票基金趋势分析”标题、更新时间、语言切换按钮和状态标签。
2. 首页必须有“今日涨跌建议”模块，展示大盘概览、风险提示、机会方向和免责声明。
3. 提供“板块热度预测”模块，支持选择不同板块或方向，例如半导体、有色、通信、消费、医药、AI 应用等，并展示上涨热度、下跌热度、迷你趋势线和简短原因。
4. 提供“基金排行榜”模块，展示基金名称、基金类型、涨跌幅、近一周/近一月走势、风险等级和关注按钮。
5. 提供“股票观察列表”模块，支持新增股票或基金，记录代码、名称、分类、关注理由、买入观察价、风险备注和标签。
6. 支持搜索、分类筛选、按涨跌幅排序、按风险等级筛选、复制单条分析、编辑、删除。
7. 提供“Agent 分析”按钮，点击后基于当前模拟数据生成一段分析摘要，包括市场情绪、机会方向、风险点和下一步观察清单。
8. 支持本地保存数据，刷新页面后自选列表和设置不丢失，优先使用 localStorage。
9. 所有行情数据都使用高质量模拟数据，不要请求真实交易接口；页面明显标注“仅作工具演示，不构成投资建议”。

# 内容/数据要求
- 内置不少于 8 个股票/板块示例和不少于 8 个基金示例。
- 每条示例数据包含名称、代码或简称、分类、涨跌幅、趋势数组、风险等级、说明文字。
- 趋势线可以用 SVG 或 Canvas 绘制迷你折线图。
- 数据要能在浏览器本地保存，支持导入/导出 JSON。
- 搜索结果要即时响应，筛选条件变化后页面不刷新。

# 页面设计要求
- 做成现代、干净、适合日常使用的工具界面，不要做营销落地页，打开就是工具本身。
- 使用浅色背景、白色内容区、清晰边框、蓝色主按钮、红绿区分涨跌，但整体不要刺眼。
- 左侧可以有窄侧边栏，主区域使用两列或三列信息布局。
- 适配电脑和手机；手机端改成单列卡片。
- 重点信息要易读，数字涨跌幅要醒目，风险提示要克制但明显。
- 所有按钮、输入框、筛选器和卡片都要有清晰的 hover/focus 状态。

# 技术要求
- 优先生成一个单文件 HTML，包含 CSS 和 JavaScript。
- 不依赖后端服务。
- 如果必须依赖外部库，请说明原因；如无必要，请使用原生 HTML/CSS/JS。
- 使用 localStorage 保存用户自选列表、筛选条件和最近一次 Agent 分析结果。
- 关键逻辑加简短注释，代码结构清晰。

# 验收标准
- 我可以直接打开 HTML 使用，不需要安装后端。
- 可以新增、搜索、分类、编辑、删除股票或基金观察项。
- 可以按分类、涨跌幅、风险等级筛选内容。
- 可以点击 Agent 分析生成一段摘要，并能复制摘要。
- 页面刷新后数据仍然存在。
- 页面在桌面和手机宽度下没有明显布局错位。
- 页面明确提示“仅作工具演示，不构成投资建议”。

# 输出要求
请直接输出完整单文件 HTML 代码，并在最后给我 3 条后续可迭代优化建议。
`;

  writeFile(path.join(episodeDir, "video_script.md"), videoScript);
  writeFile(path.join(episodeDir, "voiceover_script.txt"), voiceover);
  writeFile(path.join(episodeDir, "publish_copy.md"), publishCopy);
  writeFile(path.join(episodeDir, "complete_prompt_template.md"), promptTemplate);
}

function render() {
  const probe = cp.execFileSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,codec_name,width,height",
    "-of", "json",
    rawVideo
  ], { encoding: "utf8" });
  writeFile(path.join(dataDir, "raw_video_probe.json"), probe);
  const rawMetadata = JSON.parse(probe);
  const rawDuration = Number(rawMetadata.format && rawMetadata.format.duration ? rawMetadata.format.duration : 49.5);

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", rawVideo,
    "-vf", "fps=1/5,scale=640:-1",
    "-frames:v", "10",
    path.join(previewDir, "frame_%02d.jpg")
  ]);

  const frame10 = path.join(previewDir, "frame_10.jpg");

  const cover = makeCard("cover", {
    tag: "AI实测",
    titleLines: ["上班看行情", "不用偷偷看手机"],
    subLines: ["股票 / 基金 / 板块趋势", "一个工具，一屏看清"],
    preview: frame10,
    panel: {
      x: 132, y: 760, w: 816, h: 420,
      title: "股票基金趋势分析",
      subtitle: "涨跌建议 + 板块热度 + Agent总结",
      chips: [
        { text: "今日建议", w: 126, color: "0x2563EB", bold: true },
        { text: "基金排行", w: 126, color: "0xE0F2FE", textColor: "0x0369A1" },
        { text: "风险提示", w: 126, color: "0xFEE2E2", textColor: "0xB91C1C" }
      ],
      leftMetric: "+11.41%",
      leftLabel: "强势方向",
      rightMetric: "-8.28%",
      rightLabel: "风险提醒"
    }
  });
  copyFile(cover, path.join(episodeDir, "cover.jpg"));

  const hook = makeCard("hook", {
    tag: "痛点",
    titleLines: ["再也不用", "偷偷看手机"],
    subLines: ["股市基金行情", "用这个工具一目了然"],
    panel: {
      x: 132, y: 830, w: 816, h: 420,
      title: "一屏看全局",
      subtitle: "涨跌建议 / 板块热度 / 基金排行 / Agent总结",
      chips: [
        { text: "股票", w: 92, color: "0x2563EB", bold: true },
        { text: "基金", w: 92, color: "0xDBEAFE", textColor: "0x1D4ED8" },
        { text: "板块", w: 92, color: "0xDCFCE7", textColor: "0x15803D" }
      ],
      leftMetric: "少切换",
      leftLabel: "不用手机来回翻",
      rightMetric: "看重点",
      rightLabel: "趋势和风险先出来"
    }
  });

  const pain = makeCard("pain", {
    tag: "问题",
    titleLines: ["看行情最烦的", "不是涨跌"],
    subLines: ["而是信息散、切换多、重点乱"],
    pointsY: 790,
    points: [
      { k: "手机 App 来回切", v: "股票、基金、板块分散在不同页面" },
      { k: "只看到局部涨跌", v: "很难快速判断今天该重点看什么" },
      { k: "截图复盘太麻烦", v: "风险、机会、结论没有自动整理" }
    ]
  });

  const method = makeCard("method", {
    tag: "方法",
    titleLines: ["让 AI 做个", "行情分析工作台"],
    subLines: ["打开就是工具，不是落地页"],
    pointsY: 790,
    points: [
      { k: "今日涨跌建议", v: "先把大盘方向和风险写成短结论" },
      { k: "板块热度 + 基金排行", v: "趋势线、涨跌幅、分类都放在一屏" },
      { k: "Agent 分析总结", v: "把观察点、风险点和下一步整理出来" }
    ]
  });

  const summary = makeCard("summary", {
    tag: "结果",
    titleLines: ["行情全局", "终于一眼看清"],
    subLines: ["工具演示，不构成投资建议"],
    pointsY: 790,
    points: [
      { k: "上班也能安静看全局", v: "不用手机和网页之间反复横跳" },
      { k: "重点模块都在一屏", v: "涨跌建议、板块、基金、Agent 总结" },
      { k: "想要完整提示词", v: "评论区留言，我把生成模板给你" }
    ]
  });

  makeClipFromImage(hook, 3, path.join(clipsDir, "01_hook.mp4"));
  makeClipFromImage(pain, 4, path.join(clipsDir, "02_pain.mp4"));
  makeClipFromImage(method, 4, path.join(clipsDir, "03_method.mp4"));
  makeClipFromImage(summary, 7, path.join(clipsDir, "05_summary.mp4"));

  const proofDuration = rawDuration;
  const proofFilter = [
    `[0:v]trim=start=0:end=${rawDuration.toFixed(3)},setpts=PTS-STARTPTS,crop=1800:1018:80:30,scale=1000:-1,fps=30[screen]`,
    `[1:v]drawbox=x=0:y=0:w=1080:h=1920:color=0xEEF2F7:t=fill,` +
      `drawbox=x=70:y=70:w=940:h=164:color=white:t=fill,` +
      `drawbox=x=70:y=70:w=940:h=12:color=0x2563EB:t=fill,` +
      `${drawText("真实录屏证明", 100, 104, 42, "0x0F172A", { bold: true })},` +
      `${drawText("股票 / 基金 / 板块趋势，一屏看清", 100, 164, 26, "0x475569")},` +
      `drawbox=x=40:y=292:w=1000:h=650:color=white:t=fill,` +
      `drawbox=x=40:y=292:w=1000:h=650:color=0xCBD5E1:t=2,` +
      `drawbox=x=80:y=1018:w=920:h=284:color=white:t=fill,` +
      `${drawText("录屏里重点看这 4 个模块", 112, 1054, 34, "0x111827", { bold: true })},` +
      `${drawText("1. 今日涨跌建议：先给方向和风险", 112, 1114, 25, "0x334155")},` +
      `${drawText("2. 模型选择：让 Agent 重新分析", 112, 1162, 25, "0x334155")},` +
      `${drawText("3. 板块热度：上涨/下跌一眼分开", 112, 1210, 25, "0x334155")},` +
      `${drawText("4. 基金排行：趋势线和涨跌幅直接摆出来", 112, 1258, 25, "0x334155")},` +
      `${drawText("仅作工具演示，不构成投资建议", 100, 1354, 24, "0x94A3B8")}` +
      `[bg]`,
    `[bg][screen]overlay=x=40:y=335[v]`
  ].join(";");

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", rawVideo,
    "-f", "lavfi", "-t", String(proofDuration), "-i", `color=c=0xEEF2F7:s=1080x1920:r=30`,
    "-f", "lavfi", "-t", String(proofDuration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex", proofFilter,
    "-map", "[v]", "-map", "2:a",
    "-t", String(proofDuration),
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    path.join(clipsDir, "04_proof.mp4")
  ]);

  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", endingTemplate,
    "-f", "lavfi", "-t", "1.2", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex", "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v]",
    "-map", "[v]", "-map", "1:a",
    "-t", "1.2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    path.join(clipsDir, "06_ending.mp4")
  ]);

  const concatFile = path.join(dataDir, "concat.txt");
  const concatLines = [
    "01_hook.mp4",
    "02_pain.mp4",
    "03_method.mp4",
    "04_proof.mp4",
    "05_summary.mp4",
    "06_ending.mp4"
  ].map(file => `file '${path.join(clipsDir, file).replace(/\\/g, "/")}'`).join("\n");
  writeFile(concatFile, concatLines);

  const baseConcat = path.join(clipsDir, "base_concat.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0", "-i", concatFile,
    "-c", "copy",
    baseConcat
  ]);

  const proofStart = 11;
  const proofEnd = proofStart + rawDuration;
  const summaryEnd = proofEnd + 7;
  const subtitles = [
    { start: 0, end: 3, text: "再也不用偷偷看手机看行情了。" },
    { start: 3, end: 7, text: "股票、基金、板块，最怕信息散得到处都是。" },
    { start: 7, end: 11, text: "我让 AI 做了一个一屏行情工具。" },
    { start: proofStart, end: proofStart + 7, text: "开头先看今日涨跌建议，先给出方向和风险。" },
    { start: proofStart + 7, end: proofStart + 14, text: "这里可以选沪深 300、半导体，再让 Agent 分析。" },
    { start: proofStart + 14, end: proofStart + 23, text: "往下是板块动向热度，上涨和下跌一眼分开。" },
    { start: proofStart + 23, end: proofStart + 31, text: "右侧基金排行榜，把趋势线和涨跌幅摆出来。" },
    { start: proofStart + 31, end: proofStart + 40, text: "切到半导体、通信、有色，就能看对应走势。" },
    { start: proofStart + 40, end: proofEnd, text: "最后 Agent 会整理高位风险、关注点和结论。" },
    { start: proofEnd, end: proofEnd + 3.5, text: "上班也能安静看全局，不用手机来回切了。" },
    { start: proofEnd + 3.5, end: summaryEnd, text: "想要这个工具的完整生成提示词，评论区留言。" },
    { start: summaryEnd, end: summaryEnd + 1.2, text: "欢迎评论区留言获取工具生成提示词吧。" }
  ];
  const assPath = writeSubtitles(subtitles);

  const finalVideo = path.join(episodeDir, "douyin_publish.mp4");
  run(ffmpeg, [
    "-hide_banner", "-y",
    "-i", baseConcat,
    "-vf", `subtitles='${ffPath(assPath)}'`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    finalVideo
  ]);

  copyFile(finalVideo, path.join(episodeDir, "xiaohongshu_publish.mp4"));
}

writeTextDeliverables();
render();

console.log("\nDone.");
