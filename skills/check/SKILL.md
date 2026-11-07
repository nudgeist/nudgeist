---
name: check
description: Ask Haiku which model and effort one message really needs, when you're unsure how much a task takes. It answers and does none of the work.
model: haiku
effort: low
disable-model-invocation: true
argument-hint: <message>
---
Someone is about to send the request below and wants to know the cheapest Claude model and reasoning effort that will do it well. Don't do the request, don't use any tools and don't ask questions.

Models, cheapest first: haiku (clear, local, mechanical work), sonnet (most everyday coding), opus (hard debugging, design, ambiguous or wide-reaching work). Rate the work itself, not the length of the message, and use what this conversation shows about it. When unsure, pick the stronger model and say so.

Reply with exactly two lines, in the language of the request:
1. The model, plus the effort only if it's Opus, then why, in at most 8 words.
2. The next step, which is the first of these that fits, with the request written out in full:
   - Haiku is enough: /nudgeist:haiku <request>
   - Sonnet is enough: /nudgeist:sonnet <request>
   - Opus at low effort is enough: /nudgeist:low <request> (this keeps your session's model)
   - Opus at medium effort is enough: /nudgeist:medium <request> (this keeps your session's model)
   - It needs Opus at high effort: switch with /model and /effort if your session is below that, then send it as usual.

If the request below is empty, reply only: Put your message after the command.

Request:
$ARGUMENTS
