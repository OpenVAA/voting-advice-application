# Deferred items surfaced during Plan 88-04 execution

These are pre-existing issues discovered out-of-scope of 88-04's surface.
Logged here per execute-plan deferred-items protocol; NOT fixed in 88-04.

## packages/dev-seed/tests/templates/e2e.test.ts:431 — questions.fixed count drift

Test asserts `questions.fixed.length === 18`, actual is 25.

Last touched lineage:
- 44c910da4 feat(82-01): add sort-24 required-empty fixture + Alpha LocalizedString answer
- de020c6c7 feat(81-01): e2e fixture — sort-21 retrofit + new sort-23 email row + Alpha answer migration
- 41746a15d feat(77/dev-seed): add test-question-number-1 + customData.filterable for SETTINGS-01 wave B

The test expectation was authored at "18" pre-Phase 77; subsequent phases (77, 81, 82) added rows but did not update the assertion. PRE-EXISTING failure in `yarn test:unit` for @openvaa/dev-seed, completely unrelated to 88-04 surface.

**Action:** to be addressed in a future hygiene plan (likely 88-LAST during TEST-INVENTORY.md refresh, or a separate v2.11+ test-expectation refresh). Do NOT fix in 88-04 (out of scope; would also need verification that the new row counts match design intent across e2e template).

## voter-mega-journey.spec.ts:313 — expectQuestionDisplayToHave heading-filter lookup

Test step "candidate details: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special"
(line 923) calls `expectQuestionDisplayToHave(opinionsTab, { questionText:
/Base opinion 1 — Likert 5/i, numSelected: 2 })` (line 1014), which uses the
legacy helper at line 298-326.

The helper's locator at line 309-313:
```
const block = opinionsTab
    .getByTestId(testIds.voter.entityDetail.opinionQuestion)
    .filter({ has: opinionsTab.getByRole('heading', { level: 3, name: questionText }) });
await expect(block).toHaveCount(1, ...)
```

resolves to 0 elements despite the page DOM containing the heading
"[qu-opin-base-1-likert5] Base opinion 1 — Likert 5." at level=3 (verified via
playwright-results/.../error-context.md snapshot).

**Pre-existing.** Verified via stash+checkout roundtrip against commit
27ef8f998 (the pre-88-04 baseline). Same failure mode.

**Root cause hypothesis:** Playwright's `filter({ has: <heading-locator> })`
combined with `.getByRole('heading', { level: 3, name: <regex> })` may not
match when the heading content includes a `[<id-token>]` substring before
the regex-matched substring. The Wave 1.5 testid additions and Wave 3
fixture additions DID NOT touch this helper or its callers — the 4 calls
in the matrix step at lines 1014/1018/1023/1028 used to pass on the
pre-T2 dataset (where the heading was just "Base opinion 1 — Likert 5").
After T2 (already shipped via quick-task 260527-nat) the heading is
"[qu-opin-base-1-likert5] Base opinion 1 — Likert 5." — the regex IS a
substring of the new heading text, but Playwright's role-name regex
matcher may be matching against the full accessible name in a way that
fails on the new shape (possibly the U+2014 em-dash inside an
already-bracketed accessible name).

**Action:** to be addressed in a future 88-NN plan that focuses on the
matrix step refactor (its body wasn't in scope for 88-04 — only its
navigation was simplified per Task 7c). Likely fix: replace the
`getByRole('heading', { level: 3, name: ... })` with
`getByRole('heading', { level: 3 }).filter({ hasText: ... })` which is
more robust against the post-T2 heading prefix.

Tracked in deferred-items.md (NOT committed; consumed by 88-LAST or future
88-NN plans).
