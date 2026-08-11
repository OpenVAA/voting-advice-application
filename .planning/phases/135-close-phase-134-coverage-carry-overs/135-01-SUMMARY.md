---
phase: 135-close-phase-134-coverage-carry-overs
plan: 01
subsystem: a11y-regression-gate
tags: [a11y, wcag, axe, playwright, dark-theme, theme-staleness, coverage]
status: complete

requires:
  - "AXE_ROUTES typed table + assertAxeScan shared body (Phase 134 Plan 01/02)"
  - "voter-journey fixtures (locatedVoterPage / answeredVoterPage)"
  - "DaisyUI dark theme via prefersdark (apps/frontend/src/app.css)"
provides:
  - "Dark-theme axe coverage for all four fixture-driven entries — the Phase 134 theme gap is closed"
  - "Born-dark context as the correct mechanism for theming a fixture-supplied page"
  - "assertDarkThemeApplied — a token-agnostic guard against a half-light document passing as a dark scan"
affects:
  - "every future fixture-driven scan that needs a theme — flipping emulateMedia post-walk is now documented as insufficient"
  - "a11y-smoke runtime: 14 → 18 tests, ~1.1m → ~2.7m (the four new twins each re-walk a voter journey)"

tech-stack:
  added: []
  patterns:
    - "Theme a fixture-supplied page by giving the CONTEXT the theme (test.use({ colorScheme })), not by flipping the page after the fixture walked"
    - "Prove a theme took by comparing a freshly-created token consumer against persistent layout chrome — token-agnostic, no hard-coded hex"
    - "Validate a regression guard by running it against the broken mechanism, not only the fixed one"

key-files:
  created:
    - ".planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md"
  modified:
    - "tests/tests/specs/a11y/a11y-smoke.spec.ts"

decisions:
  - "The four fixture dark twins take a dark browser CONTEXT rather than emulating dark after the walk. Measured cause: the flip leaves 30 elements painting light tokens. The plan specified the flip; the measurement overrode it."
  - "No product fix was required — all four new dark scans measured 0 violations. The `.faded` D-17 call-site precedent was prepared for but not needed."
  - "The incidental `--line-color` dark defect was logged, not fixed: it is pre-existing, already present under the Phase-134 raw dark scans, not axe-detectable, and outside this plan's files."

metrics:
  duration: "~2h (≈65 min of it environment recovery)"
  completed: 2026-08-11

actuals:
  tokens: 2500
  tasks: 3
  commits: 3
---

# Phase 135 Plan 01: Dark-theme axe parity for the four fixture-driven entries — Summary

`/questions`, `/results`, the voter detail drawer and the results filter drawer are now scanned in
dark as well as light, and all four measured **0 violations** — but only after the measurement
itself turned out to be wrong: the mechanism the plan specified produces a half-light DOM, so the
first green was not trustworthy.

## The headline: the plan's dark mechanism was measuring a half-light page

The plan specified `await page.emulateMedia({ colorScheme: 'dark' })` on the fixture-supplied page.
I implemented that (Task 1), got **18 passed**, and did not stop there — the plan explicitly asked
whether flipping dark *after* the fixture's light walk leaves anything theme-stale. It does.

Measured on the `/questions` intro reached through `locatedVoterPage`:

| mechanism | `prefers-color-scheme` | `--color-neutral` at `:root` | `nav-menu-toggle` computed colour | elements still painting light `#333333` |
|---|---|---|---|---|
| dark emulated AFTER the light walk | `true` | `#cccccc` (dark, correct) | `rgb(51, 51, 51)` — **LIGHT** | **30** |
| context born dark (`use({ colorScheme: 'dark' })`) | `true` | `#cccccc` (dark, correct) | `rgb(204, 204, 204)` — dark | **0** |

The stale set is the **persistent layout chrome** the fixture rendered before the flip — the header
menu-toggle button, the hamburger `svg`/`path`, the OpenVAA logo `svg`. Route content, which
re-renders after the flip, comes out correctly dark. Note the sharp detail: the custom property
itself resolves to the *dark* token on the stale nodes (`ownNeutral: #cccccc`); only their computed
`color` is left behind. So `body` reads dark, `matchMedia` reads dark, the tokens read dark — and
the document is still visibly part light.

That is a scan reporting a confident `0` about a theme it only half rendered: the same shape as the
FIX-01 defect Phase 134 existed to kill. So the twins were rebuilt to take a dark **context**, and
the fixture now walks the entire voter journey in dark from the first paint. That is also strictly
more faithful — it measures the real dark-mode journey rather than a light journey wearing a dark
hat.

**Deviation from the plan, stated plainly:** Task 1's acceptance criterion
`grep -c 'emulateMedia' … returns 3 (one per runner loop)` no longer holds as written. There is now
exactly **1** call (the pre-existing raw loop); the two fixture loops use `use({ colorScheme })`
instead. `grep -c` still prints `3`, but two of those are prose inside the explanatory docblock — I
am flagging that rather than quietly banking the coincidence, because a criterion satisfied by
comment text is not satisfied.

## The guard — validated against the failure, not just the fix

Structure now prevents the staleness, and `assertDarkThemeApplied` stops it silently returning. A
freshly created `.text-neutral` node always resolves the *current* token, so comparing it against
the persistent chrome detects a half-light document without hard-coding a single hex or naming a
theme.

Critically, I ran the guard against **both** mechanisms before trusting it:

| mechanism | live token colour | chrome colour | guard verdict |
|---|---|---|---|
| flip after walk (broken) | `rgb(204, 204, 204)` | `rgb(51, 51, 51)` | **FAILS** ✓ (correctly rejects) |
| born-dark context (fixed) | `rgb(204, 204, 204)` | `rgb(204, 204, 204)` | passes ✓ |

A guard only ever tested against the passing case is an assumption, not a guard.

## The measured result for each of the four new dark scans

Environment for the binding run — stated explicitly per the plan:

- Dev server **restarted** immediately before the run; `lsof -i:5173` verified the listener was
  `node` (Vite), not Docker — see DEF-135-03, this mattered.
- `yarn db:reset` run beforehand; Supabase REST polled to `200` and storage to `200` (both buckets
  recreated) before the suite was allowed to start.
- No source file changed between the restart and the run.

Attachment bodies extracted from the run's traces — the actual JSON, not a restatement of "passed":

| scan (new) | axe attachment | violations |
|---|---|---|
| `axe-violations-questions-dark.json` | `[]` | 0 |
| `axe-violations-results-dark.json` | `[]` | 0 |
| `axe-violations-voter-detail-drawer-dark.json` | `[]` | 0 |
| `axe-violations-results-filter-drawer-dark.json` | `[]` | 0 |

The other ten attachments (`home`, `home-dark`, `elections-selector`, `elections-selector-dark`,
`constituencies-selector-located`, `constituencies-selector-located-dark`, `questions`, `results`,
`voter-detail-drawer`, `results-filter-drawer`) are also all `[]`.

Independent confirmation that these were genuinely dark surfaces, probed per surface:
`prefersDark: true`, `color-scheme: dark`, `--color-base-100: #000000`,
`--color-base-content: #cccccc`, `--color-primary: #6887e3`, `body` background `rgb(0, 0, 0)`,
`body` colour `rgb(204, 204, 204)` — on all four, including inside both opened drawers with every
filter row expanded.

**No product fix was required.** The `.faded` / D-17 call-site precedent was loaded and ready; the
scans simply did not surface a violation to apply it to.

### Verification — actual output

| Gate | Command | Result |
|---|---|---|
| Full a11y project (binding) | `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke --workers=1` | **18 passed (2.7m)** — 0 failed, 0 did-not-run |
| Full a11y project (confirmation, post-comment-edit) | same | **18 passed (2.7m)** — 0 failed, 0 did-not-run |
| Test list | `--list` | **18 tests** (was 14) |
| Test typecheck | `yarn typecheck:tests` | exit **0** |
| Format | `yarn format:check` | exit **0** |
| Lint | `yarn lint:check` | exit **0** (2 pre-existing warnings, none in this file) |
| `known coverage gap` | `grep -c` | **0** |
| `light only` | `grep -ci` | **0** |

Two consecutive clean full-suite runs on the final code state.

## Task 3 — the stale caveat

Three places still claimed fixture-driven entries were light-only: the header docblock, the
`THEME COVERAGE — a known gap` block above the runners, and the `results-filter-drawer` entry's
`LIGHT ONLY` note. All three were false the moment the twins landed. Replaced with an accurate
statement plus the one thing a reader now needs: raw twins emulate dark before their `goto`, fixture
twins take a dark context, and the difference is load-bearing. Leaving a stale in-file caveat is how
the original FIX-01 misdiagnosis happened.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The specified dark mechanism produced an invalid measurement**

- **Found during:** Task 2, while acting on the plan's own instruction to check for theme-staleness.
- **Issue:** `emulateMedia` on an already-walked page leaves 30 elements rendering light tokens; the
  resulting `-dark` scans were measuring a half-light DOM and passing.
- **Fix:** dark twins take a born-dark browser context (`use({ colorScheme: 'dark' })`); added
  `assertDarkThemeApplied`, validated against both mechanisms.
- **Files modified:** `tests/tests/specs/a11y/a11y-smoke.spec.ts`
- **Commit:** `e0f618f65`

### Not fixed — logged instead

Three out-of-scope discoveries are recorded in
`.planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md`:

- **DEF-135-01** — `[data-theme='dark']` in `app.css` is **dead CSS** (`data-theme` is never set
  anywhere), so `--line-color` stays at the light `#d9d9d9` in dark instead of `#262626`. Dividers
  render near-white on black. Not a WCAG failure (`--line-color` is used only for borders, never
  text, and `#d9d9d9` on `#000000` is ~15.9:1 — *higher* contrast than intended), which is why no
  axe rule flags it. Pre-existing and already present under the Phase-134 raw dark scans.
- **DEF-135-02** — an unhandled `cookies.set(...) after the response has been generated` rejection
  from `apps/frontend/src/lib/supabase/server.ts:12` can kill the dev server mid-run (fatal on Node
  24), which cost one run 16 collateral failures.
- **DEF-135-03** — the sibling checkout's `voting-advice-application-frontend-1` container publishes
  `:5173` and restarts with the Docker daemon; when it wins the race, `curl :5173` still returns
  `200` from a **stale container build**. This silently invalidated one full run. Stopped (not
  removed) for the binding measurement.

## Environment notes — worth carrying forward

Roughly half this plan's wall-clock went to infrastructure, none of it caused by the code:

- **Docker Desktop crashed three times** (GUI helpers alive, `com.docker.backend` gone,
  `docker desktop restart` unable to stop cleanly). Recovery each time: force-quit the Docker
  Desktop processes, `open -a Docker`, wait for `docker info`.
- **A `502` from Supabase REST** (`/rest/v1/question_categories`, `/rest/v1/rpc/get_nominations`)
  failed one run — the app rendered its error boundary. Root-caused from the failure trace's network
  log, not guessed: the suite had been started before `supabase_rest` finished restarting after a
  Docker crash. `yarn db:status` passing is **not** sufficient readiness; poll REST and storage for
  `200` directly.
- **`yarn dev` cannot be used to restart just the frontend** while Docker is flaky — it runs
  `db:start` first. `yarn _dev:concurrent` starts the watcher + Vite without touching Docker.

No failure was ever resolved by retrying: each of the three bad runs was root-caused to a specific
infrastructure fault (Docker daemon down, REST 502 from an unready container, port squatted by a
stale container) and re-run only after that fault was fixed and verified.

## Cardinal-rule compliance

No rule was disabled, `WCAG_TAGS` was not narrowed, no `exclude()` selector was added, no dark twin
was reverted, and `assertAxeScan` / `assertAxeGates` were not loosened — the per-rule trio and the
global 0-violation gate are byte-for-byte unchanged. Nothing was skipped, `.fixme`'d, or annotated
as flaky. The suite is green because the surfaces are clean, not because the gate moved.

## Self-Check: PASSED

- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — FOUND
- `.planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md` — FOUND
- `83ea0d00b` — FOUND
- `e0f618f65` — FOUND
- `5bac73388` — FOUND
