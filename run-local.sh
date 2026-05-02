#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT_DIR/app"

if ! command -v solana >/dev/null 2>&1; then
  cat <<'EOF'
Solana CLI is not installed, so `solana-test-validator` is unavailable.
Install it first with one of these options:

  1) Standard installer (preferred):
     sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

  2) If that fails due to SSL/TLS, download from GitHub:
     mkdir -p "$HOME/.local/share/solana" && \
     cd "$HOME/.local/share/solana" && \
     curl -L -O https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-release-x86_64-unknown-linux-gnu.tar.bz2 && \
     tar -xjf solana-release-x86_64-unknown-linux-gnu.tar.bz2 && \
     mkdir -p "$HOME/.local/bin" && \
     ln -sf "$HOME/.local/share/solana/solana-release/bin"/* "$HOME/.local/bin/"

Then open a new terminal or run:

  source "$HOME/.profile"

After installing, run this script again:

  ./run-local.sh
EOF
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed. Install Node.js/npm before running this script." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Starting local Solana validator..."
solana-test-validator --reset > "$ROOT_DIR/solana-test-validator.log" 2>&1 &
VALIDATOR_PID=$!
echo "Solana validator started with PID $VALIDATOR_PID"
echo "Logs: $ROOT_DIR/solana-test-validator.log"

echo "Waiting 3 seconds for validator startup..."
sleep 3

cd "$APP_DIR"
echo "Installing frontend dependencies (if needed)..."
npm install

echo "Starting Next.js dev server..."
npm run dev
