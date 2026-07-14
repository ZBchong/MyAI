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
- Focus on the core purpose, strongest differentiators, and practical value; remove secondary facts before increasing duration.
- Match the narration duration to the source recording, normally within `±10%`. After generating TTS, measure the actual audio and rewrite until it fits instead of extending the video or replaying footage.

## TTS Generation

If no built-in TTS helper is available, use a temporary Node workspace and `msedge-tts`.

Recommended behavior:

1. Generate one complete narration audio file with `zh-CN-YunxiNeural`.
2. Save it as `旁白音频.webm`.
3. Record the exact voice parameters in `episode.json` and `发布文案.md`.

Additionally, enable sentence and word boundary metadata when generating narration. Save the actual boundary timestamps as JSON next to the audio, measure the resulting audio duration, and rewrite/regenerate when it falls outside the source-duration target. Record the measured duration in `episode.json`.

If TTS fails because network or the package is unavailable, stop and report the blocker instead of rendering a silent final video.

## Subtitle Timing

Create `字幕.srt` from the generated narration's actual sentence/word boundary timestamps.

- Group consecutive boundary tokens into readable 12-22-character cues.
- Use the first spoken token as cue start and the last spoken token as cue end, with at most a small readability pad that does not overlap the next phrase.
- Align scene changes to the audio-derived cues when practical; never replace audio timestamps with evenly distributed chapter timings.
- If boundary metadata is unavailable, generate TTS cue by cue and concatenate using a timestamp manifest, or run forced alignment. Do not guess timings from text length alone.
- Keep a JSON caption source using the Remotion `Caption` type, then export the same timestamps to SRT.

## Synchronization Validation

Before final rendering:

1. Compare the caption transcript with the narration script and reject missing, duplicated, or reordered phrases.
2. Check cue timestamps against the audio at the opening, middle, ending, and every scene boundary.
3. Keep normal onset and removal error within `250ms`; reject progressive drift above `300ms`.
4. Preview at normal speed and `0.5x`. Regenerate timing if captions lead speech, lag speech, or remain visible into the next phrase.
5. Record the validation result and maximum observed drift in `episode.json`.

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
