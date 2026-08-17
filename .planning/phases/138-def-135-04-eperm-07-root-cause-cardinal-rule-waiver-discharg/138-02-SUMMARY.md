---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 02
subsystem: e2e-diagnosis
tags: [forensics, playwright, view-transitions, sveltekit-router, hypothesis-elimination, diagnosis]
status: complete

requires:
  - 'tests/tests/specs/voter/eperm07-term-trigger.spec.ts :: the LEAF hunt instrument (plan 01)'
  - 'playwright project eperm07-term-trigger :: dependencies data-setup-base (plan 01)'
  - 'env knobs EPERM07_FORCE_BUDGET_MS / EPERM07_NO_VT :: neutral by construction (plan 01)'
  - 'test annotation type eperm07-state :: the H1/H2/H3 tri-state, in results.json (plan 01)'
  - '138-DIAGNOSIS.md :: the live hypothesis ledger (plan 01)'
  - 'tests/tests/helpers/timeouts.ts :: TIMEOUTS.element (read-only — never edited)'
provides:
  - '138-FORCED-REPRO.md :: the forcing-configuration search log — environment stamp, 8-rung sweep, 70 machine-read tri-states, non-degeneracy verdict, Discriminator-A A/B'
  - '138-FORCED-REPRO.md § Forcing configuration :: the 100 ms operating point, byte-reproducible, with its stochastic-not-deterministic caveat for plan 04'
  - 'measured swap-latency band 100-125 ms vs the 2000 ms production budget :: the amplification factor plan 03 needs (~20x)'
  - 'H1 eliminated at the reduced-motion lever :: the View-Transition layer is NOT necessary for the failure'
  - 'the hard heading gate at voter-journey.spec.ts:858-861 :: a mis-timed Base-3 arrival now aborts where it is explainable'
affects:
  - 'tests/tests/specs/voter/voter-journey.spec.ts :: one assertion promoted soft -> hard; downstream term/focus/popup/blur lines now stop executing on a Base-3 mis-arrival'
  - '138-DIAGNOSIS.md :: H1 row status changed; H2/H3 rows gain evidence and an explicit "still live" statement; a post-plan-02 ledger-state paragraph added'
  - 'plan 03 :: redirected off the View-Transition layer and onto the router-ordering window; CDP amplification moved onto the critical path'
  - 'plan 04 :: warned off the 100 ms operating point as a negative-control half'

tech-stack:
  added: []
  patterns:
    - 'Machine-read every recorded count from results.json via --reporter=json + PLAYWRIGHT_JSON_OUTPUT_FILE, so no committed config change is needed to make a hunt auditable'
    - 'Classify the discriminating state on EVERY run, pass and fail alike — the passes carried the finding that reframed the whole sweep'
    - 'An A/B that moves no rate can still be decisive if it moves the SHAPE of the observed state; report the shape separately from the count'
    - 'Record a stochastic forcing point with an explicit "not deterministic, do not use as a control half" caveat rather than rounding it up to a reproduction'

key-files:
  created:
    - '.planning/phases/138-.../138-FORCED-REPRO.md'
  modified:
    - 'tests/tests/specs/voter/voter-journey.spec.ts'
    - '.planning/phases/138-.../138-DIAGNOSIS.md'

decisions:
  - 'H1 (View-Transition snapshot capture) ELIMINATED at the reduced-motion lever on a 10-vs-10 A/B — the transition is not necessary for the failure'
  - 'The budget lever alone cannot force the failure deterministically (11/15 at the 100 ms floor); plan 03 CDP amplification is now on the critical path, not optional'
  - 'H2 NOT confirmed despite arm B showing its discriminator 10/10 — headingCount 0 under a transition-disabled nav is ambiguous with an ordinary mid-swap instant; plan 03 owns the call'
  - 'A 125 ms bisecting rung was added beyond the plan-suggested ladder; the 100-125 ms band it measured is what sizes plan 03 amplification'
  - 'The 100 ms operating point is explicitly disqualified as a criterion-2 negative-control half (73% is not a control)'

metrics:
  duration: ~40 min
  completed: 2026-08-13
  tasks: 3
  commits: 3

actuals:
  tokens: 10464
  tasks: 3
  commits: 3
---

# Phase 138 Plan 02: Hardened Gate + Zero-Cost Forcing Sweep Summary

The cheapest discriminator was run in both directions at a frozen configuration and it **eliminated
H1** — switching the View Transition off does not clear the failure, it only changes the stale DOM
into an absent one — while the budget sweep established that the oracle's patience alone cannot
force the failure deterministically, and measured exactly how much amplification plan 03 will need.

## What was built

**Task 1 — the soft→hard promotion (D-08).** `voter-journey.spec.ts:858` `expect.soft(questionHeading)`
→ `expect(questionHeading)`, with a two-line `// reason:` provenance comment. Receiver, matcher,
regex and explicit timeout unchanged; no other soft assertion in the file touched (137 remain); no
timeout value introduced or altered. A mis-timed Base-3 arrival now aborts the step at the heading,
where it reads as a navigation-settle problem, instead of surfacing two lines below at the term gate
where the same event reads as a missing element — the asymmetry that misdirected the original
DEF-135-04 diagnosis.

**Task 2 — `138-FORCED-REPRO.md`, the search log.** Full environment stamp in the
`137-NEGATIVE-CONTROL.md` §2 shape (date, repo root, git HEAD + porcelain, OS, Node, Vite,
SvelteKit, Playwright, Supabase, port allocation with `lsof` for 5273 and the Docker wildcard on
5173 that was deliberately avoided). An 8-rung budget ladder — 2000 → 1000 → 600 → 400 → 250 → 150 →
**125** → 100 ms, 50 runs — with every rung recorded including the seven that produced nothing, and
the `eperm07-state` tri-state of every run parsed out of that run's own `results.json`. Run posture
(`workers`, `retries`) read back out of the JSON rather than restated from config.

**Task 3 — Discriminator A, appended.** A 10-vs-10 A/B at the frozen 100 ms operating point, one
variable (`EPERM07_NO_VT`), the same dev-server PID re-read from `lsof` immediately before each arm,
plus the explicit list of invariants held constant. Verdict, interpretation with `file:line`
references into the app and the router, and a scoped ledger update.

## The findings

**1. The stale-DOM window is UNCONDITIONAL, not intermittent.** Across all 50 sweep runs at all 8
rungs the tri-state took exactly **two** distinct values, differing only in constituency-chip render
order. **50/50 runs — including all 39 that PASSED — were H1-shaped:** at the instant after the
production URL-only settle the URL has *always* already advanced while the heading still reads
`Base opinion 2` and `triggerCount` is 0. Plan 01 saw this twice; 50/50 upgrades it from "the window
is reachable" to "the window is the normal post-settle state". Only its *width* varies, and
therefore only whether the oracle outlasts it.

**2. The budget lever is insufficient — and it measured why.** No rung met the plan's 5/5
determinism bar. 125 ms: 0/5 failures. 100 ms: 11/15 (73 %), longest consecutive streak 4. So the
post-settle swap latency sits in a tight **100–125 ms** band against a **2000 ms** production budget
— **20×**. A budget small enough to lose deterministically would have to go below the plan's 100 ms
floor. Recorded as `## Result: budget lever insufficient` with the escalation named (CDP
`EPERM07_FORCE_CPU_RATE`, worker pressure), and the 20× figure is exactly the top of RESEARCH
§R2.4-B's suggested throttle range — a number the sweep had to be run to learn.

**3. The forced failure is the right failure.** Machine-read from `b100/run-01.json`:
`element(s) not found` on `getByTestId('voter-questions-term-trigger').first()` — the exact phrase
and the exact locator of the recorded DEF-135-04 occurrence, differing only in the `Timeout:` line.

**4. H1 eliminated.** Arm A (VT on) **7/10** failed; arm B (VT off) **9/10** failed. Comparable
rates (Fisher exact p ≈ 0.58 — the honest reading is "no detectable difference", not "worse"), and
byte-identical error text. The View-Transition layer is **not necessary** for the failure.

**5. The result the failure counts do not show — the arms flipped the SHAPE with zero overlap.**
Arm A: 10/10 `{headingCount: 1, headingText: "…Base opinion 2 — Likert 4.", triggerCount: 0}`.
Arm B: 10/10 `{headingCount: 0, headingText: null, triggerCount: 0}`. No run in either arm landed in
the other's class. With the transition on, `+layout.svelte:161-171` returns a Promise SvelteKit
awaits, resolved inside `startViewTransition`'s update callback, so the outgoing Base-2 DOM is still
live during the window. With it off, `shouldAnimate` short-circuits at `viewTransition.ts:28`, the
hook returns `undefined` at `+layout.svelte:165`, nothing is awaited — and there is no heading in
the document at all.

**So the transition governs what the DOM looks like inside the window, not whether the window
exists.** The window is created upstream by the client router's ordering: SvelteKit pushes the
destination URL at `client.js:1760` and swaps the DOM at `client.js:1824`. The production settle
(`voter-journey.spec.ts:186-190`) waits on the **URL** — it releases at 1760 and asserts against
whatever the DOM is before 1824. Stale or absent, it has no term trigger either way.

**6. A corollary that redirects the obvious fix.** The in-repo prior art that motivated H1 —
`a11y-smoke.spec.ts` driving Q→Q with `?notr=1` so assertions "never race the cross-fade" — would
**not** have prevented this failure. `?notr=1` is the sibling short-circuit in the same gate
(`viewTransition.ts:29`) and lands the run in arm B, which failed 9/10. Disabling the transition is
not the fix.

## Ledger effect, deliberately scoped

`138-DIAGNOSIS.md` H1 → **eliminated at this lever**, with the failure-count pair and a pointer to
§ Discriminator A. **H2 and H3 remain `live`**, stated explicitly in the ledger plus a new
post-plan-02 paragraph on what the elimination redirects.

H2 was **not** confirmed despite arm B showing its discriminator on 10/10 runs, for a stated reason:
`headingCount: 0` under a transition-disabled navigation is also exactly what an ordinary mid-swap
instant looks like, so it does not distinguish "the render gate at `questions/+layout.svelte:257-258`
transiently closed" from "the new page component has not mounted yet". Plan 02 task 3's own
instruction reserves that call for plan 03. H3's signature (`headingText` containing
`Base opinion 3`) never appeared in any of the 70 runs — recorded as "not yet observed", explicitly
*not* as an elimination, since a single pre-assertion probe per run cannot sample a window that
narrow.

## Deviations from Plan

### Plan-text adjustments (no functional change)

**1. Task 1 acceptance criterion 1 was unachievable as written.** It requires
`grep -c 'expect.soft(questionHeading)'` → 0, but that pattern matches **9** assertions in the file
(lines 780, 858, 929, 933, 937, 982, 984, 986, 988), and the same task's action text forbids
touching any of them but the Base-3 one. The criterion was applied scoped to the assertion D-08
actually names: `grep -c 'expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7'` → **0**,
and `grep -c 'await expect(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7'` → **1**. The
other eight soft heading assertions are untouched, as the action text requires.

**2. Task 1 acceptance criterion "exits 0 with 1 passed" undercounts.** The `voter-journey` project
carries `dependencies: ['data-setup-base']` and a teardown, and the spec file holds two tests, so a
project-scoped run reports **4 passed**. Plan 01's summary recorded the same 4. Verified as exit 0
with 4 passed, 0 failed.

### Executor discretion exercised (permitted by the plan)

**3. A 125 ms bisecting rung was added** beyond the suggested ladder, once 150 ms came back clean
and 100 ms came back failing. The plan grants ladder discretion; the 100–125 ms band it measured is
the number that sizes plan 03's amplification, so the extra rung paid for itself.

**4. The 100 ms rung was extended to 15 runs** (5 + 10) rather than 5, to distinguish "not
deterministic" from "unlucky block" before recording the insufficiency finding. The second block
doubles as the rebuildability confirmation — the same environment prefix re-run verbatim, and it
reproduced.

### A structural note on the document, not a deviation

The plan's `must_haves.artifacts` requires `138-FORCED-REPRO.md` to contain the literal
`## Forcing configuration`, while task 2's outcome (b) calls for `## Result: budget lever
insufficient`. The document carries **both**: the Result section states the verdict against the
plan's 5/5 bar, and the Forcing configuration section records the 100 ms operating point that
plan 03 needs as a byte-identical starting point — carrying an explicit caveat that it is
**stochastic (73 %), not deterministic, and must not be used as plan 04's negative-control
pre-fix half**, since one passing pre-fix run would falsify the pair.

## Auth gates

None. Voter routes are public and the hunt spec is read-only.

## Verification

| Check | Result |
|---|---|
| `yarn typecheck:tests` | exit 0 |
| `npx eslint --flag v10_config_lookup_from_file tests` | exit 0 (2 pre-existing warnings in unrelated files, out of scope — same two plan 01 recorded) |
| `yarn prettier --check` on all three changed files | clean |
| `--project=voter-journey --reporter=line` | **4 passed** (1.0 m), exit 0 — with the promoted hard assertion |
| **Full suite `yarn test:e2e`** (beyond the plan's requirement; run because a shared spec was modified and CLAUDE.md's E2E hard rule prefers the whole suite) | **135 passed (10.3 m), 0 failed, 0 did-not-run** — exactly plan 01's 135 baseline |
| Task 2 `<automated>` verify | PASS |
| Task 3 `<automated>` verify | PASS |
| `git status --porcelain tests/` | empty — `playwright.config.ts` and the hunt spec unmodified by any experiment |
| `git status --porcelain apps/` | empty — no app source file touched for either arm |
| `git diff --stat tests/tests/helpers/timeouts.ts` | empty |
| `git diff --numstat` on `voter-journey.spec.ts` | `3  1` — within the ≤3 added / ≤1 removed budget |
| Trigger-text assertion below the promoted line | still soft, count 1 — unchanged as D-08 requires |
| `grep -cE 'TIMEOUTS\.[a-zA-Z]+ *[:=]'` | 0 before and after — no timeout introduced or altered |
| Quarantine / skip / `fixme` / `.only` added to any spec | **none** — isolation was entirely `--project=eperm07-term-trigger` |
| Runs backing the record | **70** (50 sweep + 20 A/B), every tri-state parsed from that run's own `results.json` |
| `retries` read back from `results.json` | 0 on all 70 runs — no failure below is a retry artefact |

## Measurements for later plans

- **Post-settle DOM-swap latency band: 100–125 ms**, against a 2000 ms production budget (20×). This
  is the amplification target for plan 03's CDP throttle — RESEARCH §R2.4-B's "escalate to 20" is
  now a measured number rather than a guess.
- **Hunt-project iteration cost: ~11–13 s** per invocation including `data-setup-base` and
  `data-teardown-base`. 70 runs cost ~15 minutes of wall clock.
- **Full-suite cost this session: 10.3 m for 135 tests** after a `yarn db:reset` — consistent with
  plan 01's baseline and with plan 05's 16-run budget (~2.7 h of pure run time).
- **Arm-B rate (9/10) exceeded arm-A (7/10)**, not significantly. If plan 03 wants a *cheaper*
  forcing point than CDP throttling, `EPERM07_NO_VT=true` at 100 ms is currently the highest-rate
  configuration measured — but it changes the observed state's shape, so it is not interchangeable
  with arm A for tri-state work.

## Environment left running

A dev server for this checkout is **still listening on 5273** (PID 92504, `FRONTEND_PORT=5273 yarn dev`,
never restarted across all 70 hunt runs or the full-suite run). The DB was `yarn db:reset` immediately
before the full-suite run. The next executor can reuse both, or must stop the server before starting
its own — a second server would be a stale-server hazard, and port 5173 is unusable here because
Docker Desktop holds the IPv6 wildcard on it.

## Known Stubs

None. Every artifact this plan promised is implemented and exercised, and every number in
`138-FORCED-REPRO.md` is backed by a `results.json` field. `138-DIAGNOSIS.md` § Named root cause
remains the deliberate `PENDING — plan 03 writes this section.` placeholder introduced by plan 01.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change was introduced. The
only committed code change is one assertion call form in a test file.

## Self-Check: PASSED

Files verified present:
- `FOUND: .planning/phases/138-.../138-FORCED-REPRO.md` (565 lines)
- `FOUND: .planning/phases/138-.../138-DIAGNOSIS.md` (H1 row updated)
- `FOUND: tests/tests/specs/voter/voter-journey.spec.ts` (hard gate present)

Commits verified in `git log`:
- `FOUND: bea9fc97a` test(138-02): promote the EPERM-07 heading gate from soft to hard (D-08)
- `FOUND: 62060b00d` docs(138-02): record the budget-lever sweep and its insufficiency finding
- `FOUND: 37c754460` docs(138-02): Discriminator A eliminates H1 — the View Transition is not necessary
