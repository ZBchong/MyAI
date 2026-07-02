#!/usr/bin/env bash
set -Eeuo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAME="codex-claude-bridge"

HOST="127.0.0.1"
PORT="8317"
MODEL="gpt-5.5"
SMALL_MODEL="gpt-5.4-mini"
EFFORT="xhigh"
ASSUME_YES=0
DEVICE_AUTH=0
FORCE_LOGIN=0
FORCE_KEY=0
INSTALL_SKILL=0
SKIP_CC_SWITCH=0
OPEN_CC_SWITCH=1
SKIP_TEST=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: setup.sh [options]

One-click setup for Claude Code -> CLIProxyAPI -> Codex OAuth.

Options:
  --yes                     Run non-interactively where possible.
  --device-auth             Use Codex device-code login instead of browser OAuth.
  --force-login             Re-run CLIProxyAPI Codex login even if auth exists.
  --force-key               Generate a new local gateway key.
  --install-skill           Symlink this skill into ~/.codex/skills and ~/.claude/skills.
  --model <name>            Default Claude Code model. Default: gpt-5.5.
  --small-model <name>      Small/fast model. Default: gpt-5.4-mini.
  --effort <level>          Claude Code effort level. Default: xhigh.
  --host <host>             CLIProxyAPI bind host. Default: 127.0.0.1.
  --port <port>             CLIProxyAPI port. Default: 8317.
  --skip-cc-switch          Do not install/open CC Switch.
  --no-open-cc-switch       Install if needed, but do not open CC Switch at the end.
  --skip-test               Skip final Claude Code smoke test.
  --dry-run                 Print major actions without changing files.
  -h, --help                Show this help.

Examples:
  bash setup.sh --yes
  bash setup.sh --yes --install-skill
  bash setup.sh --yes --device-auth
  bash setup.sh --yes --model gpt-5.4 --small-model gpt-5.4-mini
USAGE
}

log() { printf '\033[1;34m[bridge]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

confirm() {
  local prompt="$1"
  if [[ "$ASSUME_YES" == "1" ]]; then
    return 0
  fi
  read -r -p "$prompt [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] %q ' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --yes) ASSUME_YES=1; shift ;;
      --device-auth) DEVICE_AUTH=1; shift ;;
      --force-login) FORCE_LOGIN=1; shift ;;
      --force-key) FORCE_KEY=1; shift ;;
      --install-skill) INSTALL_SKILL=1; shift ;;
      --model) MODEL="${2:?missing value for --model}"; shift 2 ;;
      --small-model) SMALL_MODEL="${2:?missing value for --small-model}"; shift 2 ;;
      --effort) EFFORT="${2:?missing value for --effort}"; shift 2 ;;
      --host) HOST="${2:?missing value for --host}"; shift 2 ;;
      --port) PORT="${2:?missing value for --port}"; shift 2 ;;
      --skip-cc-switch) SKIP_CC_SWITCH=1; OPEN_CC_SWITCH=0; shift ;;
      --no-open-cc-switch) OPEN_CC_SWITCH=0; shift ;;
      --skip-test) SKIP_TEST=1; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
  done
}

ensure_brew() {
  if need_cmd brew; then
    eval "$(brew shellenv 2>/dev/null || true)"
    return 0
  fi

  for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
    if [[ -x "$candidate" ]]; then
      eval "$("$candidate" shellenv 2>/dev/null || true)"
      return 0
    fi
  done

  confirm "Homebrew is required and was not found. Install Homebrew now?" || die "Homebrew is required. Install it first, then rerun this script."
  log "Installing Homebrew..."
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Would download and run the Homebrew installer from https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
  else
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi

  for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
    if [[ -x "$candidate" ]]; then
      eval "$("$candidate" shellenv 2>/dev/null || true)"
      break
    fi
  done
  need_cmd brew || die "Homebrew install finished, but brew is still not on PATH."
}

ensure_python3() {
  if need_cmd python3; then
    return 0
  fi
  log "python3 not found; installing Python via Homebrew for JSON/config editing..."
  run brew install python
  need_cmd python3 || die "python3 is required but still unavailable after installation."
}

ensure_claude_code() {
  if need_cmd claude; then
    log "Claude Code found: $(command -v claude)"
    return 0
  fi
  confirm "Claude Code CLI was not found. Install it now from https://claude.ai/install.sh?" || die "Claude Code CLI is required."
  log "Installing Claude Code CLI..."
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Would run: curl -fsSL https://claude.ai/install.sh | bash"
  else
    curl -fsSL https://claude.ai/install.sh | bash
  fi
  export PATH="$HOME/.local/bin:$PATH"
  need_cmd claude || die "Claude Code install completed, but claude is not on PATH. Add ~/.local/bin to PATH and rerun."
}

ensure_cliproxyapi() {
  if need_cmd cliproxyapi; then
    log "CLIProxyAPI found: $(command -v cliproxyapi)"
    return 0
  fi
  log "Installing CLIProxyAPI..."
  run brew install cliproxyapi
  need_cmd cliproxyapi || die "CLIProxyAPI install completed, but cliproxyapi is not on PATH."
}

ensure_cc_switch() {
  if [[ "$SKIP_CC_SWITCH" == "1" ]]; then
    log "Skipping CC Switch."
    return 0
  fi
  if [[ "$(uname -s)" != "Darwin" ]]; then
    warn "CC Switch is a macOS GUI app; skipping on this OS."
    return 0
  fi
  if brew list --cask cc-switch >/dev/null 2>&1; then
    log "CC Switch already installed."
    return 0
  fi
  log "Installing CC Switch..."
  if ! run brew install --cask cc-switch; then
    warn "CC Switch install failed. Continuing because CLIProxyAPI is enough for Claude Code."
  fi
}

generate_key() {
  if need_cmd openssl; then
    openssl rand -hex 32
  else
    python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
  fi
}

install_skill_links() {
  [[ "$INSTALL_SKILL" == "1" ]] || return 0
  local codex_dir="${CODEX_HOME:-$HOME/.codex}/skills"
  local claude_dir="$HOME/.claude/skills"
  log "Installing skill symlinks..."
  run mkdir -p "$codex_dir" "$claude_dir"
  run ln -sfn "$SKILL_DIR" "$codex_dir/$SKILL_NAME"
  run ln -sfn "$SKILL_DIR" "$claude_dir/$SKILL_NAME"
  log "Skill linked to $codex_dir/$SKILL_NAME and $claude_dir/$SKILL_NAME"
}

prepare_gateway_key() {
  AUTH_DIR="${CLIPROXY_AUTH_DIR:-$HOME/.cli-proxy-api}"
  KEY_FILE="$AUTH_DIR/claude-code-gateway.key"
  run mkdir -p "$AUTH_DIR"
  if [[ "$FORCE_KEY" == "1" || ! -s "$KEY_FILE" ]]; then
    log "Generating local gateway key..."
    if [[ "$DRY_RUN" == "1" ]]; then
      GATEWAY_KEY="dry-run-key"
    else
      GATEWAY_KEY="$(generate_key)"
      umask 077
      printf '%s\n' "$GATEWAY_KEY" > "$KEY_FILE"
      chmod 600 "$KEY_FILE"
    fi
  else
    GATEWAY_KEY="$(tr -d '\r\n' < "$KEY_FILE")"
  fi
}

cliproxy_config_path() {
  if [[ -n "${CLIPROXY_CONFIG:-}" ]]; then
    printf '%s\n' "$CLIPROXY_CONFIG"
    return
  fi
  local prefix
  prefix="$(brew --prefix)"
  printf '%s\n' "$prefix/etc/cliproxyapi.conf"
}

configure_cliproxyapi() {
  CLIPROXY_CONFIG_FILE="$(cliproxy_config_path)"
  log "Configuring CLIProxyAPI at $CLIPROXY_CONFIG_FILE"
  run mkdir -p "$(dirname "$CLIPROXY_CONFIG_FILE")"

  if [[ ! -f "$CLIPROXY_CONFIG_FILE" ]]; then
    if [[ "$DRY_RUN" == "1" ]]; then
      log "Would create $CLIPROXY_CONFIG_FILE"
    else
      cat > "$CLIPROXY_CONFIG_FILE" <<EOF
host: "$HOST"
port: $PORT
auth-dir: "$AUTH_DIR"
api-keys:
  - "$GATEWAY_KEY"
debug: false
request-retry: 3
routing:
  strategy: "round-robin"
codex:
  identity-confuse: false
EOF
      chmod 600 "$CLIPROXY_CONFIG_FILE"
    fi
    return
  fi

  if [[ "$DRY_RUN" != "1" ]]; then
    cp "$CLIPROXY_CONFIG_FILE" "$CLIPROXY_CONFIG_FILE.bak-$(date +%Y%m%d%H%M%S)"
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    log "Would update host/port/auth-dir/api-keys in $CLIPROXY_CONFIG_FILE"
    return
  fi

  python3 - "$CLIPROXY_CONFIG_FILE" "$HOST" "$PORT" "$AUTH_DIR" "$GATEWAY_KEY" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
host, port, auth_dir, key = sys.argv[2:6]
text = path.read_text()

def replace_line(src, pattern, line):
    new, count = re.subn(pattern, line, src, count=1, flags=re.MULTILINE)
    if count:
        return new
    return line + "\n" + src

text = replace_line(text, r'^host:\s*.*$', f'host: "{host}"')
text = replace_line(text, r'^port:\s*.*$', f'port: {port}')
text = replace_line(text, r'^auth-dir:\s*.*$', f'auth-dir: "{auth_dir}"')

replacement = f'api-keys:\n  - "{key}"\n'
text, count = re.subn(r'^api-keys:\n(?:[ \t]*-[^\n]*\n)*', replacement, text, count=1, flags=re.MULTILINE)
if not count:
    text += "\n" + replacement

path.write_text(text)
PY
  chmod 600 "$CLIPROXY_CONFIG_FILE"
}

codex_auth_exists() {
  find "$AUTH_DIR" -maxdepth 1 -type f -name 'codex*.json' 2>/dev/null | grep -q .
}

login_codex() {
  if [[ "$FORCE_LOGIN" != "1" ]] && codex_auth_exists; then
    log "CLIProxyAPI Codex OAuth auth already exists in $AUTH_DIR"
    return 0
  fi
  if [[ "$DEVICE_AUTH" == "1" ]]; then
    log "Starting Codex device-code login. Complete the code flow in your browser."
    run cliproxyapi -config "$CLIPROXY_CONFIG_FILE" -codex-device-login
  else
    log "Starting Codex OAuth login. Complete the browser flow when it opens."
    run cliproxyapi -config "$CLIPROXY_CONFIG_FILE" -codex-login
  fi
  codex_auth_exists || die "Codex OAuth did not produce an auth file in $AUTH_DIR."
}

start_cliproxyapi() {
  log "Starting/restarting CLIProxyAPI service..."
  if brew services list >/dev/null 2>&1; then
    run brew services restart cliproxyapi
  else
    warn "brew services is unavailable; starting CLIProxyAPI in the background for this login session."
    if [[ "$DRY_RUN" != "1" ]]; then
      nohup cliproxyapi -config "$CLIPROXY_CONFIG_FILE" > "$AUTH_DIR/cliproxyapi.log" 2>&1 &
    fi
  fi
}

fetch_models() {
  local url="http://$HOST:$PORT/v1/models"
  local output="$AUTH_DIR/models.json"
  for _ in $(seq 1 30); do
    if curl -fsS -H "Authorization: Bearer $GATEWAY_KEY" "$url" -o "$output" >/dev/null 2>&1; then
      MODELS_JSON_FILE="$output"
      return 0
    fi
    sleep 1
  done
  die "CLIProxyAPI did not return /v1/models at $url. Check: brew services info cliproxyapi"
}

choose_models() {
  local selected
  selected="$(python3 - "$MODELS_JSON_FILE" "$MODEL" "$SMALL_MODEL" <<'PY'
import json
import sys

path, requested, requested_small = sys.argv[1:4]
data = json.load(open(path))
ids = [item.get("id", "") for item in data.get("data", [])]
preferred = [requested, "gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex-spark"]
small_preferred = [requested_small, "gpt-5.4-mini", "gpt-5.4", "gpt-5.5"]

def pick(candidates, fallback):
    for name in candidates:
        if name in ids:
            return name
    return fallback

model = pick(preferred, requested)
small = pick(small_preferred, model)
print(model)
print(small)
PY
)"
  MODEL="$(printf '%s\n' "$selected" | sed -n '1p')"
  SMALL_MODEL="$(printf '%s\n' "$selected" | sed -n '2p')"
  log "Using model=$MODEL small_model=$SMALL_MODEL"
}

configure_claude_code() {
  local settings="$HOME/.claude/settings.json"
  log "Configuring Claude Code settings at $settings"
  run mkdir -p "$HOME/.claude"
  if [[ -f "$settings" && "$DRY_RUN" != "1" ]]; then
    cp "$settings" "$settings.bak-$(date +%Y%m%d%H%M%S)"
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Would merge gateway env into $settings"
    return
  fi

  python3 - "$settings" "$HOST" "$PORT" "$GATEWAY_KEY" "$MODEL" "$SMALL_MODEL" "$EFFORT" <<'PY'
import json
import pathlib
import sys

settings_path = pathlib.Path(sys.argv[1])
host, port, key, model, small_model, effort = sys.argv[2:8]
if settings_path.exists() and settings_path.read_text().strip():
    settings = json.loads(settings_path.read_text())
else:
    settings = {}

env = settings.setdefault("env", {})
base = f"http://{host}:{port}"
env.update({
    "ANTHROPIC_BASE_URL": base,
    "ANTHROPIC_AUTH_TOKEN": key,
    "ANTHROPIC_MODEL": model,
    "ANTHROPIC_SMALL_FAST_MODEL": small_model,
    "ANTHROPIC_DEFAULT_FABLE_MODEL": model,
    "ANTHROPIC_DEFAULT_FABLE_MODEL_NAME": model,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": small_model,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME": small_model,
    "ANTHROPIC_DEFAULT_OPUS_MODEL": model,
    "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME": model,
    "ANTHROPIC_DEFAULT_SONNET_MODEL": model,
    "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME": model,
    "ANTHROPIC_DEFAULT_FABLE_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort",
    "CLAUDE_CODE_EFFORT_LEVEL": effort,
    "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1",
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000",
})
settings_path.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n")
PY
  chmod 600 "$settings"
}

smoke_test_gateway() {
  local url="http://$HOST:$PORT/v1/messages"
  log "Testing Anthropic-compatible gateway endpoint..."
  curl -fsS "$url" \
    -H "Authorization: Bearer $GATEWAY_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "{\"model\":\"$MODEL\",\"max_tokens\":16,\"messages\":[{\"role\":\"user\",\"content\":\"Reply BRIDGE_OK only.\"}]}" \
    >/tmp/codex-claude-bridge-message.json
  grep -q 'BRIDGE_OK' /tmp/codex-claude-bridge-message.json || warn "Gateway test returned a response, but it did not contain BRIDGE_OK."
}

smoke_test_claude() {
  [[ "$SKIP_TEST" == "1" ]] && return 0
  log "Testing Claude Code through Codex..."
  local result
  result="$(claude --model "$MODEL" --effort "$EFFORT" -p 'Reply BRIDGE_OK only.' 2>&1 || true)"
  printf '%s\n' "$result"
  printf '%s\n' "$result" | grep -q 'BRIDGE_OK' || die "Claude Code smoke test failed. Check CLIProxyAPI service and ~/.claude/settings.json."
}

open_cc_switch() {
  [[ "$OPEN_CC_SWITCH" == "1" ]] || return 0
  [[ "$(uname -s)" == "Darwin" ]] || return 0
  if [[ -d "/Applications/CC Switch.app" ]]; then
    log "Opening CC Switch..."
    run open -a "CC Switch" || true
  fi
}

main() {
  parse_args "$@"
  log "Starting $SKILL_NAME setup..."
  ensure_brew
  ensure_python3
  install_skill_links
  ensure_claude_code
  ensure_cliproxyapi
  ensure_cc_switch
  prepare_gateway_key
  configure_cliproxyapi
  login_codex
  start_cliproxyapi
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Dry run complete. No files, credentials, services, or Claude Code settings were changed."
    exit 0
  fi
  fetch_models
  choose_models
  configure_claude_code
  smoke_test_gateway
  smoke_test_claude
  open_cc_switch

  cat <<EOF

Setup complete.

Use Claude Code with Codex:
  claude --model $MODEL --effort $EFFORT

Service controls:
  brew services info cliproxyapi
  brew services restart cliproxyapi
  brew services stop cliproxyapi

Do not share files under ~/.cli-proxy-api, ~/.claude/settings.json, or $CLIPROXY_CONFIG_FILE.
EOF
}

main "$@"
