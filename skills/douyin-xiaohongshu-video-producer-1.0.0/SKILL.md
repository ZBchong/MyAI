---
name: douyin-xiaohongshu-video-producer
description: Two-stage AI工具自媒体 workflow for 牛一样的程序猿. Use when the user provides a screen recording/topic to generate a publish-ready vertical video package, or after the user explicitly confirms the final delivery and asks to proceed with Douyin publishing. Stage 1 automatically inspects the recording, creates an episode folder under D:\6.AI\自媒体, generates one shared 1080x1920 video for Douyin/Xiaohongshu using the approved dark spark-particle template, and lists all delivery files in the chat. Stage 2 must not start until the user confirms the final effect is OK; then prepare Douyin upload at creator.douyin.com, fill fields from the delivery package, and stop before the final publish button so the user can click it.
---

# Douyin/Xiaohongshu Video Producer

Produce a complete short-video delivery package for the account **牛一样的程序猿**.

Default positioning:

- Account: 牛一样的程序猿
- Persona: 重度 AI 工具使用者 + 生产者
- Content line: AI 实测 -> 工作流 | 工具 | 玩法 | 创意
- Signature: 想象力有多大，AI 的能力就有多大
- Tone: 程序员讲人话，真实实测，直切要点，少营销感

## Core Rule

When the user provides only a screen recording, automatically use this skill. Treat the recording as the source of truth: infer the tool, topic, visible modules, mouse path, important clicks, and usable proof moments. The topic/content changes between episodes, but the approved video template, delivery structure, and quality bar stay the same unless the user explicitly asks for a different style.

Before every Stage 1 generation, read `references/episode5-final-template.md` and treat it as the latest production contract. The user should not need to repeat Episode 5 style requirements again.

Before every Stage 1 generation, also read `references/audio-reproducibility.md`. Use the packaged default audio assets in `assets/audio/` so another computer can reproduce the same BGM choice and the same default TTS voice settings after installing the skill.

This is a two-stage workflow:

1. Stage 1: generate the video delivery package and list every delivery file in the conversation.
2. Stage 2: only after explicit user confirmation, prepare the Douyin upload flow. Never click the final publish button.

Do not enter Stage 2 because the video files exist. Do not treat silence as approval. Only proceed when the user clearly says the final delivery is OK and asks to publish or upload to Douyin, such as “没问题，发布到抖音”, “确认，进入第2步”, or “可以上传抖音”.

## Output Location

Save every episode under:

`D:\6.AI\自媒体\AI工具第N期`

- If the user names an existing episode folder, use it.
- If no episode number is given, scan `D:\6.AI\自媒体` and create the next `AI工具第N期` folder.
- Put all final outputs, source copies, generated docs, render assets, and QC frames inside that episode folder.
- Keep intermediate files under `assets/` inside the episode folder.

## Required Deliverables

Always create or refresh:

- `douyin_publish.mp4`: final vertical 1080x1920 video.
- `xiaohongshu_publish.mp4`: same bytes as `douyin_publish.mp4`; do not make a separate Xiaohongshu video by default.
- `cover.jpg`: final common cover using the approved dark spark style; use this for the Douyin vertical/common cover upload.
- `douyin_cover_horizontal_4x3.jpg`: Douyin horizontal cover, JPG, 4:3 ratio, recommended 1440x1080. Crop from the cover's top title area so the category ribbon, main title, and supporting line are fully visible.
- `video_script.md`: final shot list, style rules, and risk notes.
- `voiceover_script.txt`: natural Chinese voiceover script.
- `subtitles.srt`: subtitles matching the spoken words exactly.
- `publish_copy.md`: Douyin and Xiaohongshu publish copy.
- `complete_prompt_template.md`: episode-specific reusable prompt for viewers.
- `delivery_readme.md`: final file list, style notes, and QC summary.
- `assets/`: source copies, screenshots, clips, audio, subtitles, QC frames, and render metadata.

Also create or refresh a unified delivery folder:

- `交付文件/`: copy the final publish videos, cover files, scripts, subtitles, publish copy, prompt template, and delivery readme into this folder.
- Keep optional experiments, rebuilt files, and render intermediates outside `交付文件/` unless the user explicitly asks to include them.

## Stage 1 Response Protocol

After Stage 1 is complete, the final chat response must:

- State the episode folder and the unified `交付文件/` folder.
- List all files inside `交付文件/` with clear labels and clickable local links when possible.
- Explicitly list the two cover files: `cover.jpg` for the common/vertical upload, and `douyin_cover_horizontal_4x3.jpg` for the Douyin horizontal `4:3` cover slot.
- State whether `douyin_publish.mp4` and `xiaohongshu_publish.mp4` are byte-identical or have matching SHA256.
- Mention any non-final extra files that were intentionally left outside the delivery folder.
- List the Stage 1 generation cost summary: overall elapsed wall-clock time for producing the delivery package, and total token usage for the generation workflow. Record a start time before material inspection/rendering and an end time before the final response. If exact token usage is not exposed by the runtime, explicitly say the exact token count is unavailable in the current runtime instead of inventing a number.
- End by asking the user to confirm the final effect before Stage 2. Use this gate clearly: `确认最终交付效果没问题后，我再进入第2步抖音上传流程。`

Do not open Douyin Creator or begin upload preparation in the same response as Stage 1 unless the user already gave explicit approval after reviewing the final delivery.

## Approved Visual Template

Use this style by default:

- Canvas: vertical 1080x1920, 30 fps, H.264 MP4.
- Background: near-black tech background with rising spark/particle animation. Use orange, warm yellow, pink, and small cyan/blue accents. Keep particles moving subtly throughout cards and covers.
- Typography: large orange/yellow high-contrast Chinese headline, short supporting lines, no crowded paragraphs.
- Top label: slim orange-to-pink gradient ribbon for category or episode tag.
- Cover and first frame: must be eye-catching and show the actual tool. Replace pure text feature strips with a real screenshot from the recording, add a style-matching stroke/glow, and apply subtle breathing/scale movement in video.
- In the opening/hook video card, the top text area must include a left-to-right sweep-light effect across the top label, main title, and supporting title text. The sweep should be subtle and premium: no visible rectangular outline, no harsh white block, and no text readability loss.
- Stage 1 must export exactly two cover images by default: `cover.jpg` as the common/vertical cover, and `douyin_cover_horizontal_4x3.jpg` as a 4:3 horizontal crop. The horizontal cover should focus on the top title area and keep the ribbon, headline, and support line complete; do not show a tiny full vertical poster inside the horizontal canvas.
- Motion: key title text and CTA text may use breathing-light glow or slight scale/alpha pulsing. Do not add a visible rectangular outer frame around breathing text.
- Bottom progress bar: add a thin colorful author-style progress bar at the bottom. It must fill over time according to the actual video duration; it must not start full.
- Do not use beige paper cards, white landing-page cards, generic AI robot art, fake dashboards, or unrelated decorative visuals unless explicitly requested.

Use `references/persona-and-style.md` for detailed style guidance. Inspect `assets/style-reference/episode5-final-*.jpg` and `assets/style-reference/episode4-spark-*.jpg` before rendering when available. Episode 5 reference frames are the latest standard.

## Story Structure

Do not force a 45-second limit. Match the duration to the real recording and the amount of explanation needed. Prefer clear normal speech over rushed compression.

Default sequence:

1. Hook card: 10-16s. Strong pain/result title, real tool screenshot, short premise, and the brief bridge into the operation. Default bridge voiceover/subtitle: `废话不多说，直接看演示效果吧`. Put this line in the first hook card instead of making a separate intro page.
2. Screen-recording proof: multiple segments. Follow the mouse and visible modules.
3. Summary card: 8-14s. State what the tool actually solves and what it does not solve.
4. Final CTA card: 4-7s. Ask viewers to comment; show support/follow copy.

For static or slow early screen recording, condense it into one or two visual cards plus spoken summary. Save detailed time for real operation, visible results, and useful proof.

Do not create a standalone “真实录屏 / 直接看操作 / 鼠标点到哪我就讲到哪” transition card by default. If a bridge is needed, use `废话不多说，直接看演示效果吧` as the default spoken/subtitle line in the first hook/cover-style card.

Use `references/video-structure.md` for the full structure checklist.

## Screen-Recording Treatment

- Use real recording material as proof whenever available.
- Preserve clarity. Avoid blurry scale-ups and permanent crops.
- Start each meaningful segment with enough full-screen context for orientation.
- Ease into a short zoom around the cursor, clicked control, selected card, chart, button, search field, or result panel.
- Keep the zoom only as long as needed to explain the visible item, then ease back or move to the next target.
- Match narration, subtitles, and camera motion. If the cursor points to a module, the voiceover must discuss that module.
- For callout labels, use concise labels such as `放大看这里`; do not append long explanatory text after that label.
- Remove unrelated ending copy or generic prompts that do not match the episode.

Mandatory Episode-4 screen-recording style:

- The confirmed Episode 4 screen-proof layout is the default and must be followed for all later episodes unless the user explicitly changes the style.
- During the screen-recording explanation stage, the real recording must be the main visual content, not a small decorative screenshot inside a card.
- Use the exact Episode 4 proof grammar by default: the upper view shows the original screen recording for context and overlays an orange tracking rectangle on the module currently being explained; the lower view is a magnified crop of that exact tracked rectangle/area.
- Use the Episode 5 final proof geometry as the default layout target: upper original-recording area around `x=40,y=260,w=1000,h=560`, lower zoom area around `x=40,y=930,w=1000,h=590`, and bottom progress bar around `y=1912,h=8`. Adjust when the source recording aspect ratio or target module needs a different scale.
- The upper view must not be just another cropped zoom. It is the original recording view with a visible tracking frame, so the viewer can understand where the zoom comes from.
- The lower zoom must follow the cursor, selected tab, clicked card, list, table, chart, or result panel, and it must correspond spatially to the orange tracking rectangle in the upper view.
- Keep both views readable. The upper context view should show the original screen recording completely enough for orientation, preserving the source aspect ratio and UI context like the user reference screenshot. Do not force-crop the upper view merely to fill the frame if that cuts away useful original context.
- The lower zoom view should enlarge the exact orange-tracked area from the upper view. It does not need to completely fill the lower blue frame; reasonable dark/background padding is acceptable when preserving the tracked content is clearer. The failure case is meaningless tiny footage centered in a large empty box, unreadable target text, or padding caused by choosing the wrong crop/scale.
- The lower zoom label should stay short, such as `放大看这里`, positioned like the Episode 4 reference near the top-left of the lower zoom region. Do not add long instructional copy after the label.
- The module title, short guidance text, highlighted area, zoom target, subtitle, and spoken narration must describe the same thing at the same moment.
- Static screenshots may be used for hook, transition, summary, and slow setup compression only. They must not replace the proof-stage screen-recording motion when the recording contains real module changes.
- Before delivery, compare proof-stage frames against Episode 4 reference frames such as `assets/qc_spark_style_full/screen_today.jpg` and `screen_sector.jpg`. If the proof stage looks like a small screenshot card instead of the Episode 4 large-context-plus-zoom layout, it fails QC and must be rebuilt.
- The proof stage is not a loose style suggestion. For every later episode, when only the topic/content changes, keep the Episode 4 proof grammar: real recording as the dominant visual, upper original recording with orange tracking rectangle, lower readable zoom of the same tracked region, synchronized label/subtitle/voiceover, and no tiny screenshot-card replacement.
- If a proof-stage frame contains mostly decorative background, a small centered screenshot, or a zoom that does not match the spoken module, treat the render as failed even if the video technically exports.
- If the proof-stage recording looks like a tiny centered thumbnail, the lower zoom is not readable, or the upper view loses the original recording context, treat it as a style failure and rebuild the crop/scale. Do not treat intentional background padding as a failure when it matches the reference screenshot and helps preserve the complete tracked content.
- If the upper view lacks the orange tracking rectangle, or the lower zoom does not show the same region indicated by that rectangle, treat it as a style failure and rebuild.

## Voiceover And Subtitles

- Write the voiceover after inspecting the recording and mouse movement.
- Use conversational Chinese: clear, natural, slightly lively, and close to normal human speed. It can be a little brisk, but never rushed.
- Do not over-explain concepts before the demo. Get to the real operation quickly.
- Avoid unsupported claims. For financial topics, do not imply guaranteed profits, recommendations, or predictions; present the tool as information organization and risk review.
- If the user provides a voice recording, use it as the primary voice.
- If no voice is provided, generate the voiceover with Microsoft Edge TTS `zh-CN-YunxiNeural`, rate `+0%`, pitch `+0Hz`, and volume `+0%`. Use `assets/audio/voice-yunxi-sample.webm` or `assets/audio/voice-yunxi-sample.wav` as the timbre reference.
- Background music is now part of the default delivery. If the user provides a background-audio file for the episode, use that file first. If the user does not provide one, use the packaged skill asset `assets/audio/default-bgm-honghuangzhili.m4a` by default. Only use `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV` as a legacy local fallback when the packaged asset is unavailable.
- Mix background music at low volume with fade-in/fade-out and voice ducking/sidechain compression so narration stays clear. Note the selected BGM source, SHA256 when available, voice ID, voice sample reference, and mix treatment in `delivery_readme.md`.
- Subtitles must match the spoken words exactly.
- Subtitle lines must not end with Chinese or English sentence punctuation such as `。`, `！`, `？`, `.`, `!`, `?`.
- Place subtitles above the progress bar and within the safe area. They must not sit too low or overlap UI.
- Build an explicit subtitle time axis before burning subtitles into the video. Do not rely on unchecked automatic character splitting.
- Before final render, text-QC the generated SRT/ASS: no single-character fragments such as `接` or `要`, no split English tokens such as `A` and `I` on separate lines, no sentence punctuation at line ends, and every subtitle block must correspond to the actual spoken phrase for that time range.
- If subtitles fail the text QC after burn-in, fix the subtitle plan and rerender the final video. Never deliver a video whose visible subtitles differ from the voiceover.

## Ending Rule

Default ending:

- Do not append the old LIKE ending video.
- Use a custom final CTA card in the same dark spark style.
- Spoken CTA: `要是觉得这个工具不错，欢迎大家评论区留言。`
- Visual CTA: `感谢大家支持，多多点赞收藏加关注吧！`
- Keep ending copy relevant to the current episode. Do not mention unrelated tools, unrelated prompts, or unrelated tasks.

If the user gives a different CTA, use the user CTA while preserving the same visual style and natural speech.

## Implementation Scripts

Use the bundled scripts as production guardrails:

- `scripts/render_episode5_final_reference.ps1`: canonical reference render script from the approved Episode 5 delivery. For new episodes, copy it into the episode `assets/` folder and replace only episode paths, source video, optional user-provided BGM override, card images, TTS script, and segment manifest. Preserve the hook sweep-light overlay, two-level proof-stage filter grammar, subtitle safe area, progress bar overlay, BGM ducking, stats JSON, and delivery-copy behavior unless the user explicitly changes the style. Default BGM must resolve to the packaged skill asset `assets/audio/default-bgm-honghuangzhili.m4a` when the user does not provide audio.
- `scripts/check_delivery.ps1`: run this after the final render with `-EpisodeDir <episode> -Strict`. Treat any error as a delivery blocker. Keep the generated QC JSON/frames under the episode `assets/` folder.

When creating a custom render script for a new episode, keep it in that episode's `assets/` folder and make it equivalent to the Episode 5 final reference: same visual grammar, same final filenames, same delivery folder, same QC expectations. Do not fall back to a small screenshot-card render.

## Publishing Copy

- Douyin: punchy title, short pain/result copy, 3-5 hashtags, comment CTA.
- Xiaohongshu: searchable title, short step-style description, 5-8 hashtags, softer comment CTA.
- The video file is shared by both platforms unless explicitly requested otherwise.
- Keep risk/disclaimer lines for financial, medical, legal, or other sensitive topics.

## Stage 2 Douyin Publishing Gate

Only execute this stage after the user confirms the final delivery effect is OK.

Use `references/douyin-publish-flow.md` for the upload flow. The target URL is:

`https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web`

Automation boundary:

- Open the upload page and handle navigation, file selection, title, description, hashtags, cover selection, and basic checks.
- For login, QR scan, captcha, account selection, identity verification, or security prompts, open Google Chrome for the user by default and ask the user to complete verification there. Prefer Chrome for all login/verification steps even if upload automation is being controlled through another browser.
- Stop before the final publish action. The final publish/confirm button click must be performed by the user.
- In the final response for Stage 2, say exactly what has been filled and tell the user the page is ready for their final click.

## Complete Prompt Template

Always generate `complete_prompt_template.md`. It must be specific to the episode, not generic.

For software/tool-building episodes, create a prompt viewers can paste into an AI coding assistant. Include role, background, target user, tool goal, functional requirements, data/storage behavior, UI style, technical requirements, acceptance criteria, and output format.

Use `references/prompt-template.md` as the schema.

## Quality Check

Before final response, verify:

- Final video opens and has expected duration, 1080x1920 resolution, and audio stream.
- `douyin_publish.mp4` and `xiaohongshu_publish.mp4` are byte-identical or have the same SHA256.
- Background music is present. Verify the selected source follows this priority: user-provided episode audio first, otherwise packaged `assets/audio/default-bgm-honghuangzhili.m4a`, otherwise legacy local `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV` only if available. Confirm low-volume mix, fade-in/fade-out, and voice ducking.
- Opening, cover, and first frame use the approved dark spark style and real tool screenshot.
- Opening top text area has a visible left-to-right sweep-light effect in the video render, while remaining readable and without an outer frame.
- Cover files exist: `cover.jpg` for common/vertical upload and `douyin_cover_horizontal_4x3.jpg` as a JPG horizontal 4:3 cover.
- Bottom progress bar visibly advances over time. Check frames near the start, middle, and end.
- Subtitles match voiceover and have no sentence punctuation at line ends.
- Subtitles have no one-character leftovers or broken English tokens from automatic wrapping.
- Text is not clipped, not too low, and does not overlap the progress bar.
- Screen-recording zooms follow the cursor and visible UI modules.
- Final CTA voice and visual copy are present.
- Delivery docs match the actual final video.
- Run `scripts/check_delivery.ps1 -EpisodeDir <episode> -Strict` when local execution is available, and mention the result in `delivery_readme.md`.

## Useful References

- `references/persona-and-style.md`: persona, tone, cover, colors, CTA.
- `references/video-structure.md`: shot structure and screen-recording rhythm.
- `references/episode5-final-template.md`: latest approved Episode 5 production contract and QC standard.
- `references/audio-reproducibility.md`: default voice, voice sample, packaged BGM, hashes, and mix settings for portable installs.
- `references/prompt-template.md`: complete prompt template schema.
- `references/douyin-publish-flow.md`: confirmed Stage 2 Douyin upload flow.
- `assets/style-reference/`: approved visual reference frames.
- `scripts/render_episode5_final_reference.ps1`: reference implementation for the approved render grammar.
- `scripts/check_delivery.ps1`: reusable final-package QC script.
