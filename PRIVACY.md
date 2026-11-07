# Privacy policy

Effective date: 2026-11-06

nudgeist helps you run a Claude Code message on a lighter model or effort. It has no servers, accounts or services of its own, and its author never receives your messages. It comes in two editions, and what each one handles differs.

## Commands edition

This is the edition built for Anthropic's plugin directory: five commands written as plain text, with no code of their own. Nothing runs until you type a command.

- **Reads:** nothing of its own.
- **Writes:** nothing of its own.
- **Sends:** nothing of its own. The message you put after a command goes through Claude Code to the model it names, or to your session's model for `/nudgeist:low` and `/nudgeist:medium`, like any other message. Claude, on that model, sees your conversation as usual.
- **Keeps:** nothing.

## Full edition

This is the edition installed from the project's repository. It adds three hooks that run on your machine when a session starts, when you switch model and when you send a message.

- **Reads:** up to the last 512 KB of the session transcript, which holds your conversation and can include what Claude read from your files. It uses only the model, effort, conversation size and times, your typed requests, the paths of files Claude read or edited, and the end of Claude's last reply. It also asks the file system for the size of up to five of those files, without opening them.
- **Writes:** one small file per session in the plugin's data folder, which stays on your machine: the session's model, a SHA-256 hash of the message on hold (never its text), how many notices it showed, how often you accepted or kept your model, and whether it went quiet. Files of sessions idle for a week are removed.
- **Sends:** when a cheaper option is possible, it runs your own Claude Code once for that message, with no tools, and asks Haiku for an opinion. That call carries your message (up to 2,000 characters), the session title (up to 80 characters), the project folder's name, up to three earlier requests (up to 120 characters each), up to five file paths with their sizes, the end of Claude's last reply (up to 200 characters) and the size of the conversation. Claude Code adds its usual context to that call: the date, your operating system and shell, the folder it runs in (your home folder) and, when it knows it, your account email.

It normally goes wherever your Claude Code sends your messages: Anthropic, or the gateway or cloud provider you set up. It counts toward your usage. nudgeist never looks at or stores how you signed in. It starts that run with the hook's environment, including any sign-in set there, plus a few settings of its own, and that run signs in by itself. It doesn't load your settings files, so a sign-in script set only there doesn't apply: that run may use another saved login, or fail, and then your message goes through unchecked.

Set `NUDGEIST=off` to turn the hooks off.

## What the author collects

Nothing. There is no telemetry, no analytics and no tracking.

## Third parties

Your conversation is processed by the model provider you use with Claude Code, such as Anthropic, under their own terms and privacy policy.

## Changes

Changes to this policy are published in this file, with a new effective date.

## Contact

Open an issue at https://github.com/nudgeist/nudgeist/issues, or report it privately at https://github.com/nudgeist/nudgeist/security/advisories/new.
