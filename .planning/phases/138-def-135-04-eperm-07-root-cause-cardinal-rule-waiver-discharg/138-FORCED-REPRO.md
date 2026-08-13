# Phase 138 — DEF-135-04 / EPERM-07 Forcing-Configuration Search Log

The record of the zero-cost half of the hunt (plan 02, tasks 2 and 3): the budget-lever sweep, the
tri-state at every run, the non-degeneracy verdict, and the Discriminator-A View-Transition A/B.

**Opened:** 2026-08-13 (plan 02, task 2)
**Requirement:** INTEG-01 — force the DEF-135-04 failure ON DEMAND before any fix is written
(ROADMAP criterion 1), and diagnose it to a **named** root cause.
**Instrument:** `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` (plan 01), driven through the
`eperm07-term-trigger` Playwright project.

> **Evidence rule for this entire document.** Every count, status and tri-state recorded below was
> **machine-read from a Playwright `results.json`**, never transcribed by hand from console output.
> The reader is a small parser local to the run session; each run wrote its own JSON via
> `PLAYWRIGHT_JSON_OUTPUT_FILE`, and the classification was computed from the parsed
> `eperm07-state` annotation, not from the human-readable reporter. A number in this document that
> is not backed by a `results.json` field is a bug in this document.

---

## 1. Environment

Captured in the same session as every run below. A future re-run that behaves differently should be
diagnosed against this stamp before it is called a regression.

```
date:                2026-08-13T15:28:04Z (UTC)  /  2026-08-13 18:28 EEST
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:            bea9fc97a   branch feat-gsd-roadmap
git status:          M .vscode/settings.json
                     M supabase/.temp/cli-latest
                     (nothing under tests/ or apps/ — see § Neutrality)
OS:                  macOS 26.5.1 arm64
Node:                v24.14.1
Vite (frontend):     6.4.1
SvelteKit:           2.55.0
Playwright:          1.58.2
Supabase CLI:        v2.83.0 installed (v2.114.0 available; `.temp/cli-latest` reads v2.109.1)
Supabase local:      project_id=openvaa-local, /rest/v1/ -> 200, containers `supabase_*_openvaa-local`
DB state:            `yarn db:reset` run once at session start, before any sweep run
Frontend port:       5273  (FRONTEND_PORT=5273 yarn dev, one server, never restarted mid-sweep)
```

**Port allocation, and why 5173 was not used.**

| Port | Held by | Role |
|---|---|---|
| **5273** | this checkout's `yarn dev` (Vite 6.4.1) | the server under test — every run below hit it |
| 5173 | `com.docke` holding the IPv6 **wildcard** (`TCP *:5173`) | a sibling checkout's Docker container; untouched |
| 54321 | `supabase_kong_openvaa-local` | this repo's local Supabase |

```
--- lsof -nP -iTCP:5273 -sTCP:LISTEN  (this checkout's dev server) ---
COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    92504 kallejarvenpaa   65u  IPv6 0xc6612e91f7828291      0t0  TCP [::1]:5273 (LISTEN)

--- lsof -nP -iTCP:5173 -sTCP:LISTEN  (the wildcard shadow-bind, avoided) ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)
```

Port 5173 carries a wildcard bind from Docker Desktop, which is exactly the shadow-bind that
`CLAUDE.md` § E2E preflight and `137-NEGATIVE-CONTROL.md` §7 describe: `localhost` and `127.0.0.1`
can reach different servers and it becomes ambiguous which server is under test. Every run below
therefore used `FRONTEND_PORT=5273`, and the Phase-137 served-application preflight passed on every
one of them (a preflight abort exits 1 before any spec body runs; no run below aborted in preflight).

**Run posture, read back OUT of `results.json` rather than restated from config:** `config.workers`
= 6 on every run; `results.length - 1` = **0 retries** on every run, i.e. `CI` was absent and no
failure below is a retry artefact.

---

## 2. What was swept, and how

**The lever: `EPERM07_FORCE_BUDGET_MS` only.** No CPU throttle, no media emulation — task 2's
mandate is the budget knob alone. The knob is oracle-side by construction: it changes how long the
term-trigger assertion waits, and nothing about what the application does.

**D-02 compliance, stated explicitly.** No artificial delay was injected into the app's term-render
path — not into `apps/frontend/src/lib/components/questions/QuestionHeading.svelte` (which parses
terms out of the heading text) and not into the `Term.svelte` trigger component. D-02 rules that out
as the *first* mechanism precisely because injecting a delay into a component presumes the mechanism
lives there, and this sweep exists to find out whether it does. (D-02 names the old term-translation
utility module; plan 01 established that module is dead code with no call site, so the constraint is
read against the live parse path named above.)

**The invocation, per run** — an environment prefix and CLI flags only, no committed file touched:

```bash
FRONTEND_PORT=5273 \
PLAYWRIGHT_JSON_OUTPUT_FILE=<per-run>.json \
EPERM07_FORCE_BUDGET_MS=<rung> \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

`--reporter=json` + `PLAYWRIGHT_JSON_OUTPUT_FILE` is what makes the evidence machine-readable
without editing `tests/playwright.config.ts` (whose committed reporter is html-only).

**The ladder:** 2000 → 1000 → 600 → 400 → 250 → 150 → **125** → 100 ms. The 125 ms rung is not in
the plan's suggested ladder; it was added to bisect the 150/100 boundary once 150 came back clean
and 100 came back failing, because the width of that band is itself the measurement. Every rung
attempted appears below, including the seven that produced no failure at all.

**Non-degeneracy classification** (plan 02 task 2 step 3 / RESEARCH §R2.4-C), applied mechanically
to the parsed `eperm07-state` annotation of **every** run, pass and fail alike:

| Observed tri-state | Classification |
|---|---|
| `headingCount === 1` ∧ text contains `Base opinion 2` ∧ `triggerCount === 0` | **H1-shaped** — stale DOM |
| `headingCount === 0` ∧ `triggerCount === 0` | **H2-shaped** — render gate closed |
| text contains `Base opinion 3` ∧ `triggerCount === 0` | **H3-shaped** — terms arrived late |
| text contains `Base opinion 3` ∧ `triggerCount >= 1` | **DEGENERATE** — element present, oracle did not wait |

---

## 3. The sweep

### 3.1 Summary table — one row per attempted rung

| Rung (`EPERM07_FORCE_BUDGET_MS`) | Runs | Failures | Failure rate | Tri-state of failing runs | Degenerate? |
|---|---|---|---|---|---|
| 2000 (production default) | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 1000 | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 600 | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 400 | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 250 | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 150 | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| 125 (bisecting rung) | 5 | 0 | 0 % | — (all 5 passes were H1-shaped) | n/a |
| **100** (block 1) | 5 | **4** | 80 % | 4/4 **H1-shaped** | **No** |
| **100** (block 2, same config) | 10 | **7** | 70 % | 7/7 **H1-shaped** | **No** |
| **100 — combined** | **15** | **11** | **73 %** | **11/11 H1-shaped** | **No** |

No rung below 100 ms was attempted: the plan forbids chasing a failure below that floor, on the
ground that below it any navigation fails and the result is degenerate by construction.

### 3.2 The finding that reframes the sweep — the stale state is UNIVERSAL, not intermittent

Across **all 50 runs at all 8 rungs**, the `eperm07-state` annotation took exactly **two** distinct
values, and they differ only in the constituency-chip render order (`MunicipalRegional` vs
`RegionalMunicipal`) — an unrelated non-determinism in a chip list, not in the question content:

```
30/50  {"headingCount":1,"headingText":"MunicipalRegional [qg-opin-base] Base Opinion Questions 2/8 [qu-opin-base-2-likert4] Base opinion 2 — Likert 4.","triggerCount":0}
20/50  {"headingCount":1,"headingText":"RegionalMunicipal [qg-opin-base] Base Opinion Questions 2/8 [qu-opin-base-2-likert4] Base opinion 2 — Likert 4.","triggerCount":0}
```

**50 of 50 runs — including every one of the 39 that PASSED — were H1-shaped.** At the instant
immediately after the production URL-only settle, the URL has *always* already advanced to Base-3
while the rendered heading still reads **`Base opinion 2`** and `triggerCount` is **0**. `headingCount`
was never 0 (excluding H2 at that instant) and the heading never read `Base opinion 3` (excluding H3
at that instant), in any of the 50 runs.

This upgrades plan 01's two-run observation from "the window is reachable" to **"the window is
unconditional on this machine at this contention level."** The URL-before-DOM gap is not the rare
event; it is the *normal* post-settle state. What varies run to run is only **how long the gap stays
open**, and therefore whether the oracle's budget outlasts it.

Consequence for the non-degeneracy question: because the tri-state is the stale-Base-2 state in
100 % of runs, **no rung produced a single DEGENERATE failure.** `DEGENERATE` appears nowhere in the
classification column of any rung. The failures at 100 ms are failures against a genuinely stale
DOM — the same state, with the same `element(s) not found` error text, as the recorded DEF-135-04
occurrence — not an impatient oracle staring at a present element.

### 3.3 The band, measured

| | |
|---|---|
| Largest budget at which the assertion **never** failed (5/5 pass) | **125 ms** |
| Largest budget at which the assertion **did** fail | **100 ms** (11/15) |

So the post-settle DOM-swap latency on this machine is tightly clustered in the **100–125 ms** band:
above ~125 ms the swap always wins; at 100 ms it loses roughly three times in four. The production
budget is `TIMEOUTS.element` = **2000 ms**, i.e. **20× the observed swap latency** — which is why the
defect is a ~1-in-8 event in the wild rather than a constant failure, and why shrinking the oracle's
patience alone cannot reach 20× without leaving the plan's 100 ms floor.

### 3.4 The failure is the right failure — verbatim error text

Machine-read from `b100/run-01.json`, `results[0].error.message` (ANSI stripped):

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('voter-questions-term-trigger').first()
Expected: visible
Timeout: 100ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 100ms
  - waiting for getByTestId('voter-questions-term-trigger').first()
```

`element(s) not found` is the **exact** phrase the DEF-135-04 occurrence recorded
(`deferred-items.md:181-198`), on the **exact** locator. The forced failure is the same shape as the
defect of record, differing only in the `Timeout:` line.

### 3.5 Per-run detail — every run, pass and fail, machine-read

`heading identity` is the ASCII substring verdict on the annotation's `headingText` (never
whole-string equality — the seeded title carries a U+2014 em dash); `MR`/`RM` records which of the
two constituency-chip orderings that run rendered. `question id (URL)` is the first 8 characters of
the annotation's `pathname` leaf, recorded so no two runs can be confused for one another.

**Rung `b2000`** — `EPERM07_FORCE_BUDGET_MS=2000`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | 86bf2e88 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 02 | passed | 4eb58002 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 03 | passed | 2578e285 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | passed | 58423e68 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | passed | 7100fa52 | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b1000`** — `EPERM07_FORCE_BUDGET_MS=1000`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | 11eee155 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | passed | 814687e8 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 03 | passed | 75053db7 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | passed | aef2eac5 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | passed | 65a24e69 | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b600`** — `EPERM07_FORCE_BUDGET_MS=600`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | 3f734cee | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | passed | 875baa9e | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 03 | passed | 280a400c | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 04 | passed | f35b573f | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 05 | passed | baf0173b | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b400`** — `EPERM07_FORCE_BUDGET_MS=400`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | ec6b7c36 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 02 | passed | 912ec930 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 03 | passed | dfe1fc6c | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | passed | 5abcd7af | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | passed | 4b36e901 | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b250`** — `EPERM07_FORCE_BUDGET_MS=250`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | 0529defa | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | passed | a119aefb | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 03 | passed | 448e6746 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | passed | 6555a8a9 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 05 | passed | 8ed3c756 | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b150`** — `EPERM07_FORCE_BUDGET_MS=150`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | d756deaa | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | passed | 0be9092f | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 03 | passed | a2088951 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | passed | c14f850c | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 05 | passed | 755d77cf | 1 | Base-2 (stale) RM | 0 | H1-shaped |

**Rung `b125`** — `EPERM07_FORCE_BUDGET_MS=125` (bisecting rung, added at executor discretion)

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | passed | 5d3afeb5 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 02 | passed | acf39d2b | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 03 | passed | 6f0759b1 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 04 | passed | 4baeb01a | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | passed | a5beb166 | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b100`, block 1** — `EPERM07_FORCE_BUDGET_MS=100`

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | **failed** | 8193dfb0 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | **failed** | e96a135d | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 03 | passed | 7221ab5b | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 04 | **failed** | 2de2fd9a | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | **failed** | 3e88f4ab | 1 | Base-2 (stale) MR | 0 | H1-shaped |

**Rung `b100`, block 2** — identical configuration, run immediately after block 1 (this is the
rebuildability confirmation: the same environment prefix, re-run verbatim, reproduces the failure)

| Run | Outcome | question id (URL) | headingCount | heading identity | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | **failed** | 97df6f1c | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 02 | **failed** | c26a1f38 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 03 | **failed** | c3911b66 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 04 | **failed** | fb10637e | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 05 | passed | 956fcd35 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 06 | passed | 0f23beed | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 07 | **failed** | 3b799044 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 08 | passed | 8fc4f204 | 1 | Base-2 (stale) RM | 0 | H1-shaped |
| 09 | **failed** | 7ba62fb9 | 1 | Base-2 (stale) MR | 0 | H1-shaped |
| 10 | **failed** | 4875fd58 | 1 | Base-2 (stale) RM | 0 | H1-shaped |

---

## Result: budget lever insufficient

**Stated against the bar the plan set, not against a softer one.** The plan's outcome (a) requires a
rung whose failures are non-degenerate **and at least 5 of 5 consecutive**. No rung met it. The
longest consecutive failure streak observed at 100 ms was **4** (block 2, runs 01–04). At the 100 ms
floor the failure rate is 11/15 = 73 %, which is high but **not deterministic**, and the plan
forbids going below 100 ms to chase the remaining 27 %.

**So this task ends in state (b): the budget lever alone cannot force the failure deterministically
at this contention level.**

**What that eliminates.** It is not reachable by shrinking the oracle's patience alone: the swap
latency band (100–125 ms, §3.3) sits 20× below the production budget, so a budget small enough to
lose deterministically would have to go below the plan's floor, where the result stops being
informative. The knob moves the *oracle*; the defect needs the *window* to widen.

**The escalation, named.** Plan 03's amplification levers, which act on the window rather than the
oracle:
1. **CDP CPU throttling** — `EPERM07_FORCE_CPU_RATE` (already wired, neutral at 1), which amplifies
   View-Transition snapshot-capture cost directly. RESEARCH §R2.4-B suggests starting at 4 and
   escalating to 20. Combined with a *moderate* budget (not the floor), this is the configuration
   most likely to reach 5/5 without leaving the informative regime.
2. **Worker pressure** — running the hunt project against a loaded machine (concurrent workers), so
   the main-thread contention that widens the window in the wild is present in the experiment.

**Why this is a finding and not an abandonment.** The sweep did not fail to reproduce the defect — it
reproduced it 11 times, in exactly the right shape (§3.4), with the tri-state universally H1-shaped
(§3.2). What it failed to reach is *determinism*, and it measured precisely why: the window is
~100–125 ms against a 2000 ms budget. That measurement is what tells plan 03 how much amplification
it needs (roughly 20×, which is the top of RESEARCH's suggested throttle range) — a number the sweep
had to be run to learn.

---

## Forcing configuration

The operating point carried forward to §6 and to plan 03. **Read the caveat before reusing it.**

```bash
# Prereq: exactly one dev server for THIS checkout on 5273, and a reset DB.
#   yarn db:reset
#   FRONTEND_PORT=5273 yarn dev          # separate shell; leave it running

FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=100 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$PWD/eperm07-run.json" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

| Property | Value |
|---|---|
| Failure rate | **11/15 (73 %)** over two blocks run back to back |
| Longest consecutive failure streak | 4 |
| Deterministic (≥5/5)? | **NO** — this configuration does **not** meet the plan's outcome-(a) bar |
| Every failing run non-degenerate? | **YES** — 11/11 H1-shaped, 0 DEGENERATE |
| Error text | `element(s) not found` on `getByTestId('voter-questions-term-trigger').first()` |
| Rebuildable? | **YES** — block 2 is block 1's configuration re-run verbatim, and it reproduced |

> **Caveat, load-bearing for plan 04.** This is a **high-rate stochastic** forcing point, not the
> deterministic one criterion 2's negative-control pair requires. A pre-fix half that fails 73 % of
> the time is not a control — a single passing pre-fix run would falsify the pair. Plan 04 must use
> the **deterministic** configuration that plan 03's amplification produces, not this one. This
> section exists so plan 03 has a byte-identical starting point and so §6's A/B has a frozen
> operating point, not so plan 04 can shortcut the escalation.

---

## Neutrality — nothing was left in the committed tree

Verified after the sweep, before this document was committed:

```
$ git status --porcelain tests/
(no output)

$ git status --porcelain apps/
(no output)

$ git diff --stat tests/tests/helpers/timeouts.ts
(no output)
```

`tests/playwright.config.ts` and `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` were **not**
modified for any experiment above. The forcing is entirely an environment prefix plus the
`--reporter=json` CLI flag, which is exactly the structural neutrality plan 01 built the knobs to
provide: with no `EPERM07_*` variable set, the committed spec runs at the production 2000 ms budget,
with no throttle and no media emulation. All 50 runs' artifacts were written to a session-local
scratch directory outside the repository; nothing under `tests/e2e-runs/` or `.planning/` holds a
raw report.

**No quarantine, skip, `fixme` or `.only` annotation was added to any spec** to make any experiment
convenient. Isolation was achieved entirely by `--project=eperm07-term-trigger`, which the harness
already supports.

---

## Discriminator A — View Transition on/off

The zero-app-change A/B that names or clears the View-Transition layer as **necessary** for the
observed failure. Run at the frozen operating point from § Forcing configuration.

### A.1 Design

`EPERM07_NO_VT=true` makes the hunt spec call `page.emulateMedia({ reducedMotion: 'reduce' })`
before any navigation. The app's own animation gate short-circuits on that media query —
`apps/frontend/src/lib/utils/viewTransition.ts:28`, verbatim:

```ts
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
```

— so `shouldAnimate` returns `false`, the root layout's `onNavigate` hook returns `undefined`
instead of a Promise (`apps/frontend/src/routes/+layout.svelte:165`), and SvelteKit never awaits a
transition. Arm B therefore runs **the identical application code path** with no View Transition
playing, at zero app change. Because no app file is edited, the emulation cannot itself be the cause
of a flip.

| | Arm A | Arm B |
|---|---|---|
| `EPERM07_NO_VT` | unset (transitions **ON**) | `true` (transitions **OFF**) |
| `EPERM07_FORCE_BUDGET_MS` | 100 | 100 |
| `FRONTEND_PORT` | 5273 | 5273 |
| Runs | 10 | 10 |

**Invariants held constant across the arms**, stated so the single-variable claim is checkable: the
same dev server process (**PID 92504, never restarted between the arms** — `lsof` was re-read
immediately before each arm and reported the same PID), the same port, the same
`EPERM07_FORCE_BUDGET_MS=100` operating point, the same seeded `e2e/base` dataset re-imported by
`data-setup-base` before every run, the same Playwright project and config, no CPU throttle in
either arm (`EPERM07_FORCE_CPU_RATE` unset ⇒ rate 1), `retries` = 0 read back from `results.json` on
all 20 runs, and both arms run back to back in one session. The **only** difference between the arms
is the reduced-motion knob.

Arm A is the same configuration as § 3's `b100` blocks but was re-run as a fresh 10-run arm rather
than reusing those 15 runs, so both arms have identical run counts and identical recency.

### A.2 Result

| | Arm A (VT **on**) | Arm B (VT **off**) |
|---|---|---|
| Runs | 10 | 10 |
| **Failures** | **7 / 10** | **9 / 10** |
| Distinct tri-states observed | **1** — `{"headingCount":1,"headingText":"…Base opinion 2 — Likert 4.","triggerCount":0}` | **1** — `{"headingCount":0,"headingText":null,"triggerCount":0}` |
| Classification (all 10 runs, pass and fail alike) | **H1-shaped**, 10/10 | **H2-shaped**, 10/10 |
| Error text on failure | `element(s) not found` on `getByTestId('voter-questions-term-trigger').first()` | **identical**, byte for byte |

Both arms' failure messages, machine-read from `run-01.json` `results[0].error.message` (ANSI
stripped), are the same:

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('voter-questions-term-trigger').first()
Expected: visible
Timeout: 100ms
Error: element(s) not found
```

**Arm A — transitions ON** (`EPERM07_FORCE_BUDGET_MS=100`)

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | **failed** | 7a2ff607 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 02 | **failed** | 6a720644 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 03 | passed | 865a3ea1 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 04 | passed | 7efc2c82 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 05 | passed | 6e1bb22c | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 06 | **failed** | 399fcdc2 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 07 | **failed** | 5948d338 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 08 | **failed** | 7c1b9311 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 09 | **failed** | 35398f9c | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |
| 10 | **failed** | c64126b8 | 1 | "…Base opinion 2 — Likert 4." | 0 | H1-shaped |

**Arm B — transitions OFF** (`EPERM07_FORCE_BUDGET_MS=100 EPERM07_NO_VT=true`)

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification |
|---|---|---|---|---|---|---|
| 01 | **failed** | 97da265e | 0 | `null` | 0 | H2-shaped |
| 02 | **failed** | 6b5909fc | 0 | `null` | 0 | H2-shaped |
| 03 | passed | d308e402 | 0 | `null` | 0 | H2-shaped |
| 04 | **failed** | 4b298da6 | 0 | `null` | 0 | H2-shaped |
| 05 | **failed** | 1105e4ee | 0 | `null` | 0 | H2-shaped |
| 06 | **failed** | 07c8be15 | 0 | `null` | 0 | H2-shaped |
| 07 | **failed** | 6d4d9a64 | 0 | `null` | 0 | H2-shaped |
| 08 | **failed** | 34ca1712 | 0 | `null` | 0 | H2-shaped |
| 09 | **failed** | 51dce11a | 0 | `null` | 0 | H2-shaped |
| 10 | **failed** | 99c2e176 | 0 | `null` | 0 | H2-shaped |

### A.3 Verdict — **H1 eliminated at this lever**

Switching the View Transition off did **not** clear the failure. Arm B failed **9 of 10** against
arm A's **7 of 10** — comparable rates, and if anything slightly *worse* without the transition (the
difference is well inside what 10 runs per arm can distinguish; Fisher exact on 7/10 vs 9/10 gives
p ≈ 0.58, so the honest reading is "no detectable difference in rate", not "worse"). The
View-Transition layer is therefore **not necessary** for the observed failure.

This is a genuine result and it closes this task successfully. It narrows the hunt; it does not end
the phase.

### A.4 Interpretation — what the arms actually changed

The rate did not move, but **the shape of the intermediate state did, completely and with zero
overlap**: 10/10 H1-shaped in arm A, 10/10 H2-shaped in arm B, no run in either arm landing in the
other's class. That is the informative part of this experiment, and it is not visible in the
failure counts alone.

With the transition **on**, `apps/frontend/src/routes/+layout.svelte:161-171` returns a Promise that
SvelteKit awaits before swapping the DOM, and that Promise resolves inside
`document.startViewTransition`'s update callback — so during the window the **outgoing Base-2 DOM is
still live** (`headingCount: 1`, text `Base opinion 2`). With the transition **off**,
`shouldAnimate` short-circuits at `viewTransition.ts:28`, the hook returns `undefined`
(`+layout.svelte:165`), nothing is awaited — and during the window there is **no question heading in
the document at all** (`headingCount: 0`, `headingText: null`).

So the View Transition governs *what the DOM looks like* inside the window, not *whether the window
exists*. The window itself is created upstream of the transition, by the client router's ordering:
SvelteKit pushes the destination URL to history at
`node_modules/@sveltejs/kit/src/runtime/client/client.js:1760` and only swaps the DOM at
`client.js:1824`. The test's production settle (`voter-journey.spec.ts:186-190`, reproduced verbatim
in the hunt spec) waits on the **URL** — i.e. it releases at line 1760 and then asserts against
whatever the DOM happens to be before line 1824. The transition merely decides whether that DOM is
*stale* or *absent*; either way it has no `voter-questions-term-trigger`, and either way the recorded
`element(s) not found` follows. **The mechanism the evidence implicates is the URL-settle oracle
racing the router's DOM swap, not the View-Transition layer that H1 named.**

Corollary worth recording for plan 03: the in-repo prior art that motivated H1 —
`tests/tests/specs/a11y/a11y-smoke.spec.ts` driving Q→Q with `?notr=1` so assertions "never race the
cross-fade" — would **not** have prevented this failure. `?notr=1` is the second short-circuit in the
same gate (`viewTransition.ts:29`) and lands the run in arm B, which fails at 9/10 here. Disabling
the transition is not the fix.

### A.5 Ledger effect, scoped

`138-DIAGNOSIS.md` § Hypothesis ledger is updated for **H1 only**. H2 and H3 remain `live` and the
hunt continues in plan 03.

Arm B's uniform `headingCount: 0` is superficially H2's discriminator, and it is recorded as an
observation — but it is **not** treated as confirming H2, for a stated reason: `headingCount: 0`
under a *transition-disabled* navigation is also exactly what an ordinary mid-swap instant looks
like, so the observation does not distinguish "the render gate at
`questions/+layout.svelte:257-258` transiently closed" from "the new page component has simply not
mounted yet". Separating those two is plan 03's job, with the amplification that lets the window be
observed for longer than one probe. Per plan 02 task 3's own instruction, no H2 or H3 status is
changed on this evidence.

Nor does this section claim a root cause. It establishes that the transition is not *necessary* for
the failure. The root-cause statement is plan 03's, and it must add the ordering evidence directly —
the URL pushed to history before the DOM swap, observed rather than inferred.

### A.6 Neutrality re-verified after the A/B

```
$ git status --porcelain apps/
(no output)

$ git status --porcelain tests/
(no output)
```

No app source file and no committed test file was modified to run either arm.

---

## Discriminator B — CPU amplification at the production budget

**The element budget was left UNSET for every rung of the ladder below, so the assertion ran at the
shared production `TIMEOUTS.element` = 2000 ms throughout. The oracle was NOT weakened.** That is the
entire point of this experiment: a failure forced here would be the *strong* form of criterion 1 — a
race demonstrated at the budget the suite actually runs at, rather than one manufactured by shrinking
the oracle's patience. Whether that was achieved is stated verbatim in §B.4.

### B.1 Environment — delta against § 1

Same machine, same session, **same dev-server process**. Only the facts that moved are restated; every
other line of § 1's stamp still holds and is not duplicated here.

```
date:                2026-08-13T16:27:59Z (UTC)  /  2026-08-13 19:27 EEST
git HEAD:            2d53e6842   branch feat-gsd-roadmap   (was bea9fc97a — plan 02's own commits)
git status:          M .vscode/settings.json
                     M supabase/.temp/cli-latest
                     (nothing under tests/ or apps/ — see § B.10)
Frontend port:       5273, dev server PID 92504 — THE SAME PROCESS that served every plan-02 run,
                     never restarted between plan 02 and plan 03 (lsof re-read at 16:27:59Z)
DB state:            not reset between plan 02 and this task; the `data-setup-base` project
                     dependency re-imports the `e2e/base` dataset before every run, and the hunt
                     spec is READ-ONLY. `yarn db:reset` is run before § Contention, whose
                     precondition requires it.
```

**Run posture, read back OUT of `results.json` on every run below:** `config.workers` = 6,
`results.length - 1` = **0 retries**. `CI` was absent throughout; no failure below is a retry artefact.

### B.2 Design

**The lever: `EPERM07_FORCE_CPU_RATE` only.** The knob opens a CDP session on the page and sends
`Emulation.setCPUThrottlingRate` immediately BEFORE the Base-2 → Base-3 hop, and resets it to 1 and
detaches in a `finally` (`tests/tests/specs/voter/eperm07-term-trigger.spec.ts`, `applyCpuThrottleKnob`
/ `releaseCpuThrottle`). It is a browser-scheduler intervention applied from the test tier: **it
changes no application code**, which is what makes it admissible under D-02.

**D-02 compliance, restated for this task.** No artificial delay was injected into the app's
term-render path — not into
`apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` (which parses terms
out of the heading text at lines 60-75 and renders them at 95-100), and not into
`apps/frontend/src/lib/components/term/Term.svelte` (the trigger component). D-02 rules that out as
the *first* mechanism precisely because an injected delay in a component ASSERTS that the mechanism
lives in that component — the answer this phase exists to earn. D-02 names the old term-translation
utility module; plan 01 established by repo-wide grep that it is dead code with no call site, so the
constraint is read against the live parse path named above. **The technique was never reached for:**
the ladder localised the race without it (§B.6), so the conditional authorisation D-02 grants for a
follow-on confirmation instrument was not exercised, and nothing needed to be recorded under it.

**The invocation, per run** — environment prefix and CLI flags only, no committed file touched:

```bash
FRONTEND_PORT=5273 \
PLAYWRIGHT_JSON_OUTPUT_FILE=<per-run>.json \
EPERM07_FORCE_CPU_RATE=<rung> \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

Note the absence of `EPERM07_FORCE_BUDGET_MS`. Its absence is the experiment.

**The ladder:** 2 → 4 → 8 → 12 → 20 → **40 → 80**. The last two rungs are beyond RESEARCH §R2.4-B's
suggested ceiling of 20 and were added at executor discretion (CONTEXT.md grants the tuning), because
rate 20 came back completely clean and the honest way to record "amplification does not suffice" is to
have pushed it until it visibly broke something. It broke at 80 (§B.6.2).

**Non-degeneracy classification** — the identical table plan 02 defined in § 2, applied mechanically
to the parsed `eperm07-state` annotation of every run, pass and fail alike. One column is added to
every per-run table below: **which assertion actually failed**. A run that fails at the Base-2 heading
gate rather than at the term trigger has not reproduced this defect at all — it has broken the
instrument — and it is marked `OTHER` rather than silently counted.

### B.3 The ladder — summary table

| Rung (`EPERM07_FORCE_CPU_RATE`) | Budget | Runs | Failures | Rate | Tri-states observed | Median test duration |
|---|---|---|---|---|---|---|
| 1 (neutral sanity run) | 2000 (production) | 1 | 0 | 0 % | 1/1 H1-shaped | 3.57 s |
| 2 | 2000 (production) | 10 | **0** | 0 % | 10/10 H1-shaped | 3.45 s |
| 4 | 2000 (production) | 10 | **0** | 0 % | 7 H1-shaped, 3 H2-shaped | 3.57 s |
| 8 | 2000 (production) | 10 | **0** | 0 % | 4 H1-shaped, 6 H2-shaped | 3.70 s |
| 12 | 2000 (production) | 10 | **0** | 0 % | 10/10 H2-shaped | 3.98 s |
| 20 | 2000 (production) | 10 | **0** | 0 % | 10/10 H2-shaped | 4.60 s |
| 40 | 2000 (production) | 10 | **0** | 0 % | 10/10 H2-shaped | 5.88 s |
| 80 | 2000 (production) | 10 | **0** | 0 % | 10/10 H2-shaped | 9.31 s |
| **Total at the production budget** | — | **71** | **0** | **0 %** | — | — |

**Zero failures in 71 runs at the production budget, at CPU slowdowns from 2× to 80×.** The throttle is
demonstrably applying — median test duration rises monotonically from 3.45 s to 9.31 s, a 2.7×
stretch of the throttled section — and it still never pushes the post-settle gap past 2000 ms.

**The second finding in that table, which is not visible in the failure column.** The tri-state
migrates with the throttle rate, monotonically and with no reversals:

| Rung | H1-shaped (stale Base-2 heading live) | H2-shaped (`headingCount: 0`) |
|---|---|---|
| 1-2 | 11/11 | 0/11 |
| 4 | 7/10 | 3/10 |
| 8 | 4/10 | 6/10 |
| 12-80 | 0/40 | **40/40** |

At neutral rate the probe lands with the outgoing Base-2 DOM still live; from rate 12 upward it
*always* lands with no question heading in the document at all. This matters for H2 and is read in
§B.6.3 — and note immediately that it occurs with the View Transition **ON**, which plan 02 could not
observe because its only route to `headingCount: 0` was to switch the transition off.

### B.4 Per-run detail — every run at the production budget, machine-read

`headingText` is the ASCII substring verdict on the annotation's `headingText`, never whole-string
equality (the seeded title carries a U+2014 em dash). `question id (URL)` is the first 8 characters of
the annotation's `pathname` leaf, recorded so no two runs can be confused for one another. The last
column exists so that a run which failed at the WRONG assertion cannot be counted as a reproduction.


**Rung `EPERM07_FORCE_CPU_RATE=2`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 455efcc0 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | 3bca9de6 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | 5b2e58b2 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | 3f8ed439 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | edf4b5a5 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 06 | passed | b64e139b | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 07 | passed | 2d864047 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 08 | passed | 9dc9cbc2 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 09 | passed | 5d0ded77 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 10 | passed | e2bac80a | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Rung 2 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=4`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 6d168735 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | 0f5deaa6 | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | 3902cfe6 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | 30971382 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | 6d5e3848 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 06 | passed | 2aabc2b6 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 07 | passed | f855b5ba | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | a707ae00 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 09 | passed | ba9423cf | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 10 | passed | cfb5f0be | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Rung 4 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=8`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 36be93f2 | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | fbb8a035 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | 2b19e01c | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | 9f10d775 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | f587bbf9 | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 402bfe66 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 07 | passed | 2279fd97 | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | b2dc77d1 | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | 80fc7ab6 | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | 65625ad1 | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Rung 8 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=12`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | b203a60e | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | a7cd1b58 | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | b24e8aea | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | 11ff27e4 | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | e8aa29d4 | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 6f6368c1 | 0 | `null` | 0 | H2-shaped | — |
| 07 | passed | c713d3b5 | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | df06f872 | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | 74bb94cd | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | c618b0a2 | 0 | `null` | 0 | H2-shaped | — |

**Rung 12 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=20`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | d0255039 | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | ec5febfd | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | ac6cfef8 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | 758f011d | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | 96aa85c8 | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 34db1f9d | 0 | `null` | 0 | H2-shaped | — |
| 07 | passed | de678d31 | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | 5f99e9a4 | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | a76bbe4d | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | 21f301a0 | 0 | `null` | 0 | H2-shaped | — |

**Rung 20 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=40`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | b2594b5d | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | 56081119 | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | 5f2aa644 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | fb526a4c | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | deece016 | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 7cdc5659 | 0 | `null` | 0 | H2-shaped | — |
| 07 | passed | 1292b681 | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | 313a2e5f | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | 96af214c | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | a0aa458f | 0 | `null` | 0 | H2-shaped | — |

**Rung 40 result: 0/10 failures.**

**Rung `EPERM07_FORCE_CPU_RATE=80`, budget UNSET (production 2000 ms)** — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 91c2243a | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | 7a465dee | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | 2d582864 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | c42292c6 | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | beb12b7c | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 96ec08d1 | 0 | `null` | 0 | H2-shaped | — |
| 07 | passed | fc9ebeb1 | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | ca116cd8 | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | 006acae1 | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | 43388f46 | 0 | `null` | 0 | H2-shaped | — |

**Rung 80 result: 0/10 failures.**

---

### B.5 Result — **Not forced at production budget; forced with the budget lever**

Stated against the bar the plan set. Amplification alone did **not** suffice: **0 failures in 71 runs**
at the production 2000 ms budget, across CPU slowdown rates 2, 4, 8, 12, 20, 40 and 80. The ceiling
reached is **rate 80**, and rate 80 is not merely "the highest tried" — it is the highest *usable*
rate, because at 80 the throttle starts breaking the instrument itself rather than the assertion under
study (§B.6.2). The strong form of criterion 1 — a reproduction that survives at the production
element budget — **was attempted and was not achieved**, and this document says so rather than
rounding the attempt up.

**What DOES force it** is the budget lever combined with amplification, and the combination is
markedly stronger than plan 02's budget lever alone: plan 02's best operating point was 11/15 (73 %,
longest streak 4), whereas two combination configurations below reach **10/10 and 15/15**. The
criterion-2 pair therefore uses a budget-shrunk configuration, and **the shrink is part of the
adversary description, not a footnote** — §B.8 states it in the terms plan 04 must copy.

**This is a finding about the mechanism, not a failed experiment.** A 40× CPU slowdown stretches the
whole throttled section from 3.45 s to 5.88 s but moves the post-settle gap only from ~112 ms to
~600 ms (§B.7). Whatever holds that gap open is overwhelmingly **not main-thread JS cost** — which is
exactly the class of cost a CPU throttle models, and exactly the class of cost RESEARCH §R1.8's H1
assumed when it nominated View-Transition snapshot capture as the widener. Two of the phase's three
hypotheses depended on that assumption. §B.7 quantifies it and § Contention tests the remaining
candidate amplifier.

### B.6 The combination rung

The plan requires one combination data point — plan 02's forcing configuration PLUS the highest CPU
rung — to distinguish "amplification helps" from "amplification is irrelevant" even when neither lever
alone succeeds. Two were run rather than one, because the highest rung turned out to be degenerate.

#### B.6.1 `EPERM07_FORCE_BUDGET_MS=100 EPERM07_FORCE_CPU_RATE=20` — 10/10



| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | a9e05cd8 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | 8686b9d7 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | c3bd1aee | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 98a6db94 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | f43363e5 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 06 | **failed** | 7da3a52b | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 07 | **failed** | 3fc07728 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 08 | **failed** | 3454cad5 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 09 | **failed** | e57c004a | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 10 | **failed** | 097a9452 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Result: 10/10 failures.**
**Amplification is not irrelevant — it is decisive at this budget.** The identical 100 ms budget
without the throttle is plan 02's § Forcing configuration, which failed **11/15 (73 %)** with a
longest streak of 4. Adding rate 20 takes the same budget to **10/10**, all non-degenerate, all
failing on the term-trigger locator. The combination crosses the determinism bar that neither lever
crosses alone.

#### B.6.2 `EPERM07_FORCE_BUDGET_MS=100 EPERM07_FORCE_CPU_RATE=80` — 10/10, but one run is degenerate



| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | 2b3c6b7b | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | 5c130255 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | 0b84c7d2 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 68f25380 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | e2ec460b | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 06 | **failed** | — | — | `null` | — | n/a | OTHER — see errHead |
| 07 | **failed** | 57fcae9f | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 08 | **failed** | 7d982fe6 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 09 | **failed** | 9a6c445f | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 10 | **failed** | 4325d902 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Result: 10/10 failures.**
Run 06 failed at `expect(heading).toHaveText(/Base opinion 2/)` — the **Base-2 gate**, an assertion
that runs INSIDE the throttled block and is budgeted at the untouched `TIMEOUTS.element` = 2000 ms.
At rate 80 that gate itself can time out, so the run never reached the hop under study. It is a broken
instrument, not a reproduction, and it is marked `OTHER` above rather than counted. **Rate 80 is
therefore rejected as a forcing rate** even though its raw failure count is also 10/10 — a rate that
sometimes fails the wrong assertion cannot be a negative control, because the post-fix half would fail
for a reason the fix was never meant to address. §B.6.4 shows the same breakage at 4/5 in a
different block.

### B.7 Window-width measurement — how much does the throttle actually buy?

This is the experiment that converts "amplification did not suffice" from a dead end into a
localisation. **Method:** hold the CPU rate fixed and bisect the budget until failures stop. The budget
at which the assertion flips from always-failing to always-passing IS the width of the post-settle gap
at that rate, measured in milliseconds, by the oracle itself.

#### B.7.1 At CPU rate 20


**`EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=200`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | ce690571 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | abb10f35 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | ef0f8fed | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 042028fd | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | b547fe4e | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Budget 200 ms result: 5/5 failures.**

**`EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=400`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | ac64b904 | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | 77a953d2 | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | dbe06e86 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | 835b1552 | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | 6cd25b0d | 0 | `null` | 0 | H2-shaped | — |

**Budget 400 ms result: 0/5 failures.**

**`EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=800`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 4a4ba633 | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | 533fff3f | 0 | `null` | 0 | H2-shaped | — |
| 03 | passed | 4d1003f8 | 0 | `null` | 0 | H2-shaped | — |
| 04 | passed | c9140183 | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | 622e9aa3 | 0 | `null` | 0 | H2-shaped | — |

**Budget 800 ms result: 0/5 failures.**

#### B.7.2 At CPU rate 40, and the rate-80 ceiling


**`EPERM07_FORCE_CPU_RATE=40 EPERM07_FORCE_BUDGET_MS=400`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | 747490b8 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | b647662d | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | a2d3dbe0 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 0e6408c4 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | 4801584d | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Budget 400 ms result: 5/5 failures.**

**`EPERM07_FORCE_CPU_RATE=40 EPERM07_FORCE_BUDGET_MS=800`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 24568240 | 0 | `null` | 0 | H2-shaped | — |
| 02 | **failed** | dbc8603e | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | 8d5ecefe | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | passed | d936b30a | 0 | `null` | 0 | H2-shaped | — |
| 05 | **failed** | 7712bc6e | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Budget 800 ms result: 3/5 failures.**

**`EPERM07_FORCE_CPU_RATE=80 EPERM07_FORCE_BUDGET_MS=800`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | — | — | `null` | — | n/a | OTHER — see errHead |
| 02 | **failed** | — | — | `null` | — | n/a | OTHER — see errHead |
| 03 | **failed** | aec7b639 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | — | — | `null` | — | n/a | OTHER — see errHead |
| 05 | **failed** | — | — | `null` | — | n/a | OTHER — see errHead |

**Budget 800 ms result: 5/5 failures.**

#### B.7.3 The measurement, and what it localises

| CPU rate | Post-settle gap (bisected band) | Evidence | Amplification vs. rate 1 |
|---|---|---|---|
| 1 (neutral) | **100 – 125 ms** | § 3.3 (plan 02): 5/5 pass at 125 ms, 11/15 fail at 100 ms | 1× |
| 20 | **200 – 400 ms** | §B.7.1: 5/5 fail at 200 ms, 0/5 fail at 400 ms and at 800 ms | ~2.7× |
| 40 | **400 – 800 ms** | §B.7.2: 5/5 fail at 400 ms, 3/5 fail at 800 ms (the band's upper edge) | ~5.4× |
| 80 | not measurable | §B.7.2: the throttle breaks the Base-2 gate in 4/5 runs before the hop | — |

**A 20× CPU slowdown widens the window ~2.7×. A 40× slowdown widens it ~5.4×.** The relationship is
close to linear in rate with a large rate-independent intercept: fitting the three measured midpoints
gives roughly `gap ≈ 105 ms + 12 ms × rate`. The intercept is the part of the window that CPU
throttling cannot touch.

**Extrapolate, and the negative result becomes a positive statement.** Reaching the production 2000 ms
budget on that fit needs a rate of roughly **130 – 190**. The throttle already destroys the instrument
at **80**. So it is not that this session failed to push hard enough — **the required rate is about
twice the rate at which the technique stops measuring the thing it is aimed at**, and no ladder run at
the production budget could have succeeded. That is a bounded, quantitative claim, and it is the
reason §B.5's outcome is recorded as a finding rather than as a shortfall.

**What it localises.** Roughly 105 ms of the ~112 ms neutral window — the overwhelming majority — is
*rate-independent*. It is not main-thread JavaScript. The costs that behave that way on this path are
frame cadence (the outgoing-snapshot capture and the post-swap paint each need a rendering frame, at
~16.7 ms apiece regardless of CPU speed), event-loop turn boundaries, and the dev-server round trip
for the route module — all of which the CPU throttle leaves alone, because it throttles the renderer's
JS scheduler and not the compositor's clock, the network, or Vite. This is what disqualifies the
snapshot-capture cost that RESEARCH §R1.8 nominated as H1's widener: **snapshot capture is a
rendering-frame cost, and rendering-frame costs do not scale with CPU rate**, which is precisely what
the table above measures. Plan 02 eliminated H1 by showing the transition is not *necessary*; this
measurement additionally shows the transition could not have been the *amplifier* either.

**Corollary for the wild 1-in-8.** In the field the gap must occasionally exceed 2000 ms — roughly
**18× its median** — for DEF-135-04 to occur at all. Nothing in this ladder produces an 18× excursion
by loading the CPU, at any rate the instrument survives. So the amplifier in the wild is **not
main-thread CPU contention**, and the six-worker hypothesis (RESEARCH §R3.1 / Assumptions Log A2) is a
hypothesis about exactly that. § Contention tests it directly, and its result should be read against
this measurement rather than in isolation.

### B.8 The forcing configuration this task hands to plan 04

Two configurations reach determinism. **The one plan 04 must prefer is the one that weakens the oracle
LEAST**, because the shrink is the part of the adversary description a reviewer will discount.

| Configuration | Failures | Budget shrink vs. production | Degenerate runs | Verdict |
|---|---|---|---|---|
| `EPERM07_FORCE_BUDGET_MS=100` alone (plan 02) | 11/15 (73 %) | 20× | 0 | **rejected** — stochastic, not a control |
| `EPERM07_FORCE_BUDGET_MS=100 EPERM07_FORCE_CPU_RATE=20` | **10/10** | 20× | 0 | deterministic, but the deeper shrink |
| `EPERM07_FORCE_BUDGET_MS=100 EPERM07_FORCE_CPU_RATE=80` | 10/10 | 20× | **1/10** | **rejected** — the throttle breaks the Base-2 gate |
| **`EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40`** | **15/15** | **5×** | **0** | **PREFERRED** |

The preferred configuration's 15 runs are two independently launched blocks — the 5-run bisection
block at §B.7.2 and a 10-run confirmation block run afterwards — so its determinism is a rebuildability
claim, not a single lucky sequence. The confirmation block:



| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | 5bd8e1ba | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | c7e1d484 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | 2de5eaed | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 7697f52a | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | cb5803d8 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 06 | **failed** | 69c9e72b | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 07 | **failed** | df68ca9e | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 08 | **failed** | a98143b7 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 09 | **failed** | 6088fa72 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 10 | **failed** | 07150297 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Confirmation block result: 10/10 failures.**

```bash
# THE PREFERRED FORCING CONFIGURATION (plan 03, § Discriminator B).
# Prereq: exactly one dev server for THIS checkout on 5273, and a reset DB.
#   yarn db:reset
#   FRONTEND_PORT=5273 yarn dev          # separate shell; leave it running

FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
EPERM07_FORCE_CPU_RATE=40 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$PWD/eperm07-run.json" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

| Property | Value |
|---|---|
| Failure rate | **15/15 (100 %)** over two independently launched blocks |
| Deterministic (≥8/10)? | **YES** |
| Every failing run non-degenerate? | **YES** — 15/15 H2-shaped, 0 DEGENERATE, 15/15 failing on the term-trigger locator |
| Error text | `element(s) not found` on `getByTestId('voter-questions-term-trigger').first()` — see §B.9 |
| Oracle weakened? | **YES — 400 ms against a production 2000 ms budget, a 5× shrink.** This must be stated in plan 04's adversary description; it is not incidental. |
| Rebuildable? | **YES** — two blocks, same prefix, both 100 % |

**The adversary description plan 04 must carry, in full.** *"The term-trigger assertion is given 400 ms
instead of the production 2000 ms, and the browser's main thread is slowed 40× across the Base-2 →
Base-3 hop. Under that adversary the post-settle window (measured at 400–800 ms, §B.7.2) reliably
outlasts the budget. The pre-fix tree fails 15/15; the post-fix tree must pass under the byte-identical
prefix. The shrink is acknowledged: a reproduction at the production budget was attempted across 71
runs at CPU rates 2–80 and could not be obtained, for the quantified reason in §B.7.3."*

### B.9 The forced failure is the right failure — verbatim

Machine-read from `combo-b100-cpu20/run-01.json`, `results[0].error.message` (ANSI stripped):

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('voter-questions-term-trigger').first()
Expected: visible
Timeout: 100ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 100ms
  - waiting for getByTestId('voter-questions-term-trigger').first()
```

`element(s) not found` on the exact locator — the same phrase and the same locator the DEF-135-04
occurrence recorded (`deferred-items.md:181-198`), differing only in the `Timeout:` line.

**And the paradox reproduces too.** Playwright's post-failure page snapshot for a forced run, read from
`tests/playwright-results/eperm07-term-trigger-…/error-context.md` immediately after a
`b100 + cpu20` failure, contains verbatim:

```yaml
          - heading "[qu-opin-base-3-likert7] Base opinion 3 — Likert 7." [level=1] [ref=e47]:
            - text: "[qu-opin-base-3-likert7] Base opinion 3 —"
            - button "Likert" [ref=e49]:
              - generic [ref=e50]: Likert
```

The forensic probe for that same run recorded `{"headingCount":0,"headingText":null,"triggerCount":0}`.
**Same run: no heading and no trigger at assertion time, a complete Base-3 heading WITH the `Likert`
term-trigger button in the snapshot taken after the budget expired.** That is the exact paradox
`deferred-items.md` recorded against DEF-135-04 — an existence failure whose own failure snapshot shows
the element present — reproduced on demand, and it is the single strongest evidence that the forced
failure and the defect of record are the same event.

### B.10 Forensic capture, read back

Plan 01's D-11 auto-fixture attached a console transcript and a failed-request transcript to every
forced failure. Read back from `combo-b100-cpu20/run-01.json` (inline attachments, base64-decoded):

```
--- console.log (complete, all 8 lines) ---
[2026-08-13T16:08:28.244Z] debug: [vite] connecting...
[2026-08-13T16:08:28.260Z] debug: [vite] connected.
[2026-08-13T16:08:28.421Z] debug: [vite] connecting...
[2026-08-13T16:08:28.426Z] debug: [vite] connected.
[2026-08-13T16:08:28.465Z] debug: [vite] connecting...
[2026-08-13T16:08:28.470Z] debug: [vite] connected.
[2026-08-13T16:08:30.215Z] info: answerState.setAnswer(e055ab27-f682-4b9d-8e8a-e52608121944, 5)
[2026-08-13T16:08:31.423Z] info: answerState.setAnswer(bba8fc0c-8040-4846-8787-d95fac4fee1a, 4)
```

**No error, no warning, no `pageerror`, and — load-bearing for H2 — no reroute log.** The render gate's
own failure path logs
`Question with id … not found in voterCtx.selectedQuestionBlocks. Rerouting to category selection.`
(`apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:119-121`). It does not appear.
The application believed nothing was wrong during the window in which the assertion failed.

The `requestfailed.log` transcript holds only `net::ERR_ABORTED` entries for Vite dev module fetches,
all timestamped `16:08:28` — page-load-time prefetch aborts, ~3 s **before** the 16:08:31 hop. Nothing
failed at hop time. The late-arriving-fetch story D-11 was wired to catch does not appear either.

### B.11 Throttle-hygiene check

**T-138-09 is the risk: a CPU throttle that survives its run silently distorts every later test in the
same worker.** The check is adversarial by construction — abort a throttled run mid-flight, then
measure the very next unprefixed run.

**Arm A — the deliberate abort.** `EPERM07_FORCE_CPU_RATE=80`, launched in the background, `SIGINT` at
**t+10 s**, which is inside the throttled block (at rate 80 the test body runs ~9.3 s, of which the
throttled section is the last ~5.8 s). Playwright reported `1 interrupted / 1 did not run` and exited
**130**. The abort landed where it was aimed.

**Arm B — the immediate unprefixed run.** Launched with `env -u EPERM07_FORCE_CPU_RATE -u
EPERM07_FORCE_BUDGET_MS -u EPERM07_NO_VT`, no other change, immediately after arm A returned.

| | Arm A (aborted, rate 80) | Arm B (immediately after, unprefixed) |
|---|---|---|
| Wall clock | **10 s** (killed at t+10 s) | **8 s** |
| Test body duration | 9.3 s typical for rate 80 (§B.3) | **3.766 s** |
| Exit code | **130** (interrupted) | **0** (passed) |
| Tri-state | — (interrupted before the probe) | `{"headingCount":1,"headingText":"…Base opinion 2 — Likert 4.","triggerCount":0}` — **H1-shaped** |

**Verdict: no throttle survived.** Two independent signals agree, and the second is the stronger one:

1. **Duration.** Arm B's test body ran in **3.766 s**, squarely in this project's normal single-digit
   range and statistically indistinguishable from the 3.57 s neutral sanity run. A surviving rate-80
   throttle would have produced ~9.3 s.
2. **Tri-state shape.** Arm B came back **H1-shaped**. §B.3 establishes that at any rate ≥ 12 the probe
   is H2-shaped in 40/40 runs, and at rate ≤ 2 it is H1-shaped in 11/11. The shape is therefore a
   *categorical* throttle detector, independent of timing noise — and it reads "unthrottled". A leaked
   rate-80 throttle could not produce an H1-shaped probe.

The `finally`-scoped `releaseCpuThrottle` (reset to rate 1, then `detach`) in
`tests/tests/specs/voter/eperm07-term-trigger.spec.ts` holds, and the browser context teardown on abort
backstops it. T-138-09 is mitigated on evidence rather than on inspection.

### B.12 A discarded block, recorded rather than hidden

One 20-run block was launched and is **not** counted anywhere above. A loop written as
`set -- $CFG` to split `"40 400"` into two arguments did not word-split — the session shell is `zsh`,
which does not word-split unquoted parameter expansions the way `bash` does — so the whole string
reached the knob as `EPERM07_FORCE_CPU_RATE="40 400"`. `Number("40 400")` is `NaN`, `NaN <= 1` is
`false`, and the spec therefore issued `Emulation.setCPUThrottlingRate` with `rate: NaN`, which the
browser rejected. All 20 runs died with `cdpSession.send: Protocol error` before reaching the hop.

It is recorded for two reasons. First, **the runs are not measurements of anything** and silently
dropping 20 runs from a hunt log is the kind of omission this document's evidence rule exists to
prevent. Second, **the failure was caught by the classifier, not by eye**: every one of the 20 carried
`failedOnTermTrigger: false`, which is the same column that later rejected rate 80 (§B.6.2). A
per-run "which assertion actually failed" field is cheap and it caught two distinct classes of false
reproduction in one session.

### B.13 Neutrality and the return to the unforced state

Verified immediately after the last forced run of this task:

```
$ env -u EPERM07_FORCE_CPU_RATE -u EPERM07_FORCE_BUDGET_MS -u EPERM07_NO_VT FRONTEND_PORT=5273 \
    npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line
  3 passed (6.9s)
EXIT=0

$ git status --porcelain tests/
(no output)

$ git status --porcelain apps/
(no output)
```

Every experiment in §B was an environment prefix plus `--reporter=json`. No committed file was edited,
no `TIMEOUTS` value moved, no quarantine, `skip`, `fixme` or `.only` annotation was added to any spec,
and isolation was achieved entirely by `--project=eperm07-term-trigger`. All 191 run artifacts from
this task landed in a session-local scratch directory outside the repository; only the derived tables
above reach `.planning/`. `FRONTEND_PORT=5273` is a port selector, not a forcing knob — with the three
`EPERM07_*` variables unset the spec runs at the production 2000 ms budget with no throttle and no
media emulation, which is exactly what the run above demonstrates.

---

## Contention — isolated vs. under worker pressure

D-04 named this as the known risk of the isolated instrument, and RESEARCH §R3.1 instructed that
"the hunt spec alone" and "the hunt spec under worker pressure" be treated as **two different
experiments**. They are recorded as two here. §B.7.3 sharpened the question: CPU amplification cannot
widen the window enough at any usable rate, so if anything in the real environment widens it, worker
contention is the remaining named candidate (RESEARCH Assumptions Log A2).

### C.1 Precondition and construction

`yarn db:reset` was run immediately before this section's first run, so no run below competes with
residue from the § Discriminator B sweep. The dev server is unchanged — still PID 92504 on 5273.

**Construction chosen: (a), a five-worker Chromium load generator.** Stated with its reason, and with
the reason (b) was not made the primary instrument:

- **Why (a).** This section's whole claim is a *rate comparison*, and a rate needs samples. Construction
  (a) yields 10 comparable samples per arm in about three minutes. Construction (b) — the full gate
  suite with the forcing prefix — yields exactly **one** hunt-spec sample per ~11-minute run, so the
  same 10 samples would cost nearly two hours, and a 1-vs-1 comparison could not distinguish a
  contention effect from a coin flip.
- **What the generator is.** Five concurrent headless Chromium contexts, each looping hard navigations
  over the voter app's public read-only routes (`/en`, `/en/elections`, `/en/info`), driven by a
  standalone script in the session scratch directory. It performs **no database writes and depends on
  no seeded data**, which is the one thing a second `playwright test` invocation could not offer: a
  second invocation carries its own `data-setup-base` / `data-teardown-base` and would race the hunt
  run's own dataset import, contaminating the very runs it was meant to pressure.
- **The load is evidenced, not assumed.** Every pressured block records its navigation count from the
  generator's own counter, and the generator was validated before use — `page.goto` against each route
  returns HTTP **200** with a ~197 KB SSR document (29-114 ms warm), so the navigations are real full
  page loads through Vite's dev server, not fast failures. Steady-state throughput is ~60 navigations
  per second across the five workers.
- **(b) is still run, once, as the real-environment sample** — see §C.6 — because construction (a) is
  a *model* of the suite's contention and the suite itself is the thing being modelled.

**Both arms are otherwise byte-identical:** same dev-server process, same port, same Playwright
project and config, `config.workers` = 6 and 0 retries read back from `results.json` on every run,
the `e2e/base` dataset re-imported by `data-setup-base` before each run, and the arms run back to
back. The only difference is whether the load generator is running.

### C.2 Arm comparison at the PRODUCTION budget (no knobs at all)

The strongest question first: does real worker pressure reproduce the failure with the oracle
**unweakened**? That would be the strong form of criterion 1, obtained by contention rather than by
amplification.


**Arm ISOLATED** — production 2000 ms budget, no throttle, no load generator — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 72ee4359 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | 1dbd7a97 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | a3434342 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | cca5fb6c | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | ff240078 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 06 | passed | 44be4121 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 07 | passed | ab8f3862 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 08 | passed | f7de3c68 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 09 | passed | 5279bc87 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 10 | passed | f6f0d9db | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Result: 0/10 failures.**

**Arm PRESSURED** — identical configuration, five-worker load generator running (9 687 navigations delivered over 153 s) — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | c5ed06ae | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | 6aba18ff | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | fb1f322c | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | 29f4981e | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | 77d8fc21 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 06 | passed | b6836c0f | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 07 | passed | 82d908fa | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 08 | passed | b07d6622 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 09 | passed | 6dec3472 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 10 | passed | b8aeb2e4 | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Result: 0/10 failures.**
| Metric | Arm ISOLATED | Arm PRESSURED |
|---|---|---|
| Runs | 10 | 10 |
| **Failures** | **0 / 10** | **0 / 10** |
| Median test-body duration | **3.51 s** | **4.62 s** (**1.32× slower** — the pressure is real and measurable) |
| Median wall clock per run | 7.5 s | 13.5 s |
| Workers / retries (read from `results.json`) | 6 / 0 | 6 / 0 |
| Tri-states | 10/10 H1-shaped | 9 H1-shaped, 1 H2-shaped |

**At the production budget the two arms are indistinguishable: 0 failures each.** The pressure is not
imaginary — it slows the test body by 1.32× and nearly doubles wall clock — it simply does not carry
the post-settle window past 2000 ms. Taken with §B's 71 amplification runs, that is **96 runs at the
production element budget with zero failures**, across every lever this phase has.

### C.3 Arm comparison at a MARGINAL operating point — where the effect is visible

A saturated configuration cannot show a contention effect: at `budget 400 + rate 40` the isolated arm
already fails 15/15 (§B.8), so a pressured arm could only match it. A comparison needs an operating
point with headroom in both directions. `EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=400` is
exactly that — §B.7.1 measured the rate-20 window at 200-400 ms, so a 400 ms budget sits **on the
edge of the band**, which is the most sensitive place on the whole curve.


**Arm ISOLATED** — `EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=400`, no load generator — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | 2ac95651 | 0 | `null` | 0 | H2-shaped | — |
| 02 | passed | f11c03be | 0 | `null` | 0 | H2-shaped | — |
| 03 | **failed** | ff53c085 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | passed | d36dd69c | 0 | `null` | 0 | H2-shaped | — |
| 05 | passed | f83010c5 | 0 | `null` | 0 | H2-shaped | — |
| 06 | passed | 97b0eed2 | 0 | `null` | 0 | H2-shaped | — |
| 07 | passed | b7894dee | 0 | `null` | 0 | H2-shaped | — |
| 08 | passed | 2b1a4366 | 0 | `null` | 0 | H2-shaped | — |
| 09 | passed | 08ecea9e | 0 | `null` | 0 | H2-shaped | — |
| 10 | passed | 13bef34e | 0 | `null` | 0 | H2-shaped | — |

**Result: 1/10 failures.**

**Arm PRESSURED** — the SAME prefix, five-worker load generator running (10 190 navigations over 165 s) — 10 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | **failed** | 82c8b0af | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 02 | **failed** | fd6bedda | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 03 | **failed** | 608be62b | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 04 | **failed** | 62b8a7ac | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 05 | **failed** | 546024cf | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 06 | **failed** | b8f68247 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 07 | **failed** | 99a0304a | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 08 | **failed** | 4fc30d56 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 09 | **failed** | 54d4b155 | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |
| 10 | **failed** | 460a0c2e | 0 | `null` | 0 | H2-shaped | term-trigger (the assertion under study) |

**Result: 10/10 failures.**
| Metric | Arm ISOLATED | Arm PRESSURED |
|---|---|---|
| Runs | 10 | 10 |
| **Failures** | **1 / 10 (10 %)** | **10 / 10 (100 %)** |
| Every failure on the term-trigger locator? | yes (1/1) | yes (10/10) |
| Degenerate failures | 0 | 0 |
| Median test-body duration | 4.62 s | 6.60 s (1.43× slower) |
| Tri-states | 10/10 H2-shaped | 10/10 H2-shaped |

**1/10 against 10/10 on a byte-identical prefix.** Fisher's exact test on that 2×2 gives
**p ≈ 0.0001**; this is not a sampling artefact. Worker pressure takes an operating point that
almost never fails and makes it fail every time.

### C.4 How much does contention widen the window? — the same bisection, run under load

The rate comparison says contention matters. The bisection says by how much, and the answer bounds
what contention can and cannot explain. Budget bisection at **no CPU throttle**, under the load
generator:


**PRESSURED, no throttle, `EPERM07_FORCE_BUDGET_MS=200`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | bada1c52 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | 5585b3fc | 1 | Base-3 | 1 | DEGENERATE | — |
| 03 | passed | 8bef309f | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | cd7c23e5 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | 5a2debb3 | 0 | `null` | 0 | H2-shaped | — |

**Budget 200 ms result: 0/5 failures.**

**PRESSURED, no throttle, `EPERM07_FORCE_BUDGET_MS=400`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | ea62362c | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | 598b321e | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | e2289eaa | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | 48fa02d8 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 05 | passed | fb4e347f | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Budget 400 ms result: 0/5 failures.**

**PRESSURED, no throttle, `EPERM07_FORCE_BUDGET_MS=800`** — 5 runs

| Run | Outcome | question id (URL) | headingCount | headingText | triggerCount | classification | assertion that failed |
|---|---|---|---|---|---|---|---|
| 01 | passed | e71d411e | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 02 | passed | ad0b181c | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 03 | passed | c6f6f5e2 | 1 | Base-2 (stale) | 0 | H1-shaped | — |
| 04 | passed | 4eff0da6 | 1 | Base-3 | 1 | DEGENERATE | — |
| 05 | passed | 03c39ac7 | 1 | Base-2 (stale) | 0 | H1-shaped | — |

**Budget 800 ms result: 0/5 failures.**

| Condition | Post-settle window | Amplification vs. isolated + unthrottled |
|---|---|---|
| isolated, no throttle | **100 – 125 ms** (§ 3.3) | 1× |
| **pressured, no throttle** | **< 200 ms** (0/5 fail at a 200 ms budget) | **< 1.8×** |
| isolated, CPU rate 20 | 200 – 400 ms (§B.7.1) | ~2.7× |
| **pressured, CPU rate 20** | **> 400 ms** (10/10 fail at a 400 ms budget) | **> 3.6×** |

**Contention is a real amplifier and a modest one — under 2× on its own.** It reaches 100 % failure at
the marginal point not because it is powerful but because that point sits on the edge of the band,
where a sub-2× stretch is the difference between always passing and always failing. Extrapolated
honestly, five extra Chromium workers move the window from ~112 ms to under ~200 ms; the production
budget is 2000 ms. **Contention as measured here is roughly an order of magnitude short of explaining
the wild failure**, exactly as CPU amplification was (§B.7.3).

**Two probes in this block landed past the window, and both matter.** `preswidth-b200` run 02 and
`preswidth-b800` run 04 recorded a heading reading **`Base opinion 3` with `triggerCount: 1`** — the
first observations in the entire phase where the probe sampled after the swap completed. They are
classified `DEGENERATE` (element present, oracle did not need to wait) and are correctly excluded from
every failure count. Their diagnostic value is in § C.5's H3 statement, not in the rate comparison.

### C.5 What the whole session's probes say, aggregated

Every `eperm07-state` annotation recorded across every block of this plan, machine-read in one pass
(217 runs launched; 192 reached the probe — the other 25 are §B.12's discarded block, §B.6.2's
run 06 and §B.7.2's four rate-80 instrument breakages, none of which reached the hop):

| Observed tri-state | Count (this plan) | Count (plan 02, § 3 + § A) |
|---|---|---|
| **H1-shaped** — heading present, reads `Base opinion 2`, `triggerCount: 0` | 63 | 60 |
| **H2-shaped** — `headingCount: 0`, `headingText: null`, `triggerCount: 0` | 127 | 10 |
| **H3-shaped** — heading reads `Base opinion 3`, `triggerCount: 0` | **0** | **0** |
| Heading reads `Base opinion 3` **with** `triggerCount ≥ 1` (probe landed after the window) | 2 | 0 |
| Unclassified | 0 | 0 |

**The load-bearing row is the third: zero H3-shaped observations in 262 probes across two plans.** And
the fourth row is its complement — on **both** occasions a probe ever saw the Base-3 heading text, the
term trigger was there with it. The heading text and the trigger have never once been observed apart.
`138-DIAGNOSIS.md` § Named root cause reads this together with the structural argument from the source.

### C.6 The real-environment sample — construction (b), run once

Construction (a) models the suite's contention; this is the suite. One **unprefixed** full gate-suite
run at the production budget, six workers, the hunt spec now shipping in the default suite (plan 01).

**This run is NOT a forced-configuration run.** No `EPERM07_*` variable was set — the invocation is
`env -u EPERM07_FORCE_CPU_RATE -u EPERM07_FORCE_BUDGET_MS -u EPERM07_NO_VT` plus the standard
`--grep-invert @probe`. It is therefore an ordinary gate observation and is reported as such: the
cardinal rule applies to it in full, and it is **not** excluded from anything. (Had the forcing prefix
been applied, this paragraph would have had to say the opposite — that it was a deliberate, scoped,
recorded negative control excluded from every determinism count. It was not needed, because the
question this section asks is best answered at the production budget.)

| Property | Value (machine-read from the run's `results.json`) |
|---|---|
| Invocation | `npx playwright test -c tests/playwright.config.ts --grep-invert @probe --reporter=json`, `FRONTEND_PORT=5273` |
| Result | **135 passed / 0 failed / 0 skipped** across **89 files** |
| `stats` | `expected: 135`, `unexpected: 0`, `flaky: 0` |
| Duration | **622 s** |
| `config.workers` / retries | **6** / **0** |
| Preflight | passed (a preflight abort exits 1 before any spec body runs) |
| **The hunt spec** | **passed**, body duration **4 646 ms**, 0 retries |
| **The hunt spec's probe** | `{"headingCount":1,"headingText":"…Base opinion 2 — Likert 4.","triggerCount":0}` — **H1-shaped** |

Three things come out of this single run, and the third was not anticipated.

1. **The gate is green.** 135/135 with zero failures, zero flakes and zero retries, after plan 02's
   soft→hard promotion at `voter-journey.spec.ts:858` and after everything this session did to the
   machine. The project's cardinal rule is satisfied by this run.
2. **The window is present in the real environment too.** The hunt spec's probe inside the real
   six-worker suite is H1-shaped: at the instant the production URL-only settle released, the URL had
   advanced to Base-3 while the rendered heading still read `Base opinion 2` and `triggerCount` was 0.
   The window is not an artefact of running the spec alone — it is there, in the gate, on a green run.
3. **Construction (a) modelled construction (b) almost exactly.** The hunt spec's body took
   **4 646 ms** inside the real suite against **3 510 ms** isolated — a **1.32×** stretch. The load
   generator produced **4 620 ms** against the same 3 510 ms baseline — **1.32×**, the same figure to
   two significant digits. The five-worker model is not a loose analogy for the suite's pressure; on
   the one metric that can be compared it is quantitatively equivalent, which is what licenses reading
   §C.3's 1/10-vs-10/10 as a statement about the real suite and not only about the model.

### C.7 Verdict — **Contention-dependent**

Recorded against the plan's three named verdicts, and the qualification is part of the verdict rather
than an escape from it.

**`Contention-dependent`.** At the marginal operating point the failures are overwhelmingly in the
pressured arm — **1/10 isolated against 10/10 pressured** on a byte-identical prefix, p ≈ 0.0001
(§C.3). Worker pressure is therefore part of the mechanism's environment: it is a real amplifier of
the post-settle window, it is present in the environment the 1-in-8 was observed in, and it must be
named in the root-cause statement rather than treated as background.

**With the amplification bounded, because the bound is the honest half of the finding.** Contention
widens the window by **less than 2×** on its own (§C.4: under 200 ms pressured against 100-125 ms
isolated), and at the production budget the two arms are **0/10 and 0/10** (§C.2). Contention is
decisive at the margin and roughly an order of magnitude short of the production budget. Anyone reading
"contention-dependent" as "six workers explain DEF-135-04" would be over-reading this section; §C.4's
table is there to prevent that.

**What this eliminates.** RESEARCH Assumptions Log A2 assumed `workers: 6` contention was *the*
amplifier that makes the failure ~1-in-8. Measured, it is *an* amplifier worth <2×, and the failure
needs ~18×. A2 is not confirmed; it is bounded and found insufficient, which — with §B.7.3's identical
verdict on CPU cost — leaves the wild amplifier **unidentified**. `138-DIAGNOSIS.md` § Named root
cause carries that gap explicitly rather than papering it over: the mechanism is established, the
excursion that makes the mechanism bite in the field is not.

### C.8 Instruction to plan 04 — which construction the criterion-2 pair must use

**Plan 04 must run BOTH halves of the criterion-2 negative-control pair with the ISOLATED construction
— the hunt project alone, no load generator, no full-suite wrapper — at the byte-identical prefix
`FRONTEND_PORT=5273 EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40`, which is deterministic
without worker pressure (15/15, §B.8), so adding pressure would add a variable the pair does not need
and cannot control; what plan 04 must NOT do is drift to a marginal configuration, because §C.3 shows a
marginal point swinging from 1/10 to 10/10 on load alone, and a pair built on such a point would
measure the load rather than the fix.**

### C.9 Discarded block — the first pressured arm ran with no pressure

A 10-run `pres-prod` block was launched and is **not** counted above. The load generator resolved
`require('@playwright/test')` against its own directory in the session scratch tree rather than
against the repository, died instantly with `MODULE_NOT_FOUND`, and the ten "pressured" runs therefore
ran with no load at all. It was caught before it reached this document by the same duration signal that
later validated the real generator: the block's median body duration was 3.52 s, indistinguishable
from the isolated arm's 3.51 s, where genuine pressure produces 4.62 s. The block was discarded, the
require path was made absolute, the generator was validated against live HTTP responses (§C.1), and
the arm was re-run in full as `pres-prod-v2`.

It is recorded because "the load generator silently did nothing" is the single most likely way a
contention experiment produces a confident false negative, and a reader is entitled to know it was
checked for rather than assumed away.

### C.10 Neutrality and the return to the unforced state

```
$ git status --porcelain tests/
(no output)

$ git status --porcelain apps/
(no output)
```

The load generator lives entirely in the session scratch directory and was never added to the
repository; it is not a Playwright project, not a spec, and nothing in `tests/` references it. No
committed file was modified for any arm above, no quarantine/skip/`.only` annotation was added, and
the §C.6 full-suite run is the unprefixed, unmodified gate suite. Every arm's artifacts landed outside
the repository; only the derived tables above reach `.planning/`.
