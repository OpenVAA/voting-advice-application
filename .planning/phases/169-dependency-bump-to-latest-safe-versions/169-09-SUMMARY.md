---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 09
subsystem: llm
tags: [ai-sdk, vercel-ai, openai, google, llm, supply-chain, undici, cost-calculation]

requires:
  - phase: 169-08
    provides: "faker 10.6.0, 12/12 gates, E2E 171/171 on PG17; HEAD a1f78ee4f"
  - phase: 169-01
    provides: "the AI SDK family held out of the group-0 refresh (provider-utils >=3.0.35 pulled undici 5 / @fastify/busboy)"
provides:
  - "ai 7.0.116, @ai-sdk/google 4.0.82, @ai-sdk/openai 4.0.78 on @ai-sdk/provider 4.0.18 / provider-utils 5.0.49 (one resolution each)"
  - "undici 5 and @fastify/busboy stay out of the tree (provider-utils 5 depends on undici ^7); audit 0 new"
  - "LLMProvider on the 7.0 API: createGoogle, the system-message opt-in for generateObject, streamText instructions, cost calculation on the usage detail fields"
  - "openai 4 removed from packages/llm (no importer); the zod-vs-openai YN0060 is gone"
  - "group 7 gates 12/12 and full E2E 171/171"
affects: [169-13]

actuals:
  tokens: 22700    # chars/4 over the realized diff a1f78ee4f..HEAD (code + evidence) plus this summary
  tasks: 3
  commits: 4      # git rev-list --count a1f78ee4f..HEAD at SUMMARY time (the SUMMARY/state commit follows)
plan_head_before: a1f78ee4fb3f6ce597f3ef9bcc103d17afe8ae3b
plan_head_after: 4a9f2bd28d238e7ebec2ce535d43dba735d24368

tech-stack:
  added: ["ai 7.0.116", "@ai-sdk/google 4.0.82", "@ai-sdk/openai 4.0.78", "@ai-sdk/provider 4.0.18", "@ai-sdk/provider-utils 5.0.49", "@ai-sdk/gateway 4.0.94", "@workflow/serde 4.1.0"]
  removed: ["ai 5.0.60", "@ai-sdk/google 2.0.23", "@ai-sdk/openai 2.0.42", "openai 4 (and its 19-name subtree)"]
  patterns:
    - "When an SDK starts rejecting an input shape by default, check every caller's real input against the new runtime before trusting mocked unit tests: a throwaway script driving the built package with the SDK's own mock model shows what the callers' mocks hide"
    - "Mock members a test does not read are typed `as never`, not `as any` with a new eslint-disable"

key-files:
  created:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-09-SUMMARY.md
  modified:
    - packages/llm/package.json
    - yarn.lock
    - packages/llm/src/llm-providers/llmProvider.ts
    - packages/llm/src/llm-providers/provider.types.ts
    - packages/llm/src/types/llmPipelineResult.ts
    - packages/llm/src/utils/costCalculation.ts
    - packages/llm/tests/llmProvider.test.ts
    - packages/argument-condensation/src/core/condensation/condenser.ts
    - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md

key-decisions:
  - "Targets measured live at 16:17Z: ai 7.0.116 (7.82 d), @ai-sdk/google 4.0.82 (7.82 d), @ai-sdk/openai 4.0.78 (7.60 d); 7.0.0 / 4.0.0 date from 2026-06-25. All three pin @ai-sdk/provider 4.0.18, so the majors match. Nothing held."
  - "Keep generateObject (deprecated in 6, still exported in 7.0.116), per the plan's 'else keep it'; the zod schema stays the validator and NoObjectGeneratedError still drives the retry."
  - "generateObject passes allowSystemInMessages: true. Every caller (argument-condensation x2, question-info) sends its whole server-built prompt as one system message, which AI SDK 7 rejects by default; moving it to `instructions` is impossible without a user turn (the SDK throws 'messages must not be empty'). streamText stays on the SDK default."
  - "TokenUsage stays the SDK's LanguageModelUsage under the same name; the condenser's aggregated metrics fill the new detail objects with undefined members instead of narrowing the public type."
  - "OpenAI strictJsonSchema now defaults to true; left on, because every caller schema has only required fields."
  - "jsonrepair was already gone; only openai was removed."

patterns-established:
  - "Real-runtime smoke check of an SDK major with ai/test MockLanguageModelV4 injected into the built provider (no network, no keys)"

requirements-completed: [DEPS-11]

coverage:
  - id: D1
    description: "ai, @ai-sdk/google and @ai-sdk/openai resolve once each at the newest safe matching majors, in one commit"
    requirement: DEPS-11
    verification:
      - kind: other
        ref: "yarn why ai -> 7.0.116; yarn why @ai-sdk/google -> 4.0.82; yarn why @ai-sdk/openai -> 4.0.78 (0bf2782a7); probe at 16:17:57Z"
        status: pass
    human_judgment: false
  - id: D2
    description: "No vulnerable undici 5 / @fastify/busboy and no new audit finding"
    requirement: DEPS-11
    verification:
      - kind: other
        ref: "yarn why undici -> 7.30.0 / 8.11.2 only; yarn why @fastify/busboy -> nothing; 10-audit 0 new, 1 accepted (braces)"
        status: pass
    human_judgment: false
  - id: D3
    description: "packages/llm compiles and its tests pass on the new SDK: structured objects, streaming, the no-object error, usage typing, both factories"
    requirement: DEPS-11
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/llm test:unit -> 43/43 (four new cases); ad-hoc tsc over src+tests clean; real-runtime smoke with MockLanguageModelV4"
        status: pass
    human_judgment: false
  - id: D4
    description: "Consumers typecheck and pass: argument-condensation, question-info, the frontend admin features"
    requirement: DEPS-11
    verification:
      - kind: unit
        ref: "argument-condensation 30/30; question-info 22/22; apps/frontend vitest src/lib/server/admin/ 42/42; TURBO_FORCE=true yarn typecheck 23/23"
        status: pass
    human_judgment: false
  - id: D5
    description: "openai (and jsonrepair if present) removed from packages/llm"
    requirement: DEPS-11
    verification:
      - kind: other
        ref: "node -p dependency filter -> 0; git grep for openai/jsonrepair imports exits 1; yarn why openai -> nothing (32a0eed8a)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Group 7 ends with twelve gates green and a full E2E run green"
    requirement: DEPS-11
    verification:
      - kind: other
        ref: "169-gates.sh 169-09-group7 -> 12 rows of 0 at 6ab069778"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-09-group7 -> 171 total / 171 passed / 0 failed / 0 flaky / 0 did-not-run"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 09: the AI SDK on ai 7 / @ai-sdk 4, with every caller's system-message prompt kept working, and openai removed Summary

**`ai` moved from 5.0.60 to 7.0.116, and `@ai-sdk/google` and `@ai-sdk/openai` from 2.x to 4.0.82 and 4.0.78, in
one commit. The 169-01 worry is gone: `@ai-sdk/provider-utils` 5.0.49 depends on `undici` ^7, so `undici` 5 and
`@fastify/busboy` stay out, and the audit reports nothing new. The migration found one break the mocked unit tests
could not see. AI SDK 7 rejects system messages in `messages` by default, and every caller sends its whole prompt as a
system message, so every admin condensation and question-info job would have failed at runtime. `generateObject` now
opts back in. `openai` 4, which nothing imported, is removed. The gates are 12/12 and the full E2E suite is
171/171.**

## Performance

- **Duration:** 28min (2026-10-03T16:17Z → 16:45Z)
- **Tasks:** 3 of 3
- **Files modified:** 9 source files plus the evidence ledger

## Accomplishments

- **Age rule, measured live (16:17:57Z).**
  - Targets: `ai` 7.0.116 (7.82 d), `@ai-sdk/google` 4.0.82 (7.82 d), `@ai-sdk/openai` 4.0.78 (7.60 d). Both major
    lines started on 2026-06-25.
  - All three pin `@ai-sdk/provider` 4.0.18 and `@ai-sdk/provider-utils` 5.0.49, so the majors match.
  - The exact transitive pins are old enough too: gateway 4.0.94 (7.82 d), provider 4.0.18 (10.32 d).
  - Newer patches (`ai` 7.0.117–7.0.127 and so on) are inside the 7-day window. Nothing was held.
- **The 169-01 key check.**
  - `yarn why undici` lists only 7.30.0 (already in the tree for cheerio) and 8.11.2.
  - `yarn why @fastify/busboy` prints nothing.
  - `audit:deps`: `0 new, 1 accepted (braces)`. No override and no baseline row were needed.
- **Legitimacy.** The one new lockfile name is `@workflow/serde` 4.1.0: Vercel's repository, 21M weekly downloads,
  no postinstall, `SUS` for `too-new` only. All target versions have 0 GitHub advisories.
- **The migration (`0bf2782a7`), done by hand against the 6.0 and 7.0 guides bundled in the package:**
  - `createGoogleGenerativeAI` → `createGoogle`.
  - `generateObject` is kept: it is deprecated but still exported. It now passes `allowSystemInMessages: true`
    (see Decisions).
  - `streamText` passes `instructions`, falling back to the deprecated `system`.
  - Cost calculation reads `inputTokenDetails.cacheReadTokens` and `outputTokenDetails.reasoningTokens`. The old
    top-level fields no longer exist, so reasoning and cached-input costs would otherwise have gone silently to zero.
  - `CallSettings` is spelled out as `LanguageModelCallOptions & Omit<RequestOptions, 'timeout'>`, and
    `StreamTextResult` takes its new runtime-context argument. The public type names of `@openvaa/llm` are unchanged.
  - The condenser's aggregated `llmMetrics.tokens` carries the new detail objects, with `undefined` members because
    the per-call records keep only totals. This was the one consumer typecheck error.
- **Tests.**
  - The mocks use the 7.0 usage and stream-result shapes, with no new `eslint-disable` (61 before, 61 after).
  - Four cases were added: the Google factory, the system-message opt-in, `system` → `instructions`, and the real
    `calculateLLMCost` on the 7.0 usage shape.
  - Results: `llm` 43/43, `argument-condensation` 30/30, `question-info` 22/22, frontend admin 42/42, forced
    typecheck 23/23.
- **Real-runtime smoke run** (throwaway script, `MockLanguageModelV4`, no network and no API key):
  - A system-only prompt goes through `LLMProvider.generateObject`.
  - A non-conforming object is still rejected by the zod schema after the validation retries.
  - Plain `generateObject` without the opt-in throws `System messages are not allowed…`, which confirms the hazard.
  - `streamText` sends `system` as the instructions.
- **`openai` removed (`32a0eed8a`).** No importer exists. 20 lockfile names left with it, and so did the `zod`
  `YN0060` warning.
- **Gates and E2E.**
  - `169-09-group7` is 12/12 at `6ab069778`. Lint shows 0 errors and 17 warnings, and its normalised list is identical
    to 169-08's.
  - The first gate run (`-attempt1`) was red only on the comment-hygiene guard (see Deviations).
  - Full E2E: 171/171/0/0/0 (`169-e2e/169-09-group7`), with the voter-journey slider flake not recurring.

## Task Commits

1. **Task 1: the AI SDK majors, `packages/llm` and the consumer migrated**: `0bf2782a7` (chore)
2. **Task 2: remove `openai`**: `32a0eed8a` (chore)
3. **Task 3: group-7 gates and E2E**: `6ab069778` (style, the comment-hygiene fix found by the gates); the evidence
   went in as `4a9f2bd28` (docs)

**Plan metadata:** the SUMMARY / STATE / ROADMAP / REQUIREMENTS / handoff commit follows.

## Files Created/Modified

- `packages/llm/package.json`: `ai ^7.0.116`, `@ai-sdk/google ^4.0.82`, `@ai-sdk/openai ^4.0.78`; `openai` removed.
- `yarn.lock`: the AI SDK subtree replaced (one new name, `@workflow/serde`); the `openai` 4 subtree removed.
- `packages/llm/src/llm-providers/llmProvider.ts`: `createGoogle`; the `generateObject` system-message opt-in;
  `streamText` `instructions`.
- `packages/llm/src/llm-providers/provider.types.ts`: the call-settings alias; `StreamTextResult` arity.
- `packages/llm/src/utils/costCalculation.ts`: the usage detail fields; the doc example.
- `packages/llm/src/types/llmPipelineResult.ts`: the doc example now shows the 7.0 usage shape.
- `packages/llm/tests/llmProvider.test.ts`: 7.0 mocks, and four new cases.
- `packages/argument-condensation/src/core/condensation/condenser.ts`: the usage detail objects on the run metrics.
- `packages/argument-condensation/src/core/types/condensation/condensationResult.ts`: the doc example.
- `169-EVIDENCE.md`: § 1 re-measurement, § 2 legitimacy and the undici check, § 3 hold released, § 4 gates and E2E,
  § 6 the migration table, smoke run and security read.

## Decisions Made

See `key-decisions` in the frontmatter. The one with security weight is the `allowSystemInMessages` opt-in. It
restores the 5.x behaviour for exactly one method (`generateObject`), whose callers all build their messages
server-side from prompt templates. No caller passes a user-authored message array, so the opt-in adds no path for a
user to inject a `system` role. The prompt content, including candidate comments interpolated into it, is unchanged.
`streamText`, a likelier future home for user messages, keeps the SDK's rejecting default.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Every caller's prompt would have been rejected by AI SDK 7**
- **Found during:** Task 1 (reading the 7.0 guide against the callers).
- **Issue:** AI SDK 7 throws `InvalidPromptError` for `role: 'system'` messages in `messages` unless
  `allowSystemInMessages` is set. `condenser.ts` (two calls) and `infoGeneration.ts` send exactly that. Their unit
  tests mock `LLMProvider`, so every test stayed green while every real job would fail.
- **Fix:** `generateObject` passes `allowSystemInMessages: true`, and a test pins it. A real-runtime smoke run showed
  both the failure without the flag and the success with it.
- **Files modified:** `packages/llm/src/llm-providers/llmProvider.ts`, `packages/llm/tests/llmProvider.test.ts`
- **Commit:** `0bf2782a7`

**2. [Rule 3 - Blocking] A consumer outside the plan's file list failed to typecheck**
- **Found during:** Task 1, `argument-condensation` typecheck.
- **Issue:** `condenser.ts` builds `llmMetrics.tokens: TokenUsage` from totals, and 7.0's `LanguageModelUsage` requires
  `inputTokenDetails` / `outputTokenDetails`.
- **Fix:** add both objects with `undefined` members, and update the doc example in `condensationResult.ts`.
- **Commit:** `0bf2782a7`

**3. [Rule 1 - Gate] A new comment broke the comment-hygiene guard**
- **Found during:** Task 3, `169-09-group7-attempt1` `04-lint`.
- **Issue:** a two-line comment split one sentence (`assert:comment-hygiene` rule 2).
- **Fix:** joined it onto single lines (`6ab069778`). The gate re-run is 12/12.

### Added verification (no scope change)

- **Four new unit cases**, plus an ad-hoc `tsc` run over `tests/`, which the package tsconfig excludes. The test file
  had drifted from the 7.0 types, so the type check confirmed the mocks match them.
- **A throwaway real-runtime smoke script** (deleted after the run). Its output is in EVIDENCE § 6.

### Plan steps that did not trigger

- **Move off `generateObject`:** not needed, because 7.0.116 still exports it.
- **Remove `jsonrepair`:** it was already gone.
- **Hold per D-06:** the target majors no longer pull `undici` 5, so nothing was held.
- **Frontend admin feature files:** they needed no change (they reach the SDK only through `@openvaa/llm`), but their
  tests ran.

**Total deviations:** 3 auto-fixed (1 runtime bug, 1 blocking type error, 1 gate finding), no holds.

## Issues Encountered

None beyond the deviations. The voter-journey slider flake did not recur. No E2E spec drives the LLM admin jobs, because they need a provider key, so the runtime proof of the SDK path is the mock-model smoke run.

## User Setup Required

None. No API key was read or used. The admin LLM features need no configuration change.

## Known Stubs

None.

## Threat Flags

None new.
- T-169-30: the error paths were read once more (EVIDENCE § 6). They print nothing new; no key, `config` or provider
  object reaches a log or error.
- T-169-31: the zod schema remains the validator. The smoke run showed a non-conforming object rejected, and
  PROH-169-18 held: no `any`, no dropped schema, no cast replacing a parse.
- T-169-SC: the age gate was re-measured live, the one new name passed the legitimacy check, and no codemod was
  fetched or run.

## Next Phase Readiness

- **169-10 (small majors)** can start from this close-out.
  - The local stack `openvaa-local` is on PG17.6, last reset by this plan's E2E run.
  - No dev server, Playwright or turbo process is left running.
- **169-13:** the audit's only accepted finding is still `braces`. The AI SDK hold row in § 3 is marked released.
- **nodemailer 10 pin:** held until 2026-10-04T07:51Z. This plan ended before then, so it was not applied.
- **Note for later AI work:** a new caller of `LLMProvider.streamText` must pass system instructions through `system`
  / `instructions`, not as a `system` message.

## Self-Check: PASSED

- Files exist: `169-09-SUMMARY.md`, `tests/e2e-runs/169-gates/169-09-group7/summary.tsv` (12 rows, all 0),
  `tests/e2e-runs/169-e2e/169-09-group7/summary.json` (171/171/0/0/0), `tests/e2e-runs/169-gates/09/lint-norm-after.txt`.
- Commits in `git log`: `0bf2782a7`, `32a0eed8a`, `6ab069778`, `4a9f2bd28`.
- Artifacts: `packages/llm/package.json` contains `"ai":` and no `openai`; `llmProvider.ts` contains `from 'ai'`.
