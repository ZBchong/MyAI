---
name: codex-dream-skin-installer
description: Install, configure, preview, select, render, apply, verify, or restore Codex Dream Skin on macOS with bundled portable resources. Use when the user asks to install Codex skins, apply the bundled default skin, preview or recommend styles, selects a bundled skin, provides a local image as a visual reference, requests theme or native-icon recoloring, requests component-level 3D visual-language rendering instead of screenshot replacement, or needs the skin to survive the required Codex restart. Every applied reference requires complete background, palette, native-icon, component-depth, interaction-state, and verification adaptation; wallpaper-only application is incomplete.
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

## Mandatory complete adaptation

Treat this section as a blocking completion gate for every bundled style and user image. Never skip it, even when the user only names a skin ID or says "apply", "install", or "use this style".

1. Inspect the reference and write down an implementation palette before applying:
   - background and panel colors;
   - accent, secondary, and highlight colors;
   - primary, muted, inverse, success, warning, and danger text/icon colors when relevant;
   - border, inner-highlight, shadow, and glow colors.
2. Generate or select a clean background according to **Rendering contract**.
3. Apply the clean background, then use the engine's supported theme configuration to persist the inferred colors. Pass explicit palette values whenever the configuration command supports them. Never silently accept engine demo/default colors unless they genuinely match the selected reference.
4. Recolor native icons through inherited `currentColor`, theme tokens, or supported live CSS only:
   - map default, muted, active, hover, selected, success, warning, danger, and disabled states;
   - preserve the original SVG/path, semantic meaning, accessibility label, dimensions, and click target;
   - never replace native icons with icons baked into the wallpaper or with fake controls.
5. Map the reference's 3D visual language to live native DOM for the sidebar, header, cards/messages, project controls, buttons, composer, menus, and dialogs:
   - use layered glass or material gradients;
   - add restrained inner highlights, borders, outer shadows, and glow;
   - implement hover elevation, pressed depth, keyboard focus rings, selected state, and disabled state;
   - maintain readable contrast in both the active Codex appearance mode and any engine-supported light/dark adaptation.
6. Inspect the persisted active theme configuration after writing it. Confirm that its palette matches the reference and is not an unrelated default palette.
7. Inspect the live result after restart or hot apply. Confirm that the background, component colors, native-icon colors, depth treatment, and interaction states are visibly driven by the selected reference.
8. Run `"<skill-dir>/scripts/verify.sh"` and require all safety/layout checks to pass.

Do not report the skin as complete when only the wallpaper changed, when native components still use an unrelated default palette, when icons were not adapted, or when the component-level 3D and interaction states were not checked. If the installed engine cannot express a required mapping, report the exact unsupported mapping as blocked instead of claiming success.

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

When the user's wording contains **推荐默认皮肤样式**, **推荐皮肤样式**, **推荐样式**, **皮肤推荐**, or equivalent wording:

1. Run `"<skill-dir>/scripts/list-skins.sh"` and show every returned style.
2. Run `"<skill-dir>/scripts/preview-skins.sh"` and render its Markdown output so the user can preview every bundled image inside Codex.
3. Use the clickable `request_user_input` UI in two stages:
   - Stage 1 groups: `推荐与粉系` (`portal-hero`, `skin-01`, `skin-02`), `科幻与清透` (`skin-03`, `skin-04`, `skin-05`), and `紫夜与舞台` (`skin-06`, `skin-07`, `skin-08`).
   - Stage 2: show the three skins in the selected group as clickable options. Include the skin ID and Chinese name in each label.
4. If clickable input is unavailable, keep the previews visible and request one skin ID in plain text.
5. Do not choose on the user's behalf.
6. Treat the selected image as a reference and follow **Rendering contract**. If it is a preview-composite case, generate a clean background without its fake UI before applying.
7. Derive the explicit palette, native-icon state colors, and component-level 3D visual language required by **Mandatory complete adaptation**.
8. Apply the resulting clean background:

```bash
"<skill-dir>/scripts/apply-skin.sh" --image "/absolute/path/to/clean-background"
```

For `portal-hero`, which is already pure background artwork, apply it directly:

```bash
"<skill-dir>/scripts/apply-skin.sh" --skin portal-hero
```

`skin-01` through `skin-08` are preview-composite references. Never apply them directly as wallpapers because they visibly repeat UI elements.

After applying any selected skin, complete every step in **Mandatory complete adaptation** before reporting success.

## Apply a user image

When the user supplies an image attachment or local path:

1. Resolve it to an existing absolute path and inspect it.
2. If it contains UI, text, window chrome, or controls, use the `imagegen` skill to derive a clean wallpaper first.
3. If it is already clean background artwork, use it directly.
4. Infer a restrained theme palette, native-icon state palette, and component-level 3D visual language from the reference.
5. Apply the clean image:

```bash
"<skill-dir>/scripts/apply-skin.sh" --image "/absolute/path/to/clean-background"
```

Accept PNG, JPEG, HEIC, TIFF, or WebP up to 50 MB. Do not copy the user's image back into the skill; the engine prepares a private installed copy.

After the engine is active, complete every step in **Mandatory complete adaptation**. Use its supported theme configuration to map the inferred palette to native components and icons. Keep text contrast readable and keep all Codex controls interactive. Do not patch `Codex.app` or `app.asar`.

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
