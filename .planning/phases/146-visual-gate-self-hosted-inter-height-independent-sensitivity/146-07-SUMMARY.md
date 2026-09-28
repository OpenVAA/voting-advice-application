---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: '07'
subsystem: testing
tags: [visual-regression, playwright, fonts, determinism, e2e-harness]
status: complete
requires:
  - '146-04 (maxDiffPixels cap)'
  - '146-05 (self-hosted Inter + guardThirdPartyFonts)'
  - '146-06 (font delta measured; F1/F2/F3 filled)'
provides:
  - 'the four committed visual baselines, matching this phase''s cap and rendering'
  - 'G0-CLEAN — the fourth D-07 half, proven by a non-updating comparison run'
  - 'PT1-PRODTRACE — VGATE-05''s production half'
  - 'byte-stable voter captures (the focus-convergence fix in selectElection.ts)'
affects:
  - '146-08 (determinism runs, egress-blocked suite, cardinal E2E gate)'
  - '146-09 (record corrections — must state the D-16 re-scope)'
tech-stack:
  added: []
  patterns:
    - 'converge post-navigation DOM focus in the test helper, never by changing the product''s a11y focus reset'
    - 'measure capture byte-stability in a redirected snapshot sink before baking a baseline'
    - 'regression-check a fixed transport defect by its POSITIVE signal (drops absorbed), not by absence of failures'
key-files:
  created: []
  modified:
    - tests/tests/utils/selectElection.ts
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-desktop.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-mobile.png
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/deferred-items.md
decisions:
  - 'Task 0 (operator-approved addition): fix the capture variance by FOCUSING the app''s own post-navigation target rather than blurring the option button — a blur races the pending afterNavigate rAF, re-focusing the same element is idempotent under it'
  - 'The product''s afterNavigate focus reset (NAVA11Y-02) was deliberately NOT touched'
  - 'D-16 executed as a REGRESSION check on the landed dropped-SYN fix, not as the chartered discovery protocol, which is obsolete'
  - 'The re-baseline is described as absorbing the TIE PERMUTATION, not a font change — N-1 resolved in the negative in 146-06'
metrics:
  duration: ~1h05m
  completed: 2026-08-26
  tasks: 4
  commits: 5
actuals:
  tokens: 12000
  tasks: 4
  commits: 5
---

# Phase 146 Plan 07: Re-baseline, D-16 and the production trace — Summary

Re-captured the four visual baselines behind the egress block and proved them green on a clean
tree, after first making the voter captures byte-stable by converging a focus state the test walk
left non-deterministic; re-scoped D-16 from an obsolete discovery protocol into a regression check
on the landed dropped-SYN fix; and discharged VGATE-05's production half with a request list from a
real adapter-node server.

## What was done

### Task 0 (operator-approved addition) — the capture variance is fixed, and the fix is test-only

`.planning/debug/seed-determinism-across-resets.md` established that the two voter baselines flipped
between exactly two variants across runs at a fixed HEAD (8 blue / 4 black in 12 runs), differing in
a single 291×17 px band: the `/results` election chip rendering `focus:text-primary` or not. An AND
of two conditions — `tests/tests/utils/selectElection.ts` pins *which* election is displayed but not
the interaction *path*, and the extra election-switch navigation fires `afterNavigate`'s rAF-deferred
focus reset, which steals focus from the just-clicked option button.

**The fix focuses the app's own post-navigation target rather than blurring the button.** A blur
races: if the pending `afterNavigate` rAF has not run, it fires afterwards and re-focuses the
heading, restoring exactly the variance the blur was meant to remove. Focusing the same element the
app would focus is idempotent under that late callback, so the outcome is identical whether it ran
before, during or after. The product's focus reset is untouched — it is NAVA11Y-02 and correct
accessibility behaviour, not something to trade away for a stable screenshot.

**Run count and what it supports.** 12 runs at a fixed HEAD, captures written to a redirected
snapshot sink so the committed directory was never read or written (verified with `git status` after
each). Result: **all four baselines byte-identical in 12/12 runs**, one sha256 each. The load-bearing
part is not the 12 — it is that **both interaction paths occurred**: 3 runs took the 2-navigation
path and 9 the 1-navigation path (read from each run's own Playwright trace), and both produced the
same bytes. Pre-fix the path→hash map was **12/12 deterministic**, so sampling both paths with
identical bytes falsifies that model outright. Under a weaker "some residual ⅓ flip survives" model,
12 identical runs give `(2/3)¹²` ≈ **0.008**, i.e. the null is rejected at about the 1 % level.

The committed capture is byte-identical to the pre-fix *unfocused* variant (0 exact differing pixels)
and differs from the *focused* one by the same 1,727 px band — so the fix collapsed the two variants
onto one of them rather than inventing a third rendering.

**What 12 runs cannot exclude:** a third, rarer variant. This is the same blind spot the debug record
names for its own 12, and it is one host and one image digest.

### Task 1 — the re-baseline (VGATE-06) and G0-CLEAN

Pre-write gate, both halves, before a byte was written:

- `guardThirdPartyFonts` green on all four captures — 48 guard passes over the 12 runs above,
  `observed_unexpected=0` in every one.
- `document.fonts.size` = **4** (two loaded latin faces, two unloaded latin-ext), `check('1em Inter')`
  `true`, measured in the pinned container through a throwaway probe overlay carrying the preflight's
  own OK line. This is the reading `settleFonts` cannot supply — `check()` returns `true` with zero
  faces (N-2).

The baking run used `--update-snapshots-all` (the literal `--update-snapshots=all`; `grep` confirms
the bare `changed`-mode form never appeared) **with** `--block-egress`, whose `curl` control failed
first with `exit=7`, so Google-served Inter was unreachable while the pixels were taken. All four
images reported `is re-generated, writing actual.`

Dimensions unchanged in all four (1280×3684, 390×4152, 1280×821, 390×924), checked from the PNG IHDR
header. Before/after byte sizes and `git hash-object` values are in the register's
`## Baseline re-capture`.

**What changed, in both directions:** the two voter baselines had a non-zero delta and changed
(31,540 / 31,387 raw exact-differing px) — the stale tie permutation, which is what the re-baseline
exists for. The two `candidate-preview` baselines had a delta of **zero** and changed anyway, by
exactly **159** raw px each: the sub-threshold residue `146-VISUAL-NOISE-LEDGER.md` already recorded
(per-channel deltas 6–7, never scored by pixelmatch). Their `0 px` is a statement about the
comparator, not the bytes.

`G0-CLEAN`: a non-updating comparison run on a clean tree at the re-baseline commit — **all four
captures PASS**, exit 0, `grep -c update-snapshots` → 0 in both `pw-args.txt` and `docker-argv.txt`,
and `git status --short tests/tests/specs/visual/` **empty** afterwards.

### Task 2 — D-16, RE-SCOPED (not executed as chartered)

**What D-16 originally asked:** up to three bounded attempts to reproduce the v2.14 "run-4 anomaly"
as an *unexplained* failure, under continuous dev-server uptime, on the premise that it might be Vite
HMR staleness.

**Why it is obsolete:** the failure is root-caused and fixed. `.planning/debug/answer-surface-wait-timeout.md`
establishes that the container's outbound TCP SYN to `host.docker.internal` is intermittently dropped,
stalling connections 36–68 s in Linux SYN backoff because `tcp-forward.mjs` dialled once with no
deadline. Fixed in `4066c2f41` (bounded re-dial) and `351981b4f` (the voter fixture now fails at the
stalled navigation instead of swallowing the timeout). Run as written, the three attempts would have
produced three non-reproductions whose meaning is already known — and with derisory power (~49 %
chance of reproducing even at the assumed rate, i.e. weak evidence of absence).

**What ran instead**, structured around the positive signal rather than an absence:

| Row | Instrument | Result |
|---|---|---|
| `D16-A1` | relay-level heartbeat, 480 s at 200 ms | 2,239 connections, **33 dropped SYNs, 33 absorbed**, 0 given up; ladder depths 28×2, 4×3, 1×4 of 8; worst request **3,036 ms** against an 8,000 ms bound; 0 stalls ≥ 5 s |
| `D16-A2` | suite-level corpus, 15 in-container runs | 1,662 connections, 1 drop, 0 given up — reported explicitly as the **low-power** arm |
| `D16-A3` | paired host-direct control, same window | 2,384 connections, max **55 ms**, zero stalls — rules out "the environment simply went quiet" |

The drop rate this session was **1.47 % per connection**, roughly *double* the pre-fix 0.786 %: the
defect is louder, not quieter, and was absorbed every time. Worst pre-fix stall 68,378 ms → 3,036 ms
here.

**Two limits carried forward unsoftened.** (1) The original end-to-end symptom was never reproduced
post-fix, so the chain from "≤ 4 s stall" to "the fixture no longer fails" is **mechanical**, not
demonstrated. (2) Docker Desktop's egress drops are unfixed and outside our control; **CI is a
different environment and this evidence does not transfer to it**. The v2.14 linkage itself remains
**INFERRED** — the old record never captured which test failed.

The re-scope is recorded explicitly in the register (§ *D-16 was re-scoped, and why*) so `146-09` can
correct the phase record from a stated fact rather than an inference.

### Task 3 — the production trace (PT1-PRODTRACE, VGATE-05 half 2)

`node apps/frontend/build/index.js` on port **4319** (not the dev server's 5173), after `yarn build`
at this HEAD. Six routes driven with a `page.on('request')` recorder.

**477 requests, exactly two hosts:** `localhost:4319` (447) and `127.0.0.1:54321` (30, local Supabase
REST). No other host contacted at all. Font assets, same-origin, all 200: `/fonts/inter.css`,
`/fonts/inter-latin-400-normal.woff2`, `/fonts/inter-latin-700-normal.woff2`.

The claim is phrased as **zero third-party font requests observed** — never zero occurrences in the
build. `grep -rn "fonts.googleapis" apps/frontend/build/` returns **7** hits across 5 files and
`fonts.gstatic` returns **5**; those survive by design (the `??` fallback and two preconnect
literals) and are correct behaviour, not a leak.

**Can VGATE-05 be ticked? Yes, with its scope stated.** Both halves now exist: the permanent in-spec
guard from `146-05` and this production request list. The two scope statements the row carries are
the honest boundary — see *Deviations* below.

## Deviations from Plan

### Operator-directed re-scopes (not discretionary)

**1. Task 0 was added.** Not in the plan; directed by the operator on the strength of the
seed-determinism falsification. Committed separately (`2df2d0b28`) from the re-baseline
(`dc064f591`) so the two are independently revertable, as instructed.

**2. Task 2 was re-scoped rather than executed.** Directed by the operator and independently
supported by the register's own § *The `146-05` restart — …D-16's continuity requirement is void as
chartered*. The plan's `must_haves` truths about D-16 (three inject/revert attempts, uptime
evidence, the "still unexplained" closure) are therefore **not** discharged as written, and the
register says so in place rather than leaving the reader to notice. The plan's automated check still
passes legitimately: the rows are filled, and the document carries both the power statement and the
`UNCONFIRMED` wording — in the section explaining why that closure was never worth reaching for.

### Auto-fixed and disclosed

**3. [Rule 3 — blocking] `G0-CLEAN` ran in its own directory.** The pre-written cell named
`tests/e2e-runs/146-rebaseline`, which holds the `--update-snapshots=all` baking run; a comparison run
cannot share a directory with the run it verifies. It went to `tests/e2e-runs/146-g0-clean`.
Disclosed in the row rather than back-dated.

**4. [Rule 1 — bug in my own measurement] The first `PT1-PRODTRACE` attempt was invalid and was
discarded.** `146-g0-clean`'s `data-teardown-base` had emptied the base dataset, so the production
app rendered an **error page** on every voter route — the trace was real but measured nothing worth
claiming. Re-seeded with `yarn db:seed --template e2e/base` and re-ran. Recorded in the register
rather than quietly replaced.

**5. Acceptance criterion "all four `/fonts/*.woff2` requests appear with status 200" is NOT met, and
the criterion is what is wrong.** Only **two** are fetched: `inter.css` declares four `@font-face`
rules, and the latin-ext pair carries a `unicode-range` no English-locale page uses, so the browser
never requests them. Subsetting working as designed, corroborated by the independent
`document.fonts.size = 4` / 2-loaded probe reading.

**6. The located routes were reached as their guard redirects.** `/questions`, `/results` (307) and
`/candidate/preview` (303) redirect without a resolved election+constituency or a candidate session,
and the throwaway trace script carries neither. Three bounded attempts to drive the elections
selection through the production UI did not advance past `/elections`; I stopped rather than build a
second fixture harness. This does not weaken the claim — the font `<link>` is emitted by the **root**
`+layout.svelte` and is identical on every route, and those two routes are covered permanently by the
in-spec guard, which is exactly why D-12 gives VGATE-05 two halves. It is recorded because a reader
is entitled to know which documents actually rendered.

**7. `deferred-items.md` was amended, not merely appended to.** Its consequence *"what is not safe is
any future procedure that asserts byte- or digest-identity of the two voter baselines"* is now false
and was struck in place, with the superseding measurement beside it. Leaving it standing would
propagate a false premise into later plans.

## Known Stubs

None.

## Deferred Issues

- **The full `yarn test:e2e` cardinal gate was not run here** — it is `146-08`'s `E2E1-SUITE`, and
  this plan's change to `selectElection.ts` is imported only by `visual-regression.spec.ts` (verified
  by grep), which no default-suite project enumerates. The visual project itself is green
  (`G0-CLEAN`, plus 12 prior runs and the baking run, all `observed_unexpected=0`).
- **The `e2e/base` `externalIdPrefix: ''` fragility** (a foreign candidate rotating all 30 portrait
  assignments) remains filed as an observation in `deferred-items.md`, unfixed. It cannot fire on a
  clean database and the freshness probe warns when it would.
- **Docker Desktop's SYN drops** are unfixed and not ours to fix. The relay absorbs them; a burst
  deeper than eight would still exhaust the ladder and fail loudly with `gave-up=N`.

## Self-Check: PASSED

- Four baselines present at expected dimensions, hashes recorded — verified.
- All five commits present in `git log` — `2df2d0b28`, `dc064f591`, `c980c0d88`, `f19f24408`,
  `b92a53305`.
- Register: 29 rows, placeholder count **55**, down exactly 25 from `146-06`'s 80.
- `git diff --exit-code` over `playwright.config.ts`, `staticSettings.ts`,
  `visual-regression.spec.ts`, `preflight.ts`, `global-setup.ts`, `+layout.svelte` → exit 0.
- `git diff --stat 0c3a26ab6..HEAD -- tests/tests/support/preflight.ts tests/global-setup.ts` → empty
  (T-146-05: no byte moved).
- `yarn lint:check` and `yarn format:check` → pass.
- Adapter-node server stopped; working tree clean.
