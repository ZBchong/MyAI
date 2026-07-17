#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

skin_id="portal-hero"
user_image=""
dry_run="false"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --skin) skin_id="${2:-}"; shift 2 ;;
    --image) user_image="${2:-}"; shift 2 ;;
    --dry-run) dry_run="true"; shift ;;
    *) fail "未知参数：$1" ;;
  esac
done

[ "$(/usr/bin/uname -s)" = "Darwin" ] || fail "此 Skill 仅支持 macOS。"
[ -d "$ENGINE_ROOT/scripts" ] && [ -f "$MANIFEST" ] || fail "Skill 资源不完整。请重新安装 Skill。"
app="$(detect_codex_bundle)"

if [ -n "$user_image" ]; then
  [ -f "$user_image" ] || fail "图片不存在：$user_image"
  image="$user_image"
  theme_name="自定义皮肤"
else
  record="$(skin_record "$skin_id" || true)"
  [ -n "$record" ] || fail "未知皮肤 ID：$skin_id。运行 scripts/list-skins.sh 查看可选项。"
  IFS=$'\t' read -r _ theme_name file _ <<<"$record"
  image="$SKINS_ROOT/$file"
  [ -f "$image" ] || fail "打包图片不存在：$file"
fi

if [ "$dry_run" = "true" ]; then
  printf 'DRY_RUN_OK\napp=%s\nimage=%s\ntheme=%s\n' "$app" "$image" "$theme_name"
  exit 0
fi

CODEX_APP_BUNDLE="$app" "$ENGINE_ROOT/scripts/install-dream-skin-macos.sh" --no-launch
CODEX_APP_BUNDLE="$app" "$INSTALL_ROOT/scripts/customize-theme-macos.sh" --image "$image" --name "$theme_name" --no-apply

if codex_running "$app"; then
  /usr/bin/osascript -e 'display dialog "Codex 需要重启一次才能启用所选皮肤。当前任务会保留，重启由独立后台任务完成。" buttons {"取消", "重启并应用"} default button "重启并应用" with title "Codex Dream Skin 一键安装"' >/dev/null \
    || fail "用户取消了重启；皮肤已准备好，但尚未生效。"
fi

"$SCRIPT_DIR/schedule-apply.sh" "$app"
printf '皮肤“%s”已安装。Codex 将自动重启并应用；重新打开后运行 scripts/verify.sh 验证。\n' "$theme_name"
