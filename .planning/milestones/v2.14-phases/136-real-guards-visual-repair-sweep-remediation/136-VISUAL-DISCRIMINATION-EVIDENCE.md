# Phase 136 — Visual-Regression Gate: Discrimination Evidence

**Recorded:** 2026-08-12, post-verification, at operator request.
**Closes:** `VERIFICATION.md` → `behavior_unverified_items[0]` (REAL-01 discrimination).
**Does not close:** it opens a new, quantified concern — see §4.

## 1. Why this run existed

Phase 136's own thesis is that *an assertion that cannot fail is worse than no assertion*. Every
other guard in the phase was proven by an injected-regression negative control. The repaired
visual-regression project was the one deliverable that was not: 136-05 recorded **stability**
(3× identical passes) but never **sensitivity**. `gsd-verifier` flagged exactly this, noting that at
`maxDiffPixelRatio: 0.01` a 4.7 Mpx baseline tolerates ~47k differing pixels, leaving the
discrimination floor unmeasured.

## 2. Environment

Identical to the 136-05 re-baselining recipe, so the numbers are comparable to the recorded ones.

| | |
|---|---|
| Image | `mcr.microsoft.com/playwright:v1.58.2-noble` |
| Digest | `sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d` (matches 136-05) |
| Platform | `--platform linux/amd64`, in-container `uname -m` = `x86_64`, node v24.13.0 |
| Stack | Vite on the host, `--host 0.0.0.0 --port 5174`; Supabase on the host; forwarded onto container loopback by dual-stack socat |
| Served-app check | `<title>Election Compass</title>` asserted **inside the container** before every run (response content, not process type — per the Phase 136 constraint) |
| Data | `yarn db:reset` + `yarn db:seed --template e2e/base` |
| Invocation | `--project=visual-regression --workers=1 --retries=0` (stricter than CI, which retries 3×) |

## 3. The control

**Injection:** `apps/frontend/src/lib/components/matchScore/MatchScore.svelte:30`,
`text-lg` → `text-2xl`. A realistic design-token regression: it changes the type scale of the match
score on **every** entity card in the results list, and nothing else.

| Run | Tree | `maxDiffPixelRatio` | Result |
|-----|------|--------------------|--------|
| 1 | clean | 0.01 (shipped) | **7/7 passed**, exit 0 — baseline reproduces in this environment |
| 2 | **injected** | 0.01 (shipped) | **EXIT 1 — 1 failed / 6 passed**; `voter-results-mobile.png`, 18,926 px (ratio 0.02) |
| 3 | **injected** | 0 (measurement only) | **EXIT 1 — 2 failed / 5 passed**; desktop 19,484 px, mobile 19,545 px |
| 4 | reverted | 0.01 | 1 failed / 6 passed — **anomaly, see §5** |
| 5 | clean | 0.01 | **7/7 passed**, exit 0 |
| 6 | clean | 0.01 | **7/7 passed**, exit 0 |
| 7 | clean | 0.01 | **7/7 passed**, exit 0 |

**The gate discriminates.** Run 2 is the proof: with the shipped configuration, an injected visual
regression turns the blocking job red and names the offending baseline
(`Expected: …/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png`), and runs 5–7
show it returns to green on revert. REAL-01's "the gate would actually catch a regression" claim is
now evidenced, not assumed.

## 4. NEW FINDING — the floor is real, and it scales with page height

Run 3 (tolerance zeroed, purely to measure) is the interesting one. The **same** injection did
near-identical absolute damage to both voter baselines — but only one of them failed at the shipped
setting:

| Baseline | Dimensions | Total px | 1% tolerance | Measured diff | Ratio | Shipped verdict |
|---|---|---|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 4,715,520 | 47,155 | **19,484** | 0.41% | **PASSES — regression missed** |
| `voter-results-mobile` | 390×4152 | 1,619,280 | 16,192 | **19,545** | 1.21% | FAILS — caught |
| `candidate-preview-desktop` | 1280×821 | 1,050,880 | 10,508 | 0 | 0% | passes (component absent) |
| `candidate-preview-mobile` | 390×924 | 360,360 | 3,603 | 0 | 0% | passes (component absent) |

The desktop results page is 2.9× taller in pixel area than the mobile one, so an identical defect is
diluted below the ratio threshold. **A regression that changes the type scale of every match score
in the results list is invisible to the desktop baseline**, and is caught only because the mobile
baseline happens to be narrower.

The general shape: `maxDiffPixelRatio` is a *proportional* budget applied to full-page screenshots
of unbounded height, so **the taller the page grows, the blinder the gate becomes** — a results page
that gains rows silently raises its own tolerance. This is a milder cousin of the phase's own
central pathology, and it was not visible from stability testing alone.

**Not fixed here** (this is a verification record, not a plan): the fix is plausibly a
`maxDiffPixels` absolute cap alongside the ratio, or clipped/element-scoped screenshots with
bounded area, and it needs a re-baseline decision. Filed as a todo.

Also worth noting: both candidate-preview baselines diffed at **exactly zero** pixels across runs —
strong evidence that the containerised rasterisation is deterministic and that `settleFonts` is
doing its job.

## 5. The run-4 anomaly — recorded, NOT explained

Run 4 was the first run after `git checkout --` of the injected file and returned 1 failed / 6
passed. **Which test failed was not captured** — the log was not retained for that run, and it did
not recur across runs 5, 6 and 7 (all 7/7).

The leading hypothesis is the known Vite HMR staleness window (memory:
`project_e2e_hmr_staleness_restart` — the dev server serves a stale module immediately after a source
change, and results are untrustworthy until it is restarted). Run 4 fired seconds after reverting a
component file against a long-running dev server, which fits.

**This hypothesis is UNCONFIRMED.** It was not tested in isolation, and the failing test is unknown.
It is recorded here rather than dismissed, because "it didn't recur" is precisely the reasoning this
milestone has refused to accept elsewhere (see DEF-135-04). If the visual job proves flaky in CI,
this is the first data point, and the honest count is **1 unexplained failure in 5 clean runs**
(runs 1, 4, 5, 6, 7).

## 6. Verdict

- REAL-01 **discrimination: PROVEN** at the shipped configuration (run 2).
- REAL-01 **sensitivity: MEASURED, and weaker than the claim implies** — one of the four baselines
  demonstrably misses a real regression (§4).
- Container/stack recipe: **reproduced independently** of 136-05, same image digest, same results.
