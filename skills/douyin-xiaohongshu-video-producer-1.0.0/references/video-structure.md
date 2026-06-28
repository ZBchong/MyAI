# Video Structure

## Default Length

Do not force a 30s or 45s cap. Use the duration needed to explain the real recording clearly. A concise tool demo commonly lands between 60s and 120s.

The pacing target:

- Opening: clear but not rushed.
- Screen recording: efficient, module-by-module, matched to cursor movement.
- Ending: calm enough for the CTA to be understood.

## Default Sequence

1. Hook card, 10-16s  
   State the pain or surprising result. Show the real tool screenshot, not a fake feature strip. Add a subtle left-to-right sweep-light effect across the top text area. Put the short bridge into the demo here; default voiceover/subtitle: “废话不多说，直接看演示效果吧”.

2. Screen-recording proof, 40-90s  
   Use the actual recording. Segment by visible modules, cursor pauses, clicks, scrolls, and result panels.

3. Summary card, 8-14s  
   Explain what the tool solves and what it does not solve. For finance, include risk/disclaimer framing.

4. Final CTA card, 4-7s  
   Use the standard comment CTA and support/follow visual copy.

Do not create a separate “真实录屏 / 直接看操作 / 鼠标点到哪我就讲到哪” intro page by default. Use “废话不多说，直接看演示效果吧” as the default bridge line and merge it into the first hook card.

## Condensing Slow Recording

- If early recording time is mostly setup, compress it into one or two cards plus spoken summary.
- Do not spend a long time showing idle scrolling, loading, or unclear setup.
- Preserve the parts where the user can see the tool’s real effect.

## Screen Recording Rhythm

- Show full context first.
- Ease into zoom around the mouse or target module.
- Hold just long enough for the narration.
- Move smoothly to the next target.
- Avoid abrupt jumps unless they are intentional cuts between unrelated sections.
- Never let the camera zoom conflict with the subtitle or voiceover rhythm.
- Use the Episode 4 two-level proof layout for every screen-recording explanation section: upper original recording with an orange tracking rectangle plus lower readable zoom of that same tracked region. Do not shrink the recording into a small screenshot inside a decorative card.
- Use the Episode 5 final render geometry as the default layout target: upper context frame about `40,260,1000,560`; lower zoom frame about `40,930,1000,590`; subtitle safe area above the bottom progress bar; progress bar at the bottom and filling over time.
- The upper context and lower zoom must both come from the actual screen recording whenever the recording contains real module changes. Static screenshots are only for hook, transition, summary, or slow setup compression.
- The upper recording is the original context view. It must visibly show the tracked region with an orange rectangle so viewers understand where the lower zoom comes from.
- The lower zoom must correspond to the tracked region in the upper recording. If the rectangle points to a list, table, chart, card, or panel, the lower zoom must show that same list, table, chart, card, or panel enlarged.
- The upper recording should preserve the original screen recording context and natural aspect ratio like the reference screenshot; do not force it to fill the frame if doing so cuts useful context.
- The lower zoom should enlarge the same tracked region from the upper view. It may keep reasonable dark/background padding when the tracked crop aspect ratio does not match the lower frame. The goal is readable, spatially matched proof, not mechanical full-frame filling.
- The lower zoom label should be short, usually `放大看这里`, placed near the top-left of the lower frame. Do not append explanatory text after it.
- Every proof segment must have a specific module title and a short guidance line that matches the zoom target and narration. If the narration discusses schedules, the zoom must show schedules; if it discusses predictions, the zoom must show prediction cards.
- QC must include start/middle/end proof-stage frames and compare them to Episode 4 reference frames. If the proof section is not readable or not visually similar in layout density to Episode 4, rebuild before delivery.
- Treat the Episode 4 screen-recording layout as mandatory production grammar, not a visual option. A render fails if the proof stage becomes a small screenshot card, mostly decorative empty background, or a zoom target that does not match the spoken point.
- A render also fails if the upper or lower demo frame becomes a tiny centered thumbnail, the zoom target is unreadable, or the padding comes from a wrong crop/scale choice. Intentional background padding is acceptable when it preserves the complete original context or tracked content.
- A render fails if the upper proof view has no orange tracking rectangle, or if the lower zoom is not the same area marked by that rectangle.

## Subtitle Burn-In QC

- Create an explicit subtitle time axis before burning subtitles into the video.
- Verify the SRT/ASS text before and after final render.
- Subtitles must match the spoken words for the same time range.
- Reject one-character leftovers such as `接` or `要`, split English tokens such as `A` / `I`, and any line-ending sentence punctuation.
- If subtitle text QC fails, fix the subtitle plan and rerender. Do not patch only the sidecar SRT while leaving incorrect burned-in subtitles in the video.

## Progress Bar Rule

- The bottom progress bar is an in-video design element, not the system player bar.
- It should be thin, colorful, and visible throughout.
- It must fill according to elapsed video time, starting near empty, reaching about half-width around the middle, and nearly full near the end.
- Verify start, middle, and end frames before delivery.

## Ending

Default ending content:

- Voiceover: 要是觉得这个工具不错，欢迎大家评论区留言。
- Visual: 感谢大家支持，多多点赞收藏加关注吧！

Do not append the old LIKE ending clip unless the user explicitly asks for it again.
