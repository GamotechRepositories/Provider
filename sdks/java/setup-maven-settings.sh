#!/bin/bash
set -euo pipefail

SOURCE="$(cd "$(dirname "$0")" && pwd)/settings.local.xml"
TARGET="$HOME/.m2/settings.xml"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing $SOURCE"
  echo "Copy settings.xml.example to settings.local.xml and fill in your Sonatype token + GPG key."
  exit 1
fi

mkdir -p "$HOME/.m2"
cp "$SOURCE" "$TARGET"
chmod 600 "$TARGET"

echo "Installed Maven settings to $TARGET"
