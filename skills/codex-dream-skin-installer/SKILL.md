---
name: codex-dream-skin-installer
description: Install, configure, preview, select, render, apply, verify, or restore Codex Dream Skin on macOS with bundled portable resources. Use when the user asks to install Codex skins, apply the bundled default skin, preview recommended styles, selects a bundled skin, provides a local image as a visual reference, requests component-level 3D rendering instead of screenshot replacement, or needs the skin to survive the required Codex restart.
---

# Codex Dream Skin Installer

Use the bundled scripts. Never hardcode the skill location or a machine-specific home path.

## Rendering contract

Treat every selected bundled style or user image as a **visual reference**, not as a complete replacement UI.

1. Preserve Codex native text, icons, controls, accessibility, layout behavior, and click targets.
2. Use the reference only to derive:
   - clean background artwork;
   - accent, secondary, and highlight colors;
   - glass, depth, border, shadow, glow, and motion language.
3. Render sidebars, cards, headers, buttons, messages, project controls, and the composer as live native DOM styled by the Dream Skin engine.
4. Never use an image containing menus, cards, buttons, input fields, window chrome, or other fake UI as the final wallpaper.
5. When a reference is a UI composite:
   - inspect it first;
   - use the `imagegen` skill to create a clean wide wallpaper that removes all text and fake UI while preserving the reference's subjects, composition, atmosphere, and decorative motifs;
   - keep calm negative space behind navigation, text, and the composer;
   - apply the clean wallpaper, then map its visual language to native components.
6. Use component-level 3D treatment by default: layered glass gradients, inner highlights, outer shadows, restrained glow, hover elevation, focus rings, and pressed feedback.
7. Do not promise pixel-identical reproduction. Static composite previews and live Codex DOM differ by version, route, content, and viewport.
8. After applying, run `"<skill-dir>/scripts/verify.sh"`. Require visible sidebar and composer, live style injection, no horizontal overflow, valid official signature, and no `app.asar` modification.

## Install and apply the default

Run:

```bash
"<skill-dir>/scripts/install-and-apply.sh" --skin portal-hero
```

The script validates the official Codex signature and bundled Node runtime, installs the engine, sets the bundled abstract default, asks for restart confirmation when Codex is open, and delegates the restart to a user LaunchAgent so it continues after the current Codex process closes.

Tell the user to click **重启并应用** in the macOS dialog. After Codex returns, run:

```bash
"<skill-dir>/scripts/verify.sh"
```

## Recommend bundled styles

When the user's wording contains **推荐默认皮肤样式**:

1. Run `"<skill-dir>/scripts/list-skins.sh"` and show every returned style.
2. Run `"<skill-dir>/scripts/preview-skins.sh"` and render its Markdown output so the user can preview every bundled image inside Codex.
3. Use the clickable `request_user_input` UI in two stages:
   - Stage 1 groups: `推荐与粉系` (`portal-hero`, `skin-01`, `skin-02`), `科幻与清透` (`skin-03`, `skin-04`, `skin-05`), and `紫夜与舞台` (`skin-06`, `skin-07`, `skin-08`).
   - Stage 2: show the three skins in the selected group as clickable options. Include the skin ID and Chinese name in each label.
4. If clickable input is unavailable, keep the previews visible and request one skin ID in plain text.
5. Do not choose on the user's behalf.
6. Treat the selected image as a reference and follow **Rendering contract**. If it is a preview-composite case, generate a clean background without its fake UI before applying.
7. Apply the resulting clean background:

```bash
"<skill-dir>/scripts/apply-skin.sh" --image "/absolute/path/to/clean-background"
```

For `portal-hero`, which is already pure background artwork, apply it directly:

```bash
"<skill-dir>/scripts/apply-skin.sh" --skin portal-hero
```

`skin-01` through `skin-08` are preview-composite references. Never apply them directly as wallpapers because they visibly repeat UI elements.

## Apply a user image

When the user supplies an image attachment or local path:

1. Resolve it to an existing absolute path and inspect it.
2. If it contains UI, text, window chrome, or controls, use the `imagegen` skill to derive a clean wallpaper first.
3. If it is already clean background artwork, use it directly.
4. Infer a restrained theme palette and component-depth language from the reference.
5. Apply the clean image:

```bash
"<skill-dir>/scripts/apply-skin.sh" --image "/absolute/path/to/clean-background"
```

Accept PNG, JPEG, HEIC, TIFF, or WebP up to 50 MB. Do not copy the user's image back into the skill; the engine prepares a private installed copy.

After the engine is active, use its supported theme configuration to map the inferred palette to native components. Keep text contrast readable and keep all Codex controls interactive. Do not patch `Codex.app` or `app.asar`.

## Restore

Run:

```bash
"<skill-dir>/scripts/restore.sh"
```

This removes live injection and restarts Codex normally. It does not modify `Codex.app`, `app.asar`, or the application signature.

## Safety

- Support macOS and the official `com.openai.codex` bundle only.
- Bind CDP to `127.0.0.1`; never expose it externally.
- Require the script's explicit restart dialog before closing a running Codex instance.
- Preserve native Codex controls and offer Restore after applying a skin.
- Never disguise a static screenshot as a live component theme.
