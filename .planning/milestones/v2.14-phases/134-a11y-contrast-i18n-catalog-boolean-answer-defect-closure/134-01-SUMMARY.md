---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 01
subsystem: a11y-regression-gate
tags: [a11y, wcag, axe, playwright, typed-contract, contrast, tracer]
status: complete

requires:
  - "a11y-smoke Playwright project (PLAYWRIGHT_A11Y, depends: data-setup-base)"
  - "voter-journey fixtures (locatedVoterPage / answeredVoterPage)"
  - "testIds constants (tests/tests/utils/testIds.ts)"
provides:
  - "AxeRoute discriminated union with a REQUIRED contentTestId — the structural D-04 guarantee"
  - "AXE_ROUTES single table covering all six axe scans (raw + fixture-driven)"
  - "constituencies-selector-located — the first scan that has ever reached a constituency selector"
  - "AA-clean ConstituencySelector implied-constituency readout"
affects:
  - "every future a11y scan route — adding one without a data-driven content anchor is now a compile error"
  - "apps/frontend/src/app.css — the opacity-30 dimming utility no longer exists"

tech-stack:
  added: []
  patterns:
    - "Typed test-config table with a required content anchor, discriminated on what supplies the page"
    - "Settle order: (navigate) → reach-the-target settle → content anchor (LAST gate) → animations settle → scan"
    - "Assertion-helper naming (`assert*`) to satisfy playwright/expect-expect rather than disabling it"

key-files:
  created: []
  modified:
    - "tests/tests/specs/a11y/a11y-smoke.spec.ts"
    - "apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte"
    - "apps/frontend/src/app.css"

decisions:
  - "D-17 Option A implemented as decided: gate the implied-constituency readout on selection, drop the dimming, delete the dead CSS rule. The preview affordance and its fade are gone — accepted cost."
  - "D-04 extended to fixture-driven scans (research Open Question 2 answered YES): all six entries live in one table, so no scan is exempt by silence."
  - "Shared scan body named `assertAxeScan`, not `runAxeScan`, so the repo's existing playwright/expect-expect assertFunctionPatterns recognises it — gates stay enforced instead of being suppressed per call site."

metrics:
  duration: "~75 min"
  completed: 2026-08-10

actuals:
  tokens: 13950
  tasks: 2
  commits: 2
---

# Phase 134 Plan 01: Typed AxeRoute Contract + Honest Constituencies Scan + AA Fix — Summary

The a11y regression gate now requires every scan route to declare a data-driven content anchor, which
immediately exposed that the `constituencies-selector` scan had never once scanned a constituency
selector — and that the selector it should have been scanning fails WCAG 2.1 AA at 1.52:1.

## What was built

**Task 1 (tracer) — `753f41a1f`.** One thin path wired end-to-end: test type → runner → route walk →
product component → global CSS.

- `UnlocatedAxeRoute` → `AxeRoute`, carrying a **required** `contentTestId` documented as "the
  data-driven testid proving this route's real content is in the DOM; a route-level heading is NOT
  acceptable". `settle` became optional and was re-scoped from "wait for content" to "reach the
  target".
- Runner order fixed at `goto → settle?() → contentTestId wait → awaitAnimationsSettled → AxeBuilder
  → assertAxeGates`, so the content anchor is the **last** gate before the scan. Bare `10000`
  literals in the touched waits → `TIMEOUTS.slowPage`.
- `constituencies-selector` → `constituencies-selector-located`: `routeId: 'Elections'` plus a settle
  that walks the elections Continue gate, because `(voters)/constituencies/+page.ts` 307-redirects
  any goto carrying no `electionId`. The rename also stops the `axe-violations-*.json` attachment
  inheriting the old, misleading identity.
- `ConstituencySelector.svelte`: the implied-constituency readout is now gated on
  `sections[sectionIndex].selectedId`; the dimming directive and the now-meaningless
  `transition-opacity` are gone.
- `app.css`: the `opacity-30` dimming rule deleted (re-grepped first — the selector was its only
  consumer in the entire frontend).

**Task 2 — `5006599c9`.** All six scans folded into one typed table.

- `AxeRoute` widened into a discriminated union on `fixture`: `RawAxeRoute` (`'raw'`) carries
  `routeId`; `FixtureAxeRoute` (`'located' | 'answered'`) carries none, because the fixture supplies
  the page and a `goto` would discard the located/answered state it exists to establish. Both share
  the required `contentTestId`.
- `UNLOCATED_ROUTES` → a single `AXE_ROUTES` holding all six entries. The three previously
  hand-written `voterJourneyTest` scan bodies are gone; three module-level loops filter the table by
  discriminant through **type predicates** (no cast, no `any`) and share one `assertAxeScan` body.
- The located scans got **tighter**, not just relocated: `questions` → `voter-questions-start`,
  `results` → `entity-card` (previously a `role=tablist` settle — layout chrome that renders before
  any nomination data), `voter-detail-drawer` → `entity-details` behind a card-click settle.
- The 32-line header block was rewritten: the stale `/en/...` URLs are gone (Paraglide's `url`
  strategy means there is no locale route segment), the settle is described as the `contentTestId`
  contract, and route 3 is no longer described as a plain constituencies goto.

## Before / after — the constituencies route

The plan asked for the before/after numbers. Rather than cite research, both were **measured on this
machine**: the two product files were reverted to `HEAD` (test-side changes kept), the dev server
restarted, the scan run, then the fix restored and the server restarted again.

| | Violations | Nodes | Ratio (light) | Ratio (dark) |
|---|---|---|---|---|
| Before (honest settle, unfixed component) | 1 × `color-contrast`, impact `serious` | 2 | **1.52:1** — `#d1d1d1` on `#ffffff` | **1.46:1** — `#2a2a2a` on `#000000` |
| After (D-17 Option A) | **0** | 0 | — | — |

Both offending nodes were `.small-label` cells inside the readout grid, at 8.6pt/11.5px normal
weight, against an expected 4.5:1. The numbers reproduce the research measurement exactly. The
`axe-violations-constituencies-selector-located.json` and `-dark` attachments are both `[]` after the
fix.

Note the mechanism, because it is the reason this needed a product change: the failure is a
**steady-state** `opacity` utility, and `awaitAnimationsSettled` only awaits *finite* Web Animations.
No scan-timing settle could ever have cleared it.

## Verification — actual output

| Gate | Command | Result |
|---|---|---|
| Full a11y project | `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke --workers=1` | **13 passed (1.1m)** — 0 failed, 0 did-not-run |
| Task-1 subset | same, `-g "home\|elections-selector\|constituencies-selector-located"` | 8 passed |
| Test typecheck | `yarn typecheck:tests` | exit **0** |
| svelte-check | `yarn workspace @openvaa/frontend check` | **0 ERRORS 0 WARNINGS**, 2092 files |
| Lint | `yarn lint:check` | exit **0** (2 pre-existing warnings in untouched files) |
| Format | `npx prettier --check` on the 3 touched files | clean |
| Dead-rule removal | `grep -rn 'faded' apps/frontend/src` | no matches |
| Inline-literal ban | `grep -nE "contentTestId: '"` | no matches — all 6 read `testIds.*` |
| Header drift | `grep -c '/en/elections'` | 0 |

The 13 tests are: 6 raw scans (3 routes × light + dark) + 3 fixture-driven scans + 2 pre-existing
navigation-a11y tests + setup/teardown. **Scan count is unchanged from before this plan** — the work
was to make the existing scans honest, not to add coverage.

**The contract was proven, not assumed.** A throwaway 7th entry was added and typechecked:

```
error TS2322: Type '{ name: string; fixture: "raw"; routeId: "Home"; }' is not assignable to type 'AxeRoute'.
error TS2353: Object literal may only specify known properties, and 'routeId' does not exist in type 'FixtureAxeRoute'.
```

So a raw route with no content anchor fails to compile, *and* a fixture route illegally carrying a
`routeId` fails to compile. The probe was then removed and `yarn typecheck:tests` returned to 0.

Dev server was restarted before every axe result reported here (Vite HMR is known in this repo to
serve stale SSR modules mid-debug).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] `playwright/expect-expect` rejected the shared scan body**

- **Found during:** Task 2, at the `yarn lint:check` gate.
- **Issue:** hoisting the shared scan body into a helper moved every `expect()` out of the raw
  `test()` bodies, so `playwright/expect-expect` reported `Test has no assertions` (2 errors). The
  fixture-driven loops did not trip it — the rule only recognises Playwright's own `test()`.
- **Fix:** renamed the helper `runAxeScan` → `assertAxeScan`. The repo's existing config
  (`tests/eslint.config.mjs:60-63`) allowlists `assertFunctionPatterns: ['^expect[A-Z]',
  '^assert[A-Z]']`, and the helper genuinely terminates in `assertAxeGates`, so the name is accurate
  rather than a workaround. **No rule was disabled and no `eslint-disable` was added** — the
  alternative (suppressing the rule at two call sites) would have removed a real assertion gate from
  the file this plan exists to harden. Rationale recorded in the helper's docblock.
- **Files modified:** `tests/tests/specs/a11y/a11y-smoke.spec.ts` (folded into `5006599c9`).

**2. [Rule 1 — Bug] Acceptance criterion violated by my own comment**

- **Found during:** Task 1 self-check.
- **Issue:** the explanatory comment I added to `ConstituencySelector.svelte` named the deleted CSS
  class literally, which broke the plan's own `grep -rn 'faded' apps/frontend/src → no matches`
  criterion.
- **Fix:** reworded to describe the utility rather than name it. The criterion now passes honestly
  rather than by exempting the comment.

### Not deviations, but worth stating

- No package was installed; `yarn.lock` untouched (threat T-134-SC).
- `constituencies/+page.ts` and its `?next=` whitelist were **not** modified (threat T-134-01) — the
  scan reaches `/constituencies` through the real UI Continue button, never by synthesising a param.

## Known coverage gap (carried deliberately, recorded in-file)

**Fixture-driven scans remain light-theme only.** `questions`, `results` and `voter-detail-drawer`
emit no `(dark)` twin — unchanged from before this plan, but now it is a visible property of the
table rather than an accident of three hand-written bodies.

Why it was left: giving those three dark twins would scan them in dark **for the first time ever** —
never measured, so an unbounded fallout budget this phase has no room for — and would double a full
voter walk per entry in a suite that runs 3× at the determinism gate. **Consequence, stated plainly:
a dark-only contrast regression on `/questions`, `/results` or the detail drawer would currently go
uncaught.** This is named as a known gap in the file, above the runners, not dressed up as a design
property.

## UX cost of D-17 Option A (accepted, operator-decided)

The implied-constituency readout no longer renders before a constituency is selected. **The "preview
of what will be filled in" affordance is gone**, along with its `transition-opacity` fade — a voter
on a multi-election constituency page now sees the readout appear on selection rather than fade up
from a dimmed em-dash placeholder. This is a shipped-UX removal and is git-revertible, but re-adding
it means re-solving the AA problem (Option B's aria-hidden subtrees are still contrast-scanned under
some axe configs; Option C needs ~0.85 opacity to clear 4.5:1, at which point "faded" conveys
nothing). Flagging it here so it is not mistaken for a regression at review.

## Known Stubs

None. No placeholder values, no skipped tests, no unrun `<verify>` commands — every acceptance
criterion in the plan was executed and its real output is recorded above.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or schema change at a trust boundary.
The edit surface is one test spec, one presentational component's `{#if}` condition, and a CSS
deletion.

## Self-Check: PASSED

- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — FOUND
- `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` — FOUND
- `apps/frontend/src/app.css` — FOUND
- Commit `753f41a1f` — FOUND
- Commit `5006599c9` — FOUND
