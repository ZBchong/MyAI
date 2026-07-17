#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"

printf 'ID\t名称\t类型\n'
while IFS=$'\t' read -r id name file note; do
  [ -f "$SKINS_ROOT/$file" ] || fail "缺少打包图片：$file"
  printf '%s\t%s\t%s\n' "$id" "$name" "$note"
done < "$MANIFEST"
