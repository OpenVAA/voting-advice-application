---
title: "Move the LLM prompt templates to `instructions` and candidate text to a user message, then drop the `allowSystemInMessages` opt-ins"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source: 169-REVIEW.md WR-01 (also WR-02 residue and IN-04); disposition 169-REVIEW-DISPOSITION.md
priority: medium
suggested_phase: the next phase that touches the LLM prompts or the admin LLM jobs (argument condensation, question info)
keywords: [ai-sdk-7, llm, allowSystemInMessages, instructions, prompt-injection, argument-condensation, question-info, generateObject-deprecated]
re_check_trigger: "a prompt restructure in packages/llm, argument-condensation or question-info; an AI SDK release that removes generateObject or the allowSystemInMessages opt-in"
supersedes: 2026-10-03-ai-sdk-7-allow-system-in-messages-opt-in.md
---

# Untrusted candidate text currently runs with system-role authority

## State after the WR-01 fix (commit 5e1d4394a)

`LLMProvider.generateObject` no longer hard-codes `allowSystemInMessages: true`. It forwards
`options.allowSystemInMessages ?? false`, the AI SDK 7 default. Three call sites opt in explicitly, each with a comment:

| Caller | What the system message contains |
|---|---|
| `packages/argument-condensation/src/core/condensation/condenser.ts` (sequential refine, `generateObject`) | the template with `comments: JSON.stringify(batch)`, i.e. **candidate-written free text** |
| `packages/argument-condensation/src/core/condensation/condenser.ts` (parallel map / iterate / reduce / ground, `generateObjectParallel`) | the template with candidate comments, or arguments the model condensed from them |
| `packages/question-info/src/core/infoGeneration.ts` | the template with admin-authored question data and generation options |

The older todo `2026-10-03-ai-sdk-7-allow-system-in-messages-opt-in.md` said "the opt-in does not let a user inject a
system turn today". That holds for the array shape only. The condenser interpolates candidate comments into the
system message, so a candidate can already write text that the model reads with system-role authority. This posture
dates from AI SDK 5, which allowed system messages by default, so it is not a Phase 169 regression. It is a
prompt-injection surface on an admin-triggered job, and it is a prompt and behaviour change, so it is out of scope for
a dependency phase.

## What to do

1. **Split each prompt template.** The fixed instructions go in `instructions` (forwarded by `generateObject` since
   WR-02, commit d2c988d74). The interpolated untrusted data (candidate comments, condensed arguments) goes in a
   `role: 'user'` message, clearly delimited as data. That also satisfies the SDK's "messages must not be empty" rule
   that 169-09 hit when it tried `instructions` alone.
2. **Drop the three `allowSystemInMessages: true` opt-ins** once no caller sends a system message in `messages`.
   Add a unit test per caller that no `messages` entry has `role: 'system'`.
3. **Re-baseline the condensation output.** A prompt split changes model behaviour. Run the condensation and
   question-info evaluation fixtures against a real provider (operator-run, with a key) and compare output quality
   before merging.
4. **Fold in the `generateObject` deprecation (169-REVIEW IN-04).** AI SDK 7 marks `generateObject` `@deprecated`
   ("Use `generateText` with an `output` setting instead"). Migrate `LLMProvider.generateObject` to
   `generateText({ output: Output.object({ schema }) })` in the same pass, keeping the retry, cost and latency
   wrappers. The provider tests mock `generateObject` by name, so they move with it.
5. **`streamText` parity (WR-02 residue).** `LLMProvider.streamText` forwards `instructions ?? system` and `messages`
   but not `prompt`, so a `prompt`-form call becomes `messages: []`. Give it the same prompt-or-messages pass-through
   that `generateObject` now has.

## Related

- `.planning/phases/169-dependency-bump-to-latest-safe-versions/169-REVIEW.md` WR-01, WR-02, IN-04.
- `.planning/phases/169-dependency-bump-to-latest-safe-versions/169-REVIEW-DISPOSITION.md`.
