#!/usr/bin/env bash
# Codespaces cannot set port visibility from portsAttributes (spec gap).
# Consent prompt only — uses ambient Codespaces GITHUB_TOKEN (no partner login).
# See: https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace#sharing-a-port
set -euo pipefail

PORT="${WEBHOOK_PORT:-4321}"

ports_tab_hint() {
  cat <<EOF

To enable receiving webhooks:
  1. Open the Ports tab (VS Code / Codespaces)
  2. Right-click port ${PORT}
  3. Port Visibility → Public

Then register the public URL in ZSign → Settings → Integrations → Webhooks.

EOF
}

if [[ "${CODESPACES:-}" != "true" || -z "${CODESPACE_NAME:-}" ]]; then
  echo "Not a GitHub Codespace — port ${PORT} visibility is only needed in Codespaces."
  exit 0
fi

echo ""
echo "ZSign webhooks need port ${PORT} Public so ZSign can POST into this codespace."
echo ""

if [[ ! -t 0 ]]; then
  echo "No interactive TTY — cannot prompt."
  ports_tab_hint
  exit 0
fi

read -r -p "Make port ${PORT} public for webhooks? [y/N] " answer
case "${answer}" in
  y|Y|yes|YES)
    ;;
  *)
    echo "Skipped."
    ports_tab_hint
    exit 0
    ;;
esac

if ! command -v gh >/dev/null 2>&1; then
  echo "Could not change visibility (GitHub CLI missing)."
  ports_tab_hint
  exit 0
fi

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  echo "Could not change visibility (no Codespaces session token)."
  ports_tab_hint
  exit 0
fi

echo "Making port ${PORT} public…"
last_err=""
for _ in $(seq 1 30); do
  if err="$(gh codespace ports visibility "${PORT}:public" -c "${CODESPACE_NAME}" 2>&1)"; then
    echo ""
    echo "Port ${PORT} is public."
    echo "Webhook URL (once the app is up):"
    echo "  https://${PORT}-${CODESPACE_NAME}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}/api/webhooks/zsign"
    exit 0
  fi
  last_err="${err}"
  if echo "${last_err}" | grep -qiE 'auth|401|403|forbidden|permission|scope|login|policy'; then
    break
  fi
  sleep 2
done

echo "Could not change visibility automatically${last_err:+: ${last_err}}"
ports_tab_hint
exit 0
