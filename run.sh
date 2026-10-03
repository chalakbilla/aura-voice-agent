#!/usr/bin/env bash
# Installs dependencies and runs backend + frontend in this one terminal.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/backend"
if [ ! -d venv ]; then
  echo ">> Creating Python virtual environment"
  python3 -m venv venv
fi
source venv/bin/activate
echo ">> Installing backend dependencies"
pip install -q -r requirements.txt

cd "$ROOT/frontend"
echo ">> Installing frontend dependencies"
npm install --silent

cleanup() {
  echo ""
  echo ">> Stopping backend"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/backend"
echo ">> Starting backend on http://localhost:5000"
python app.py &
BACKEND_PID=$!

cd "$ROOT/frontend"
echo ">> Starting frontend on http://localhost:5173 (Ctrl+C stops both)"
npm run dev
