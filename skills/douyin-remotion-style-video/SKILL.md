---
name: douyin-remotion-style-video
description: Create Douyin-style Remotion videos, Yunxi voiceover, automatic subtitles, and publishing assets from a Douyin reference link, a requested episode topic, and an optional background music file. Use when the user asks Codex to imitate or learn a Douyin video's visual style and automatically generate a new topic video with Remotion, including Microsoft Edge TTS zh-CN-YunxiNeural narration from the douyin-xiaohongshu-video-producer skill, visible subtitles, a cover image, Douyin title, and publish copy, storing each episode under D:\6.AI\自媒体\AI用法 as 第一期, 第二期, 第三期, etc. If no background music is specified, use D:\6.AI\自媒体\背景音乐_洪荒之力.MOV.
---

# Douyin Remotion Style Video

Use this skill to turn a Douyin reference video into a reusable Remotion-style episode: analyze the reference, create a new numbered episode folder, generate Remotion content for the user's topic, apply the requested or default BGM, generate Yunxi voiceover, create synchronized subtitles, render the subtitled final video, create a cover image, draft Douyin publishing text, and report the output paths.

## Inputs

Require or infer:

- `reference_url`: a Douyin video URL or current in-app browser Douyin page.
- `topic`: the user's requested creative theme/content for this episode.
- `orientation`: default to horizontal `1920x1080` (16:9). Use vertical `1080x1920` only when the user explicitly requests a vertical video.
- `music_path`: optional. If omitted, use `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`.
- `voice`: default to Microsoft Edge TTS `zh-CN-YunxiNeural`, copied/referenced from `D:\Code\AiCoding\MyAI\skills\douyin-xiaohongshu-video-producer-1.0.0\assets\audio`.

Use `D:\6.AI\自媒体\AI用法` as the episode root unless the user explicitly overrides it.

## Workflow

1. Analyze the reference video.
   - Open the Douyin URL in the browser when needed.
   - Capture title, duration, visible layout, color palette, typography style, scene rhythm, subtitle/prompt bar style, and music label if visible.
   - Measure the exact source-recording duration and use it as the target duration for the script, narration, subtitles, and final composition.
   - If direct video playback is blocked, still analyze visible cover/screenshots and ask only for the missing video or screenshots when needed.

2. Preprocess authorized source recordings.
   - Remove or conceal a watermark only when the user owns the recording or explicitly confirms permission. Never remove third-party attribution, provenance, news-source marks, creator signatures, or copyright notices.
   - Inspect opening, middle, and ending frames to locate persistent export watermarks such as FocuSee, screen-recorder, or trial-version corner marks.
   - Prefer, in order: a safe crop that preserves the focal UI; a Remotion mask/cover integrated into the composition; a localized repair only when the surrounding background is simple and the result can be verified.
   - Keep the original recording unchanged. Save a processed copy as `public/source-recording-clean.mp4`, or record the non-destructive mask coordinates in `episode.json` when masking in Remotion.
   - Inspect at least three processed frames. Reject the result if it clips important UI, cursor actions, titles, or browser controls, or if the repair flickers. Fall back to a branded cover badge or the unchanged source and report the limitation.
   - When using a branded mask or cover badge over an authorized export watermark, use the text `阿牛不加班` by default. Replace it only when the user explicitly supplies different brand text.

3. Prepare the episode folder.
   - Run `scripts/New-DouyinRemotionEpisode.ps1` from this skill.
   - Pass `-ReferenceUrl`, `-Topic`, optional `-MusicPath`, and optional `-VoiceSkillPath`.
   - The script creates the next folder under `D:\6.AI\自媒体\AI用法`, such as `第二期`, `第三期`, then creates `remotion_project\public`.
   - It copies the BGM into `public\episode-bgm` with the original extension.
   - It copies Yunxi voice sample files and `audio-manifest.json` from the Xiaohongshu/Douyin producer skill when available.
   - It writes `episode.json` with final video, voiceover, subtitle, cover, and publish-copy paths.

4. Use Remotion.
   - Load the Remotion best-practices skill if available.
   - If a suitable existing Remotion project template exists, copy/adapt its package setup without copying generated outputs or unrelated old source.
   - Otherwise scaffold a blank Remotion project in the episode's `remotion_project`.
   - Build a new composition for the topic and reference style.
   - Default the composition to `1920x1080` (16:9). Switch to `1080x1920` only after an explicit vertical-video request.
   - Play the source recording once from its original first frame at `1x`, without trimming, seeking, speeding up, or looping. When it ends before the composition, display a still of the source's first frame for the remainder.

5. Generate the video content.
   - Produce a concise chapter script focused on the topic's core purpose, strongest differentiators, and practical value. Omit secondary details that do not help the viewer understand or act.
   - Target a final duration close to the source recording, normally within `±10%`. Estimate the word count from the source duration, generate TTS, measure the actual narration duration, and rewrite or shorten the script until it fits. Never extend duration by replaying the source.
   - Match the reference style at the structural level: layout, pacing, visual language, chapter rhythm, text hierarchy, and transitions.
   - Do not copy copyrighted media from the Douyin source. Recreate the style with original UI/graphics, generated-safe visuals, or local assets.
   - Use the copied BGM via Remotion `staticFile()`.

6. Generate voiceover and subtitles.
   - Read `references/voiceover-subtitles.md`.
   - Write a concise narration script for every scene.
   - Generate or capture actual TTS sentence/word boundary timestamps. Build subtitle timings from those audio boundaries, not from evenly distributed scene durations.
   - Generate `旁白音频.webm` with Microsoft Edge TTS `zh-CN-YunxiNeural`, rate `+0%`, pitch `+0Hz`, volume `+0%`.
   - Generate `字幕.srt` automatically from the narration/scene timings.
   - Add visible subtitles to the Remotion composition in the lower safe area above the progress bar.
   - Add narration audio to the composition and keep BGM low enough for speech clarity.
   - If TTS generation fails, stop and report the blocker; do not silently deliver a non-voiceover video.

7. Validate and render.
   - Run lint/type checks when available.
   - Render 2-3 still frames first: opening, middle, ending.
   - Inspect frames for text overflow, blank canvases, incoherent overlap, BGM reference errors, narration reference errors, and subtitle overlap.
   - Verify narration/subtitle synchronization at the opening, middle, and ending, plus every scene boundary. Subtitle onset and removal should normally be within `250ms` of the corresponding spoken phrase, with no accumulating drift.
   - Reject and regenerate the subtitles when text appears before speech, remains after the spoken phrase, skips spoken content, or drifts progressively. Do not render the final MP4 until this check passes.
   - Verify the source recording plays exactly once with no trim or repeated section, then changes to its first-frame still if the composition continues.
   - Render the MP4 into the episode folder, normally as `字幕版成片.mp4`.
   - Optionally also render a no-subtitle preview as `本期成片.mp4` when useful.

8. Create publishing assets.
   - Generate a strong cover image matching the video style, normally `发布封面.png` in the episode folder.
   - Prefer deriving the cover from the Remotion composition with a Still or selected frame, then refine layout/text if needed.
   - Default to a high-impact, futuristic technology aesthetic: dark depth, controlled neon glow, dynamic grid/lines, layered UI or code imagery, and one dominant focal point. Do not deliver a generic presentation-slide cover.
   - Make the topic and viewer benefit understandable within one second. Lead with one short, direct hook in no more than two title lines, then use at most one compact proof/curiosity badge such as a star count, time saving, or concrete capability.
   - Make the cover readable at mobile thumbnail size: very large title, high contrast, clear subject, no clutter, and safe margins. The cover should create a strong reason to keep watching without misleading clickbait or exaggerated claims.
   - Inspect the exported cover at full size and at thumbnail scale. Reject and revise it if the title is not immediately legible, the core topic is vague, the focal point is weak, or decorative effects compete with the hook.
   - Write `发布文案.md` containing:
     - `抖音标题`: 20-35 Chinese characters when possible, benefit-driven and specific.
     - `发布文案`: 1-3 short paragraphs, natural creator voice, clear promise, no exaggerated claims.
     - `话题标签`: 5-8 relevant hashtags.
     - `封面文案`: exact text used on the cover.
     - Voice and BGM notes.

9. Final response.
   - Provide the episode folder path and final MP4 path.
   - Provide the narration audio path and subtitle path.
   - Provide the cover image path and publish copy path.
   - Mention the reference URL, topic, BGM used, voice provider, and voice ID.
   - Mention any verification performed.

## Style Extraction Checklist

Capture these traits from the reference before coding:

- Aspect ratio and canvas: default horizontal 16:9; vertical only on explicit request; preserve safe areas and platform overlay awareness.
- First-screen hook: title size, title placement, object/screenshot placement.
- Palette: dominant background, accent colors, glow/noise/grain/rain/grid effects.
- Scene system: number of chapters, duration per chapter, chapter label pattern.
- Main layout: left explanation, right asset board, bottom prompt bar, subtitles, progress bar.
- Motion: slow zoom, slide-in, flash cuts, timeline sweeps, cursor/tap gestures.
- Audio feeling: tempo, density, low-frequency energy, risers, hit points.

## Output Conventions

- Episode root: `D:\6.AI\自媒体\AI用法\第N期`.
- Remotion project: `D:\6.AI\自媒体\AI用法\第N期\remotion_project`.
- Metadata: `episode.json`.
- Copied BGM: `remotion_project\public\episode-bgm.<ext>`.
- Copied voice samples: `remotion_project\public\voice-yunxi-sample.webm`, `voice-yunxi-sample.wav`, `audio-manifest.json`.
- Narration audio: `旁白音频.webm` in the episode folder.
- Subtitles: `字幕.srt` in the episode folder.
- Final subtitled video: `字幕版成片.mp4` in the episode folder.
- Optional no-subtitle video: `本期成片.mp4`.
- Cover image: `发布封面.png` in the episode folder.
- Publishing text: `发布文案.md` in the episode folder.

## Notes

- Prefer original synthesized/generative visuals and local screenshots/assets over copying Douyin media.
- Treat watermark removal as an authorized source-cleanup operation, preserve the untouched original, and report the method used.
- If the user supplies a BGM path, use it. If they say "用默认背景音乐" or give no BGM, use `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`.
- If the BGM is a video container such as `.MOV`, it is acceptable to reference it as an audio source in Remotion if Chromium can decode it; otherwise convert or extract audio with available local tooling.
- Always use the Yunxi voice unless the user explicitly provides another voice or recording.
- Always configure visible subtitles and generate `字幕.srt`.
- Keep each episode self-contained so it can be reopened later.
- Always align subtitles to measured audio boundaries and validate synchronization before final rendering.
- Keep the narration and final duration close to the original recording. Never trim or repeat the source recording; hold its first frame after one complete playback when needed.
