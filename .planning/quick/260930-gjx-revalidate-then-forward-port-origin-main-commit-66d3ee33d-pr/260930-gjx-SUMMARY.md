---
phase: quick-260930-gjx
plan: 01
status: complete
subsystem: frontend/questions
tags: [i18n, question-arguments, interactive-info, forward-port]
requires: []
provides:
  - "Correct pro/con argument labels in all 7 locales, pros first"
  - "hasExtendedInfo(question) helper in $lib/utils/questions"
  - "Arguments-only questions reachable in the extended-info popup"
affects:
  - apps/frontend voter questions route
  - perm-interactive-info E2E seed/spec comments
tech-stack:
  added: []
  patterns: ["Svelte 5 component mount tests with a mocked component context", "catalogue invariant + runtime/type-gen parity test per locale"]
key-files:
  created:
    - apps/frontend/src/lib/components/questions/QuestionArguments.svelte.test.ts
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte.test.ts
    - apps/frontend/src/lib/utils/questions/extendedInfo.ts
    - apps/frontend/src/lib/utils/questions/extendedInfo.test.ts
  modified:
    - apps/frontend/src/lib/components/questions/QuestionArguments.svelte
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
    - apps/frontend/messages/fi/questions.json
    - apps/frontend/src/lib/i18n/translations/fi/questions.json
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/utils/questions/index.ts
    - "apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte"
    - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
    - tests/tests/specs/perm/perm-interactive-info.spec.ts
decisions:
  - "Only fi catalogue values were swapped; the other six locales were already internally consistent (con = against, pro = for)"
  - "Upstream's QuestionExtendedInfoDrawer change has no counterpart: QuestionExtendedInfoButton already passes question to QuestionExtendedInfo through drawerHost.open"
metrics:
  duration: 9min
  completed: 2026-09-30
actuals:
  tokens: 6190
  tasks: 3
  commits: 3
plan_head_before: 6798df6612243158b47cb70d68aaf4089a73133c
plan_head_after: f8769eb97beaebdc0f5e35a62dc14430952aa4d4
---

# Quick 260930-gjx: Forward-port of origin/main 66d3ee33d (question argument pro/con labels and rendering) Summary

Voters now see pro arguments under the "for" label and con arguments under "against" in all seven locales, with pros listed first. A question that has arguments but no info text or infoSections now shows the extended-info button, and its popup shows the arguments expander. Unit tests and a per-locale catalogue invariant pin both fixes.

## Revalidation at HEAD (6798df661)

- `git merge-base --is-ancestor 66d3ee33d HEAD` exited 1, so the upstream fix is absent from this branch.
- **F1 holds.** `TITLE_KEYS` in QuestionArguments.svelte mapped BooleanCons/LikertCons to `questions.arguments.pro` and BooleanPros/LikertPros to `questions.arguments.con`. The `sortArguments` doc said "cons before pros" while the comparator moved cons last, and the comparator was asymmetric (two cons both returned 1).
- **F2 holds.** In QuestionExtendedInfo.svelte the arguments Expander sat inside the `{#if infoSections?.length}` block and was guarded on the bare truthiness of `args`.
- **F3 holds.** The `questions/+layout.svelte` interactiveInfo gate was `(info || customData.infoSections?.length)`, with no arguments term.
- **F4 holds.** Only fi was swapped (`con: Puolesta`, `pro: Vastaan`), and it was swapped the same way in both catalogues. da/en/et/fr/lb/sv were already consistent, and the runtime and type-gen values already matched in every locale.
- **E2E consumers:** `questionInfo.fixture.ts` `expectArguments` targets type- or choiceId-keyed group testids and checks visibility only. No spec asserts label text or group order.

### RED evidence
- QuestionArguments: the likert and boolean heading/order cases failed at HEAD (2 of 4).
- The same-side stability and categorical cases passed at HEAD. The asymmetric comparator is inconsistent, but V8's sort still produced the right order for every small input I tried, so those cases guard against regressions rather than reproduce a visible bug.
- Translations: I temporarily restored the HEAD fi catalogues and the fi argument-label invariant failed ("Puolesta: {option}" does not contain "Vastaan"). I then put back the fixed files.
- extendedInfo: the test failed on import because the helper did not exist yet.
- QuestionExtendedInfo: the arguments-only case failed at HEAD (no `voter-questions-arguments`).

## Tasks

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Revalidate; fix pro/con TITLE_KEYS, symmetric pros-first sort, component doc, fi catalogues; label invariant + parity tests | 06c25c5f0 |
| 2 | `hasExtendedInfo` helper + truth-table test; questions layout gate uses it | 9ce7a0bda |
| 3 | QuestionExtendedInfo renders arguments without infoSections, and nothing for `[]`; seed/spec comments aligned | f8769eb97 |

## Verification

The full Task 3 chain exits 0:
- frontend unit tests for questions components, question utils and i18n tests: 355 passed
- frontend typecheck (0 errors) and lint
- dev-seed lint
- tests eslint on the spec, and tests typecheck
- `assert:comment-hygiene` (0 violations) and `assert:i18n-catalog-namespaces`
- prettier `--check` on the touched files

Frontend lint reports one warning in `candidateContext.svelte.test.ts`. It was already there, the file is untouched, and it is out of scope.

In the seed, only one comment line changed and the seeded data is byte-identical. No E2E assertion changed. I did not re-run E2E: the perm-interactive-info assertions target the same testids and visibility, so the next full-suite run is the confirmation.

## Deviations from Plan

**1. [Rule 2 - Test coverage] Added a fifth QuestionExtendedInfo case: info sections plus an empty arguments array**
- **Found during:** Task 3 RED.
- **Issue:** The planned empty-array case has no infoSections, so it passed at HEAD and did not exercise the `args` → `args?.length` guard change. Before the fix, `[]` next to infoSections rendered an empty arguments expander.
- **Fix:** Added a case asserting no `voter-questions-arguments` element when sections and `arguments: []` are both present.
- **Commit:** f8769eb97

Otherwise the plan was executed as written.

## Known Stubs

None.

## Self-Check: PASSED
- All created files exist on disk.
- Commits 06c25c5f0, 9ce7a0bda and f8769eb97 exist on fix/888-review-findings.
