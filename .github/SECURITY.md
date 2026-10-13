# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## What nudgeist is

nudgeist is a Claude Code plugin: three command hooks (`SessionStart`, `PostModelSwitch`, `UserPromptSubmit`) running one Node.js script with no dependencies, and four commands that are plain prompts. Its attack surface is what the hooks do:

- read the session transcript and the line counts of files the session touched;
- write one small JSON state file per session in the plugin's data folder;
- run your own `claude` command once per checked message, with no tools, no settings, no plugins and no session file, sending your message and a short session brief to Haiku;
- hold a message by returning a block decision to Claude Code.

It installs nothing, runs nothing on install, and has no network code of its own.

## Reporting a vulnerability

Report privately through GitHub: open the repository's **Security** tab and select **Report a vulnerability**. Please don't open a public issue for a security problem.

Useful reports include:

- a way for a message, a transcript or a file name to make the hook run something other than `claude`, or pass it arguments it shouldn't;
- the advisor's `claude` process getting tools, settings, plugins or a session file it shouldn't have;
- the hook reading, writing or sending something this file and the README don't disclose;
- a way to make the hook block messages it should let through, or keep blocking after you send a message again.
