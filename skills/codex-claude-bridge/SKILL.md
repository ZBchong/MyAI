---
name: codex-claude-bridge
description: One-click local setup for using OpenAI Codex and ChatGPT-authenticated GPT models inside Claude Code through CC Switch and CLIProxyAPI. Use when the user wants Claude Code to use Codex without an OpenAI API key, migrate this setup to another Mac or computer, install CLIProxyAPI, CC Switch, or Claude Code, configure Claude settings, enable xhigh effort, or repair and verify the Claude Code to CLIProxyAPI to Codex OAuth bridge.
---

# Codex Claude Bridge

## Quick Start

Run the bundled setup script for a complete local deployment:

```bash
bash scripts/setup.sh --yes
```

The script installs or reuses Claude Code, CLIProxyAPI, and CC Switch, performs Codex OAuth login, configures Claude Code to point at the local gateway, starts the service, and verifies `claude --model gpt-5.5 --effort xhigh`.

For a copied skill folder on another machine, run it with an absolute path:

```bash
bash /path/to/codex-claude-bridge/scripts/setup.sh --yes --install-skill
```

Use device-code login when browser callback/login cannot return to localhost:

```bash
bash scripts/setup.sh --yes --device-auth
```

## What This Configures

The target chain is:

```text
Claude Code -> http://127.0.0.1:8317 -> CLIProxyAPI -> Codex OAuth -> GPT/Codex model
```

The setup script writes machine-local credentials only:

- CLIProxyAPI OAuth files under `~/.cli-proxy-api/`
- a local gateway bearer key under `~/.cli-proxy-api/claude-code-gateway.key`
- CLIProxyAPI config under `$(brew --prefix)/etc/cliproxyapi.conf`
- Claude Code environment settings under `~/.claude/settings.json`

Never print, paste, commit, or send the contents of those files. They may contain OAuth tokens or local gateway secrets.

## Privacy Rules

This skill must stay portable. Do not hardcode a user's account, email, access token, API key, OAuth file name, personal directory, public IP address, proxy endpoint, or company-only credential into `SKILL.md`, `agents/openai.yaml`, or `scripts/setup.sh`.

Runtime-specific data must be discovered or created on the target computer:

- user home paths via `$HOME`
- Homebrew prefix via `brew --prefix`
- local gateway key via `openssl rand` or Python `secrets`
- Codex account via browser/device-code OAuth
- model availability via the target computer's `/v1/models` response

Use `127.0.0.1` only as the loopback bind address for the local-only gateway. If a user needs a custom proxy, endpoint, or port, require them to pass it explicitly with script options or edit their own local config.

## Operating Procedure

1. Prefer `scripts/setup.sh --yes` for installation and repair instead of manually retyping commands.
2. Let the user finish the Codex OAuth browser/device-code flow. Do not ask them to paste tokens.
3. If OAuth stalls, ask for the final `localhost` callback URL only when CLIProxyAPI prompts for it, or rerun with `--device-auth`.
4. After setup, validate with:

```bash
claude --model gpt-5.5 --effort xhigh -p 'Reply BRIDGE_OK only.'
```

5. If `gpt-5.5` is unavailable for the user's account, rerun with a model returned by the gateway:

```bash
bash scripts/setup.sh --yes --model gpt-5.4 --small-model gpt-5.4-mini
```

## Useful Commands

```bash
brew services info cliproxyapi
brew services restart cliproxyapi
brew services stop cliproxyapi
curl -sS -H "Authorization: Bearer $(cat ~/.cli-proxy-api/claude-code-gateway.key)" http://127.0.0.1:8317/v1/models
```

Run Claude Code through Codex:

```bash
claude --model gpt-5.5 --effort xhigh
```

## Notes

- The script is macOS-first because CC Switch is a macOS app. The CLIProxyAPI + Claude Code path can also work on Homebrew-capable Linux, but CC Switch install/open is skipped there.
- An OpenAI API key is not required. The user signs in through Codex/ChatGPT OAuth.
- `xhigh` is an effort level, not part of the model name. Do not configure models like `gpt-5.5-xhigh`.
