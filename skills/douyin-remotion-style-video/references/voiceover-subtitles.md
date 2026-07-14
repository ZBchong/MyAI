# Voiceover And Subtitles

Use this reference for every episode produced by `douyin-remotion-style-video`.

## Default Voice

Use the same voice configuration as `D:\Code\AiCoding\MyAI\skills\douyin-xiaohongshu-video-producer-1.0.0`:

- Provider: Microsoft Edge TTS
- Voice ID: `zh-CN-YunxiNeural`
- Rate: `+0%`
- Pitch: `+0Hz`
- Volume: `+0%`
- Preferred raw output: `WEBM_24KHZ_16BIT_MONO_OPUS`
- Sample files copied into `remotion_project\public`:
  - `voice-yunxi-sample.webm`
  - `voice-yunxi-sample.wav`
  - `audio-manifest.json`

The samples are only timbre references. Generate full narration for the current episode with `zh-CN-YunxiNeural`.

## Required Episode Assets

Each episode must include:

- `旁白音频.webm`: full generated narration.
- `字幕.srt`: caption file aligned to narration and visual chapters.
- `字幕版成片.mp4`: final rendered video with visible subtitles.
- `episode.json`: record voice provider, voice ID, sample files, narration path, subtitle path, and mix settings.

## Narration Script

Before rendering, write a concise narration script from the scene plan.

Rules:

- Speak like a practical AI tool creator, not like an ad.
- Keep each subtitle cue to 12-22 Chinese characters when possible.
- Prefer short spoken sentences.
- Match narration to the current visual scene.
- Do not read long prompt examples verbatim unless they are the point of the scene.

## TTS Generation

If no built-in TTS helper is available, use a temporary Node workspace and `msedge-tts`.

Recommended behavior:

1. Generate one complete narration audio file with `zh-CN-YunxiNeural`.
2. Save it as `旁白音频.webm`.
3. Record the exact voice parameters in `episode.json` and `发布文案.md`.

If TTS fails because network or the package is unavailable, stop and report the blocker instead of rendering a silent final video.

## Subtitle Timing

Create `字幕.srt` automatically from the narration plan.

Use chapter timings from the Remotion scene data as the first timing source. Then split each chapter's narration into short subtitle cues and distribute the cue timings within the chapter. Keep subtitle cue boundaries aligned with scene changes when possible.

SRT format:

```srt
1
00:00:00,000 --> 00:00:03,000
第一句字幕

2
00:00:03,000 --> 00:00:06,000
第二句字幕
```

## Remotion Integration

Add both audio and subtitles to the composition:

- Use `<Audio src={staticFile("episode-bgm...")}>` for BGM at low volume.
- Use `<Audio src={staticFile("../旁白音频.webm")}>` or copy narration into `public` and use `staticFile("narration.webm")`.
- Render visible subtitles in the lower safe area.
- Keep subtitles above the progress bar.
- Use high-contrast white text with a dark translucent backing.
- Never let subtitles cover core UI details or the bottom prompt bar; if needed, move the prompt bar higher or hide it during dense narration.

## Audio Mix

Default mix:

- Narration volume: `1.0`
- BGM volume: `0.08-0.12`
- Fade BGM in for `1s`; fade out for `2s`.
- If using post-processing, duck BGM under voice and apply a final limiter.

Final delivery should prioritize clear voice over music impact.
