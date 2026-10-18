#!/usr/bin/env bash
# Runs the engine checks (plain Node) and the browser suites (Playwright + Chromium) for Stats Without Walls.
# Usage: bash run.sh [--checks] [--browser] [--port 8765]. From stats/tests, with `npm install` done once (or NODE_PATH
# pointing at a node_modules that has playwright). A static server is started on the port for the browser suites.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"; PORT=8765; DO_CHECKS=1; DO_BROWSER=1
while [ $# -gt 0 ]; do case "$1" in --checks) DO_BROWSER=0;; --browser) DO_CHECKS=0;; --port) PORT="$2"; shift;; esac; shift; done
export NODE_PATH="${NODE_PATH:-$HERE/node_modules}"
fail=0; pass=0; failed=()
run_one() { local f="$1"; local out; out="$(timeout 600 node "$f" 2>&1)"; local code=$?; if [ $code -eq 0 ] && echo "$out" | tail -1 | grep -q "ALL PASSED"; then pass=$((pass+1)); echo "PASS  $(basename "$f")"; else fail=$((fail+1)); failed+=("$(basename "$f")"); echo "FAIL  $(basename "$f")"; echo "$out" | grep -v "^PASS" | tail -15 | sed 's/^/      /'; fi; }
if [ $DO_CHECKS -eq 1 ]; then echo "== engine checks"; for f in "$HERE"/checks/*.js; do run_one "$f"; done; fi
if [ $DO_BROWSER -eq 1 ]; then
  echo "== browser suites (http://127.0.0.1:$PORT/stats/index.html)"
  SRV_PID=""; if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/stats/index.html"; then (cd "$ROOT" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) & SRV_PID=$!; for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null "http://127.0.0.1:$PORT/stats/index.html" && break; sleep 1; done; fi
  for f in "$HERE"/browser/*.js; do SWW_PORT=$PORT run_one "$f"; done
  if [ -n "$SRV_PID" ]; then kill "$SRV_PID" >/dev/null 2>&1 || true; fi
fi
echo; echo "$pass passed, $fail failed${fail:+: ${failed[*]:-}}"
[ $fail -eq 0 ]
