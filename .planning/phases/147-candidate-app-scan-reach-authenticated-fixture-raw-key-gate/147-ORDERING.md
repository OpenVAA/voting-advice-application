# Phase 147 — Ordering: the two deferred mechanisms, measured

**The ROADMAP deferred two mechanism choices to measurement rather than locking them at planning
time. This document settles both, and it settles them with numbers.** `147-03` implements what is
written in § *For 147-03* verbatim and is prohibited from deciding anything; an under-determined
answer here would become an improvised decision there.

- **Phase:** 147 (candidate-app-scan-reach-authenticated-fixture-raw-key-gate)
- **Owner plan:** `147-02-PLAN.md`
- **HEAD:** `325db69cd` (`feat-gsd-roadmap`)
- **Instrument:** `tests/e2e-runs/147/phases.mjs` (+ `config-projects.mts`) — gitignored, retained so
  `147-03` and `147-04` can re-run it against the committed config
- **Evidence mined:** `tests/e2e-runs/147-base-green/results.json` — `147-01`'s real full-suite run
- **Product bytes written by this document:** **zero**. Every wiring below is an in-memory overlay on
  the graph the instrument read from the live config; `tests/playwright.config.ts` is not edited by
  Task 1 or Task 3, and Task 2's single-variable edit is reverted and proven byte-identical inside
  its own task.

---

## Observed assignment

### Why this section exists before any prediction

`tests/playwright.config.ts:496-518` records this wiring being reasoned about wrongly **twice** — once
by putting a settings-mutating project in the same phase as the journeys, and once by a proposed fix
that merely relocated the race into the perm chain head's phase. That file's own comment says not to
fix it that way. A third reading of the scheduler is not what this phase needs, so the derivation is
**validated against a run that already happened** before a single prediction is taken from it.

### The instrument

`computePhases()` in `tests/e2e-runs/147/phases.mjs` is a transcription of Playwright's own assignment:

- `node_modules/playwright/lib/runner/tasks.js` :: `createPhasesTask` — a project enters the earliest
  phase in which every project that must finish first has already been processed;
- `node_modules/playwright/lib/runner/projectUtils.js` :: `buildTeardownToSetupsMap` /
  `buildDependentProjects` — for a **teardown** project that set is not its `dependencies` (teardowns
  declare none) but the transitive dependent closure of every setup that names it, minus itself. This
  is why the 27 `data-teardown-*` projects land in phases 54–80 rather than in phase 1.

It reads the project list and every `dependencies` / `teardown` value **from the config module
itself** (`config-projects.mts` imports `tests/playwright.config.ts` and prints the graph as JSON), so
it cannot drift from the file it describes, and the `...(process.env.X ? [...] : [])` gate expressions
are evaluated exactly as Playwright evaluates them — with no environment set, the default project set.

The set of projects that are actually **scheduled** is not the same as the set that is declared:
Playwright keys its phase map off `rootSuite`, so a project whose tests were all filtered out is never
scheduled at all. That set is taken from the real run rather than assumed.

### The observation

Every test result in `147-01`'s `BASE-GREEN` carries a `startTime` and a `duration`, so each project
has a measured `[first start, last end]` window. Playwright runs phases **strictly sequentially** —
every project of phase *k* ends before any project of phase *k+1* starts — so sweeping the projects by
start time and opening a new phase whenever one starts at-or-after the maximum end seen so far
reconstructs the phase boundaries from the windows alone. No phase number is read from the config in
this direction; it is read from the clock.

### The comparison

```
$ node tests/e2e-runs/147/phases.mjs --self-check
predicted phases: 80   observed phases: 80   mismatches: 0
SELF-CHECK OK — every scheduled project`s predicted phase equals its observed phase.
```

**89 scheduled projects, 89 matches, 0 mismatches; 80 predicted phases against 80 observed phases.**
The one declared project that does not appear in the run is `_probes`, whose tests are all removed by
the default suite's `--grep-invert @probe` — recorded as *not scheduled* rather than silently dropped,
because a project omitted from this table would be a hole in the validation.

| project | predicted phase | observed phase | |
|---|---|---|---|
| `performance` | 2 | 2 | match |
| `a11y-smoke` | 2 | 2 | match |
| `data-setup-base` | 1 | 1 | match |
| `data-teardown-base` | 80 | 80 | match |
| `voter-journey` | 2 | 2 | match |
| `eperm07-term-trigger` | 2 | 2 | match |
| `cold-entry-dataroot` | 2 | 2 | match |
| `voter-dark-mode` | 2 | 2 | match |
| `voter-journey-mobile` | 2 | 2 | match |
| `voter-alliance` | 2 | 2 | match |
| `voter-nominations` | 2 | 2 | match |
| `_probes` | — | — | not scheduled — 0 tests in the default run (`--grep-invert @probe`) |
| `data-setup-perm-1e1cg1co` | 4 | 4 | match |
| `data-teardown-perm-1e1cg1co` | 78 | 78 | match |
| `perm-1e1cg1co` | 5 | 5 | match |
| `data-setup-perm-2e-shared` | 6 | 6 | match |
| `data-teardown-perm-2e-shared` | 77 | 77 | match |
| `perm-2e-shared` | 7 | 7 | match |
| `data-setup-perm-2e-asymmetric` | 8 | 8 | match |
| `data-teardown-perm-2e-asymmetric` | 76 | 76 | match |
| `perm-2e-asymmetric` | 9 | 9 | match |
| `data-setup-perm-startfromcg` | 10 | 10 | match |
| `data-teardown-perm-startfromcg` | 75 | 75 | match |
| `perm-startfromcg` | 11 | 11 | match |
| `data-setup-perm-disjoint-1co` | 12 | 12 | match |
| `data-teardown-perm-disjoint-1co` | 74 | 74 | match |
| `perm-disjoint-1co` | 13 | 13 | match |
| `data-setup-perm-disable-election-1co` | 14 | 14 | match |
| `data-teardown-perm-disable-election-1co` | 73 | 73 | match |
| `perm-disable-election-1co` | 15 | 15 | match |
| `data-setup-perm-disable-election-2co` | 16 | 16 | match |
| `data-teardown-perm-disable-election-2co` | 72 | 72 | match |
| `perm-disable-election-2co` | 17 | 17 | match |
| `data-setup-perm-not-located-2e2cg` | 18 | 18 | match |
| `data-teardown-perm-not-located-2e2cg` | 71 | 71 | match |
| `perm-not-located-2e2cg` | 19 | 19 | match |
| `data-setup-candidate-journey` | 2 | 2 | match |
| `data-teardown-candidate-journey` | 79 | 79 | match |
| `candidate-journey` | 3 | 3 | match |
| `data-setup-perm-access-disable` | 20 | 20 | match |
| `data-teardown-perm-access-disable` | 70 | 70 | match |
| `perm-access-disable` | 21 | 21 | match |
| `data-setup-perm-per-app-notifications` | 22 | 22 | match |
| `data-teardown-perm-per-app-notifications` | 69 | 69 | match |
| `perm-per-app-notifications` | 23 | 23 | match |
| `data-setup-perm-missing-nominations` | 24 | 24 | match |
| `data-teardown-perm-missing-nominations` | 68 | 68 | match |
| `perm-missing-nominations` | 25 | 25 | match |
| `data-setup-perm-localisation-positive` | 26 | 26 | match |
| `data-teardown-perm-localisation-positive` | 67 | 67 | match |
| `perm-localisation-positive` | 27 | 27 | match |
| `data-setup-perm-answers-locked` | 28 | 28 | match |
| `data-teardown-perm-answers-locked` | 66 | 66 | match |
| `perm-answers-locked` | 29 | 29 | match |
| `data-setup-perm-hide-hero` | 30 | 30 | match |
| `data-teardown-perm-hide-hero` | 65 | 65 | match |
| `perm-hide-hero` | 31 | 31 | match |
| `data-setup-perm-show-feedback-survey` | 32 | 32 | match |
| `data-teardown-perm-show-feedback-survey` | 64 | 64 | match |
| `perm-show-feedback-survey` | 33 | 33 | match |
| `data-setup-perm-header-show-help` | 34 | 34 | match |
| `data-teardown-perm-header-show-help` | 63 | 63 | match |
| `perm-header-show-help` | 35 | 35 | match |
| `data-setup-perm-hide-all-nominations` | 36 | 36 | match |
| `data-teardown-perm-hide-all-nominations` | 62 | 62 | match |
| `perm-hide-all-nominations` | 37 | 37 | match |
| `data-setup-perm-hide-if-missing-answers` | 38 | 38 | match |
| `data-teardown-perm-hide-if-missing-answerspred` | obs | match |  |
| `perm-hide-if-missing-answers` | 39 | 39 | match |
| `data-setup-perm-hide-election-tags` | 40 | 40 | match |
| `data-teardown-perm-hide-election-tags` | 60 | 60 | match |
| `perm-hide-election-tags` | 41 | 41 | match |
| `data-setup-perm-hide-category-tags` | 42 | 42 | match |
| `data-teardown-perm-hide-category-tags` | 59 | 59 | match |
| `perm-hide-category-tags` | 43 | 43 | match |
| `data-setup-perm-disable-allow-open` | 44 | 44 | match |
| `data-teardown-perm-disable-allow-open` | 58 | 58 | match |
| `perm-disable-allow-open` | 45 | 45 | match |
| `data-setup-perm-question-video` | 46 | 46 | match |
| `data-teardown-perm-question-video` | 57 | 57 | match |
| `perm-question-video` | 47 | 47 | match |
| `data-setup-perm-interactive-info` | 48 | 48 | match |
| `data-teardown-perm-interactive-info` | 56 | 56 | match |
| `perm-interactive-info` | 49 | 49 | match |
| `data-setup-perm-org-matching` | 50 | 50 | match |
| `data-teardown-perm-org-matching` | 55 | 55 | match |
| `perm-org-matching` | 51 | 51 | match |
| `data-setup-perm-analytics-tracking` | 52 | 52 | match |
| `data-teardown-perm-analytics-tracking` | 54 | 54 | match |
| `voter-prefs-tracking` | 53 | 53 | match |

### The shape the numbers describe

| phase | contents | measured wall clock (`BASE-GREEN`) |
|---|---|---|
| 1 | `data-setup-base` | 0.9 s |
| 2 | `performance`, `a11y-smoke`, `voter-journey`, `eperm07-term-trigger`, `cold-entry-dataroot`, `voter-dark-mode`, `voter-journey-mobile`, `voter-alliance`, `voter-nominations`, `data-setup-candidate-journey` | **64.3 s** — critical path is `voter-journey` (64.3 s, a single serial test). `a11y-smoke` finishes at **+40.7 s**, comfortably inside it, so **`a11y-smoke` is not on phase 2's critical path.** |
| 3 | `candidate-journey` | **27.3 s** — one test, alone in its phase, 5 of 6 workers idle |
| 4–53 | the perm serial chain: 25 × (`data-setup-perm-*` → `perm-*` spec), strictly one project per phase | ~480 s |
| 54–80 | the 27 `data-teardown-*` projects, in reverse chain order | ~70 s |

Full-run span, first test start to last test end: **643.4 s**.

Two facts in that table do most of the work below. **`a11y-smoke` has 27.3 s of slack**: phase 2 is
bound by `voter-journey`, and phase 3 is bound by a single 27.3 s test with five idle workers. And
**the perm family is already strictly downstream of the journey leaves**, so nothing in phases 1–3
shares a phase with an `app_settings` REPLACE or a `test-` pre-clear at all.

---

## Hazard model — two axes, not one

Scoring only *co-scheduling* would miss the sharper failure. Each wiring below is scored on both:

**Axis 1 — concurrency.** Which projects share the scan's phase, and do any of them perform an
`app_settings` singleton REPLACE (T-147-05) or an `extraTeardownPrefix: 'test-'` pre-clear that would
delete `test-e2e-base-ca-aa-1`, the row the scan is authenticated **as** (T-147-06)?

**Axis 2 — state at entry.** Which projects performed those mutations in a **strictly earlier** phase?
A pre-clear that ran in phase 20 has already deleted the scan's identity by the time a phase-55 scan
starts; the scan does not need to be *concurrent* with it to be destroyed by it. Likewise, the **last**
`app_settings` REPLACE before the scan's phase decides which settings singleton the scan is scanning
under. **A wiring can be perfectly phase-disjoint and still be disqualified on this axis** — and one
below is.

The classifiers are grep-verified, not asserted:

- `REPLACES_APP_SETTINGS` — every `data-setup-perm-*` (all call `setupFromTemplate` → Writer Pass-5)
  plus `data-setup-base` (which seeds the singleton the default suite runs under).
- `PRECLEARS_TEST_PREFIX` — every `data-setup-perm-*`. Verified by
  `grep -rn extraTeardownPrefix tests/tests/setup/perm/*.setup.ts`: **all 20 files pass
  `['test-', 'e2e-perm-']`**. `data-setup-base` is deliberately **not** in this set — it clears only
  the foreign `e2e-perm-` / `e2e-bankauth-` namespaces and re-seeds `test-e2e-base-` as its own
  (`base.setup.ts:38`), and it is phase 1 by construction.

A third property is checked per wiring because the config states it as deliberately maintained:
`playwright.config.ts:560-580` says opt-in single-project runs must keep pulling **only base and
auth**. `closureOf()` computes the transitive dependency closure of a project — what
`npx playwright test --project=<name>` actually drags in — so the property is checked rather than
assumed.

---

## Wirings considered

Six wirings, all scored by the same validated instrument, all as in-memory overlays. **No wiring is
selected in this section** — § *Decision (A)* selects, after Task 2's perturbation measurement is in.

`W0` is the unmodified config, carried as the control: it is what "admissible" looks like today, and
the scan surface it names (`a11y-smoke`) is voter-only, which is the defect the phase exists to close.

### Wiring W0 — baseline (unmodified config), carried as the control

| | |
|---|---|
| change | none |
| scan project | `a11y-smoke` (voter-only — reaches no `(protected)` surface) |
| predicted phase | **2** of 80 |
| co-scheduled | `performance`, `voter-journey`, `eperm07-term-trigger`, `cold-entry-dataroot`, `voter-dark-mode`, `voter-journey-mobile`, `voter-alliance`, `voter-nominations`, `data-setup-candidate-journey` |
| T-147-05 — REPLACE in phase | **NONE** |
| T-147-06 — `test-` pre-clear in phase | **NONE** |
| state at entry — earlier `test-` pre-clears | **NONE** |
| state at entry — last REPLACE before the scan | `data-setup-base` (the base singleton — correct) |
| opt-in runs | `--project=a11y-smoke` pulls **1**: `data-setup-base` ✓ |
| verdict | **admissible — and useless.** It reaches no candidate surface, which is the whole requirement. |

### Wiring W1 — ungate `auth-setup`; add it to `a11y-smoke`.dependencies (scans stay in `a11y-smoke`)

| | |
|---|---|
| change | remove the `PLAYWRIGHT_VISUAL` gate on `auth-setup`; `a11y-smoke.dependencies = ['data-setup-base', 'auth-setup']`; extend `AXE_ROUTES` with the candidate family |
| diff | ~4 lines |
| scan project | `a11y-smoke` |
| predicted phase | **3** of 80 (`auth-setup` lands in phase 2) |
| co-scheduled | `candidate-journey` — and nothing else |
| T-147-05 — REPLACE in phase | **NONE** |
| T-147-06 — `test-` pre-clear in phase | **NONE** |
| state at entry — earlier `test-` pre-clears | **NONE** |
| state at entry — last REPLACE before the scan | `data-setup-base` ✓ |
| opt-in runs | `--project=a11y-smoke` pulls **2**: `data-setup-base`, `auth-setup` ✓ (base + auth, exactly the stated property) |
| run-time consequence | phase 2 stays **64.3 s** (`voter-journey`-bound; `a11y-smoke` was never on its critical path). Phase 3 becomes `max(candidate-journey 27.3 s, a11y-smoke alone)`. `a11y-smoke`'s 16 tests total **130.2 s** of test time; in phase 3 it has 5 free workers, so ≥ 26.0 s, and it cannot be slower than the **40.7 s** it measured while sharing 6 workers with nine other projects. **Net cost: between 0 s and +13.4 s.** |
| verdict | **admissible.** Both hazards clear on both axes. |
| cost not visible in the phase table | the whole voter a11y suite is moved out of the wide phase and into a narrow one — the candidate scan's ordering constraint is imposed on 14 voter scans that do not need it. |

### Wiring W2 — ungate `auth-setup`; new project `candidate-a11y-scan` on `[data-setup-base, auth-setup]`; `a11y-smoke` unchanged

| | |
|---|---|
| change | remove the `PLAYWRIGHT_VISUAL` gate on `auth-setup`; add one project `candidate-a11y-scan` with `storageState: STORAGE_STATE` and `dependencies: ['data-setup-base', 'auth-setup']`; the candidate routes live in their own spec |
| diff | ~12 lines |
| scan project | `candidate-a11y-scan` |
| predicted phase | **3** of 80 (`auth-setup` lands in phase 2) |
| co-scheduled | `candidate-journey` — and nothing else |
| T-147-05 — REPLACE in phase | **NONE** |
| T-147-06 — `test-` pre-clear in phase | **NONE** |
| state at entry — earlier `test-` pre-clears | **NONE** |
| state at entry — last REPLACE before the scan | `data-setup-base` ✓ |
| opt-in runs | `--project=candidate-a11y-scan` pulls **2**: `data-setup-base`, `auth-setup` ✓; `--project=a11y-smoke` still pulls **1**: `data-setup-base` ✓ — the voter scan's isolation is **preserved**, which W1 gives up |
| run-time consequence | phase 2 unchanged at 64.3 s (`auth-setup` is a short setup absorbed under a 64.3 s critical path — magnitude measured in `ORD-PERTURB`). Phase 3 becomes `max(candidate-journey 27.3 s, candidate-a11y-scan)`; the scout measured the 14 candidate scans at **≈22 s** across both themes with 5 free workers available. **Net cost: ≈0 s** — the new work hides under an existing critical path. |
| verdict | **admissible**, and it is the only admissible wiring that costs nothing on either phase's critical path while leaving the voter scan where it is. |

### Wiring W3 — W2 + extend the perm chain head anchor to include `candidate-a11y-scan`

| | |
|---|---|
| change | W2, plus `data-setup-perm-1e1cg1co.dependencies` gains `'candidate-a11y-scan'` — the in-repo mechanism already used to hold `eperm07-term-trigger` ahead of the perm family |
| diff | ~13 lines |
| scan project | `candidate-a11y-scan` |
| predicted phase | **3** of 80 — **identical to W2** |
| co-scheduled | `candidate-journey` |
| T-147-05 / T-147-06 in phase | **NONE / NONE** |
| state at entry | no earlier pre-clear; last REPLACE `data-setup-base` ✓ |
| opt-in runs | same as W2 for the scan and for `a11y-smoke` ✓ — but `--project=perm-*` now additionally pulls `candidate-a11y-scan` and `auth-setup` |
| what the extra edge buys | it makes the ordering **explicit** rather than incidental: under W2 the scan precedes the perm family because the perm head happens to be anchored on `candidate-journey`, which shares the scan's phase. Under W3 the perm head names the scan directly, so a future edit that moves `candidate-journey` cannot silently move the perm family ahead of the scan. |
| verdict | **admissible.** The strongest hazard posture of the six, at one extra name in an existing array. |

### Wiring W4 — W1 + extend the perm chain head anchor to include `a11y-smoke`

| | |
|---|---|
| change | W1, plus `data-setup-perm-1e1cg1co.dependencies` gains `'a11y-smoke'` |
| diff | ~5 lines |
| scan project | `a11y-smoke` |
| predicted phase | **3** of 80 |
| co-scheduled | `candidate-journey` |
| T-147-05 / T-147-06 in phase | **NONE / NONE** |
| state at entry | no earlier pre-clear; last REPLACE `data-setup-base` ✓ |
| opt-in runs | `--project=a11y-smoke` pulls **2**: base + auth ✓ — but `--project=perm-*` now pulls the **entire** voter a11y suite as well, so the perm family can no longer start until 16 voter a11y tests have finished |
| run-time consequence | same 0 s … +13.4 s band as W1, plus the perm chain is now hard-gated on the voter a11y suite |
| verdict | **admissible**, but it buys W3's explicitness by paying W1's price and then adding a coupling W3 does not have. |

### Wiring W5 — append `candidate-a11y-scan` to the TAIL of the perm serial chain

The mechanism an earlier phase chose for the bank-auth journey (`playwright.config.ts:753-800`) when
the `app_settings` singleton won over isolation speed: `auth-setup` gains
`dependencies: ['voter-prefs-tracking']` (the chain's last leaf) and the scan follows it.

| | |
|---|---|
| diff | ~12 lines |
| scan project | `candidate-a11y-scan` |
| predicted phase | **55** of 82 (`auth-setup` at 54) |
| co-scheduled | **none — the scan runs entirely alone** |
| T-147-05 — REPLACE in phase | **NONE** |
| T-147-06 — `test-` pre-clear in phase | **NONE** |
| state at entry — earlier `test-` pre-clears | **25**, `data-setup-perm-1e1cg1co` … `data-setup-perm-analytics-tracking` |
| state at entry — last REPLACE before the scan | **`data-setup-perm-analytics-tracking`** |
| opt-in runs | `--project=candidate-a11y-scan` pulls **56** projects — the whole perm chain and both journeys. **And it regresses an existing opt-in run**: `visual-regression` depends on `auth-setup`, so `PLAYWRIGHT_VISUAL=1 --project=visual-regression` would pull the same 56 instead of the 2 it pulls today. |
| verdict | **DISQUALIFIED — on axis 2, decisively, and this is the finding that justifies scoring two axes.** By phase 55 all 25 perm setups have run `extraTeardownPrefix: ['test-', 'e2e-perm-']`, which deletes `test-e2e-base-%` — **including `test-e2e-base-ca-aa-1`, the candidate row the scan is authenticated as.** The scan's identity no longer exists when the scan runs. Concurrently it is the *safest* wiring of the six; sequentially it is the only one that is impossible. And its `app_settings` singleton at that point is the umami analytics overlay, not the base one, so even a surviving identity would be scanning the wrong application. |

### Wiring W6 — dedicated setup with its own force-register and its own storage state; `auth-setup` stays gated

| | |
|---|---|
| change | new `tests/tests/setup/candidate/candidate-a11y.setup.ts` performing the same `unregisterCandidate` → `forceRegister` → real UI login into a **separate** storage-state file; new projects `data-setup-candidate-a11y` (on `data-setup-base`) and `candidate-a11y-scan` (on it). `auth-setup` and its `PLAYWRIGHT_VISUAL` gate are **not touched.** |
| diff | ~25 lines + a new setup file |
| scan project | `candidate-a11y-scan` |
| predicted phase | **3** of 80 |
| co-scheduled | `candidate-journey` |
| T-147-05 / T-147-06 in phase | **NONE / NONE** |
| state at entry | no earlier pre-clear; last REPLACE `data-setup-base` ✓ |
| opt-in runs | `--project=candidate-a11y-scan` pulls **2** ✓; `visual-regression` completely unaffected ✓ |
| verdict | **admissible** on every hazard, and it is the only wiring that changes nothing about `auth-setup` — so `ORD-PERTURB`'s answer is irrelevant to it. Its cost is a **second** force-register-and-login mechanism for the same identity `CA-AA-1`, duplicating `auth.setup.ts` almost verbatim; the two would then race for the same `auth.users` row whenever both run (`PLAYWRIGHT_VISUAL=1 yarn test:e2e`), which is a new hazard the other five do not have. |

### Summary of the enumeration

| wiring | scan phase | REPLACE in phase | `test-` pre-clear in phase | earlier pre-clears | last REPLACE | opt-in closure | run-time cost | verdict |
|---|---|---|---|---|---|---|---|---|
| W0 | 2 | none | none | none | `data-setup-base` | 1 | — | admissible, reaches nothing |
| W1 | 3 | none | none | none | `data-setup-base` | 2 | 0 … +13.4 s | admissible |
| W2 | 3 | none | none | none | `data-setup-base` | 2 | ≈0 s | admissible |
| W3 | 3 | none | none | none | `data-setup-base` | 2 | ≈0 s | admissible |
| W4 | 3 | none | none | none | `data-setup-base` | 2 | 0 … +13.4 s | admissible |
| W5 | 55 | none | none | **25** | **`data-setup-perm-analytics-tracking`** | **56** | +0 s but serial | **DISQUALIFIED** |
| W6 | 3 | none | none | none | `data-setup-base` | 2 | ≈0 s | admissible |

**No wiring is selected here.** § *Decision (A)* selects, after `ORD-PERTURB`.

One conclusion is already firm and is worth stating separately, because it is the opposite of what the
ROADMAP's framing implies: **the ordering risk the scout named is real but it is not realised by any of
the natural wirings.** The perm family is anchored on the journey leaves, so phases 1–3 contain no
`app_settings` REPLACE and no `test-` pre-clear at all; a scan placed there is disjoint from both
hazards by construction. The wiring that *does* realise the hazard is the one that tries hardest to
avoid it — the perm-tail serialisation — and it realises it through sequence rather than concurrency,
which is precisely the axis a same-phase-only analysis would have missed.

### ✅ `ORD-PERTURB` landed — and the rule below was written before it did

`ORD-PERTURB` was **blocked on the environment** when this section was first written (two full-suite runs
voided by the host disk). It has since been measured: **136 passed / 0 failed / 0 skipped / 0 flaky / 0
did-not-run**, exit 0, 10.7 min, at HEAD `6e65a5d2f` — verdict **does not perturb**
(`147-NEGATIVE-CONTROL.md` § *`ORD-PERTURB`*).

**The table below is retained exactly as it was written before the measurement.** That is the point of it:
the selection rule was pre-registered, so § *Decision (A)* applies a rule fixed in advance rather than one
fitted to the result afterwards. The measurement read *does not perturb*, so by the pre-registered rule
`W1`–`W4` remain available and **`W3` leads**.

**This is not a formality.** The measurement discriminates cleanly between the two leading wirings, and
the enumeration above is what makes that visible:

| if `ORD-PERTURB` reads | then |
|---|---|
| **does not perturb** | `W1`–`W4` remain available. `W3` leads: it is the only wiring that is admissible on both hazard axes, preserves `--project=a11y-smoke` pulling **only** `data-setup-base`, costs ≈0 s (the new work hides under phase 3's 27.3 s critical path), and makes the scan's precedence over the perm family **explicit** through the anchor the repo already uses for exactly this purpose (`eperm07-term-trigger`) rather than leaving it incidental to `candidate-journey`'s phase. |
| **perturbs** | every wiring whose first move is the ungating — `W1`, `W2`, `W3`, `W4`, and `W5` — is off the table, because a wiring whose first move is already a regression is not available. **`W6` becomes the only admissible wiring**, since it is the one that does not touch `auth-setup` at all. |

So the open measurement is not a bookkeeping gap: it selects between `W3` and `W6`, which differ in
whether a second force-register-and-login mechanism for `CA-AA-1` enters the repository.

Two further findings that Decision (A) must carry forward whichever way the measurement lands, because
they are properties of the wirings rather than of the perturbation:

1. **Blast radius on `a11y-smoke`.** `W1`/`W4` make the 16 voter a11y tests depend on a candidate login.
   Under the E2E Hard Rule a did-not-run counts as a failure, so a single `auth-setup` flake would
   convert the entire voter a11y suite into 16 failures. `W2`/`W3`/`W6` confine that blast radius to the
   candidate scan project alone.
2. **`W2`/`W3`/`W6` need `testMatch` scoping.** The candidate scans land in their own spec file, and
   `a11y-smoke` declares `testDir: './tests/specs/a11y'` with **no** `testMatch` — so it would otherwise
   pick the new file up as well and run it unauthenticated. Both projects must gain an explicit
   `testMatch`. `W1` does not need this, because everything stays in one spec.


---

## Decision (A) — the ordering wiring: **W3**

Selected by applying the plan's criterion in its stated order, and by the rule pre-registered above
*before* `ORD-PERTURB` was taken. Predicted phases below are emitted by
`node tests/e2e-runs/147/phases.mjs --wiring W3` — the instrument `ORD-OBSERVED` validated at **0
mismatches over 89 projects**, re-confirmed at 0 against the restored config after the perturbation was
reverted — never transcribed by hand.

### The wiring, concretely

| # | change | file |
|---|---|---|
| 1 | Remove the `PLAYWRIGHT_VISUAL` gate on `auth-setup` so the project is declared unconditionally. **This is the exact edit `ORD-PERTURB` measured** — the one deterministic token — and it was measured as harmless. | `tests/playwright.config.ts` |
| 2 | Add project `candidate-a11y-scan`: `storageState: STORAGE_STATE`, `dependencies: ['data-setup-base', 'auth-setup']`, plus an **explicit `testMatch`** for the new candidate spec file. | `tests/playwright.config.ts` |
| 3 | Add an **explicit `testMatch`** to `a11y-smoke`. It declares `testDir: './tests/specs/a11y'` with none, so it would otherwise pick the new candidate spec up and run it **unauthenticated**. | `tests/playwright.config.ts` |
| 4 | `data-setup-perm-1e1cg1co.dependencies` gains `'candidate-a11y-scan'` — the in-repo anchor mechanism already used to hold `eperm07-term-trigger` ahead of the perm family. | `tests/playwright.config.ts` |

Item 3 is not optional bookkeeping: without it the wiring is silently wrong in the one direction that
produces a *green* run — an unauthenticated scan of candidate routes that redirects to a login page and
scans it clean.

### Predicted phase table under W3

| | |
|---|---|
| scan project | `candidate-a11y-scan`, **phase 3 of 80** |
| `auth-setup` | **phase 2** |
| co-scheduled with the scan (1) | `candidate-journey` — and nothing else |
| `--project=candidate-a11y-scan` pulls | **2**: `data-setup-base`, `auth-setup` |
| `--project=a11y-smoke` pulls | **1**: `data-setup-base` — the voter scan's isolation is **preserved** |
| `--project=performance` pulls | **1**: `data-setup-base` |
| diff | ~13 lines |

### Hazard verdict — both axes, both clear

| axis | hazard | verdict |
|---|---|---|
| concurrency | `app_settings` REPLACE in the scan's phase | **NONE** |
| concurrency | `test-` prefix pre-clear in the scan's phase | **NONE** |
| state at entry | `test-` pre-clears in any earlier phase | **NONE** |
| state at entry | last `app_settings` REPLACE before the scan | `data-setup-base` ✓ — the singleton the default suite runs under |

**Run-time consequence: ≈0 s.** Phase 2 absorbs `auth-setup` under its 64.3 s critical path
(`voter-journey`); measured directly in `ORD-PERTURB` at **3.0 s**, and that run's total came in at
**10.7 min against `BASE-GREEN`'s 10.8** — i.e. inside noise. Phase 3 becomes
`max(candidate-journey 27.3 s, candidate-a11y-scan ≈22 s)`, so the new work hides under an existing
critical path and serialises nothing that was parallel.

### Rejected alternatives

Each is rejected in the selection criterion's own terms, not in general ones.

- **`W5` — append the scan to the tail of the perm serial chain.** **DISQUALIFIED on criterion 1.** Its
  scan phase is **55**, entered after **25** earlier `test-` pre-clears, and the last `app_settings`
  REPLACE before it is `data-setup-perm-analytics-tracking`, not `data-setup-base`. It realises the very
  hazard it was drawn to avoid — through *sequence* rather than concurrency, which a same-phase-only
  analysis would have missed. It also serialises the scan behind the whole perm family.
- **`W1` — ungate `auth-setup`, add it to `a11y-smoke.dependencies`.** Admissible on criteria 1–3, loses
  on criterion 2 and on blast radius. `--project=a11y-smoke` would pull **2** setups instead of 1,
  giving up an isolation the base chain's comment says the repo maintains deliberately. And it makes the
  16 voter a11y tests depend on a candidate login: under the E2E Hard Rule a did-not-run is a failure, so
  one `auth-setup` flake becomes **16 voter failures**. Cost band 0 … +13.4 s vs W3's ≈0 s.
- **`W4` — `W1` + anchor the perm head on `a11y-smoke`.** Rejected for the same reasons as `W1`, plus it
  buys W3's explicitness at W1's price and then adds a coupling W3 does not have: `--project=perm-*`
  would pull the **entire** voter a11y suite, so the perm family could not start until 16 voter a11y
  tests finished.
- **`W2` — `W3` without the anchor edge.** Admissible, identical phase table, and the closest rival. It
  is rejected only on the last criterion in the order — *prefer the smaller diff* — being overridden by
  what one extra name buys: under `W2` the scan precedes the perm family **incidentally**, because the
  perm head happens to be anchored on `candidate-journey`, which happens to share the scan's phase. Under
  `W3` the perm head names the scan directly, so a later edit that moves `candidate-journey` cannot
  silently move the perm family ahead of the scan. One array entry for an invariant that stops depending
  on a coincidence. **This is the one rejection that would be reasonable to overturn**, and it costs one
  line to switch.
- **`W6` — a dedicated setup with its own force-register and storage state, `auth-setup` left gated.**
  Admissible, but it exists to survive an `ORD-PERTURB` reading of *perturbs*. The measurement read **does
  not perturb**, so its reason for existing is gone, and it is the only option that adds a **second**
  force-register-and-login mechanism for `CA-AA-1` to the repository — duplicated auth machinery whose
  two copies can drift.
- **`W0` — baseline, unmodified.** Carried as the control only. It reaches nothing: it is the state whose
  blindness `AX1-OLD` and `RK1/RK2-OLD` already demonstrated.

---

## Decision (B) — criterion 5's reporting mechanism: **compute both verdicts in one body, report both, neither short-circuiting the other**

### What the criterion actually asks, after the scout's correction

Criterion 2/5's premise as the ROADMAP states it is already false in execution order. `assertAxeScan`
calls `assertNoRawI18nKeys` **before** the axe scan, so the raw-key gate already reaches its verdict
regardless of what axe says — an axe failure **cannot** subsume a raw-key failure today. What the two
share is a single `test()` body and therefore a single reported verdict, which makes this a **reporting**
property (scout § *C*).

The remaining coupling runs the *other* way, and it is real: `assertNoRawI18nKeys` terminates in a hard
`expect(findings).toEqual([])`, which **throws**. So a raw-key failure suppresses the axe result on that
surface entirely — the surface reports one defect when it may have two.

Note also that the split's original justification is **measured false**: the ROADMAP argued the extension
"would very likely land the suite red", and the scout measured **0 violations across 28 scans, both
themes, twice** (§ *A*). So the split can no longer be justified as red-avoidance; it stands or falls on
reporting granularity alone.

### The mechanisms, each costed from `BASE-GREEN`'s per-test durations

Derived, not estimated. `a11y-smoke` in `BASE-GREEN` is **130.2 s** over 16 tests — 14 axe scans
(**116.0 s**) plus 2 `navigation-a11y` tests (14.2 s). Split by fixture kind, light + dark twins summed:

| route kind | routes | tests | measured |
|---|---|---|---|
| fixture-driven (`located` / `answered`: `questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) — each walks a real voter journey | 4 | 8 | **104.4 s** |
| raw (`home`, `elections-selector`, `constituencies-selector-located`) — cost is a navigation, not a walk | 3 | 6 | **11.6 s** |
| **all scanned voter surfaces** | **7** | **14** | **116.0 s** |
| candidate surfaces (scout-measured, both themes) | 7 | 14 | **≈22 s** |

| mechanism | what it buys against the criterion's words | measured cost |
|---|---|---|
| 1. a separate test per surface, **every** scanned route | Satisfies the criterion's *letter*: the raw-key result becomes its own reported test on every surface. | **≤ +116.0 s** voter + **≈+22 s** candidate = **≤ +138 s (+2.3 min)** — an upper bound, since the duplicate re-pays the *reach* (settle → content anchor → animations) but not the axe `analyze()`. On a 10.8 min suite that is **≈+21 %**. |
| 2. a separate test per surface, **candidate routes only** | Same, but only for half the surfaces. | **≈+22 s** |
| 3. **one body computing and reporting both verdicts, neither short-circuiting** | Removes the *actual* remaining defect — the raw-key throw suppressing the axe result — and makes each verdict independently reported and always reached. | **≈0 s.** Both gates already run; the change is to collect the raw-key findings instead of throwing at them, then report both. The DOM read is already paid. |
| 4. a named `test.step` inside the shared body | Gives the raw-key gate its own entry in the report and trace. | ≈0 s |

### The choice, and the number that decided it

**Mechanism 3.** Mechanism 1 buys a separate reporter row for **≤ +138 s**, a **≈+21 %** increase in
suite wall clock, on a suite governed by a cardinal all-green rule where every extra second is paid on
every run forever. **+138 s is the number that decided it.** Mechanism 3 removes the real defect — one
surface's two independent findings can no longer hide each other — for ≈0 s.

**⚠ Stated plainly rather than glossed, because it is an interpretation of a requirement, not a free
choice.** Mechanism 3 satisfies criterion 5's *purpose* (an independent, non-subsumed raw-key verdict);
it does **not** satisfy the scout's literal restatement, *"reported as its own **test**"*. Reporter output
still shows one test per surface, with both findings inside it. If a separate test row is wanted as such,
mechanism 1 is the option and its price is measured above at **≤ +138 s** — a one-line change of decision
here, and a larger one in `147-03`. This is the single place in this document where the evidence does not
by itself force the answer.

### Rejected alternatives

- **Mechanism 1 (separate test, every route).** Rejected on measured cost: **≤ +138 s / ≈+21 %** of suite
  wall clock, to convert a reporting shape whose original red-avoidance justification is **measured
  false** (scout § *A*). It remains the correct choice if the literal "own test" wording is treated as
  binding.
- **Mechanism 2 (separate test, candidate routes only).** Rejected as incoherent rather than expensive.
  At ≈+22 s the cost would be acceptable, but the raw-key gate runs on **all 28** surfaces; reporting it
  separately on 14 of them and subsumed on the other 14 makes the reported shape depend on which app the
  route belongs to, which nothing in the criterion asks for and no reader would predict.
- **Mechanism 4 (named step).** Rejected as insufficient. A `test.step` improves where the failure is
  *displayed* but changes neither verdict count nor the short-circuit: the hard `expect` inside the step
  still throws, and the axe scan after it still never runs. It addresses the symptom the criterion names
  while leaving the mechanism that causes it untouched.

---

## For 147-03

Everything below is decided. No residual choice is carried into the implementing plan.

| # | change | where |
|---|---|---|
| 1 | Remove the `PLAYWRIGHT_VISUAL` gate on `auth-setup`; declare it unconditionally. | `tests/playwright.config.ts` (the gate at the `auth-setup` project) |
| 2 | Add project `candidate-a11y-scan` — `storageState: STORAGE_STATE`, `dependencies: ['data-setup-base', 'auth-setup']`, explicit `testMatch` for the new spec. | `tests/playwright.config.ts` |
| 3 | Add an explicit `testMatch` to `a11y-smoke` so it does **not** collect the new candidate spec. | `tests/playwright.config.ts` |
| 4 | Add `'candidate-a11y-scan'` to `data-setup-perm-1e1cg1co.dependencies`. | `tests/playwright.config.ts` |
| 5 | Create the candidate scan spec — 7 `(protected)` surfaces × 2 themes = 14 scans, reusing the existing authenticated fixture (scout § *E*: the fixture is already built; this is wiring). | new spec under `tests/tests/specs/a11y/` |
| 6 | Change `assertNoRawI18nKeys` so it **returns** its findings instead of terminating in a throwing `expect`, and have the shared body report both verdicts. | `tests/tests/utils/rawKeyScan.ts` (the `expect(...).toEqual([])` at `:328-333`), `a11y-smoke.spec.ts` (`assertAxeScan`) |
| 7 | Confirm the drawer surfaces are reached **via the fixture, not a click** (scout § *7* route-table hazard). | the new spec |

**Records that go stale and must be corrected in the same phase** (from scout § *F*; each currently
states the voter-only / 7-routes / 14-surfaces shape as fact):

| file | lines |
|---|---|
| `tests/tests/utils/rawKeyScan.ts` | 34-40 ("7 routes x 2 themes"), 300-301 ("WHICH of the 14 scanned surfaces") |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | 3-6, 33-46, 47-51; **156-158** ("all routes are voter-app (public)" — becomes false); 359, 457-465 |
| `tests/playwright.config.ts` | 362-397 ("`auth-setup` … is dormant in the default run" — becomes false at change 1) |
| `.planning/milestones/v2.14-REQUIREMENTS.md` | 126 (REAL-04: wrong line numbers, wrong key spelling) |
| `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md` | 21-24 (same two errors) |
| `.planning/REQUIREMENTS.md` | 40-41 (CSCAN-03: same wrong line numbers) |
| `.planning/ROADMAP.md` | 788-797 (criteria 2, 3, 4 and the split rationale — scout §§ *A*–*D*) |

**No lint change is implied.** `tests/eslint.config.mjs:64` sets `assertFunctionPatterns:
['^expect[A-Z]', '^assert[A-Z]']`; both `assertAxeScan` and `assertNoRawI18nKeys` already match, and they
still will after change 6.

**Ungoverned surface to be aware of:** the soft-assertion budget guard is scoped to
`specs/voter/voter-journey.spec.ts` only, so `expect.soft` in the new candidate spec is unpoliced
(scout § *F*).
