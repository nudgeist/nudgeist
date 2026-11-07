# nudgeist

**A nudge, not a switch.**

Not every message needs your most expensive model. Ask a fast, low-cost one what a message really needs, then run that one message on a lighter model or effort. Your session stays as you set it. You decide.

```
❯ /nudgeist:check fix the typo in README: recieve

  Haiku: single typo fix, mechanical edit.
  /nudgeist:haiku fix the typo in README: recieve
```

## Commands

| Command | What it does |
|---|---|
| `/nudgeist:check <message>` | Asks Haiku which model and effort that message needs. It's told not to do the work. |
| `/nudgeist:haiku <message>` | Runs this one message on Haiku. |
| `/nudgeist:sonnet <message>` | Runs this one message on Sonnet. |
| `/nudgeist:low <message>` | Runs this one message on your model at low effort. |
| `/nudgeist:medium <message>` | Runs this one message on your model at medium effort. |

Your next message goes back to the model and effort you chose for the session. That's the difference from `/model` and `/effort`, which change the session until you change them back.

## Examples

- `/nudgeist:check add retries with backoff to an upload client`: two lines back, a model with the reason, then the command to run. Nothing gets changed.
- `/nudgeist:haiku write a Python function that checks whether a string is a palindrome`: Haiku writes it, and your next message is back on your session's model.
- `/nudgeist:sonnet write unit tests for a function that adds two numbers`: everyday coding at the start of a session on Opus.
- `/nudgeist:low explain in one line what a README file is for`: your model answers at low effort.

## When a lighter model pays

Each model has its own prompt cache. A model you haven't used in this conversation has to read all of it without the cache, while your current model, until its cache expires, reads it at a fraction of its usual price. So once the cache is warm, `/nudgeist:sonnet` from Opus often costs more than staying, even early on, and `/nudgeist:haiku` stops paying in a long conversation. `/nudgeist:check` runs on Haiku too, so the same applies to it.

`/nudgeist:low` and `/nudgeist:medium` keep your model. On the 5.5 models and Fable 5.1, with a Claude plan or an Anthropic Console account, they keep its cache too, which makes them the safer choice there. On other models, or through Bedrock, Google Cloud or a gateway, changing effort can mean reading everything again.

## Install

In Claude Code: run `/plugin directory` (v2.1.287 or later) and pick nudgeist. In the Claude desktop app: Customize → Plugins → Discover → nudgeist.

## What it reads, writes and sends

Nothing of its own. These commands are five short text files: no code, nothing in the background, and nothing runs until you type one. The message you put after a command goes through Claude Code to the model it names, or to your session's model for `/nudgeist:low` and `/nudgeist:medium`, like any other message, and counts toward your usage. See the [privacy policy](https://github.com/nudgeist/nudgeist/blob/main/PRIVACY.md).

## Limits

- `/nudgeist:check` sees your message and this conversation, and is told not to open anything, so it can be wrong. That's why it only suggests.
- It isn't asked to weigh which model or effort your session uses, so it can suggest what you're already on. Ignore that. `/nudgeist:low` and `/nudgeist:medium` keep whatever model you're on.
- Built for Claude Code, where a command can set its own model and effort. Elsewhere a command may run on the model you already have.

## Troubleshooting

- It ran on your usual model: Claude Code keeps your session's model for a command when your organization's allowed-models list excludes that model, or when auto mode doesn't support it, as can happen on cloud providers where `haiku` and `sonnet` mean older models.
- The effort didn't change: an effort level set outside the session takes priority, and older models have no effort setting.
- Command not found: use the full name, such as `/nudgeist:haiku`, and check that the plugin is on in `/plugin`.

## Support

Bugs and questions: [open an issue](https://github.com/nudgeist/nudgeist/issues). Security reports: [report privately](https://github.com/nudgeist/nudgeist/security/advisories/new).

nudgeist is an independent project, not made or endorsed by Anthropic. Claude, Haiku, Sonnet and Opus are Anthropic's names, used here only to say which model a command runs on.

## License

MIT
