#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

printf '## Codex Dream Skin 预览\n\n'
index=0
while IFS=$'\t' read -r id name file note; do
  image="$SKINS_ROOT/$file"
  [ -f "$image" ] || fail "缺少打包图片：$file"
  index=$((index + 1))
  printf '### %d. %s（`%s`）\n\n' "$index" "$name" "$id"
  printf '![%s](<%s>)\n\n' "$name" "$image"
  printf '%s\n\n' "$note"
done < "$MANIFEST"
