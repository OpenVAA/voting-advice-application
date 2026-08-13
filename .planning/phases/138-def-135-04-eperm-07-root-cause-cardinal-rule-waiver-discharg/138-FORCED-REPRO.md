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
