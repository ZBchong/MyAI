#!/bin/zsh
set -euo pipefail

label="com.local.codex-feishu-bridge"
state_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/codex-feishu-bridge"
launchctl print "gui/$(id -u)/${label}" 2>&1 | sed -n '1,100p'

if [[ "${1:-}" == "--follow" ]]; then
  touch "${state_dir}/bridge.log"
  tail -n 100 -F "${state_dir}/bridge.log"
else
  if [[ -f "${state_dir}/bridge.log" ]]; then
    print "\n最近日志:"
    tail -n 40 "${state_dir}/bridge.log"
  fi
fi
