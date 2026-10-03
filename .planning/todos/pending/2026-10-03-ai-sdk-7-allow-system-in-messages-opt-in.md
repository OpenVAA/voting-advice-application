---
title: "AI SDK 7 rejects system messages in `messages`; `LLMProvider.generateObject` opts back in with `allowSystemInMessages: true`"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: when the LLM prompts are next restructured
keywords: [ai-sdk-7, llm, allowSystemInMessages, prompts, argument-condensation, question-info]
re_check_trigger: "a prompt restructure in packages/llm, argument-condensation or question-info; or an AI SDK release that removes the opt-in"
---

# The system-message opt-in (169-09)

AI SDK 7 rejects `role: 'system'` entries inside `messages` by default. Every caller of
`LLMProvider.generateObject` (`@openvaa/argument-condensation`, `@openvaa/question-info`) sends its server-built prompt
as a system message, so `packages/llm/src/llm-providers/llmProvider.ts` passes `allowSystemInMessages: true` there
(`0bf2782a7`), restoring the 5.x behaviour for that one method. `streamText` keeps the SDK's rejecting default.

The prompts are repo-authored and server-built, so the opt-in does not let a user inject a system turn today. No E2E
spec runs the LLM admin jobs (they need a provider key); 169-09's runtime proof was a mock-model smoke run.

**What to do:** when the prompts are next touched, move the system text to the SDK's `system`/`instructions` field plus
a user turn and drop the opt-in; add a unit test that the provider call carries no system entry in `messages`.
