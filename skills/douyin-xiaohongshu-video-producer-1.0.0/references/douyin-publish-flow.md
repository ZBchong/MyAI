# Douyin Publish Flow

Use this only for Stage 2, after the user confirms the Stage 1 delivery effect is OK.

## Confirmation Gate

Do not start this flow until the user clearly confirms the final video package and asks to publish or upload to Douyin.

Acceptable confirmations include:

- 没问题，发布到抖音
- 确认，进入第2步
- 可以上传抖音
- 效果没问题，帮我走发布流程

If the user only asks for changes, review, regenerated files, or general status, stay in Stage 1.

## Required Inputs

Use the latest episode delivery folder:

- `交付文件/douyin_publish.mp4`
- `交付文件/cover.jpg`
- `交付文件/douyin_cover_horizontal_4x3.jpg`
- `交付文件/publish_copy.md`
- `交付文件/delivery_readme.md`

If `交付文件/` does not exist, use the episode root only after verifying the files are final.

## Browser Flow

1. Prefer Google Chrome for login and verification. If a controllable Chrome browser is available, use Chrome for the whole upload flow. If only another controllable browser is available, still open Google Chrome visibly for user login/verification whenever Douyin asks for QR scan, captcha, phone code, identity check, account selection, or any security prompt.

2. Open:

   `https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web`

3. If Douyin requires login, QR scan, captcha, identity verification, or account selection, stop automation and ask the user to complete it in Google Chrome. Continue only after the user says it is done.

4. Upload `douyin_publish.mp4` from the unified delivery folder.

5. Wait for the upload and platform processing to finish enough that metadata fields are editable.

6. Fill the title from the Douyin section of `publish_copy.md`.

7. Fill the description/caption from the Douyin section of `publish_copy.md`, including hashtags and CTA.

8. Set cover slots when the page exposes them:

   - Vertical/common cover: upload `cover.jpg`.
   - Horizontal cover: upload `douyin_cover_horizontal_4x3.jpg` for the `横封面4:3` slot.

   The observed current Douyin Creator page accepts JPG/JPEG/PNG images and labels the horizontal cover requirement as `横封面4:3`. If the UI changes, follow the visible Douyin Creator requirement shown on the page and report the change.

   If the page only exposes one cover upload or frame selection is the only available option, use the clearest cover/opening frame and tell the user which cover slot could not be set automatically.

9. Check visible settings, but do not make risky assumptions about monetization, scheduling, location, paid promotion, or policy-sensitive toggles. Leave unclear options unchanged.

10. If platform warnings appear, summarize them and ask the user before continuing.

11. Stop before the final publish/confirm button. Do not click it.

## Final Response For Stage 2

Report:

- Video file uploaded.
- Title filled.
- Description/hashtags filled.
- Cover status.
- Any warnings or fields left unchanged.
- The page is ready and the final publish button must be clicked by the user.

Do not claim the video is published unless the user personally clicked the final publish button and confirms it.
