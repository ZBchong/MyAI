---
name: douyin-remotion-style-video
description: Create Douyin-style Remotion videos and publishing assets from a Douyin reference link, a requested episode topic, and an optional background music file. Use when the user asks Codex to imitate or learn a Douyin video's visual style and automatically generate a new topic video with Remotion, plus a good cover image, Douyin title, and publish copy, storing each episode under D:\6.AI\自媒体\AI用法 as 第一期, 第二期, 第三期, etc. If no background music is specified, use D:\6.AI\自媒体\背景音乐_洪荒之力.MOV.
---

# Douyin Remotion Style Video

Use this skill to turn a Douyin reference video into a reusable Remotion-style episode: analyze the reference, create a new numbered episode folder, generate the Remotion project/content for the user's topic, apply the requested or default BGM, render the final video, create a cover image, draft Douyin publishing text, and report the output paths.

## Inputs

Require or infer:

- `reference_url`: a Douyin video URL or current in-app browser Douyin page.
- `topic`: the user's requested creative theme/content for this episode.
- `music_path`: optional. If omitted, use `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`.

Use `D:\6.AI\自媒体\AI用法` as the episode root unless the user explicitly overrides it.

## Workflow

1. Analyze the reference video.
   - Open the Douyin URL in the browser when needed.
   - Capture title, duration, visible layout, color palette, typography style, scene rhythm, subtitle/prompt bar style, and music label if visible.
   - If direct video playback is blocked, still analyze visible cover/screenshots and ask only for the missing video or screenshots when needed.

2. Prepare the episode folder.
   - Run `scripts/New-DouyinRemotionEpisode.ps1` from this skill.
   - Pass `-ReferenceUrl`, `-Topic`, and optional `-MusicPath`.
   - The script creates the next folder under `D:\6.AI\自媒体\AI用法`, such as `第二期`, `第三期`, then creates `remotion_project\public`.
   - It copies the BGM into `public\episode-bgm` with the original extension and writes `episode.json`.

3. Use Remotion.
   - Load the Remotion best-practices skill if available.
   - If a suitable existing Remotion project template exists, copy/adapt its package setup without copying generated outputs or unrelated old source.
   - Otherwise scaffold a blank Remotion project in the episode's `remotion_project`.
   - Build a new composition for the topic and reference style.

4. Generate the video content.
   - Produce a concise chapter script for the user's topic.
   - Match the reference style at the structural level: layout, pacing, visual language, chapter rhythm, text hierarchy, and transitions.
   - Do not copy copyrighted media from the Douyin source. Recreate the style with original UI/graphics, generated-safe visuals, or local assets.
   - Use the copied BGM via Remotion `staticFile()`.

5. Validate and render.
   - Run lint/type checks when available.
   - Render 2-3 still frames first: opening, middle, ending.
   - Inspect frames for text overflow, blank canvases, incoherent overlap, and BGM reference errors.
   - Render the MP4 into the episode folder, normally as `本期成片.mp4` or a clear topic-specific filename.

6. Create publishing assets.
   - Generate a strong cover image matching the video style, normally `发布封面.png` in the episode folder.
   - Prefer deriving the cover from the Remotion composition with a Still or selected frame, then refine layout/text if needed.
   - Make the cover readable at mobile thumbnail size: one short title, high contrast, clear subject, no clutter.
   - Write `发布文案.md` containing:
     - `抖音标题`: 20-35 Chinese characters when possible, benefit-driven and specific.
     - `发布文案`: 1-3 short paragraphs, natural creator voice, clear promise, no exaggerated claims.
     - `话题标签`: 5-8 relevant hashtags.
     - `封面文案`: exact text used on the cover.

7. Final response.
   - Provide the episode folder path and final MP4 path.
   - Provide the cover image path and publish copy path.
   - Mention the reference URL, topic, and BGM used.
   - Mention any verification performed.

## Style Extraction Checklist

Capture these traits from the reference before coding:

- Aspect ratio and canvas: horizontal/vertical, safe areas, Douyin overlay awareness.
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
- Final video: keep inside the episode folder, not only inside the project build folder.
- Cover image: `发布封面.png` in the episode folder.
- Publishing text: `发布文案.md` in the episode folder.

## Notes

- Prefer original synthesized/generative visuals and local screenshots/assets over copying Douyin media.
- If the user supplies a BGM path, use it. If they says "用默认背景音乐" or gives no BGM, use `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`.
- If the BGM is a video container such as `.MOV`, it is acceptable to reference it as an audio source in Remotion if Chromium can decode it; otherwise convert or extract audio with available local tooling.
- Keep each episode self-contained so it can be reopened later.
