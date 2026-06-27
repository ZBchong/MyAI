---
name: douyin-xiaohongshu-video-producer
description: Use when creating publish-ready short-form videos for Douyin or Xiaohongshu from user-provided raw screen recordings, clips, images, voice recordings, or episode topics. Produces platform-specific vertical videos, covers, opening hooks, body structure, ending CTA, captions, voiceover scripts, publishing copy, subtitles, and an automatically generated complete prompt template for the episode. Optimized for the user persona 牛一样的程序猿 sharing AI tool tests, workflows, tools,玩法, and creative productivity use cases.
---

# Douyin/Xiaohongshu Video Producer

Create a complete short-video package from raw素材. Default persona:

- Account: 牛一样的程序猿
- Positioning: 重度AI工具使用者 + 生产者
- Content line: AI实测 -> 工作流 | 工具 | 玩法 | 创意
- Signature: 想象力有多大，AI 的能力就有多大
- Tone: 程序员讲人话，真实实测，少营销感，少AI味

## When Triggered

Use this skill whenever the user provides video素材 or asks to make Douyin/Xiaohongshu videos, covers, scripts, captions, or prompt templates for an episode.

## Inputs To Accept

The user may provide any subset of: raw video/screen recording paths, images/screenshots, voice recordings, episode idea/topic, pain point and goal, target platform, and desired CTA.

If platform is not specified, output both Douyin and Xiaohongshu packages when feasible.

## Required Output Package

Save deliverables under the current workspace outputs/<episode_slug>/ directory:

- douyin_publish.mp4: vertical 1080x1920 publish-ready video
- xiaohongshu_publish.mp4: vertical 1080x1440 or 1080x1920 if the same version fits
- cover.jpg: clean cover with account persona
- video_script.md: opening, body, ending, shot list
- voiceover_script.txt: natural Chinese口播稿
- subtitles.srt
- publish_copy.md: Douyin + Xiaohongshu captions and hashtags
- complete_prompt_template.md: the automatically generated prompt/template for the episode
- assets/: optional frames, overlays, audio, and intermediate images

## Default Visual Style

Preserve the user's established video style by default unless they explicitly asks for a different style:

- Use the previous reference style in assets/style-reference/ as the baseline.
- Use a clean white paper/card layout, thin blue top accent line, black headline text, gray supporting text, and light-gray functional UI cards.
- Show the account identity near the top when using cover/opening cards: avatar if available, 牛一样的程序猿, 重度AI工具使用者 + 生产者, AI实测 -> 工作流 | 工具 | 玩法 | 创意.
- Keep the body direct and tutorial-like: one strong headline, one short explanation, then real screen-recording proof.
- Avoid obvious AI visuals: no neon sci-fi, robot mascots, heavy gradients, fake 3D dashboards, or generic AI art unless the user asks.
- Use assets/ending/like-ending-template.mp4 as the default final ending video when available. Do not replace it with a generated static ending card unless the user explicitly asks.

## Workflow

1. Inspect素材
   - Use ffmpeg/ffprobe or equivalent to get duration, resolution, streams, and whether audio exists.
   - Extract 5-8 preview frames from the raw video.
   - Identify usable moments: problem context, 操作过程, result display, CTA-worthy ending.

2. Decide story structure
   - Use a 30-60 second structure unless the user asks otherwise.
   - Recommended sequence: 0-3s hook, 3-8s why it matters, 8-14s method, 14-32s proof, 32-45s outcome, final 3-5s CTA.
   - For Douyin: faster hook, bigger subtitles, clearer CTA.
   - For Xiaohongshu: more tutorial-like cover, more searchable title, caption with steps.

3. Generate the episode complete prompt template automatically
   - Always create complete_prompt_template.md.
   - It must be specific to the episode topic, not generic.
   - Include role, background, target user, tool goal, required features, UI style, data/storage behavior, output format, acceptance criteria, and iteration requests.
   - For software/tool-building episodes, generate a prompt the viewer can paste into an AI coding tool.
   - Use references/prompt-template.md as the schema.

4. Produce visuals
   - Prefer real素材 over synthetic visuals.
   - Use clean cards only for hook, explanation, and ending.
   - Avoid obvious AI style: no neon sci-fi overuse, no generic robot visuals, no heavy gradients, no fake dashboards unless clearly labeled.
   - Make stage changes smooth through consistent typography, spacing, screen zooms, and simple cuts/fades.
   - Follow the established reference style by default: white background, blue top rule, avatar/persona header, large black title, concise gray subtext, and light-gray tool preview cards.
   - For screen-recording demos, keep the full recording visible by default. Only use short smooth zoom-in/zoom-out movements when the cursor moves to, clicks, or pauses on a specific module being explained. Do not keep the recording permanently cropped.
   - Screen-recording narration must follow the cursor and click targets. When the cursor points at categories, filters, cards, buttons, search boxes, or result panels, explain that exact visible item instead of giving generic narration.
   - Screen-recording camera motion should feel like a natural hand-guided tutorial: hold full-screen context first, ease into a short zoom around the cursor/click target, stay just long enough to explain it, then ease back or move smoothly to the next target. Avoid abrupt jumps, permanent crops, and zooms that hide the surrounding context.
   - When common or high-value tools/products appear in the recording, mention a few recognizable names in the voiceover and guide viewers to click through to the official site or try them, as long as those names are visible or strongly implied by the recording.
   - For the final ending, prefer the bundled LIKE ending video template from assets/ending/like-ending-template.mp4.
   - When using the LIKE ending template, add or preserve the ending voiceover CTA: 欢迎评论区留言获取工具生成提示词吧.

5. Audio
   - If user provides their voice, use it as primary voiceover.
   - If no voice is provided, create a temporary TTS voiceover only when the user asks for audio; label it as replaceable.
   - Align narration to the cursor and the visible module. Explain the current module, then leave silence until the cursor moves to the next meaningful module.
   - For screen recordings, write voiceover after observing mouse movement and visible UI changes. The script should read like live commentary: "鼠标现在点到...", "这里切到...", "这几个工具可以重点看...", then pause until the next meaningful cursor target.
   - When the user requests 悟空配音, use the configured 悟空 voice source if available; otherwise use the closest available lively/cartoon Chinese male voice and make the limitation clear.
   - When the user requests 猴哥/悟空/更生动的猴哥声音, first inspect any provided/reference ending audio, then create a lively cartoon-monkey style voice treatment rather than a flat narration: slightly raise pitch, keep speech intelligible, add high-frequency excitement, light compression, tiny vibrato, and preserve low background music. A known stable ffmpeg-style chain is: `asetrate=53760,aresample=48000,atempo=0.93,aexciter=amount=0.75:drive=8.5:freq=5200:ceil=16000,crystalizer=i=1.1:c=1,vibrato=f=5.2:d=0.018,acompressor=threshold=-20dB:ratio=2.8:attack=4:release=70,alimiter=limit=0.95`.
   - Background music must be low volume and not compete with voice.
   - Prefer original/generated simple background beds or user-provided music; avoid copyrighted tracks.

6. Platform packaging
   - Douyin: punchy title, 3-5 hashtags, CTA in last line.
   - Xiaohongshu: searchable title, tutorial steps in caption, 5-8 hashtags, softer CTA.
   - Keep generated files named clearly and link them in the final response.

## Quality Bar

- Text must not overlap or get clipped on mobile.
- Cover should be understandable in 1 second.
- First 3 seconds must name the pain or surprising outcome.
- Video must include real proof from素材 when available.
- Ending must use assets/ending/like-ending-template.mp4 by default when available, with the ending voiceover CTA: 欢迎评论区留言获取工具生成提示词吧. If no ending video template exists, use the same CTA as a spoken or written ending.
- Brand must match persona: 牛一样的程序猿.

## Useful References

- references/persona-and-style.md
- references/video-structure.md
- references/prompt-template.md
- assets/style-reference/: previous approved video style reference frames
- assets/ending/like-ending-template.mp4: approved final LIKE ending video
