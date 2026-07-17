#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
ENGINE_ROOT="$SKILL_ROOT/assets/engine"
SKINS_ROOT="$SKILL_ROOT/assets/skins"
MANIFEST="$SKINS_ROOT/manifest.tsv"
INSTALL_ROOT="$HOME/.codex/codex-dream-skin-studio"
STATE_ROOT="$HOME/Library/Application Support/CodexDreamSkinStudio"
PORT="${CODEX_DREAM_SKIN_PORT:-9341}"
JOB_LABEL="com.codexdreamskin.skill.oneshot"
JOB_PLIST="$HOME/Library/LaunchAgents/$JOB_LABEL.plist"

fail() {
  printf 'Codex Dream Skin Skill: %s\n' "$*" >&2
  exit 1
}

valid_codex_bundle() {
  local app="$1"
  [ -f "$app/Contents/Info.plist" ] || return 1
  [ "$(/usr/bin/plutil -extract CFBundleIdentifier raw -o - "$app/Contents/Info.plist" 2>/dev/null || true)" = "com.openai.codex" ]
}

detect_running_codex_bundle() {
  local command app
  while IFS= read -r command; do
    case "$command" in
      *.app/Contents/MacOS/*)
        app="${command%%.app/Contents/MacOS/*}.app"
        if valid_codex_bundle "$app"; then printf '%s\n' "$app"; return 0; fi
        ;;
    esac
  done < <(/bin/ps -axo command=)
  return 1
}

detect_codex_bundle() {
  local candidate
  if [ -n "${CODEX_APP_BUNDLE:-}" ] && valid_codex_bundle "$CODEX_APP_BUNDLE"; then
    printf '%s\n' "$CODEX_APP_BUNDLE"
    return 0
  fi
  candidate="$(detect_running_codex_bundle || true)"
  if [ -n "$candidate" ]; then printf '%s\n' "$candidate"; return 0; fi
  while IFS= read -r candidate; do
    if valid_codex_bundle "$candidate"; then printf '%s\n' "$candidate"; return 0; fi
  done < <(/usr/bin/mdfind 'kMDItemCFBundleIdentifier == "com.openai.codex"' 2>/dev/null)
  for candidate in "/Applications/Codex.app" "/Applications/ChatGPT.app" "$HOME/Applications/Codex.app" "$HOME/Applications/ChatGPT.app"; do
    if valid_codex_bundle "$candidate"; then printf '%s\n' "$candidate"; return 0; fi
  done
  fail "未找到官方 Codex Desktop（com.openai.codex）。请先安装并至少启动一次 Codex。"
}

codex_running() {
  local app="$1" exe command
  exe="$(/usr/bin/plutil -extract CFBundleExecutable raw -o - "$app/Contents/Info.plist")"
  command="$app/Contents/MacOS/$exe"
  /bin/ps -axo command= | /usr/bin/grep -F "$command" | /usr/bin/grep -v grep >/dev/null
}

skin_record() {
  local wanted="$1" id name file note
  while IFS=$'\t' read -r id name file note; do
    [ "$id" = "$wanted" ] && { printf '%s\t%s\t%s\t%s\n' "$id" "$name" "$file" "$note"; return 0; }
  done < "$MANIFEST"
  return 1
}

xml_escape() {
  /usr/bin/sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g' <<<"$1"
}
