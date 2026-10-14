# nudgeist

**A nudge, not a switch.**

Before your message reaches an expensive model, nudgeist asks a fast, low-cost one if the task really needs it and suggests a lighter model for that turn. You decide.

```
❯ fix the typo in README: recieve

  nudgeist: Haiku can likely handle this: single typo fix in README, mechanical edit.
  This turn on Haiku: put /nudgeist:haiku in front and send.
  Stay on Opus 5.5: send it again unchanged.
```

Your message stays in the input box. Put `/nudgeist:haiku` in front and press Enter, or just press Enter to keep your model. Either way, your next message runs on the model and effort you chose for the session. After the first turn, the notice also shows the estimated cost of both options.

## Install

In Claude Code:

```
/plugin marketplace add nudgeist/nudgeist
/plugin install nudgeist@nudgeist
```

It needs Node.js 18 or later: the hooks run with `node`.

## How it decides

1. **What you're running.** It reads the model and effort of your last turn from the session transcript, so it sees `/model` and `/effort` changes. Before the first turn it uses the model the session started with.
2. **Whether anything can be saved.** If you're already on a model and effort with nothing cheaper to offer, it does nothing and adds no wait.
3. **A second opinion.** Haiku reads your message plus a few lines about the session: its title, your last requests, the end of Claude's last reply, and the files in play with their sizes. It never sees your code. It answers with a model, an effort, a confidence and a reason, and says whether your message starts new work. A yes, an ok or a question about progress continues the work already under way, so it keeps your model and effort.
4. **Whether switching pays.** A model you haven't used in this session has to read the whole conversation from scratch, while your current model reads it from the prompt cache at a fraction of the price. nudgeist does that arithmetic with list prices and the cache lifetime your session actually uses, and only suggests a model when it at least halves the turn's cost. When it doesn't pay, it may suggest a lower effort instead, which keeps the cache.
5. **One question, then quiet.** It holds a message once. If you keep your model twice in a row, it stays quiet for the rest of the session.

## Commands

| Command | Runs this one message on |
|---|---|
| `/nudgeist:haiku <message>` | Haiku |
| `/nudgeist:sonnet <message>` | Sonnet |
| `/nudgeist:low <message>` | your model at low effort |
| `/nudgeist:medium <message>` | your model at medium effort |

## What it costs

Each checked message costs one Haiku call: about 1,200 tokens and 1.5 to 3 seconds, measured on Claude Code 2.1.296. Messages with nothing to save aren't checked.

## How it's checked

- `npm test`: the session reader, the cost arithmetic, the advisor's reply parser and the hold-once logic.
- [`bench/`](bench/): twelve coding tasks graded by hidden tests, solved on Haiku and Opus, with every raw run, diff and advisor call published and hashed. On 2026-10-13 Haiku 5.5 passed all twelve. Of 36 advisor calls, 16 suggested Haiku and 20 held back; none suggested Haiku where it failed, but since Haiku never failed, that risk is still untested. Small samples on our own tasks: see [the limits](bench/README.md#limits).

## What it reads, writes and sends

- **Reads** the session transcript and the line counts of the files the session touched, on your machine.
- **Writes** a small state file per session in the plugin's data folder: the model at start, the message on hold, and how often you accepted or kept your model.
- **Sends** your message and the session brief to Haiku through your own `claude` login. Nothing goes anywhere but Anthropic, where your message was going anyway. No telemetry.

## When it stays out of the way

- Commands (`/...`), `claude -p`, SDK and background sessions are never held.
- Any error, timeout or unclear verdict lets the message through.
- `NUDGEIST=off` turns it off.

## Limits

- The advisor sees a summary, not your code, so it can be wrong. That's why it asks instead of switching.
- In the desktop app the first message of a session isn't checked: Claude Code doesn't tell hooks the model there until the first turn.
- Prices are list prices for the 5.5 models; older models are priced as their 5.5 family member, which only understates savings. On a subscription you pay a plan, not per token: the figures show relative usage.

## License

MIT
