#!/usr/bin/env bash
# Bootstrap dev tooling for VitalSync.
# Idempotent — safe to run multiple times. Run once after `git clone`.
#
# What it does:
#   1. Installs graphify CLI (knowledge-graph tool used by Claude Code / Cursor / etc.)
#   2. Builds graphify-out/ for this repo (no LLM cost — AST-only)
#   3. Installs git post-commit hook so the graph stays current

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> VitalSync setup ($REPO_ROOT)"

# 1. graphify CLI
if ! command -v graphify >/dev/null 2>&1; then
  echo "==> Installing graphify CLI"
  if command -v uv >/dev/null 2>&1; then
    uv tool install graphifyy
  elif command -v pipx >/dev/null 2>&1; then
    pipx install graphifyy
  else
    echo "!! Need uv or pipx. Install uv:  curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
  fi
else
  echo "==> graphify already installed: $(command -v graphify)"
fi

# Make sure ~/.local/bin is on PATH for this session
export PATH="$HOME/.local/bin:$PATH"

# 2. Build / refresh the graph (AST-only, no API cost)
if [ ! -f graphify-out/graph.json ]; then
  echo "==> Building knowledge graph (first run)"
  graphify update . || {
    echo "!! graphify update failed. Re-run: graphify update ."
    exit 1
  }
else
  echo "==> Refreshing knowledge graph"
  graphify update .
fi

# 3. Git hooks — auto-update graph after every commit / branch switch
# `graphify hook install` writes to ~/.git-templates/hooks (used by future clones).
# Existing repos need an explicit copy into .git/hooks/.
echo "==> Installing graphify git hooks"
graphify hook install
TEMPLATE_DIR="$HOME/.git-templates/hooks"
if [ -d "$TEMPLATE_DIR" ] && [ -d ".git/hooks" ]; then
  for hook in post-commit post-checkout; do
    if [ -f "$TEMPLATE_DIR/$hook" ]; then
      cp "$TEMPLATE_DIR/$hook" ".git/hooks/$hook"
      chmod +x ".git/hooks/$hook"
    fi
  done
fi

echo
echo "Setup complete."
echo "  - Knowledge graph: graphify-out/GRAPH_REPORT.md"
echo "  - Manual refresh:  graphify update ."
echo "  - Live watcher:    graphify watch ."
echo "  - Query graph:     graphify query \"<question>\""
