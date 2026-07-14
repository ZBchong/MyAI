# Remotion Episode Pattern

Use this pattern for Douyin-style knowledge/workflow videos:

1. `src/Root.tsx`: register one composition named after the topic.
2. `src/<TopicComposition>.tsx`: keep script data, scene data, visual components, and Remotion animation code together unless it becomes large.
3. `public/episode-bgm.<ext>`: use with `staticFile("episode-bgm.<ext>")`.
4. Render stills before MP4:
   - frame near 1s
   - middle chapter frame
   - ending frame
5. Render final MP4 into the episode folder.
6. Render or create a cover image as `发布封面.png`.
7. Write Douyin publish assets as `发布文案.md`.
8. Generate narration with `zh-CN-YunxiNeural`, write `字幕.srt`, and render `字幕版成片.mp4`.

Recommended 78-second structure:

- 0-8s: hook/title.
- 8-20s: concept 1.
- 20-32s: concept 2.
- 32-45s: concept 3.
- 45-58s: workflow/result.
- 58-70s: AI/automation angle.
- 70-78s: summary/call to action.

For the reference style used in this user's examples, prefer:

- dark cinematic background;
- large left title and concise bullets;
- right-side asset board/code board/workflow diagram;
- bottom prompt/instruction bar;
- cyan/blue/amber/red accents;
- slow slide/zoom motion and chapter flashes;
- no copied Douyin video or music.
- default narration voice: Microsoft Edge TTS `zh-CN-YunxiNeural`.
- visible subtitles in the lower safe area, above the progress bar.

Publishing asset pattern:

- Cover title: 6-14 Chinese characters, big and crisp.
- Cover subtitle: optional, one short supporting line.
- Douyin title: lead with the concrete value, such as "用 Remotion 把视频做成代码模板".
- Publish copy: explain what viewers will learn, then invite saving/following naturally.
- Hashtags: include topic tags, tool tags, and audience tags.
