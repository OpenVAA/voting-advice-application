# Phase 133: Fix Phase 132 code review gaps - Pattern Map

**Mapped:** 2026-07-24
**Files analyzed:** 2 (both modified, no new files)
**Analogs found:** 2 / 2 (in-file self-analogs — this is a refactor/deletion phase)

## Nature of this phase

Test-harness-only refactor. No product code, no new files, no new packages. Both
target files already exist and are the closest analog for their own change (the
patterns to copy live *inside the same files*). The work is: delete dead code,
replace four hard-nav `catch` branches with deterministic `continue`, and flip
one negative-lookahead URL assertion to a positive one.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `tests/tests/utils/voterNavigation.ts` | test-utility (E2E journey helper) | request-response (UI screen-graph traversal) | itself — `advanceClick` + loop-exhaustion terminal `waitFor` are the in-file idioms to copy | exact (self) |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | test (E2E spec) | request-response (URL assertion) | itself — line 681 `toHaveURL(/\/candidate\/profile/)` positive-assertion idiom in the very next step | exact (self) |

## Pattern Assignments

### `tests/tests/utils/voterNavigation.ts` (test-utility, request-response)

**Analog:** itself. Three coordinated edits — WR-01 (deletions + branch rewrite) and IN-02 (dead-code deletion, resolved by WR-01's deletions).

#### 1. Deletions (WR-01 + IN-02)

Remove these module-private symbols (verified no external consumer; only
`navigateToFirstQuestion` is exported):

- `navigateDirectlyToQuestions` (lines 273-289)
- `resolveSeedUuids` (lines 25-46)
- `uuidCache` module variable (lines 22-23)
- The `SupabaseAdminClient` import (line 13) — becomes unused after the above.

Also delete the two docstring bullets referencing the removed fallback:
- Line 116 "SvelteKit `goto()` silently failing post-continue (hard-nav fallback)"
- The `advanceVoterFlow` docstring mention of the hard-nav fallback (lines 117).

#### 2. Constituencies branch rewrite (lines 181-221 → deterministic `continue`)

**Current pattern to replace** (the hard-nav `catch` at 199-202 and 217-219):
```ts
try {
  await constituenciesCont.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
} catch {
  await navigateDirectlyToQuestions(page);   // REMOVE
  continue;
}
// ...
try {
  await page.waitForURL(
    (url) => url.toString() !== urlBefore && !url.toString().includes('/constituencies'),
    { timeout: 3000 }
  );
} catch {
  await navigateDirectlyToQuestions(page);   // REMOVE
}
continue;
```

**Replacement idiom** (RESEARCH.md recommended shape — keep bounded visibility
wait, swap hard-nav `catch` for `continue`; drop try/catch on the URL settle and
use `.catch(() => null)` so the loop re-detects):
```ts
try {
  await constituenciesCont.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
} catch {
  continue; // continue never rendered → re-detect screen next iteration
}
const urlBefore = page.url();
try {
  await constituenciesCont.click({ timeout: 3000 });
} catch {
  continue;
}
await page
  .waitForURL(
    (url) => url.toString() !== urlBefore && !url.toString().includes('/constituencies'),
    { timeout: TIMEOUTS.page }
  )
  .catch(() => null); // no hard-nav; loop re-detects current screen
continue;
```

#### 3. Elections branch rewrite (lines 223-253) — mirror of the constituencies branch above.

#### 4. Preserve unchanged (the self-analog idioms that already do the right thing)

**Loop-exhaustion terminal `waitFor`** (lines 264-270) — this is the "fail loudly"
mechanism that replaces the hard-nav. Keep as-is; it names the expected checkpoint:
```ts
if (stopAt === 'first-question') {
  await answerOption.waitFor({ state: 'visible', timeout: perStepTimeout });
} else if (stopAt === 'questions-intro') {
  await questionsStart.waitFor({ state: 'visible', timeout: perStepTimeout });
} else {
  await categoryStart.waitFor({ state: 'visible', timeout: perStepTimeout });
}
```

**Top-of-loop `anyCheckpoint.waitFor`** (lines 161-162) — the deterministic
screen re-detection that self-heals a transient continue stall. Unchanged.

**`advanceClick` fast-fail-click + settle idiom** (lines 79-102) — the model for
the "tight 3s click then settle" pattern the rewritten branches follow. Unchanged.

---

### `tests/tests/specs/candidate/candidate-journey.spec.ts` (test, request-response)

**Analog:** itself — the very next step (line 681) already uses the positive
assertion idiom.

**IN-01 target** (line 671):
```ts
// current (negative-lookahead — passes on ANY non-profile candidate route):
await page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage });
// fix (positive home assertion, tolerates optional locale prefix + trailing slash):
await page.waitForURL(/\/candidate\/?(?:\?|#|$)/, { timeout: TIMEOUTS.slowPage });
```

**In-file positive-assertion analog** (line 681, unchanged — copy its shape):
```ts
await expect(page).toHaveURL(/\/candidate\/profile/, { timeout: TIMEOUTS.slowPage });
```

Confirm the actual post-submit `goto` destination string at implementation time
(Assumption A2 / Open Question 1) before locking the exact regex; the run is
English so `/candidate` is expected unprefixed, but the regex above tolerates a
locale prefix defensively.

---

## Shared Patterns

### Timeout buckets (apply to every wait in both files)
**Source:** `tests/tests/helpers/timeouts.ts` (imported as `TIMEOUTS` from `../helpers`)
**Apply to:** all `waitFor` / `waitForURL` / `click` timeouts
```ts
element: 2_000   // element visibility, no URL change
click:   2_000   // action-ack
page:    5_000   // single navigation / URL change
slowPage:10_000  // cold-start multi-roundtrip
```
The tight `3000` literals inside `advanceClick` and the click branches are
deliberate sub-bucket fast-fails carrying `// reason:` comments — keep that
convention for any new tight timeout (annotate why it is below the nearest bucket).

### TestId locators (no-raw-locators lint rule)
**Source:** `tests/tests/utils/testIds.ts` (imported as `testIds`)
**Apply to:** all element selection — `page.getByTestId(testIds.voter.*)` /
`testIds.candidate.*`, or role locators (`getByRole('combobox'|'listbox'|'option')`).
Both files already comply; the rewrite must not introduce raw CSS/text locators.

### `// reason:` acceptance comments for non-bucket timeouts
**Source:** existing comments at lines 82-84, 95-97, 137-138 of voterNavigation.ts
**Apply to:** any retained/new timeout that deviates from a `TIMEOUTS.*` bucket —
keep a one-line rationale directly above it.

## No Analog Found

None. Every change has an in-file precedent to copy.

## Metadata

**Analog search scope:** `tests/tests/utils/`, `tests/tests/specs/candidate/`, `tests/tests/helpers/`
**Files scanned:** voterNavigation.ts, candidate-journey.spec.ts, timeouts.ts (RESEARCH.md pre-verified testIds.ts + consumer sweep)
**Pattern extraction date:** 2026-07-24
