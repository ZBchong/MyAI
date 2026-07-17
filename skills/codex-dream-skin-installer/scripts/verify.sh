#!/bin/bash

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/lib.sh"
app="$(detect_codex_bundle)"
CODEX_APP_BUNDLE="$app" "$INSTALL_ROOT/scripts/doctor-macos.sh"
CODEX_APP_BUNDLE="$app" "$INSTALL_ROOT/scripts/verify-dream-skin-macos.sh"
