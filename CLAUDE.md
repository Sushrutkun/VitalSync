## Setup (fresh clone)

If `graphify-out/` does not exist OR `graphify` CLI is missing, run **first**:

```
./scripts/setup.sh
```

Idempotent. Installs graphify, builds the knowledge graph, installs git hooks. After that the rules below apply.

## graphify

This project uses a graphify knowledge graph at `graphify-out/` to save tokens on architecture / codebase questions. The dir is gitignored — `scripts/setup.sh` regenerates it on a fresh clone.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse EXTRACTED + INFERRED edges instead of scanning files
- After modifying code in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- A `post-commit` git hook auto-runs `graphify update .` — installed by `scripts/setup.sh`. Verify with `graphify hook status`
- For continuous live updates while coding, run `graphify watch .` in a side terminal

If `graphify` is missing on this machine, re-run `./scripts/setup.sh`.
