#!/bin/zsh
set -euo pipefail

label="com.local.codex-feishu-bridge"
plist="${HOME}/Library/LaunchAgents/${label}.plist"
runtime_dir="${XDG_DATA_HOME:-${HOME}/.local/share}/codex-feishu-bridge"
config_dir="${XDG_CONFIG_HOME:-${HOME}/.config}/codex-feishu-bridge"
state_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/codex-feishu-bridge"

launchctl bootout "gui/$(id -u)/${label}" 2>/dev/null || true
[[ -f "$plist" ]] && rm "$plist"
[[ -d "$runtime_dir" ]] && rm -R "$runtime_dir"

if [[ "${1:-}" == "--purge" ]]; then
  [[ -d "$config_dir" ]] && rm -R "$config_dir"
  [[ -d "$state_dir" ]] && rm -R "$state_dir"
  print "已卸载并清除配置、日志和幂等状态"
else
  print "已卸载；配置和状态仍保留在 ${config_dir} 与 ${state_dir}"
fi
