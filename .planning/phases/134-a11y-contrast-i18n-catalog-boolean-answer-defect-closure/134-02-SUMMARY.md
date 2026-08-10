---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 02
subsystem: a11y-regression-gate
tags: [a11y, wcag, axe, playwright, entity-filters, contrast, coverage]
status: complete

requires:
  - "134-01 — the single AXE_ROUTES table, the `fixture` discriminant, the required `contentTestId`, and the `assertAxeScan` shared body"
  - "entityFilters fixture (tests/tests/fixtures/voter/entityFilters.fixture.ts)"
  - "answeredVoterPage fixture (voter-journey.fixture.ts)"
  - "`e2e/base` dataset (3 filterable questions, one numeric)"
provides:
  - "results-filter-drawer — the first axe scan that has ever reached the results filter drawer"
  - "NumericEntityFilter label spans on a token with a real CSS rule (`small-label`)"
affects:
  - "a11y-smoke project test count: 13 → 14"
  - "any future change to EntityFilters / NumericEntityFilter / EnumeratedEntityFilter is now contrast-gated in CI (light theme)"

tech-stack:
  added: []
  patterns:
    - "Lazily-imported UI content ⇒ anchor the scan on the lazy body's own testid, never on the container that renders before the `{#await import(...)}` resolves"
    - "Reach-the-target settle delegates to the domain fixture (openFilterDialog / getFilter) rather than re-deriving its invariants inline"
    - "Bounded expansion loop: count read once up front, each step bounded by the fixture's own visibility assertion — no polling, no fixed-duration sleep"

key-files:
  created: []
  modified:
    - "tests/tests/specs/a11y/a11y-smoke.spec.ts"
    - "apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte"

decisions:
  - "D-05 implemented as a fixture-driven `answered` entry anchored on `entity-filter-numeric-min`, not on the dialog root — the filter bodies are lazily imported, so a root anchor would have scanned an empty drawer and reproduced the exact class of false-pass that 134-01 existed to kill."
  - "D-02 swap executed as a token swap onto `small-label`; the resulting UPPERCASE/~11.5px appearance change is accepted per D-22 and is named below so it is not read as a regression."
  - "D-06 honoured: no computed-colour assertion was added on top of the existing global zero gate."

metrics:
  duration: "~35 min"
  completed: 2026-08-10

actuals:
  tokens: 8950
  tasks: 2
  commits: 2
---

# Phase 134 Plan 02: Filter-Drawer Axe Coverage + `small-label` Swap — Summary

The results filter drawer — the surface the v2.14 audit named for FIX-01 and the one thing in the
voter app that no axe scan had ever touched — is now scanned with all three filter rows expanded,
and the numeric filter's labels no longer hang off a class that matches no CSS rule anywhere in the
repo.

## What was built

**Task 1 — `4494543ea`.** `text-label` → `small-label` on the three label spans in
`NumericEntityFilter.svelte` (lines 85, 98, 113 — the ROADMAP/REQUIREMENTS numbers 84/97/112 point at
the enclosing `<label>`, per D-19).

The class was verified dead before the swap, not assumed: `grep -rn 'text-label' apps/frontend/src`
returned **exactly the three spans and nothing else** — no CSS rule, no other consumer. It rendered
`rgb(51,51,51)` at `opacity: 1` purely by inheritance. The replacement is the project's own muted-label
token (`app.css:377` → `@apply text-secondary text-xs font-normal uppercase`), already consumed by
`ConstituencySelector` and `QuestionChoices`; per D-02 this is a swap onto an established token, not a
new `--color-label` theme variable. Sibling utilities were preserved verbatim on all three spans
(`min-w-[6rem] text-start` ×2, `min-w-[6rem] justify-start text-start` ×1). `EnumeratedEntityFilter`
was **not** touched — D-02 scopes the change to this one file.

**Task 2 — `8f6eaede4`.** A seventh `AXE_ROUTES` entry, `results-filter-drawer`, `fixture: 'answered'`.

- **Anchor:** `contentTestId: testIds.voter.results.filterNumericMin`. This is the load-bearing choice.
  The filter bodies are lazily imported (`{#await import('./numeric')}`), so anchoring on the dialog
  root or on `entity-filter-row` would have let the scan fire while the bodies were still unmounted —
  precisely the "passes against a DOM that does not contain the thing being checked" failure that
  134-01 hardened the table against. The numeric input only exists once the lazy body has mounted.
- **Settle:** wait `entity-card` visible (`TIMEOUTS.slowPage`) → `createEntityFilters(page)
  .openFilterDialog()` → read `dialog.getFilters().count()` once → loop `dialog.getFilter(() => index)`
  to auto-expand every row through the Expander's internal `role=checkbox, name=/expand or collapse/i`
  toggle. No hand-rolled filter-button click (the fixture owns the two-conditional-render `.first()`
  invariant and the fallback off the unreliable `entity-filter-dialog` testid), no Expander header
  click, no `waitForTimeout` anywhere in the file.
- Header route list, the "distinct entries" count (6 → 7), the global-zero-gate comment and the
  theme-coverage note were all updated so the file's prose does not drift from its table.
- Per D-06, no computed-colour assertion was added — the existing global zero gate carries it.

## Filter rows the drawer scan expands (`e2e/base`)

The plan asked for this number, so it was **measured, not inferred**: a throwaway probe was added to
the settle, the scan re-run, and the probe removed (the file is byte-identical to the committed state —
`diff -q` confirmed, and `grep -c 'console.log'` returns 0).

| Row | Label | Kind | Options rendered after expand |
|---|---|---|---|
| 0 | Party | enumerated | AA 5 · AB 1 · BA 2 · BB 2 · C 2 · No answer 1 · Unselect all |
| 1 | `[qu-info-multipleChoiceCategorical]` pick multiple | enumerated | Choice A 12 · Choice B 12 · Choice C 1 |
| 2 | `[qu-info-number]` years of experience | numeric | 1 × `entity-filter-numeric-min` (range input) |

**`rowCount = 3`**, matching `voter-journey.spec.ts:1424`'s independent count. `numericInputs = 1` at
scan time — i.e. the anchor is real content, and the scanned DOM genuinely contains the swapped
`small-label` spans plus both enumerated bodies.

## Accepted appearance change (D-22) — name it, do not read it as a regression

`small-label` makes the numeric filter's **min / max / missing-value labels UPPERCASE at ~11.5px** on
the secondary text colour. Before the swap they were mixed-case at the inherited body size and colour.
This is an **intended, operator-accepted** cost of moving onto a token with a real CSS rule, recorded
here per D-22. Contrast after the swap is **5.74:1 light / 6.24:1 dark**, both clearing WCAG 2.1 AA,
and the drawer scan reports 0 violations with those spans in the scanned DOM.

## Verification — actual output

| Gate | Command | Result |
|---|---|---|
| Targeted scan | `npx playwright test … --project=a11y-smoke -g "filter-drawer" --workers=1` | **3 passed (28.2s)** — the scan + data-setup-base + data-teardown-base; 0 failed, 0 did-not-run |
| Full a11y project | `npx playwright test … --project=a11y-smoke --workers=1` | **14 passed (1.5m)**, exit **0** — 0 failed, 0 did-not-run (was 13 before this plan; +1 is the new entry) |
| Drawer attachment | extracted from the JSON report | `axe-violations-results-filter-drawer.json` → **`[]`** |
| All attachments | same run | all **10** `axe-violations-*.json` are `[]` (home, home-dark, elections-selector ±dark, constituencies-selector-located ±dark, questions, results, voter-detail-drawer, results-filter-drawer) |
| Test typecheck | `yarn typecheck:tests` | exit **0** |
| svelte-check | `yarn workspace @openvaa/frontend check` | **2092 FILES 0 ERRORS 0 WARNINGS** |
| Lint | `yarn lint:check` | **0 errors** (2 pre-existing warnings, both in files this plan never touched) |
| Format (touched files) | `npx prettier --check` on both files | clean |
| Dead-class removal | `grep -c 'text-label' NumericEntityFilter.svelte` | **0** |
| Token swap | `grep -c 'small-label' NumericEntityFilter.svelte` | **3** |
| Siblings preserved | `grep -c 'min-w-\[6rem\]' NumericEntityFilter.svelte` | **3** |
| Task-1 diff shape | `git diff --stat apps/frontend/src/lib/components/entityFilters/` | 1 file changed, **3 insertions(+), 3 deletions(-)** |
| No sleeps | `grep -c 'waitForTimeout' a11y-smoke.spec.ts` | **0** |
| Fixture used, not hand-rolled | `grep -c 'openFilterDialog' a11y-smoke.spec.ts` | **1** |

Every criterion in the plan was executed and its real output is above. The dev server was killed and
relaunched after Task 1's `.svelte` edit and before any axe result reported here (Vite HMR is known in
this repo to serve stale SSR modules), and the full-suite run used a file byte-identical to the
committed state.

**D-05 came back clean, as research predicted.** 0 violations on the drawer — a pure coverage gain,
so D-07 (close in-phase anything the harden surfaces) had nothing to act on. Had it surfaced a
violation the plan's instruction was to close it here, not to loosen the settle; that path was not
needed.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] My own explanatory comments broke two of the plan's own grep criteria**

- **Found during:** Task 2, at the acceptance-criteria check.
- **Issue:** the comments I wrote inside the new `settle` referenced `openFilterDialog()` and the
  phrase `waitForTimeout` by name. `grep -c` counts matching **lines**, not call sites, so
  `openFilterDialog` returned **2** (criterion: 1) and `waitForTimeout` returned **1** (criterion: 0) —
  the greps were measuring my prose about the code rather than the code.
- **Fix:** reworded both comments to describe the mechanism instead of naming it ("the fixture's dialog
  opener…", "no fixed-duration sleep anywhere in this file"). The criteria now pass **honestly**, by
  the code being right, rather than by the criteria being exempted or the comments deleted. This is
  the same trap 134-01 hit with the `faded` class name — recording it again because it has now
  recurred twice in this phase and is clearly a systematic hazard when a plan greps for a token that
  the implementation is expected to *discuss*.
- **Files modified:** `tests/tests/specs/a11y/a11y-smoke.spec.ts` (folded into `8f6eaede4`).

### Not deviations, but worth stating

- No package was installed; `yarn.lock` untouched (threat T-134-SC).
- The expansion loop is bounded by a `count()` read **once** before iterating, and each expand is
  bounded by the fixture's own 2s toggle-visibility assertion — threat T-134-04's mitigation is in
  place as specified, with no polling and no sleep.
- `EnumeratedEntityFilter.svelte` was deliberately **not** modified (measured clean; D-02 scopes the
  change to the numeric filter).
- STATE.md and ROADMAP.md were **not** touched — the orchestrator owns those writes.
- The pre-existing working-tree dirt (`.planning/REQUIREMENTS.md`, `133-*/deferred-items.md`,
  `supabase/.temp/cli-latest`, `tests/tests/utils/voterIntro.ts`, two untracked `.planning/` files) was
  left exactly as found: not staged, not committed, not reverted.

## Out of scope — pre-existing, not caused by this plan

`yarn format:check` (root `prettier --check .`) reports **187 files with style issues**. Neither file
this plan touched is among them (`npx prettier --check` on both is clean, and grepping the 187-file
list for `a11y-smoke` / `NumericEntityFilter` returns nothing). The flagged set is repo-wide
pre-existing state — `tests/tsconfig.json`, `voter-journey.spec.ts`, `visual-regression.spec.ts` and
similar, none of them touched here. 134-01 scoped its format gate to its touched files for the same
reason. **Not fixed, per the scope boundary**; recorded here so the plan's `yarn format:check` line
item is not silently reported as green.

## Known Stubs

None. No placeholder values, no skipped tests, no unrun `<verify>` commands. The throwaway
instrumentation used to count filter rows was removed and verified absent
(`grep -c 'console.log'` → 0, `diff -q` against the pre-probe file → identical).

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or schema change at a trust boundary.
The edit surface is one CSS class token in a presentational component and one test-table entry.

## Self-Check: PASSED

- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — FOUND
- `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` — FOUND
- Commit `4494543ea` — FOUND
- Commit `8f6eaede4` — FOUND
- Neither commit deleted a tracked file (`git diff --diff-filter=D HEAD~1 HEAD` empty for both)
