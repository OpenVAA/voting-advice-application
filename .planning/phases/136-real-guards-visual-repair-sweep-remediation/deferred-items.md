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
