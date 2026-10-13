# Bench

Does the advisor's suggestion hold up? Twelve small coding tasks, each with a hidden test. For every task the advisor is asked the way nudgeist asks it in a session on Opus 5.5 at xhigh effort, and then the task is solved for real on Haiku (twice), on Opus (once) and, when the advisor said Sonnet, on Sonnet (once). Every result is graded by the task's test, never by a model.

## What's here

| Path | What it is |
|---|---|
| `tasks/<id>/task.json` | The request, exactly as the solver and the advisor see it. |
| `tasks/<id>/fixture/` | The project the solver starts from. Synthetic code written for this bench. |
| `tasks/<id>/check.test.mjs` | The hidden test. It's copied in only after the solver finishes. |
| `tasks/<id>/solution/` | A reference solution, to prove the test is fair. |
| `results/<date>/meta.json` | Claude Code version, models, efforts, tools and the session the advisor assumed. |
| `results/<date>/advisor.jsonl` | Every advisor call: the brief it saw, its verdict, its cost and how long it took. |
| `results/<date>/runs.jsonl` | Every solver run: model, pass or fail, turns, time, tokens, cost. |
| `results/<date>/diffs/` | What each solver changed in each task. |
| `results/<date>/summary.md` | The tables, computed from the files above by `report.mjs`. |
| `results/<date>/SHA256SUMS` | A hash of every file in the folder. |

## Check it yourself

```bash
node bench/validate.mjs                       # every test fails on the fixture and passes on the solution
cd bench/results/2026-10-13 && shasum -a 256 -c SHA256SUMS   # no result file changed after the run
node bench/report.mjs bench/results/2026-10-13               # the summary comes from the raw files
npm test                                       # also re-checks the hashes and scans results for personal data
```

## Run it again

```bash
node bench/run.mjs --config-dir <a Claude Code config folder that is logged in>
node bench/report.mjs bench/results/<date>
```

`--config-dir` decides which login pays. The full run on 2026-10-13 cost US$0.65 at list price: 36 solver runs and 36 advisor calls.

## Privacy

Results are written only through `lib.mjs`, which replaces the scratch folder with `<task>`, removes the home folder, the temp folder and the user name, and refuses to write anything that still looks like a home path, an email, an API key or a session id. The solver runs with a minimal environment (no shell tool, no settings, plugins or MCP servers), and `npm test` scans the published files again.

## Limits

- Haiku 5.5 passed all twelve tasks on 2026-10-13, so that run can't show the costly mistake (the advisor suggests Haiku and Haiku fails). Harder tasks are needed for that.
- We wrote the tasks, so read the numbers as a signal, not a proof.
- One Opus run and two Haiku runs per task: small samples.
- The solvers have no shell, so they can't run tests while working.
- Effort suggestions aren't graded: there are no runs at those efforts.
