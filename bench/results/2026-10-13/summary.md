# Bench results, 2026-10-13

2.1.296 (Claude Code) · Node v24.15.0 · darwin. The advisor believed it was in a session on claude-opus-5-5 at xhigh effort with 30k tokens and a warm cache.
Solvers: Haiku default effort, 2 runs; Opus high effort, 1 run; Sonnet default effort, 1 run, only when the advisor suggested Sonnet. Tools: Read, Edit, Write, Glob, Grep (no shell); no settings, plugins or MCP servers.

| Task | Advisor (each run) | Haiku passed | Opus passed | Sonnet passed | Haiku cost | Opus cost |
|---|---|---|---|---|---|---|
| t01-rename | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0019 | $0.056 |
| t02-typo | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0015 | $0.047 |
| t03-validate | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0016 | $0.046 |
| t04-config | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0014 | $0.044 |
| t05-slugify | low, haiku, low | 2/2 | 1/1 | – | $0.0017 | $0.046 |
| t06-paginate | medium, low, none | 2/2 | 1/1 | – | $0.0014 | $0.039 |
| t07-duration | haiku, haiku, low | 2/2 | 1/1 | – | $0.0025 | $0.052 |
| t08-retry | haiku, none, medium | 2/2 | 1/1 | – | $0.0014 | $0.043 |
| t09-lru | none, medium, none | 2/2 | 1/1 | – | $0.0015 | $0.045 |
| t10-refresh | none, medium, medium | 2/2 | 1/1 | – | $0.0040 | $0.064 |
| t11-intervals | none, none, medium | 2/2 | 1/1 | – | $0.0022 | $0.050 |
| t12-undo | none, medium, medium | 2/2 | 1/1 | – | $0.0025 | $0.070 |

## Did the advisor get the model right?

Each of the 36 advisor calls, against whether Haiku passed every run of that task.

| | Haiku passed every run | Haiku failed a run |
|---|---|---|
| Advisor suggested Haiku | 16 (right) | 0 (wrong: a redo on Opus) |
| Advisor did not suggest Haiku | 20 (missed saving) | 0 (right to hold back) |

- Tasks where all advisor calls agreed: 4/12.
- Tasks Haiku passed every run: 12/12.
- Advisor call: median 2000 ms, average $0.0001 per message.
- Effort suggestions (12 advisor runs) aren't graded here: no runs at those efforts.

## Cost of following the advisor

- Always Opus: $0.603 for the 12 tasks.
- Following the advisor, advisor calls and Opus redos included: $0.355 (41% less).

List prices as reported by Claude Code (`total_cost_usd`). One run per task on Opus and two on Haiku: small samples, our own tasks.
