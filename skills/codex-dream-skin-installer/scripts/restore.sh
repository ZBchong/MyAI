#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"
app="$(detect_codex_bundle)"
if codex_running "$app"; then
  /usr/bin/osascript -e 'display dialog "将停止皮肤注入并重启 Codex，以恢复官方外观。" buttons {"取消", "恢复并重启"} default button "恢复并重启" with title "Codex Dream Skin"' >/dev/null \
    || fail "用户取消了恢复。"
fi
"$SCRIPT_DIR/schedule-restore.sh" "$app"
printf 'Codex 将自动重启并恢复官方默认外观。\n'
