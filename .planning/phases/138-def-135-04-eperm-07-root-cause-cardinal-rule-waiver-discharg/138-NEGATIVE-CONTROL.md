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

### 5.1 Provenance

```
$ git rev-parse --short HEAD
e96e24a44

$ git status --porcelain
 M .vscode/settings.json
 M supabase/.temp/cli-latest

$ git status --porcelain tests/ apps/ packages/
(no output)
```

The fix is **committed**, and these runs were taken against that commit with no working-tree
modification over `tests/`, `apps/` or `packages/`. The two halves therefore differ by exactly one
thing: the commit `e96e24a44` between them.

> **An earlier post-fix block was discarded rather than reported — see § 5.6.** A second, smaller
> point of the same discipline: a first version of this block was taken while the fix was still
> uncommitted, and was re-run from scratch against the committed tree once a comment in
> `navigation.ts` changed after it. The change was comment-only and could not affect behaviour, which
> is exactly why re-running was cheap and why there is no reason to ask a reader to take that on
> trust. The block below is the re-run.

```
$ git diff --stat 42b95d575 HEAD -- tests/
 tests/tests/helpers/index.ts                       |   7 +-
 tests/tests/helpers/navigation.ts                  | 106 +++++++++++++++++++++
 .../tests/specs/voter/eperm07-term-trigger.spec.ts |  57 ++++++-----
 tests/tests/specs/voter/voter-journey.spec.ts      |  23 ++++-
 4 files changed, 165 insertions(+), 28 deletions(-)
```

**Nothing under `apps/` is in that diff.** The authorised tier was test-side (§ 7), so no application
file was touched — which is also why this pair cannot speak to the user-visible half of the defect,
stated plainly in § 6.

**Block start:** 2026-08-13T18:17:39Z · **Block end:** 2026-08-13T18:18:36Z (approx., last run's exit)

### 5.2 The invocation, verbatim

```bash
FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
EPERM07_FORCE_CPU_RATE=40 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_JSON" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

Character-identical to § 4.2. Both halves ran against the same dev-server process (PID 92504, § 2) —
the fix touches no application code, so no restart was warranted, and not restarting removes the
server itself as a difference between the halves.

### 5.3 Observed — five consecutive runs, all passing

| # | Started (UTC) | exit | Outcome | Body duration | `eperm07-state` tri-state |
|---|---|---|---|---|---|
| 1 | 18:17:39 | 0 | **PASS** | 7499 ms | `{"pathname":"/questions/8262ebfa-6468-46c2-a011-cce36c64a880","headingCount":1,"headingText":"MunicipalRegional [qg-opin-base] Base Opinion Questions 3/8 [qu-opin-base-3-likert7] Base opinion 3 — Likert 7.","triggerCount":1}` |
| 2 | 18:17:52 | 0 | **PASS** | 6347 ms | `{"pathname":"/questions/d592bb89-b886-4829-8c51-df0114d02942","headingCount":1,"headingText":"RegionalMunicipal [qg-opin-base] Base Opinion Questions 3/8 [qu-opin-base-3-likert7] Base opinion 3 — Likert 7.","triggerCount":1}` |
| 3 | 18:18:04 | 0 | **PASS** | 6073 ms | `{"pathname":"/questions/b84c1ec1-6bde-41a0-ab8b-8dfedf38b735","headingCount":1,"headingText":"MunicipalRegional [qg-opin-base] Base Opinion Questions 3/8 [qu-opin-base-3-likert7] Base opinion 3 — Likert 7.","triggerCount":1}` |
| 4 | 18:18:15 | 0 | **PASS** | 6237 ms | `{"pathname":"/questions/000a476f-1398-49be-9f18-8c6d051bd654","headingCount":1,"headingText":"RegionalMunicipal [qg-opin-base] Base Opinion Questions 3/8 [qu-opin-base-3-likert7] Base opinion 3 — Likert 7.","triggerCount":1}` |
| 5 | 18:18:26 | 0 | **PASS** | 10234 ms | `{"pathname":"/questions/fb6d012f-82e3-4990-9773-adaca921c7c5","headingCount":1,"headingText":"RegionalMunicipal [qg-opin-base] Base Opinion Questions 3/8 [qu-opin-base-3-likert7] Base opinion 3 — Likert 7.","triggerCount":1}` |

**5 / 5 passed.**

**The tri-state is the evidence, not the exit code.** In RUN 1 every probe read
`headingCount: 0, headingText: null, triggerCount: 0` — the settle released into a page that had not
arrived. Here every probe reads `headingCount: 1`, `headingText` containing
**`Base opinion 3 — Likert 7`**, and `triggerCount: 1`. The probe runs at the same place in the spec in
both halves — immediately after the settle, *before* the assertion. So the pair does not merely show
"the test went green": it shows that at the moment the settle releases, the destination question and
its term trigger are **now already in the DOM**, which is the state the pre-fix settle failed to
guarantee. The oracle did not become more patient; the observation moved to the other side of the swap.

### 5.4 The two halves side by side

| Half | git HEAD | Adversary | Runs | Failures | Tri-state at settle release |
|---|---|---|---|---|---|
| RUN 1 — pre-fix | `360927495` | `FRONTEND_PORT=5273 EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40` | 5 | **5** | `headingCount: 0`, `headingText: null`, `triggerCount: 0` (5/5) |
| RUN 2 — post-fix | `e96e24a44` | `FRONTEND_PORT=5273 EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40` | 5 | **0** | `headingCount: 1`, Base-3 heading text, `triggerCount: 1` (5/5) |

One adversary, character-identical in both rows. Two HEADs. Ten runs, and the outcome inverts
completely across the commit between them.

### 5.5 The finding

Under one frozen, rebuildable forcing configuration the pre-fix tree failed **5 of 5** and the post-fix
tree passed **5 of 5**, with the failing half captured first against a tree provably free of the fix.
Criterion 2 is satisfied in its strict form: this is not "the failure stopped happening" — the failure
was made deterministic first (15/15 in `138-FORCED-REPRO.md` § B.8, 5/5 again here) and then inverted
by a single commit.

What the fix changed is the settle, and only the settle. `expectUrlChange` and the instrument's copy of
it now both call one shared `settleAfterClientNavigation`, which (1) no longer swallows its own
`waitForURL` timeout, so a navigation that never happens fails as a navigation problem, and (2) waits
for the page's navigation landmark to carry text different from the one it left — a fact that cannot be
true until SvelteKit has run `root.$set(...)` at `client.js:1824`. That is precisely the link the
diagnosis names as broken: the settle used to release at `client.js:1759-1760`, the URL commit, two
steps too early.

### 5.6 Discarded block — an intermediate implementation, recorded rather than hidden

A 5-run post-fix block was taken at 17:59-18:01 UTC and is **not** counted above. It scored 1/5 and is
discarded because it ran against an **intermediate** version of the settle, not the one that was
committed. Two implementation attempts preceded the final one, and both failures were in the
*observation method* rather than in the app:

1. **Settling on focus.** The first attempt waited for `document.activeElement` to equal the app's
   afterNavigate focus target — the stronger fact, since SvelteKit runs `afterNavigate` only after the
   swap. Measured: it does not become true until the **View Transition finishes**, because the app's
   `onNavigate` resolves inside `startViewTransition` (`+layout.svelte:161-170`). That makes it a
   measurement of the animation, and it exceeded the budget outright at CPU rate 40.
2. **rAF-starved polling.** The second attempt used the text comparison that shipped, but with
   `waitForFunction`'s default `polling: 'raf'`. rAF callbacks are tied to the rendering loop, so the
   predicate was starved at exactly the moment it needed to observe — while the browser was busy
   committing the swap. It timed out in 4 of 5 runs on a path where the term assertion at the
   production budget passes at every CPU rate tested (`138-FORCED-REPRO.md` § B.5). Fixed-interval
   polling at 50 ms resolved it.

Neither block is evidence about the defect, and neither is quoted as such. They are recorded because
"the instrument was not measuring what it was aimed at" is the single most likely way this kind of
experiment produces a confident wrong answer — the same reason `138-FORCED-REPRO.md` § B.12 and § C.9
recorded a `rate: NaN` block and a dead load generator instead of quietly dropping them. A reader is
entitled to know that the passing block above is the third attempt and why the first two failed.

---

## 6. What this pair does and does not prove

**The authorised tier was test-side (D-06, § 7), and the honest reading of this pair follows from
that.** It proves that the E2E harness no longer reports a false negative: under a forcing
configuration that made the walk fail deterministically, the walk now observes the destination
question *after* the DOM has committed rather than before, and the probe taken at the settle boundary
shows the term trigger present in every run rather than absent in every run. The suite's report of the
Base-2 → Base-3 hop is now a witness to the application's behaviour instead of a race against it.

**It does not prove that no user-visible defect exists, and no run in this document could.** That is
established by the operator's recorded finding in § 7, on the phase's measured evidence, not by these
ten runs. Concretely, the pair is silent on two things:

- **The ~112 ms baseline window is untouched and was not meant to be touched.** It still exists after
  the fix; the settle now waits it out instead of asserting inside it. Per § 7 that window is not a
  defect — it is what a cross-fade view transition is, and it sits below the threshold at which a UI
  is perceived as anything but instantaneous.
- **The ~4 s field excursion is neither reproduced nor fixed here.** `138-DIAGNOSIS.md` § "The one
  thing this does not explain" records that the mechanism is established while the **amplifier is
  not**: the recorded DEF-135-04 occurrence needed roughly 36× the median window, and this phase
  reached at most ~5.4× by CPU amplification and <2× by worker contention. A four-second interval in
  which the address bar says Base-3 and the page still shows Base-2 **is** user-visible, and no
  test-side change can address it. It is carried forward as a separate open item (§ 7), not as
  something this pair closed.

**A note on the shrunk oracle.** Both halves ran at a 400 ms element budget against the production
2000 ms — a 5× shrink, stated in § 3 as part of the adversary. The pair therefore demonstrates the fix
against a deliberately weakened oracle. It is not, and is not offered as, a measurement of production
margin; § 3 records that 97 production-budget runs across the whole CPU ladder produced zero failures,
which is why the weakening was necessary to have a failing half at all.

---

## 7. The operator's decision (D-06)

D-05 pre-authorises an **app-side** fix. D-06 explicitly does **not** pre-authorise a test-side one:
where the mechanism is a harness artefact, the executor must stop and put the evidence in front of the
operator rather than apply a remedy unilaterally, so that an app-only preference cannot silently
expand into "the test was wrong". Plan 04 therefore led with a blocking decision checkpoint, and the
executor did not select the tier.

The evidence presented was: the named mechanism with its `file:line` chain; the forcing configuration
and its 15/15 and 5/5 run counts; the eliminations (H1 by a 10-vs-10 A/B, H3 by U-2's closure, H4 by
the error being an existence rather than a visibility failure); and the two different answers to "could
a real user observe this?".

**Selected tier: test-side.** The operator's recorded finding, quoted so the record carries the
reasoning and not only the verdict:

> The ~112 ms baseline window is not a user-visible defect — it is what a cross-fade view transition
> is, it sits below the perceptual-instantaneity threshold, and nothing user-facing is wrong inside it;
> the user-visible half is the unlocalised ~4 s excursion, whose amplifier this phase did not identify,
> and which is therefore tracked as a separate open item rather than fixed here.

Consequent constraints, all honoured by the commit under test here: no change to `Term.svelte` or
`QuestionHeading.svelte` (H3, eliminated); no disabling or scoping of the View Transition (H1,
eliminated); no budget bump (D-07, rejected — `git diff --stat` over
`tests/tests/helpers/timeouts.ts` is empty between the two HEADs, and `element: 2_000` is still present
exactly once); and no skip, quarantine, `.only` or per-suite retry annotation anywhere in `tests/`.

### The separate open item

**The ~4 s excursion that produced the field occurrence of DEF-135-04 is NOT fixed by this phase and
is carried forward.** Its evidence is `138-DIAGNOSIS.md` § "The one thing this does not explain" and
`138-FORCED-REPRO.md` § B.7.3 (the `gap ≈ 105 ms + 12 ms × cpu_rate` fit, which places the CPU rate
needed to reach 2000 ms at ~130-190, about twice the rate at which the throttle stops measuring the
thing it is aimed at). Candidate amplifiers, none confirmed: a dev-server module-transform stall, a
garbage-collection pause, host-level scheduling starvation, and Chrome's own ~4 s view-transition skip
ceiling.

**The instrument that would localise it already exists and did not exist before this phase.** Plan 01's
forensic capture — video retention, console transcript, failed-request transcript and the dev-server
log — plus plan 02's hard heading gate mean the next occurrence arrives as data with a timestamped
server log beside it. That is waiver condition 3 satisfied. Plan 06's waiver discharge must carry this
qualification forward verbatim: **the mechanism is established, the amplifier is not.**
