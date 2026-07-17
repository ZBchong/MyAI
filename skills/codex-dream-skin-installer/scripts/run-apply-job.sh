#!/bin/bash

set -u
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

app="${1:-}"
port="${2:-9341}"
/bin/sleep 2
/bin/mkdir -p "$STATE_ROOT"
CODEX_APP_BUNDLE="$app" "$INSTALL_ROOT/scripts/start-dream-skin-macos.sh" --port "$port" --restart-existing \
  >>"$STATE_ROOT/skill-apply.log" 2>&1
result=$?
/usr/bin/printf '%s\n' "$result" > "$STATE_ROOT/skill-apply.exit"
/bin/rm -f "$JOB_PLIST"
(
  /bin/sleep 1
  /bin/launchctl bootout "gui/$(/usr/bin/id -u)/$JOB_LABEL" >/dev/null 2>&1 || true
) &
exit "$result"
