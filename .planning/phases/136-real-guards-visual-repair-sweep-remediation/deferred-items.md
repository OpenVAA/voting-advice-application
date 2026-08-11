# Deferred items — Phase 136

Out-of-scope discoveries logged during execution. Not fixed here (scope boundary).

## From 136-02 (F12 / F14 remediation)

### D-136-02-1 — Pre-existing locale-dependent failure in `formatAnswer.test.ts`

**File:** `packages/data/src/utils/formatAnswer.test.ts:25`

```
FAIL |@openvaa/data| formatDateAnswer > Should return the formatted date string
                    using the default format when question.format is undefined
AssertionError: expected '5.10.2023' to be '10/5/2023'
```

Present on the baseline run **before** any 136-02 edit and unchanged after. The test hardcodes an
`en-US` rendering (`'10/5/2023'`) while `formatDateAnswer` falls back to the **ambient machine
locale** when `question.format` is undefined; this machine is `fi`, so it renders `'5.10.2023'`.

Same defect family as the phase's theme — a test whose outcome depends on ambient environment
rather than on the code under test — but it is a *false failure*, not a fake guard, and it is
outside the F12/F14 site list. Fix belongs in a separate change (pin the locale explicitly in the
test, or make the fallback locale deterministic in `formatDateAnswer`).

### D-136-02-2 — `arrayContaining` in `packages/dev-seed/tests/templates/base.test.ts:254`

```ts
expect(cat?._constituencies?.external_id).toEqual(
  expect.arrayContaining(['test-e2e-base-co-mun-se', 'test-e2e-base-co-mun-sw'])
);
```

Same subset-matcher class as F12, but the audit deliberately did not list it and it sits outside
this plan's grep scope (`packages/data`, `packages/filters`). Unlike the F12 sites, it is not
obvious that the SE/SW pair is the *complete* intended sentinel set rather than a required subset —
converting it without confirming the template's intent risks turning a correct assertion into a
brittle one. Needs a decision from whoever owns the base template's scoping sentinels.

## From 136-01 (F7 dead-wait removal)

**Give `NumberScaleInput.svelte` a question-id-scoped `name` attribute.**
`apps/frontend/src/lib/components/questions/NumberScaleInput.svelte` renders the
native range with `data-testid="question-number-slider"` and no question-id
scoping (its only label handle is a per-mount `getUUID()`). `QuestionChoices.svelte`
already carries `name="questionChoices-{question.id}"` precisely so the voter walk
can disambiguate the incoming question from the outgoing one during the page-reuse
DOM lag. Extending the same contract to the slider would let
`voter-journey.fixture.ts` drop the `sliderJustAnswered` guard, would close the same
latent stale-slider hazard in the loop-entry probe (~line 329), and would remove the
last case (two adjacent NUMBER questions) that still pays the 10s wait.

Not done in 136-01: it is product code, and 136 is a test-guard remediation phase.
One line, render-invisible (`name` on an `<input type="range">` is standard form
semantics and the app does not use native form posts for answers).
