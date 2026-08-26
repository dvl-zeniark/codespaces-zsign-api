#!/usr/bin/env bash
# Make the Astro port public so ZSign can POST webhooks into this Codespace.
# No-op outside Codespaces (CODESPACE_NAME unset).
set -euo pipefail

if [[ -z "${CODESPACE_NAME:-}" ]]; then
  exit 0
fi

port="${CODESPACE_PORT:-4321}"
for attempt in 1 2 3 4 5 6; do
  if gh codespace ports visibility "${port}:public" -c "$CODESPACE_NAME" >/dev/null 2>&1; then
    echo "Port ${port} is public (webhooks can reach this Codespace)."
    exit 0
  fi
  sleep $((attempt * 2))
done

echo "warn: could not set port ${port} to public; set it manually in the Ports panel." >&2
exit 0
