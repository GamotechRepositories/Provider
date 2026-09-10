#!/bin/bash
set -euo pipefail

PINENTRY=""
if [[ -x /opt/homebrew/bin/pinentry-mac ]]; then
  PINENTRY="/opt/homebrew/bin/pinentry-mac"
elif [[ -x /usr/local/bin/pinentry-mac ]]; then
  PINENTRY="/usr/local/bin/pinentry-mac"
fi

if [[ -z "$PINENTRY" ]]; then
  echo "Install pinentry-mac first:"
  echo "  brew install pinentry-mac"
  exit 1
fi

mkdir -p "$HOME/.gnupg"
chmod 700 "$HOME/.gnupg"

cat > "$HOME/.gnupg/gpg-agent.conf" <<EOF
pinentry-program $PINENTRY
default-cache-ttl 600
max-cache-ttl 7200
EOF

touch "$HOME/.gnupg/gpg.conf"
if ! grep -q '^default-cache-ttl' "$HOME/.gnupg/gpg.conf" 2>/dev/null; then
  echo "default-cache-ttl 600" >> "$HOME/.gnupg/gpg.conf"
fi

gpgconf --kill gpg-agent 2>/dev/null || true

echo "GPG agent configured with pinentry-mac."
echo "Run deploy from Terminal.app (not Cursor):"
echo "  export GPG_TTY=\$(tty)"
echo "  cd sdks/java && mvn clean deploy -Prelease"
