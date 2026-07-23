#!/bin/zsh
set -euo pipefail

if [[ $# -ne 1 ]]; then
  print -u2 "用法: $0 /绝对路径/config.json"
  exit 2
fi

config_source="$1"
if [[ "$config_source" != /* || ! -f "$config_source" ]]; then
  print -u2 "配置文件必须是存在的绝对路径"
  exit 2
fi

script_dir="${0:A:h}"
runtime_dir="${XDG_DATA_HOME:-${HOME}/.local/share}/codex-feishu-bridge"
config_dir="${XDG_CONFIG_HOME:-${HOME}/.config}/codex-feishu-bridge"
state_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/codex-feishu-bridge"
config_target="${config_dir}/config.json"
label="com.local.codex-feishu-bridge"
plist="${HOME}/Library/LaunchAgents/${label}.plist"
python_bin="$(command -v python3)"

mkdir -p "$runtime_dir" "$config_dir" "$state_dir" "${HOME}/Library/LaunchAgents"
install -m 755 "${script_dir}/bridge.py" "${runtime_dir}/bridge.py"
install -m 600 "$config_source" "$config_target"

python3 - "$config_target" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
d = json.loads(p.read_text())
required = ("target_chat_ids", "allowed_sender_ids", "workspace", "lark_cli", "codex_cli")
missing = [k for k in required if not d.get(k)]
if missing:
    raise SystemExit("配置缺少: " + ", ".join(missing))
for k in ("workspace", "lark_cli", "codex_cli"):
    if not pathlib.Path(d[k]).is_absolute():
        raise SystemExit(f"{k} 必须是绝对路径")
PY

cat > "$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${python_bin}</string>
    <string>${runtime_dir}/bridge.py</string>
    <string>--config</string><string>${config_target}</string>
    <string>--state</string><string>${state_dir}/events.sqlite3</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>5</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>${state_dir}/bridge.log</string>
  <key>StandardErrorPath</key><string>${state_dir}/bridge.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict>
</plist>
PLIST

plutil -lint "$plist"
launchctl bootout "gui/$(id -u)/${label}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist"
launchctl kickstart -k "gui/$(id -u)/${label}"
print "已安装并启动 ${label}"
print "日志: ${state_dir}/bridge.log"
