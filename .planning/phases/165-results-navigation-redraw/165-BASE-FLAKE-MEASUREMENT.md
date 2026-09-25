# 165 — EQTYP-02 base-branch flake measurement

**Date:** 2026-09-23
**Question:** Does `voter-journey` EQTYP-02 flake on the base branch `integration/ship-12-squash`, at what rate, and with which symptoms?
**Method:** measurement only. No source file, test or config was modified. The only artefact produced is this document.

---

## Verdict

**INTRODUCED.** The base branch is clean across the entire sample; the phase branch is not.

| Arm | Ref | Red / counted | Rate | Unconfirmed runs |
|---|---|---|---|---|
| **Base** | `integration/ship-12-squash` @ `af695421e` | **0 / 22** | **0 %** | 0 |
| **Phase tip** | `feat/165-results-navigation-redraw` @ `404948d78` | **6 / 16** | **37.5 %** | 0 |

Every run in both arms was preflight-confirmed (`preflight-successes=1`, `preflight-failures=0`), so no run is excluded from either denominator. The rates above are fractions of *counted* runs, and counted == total in both arms.

**Statistics.** Fisher's exact test, two-tailed: **p = 0.0029**. A 0/22 base sample bounds the base true rate at **≤ 12.7 %** (95 % one-sided); the phase rate of 6/16 has a Wilson 95 % CI of **[18.5 %, 61.4 %]**. The intervals do not overlap.

The phase branch surfaced a defect it also **caused**. Ownership sits with Phase 165, not with the base branch.

---

## Why this measurement is larger than the one requested

The task specified seven base runs and called 0/7 decisive. It is not: 0/7 versus 3/7 gives Fisher p ≈ 0.19, and a 0/7 sample is compatible with a true rate as high as ~35 %. Reporting 0/7 as a verdict would have been an underpowered sample dressed as a conclusion. Three corrections were therefore made to the design:

1. **Base extended from 7 to 16, then to 22 runs.**
2. **The phase arm was re-measured (16 runs at the tip).** The pre-existing phase-branch evidence was too weak to compare against — see the confounder below.
3. **An interleaved base control was run after the phase arm** (runs 17–22) to rule out time-ordering.

### Confounder found and corrected: the "3 red of 7" was a mixture of two run scopes

Wave 5's "3 red of 7" is not seven comparable runs. Reconstructed from the committed run directories:

| Scope | Runs | Red |
|---|---|---|
| Full suite (118 specs, ~75 projects, heavy parallel load) | `165-05-qinfo-assert`, `-assert-2`, `-post-delete`, `-post-delete-2` | 2 / 4 |
| Project-scoped (`--project voter-journey`, 4 specs) | `165-05-vj-probe-1`, `-2`, `-3` | 1 / 3 |

The base runs are all project-scoped, so they were only comparable to the 1/3 subset — far too weak a counterpart (0/22 vs 1/3 gives p ≈ 0.13). Re-measuring the phase arm at 16 project-scoped runs made both sides like-for-like at the same scope, same wrapper, same host and same database.

Full-suite runs on base were deliberately **not** performed: they mutate the `app_settings` singleton and auth users well beyond the authorised scope, and another phase's state lives in this database.

### Time-ordering control

The base and phase arms ran sequentially (base 12:25–12:45 UTC, phase 12:46–13:12 UTC), so environment or database drift could in principle masquerade as a branch effect. Base runs 17–22 were executed **after** the whole phase arm and remained 0/6. Drift is ruled out.

---

## Base run table — `integration/ship-12-squash` @ `af695421e`

All runs: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/base-flake-NN --project voter-journey --no-db-reset`.
Exit status read directly from `$?`, never through a pipe, and cross-checked against the wrapper's own `exit` file.

| Run | Wrapper exit | Preflight | Specs | EQTYP-02 |
|---|---|---|---|---|
| base-flake-01 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-02 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-03 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-04 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-05 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-06 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-07 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-08 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-09 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-10 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-11 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-12 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-13 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-14 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-15 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-16 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-17 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-18 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-19 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-20 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-21 | 0 | ok=1 fail=0 | 4 | PASS |
| base-flake-22 | 0 | ok=1 fail=0 | 4 | PASS |

Runs 17–22 are the interleaved control executed after the phase arm.

**EQTYP-02 was verified to have actually executed and passed in all 22** — not skipped, not absent, and with no retry (`status: passed`, `retry: 0`). A green exit with a skipped test would have been a false green; this project counts "did not run" as a failure.

## Phase run table — `feat/165-results-navigation-redraw` @ `404948d78`

| Run | Wrapper exit | Preflight | EQTYP-02 | Symptom |
|---|---|---|---|---|
| phase-flake-01 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-02 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-03 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-04 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-05 | 1 | ok=1 fail=0 | **FAIL** | (a) accordion never collapses |
| phase-flake-06 | 1 | ok=1 fail=0 | **FAIL** | (a) accordion never collapses |
| phase-flake-07 | 1 | ok=1 fail=0 | **FAIL** | (a) accordion never collapses |
| phase-flake-08 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-09 | 1 | ok=1 fail=0 | **FAIL** | (b) `<html>` intercepts pointer events |
| phase-flake-10 | 1 | ok=1 fail=0 | **FAIL** | (b) `<html>` intercepts pointer events |
| phase-flake-11 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-12 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-13 | 1 | ok=1 fail=0 | **FAIL** | (a) accordion never collapses |
| phase-flake-14 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-15 | 0 | ok=1 fail=0 | PASS | — |
| phase-flake-16 | 0 | ok=1 fail=0 | PASS | — |

---

## Symptoms

**Both** symptoms occur, on the phase branch only. Neither was observed on base in 22 runs.

**(a) Accordion never collapses — 4 of 6 tip reds.** Verbatim:

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('voter-results-election-select').getByRole('option')
Expected: 1
Received: 2
Timeout:  2000ms

Call log:
  - Expect "toHaveCount" with timeout 2000ms
  - waiting for getByTestId('voter-results-election-select').getByRole('option')
    6 × locator resolved to 2 elements
      - unexpected value "2"
```

Failing at `voter-journey.spec.ts` line 385, inside `expectElectionOptionAndSelect`.

**(b) Document View-Transition signature — 2 of 6 tip reds.** Verbatim:

```
TimeoutError: locator.click: Timeout 2000ms exceeded.
Call log:
  - waiting for getByTestId('voter-results-election-select').getByRole('option', { name: /regional/i }).first()
    - locator resolved to <button tabindex="0" role="option" aria-selected="false" …>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en">…</html> intercepts pointer events
```

Both failures strike the **same element** — the election select, `view-transition-name: results-election-select` — at the same step of the walk.

### Historical wave-5 reds, reclassified

| Run | Head | Symptom |
|---|---|---|
| `165-05-qinfo-assert` | `5e455e2d5` | (a) accordion never collapses |
| `165-05-qinfo-post-delete` | `c84e3b6b4` | (a) accordion never collapses |
| `165-05-vj-probe-2` | `5e455e2d5` | (b) `<html>` intercepts pointer events |

Pooling the tip arm with the wave-5 runs gives **9 red / 23** phase-branch runs (39.1 %), consistent with the 37.5 % measured at the tip.

> **Classification caveat, recorded because it nearly produced a wrong report.** Playwright embeds a source code-frame in the error body, and in this spec the `target.click(...)` call at line 383 sits two lines above the `toHaveCount(...)` assertion at line 385. A *click-timeout* error therefore contains the literal string `toHaveCount` in its body. Classifying on a substring match over the whole message mislabels symptom (b) as symptom (a). Symptoms here are classified on the **error headline only** (`Error: expect(locator).toHaveCount` versus `TimeoutError: locator.click: Timeout`).

---

## Where the defect is *not*

Two mechanisms were checked against base directly and are **byte-unchanged**, confirming the correction made to the wave-5 attribution:

- **`AccordionSelect.svelte:48`** — `let expanded = $state(activeIndex == null || activeIndex < 0)`, initialised once and never reconciled. `git diff af695421e 404948d78 -- apps/frontend/src/lib/components/accordionSelect/` is **empty**. Present on base verbatim.
- **The document View-Transition coupling** — `routes/+layout.svelte` line 153 already carries `onNavigate` + `startViewTransition` on base. The phase's only change to that hook is an *added* `if (isOverlayNavigation(...)) return` guard, which makes document VTs run **less** often, not more.

A third candidate was formed during this investigation and **falsified**: that the phase introduced new `view-transition-name` groups in the results tree. It did not. The set of names is identical across both refs — `results-election-select` and `results-entity-tabs` both pre-exist on base. The phase only *relocated* `results-entity-tabs` into a nested layout.

So both ingredients pre-exist, yet base does not flake in 22 runs. The trigger is something the phase changed *around* them.

---

## Mechanism hypothesis — **UNCONFIRMED**

Not isolated by experiment. Recorded as a lead, not a finding, and must not be inherited as fact.

The phase changed `(voters)/(located)/+layout.ts` so that `url.pathname` / `url.search` are read inside `untrack(...)` rather than tracked. The phase's own source comment states the pre-fix behaviour plainly: reading them tracked meant *"every results tab / drawer navigation reruns this load, re-streams the question + nomination data and blanks the whole subtree via `+layout.svelte`'s `ready` flag (remount, scroll clamped to 0, intro redraw; spike 031)"*.

That yields a coherent, phase-introduced amplifier:

- On **base**, each results navigation tears down and rebuilds the results subtree. The named VT elements — including `results-election-select` — are destroyed and recreated, so they are frequently absent at View-Transition capture time and the transition degrades to a cheap root crossfade. The accordion component is also remounted, which re-runs the `expanded` initialiser at line 48 and masks the fact that it never reconciles.
- On the **phase branch**, those elements now *persist* across results navigations — which is the entire point of the fix. A persistent named element is captured on both the old and new side, producing a genuine morph animation, and a persistent `AccordionSelect` keeps whatever `expanded` value it was constructed with.

This predicts exactly the two observed symptoms from one cause: symptom (a) is the never-reconciled `expanded` surviving a navigation that previously remounted it, and symptom (b) is the widened window in which the `::view-transition` overlay makes `<html>` swallow the click. It also explains why the defect is latent on base — the pre-existing remount churn was hiding it.

**Falsification test:** force a remount of the results subtree on the phase branch (e.g. key the layout on the election tab) and re-run the 16-run project-scoped measurement. If the hypothesis holds, the red rate should collapse toward base's. If it does not, the hypothesis is wrong and the `expanded` initialiser should be examined on its own.

Note this makes the defect **pre-existing but unreachable**, not newly written: `AccordionSelect:48` is latent base code that Phase 165 made reachable. The fix most likely belongs in `AccordionSelect` (reconcile `expanded` against `activeIndex`) even though Phase 165 owns the regression.

---

## Reproduction

```bash
# Base arm (expect green)
git switch --detach integration/ship-12-squash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --project voter-journey --no-db-reset

# Phase arm (expect ~37% red)
git switch feat/165-results-navigation-redraw
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --project voter-journey --no-db-reset
```

Dependencies are identical across the two refs (`git diff --stat` over `package.json`, `yarn.lock` and every workspace manifest is empty), so no `yarn install` is needed when switching. No `yarn dev:clean` was required during this measurement; no run needed a retry for environment reasons.

`voter-journey.spec.ts` is **byte-identical** between the two refs, so both arms ran the same test. The phase's `tests/playwright.config.ts` change only *adds* a `voter-results-redraw` project, which a `--project voter-journey` run never invokes; the new `viewTransitionLog` fixture is opt-in and EQTYP-02 does not request it.

## Evidence

38 run directories under `tests/e2e-runs/`: `base-flake-01` … `base-flake-22`, `phase-flake-01` … `phase-flake-16`. Each holds `exit`, `head`, `preflight-successes`, `preflight-failures`, `results.json`, `stdout.log`, `devserver.log` and `worktree-status.txt`. Nothing under `tests/e2e-runs/` was deleted.

Worktree state was recorded before the measurement and restored after: `feat/165-results-navigation-redraw` @ `404948d784d9bda23fa2e5e2888f6740c963a5d2`, `git status --porcelain` empty. Restoration verified clean. No commit was made on the detached HEAD.
