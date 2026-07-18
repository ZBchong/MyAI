---
name: codex-dream-skin-installer
description: Install, preview, select, apply, verify, update, or restore Codex Dream Skin on macOS or Windows. Use for bundled skin recommendations, user-image themes, palette and native-icon adaptation, component-level glass/3D styling, cross-platform installation, post-update repair, or safe rollback. Automatically select the bundled macOS Bash engine or the upstream Windows PowerShell engine; every applied reference requires background, palette, icon-state, component-depth, interaction-state, and live verification adaptation.
---

# Codex Dream Skin Installer

Detect the operating system before choosing commands:

- On Windows, use `scripts\dream-skin-windows.ps1` and `assets/engine-windows`.
- On macOS, use the existing `.sh` scripts and `assets/engine`.
- Stop on other platforms with a clear unsupported-platform message.

Resolve the skill directory from this file. Never hardcode a user home or skill-install path.

## Cross-platform install contract

The skill must be usable on a fresh supported computer without manual code edits.

1. Detect the host OS first and run only that platform's engine.
2. Treat this skill directory as the source of truth; sync bundled engine assets into the platform install/runtime directory before applying or verifying.
3. On Windows, install under `%LOCALAPPDATA%\CodexDreamSkin\engine`; on macOS, install under the engine's configured user-state/runtime directory.
4. Never depend on a versioned Codex app path. Resolve the official app/package dynamically every run.
5. Use the bundled wrappers instead of calling low-level engine scripts directly, because the wrappers handle runtime sync, Node discovery, install, theme save, start, and verify ordering.
6. A changed CSS, renderer payload, injector, or theme helper must be copied to the installed runtime before reporting success.
7. Keep restart behavior explicit and safe: do not close an already-open normal Codex window unless the user approved restart/close or the command includes the platform's explicit restart switch.
8. Success requires a live verified injector after restart or hot apply, not just files written to disk.

## Rendering contract

Treat a selected style or user image as a visual reference, not a replacement UI.

1. Preserve Codex native text, icons, controls, accessibility, layout behavior, and click targets.
2. Derive a clean background, explicit palette, icon-state colors, glass/depth language, shadows, glow, and motion.
3. Render sidebars, cards, headers, buttons, messages, project controls, composer, menus, and dialogs as live native DOM.
4. Never use a bitmap containing fake menus, cards, buttons, inputs, window chrome, text, or baked-in UI as the wallpaper.
5. For a UI composite, inspect it and use `imagegen` to create a clean wide wallpaper. Preserve atmosphere, remove fake UI/text, and keep calm negative space behind navigation and the composer.
6. Apply component-level depth: layered glass/material gradients, inner highlights, borders, restrained glow, hover elevation, pressed depth, focus rings, selected state, and disabled state.
7. Preserve readable contrast in active and supported light/dark appearances.
8. Do not promise pixel-identical reproduction.

Bundled `skin-01` through `skin-08` are UI-composite references. For those skins, the applied wallpaper must be a UI-free clean background generated or selected from the reference. The visible Codex UI must be rebuilt through live component styling.

Mandatory live component coverage:

- Sidebar, task list, project selector, header, main surface, home hero, home suggestion cards, task/message turns, composer, buttons, menus, dialogs, scrollbars, focus rings, hover states, pressed states, selected states, and disabled states.
- Text and icons must inherit the theme through native DOM/CSS (`currentColor`, tokens, or equivalent); no text or native icon may be baked into the wallpaper.
- Borders, title text, labels, body text, icon tiles, card backgrounds, and turn containers must all receive the selected skin's palette and depth treatment.
- Homepage suggestion cards must remain visible when Codex renders them. Do not hide or clip them with hero/main overflow rules. The home hero layer may need visible overflow while the outer main surface keeps controlled page overflow.
- Task conversation turns must be themed as real 3D/glass components, including translucent fill, border, inner highlight, shadow/glow, and readable text.
- For `skin-06` / purple-night style, preserve the purple-night atmosphere with explicit accent, secondary, and highlight colors, but still use multi-token depth, readable text, and real Codex controls.

## Complete-adaptation gate

Before reporting success:

1. Record background, panel, accent, secondary, highlight, text, muted, inverse, success, warning, danger, border, inner-highlight, shadow, and glow colors as applicable.
2. Generate or select a clean wallpaper.
3. Persist explicit colors; never accept unrelated demo defaults.
4. Recolor native icons through `currentColor`, theme tokens, or live CSS while preserving paths, semantics, labels, size, and click targets.
5. Adapt sidebar, header, messages/cards, project controls, buttons, composer, menus, and dialogs, including hover, pressed, focus, selected, and disabled states.
6. Inspect the saved theme and confirm it matches the reference.
7. Inspect the live result after hot apply or restart.
8. Run platform verification and require visible sidebar/composer, live injection, no horizontal overflow, official identity, loopback-only CDP, and no `app.asar` modification.
9. For the home route, confirm the title, composer/project surface, and any native suggestion cards are visible, nonzero-size, clickable, and themed.
10. For at least one task route, confirm message/turn containers, task text, composer, sidebar, and header are themed and readable.
11. Verify that the background is only background art; no fake card, fake button, fake menu, fake title, or fake composer is visible in the wallpaper.

Do not report completion for wallpaper-only changes, missing home cards, missing task turn styling, clipped controls, invisible text, or an unrelated default palette. Report unsupported mappings exactly.

## Recommend bundled styles

On Windows:

```powershell
& "<skill-dir>\scripts\list-skins.ps1"
& "<skill-dir>\scripts\preview-skins.ps1"
```

On macOS:

```bash
"<skill-dir>/scripts/list-skins.sh"
"<skill-dir>/scripts/preview-skins.sh"
```

Show every style and preview. Use clickable input in two stages when available:

1. 推荐与粉系 (`portal-hero`, `skin-01`, `skin-02`), 科幻与清透 (`skin-03`, `skin-04`, `skin-05`), 紫夜与舞台 (`skin-06`, `skin-07`, `skin-08`).
2. Show the three skin IDs and Chinese names in the selected group.

If clickable input is unavailable, request one skin ID. Do not choose for the user.

`portal-hero` is clean artwork. `skin-01` through `skin-08` are UI-composite references; generate a clean wallpaper before applying them.

## Windows

The bundled engine is synchronized from `Fei-Away/Codex-Dream-Skin/windows`. It validates the registered Store package, launches by AUMID, verifies loopback listener ownership, pins a Browser ID, installs atomically under `%LOCALAPPDATA%\CodexDreamSkin`, and never modifies WindowsApps or `app.asar`.

Windows rules learned from live compatibility work:

1. Use `scripts\dream-skin-windows.ps1` as the entrypoint for Doctor, Install, Apply, Verify, and Restore.
2. The wrapper must install with `-NoShortcuts` for agent-driven installs so `Start-Process -Wait` cannot hang behind a persistent tray descendant before the selected theme is written.
3. When applying, load `common-windows.ps1` before `theme-windows.ps1`; theme helpers depend on common Windows validation helpers.
4. If the installed runtime already exists, still ensure the latest bundled `assets\dream-skin.css`, `assets\renderer-inject.js`, `scripts\injector.mjs`, `scripts\common-windows.ps1`, `scripts\theme-windows.ps1`, and start/verify/restore scripts are present under `%LOCALAPPDATA%\CodexDreamSkin\engine`.
5. Persist `accent`, `secondary`, and `highlight` in the theme payload and renderer dataset so CSS can theme icons, cards, focus states, and 3D depth consistently.
6. Keep CDP on loopback, default port `9335`, and require Browser-ID/session matching during verify.
7. After applying a skin, run Verify with a screenshot path and visually inspect both New Task/home and an existing or newly opened task page.
8. If Codex updates, re-run Doctor/Install/Apply instead of reusing stale versioned paths.

Run a non-mutating check:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Doctor
```

Install automatically:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Install
```

The upstream installer requires Codex to be closed. If it is open, obtain explicit close/restart confirmation first.

Apply the clean default:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Apply -Skin portal-hero -PromptRestart
```

Apply a clean image with explicit palette:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Apply `
  -Image "C:\absolute\path\clean-background.png" -Name "Theme name" `
  -Accent "#rrggbb" -Secondary "#rrggbb" -Highlight "#rrggbb" -PromptRestart
```

Windows accepts PNG, JPEG, or WebP subject to upstream validation. Convert HEIC/TIFF first. Never pass a preview composite.

Verify with a screenshot:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Verify `
  -ScreenshotPath "$env:TEMP\codex-dream-skin.png"
```

Inspect the screenshot and both home and task routes. On Windows, a complete `skin-06`-class verification must show:

- four homepage suggestion cards when the current Codex host renders them at desktop width, with gradient/glass fill, themed border, icon tile, shadow, and readable label text;
- no clipping of the suggestion-card row caused by home hero overflow;
- themed sidebar, heading, project/composer surface, composer controls, and scrollbars;
- task/message turn containers using the selected skin's translucent 3D card treatment rather than default system cards;
- no wallpaper-baked UI and no unthemed system-default card surfaces in the primary route.

Restore:

```powershell
& "<skill-dir>\scripts\dream-skin-windows.ps1" -Action Restore -PromptRestart
```

## macOS

Apply the clean default:

```bash
"<skill-dir>/scripts/install-and-apply.sh" --skin portal-hero
```

Apply a clean image:

```bash
"<skill-dir>/scripts/apply-skin.sh" --image "/absolute/path/to/clean-background"
```

Accept PNG, JPEG, HEIC, TIFF, or WebP up to 50 MB. If Codex is running, tell the user to approve the restart dialog. Then run:

```bash
"<skill-dir>/scripts/verify.sh"
```

After macOS apply/verify, perform the same visual adaptation gate as Windows: inspect New Task/home and a task route, confirm the clean wallpaper plus live component styling, and reject wallpaper-only results, clipped homepage cards, unthemed message turns, or baked-in UI.

Restore:

```bash
"<skill-dir>/scripts/restore.sh"
```

## Safety

- Support only official macOS `com.openai.codex` and Windows Store `OpenAI.Codex`.
- Bind CDP only to `127.0.0.1`.
- On Windows, require Store identity, AUMID, process-path, listener-owner, and Browser-ID checks.
- Require explicit confirmation before closing or restarting Codex.
- Never write to `WindowsApps`, `Codex.app`, or `app.asar`.
- Do not change API keys, base URLs, providers, authentication, threads, plugins, or unrelated settings.
- Preserve native controls and always offer Restore.
- Never disguise a screenshot as a live component theme.
