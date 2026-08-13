# Phase 138 — Negative Control: the DEF-135-04 navigation-settle fix

**Two halves, one adversary, one machine, one session.** The pre-fix tree is run under a frozen
forcing configuration and fails; the post-fix tree is run under the byte-identical configuration and
passes. Neither half is an observation that the failure "stopped happening" — the failing half is on
the record first, taken against a provably unfixed tree.

- **Date:** 2026-08-13
- **Plan:** `138-04-PLAN.md` (wave 4)
- **Decisions discharged:** D-01 (the forcing knobs), D-16 (the standing v2.15 negative-control rule), D-06 (the operator's fix-tier authorisation, recorded in § 7)
- **Requirements:** INTEG-01, INTEG-02
- **Precedent followed:** `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`, which itself named `136-VISUAL-DISCRIMINATION-EVIDENCE.md` as its precedent. This document continues that chain.

---

## 1. Why this run existed

The v2.15 milestone carries a **standing acceptance rule** (D-16): prove the guard fails before
claiming it guards. ROADMAP Phase 138 restates it as success criterion 2:

> 2. Negative control pair recorded: with the forcing harness applied, the pre-fix code FAILS and the
>    post-fix code PASSES. A fix accepted on "it stopped happening" does not satisfy this criterion.

Criterion 2 is the only Phase 138 criterion whose proof is an **observation of a failure**, and an
observation does not survive the session that produced it. That is what this document is for.

The rule has teeth here specifically because DEF-135-04 is an intermittent — a ~1-in-8 event in the
field. An intermittent is the exact defect class where "it stopped happening" is worthless evidence:
seven green runs is the *expected* observation from an unfixed tree. The only way to distinguish a fix
from luck is to make the failure deterministic first, then show the same determinism producing the
opposite outcome across the fix. That is the pair below.

---

## 2. Environment

Every value below was captured in the same session as both halves. A future re-run that behaves
differently should be diagnosed against this stamp before it is called a regression.

```
date:               2026-08-13T17:47:16Z (UTC)  /  2026-08-13 20:47 EEST
repo root:          /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:           360927495  branch feat-gsd-roadmap        (pre-fix half; post-fix HEAD in § 5.1)
git status:          M .vscode/settings.json
                     M supabase/.temp/cli-latest
                    (nothing under apps/, tests/ or packages/ — see § 4.1)
OS:                 macOS 26.5.1 arm64
kernel:             Darwin 25.5.0
Node:               v24.14.1
Vite (root hoist):  7.3.0
Vite (frontend):    vite/6.4.1 darwin-arm64 node-v24.14.1
SvelteKit:          2.55.0
Playwright:         1.58.2
Supabase local:     project_id = "openvaa-local"  (apps/supabase/supabase/config.toml)
                    http://127.0.0.1:54321/rest/v1/ -> 200
```

> **The two modified files are inert to this control.** `.vscode/settings.json` is editor
> configuration and `supabase/.temp/cli-latest` is a CLI version-check cache written by the Supabase
> tooling. Neither is imported by the app or the harness. The load-bearing claim is the *scoped*
> porcelain in § 4.1, which is empty over `apps/`, `tests/` and `packages/`.

### Port allocation

| Port | Held by | Role in this control |
|---|---|---|
| **5273** | this checkout's dev server (Vite 6.4.1, PID 92504) | the server under test — both halves ran against it |
| 5173 | Docker Desktop wildcard bind (`TCP *:5173`) | **unusable on this machine**, which is why `FRONTEND_PORT=5273` is part of the invocation |
| 54321 | `supabase_kong_openvaa-local` (Docker) | this repo's local Supabase, healthy (`/rest/v1/` -> 200) |
| 54323 | Supabase Studio (Docker) | not used by the runs; recorded for completeness |

> **Note on `.env`.** The repository `.env` carries `FRONTEND_PORT=5173`. The invocation's inline
> `FRONTEND_PORT=5273` **overrides it** — the one-off prefix form documented in `CLAUDE.md` § E2E
> preflight. This is recorded because a reader who checks `.env` alone would otherwise conclude the
> runs used 5173, which Docker Desktop holds and which no run in this document touched.

### `lsof` for every port involved, at the time of the runs

```
--- lsof -nP -iTCP:5273 -sTCP:LISTEN  (this checkout's dev server) ---
COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    92504 kallejarvenpaa   65u  IPv6 0xc6612e91f7828291      0t0  TCP [::1]:5273 (LISTEN)

--- lsof -nP -iTCP:54321 -sTCP:LISTEN  (Supabase API / Kong) ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  149u  IPv6 0x4688f936ac47f7a2      0t0  TCP *:54321 (LISTEN)

--- lsof -nP -iTCP:54323 -sTCP:LISTEN  (Supabase Studio) ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  270u  IPv6 0xe3b91b8e58950c55      0t0  TCP *:54323 (LISTEN)

--- lsof -nP -iTCP:5173 -sTCP:LISTEN  (held by Docker Desktop; NOT used by any run here) ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)
```

Every run in both halves was gated by the Phase-137 served-application preflight (D-17), which
asserts over HTTP that the page under test came from **this** checkout's absolute filesystem path.
There is no flag and no environment variable that skips it, so its confirmation is implied by every
run below reaching a spec body at all.

---

## 3. The adversary — rebuildable on any machine

The forcing configuration is **inherited, not invented here**. It was established by
`138-FORCED-REPRO.md` § B.8 ("The forcing configuration this task hands to plan 04"), which recorded
**15/15 failures across two independently launched blocks** — the 5-run bisection block at § B.7.2 and
the 10-run confirmation block that follows it.

`138-FORCED-REPRO.md` § C.8 further instructs that **both halves of this pair must use the ISOLATED
construction** — the hunt project alone, no load generator, no full-suite wrapper — because the
configuration is already deterministic without worker pressure, so adding pressure would add a
variable the pair cannot control. § C.3 shows a *marginal* operating point swinging from 1/10 to 10/10
on machine load alone; a pair built on such a point would measure the load rather than the fix. Both
halves below were run isolated, with nothing else running on the machine.

### Prerequisites

```bash
# Exactly one dev server for THIS checkout on 5273, and a seeded DB.
#   yarn db:reset
#   FRONTEND_PORT=5273 yarn dev          # separate shell; leave it running
```

### The invocation

`$RUN_JSON` is the per-run machine-readable results path. Its filename differs per run (that is how
five consecutive runs are kept as five separate readings) and it is **not part of the adversary** —
every other character below is, and is identical in both halves.

```bash
FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
EPERM07_FORCE_CPU_RATE=40 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_JSON" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

### What the three knobs do, and the one that weakens the oracle

| Knob | Value | Effect | Neutral default |
|---|---|---|---|
| `FRONTEND_PORT` | `5273` | selects the port this checkout's dev server holds | `5173` (unusable here) |
| `EPERM07_FORCE_BUDGET_MS` | `400` | the element budget for the term assertion only, file-local (`eperm07-term-trigger.spec.ts:79`) | `TIMEOUTS.element` = **2000 ms** |
| `EPERM07_FORCE_CPU_RATE` | `40` | CDP `Emulation.setCPUThrottlingRate` applied across the hop under test (`:84`, `:171-176`) | `1` (no throttle) |

> **The oracle is weakened, and that is stated as part of the adversary rather than buried.** 400 ms
> against the production 2000 ms is a **5× shrink**. `138-FORCED-REPRO.md` § B.5 and § C.2 record that
> the failure was **not** forced at the unweakened production budget: 97 production-budget runs (91
> forced-lever across CPU rates 2–80 and under worker pressure, 5 unprefixed, 1 full-suite sample)
> produced zero failures. § B.7.3 measures why — reaching 2000 ms would need CPU rate ~130–190, and
> the throttle destroys the instrument at 80, because ~105 ms of the ~112 ms window is
> CPU-rate-independent. The strong form of criterion 1 was attempted across the whole ladder and was
> not achieved. This pair therefore demonstrates the fix against a **shrunk oracle**, which is
> exactly what criterion 2 asks for and is not a claim about production margins.

All three knobs are **neutral by construction**: with no environment variable set, the committed spec
runs at the production budget with no throttle. There is nothing to revert after a hunt, and § 5.3's
final unprefixed runs exercise that neutrality directly.

---

## 4. RUN 1 — the defect: pre-fix under the adversary

### 4.1 Provenance

```
$ git rev-parse --short HEAD
360927495

$ git status --porcelain
 M .vscode/settings.json
 M supabase/.temp/cli-latest

$ git status --porcelain tests/ apps/ packages/
(no output)
```

The scoped porcelain is what proves the tree was genuinely pre-fix at capture time: **no file under
`tests/`, `apps/` or `packages/` was modified**, so neither the production settle helper
(`voter-journey.spec.ts:186-190`) nor the hunt spec's reproduction of it (`eperm07-term-trigger.spec.ts:117-119`)
carried any part of the fix. The fix did not exist anywhere in the tree when these five runs were taken.
This half was captured **before the fix was written**, not reconstructed afterwards by stashing it —
a reconstruction is one `git stash` away from being subtly different, and criterion 2 rests on the two
halves sharing one adversary exactly.

**Block start:** 2026-08-13T17:45:52Z · **Block end:** 2026-08-13T17:46:57Z (approx., last run's exit)

### 4.2 The invocation, verbatim

```bash
FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
EPERM07_FORCE_CPU_RATE=40 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_JSON" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

### 4.3 Observed — five consecutive runs, all failing

Each run's `eperm07-state` tri-state is machine-read from that run's `results.json` (the annotation
pushed at `eperm07-term-trigger.spec.ts:243`, recorded **before** the assertion so a near-miss would be
captured as data too). `exit` is the Playwright process exit code.

| # | Started (UTC) | exit | Outcome | Body duration | `eperm07-state` tri-state | Classification |
|---|---|---|---|---|---|---|
| 1 | 17:45:52 | 1 | **FAIL** | 7605 ms | `{"pathname":"/questions/b69938df-796a-4fa2-80f7-9f118b8fa91f","headingCount":0,"headingText":null,"triggerCount":0}` | non-degenerate |
| 2 | 17:46:06 | 1 | **FAIL** | 8558 ms | `{"pathname":"/questions/a706e4fd-fde4-4141-b8a2-2dcd714c9e58","headingCount":0,"headingText":null,"triggerCount":0}` | non-degenerate |
| 3 | 17:46:20 | 1 | **FAIL** | 10451 ms | `{"pathname":"/questions/1da66972-4645-4cd1-95e0-8b0b42783e84","headingCount":0,"headingText":null,"triggerCount":0}` | non-degenerate |
| 4 | 17:46:37 | 1 | **FAIL** | 6613 ms | `{"pathname":"/questions/2a680722-534a-4709-810d-320a2fd1c4d0","headingCount":0,"headingText":null,"triggerCount":0}` | non-degenerate |
| 5 | 17:46:48 | 1 | **FAIL** | 7951 ms | `{"pathname":"/questions/dab2d9ac-47f5-4998-aec6-6fad7db4a211","headingCount":0,"headingText":null,"triggerCount":0}` | non-degenerate |

**5 / 5 failed. 0 degenerate.**

**Classification rule, applied as plans 02 and 03 applied it.** A run is DEGENERATE if it failed
somewhere other than the term-trigger assertion — i.e. if the walk never reached the hop under test,
so the run says nothing about the mechanism. Every run above (a) carries an `eperm07-state`
annotation, which is only pushed *after* the hop's settle releases, proving the walk reached Base-3's
URL; and (b) failed at `eperm07-term-trigger.spec.ts:247`, the term-trigger assertion itself. Neither
condition holds for a degenerate run, and no run above is one.

**The tri-state is the mechanism, not decoration.** `headingCount: 0` with `headingText: null` and
`triggerCount: 0`, read at a `pathname` that is already the Base-3 question id, is the ordering defect
stated as a measurement: the URL has advanced to Base-3 while **no heading element of any kind exists
in the DOM** — the swap at `client.js:1824` has not happened. The `pathname` differs per run because
each run reseeds `e2e/base` with fresh question ids; the shape does not.

A sixth run — a pre-block smoke check at 17:44, taken to confirm the adversary still reproduced before
committing to the block — also failed, with tri-state
`{"pathname":"/questions/8934d0d0-b577-4612-bcdc-9fe0de6fca1e","headingCount":0,"headingText":null,"triggerCount":0}`.
It is **not counted** in the 5/5 above (it was a smoke check, not a block run) and is recorded here
rather than dropped, so the count in this document matches the runs that were actually launched.

### 4.3.1 Verbatim failure output — run 1

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('voter-questions-term-trigger').first()
Expected: visible
Timeout: 400ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 400ms
  - waiting for getByTestId('voter-questions-term-trigger').first()


  245 |       // The assertion under investigation, at the file-local budget. Matched by
  246 |       // exact data-testid equality, never by rendered text.
> 247 |       await expect(page.getByTestId(testIds.voter.questions.termTrigger).first()).toBeVisible({
      |                                                                                   ^
  248 |         timeout: FORCED_ELEMENT_BUDGET
  249 |       });
  250 |     } finally {
    at /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/eperm07-term-trigger.spec.ts:247:83
```

Runs 2–5 produced this block character-for-character apart from nothing at all — the error text is
identical across all five; only the per-run question id in the tri-state differs.

### 4.4 The finding

Five of five runs failed with `element(s) not found` on
`getByTestId('voter-questions-term-trigger').first()` — an **existence** failure, not a visibility
failure — while the tri-state recorded at the instant the settle released showed `headingCount: 0`,
`headingText: null` and `triggerCount: 0` at a pathname that was already Base-3's.

That state is the mechanism `138-DIAGNOSIS.md` § Named root cause names, observed directly rather than
inferred. SvelteKit commits the destination URL to history at `client.js:1759-1760`, awaits the
`onNavigate` callbacks at `:1779-1785`, and only then swaps the DOM at `:1824`. The settle under test
waits on the URL alone and swallows its own timeout, so it releases at step one — inside a window in
which the destination DOM does not exist yet. The assertion that follows is therefore made against a
page that has not arrived. **Nothing is missing from the application; the observation is taken before
the application has rendered it.** The defect is not that the window opens — the window is the normal
post-settle state, measured at `triggerCount: 0` in 260 of 262 forensic probes across two plans
(`138-FORCED-REPRO.md` § 3.2, § C.5). The defect is that an assertion is made inside it.

---

## 5. RUN 2 — the catch: post-fix under the byte-identical adversary

*Pending — filled by task 3, after the operator-authorised fix is applied.*
