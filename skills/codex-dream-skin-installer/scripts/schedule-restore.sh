#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

app="${1:-}"
[ -n "$app" ] && valid_codex_bundle "$app" || fail "无效的 Codex 应用路径。"
/bin/mkdir -p "$HOME/Library/LaunchAgents" "$STATE_ROOT"
/bin/rm -f "$STATE_ROOT/skill-restore.exit"
runner="$(xml_escape "$SCRIPT_DIR/run-restore-job.sh")"
app_xml="$(xml_escape "$app")"
log_xml="$(xml_escape "$STATE_ROOT/skill-restore-launchagent.log")"
cat > "$JOB_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$JOB_LABEL</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>$runner</string><string>$app_xml</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$log_xml</string>
  <key>StandardErrorPath</key><string>$log_xml</string>
</dict></plist>
EOF
/usr/bin/plutil -lint "$JOB_PLIST" >/dev/null
/bin/launchctl bootout "gui/$(/usr/bin/id -u)/$JOB_LABEL" >/dev/null 2>&1 || true
/bin/launchctl bootstrap "gui/$(/usr/bin/id -u)" "$JOB_PLIST"
printf '已安排独立恢复任务；Codex 关闭后恢复流程仍会继续。\n'
