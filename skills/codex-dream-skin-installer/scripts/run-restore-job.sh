#!/bin/bash

set -u
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

app="${1:-}"
/bin/sleep 2
/bin/mkdir -p "$STATE_ROOT"
CODEX_APP_BUNDLE="$app" "$INSTALL_ROOT/scripts/restore-dream-skin-macos.sh" --restore-base-theme --restart-codex \
  >>"$STATE_ROOT/skill-restore.log" 2>&1
result=$?
/usr/bin/printf '%s\n' "$result" > "$STATE_ROOT/skill-restore.exit"
/bin/rm -f "$JOB_PLIST"
(
  /bin/sleep 1
  /bin/launchctl bootout "gui/$(/usr/bin/id -u)/$JOB_LABEL" >/dev/null 2>&1 || true
) &
exit "$result"
