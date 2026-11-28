---
created: 2026-08-27T16:06:00.000Z
title: candidateProfilePage.fixture.ts:179 is a doubly-weak assertion Phase 147 deliberately left in place
area: tests / assertion quality
severity: minor
source: Phase 147 (147-NEGATIVE-CONTROL.md rows RK2-OLD / RK2-NEW; 147-SCOUT-INVENTORY.md § D; filed by 147-05)
files:
  - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
---

## The site

```ts
// tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:179
await expect.soft(q).toContainText(/required/i);
```

It is weak in **two independent ways**, and both are measured, not argued:

1. **`/required/i` matches the raw key.** `common.required` contains the substring `required`, so
   the assertion passes on a broken catalogue exactly as it passes on a working one. Register row
   `RK2-OLD`: with `common.required` deleted from all seven locale catalogues, the `sr-only` marker
   rendered the literal key **7 times** in the run's own trace, `Required` **0** times — and the
   matcher passed.
2. **`expect.soft`.** Even a genuine miss here does not fail fast; it is collected and reported at
   the end of the test.

Row `RK2-NEW` re-confirmed both properties on the **post-extension** tree rather than carrying the
old reading forward: in one Playwright invocation, the candidate scan FAILED naming
`common.required` on `cand-profile` (both themes) while this matcher PASSED in the same run.

## Why Phase 147 did not patch it

Deliberately, and on the record. ROADMAP Phase 147 criterion 3 says in terms: *"Patching those two
matchers in place does **not** satisfy this: the route-family extension is the fix."* Phase 147
closed the raw-key **class** on the candidate surfaces via the scan, which is strictly stronger than
two site patches — it covers future keys and future surfaces too.

**But the class being covered does not make this assertion good.** The scan proves the *key* is not
rendering raw; it does not make `:179` assert what its author meant. That is a separate defect, and
it is filed separately so it is not read as closed by Phase 147's green.

## Solution

Assert the **resolved** string, not a regex the raw key satisfies — the shape `voter-journey.spec.ts`
already adopted for `common.answer.yes` under REAL-04 (`cc9830191`), where `/Yes/i` was replaced by
an exact assertion on the resolved answer for precisely this reason. Then decide whether the `soft`
is still wanted; if it is, say why in a comment, because a soft assertion on a fixture helper is a
choice a reader cannot otherwise reconstruct.

## Related

- `candidate-journey.spec.ts:924` — `toHaveText(/edit/i)` vs `candidateApp.questions.editAnswer`,
  the sibling blind site, also deliberately left in place (rows `RK1-OLD` / `RK1-NEW`). Same
  reasoning, same remedy; it is not `expect.soft`, so it is weak in one way rather than two.
- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F2, the class both sites belong to.
