# Bench results, 2026-10-13

2.1.296 (Claude Code) · Node v24.15.0 · darwin. The advisor believed it was in a session on claude-opus-5-5 at xhigh effort with 30k tokens and a warm cache.
Solvers: Haiku default effort, 2 runs; Opus high effort, 1 run; Sonnet default effort, 1 run, only when the advisor suggested Sonnet. Tools: Read, Edit, Write, Glob, Grep (no shell); no settings, plugins or MCP servers.

| Task | Advisor (each run) | Haiku passed | Opus passed | Sonnet passed | Haiku cost | Opus cost |
|---|---|---|---|---|---|---|
| t01-rename | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0020 | $0.057 |
| t02-typo | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0015 | $0.048 |
| t03-validate | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0016 | $0.049 |
| t04-config | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0018 | $0.044 |
| t05-slugify | low, haiku, low | 2/2 | 1/1 | – | $0.0025 | $0.048 |
| t06-paginate | none, none, none | 2/2 | 1/1 | – | $0.0014 | $0.039 |
| t07-duration | haiku, haiku, haiku | 2/2 | 1/1 | – | $0.0023 | $0.055 |
| t08-retry | medium, none, medium | 2/2 | 1/1 | – | $0.0014 | $0.044 |
| t09-lru | none, medium, none | 2/2 | 1/1 | – | $0.0017 | $0.045 |
| t10-refresh | medium, none, medium | 2/2 | 1/1 | – | $0.0035 | $0.060 |
| t11-intervals | medium, none, medium | 2/2 | 1/1 | – | $0.0022 | $0.049 |
| t12-undo | none, none, none | 2/2 | 1/1 | – | $0.0027 | $0.067 |

## Did the advisor get the model right?

Each of the 36 advisor calls, against whether Haiku passed every run of that task.

| | Haiku passed every run | Haiku failed a run |
|---|---|---|
| Advisor suggested Haiku | 16 (right) | 0 (wrong: a redo on Opus) |
| Advisor did not suggest Haiku | 20 (missed saving) | 0 (right to hold back) |

- Tasks where all advisor calls agreed: 7/12.
- Tasks Haiku passed every run: 12/12.
- Advisor call: median 1906 ms, average $0.0001 per message.
- Effort suggestions (9 advisor runs) aren't graded here: no runs at those efforts.

## Cost of following the advisor

- Always Opus: $0.606 for the 12 tasks.
- Following the advisor, advisor calls and Opus redos included: $0.349 (42% less).

List prices as reported by Claude Code (`total_cost_usd`). One run per task on Opus and two on Haiku: small samples, our own tasks.
