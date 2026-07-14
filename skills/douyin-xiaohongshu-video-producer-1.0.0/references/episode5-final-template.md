# Episode 5 Final Template Contract

Use this contract as the latest production standard for every new AI tool episode unless the user explicitly asks for a different style.

## Default Outcome

- Generate one shared 1080x1920 MP4 for Douyin and Xiaohongshu.
- Generate exactly two covers by default: `cover.jpg` and `douyin_cover_horizontal_4x3.jpg`.
- Put all final files in `交付文件/`.
- Keep the workflow in Stage 1 until the user confirms the final effect is OK.

## Visual Contract

- Use the dark spark-particle background from Episode 5: near black base, warm orange/yellow title, pink-orange ribbon, small cyan/blue spark accents.
- Use a real screenshot from the current recording on the cover and first frame. Do not use fake feature strips.
- Add a subtle left-to-right sweep-light effect over the opening top text area. It must cover the top label, main title, and supporting title area. It must not create a visible rectangular frame or wash out the text.
- Add subtle breathing or scale movement to the hook screenshot/title and CTA text.
- Add the in-video bottom progress bar at `y=1912`, height about `8px`, filling from left to right over the real video duration.

## Opening Contract

- The first card contains the hook, real tool screenshot, and the bridge into the demo.
- Do not create a separate transition card like `真实录屏 / 直接看操作 / 鼠标点到哪我就讲到哪`.
- Default bridge voiceover and subtitle: `废话不多说，直接看演示效果吧`.
- The bridge line must be spoken and shown in the same time range.

## Screen Proof Contract

The screen-recording explanation stage must use the Episode 4/5 proof grammar:

- Upper view: the original recording context, preserving enough of the source screen to understand where the tracked module sits, with an orange tracking rectangle on the active module.
- Lower view: a readable magnified crop of the exact same tracked area.
- Default Episode 5 geometry: upper frame around `x=40,y=260,w=1000,h=560`; lower frame around `x=40,y=930,w=1000,h=590`.
- The lower label should be short, usually `放大看这里`.
- Do not add long text after `放大看这里`.
- Do not mechanically force both proof areas to fill their frames. Follow the reference screenshot: the upper area should show the original recording cleanly and completely enough for orientation; the lower area should clearly enlarge the orange-tracked content. Reasonable dark/background padding is acceptable. Tiny centered footage, unreadable zoom targets, or large empty space caused by a wrong crop/scale fail QC.
- The narration, subtitle, module title, orange tracking rectangle, and lower zoom must describe the same module at the same moment.
- Static screenshots can compress slow setup, hook, summary, or CTA, but they must not replace real proof-stage screen motion when the recording contains actual module changes.

## Voice And Subtitle Contract

- Use natural conversational Chinese close to a real person. It may be slightly brisk, but never rushed.
- Put the demo quickly after the hook. Avoid long concept explanation before proof.
- Subtitles must match the spoken words exactly.
- Subtitle lines must not end with `。`, `！`, `？`, `.`, `!`, or `?`.
- Reject single-character fragments and split English tokens.
- Keep subtitles above the progress bar and inside the safe area.

## Audio Contract

- If the user provides a background music file, use it.
- If no episode BGM is provided, default to the packaged skill asset `assets/audio/default-bgm-honghuangzhili.m4a`.
- Use legacy local `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV` only when the packaged asset is unavailable.
- Mix BGM low with fade-in/fade-out and ducking/sidechain compression under voice.
- If no user voice recording is provided, generate the voice with Microsoft Edge TTS `zh-CN-YunxiNeural`, rate `+0%`, pitch `+0Hz`, volume `+0%`. Use `assets/audio/voice-yunxi-sample.webm` or `assets/audio/voice-yunxi-sample.wav` as the timbre reference.
- Read `references/audio-reproducibility.md` for the exact voice sample hashes, packaged BGM hash, and mix settings.

## Ending Contract

- Do not append the old LIKE ending clip.
- Default spoken CTA: `要是觉得这个工具不错，欢迎大家评论区留言`.
- Default visual CTA: `感谢大家支持，多多点赞收藏加关注吧！`.
- Do not show unrelated prompts, unrelated tools, or generic copy that does not match the episode.

## Required QC

Before delivery, verify and record:

- Both publish videos exist and match by SHA256.
- Video is 1080x1920, about 30fps, and has an audio stream.
- BGM source, BGM SHA256 when available, voice ID, voice sample reference, and ducking treatment are documented.
- Opening sweep-light moves between early hook frames.
- Bottom progress bar width increases between start, middle, and end frames.
- Proof-stage frames match the Episode 5 reference density: upper original recording with orange tracking rectangle plus lower matching zoom.
- SRT text has no line-ending sentence punctuation, no single-character fragments, and matches the voiceover.
- `delivery_readme.md` lists delivery files, QC summary, elapsed time, and token availability.
