# Audio Reproducibility

This file defines the portable audio defaults for this skill. Use it for every Stage 1 generation unless the user provides an episode-specific voice recording or background music file.

## Default Voice

- Provider: Microsoft Edge TTS
- Voice ID: `zh-CN-YunxiNeural`
- Rate: `+0%`
- Pitch: `+0Hz`
- Volume: `+0%`
- Preferred output format for raw TTS: `WEBM_24KHZ_16BIT_MONO_OPUS`
- Voice sample: `assets/audio/voice-yunxi-sample.webm`
- WAV audition sample: `assets/audio/voice-yunxi-sample.wav`
- Sample SHA256:
  - WEBM: `45E5143E494837895611B06EECBA7C2B340DC725A7DD6C7EE677C48EC3681E51`
  - WAV: `6BFBB92847FD47E84DA88C9002567600FCE2D3AB31620829F5A1A93755C32817`

When no user voice recording is provided, generate narration with `zh-CN-YunxiNeural` using the parameters above. If the runtime does not already have an Edge TTS helper, create a temporary Node workspace and install/use `msedge-tts`; write the temporary generator script into that workspace or the episode `assets/` folder.

The sample file is an audible reference, not the full narration source. It exists so another computer can verify the expected timbre. Because this voice is provided by Microsoft Edge TTS, exact synthesis can still change if Microsoft changes the cloud voice model. Keep the voice ID and parameters fixed to minimize drift.

## Default Background Music

- Default BGM file: `assets/audio/default-bgm-honghuangzhili.m4a`
- Source note: audio-only extraction from `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`
- Duration: `82.96s`
- Codec: AAC, 44.1 kHz, stereo
- SHA256: `D0636D947141DF0252A5CFC048738ADBDAB72C09E398AD2896568A4371DFA25F`

Audio priority:

1. User-provided episode BGM, if the user explicitly supplies one.
2. Skill-packaged default BGM: `assets/audio/default-bgm-honghuangzhili.m4a`.
3. Legacy local fallback only when present: `D:\6.AI\自媒体\背景音乐_洪荒之力.MOV`.

Use the same mix treatment by default:

- BGM volume: `0.10`
- Fade in: `1s`
- Fade out: `2s`
- Voice ducking/sidechain: `threshold=0.018:ratio=8:attack=20:release=320:makeup=1`
- Final limiter: `alimiter=limit=0.95`

## Delivery Documentation

Every delivery package should record:

- Voice provider and voice ID.
- Voice sample path or sample hash when relevant.
- BGM source path and SHA256.
- Mix treatment: volume, fade in/out, and sidechain settings.
