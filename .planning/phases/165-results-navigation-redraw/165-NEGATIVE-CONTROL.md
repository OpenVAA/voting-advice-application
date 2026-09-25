# Phase 165 — Negative Control: the results-navigation redraw, its scaffolding guard and the two baselines

**The phase opens with its populations measured on both sides of a branch that was deliberately never merged.** Every
figure below was derived on this tree, in this session, with the command that produced it and the git ref it was taken
against printed beside it. Nothing is copied from `165-CONTEXT.md` or `165-RESEARCH.md`; where those documents disagree
with each other or with the measurement, the disagreement is recorded rather than reconciled silently.

- **Date:** 2026-09-23
- **Plan:** `165-01-PLAN.md` (wave 1) — later appended by `165-02`, `165-04` and `165-06`
- **Decisions discharged:** D-01 (branch base), D-02 (the reproduction rig, recorded here as the decision requires), D-09 (the derivation half), D-17 (this document's form), D-21 (the spike-probe notes)
- **Requirements:** RNAV-06 (the other five are registered by `165-08` under D-22)
- **Precedent followed:** `.planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md`

---

## 1. Why this run existed

ROADMAP Phase 165's six success criteria, **verbatim**:

> 1. **No results navigation remounts the results subtree.** Root cause (spike 031): `(located)/+layout.ts` untracks its params but reads `url.pathname` / `url.search` tracked for the `next=` redirect target, so the load reruns on every path change, re-streams question + nomination data, `(located)/+layout.svelte` sets `ready = false` and `<Loading/>` replaces the subtree. A unit test drives the load with a read-recording `url` and fails on any tracked read, with a positive control proving it catches the old read.
> 2. **Scroll is preserved** on entity open, entity close and entity-tab switch (from a scrolled position, not only from the top), observed in the browser.
> 3. **No document View Transition paints above an open modal.** Overlay open/close navigations run no document VT; any VT that runs while a modal dialog is open runs with every `view-transition-name` stripped. The header is covered by the backdrop from the first frame; a drawer-tab switch never shows the results page in front of the drawer.
> 4. **Results routes follow the layout**: an `[electionTab]` level rendering that election's entity-type tabs, an `[entityTab]` level rendering the list + filters, and an `[entity]/[id]` nomination page that opens the overlay. Existing URLs keep working (or redirect), and the implied-default-tab case does not remount the list.
> 5. **One app-wide drawer host** in the root layout serves the entity-details overlay AND the extended-question-info drawer: entity → entity navigation swaps content without reopening, closing animates out, and hosted content is safe against its opener unmounting (spike 034 found a close that hung the dialog). The mechanism (payload + context bridge vs. global shell + portal) is decided at discuss-phase.
> 6. **The spike scaffolding is gone**: no `lib/spike/`, no `// SPIKE` call sites, no `/results-layered` tree; E2E voter results specs pass.

`165-01` discharges none of criteria 1–5 — it writes no production code. It exists to make criterion 6 (RNAV-06) true
**by construction** on the first commit of the work branch, and to take the two baseline measurements the phase's later
plans would otherwise have to assume: whether the cold-`/results` dev-server crash is live on this tree (§ 2c), and
whether a current emitter produces D-09's cross-type URL shape (§ 6).

The honesty pattern this document inherits from 164 § 5 applies from the first row: **a measurement that comes back
negative is recorded as a measurement, not as a proof.** § 2c's verdict in particular is an absence observed under one
specific entry on one HEAD; it is written down that way and the folded todo is left pending.

---

## 2. Environment

Every value below was captured in the same session as the measurements. A future re-run that behaves differently
should be diagnosed against this stamp before it is called a regression.

```
date:                2026-09-23T07:34:30Z (UTC)  /  2026-09-23 10:34 EEST
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike
                     (a linked worktree of /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application)
git HEAD:            8fe1b952a  branch feat/165-results-navigation-redraw
branch base:         integration/ship-12-squash @ 4d023c5875bcc616fe0c8ecca212655b452a89c0
OS:                  macOS 26.5.1 arm64
Node:                v24.14.1
Yarn:                4.13.0
TypeScript (root):   5.9.3
Svelte:              5.53.12
Playwright:          1.58.2
Supabase CLI:        2.83.0 (node_modules/supabase)
Migrations present:  00001_initial_schema.sql  (the only file in apps/supabase/supabase/migrations/ on this base)
dev-server port:     5273 — the E2E wrapper's default (tests/scripts/e2e-run.sh:45,
                     `FRONTEND_PORT="${FRONTEND_PORT:-5273}"`), used for § 2c so the observation transfers
seeded template:     none applied by this plan. § 2c ran against the stack's own
                     apps/supabase/supabase/seed.sql, applied automatically by `yarn db:start`.
                     The canonical E2E dataset later plans use is `e2e/base`, seeded by the
                     Playwright `data-setup-base` project (tests/playwright.config.ts:213).
```

The stamp commands, so the values above can be re-derived rather than trusted:

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
git rev-parse --show-toplevel
git rev-parse --short HEAD; git rev-parse --abbrev-ref HEAD
sw_vers -productName; sw_vers -productVersion; uname -m
node -v; yarn -v
node -e "console.log(require('./node_modules/typescript/package.json').version)"
node -e "console.log(require('./node_modules/svelte/package.json').version)"
node -e "console.log(require('./node_modules/@playwright/test/package.json').version)"
node -e "console.log(require('./node_modules/supabase/package.json').version)"
ls apps/supabase/supabase/migrations/
grep -n 'FRONTEND_PORT' tests/scripts/e2e-run.sh
```

### 2a. Which database state, and why it is stated

Two of this plan's three tasks need no database at all: the branch cut and the population derivation are pure git and
pure filesystem. The **third** — § 2c, the cold-`/results` measurement — boots the real SSR auth surface, and a crash
observed against an unexpected schema proves the wrong thing about a defect whose named cause is a cookie write during
SSR. The state it ran against is therefore stated here.

`yarn db:start` applies `apps/supabase/supabase/migrations/` and then `apps/supabase/supabase/seed.sql`. On this base
that migration set is a **single** squashed file, `00001_initial_schema.sql` — not the four-file set `164`'s stamp
records, because `integration/ship-12-squash` squashed them. That is a property of the base branch, not drift, and it
is written down so a later reader who sees four files does not assume this run was taken on the same tree.

No `yarn db:seed --template …` was run. § 2c does not depend on seeded content: it drives an **unauthenticated, cold**
GET at `/results` and reads an HTTP status and a process-liveness bit. What it needs from the stack is that the SSR
hooks can reach Supabase at all, which the default seed satisfies.

The Supabase CLI was **not** upgraded during this plan. Upgrading mid-phase would conflate the observation with the
thing observed — the same reasoning `164` § 2a records.

### 2b. Anchor drift measured before anything was cited

Every figure and anchor this plan handed me was re-measured before it was used. Three of them are wrong as given, and
that is recorded here rather than worked around, because later plans cite the same anchors.

| Anchor as the plan / CONTEXT / RESEARCH gives it | Measured on this tree | Handling |
|---|---|---|
| Branch topology: `165-CONTEXT.md` D-01 records `spike/results-redraw` as **18 behind / 4 ahead** of `integration/ship-12-squash`; `165-RESEARCH.md` records **21 behind / 7 ahead** | **21 behind / 12 ahead**, merge-base `e1f1944cf8fe102e6725efac8ccef5cc3ea1c1ad`. `git rev-list --left-right --count integration/ship-12-squash...spike/results-redraw` → `21	12` | Both documents are dated snapshots of a moving branch and both are stale; `spike/results-redraw` also gained eight planning commits for this phase after RESEARCH was written. The measured pair is what `165-01`'s commit message records. Neither document was edited — D-01's standing instruction is to re-derive at run time, which makes the recorded figures advisory by construction. |
| `165-01` Task 2 action: "Confirm with `grep -rn "route: 'ResultEntity'" apps/frontend/src` that this is the **only** construction site" | **Three** matching lines, of which **two** are real construction sites and one is a doc-comment usage example | Recorded as measured in § 6. The second real site (`EntityInfo.svelte:76`) is *also* a matching pair, so the verdict is unchanged — but the plan's implied count of one was wrong and a later reader grepping the same string must not think a hit was introduced. |
| `165-RESEARCH.md` § *Measured populations* (2026-09-23, HEAD `e6c31161d`): 15 / 14 / 10 importers, 30 / 14 `SPIKE` markers, 9 `labMount(` sites, 6 files under `lib/spike/`, 9 under `results-layered/` | **Exact, every one**, re-derived against `spike/results-redraw` @ `a894e8bc7` — see § 4 | Cited as given. This is the one anchor set that survived re-measurement unchanged. |
| *(added by `165-02`)* `165-02` Task 3 action and acceptance criterion: write NC-1 as **`## 4. NC-1`**, verified by `grep -qE '^## 4\. NC-1'` | § 4 is already `## 4. Finding A`, written by `165-01`, and §§ 5-6 are its Findings B and C. `165-01-SUMMARY.md` cites all three by number | NC-1 is appended as **§ 7**, and the plan's verify regex was run as `^## [0-9]+\. NC-1` instead. Renumbering `165-01`'s findings to free § 4 would have silently falsified an already-committed summary, which is the one handling the content-anchor rule forbids. Recorded as a deviation in `165-02-SUMMARY.md`. |
| *(added by `165-05`)* `165-05` Task 2 verify: `test "$(grep -c 'expect.soft' tests/tests/specs/perm/perm-interactive-info.spec.ts)" = 0` | **1**, and it was already 1 at the plan's own base commit — the single match is the spec's own rigidity-contract doc-comment, *"HARD assertions only (no expect.soft / try-catch / .catch)"* (`perm-interactive-info.spec.ts:12`), not an assertion | The criterion the clause stands for — no soft assertion in this spec — is satisfied; the instrument counts a prose statement of the rule as a violation of it, so it is unsatisfiable against the file as it already stood. Run as `grep -c 'expect\.soft('` instead (call sites, not mentions) → **0**, exit 0. The spec was **not** edited to suit the instrument: deleting the sentence that states the contract to make a grep pass is exactly the bend-the-code-to-the-count failure § 2b exists to catch. |
| *(added by `165-02`)* `165-02` Task 1 acceptance criterion: the `isVoterRoute` **line** is byte-identical to the base branch's, provable by a scoped `git diff` "showing no change to the regex line" | The same task's own action requires `isVoterRoute` to read the new `pathname` local, so its LINE necessarily changes. What is byte-identical is the regex **literal** | Proven at the level the threat actually needs (T-165-01): the literal `/^\/[a-z]{2}\/.*\|^\/(results\|questions\|nominations)\b/` extracted from both revisions hashes to `cc091647eb89f9d313489d0a655d8e47818530302a3225a7cd0c8ff1cb0be07d` on each, and the `nextKv` construction differs only by the two prescribed identifier substitutions. The criterion as literally worded is unsatisfiable by the change the same plan prescribes; recorded rather than worked around. |

### 2c. The cold-/results hazard, measured on this tree

`.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md` (priority **high**) records that
direct cold navigation to `/results` with no session has killed the Vite dev server outright:

> ```
> Error: Cannot use `cookies.set(...)` after the response has been generated
>     at event2.cookies.set (@sveltejs/kit/src/runtime/server/respond.js:551:15)
>     at eval (apps/frontend/src/lib/supabase/server.ts:12:25)
>     …
> node:internal/process/promises:394
>     triggerUncaughtException(err, true /* fromPromise */);
> ```

It is an **uncaught rejection that exits the process**, not a logged error. It was last measured **2026-08-24 at HEAD
`e74ae377e`** — a different HEAD on a different branch — and `165-CONTEXT.md` § *Known hazard* records it as
"**currently unverified on this tree** — do not assume it is either live or fixed without re-measuring". This section
re-measures it.

**Why this phase measures it at all, and why it does not fix it.** D-16, D-17 and D-18 all drive cold direct entry to
`/results` constantly, so an executor who hits this crash must be able to recognise it as the known defect rather than
as something the phase broke. The cause lives in **`apps/frontend/src/lib/supabase/server.ts`** and
**`apps/frontend/src/hooks.server.ts`** — the SSR auth surface, not navigation redraw. **Neither file is changed by
this phase.** Folding the fix in would widen Phase 165 into auth/SSR; measuring it is in scope, fixing it is not. The
acceptance proof that the measurement itself changed no product source is at the end of this section.

**Environment for this measurement:** git HEAD `179559587`, branch `feat/165-results-navigation-redraw`, dev server on
`FRONTEND_PORT=5273` (the E2E wrapper's default), Supabase local stack **already running before this plan started** —
`yarn db:start` confirmed it up and was therefore a no-op, and the stack was correspondingly **left running**, per the
plan's "stop it only if it was not already running". Database state as § 2a records it: migrations `00001_initial_schema.sql`,
content from `apps/supabase/supabase/seed.sql`, no `db:seed` template applied.

Three observations were taken, each with **no cookie jar** — `curl` was invoked without `-b`/`-c`, so no session cookie
existed on any of them. Every exit status below was read directly from the shell status of the command itself, **never
through a pipe** (§ 3 step 3).

**Observation 1 — the plan's prescribed procedure: one cold GET at `/results`, on a server whose very first request
this was.**

```
$ FRONTEND_PORT=5273 yarn workspace @openvaa/frontend dev > "$SCRATCH/devserver-cold.log" 2>&1 &
  …  VITE v6.4.1  ready in 2551 ms   ➜  Local:   http://localhost:5273/

$ curl -s -o body.html -D headers.txt -w '%{http_code}' --max-time 120 http://localhost:5273/results ; echo $?
307
0

HTTP/1.1 307 Temporary Redirect
location: http://localhost:5273/constituencies?electionId=77fc0d3f-9042-4d90-9ad0-1153bbee145e&next=%2Fresults

$ kill -0 <vite pid> ; echo $?
0
$ lsof -nP -tiTCP:5273 -sTCP:LISTEN >/dev/null 2>&1 ; echo $?
0
$ grep -c 'after the response has been generated' "$SCRATCH/devserver-cold.log" ; echo $?
0
1
```

**HTTP status 307. Process alive. Error text absent** (`grep -c` printed `0` and exited `1` — no match).

The 307 is the `(located)` route gate sending a session-less visitor to `/constituencies` with `next=%2Fresults` — the
very `next=` redirect target whose *tracked* `url` read is criterion 1's root cause. So observation 1 exercises the
cold entry but stops **before** the results page renders. That is not enough on its own, which is why two more were
taken.

**Observation 2 — the same entry, following the redirect chain as a browser would** (the todo's repro is a browser
navigation, and a browser follows the 307):

```
$ curl -sL -o follow.html -w 'final_code=%{http_code} redirects=%{num_redirects} final_url=%{url_effective}\n' \
    --max-time 180 http://localhost:5273/results ; echo $?
final_code=200 redirects=1 final_url=http://localhost:5273/constituencies?electionId=77fc0d3f-…&next=%2Fresults
0

$ kill -0 <vite pid> ; echo $?
0
$ grep -c 'after the response has been generated' "$SCRATCH/devserver-cold.log"
0
```

**Process alive, error text absent.**

**Observation 3 — a cold render of the results page itself, on a freshly restarted server.** Observations 1 and 2 never
reached the results SSR, so the absence they measured could have been an absence of the surface rather than an absence
of the defect. The dev server was killed and respawned, and a **single** cold request was issued at the parameterised
results URL, following the one canonicalising redirect to the rendered page:

```
$ kill <vite pid>; lsof -nP -tiTCP:5273 -sTCP:LISTEN   →  (port free)
$ FRONTEND_PORT=5273 yarn workspace @openvaa/frontend dev > "$SCRATCH/devserver-cold3.log" 2>&1 &
  …  VITE v6.4.1  ready in 2487 ms

$ curl -sL -o rendered.html -w 'final_code=%{http_code} redirects=%{num_redirects} final_url=%{url_effective}\n' \
    --max-time 240 'http://localhost:5273/results?electionId=77fc0d3f-9042-4d90-9ad0-1153bbee145e&constituencyId=79478cfb-beb7-4a36-8de8-91c753542270' ; echo $?
final_code=200 redirects=1 final_url=http://localhost:5273/results/77fc0d3f-9042-4d90-9ad0-1153bbee145e?electionId=77fc0d3f-…&constituencyId=79478cfb-…
0

$ kill -0 22735 ; echo $?          # the vite pid, checked 6 s after the response
0
$ lsof -nP -tiTCP:5273 -sTCP:LISTEN >/dev/null 2>&1 ; echo $?
0
$ grep -c 'after the response has been generated' "$SCRATCH/devserver-cold3.log" ; echo $?
0
1
$ wc -c rendered.html
419747
```

The 307 here is the `[[electionTab]]` canonicalisation (`/results?electionId=X` → `/results/X`), not a session gate;
the final 200 is the results route's own SSR output, 419 747 bytes of it. The served markup carries
`data-testid="loading-indicator"` and `data-testid="voter-nav-results"` and **no** `entity-card` — i.e. the SSR
response is the `(located)/+layout.svelte` `ready = false` shell, exactly the state criterion 1 is about. The results
SSR path therefore **did** execute, and the auth surface with it.

#### Verdict: **NOT REPRODUCED**

On `feat/165-results-navigation-redraw` @ `179559587`, 2026-09-23, across three cookie-less cold entries (HTTP **307**,
**200** after one redirect, and **200** after one redirect onto the rendered results route), the Vite dev server
**survived every time** (`kill -0` exit 0, port still listening) and the recorded error text
`after the response has been generated` **never appeared** in the captured server log (`grep -c` → `0`, exit 1).

**This is an absence observed under one specific cold entry on one HEAD. It is not a proof that the defect is fixed.**
The recorded mechanism is an *asynchronous* auth refresh whose `setAll` callback fires after the response has been
flushed — a race. A race that does not fire in three attempts on one machine, against a seed with no candidate
session and with an auth token that did not need refreshing, has not been shown to be impossible; it has been shown not
to have fired here. Nothing in `apps/frontend/src/lib/supabase/server.ts` or `apps/frontend/src/hooks.server.ts`
changed between the 2026-08-24 measurement and this one that would explain a fix, and this plan changed neither file.
**The todo `.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md` is therefore left
pending, at its recorded priority.**

**What a later executor should do if it does fire.** If a dev server dies mid-E2E-run with
`Error: Cannot use cookies.set(...) after the response has been generated` and a `triggerUncaughtException` stack
through `@supabase/ssr`'s `applyServerStorage`, that is **this defect, not a redraw regression**. Do not attribute it
to the phase, do not fix it inside the phase, and do not edit `lib/supabase/server.ts` or `hooks.server.ts` — record
the occurrence against the pending todo and restart the server.

**Acceptance: the measurement changed no product source.**

```
$ git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests
$ echo $?
0
```

No line printed — and the check is not vacuous, because the same three-dot range is known to be non-empty later in this
phase (`165-02` onward), so an empty result here means "measured and clean" rather than "nothing to compare".

### 2d. A pre-existing defect this phase found and did not cause

> **Added by `165-04`, discharging D-25.** It sits in § 2 rather than in a finding of its own because it is a fact about
> the *environment this phase inherited*, not a result this phase produced. It predates the branch, predates the spike,
> and would still be true today had phase 165 never been planned. It is written down because D-08's split is what
> forced somebody to look, and a defect noticed only because of a refactor is exactly the kind that vanishes into that
> refactor's diff unrecorded.

**The route.** `/results/{electionTab}/statistics`, addressed by `ROUTE.Statistics`.

**What was wrong.** The route rendered the **results page**, not the statistics page. Nothing linked to it and no test
covered it, which is why it survived undetected.

**The mechanism — two facts that are each individually fine and jointly a swallow.**

*Fact one: the statistics route shared the results leaf's layout chain.* From the compiled client manifest, read at
`165-04`'s start (pre-move, on `260a3ffe4`):

```
$ grep -n "results/\[\[electionTab\]\]" apps/frontend/.svelte-kit/generated/client/app.js
100:		"/(voters)/(located)/results/[[electionTab]]/statistics": [23,[2,3,5]],
101:		"/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]": [22,[2,3,5]]
```

Identical chains: `[2,3,5]`. And node 5 is the results election-tab layout, not something else with the same number:

```
$ cat apps/frontend/.svelte-kit/generated/client/nodes/5.js
import * as universal from "../../../../src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts";
export { universal };
export { default as component } from "../../../../src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte";
```

*Fact two: that layout renamed its `children` prop and never rendered it.* On the same commit, before this plan touched
anything:

```
$ git show 'HEAD:apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte' | grep -n "_children"
52:  // reason: child routes render via URL-driven Drawer state inside this layout, not via `{@render children()}`. Renamed to `_children` to satisfy unused-vars while preserving SvelteKit prop contract.
53:  let { children: _children }: { children: Snippet } = $props();
```

A layout that is on your chain and never renders `{@render children()}` renders itself instead of you. That is the
whole defect.

*Caveat on the first command, stated so the evidence is not over-read.* `165-RESEARCH.md` § *Pitfall 4* measured that
`svelte-kit sync` regenerates `.svelte-kit/types/**` but **not** `.svelte-kit/generated/client/app.js`. So the manifest
above is a reading of a build artefact that may lag the tree — which is precisely what makes it sound evidence *here*,
where the claim is about the state the phase inherited, and unsound evidence for the opposite question ("did SvelteKit
accept the new route file?"), which this document does not ask of it.

**It predates this phase, and nothing links to it.** Both halves derived, not assumed:

```
$ grep -rn "Statistics" apps/frontend/src tests
apps/frontend/src/lib/i18n/translations/en/statistics.json:3:  "title": "Statistics"
apps/frontend/src/lib/routes/route.ts:74:  Statistics: `${VOTER_LOCATED}/results/[[electionTab]]/statistics`,
```

One hit is a translation value and the other is the constant's own declaration. **Zero call sites**: no
`getRoute.current('Statistics')`, no `buildRoute({ route: 'Statistics' })`, no hand-written `/statistics` href, no
spec. The route is reachable only by typing it. That is why a route that served the wrong page for its whole life
produced no bug report — and it is also why the fix below carries no consumer risk.

**Disposition taken (D-25): move the directory, move the constant, one commit.**

```
$ git mv 'apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics' \
         'apps/frontend/src/routes/(voters)/(located)/results/statistics'
$ git status --porcelain
R  apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte -> apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte
```

`ROUTE.Statistics` becomes `` `${VOTER_LOCATED}/results/statistics` `` in the same commit. Off the `[[electionTab]]`
segment the page leaves the results layout chain entirely, so it renders its own content under the plain located-voter
chrome — and it does so both before and after D-08's split, which is the point of moving it rather than waiting.

**Two dispositions rejected, with D-25's reasons:**

| Rejected | D-25's reason |
|---|---|
| A `+layout@.svelte` **layout reset** on `statistics/`, breaking it out of the results chrome in place | This repo has **no precedent for a layout reset anywhere in its route tree**, so the file would arrive needing its own explanatory comment to be legible — a novel mechanism introduced for a route nothing links to. Derived, not assumed: `find 'apps/frontend/src/routes' -name '+layout@*'` returns nothing. |
| **Accept the nesting** — let the split un-swallow the page inside the results hero, ingress and election picker | Ships a heading defect. The results layout's `MainContent` emits an `<h1>`, and the statistics page's own `MainContent` emits a second one; the statistics page's `<h2>`s then sit under two competing document titles. A WCAG 2.1 AA heading-order violation on a route no a11y run watches is worse than the swallow it replaces, because it *looks* fixed. |

A third disposition — **preserve the swallow deliberately** — was rejected in `165-CONTEXT.md` on the ground that it
keeps a route that silently renders the wrong page, and is recorded here for completeness rather than as a live
alternative.

**One anchor correction, per § 2b's discipline.** `165-04`'s plan gives the route-consistency unit test as the guard
that catches a half-applied move (*"the route-consistency test is what will say so"*). Measured: it is not.
`routeConsistency.test.ts`'s filesystem walk is scoped to `(protected)` group directories, and its only mention of a
results route is `['Results', ROUTE.Results]` as a **negative control** for `isProtectedRoute` — `165-RESEARCH.md`
§ *D-08 verified against SvelteKit* records the same measurement independently. So the test passing across this move is
not evidence the move is coherent. What *is* evidence, and what this plan ran instead: `yarn workspace @openvaa/frontend check`
over the whole tree, plus a direct assertion that the new directory exists and the old path does not. Recorded rather
than worked around; the criterion was satisfied on its intent, not on its stated instrument.

### 2e. Dispositions taken on research's open questions

`165-RESEARCH.md` § *Open Questions* left five items, and § *D-09's cross-type edge* left a sixth in prose. Each was
answered somewhere in this phase, and scattering the answers across five summaries would make "was this ever decided?"
an archaeology question. They are collected here, newest first, each with the derivation that answered it rather than
the argument that motivated it.

| Open question | Derivation that answered it | Disposition | Why |
|---|---|---|---|
| **3. Does `EntityDetailsDrawer` / `QuestionExtendedInfoDrawer` get deleted or kept?** (answered here, `165-05`) | Re-derived at run time immediately before deleting, after `165-02` and `165-05` task 1 had removed the last call sites. `grep -rn 'QuestionExtendedInfoDrawer' apps/frontend/src tests --include='*.svelte' --include='*.ts'` excluding the component's own file and its type file → **2** matches, both its own barrel lines (`lib/components/questions/index.ts:17-18`). The same search for `EntityDetailsDrawer` → **3** matches: its two barrel lines (`lib/dynamic-components/entityDetails/index.ts:5-6`) and **one prose mention** in `EntityDrawerOpener.svelte:51`'s comment, which is not a caller. | **DELETE** — both components, both prop-type modules, all four barrel lines. | Research's own recommendation, and criterion 6's rot argument applied to components: a second, unreferenced drawer implementation sitting in a barrel is exactly what a future contributor reaches for, and a phase whose contract is "one app-wide host serves both overlays" cannot honestly ship two more overlay components beside it. The prose mention was re-worded rather than kept, so the post-deletion search returns zero and the deletion stays deleted. |
| **4. Is the cold-`/results` dev-server crash live on this tree?** | Measured in `165-01`, three observations on a dev server whose very first request was the cold GET — § 2c above, with every exit status read directly. | **NOT REPRODUCED** on this tree; the `.planning/todos/pending/` entry left open and **not** fixed here. | The cause is in the SSR auth surface (`lib/supabase/server.ts`, `hooks.server.ts`), which this phase does not touch. Measuring it is in scope so an executor can recognise it; fixing it would widen the phase into auth/SSR. |
| **D-09's cross-type edge — is there an emitter?** (prose, `165-RESEARCH.md` § *D-09's cross-type edge*) | Derived from the live code in `165-01` — § 6 *Finding C* above, which enumerates the `route: 'ResultEntity'` construction sites rather than assuming the plan's count of one. | Decided in `165-01`; see § 6 for the verdict and the two real construction sites it rests on. | Recorded here only so the question is findable; § 6 is the authority. |
| **1. What happens to `results/[[electionTab]]/statistics`?** | `165-04`, under operator decision **D-25**; the alternatives and their rejections are § 2d above. | **RE-HOMED** to `results/statistics/`. | § 2d carries the reasoning. |
| **2. Does D-13 land on `e2e/base` or on `perm-interactive-info`?** | Research measured the `e2e/base` reading red against `voter-journey.spec.ts:662-666`; the operator amended **D-13** on 2026-09-23. | **`perm-interactive-info`** — the base dataset is untouched by this phase (re-derived at run time in `165-05`: `git diff --name-only integration/ship-12-squash...HEAD -- packages/dev-seed` is empty). | Flipping the base flag makes the inline expander stop rendering, and `voter-journey` hard-asserts it — a cardinal failure, measured rather than predicted. |
| **5. How many plans, and which carries which negative-control pair?** | Planner discretion, exercised at plan time. | Eight plans; NC-1 in `165-02`, the remaining negative-control rows in the plans that own their subjects. | `165-CONTEXT.md` assigns this to the planner explicitly. |

---

## 3. The discipline every row followed

Identical for every row in this document, and stated once so each row can be read for its verdict:

1. `git hash-object <file>` captured **before** the file is touched.
2. The mutation applied.
3. The instrument run, **its exit code read directly from `$?` on the command itself — never through a pipe**, since a
   pipeline reports the last stage's status and would silently report the exit code of `tail` or `grep` instead of the
   gate's.
4. Exit code and **verbatim output** recorded in a fenced block. Never a description of the output.
5. The mutation reverted with `git checkout -- <specific file>` — never `git clean`, never a blanket
   `git checkout -- .`.
6. The revert proven **three ways**: `git diff --exit-code` returns 0, `git hash-object` equals the pre-captured value,
   and `git status --porcelain apps packages scripts` is empty.

`165-01` writes no production code and therefore mutates nothing, so steps 1, 2 and 5 have no subject in this plan's
rows; they are stated here because `165-02`, `165-04` and `165-06` append true mutation rows to this document and read
their discipline from this section. What `165-01` does obey in full is **step 3** — the two exit codes this plan
records (`TURBO_FORCE=true yarn build` in § 5 and the cold GET in § 2c) were each read from the shell status of the
command itself, never through a pipe — and **step 6's third proof**, `git status --porcelain`, which is asserted clean
after every commit of this plan.

---

## 4. Finding A — the measured populations, and the ref each was measured on

RNAV-06 / criterion 6 asks for an **absence**. An absence measured on one side only is worthless: zero hits proves
nothing if the scan never reached real source, and it proves nothing about the thing being removed if the thing was
never counted where it lives. So both sides are derived — zero on the work branch, non-zero on `spike/results-redraw`
— and the work-branch side carries a positive control.

### 4a. The work branch — `feat/165-results-navigation-redraw` @ `8fe1b952a`

```
$ grep -rl 'lib/spike' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l
0
$ grep -rn 'SPIKE' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l
0
$ grep -rn 'labMount(' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l
0
$ test -e apps/frontend/src/lib/spike ; echo $?
1
$ test -e 'apps/frontend/src/routes/(voters)/(located)/results-layered' ; echo $?
1
```

**Positive control — the scan reached real source.** Without this the five results above are satisfied equally well by
an empty or wrong working tree, and would prove nothing at all:

```
$ test -d apps/frontend/src/lib ; echo $?
0
$ find apps/frontend/src/lib -type f | wc -l
1637
```

Ref: `feat/165-results-navigation-redraw` @ `8fe1b952a`, working tree, this session.

### 4b. The spike branch — `spike/results-redraw` @ `a894e8bc7`, read without checking it out

D-02 forbids merging that branch and this plan never checks it out, so every figure below is taken from the object
database with `git grep <pattern> <ref> -- <path>` and `git ls-tree -r --name-only <ref> -- <path>`:

```
$ git grep -l 'lib/spike' spike/results-redraw -- apps/frontend/src | wc -l
15
$ git grep -l 'lib/spike' spike/results-redraw -- apps/frontend/src | grep -v 'lib/spike/' | wc -l
14
$ git grep -l 'lib/spike' spike/results-redraw -- apps/frontend/src | grep -v 'lib/spike/' | grep -v 'results-layered/' | wc -l
10
$ git grep -n 'SPIKE' spike/results-redraw -- apps/frontend/src | wc -l
30
$ git grep -n 'SPIKE' spike/results-redraw -- apps/frontend/src | grep -v 'lib/spike/' | grep -v 'results-layered/' | wc -l
14
$ git grep -n 'labMount(' spike/results-redraw -- apps/frontend/src | wc -l
9
$ git ls-tree -r --name-only spike/results-redraw -- apps/frontend/src/lib/spike | wc -l
6
$ git ls-tree -r --name-only spike/results-redraw -- 'apps/frontend/src/routes/(voters)/(located)/results-layered' | wc -l
9
```

Ref for all eight: `spike/results-redraw` @ `a894e8bc7`.

### 4c. Why `165-CONTEXT.md` and `165-RESEARCH.md` appear to disagree, and what follows from it

`165-CONTEXT.md` (:419-424) records **14** `SPIKE` markers and **5** `labMount(` sites; `165-RESEARCH.md` (:416-420)
records **30** and **9**. Both are correct. The pairs are the *same counts under different scopings*: 30 and 9 are
repo-wide over `apps/frontend/src`; 14 and 5 are the same scans with `results-layered/` and `lib/spike/` excluded —
i.e. the population that has to be de-labbed **by hand** rather than deleted wholesale. § 4b reproduces both members of
each pair from the same ref in one run, which is what makes the claim "scoping, not drift" checkable instead of
asserted.

This is precisely why **D-20's standing guard greps rather than asserting a number.** A guard pinned to "14" is a guard
that fails the day someone adds a legitimate comment containing the word, and passes the day a scaffolding import is
added under a path the count never covered. The guard D-20 buys is `expect(hits).toHaveLength(0)` over a live scan —
the only form whose meaning does not drift with the tree. Every count in this section is evidence about *today*; none
of them is a threshold anything is allowed to be pinned to.

---

## 5. Finding B — D-02, the reproduction rig

`spike/results-redraw` is deliberately **left unmerged, and is never merged by this phase.** It is not dead weight and
it is not a branch somebody forgot to clean up:

- It carries the redraw lab — a live toggle panel that flips each of the four fixes back to the broken behaviour — and
  that panel is the only way to observe the old and the new behaviour **side by side** on one build. Once the lab is
  deleted from the work branch (which it never reached: § 4a), nothing else in the repository can reproduce the
  original symptoms.
- The three probes that ship under `.planning/spikes/` — `031-results-nav-flicker-forensics/forensics.mjs`,
  `034-global-drawer-host/probe-global.mjs` and `034-global-drawer-host/probe-qinfo.mjs` — **target that branch's lab
  panel and will not run against the shipped tree.** They drive the panel's toggles and read its forensic log; on
  `feat/165-results-navigation-redraw` there is no panel and no log to read. D-21 keeps them under `.planning/spikes/`
  for exactly this reason: they are spike records, not app code, and criterion 6 scopes to `apps/frontend/src`.
- `.planning/spikes/033-layout-shaped-results-routes/` is a special case. Its `results-layered/` route tree is
  **superseded** by D-08's optional-param split and is never merged; the spike's value is the mount forensics it
  produced, not its route shape.

The branch-level proof that nothing was merged, taken after this plan's first commit:

```
$ git merge-base --is-ancestor integration/ship-12-squash HEAD ; echo $?
0
$ git merge-base --is-ancestor spike/results-redraw HEAD ; echo $?
1
```

The first exit code says the work branch descends from the ruled base; the second says no commit of the spike branch is
an ancestor of it. The pair is asserted in `165-01` Task 1's `<verify>` and is threat `T-165-05`'s mitigation — a branch
cut from the wrong base is the one failure in this plan that would not surface until much later.

The matching one-line note was added to each of the four spike READMEs under `.planning/spikes/`, so a reader who
reaches a probe from its own directory learns the same fact without having to find this document.

**Build baseline, taken before any phase edit** (discipline step 3 — the exit status was read from the command itself,
not through a pipe):

```
$ TURBO_FORCE=true yarn build > "$SCRATCH/build-task1.log" 2>&1 ; echo $?
0
$ grep -cE 'error TS|ERROR: command finished with error' "$SCRATCH/build-task1.log"
0
   Tasks:    14 successful, 14 total
   Cached:    0 cached, 14 total
```

`TURBO_FORCE=true` is load-bearing: without it a cached replay reports green without measuring anything, which this
repo has recorded as a defect class. `0 cached, 14 total` is the evidence the force took effect.

---

## 6. Finding C — D-09's cross-type emitter, derived from the live code

D-09 keeps the cross-type `organizations/candidate/{id}` URL shape **only if a current emitter produces it**, and
otherwise drops it with the drop recorded. `165-RESEARCH.md` § *D-09's cross-type edge* names the derivation to run and
says in terms: *"Derive it at run time from `EntityCard.svelte` / `EntityCardAction`; do not decide from this
document."* So it was derived, not read.

**Site 1 — `EntityCard.svelte`'s `effectiveAction`** (`apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:107-115`):

```svelte
const effectiveAction =
  action ??
  getRoute.current({
    route: 'ResultEntity',
    entityTab: type === 'candidate' ? 'candidates' : type === 'alliance' ? 'alliances' : 'organizations',
    entity: type,
    id,
    nominationId: unwrapped.nomination?.id
  });
```

`type` is destructured from the card's **own** unwrapped entity (`:100`). The plural `entityTab` and the singular
`entity` are therefore computed from the same value — the **matching pair**, by construction. There is no branch in
which `entityTab` comes from a parent list and `entity` from a child.

**Site 2 — the subcard construction** (`:140-155`). Subcards are the live candidate RESEARCH nominated for the
cross-type role: a member candidate rendered inside an organization list, or a member organization inside an alliance
list. Both branches map to an object carrying **only `entity`**:

```svelte
subcards = findCandidateNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map(
  (e) => ({
    entity: e
  })
);
```

No `action` property is passed, so `action ?? …` at `:108` falls through in each subcard's own `EntityCard` instance
(`:378`, `<EntityCard variant="subcard" {...} />`), which re-derives `effectiveAction` from the **subcard's** own type
by the same matching-pair rule. The parent list's plural never reaches the child's URL.

**The grep, and the count it actually returned.** The plan expected one construction site; the scan returns three
lines, of which two are constructions and one is a usage example inside a doc comment:

```
$ grep -rn "route: 'ResultEntity'" apps/frontend/src
apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:76:                route: 'ResultEntity',
apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:110:        route: 'ResultEntity',
apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:224:{@render cardAction(getRoute.current({route: 'ResultEntity', id}), false, undefined, someSnippet)}
```

`EntityCard.svelte:224` is inside the `cardAction` snippet's `### Usage` doc comment (`:212-227`) — not code.
`EntityInfo.svelte:74-81` **is** a third real emitter the plan did not name, the parent-nomination link on the entity
details surface:

```svelte
{#if appSettings.results.sections?.includes(ENTITY_TYPE.Organization) && parentNomination.entityType === ENTITY_TYPE.Organization}
  <a href={getRoute.current({ route: 'ResultEntity', entityTab: 'organizations', entity: parentNomination.entityType, ... })}>
```

Its `entityTab` is the literal `'organizations'` and its `entity` is `parentNomination.entityType`, which the enclosing
`{#if}` at `:73` has already narrowed to `ENTITY_TYPE.Organization`. That is `organizations/organization/{id}` — a
matching pair again.

**The route table forces the same pairing for the two default routes** (`apps/frontend/src/lib/routes/route.ts:123-127`):

```ts
export const DEFAULT_PARAMS: Partial<Record<Route, Record<string, string>>> = {
  Question: { questionId: FIRST_QUESTION_ID },
  ResultCandidate: { entityTab: 'candidates', entity: 'candidate' },
  ResultParty: { entityTab: 'organizations', entity: 'organization' }
};
```

### Verdict

**A current emitter DOES NOT produce the cross-type `organizations/candidate/{id}` shape.** Every construction site in
`apps/frontend/src` — `EntityCard.svelte:107-115`, its subcard mapping at `:140-155`, and `EntityInfo.svelte:74-81` —
emits a matching plural/singular pair, and `DEFAULT_PARAMS` forces the same pairing for `ResultCandidate` and
`ResultParty`.

**Consequence for `165-04`.** The route test written in `165-04` enumerates only the four shapes the application emits
— the picker, `{election}`, `{election}/{plural}`, and the full same-type entity URL. The cross-type shape is **dropped
from the enumerated set**, and the drop is recorded here, which is what D-09 asks for.

**What the drop does NOT mean.** Dropping the shape from the enumerated test set does not make the URL unroutable.
D-09 forbids aggressive canonicalisation and redirects outright, and D-10 keeps the route params optional — so
`/results/{election}/organizations/candidate/{id}` stays a routable URL, and the doc-comment in the leaf `+page.ts`
that describes it (*"edge case: org list + candidate drawer"*) stays accurate. What changes is only that no test
asserts a shape nothing in the application produces.

**APPLIED by `165-04`, 2026-09-23.** The verdict above was carried out rather than re-derived. `voter-results-redraw.spec.ts`
enumerates **four** shapes — picker, `{election}`, `{election}/{plural}`, and the full same-type entity URL — and the
cross-type shape is **not among them**; the describe's own doc-comment states the drop and points back to this section.
The half that keeps the drop honest landed in the same commit: `page.guards.test.ts` carries a row asserting that the
cross-type shape still **loads** (throws neither the 404 nor the 307), so "nothing emits it" cannot quietly become "so
we may as well reject it" — which is the one way this drop could turn into the canonicalisation D-09 forbids.

---

## 7. NC-1 — the loader guard catches a tracked URL read

> **Added by `165-02`.** Numbered **7**, not 4. `165-02`'s plan says to write this row as `## 4. NC-1`, but `165-01`
> had already taken §§ 4-6 for its three findings and `165-01-SUMMARY.md` cites them by those numbers. Renumbering
> would silently falsify an already-committed document; appending at 7 does not. The drift is recorded in § 2b rather
> than reconciled in either direction, per this repo's content-anchor rule.

The claim under test: `layout.tracking.test.ts` is a real guard on the `(located)` load's URL-tracking contract, not a
test that would pass whatever the load did.

**Mutation.** `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — the `untrack`ed destructuring deleted and the
two consumers pointed back at `url` directly. This is not an invented mutation: it is the **pre-fix production body**,
byte-identical to what `integration/ship-12-squash` ships, which is what makes it realistic. The `// reason:` comment
block above it is deliberately left in place, because the mutation is the code, not the prose.

```diff
@@ -40,9 +40,8 @@ export async function load({ data, fetch, parent, untrack, url }) {
   // reason: voter-app routes allowlist for ?next= deferred target — prevents open-redirect attacks. …
   // The path + search are read untracked too: they only feed the `next=` redirect target. …
   // Only WHERE the two values come from changed. …
-  const { pathname, search } = untrack(() => ({ pathname: url.pathname, search: url.search }));
-  const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(pathname);
-  const nextKv = isVoterRoute ? `next=${encodeURIComponent(pathname + search)}` : '';
+  const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(url.pathname);
+  const nextKv = isVoterRoute ? `next=${encodeURIComponent(url.pathname + url.search)}` : '';
```

**The mutation is the base branch's own two lines, proven rather than asserted.** The two inserted lines were byte-compared against the same two lines on `integration/ship-12-squash`:

```
diff <(git show integration/ship-12-squash:'apps/frontend/src/routes/(voters)/(located)/+layout.ts' | sed -n '41,42p') \
     <(sed -n '43,44p' 'apps/frontend/src/routes/(voters)/(located)/+layout.ts')
→ no output, exit 0
```

**Pre-mutation hash:** `044b0661faca6e3d8edb60839788262101b85064`
(`git hash-object 'apps/frontend/src/routes/(voters)/(located)/+layout.ts'`, captured before the file was touched.)

**Instrument:** `yarn workspace @openvaa/frontend test:unit layout.tracking`
(= `vitest run --project=unit layout.tracking` in `apps/frontend`.) Its exit status was read from the command's own
shell status, never through a pipe; the output was redirected to a file and the status read from `$?` on the redirected
command itself.

**Verdict: RED. Exit code 1.** Verbatim (ANSI colour escapes stripped, nothing else altered):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend

 ❯ src/routes/(voters)/(located)/layout.tracking.test.ts (5 tests | 4 failed) 7ms
   × (located)/+layout.ts load dependency tracking > reads no URL property tracked (/results?electionId=el-1&constituencyId=co-1) 5ms
     → a tracked url read makes SvelteKit rerun this load on every navigation: expected [ 'pathname', 'pathname', 'search' ] to deeply equal []
   × (located)/+layout.ts load dependency tracking > reads no URL property tracked (/results/el-1?electionId=el-1&constituencyId=co-1) 1ms
     → a tracked url read makes SvelteKit rerun this load on every navigation: expected [ 'pathname', 'pathname', 'search' ] to deeply equal []
   × (located)/+layout.ts load dependency tracking > reads no URL property tracked (/results/el-1/candidates/candidate/c-1?electionId=el-1&constituencyId=co-1) 0ms
     → a tracked url read makes SvelteKit rerun this load on every navigation: expected [ 'pathname', 'pathname', 'search' ] to deeply equal []
   × (located)/+layout.ts load dependency tracking > reads no URL property tracked (/results/el-1/organizations?electionId=el-1&constituencyId=co-1&nominationId=n-1) 0ms
     → a tracked url read makes SvelteKit rerun this load on every navigation: expected [ 'pathname', 'pathname', 'search' ] to deeply equal []
   ✓ (located)/+layout.ts load dependency tracking > the recording Proxy catches a tracked url.pathname read (negative control) 0ms

 Test Files  1 failed (1)
      Tests  4 failed | 1 passed (5)
```

**Counts:** 5 tests executed, **4 failed**, 1 passed. The recorded read set is `[ 'pathname', 'pathname', 'search' ]` —
`pathname` twice because the pre-fix body reads it once for the regex test and once for the `next=` target, and `search`
once for the same target. That is the tracked-read fingerprint of the exact defect spike 031 attributed the redraw to.

**The one test that stayed green is the point.** The negative control passed under mutation, because its subject is a
load-shaped function defined inside the test file and not the production load. So the red above is attributable to the
production mutation and not to the instrument having broken — the two halves of the file fail independently, which is
what makes the four reds diagnostic rather than merely alarming.

### 7a. The pairing half, stated honestly

D-17 asks each pair to show the guard failing **and** to say what the same mutation did before the guard existed. The
honest answer here is **not** "the same mutation was green under the old test" — it is that **no instrument existed at
all**. `layout.tracking.test.ts` is authored by `165-02`; the base branch carries no file at that path:

```
git ls-tree integration/ship-12-squash -- 'apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts'
→ no output, exit 0
```

**Positive control for that absence**, so the empty output means "observed absent" rather than "the command was
pointed at nothing":

```
git ls-tree integration/ship-12-squash -- 'apps/frontend/src/routes/(voters)/(located)/+layout.ts'
→ 100644 blob 5f7a1163e127be5917b41984e857e1b62b71068f	apps/frontend/src/routes/(voters)/(located)/+layout.ts
```

The same `git ls-tree` invocation, against the same ref, returns a blob for the loader and nothing for the guard. A
pairing that claimed a green where there was no test at all would be the dishonest form, and this is why it is not
claimed.

### 7b. Revert, proven three ways

The mutation was reverted with `git checkout -- 'apps/frontend/src/routes/(voters)/(located)/+layout.ts'` — one named
file, never a blanket `git checkout -- .`, never a `git clean`.

| Proof | Result |
|---|---|
| `git diff --exit-code -- '…/(located)/+layout.ts'` | **exit 0** |
| `git hash-object '…/(located)/+layout.ts'` | `044b0661faca6e3d8edb60839788262101b85064` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 7c. The un-mutated baseline, measured rather than assumed

The red above means something only against a measured green. The identical command, on the restored file:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend

 ✓ src/routes/(voters)/(located)/layout.tracking.test.ts (5 tests) 3ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

**Exit code 0.** The same baseline was also taken *before* the mutation was applied (exit 0, 5 passed), so the green is
anchored on both sides of the red rather than only after it.

---

## 8. NC-2 — the AccordionSelect reconciliation, measured over the same 16-run bar

> **Added by `165-05.1`.** Numbered **8**, continuing the sequence § 7 established. Nothing above is renumbered.

The claim under test: the `AccordionSelect` change committed by `165-05.1` is what closes the EQTYP-02 regression
`165-BASE-FLAKE-MEASUREMENT.md` measured at 6 red / 16 on the phase tip against 0 red / 22 on
`integration/ship-12-squash` (Fisher's exact two-tailed **p = 0.0029**).

### 8a. The protocol, and the exclusion rule, both fixed BEFORE the counted runs

This subsection was written and **committed before a single counted run executed**, so that the rule below cannot be
read as chosen after seeing which runs failed. Its commit precedes the first `accordion-fix-*` directory's timestamp,
which is checkable.

- **Instrument.** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/accordion-fix-NN --project voter-journey --no-db-reset`,
  the same wrapper, selector, database and host as both arms of the base measurement. Project-scoped, 4 specs — the
  scope that measurement used, and the only scope its 6/16 is comparable to.
- **Exit status** is read directly from the command's own status, never through a pipe. Wrapper semantics: `0` success,
  `1` Playwright failures, `6` unconfirmed preflight (evidence for neither side, excluded and re-run), `130` abort.
- **Symptom classification is on the error HEADLINE only** (`Error: expect(locator).toHaveCount` versus
  `TimeoutError: locator.click: Timeout` versus `Test timeout of Nms exceeded`). Playwright embeds a source code-frame
  in the error body, so a click-timeout body CONTAINS the literal `toHaveCount`; the base measurement's classifier got
  this wrong once and had to reclassify.
- **Sample size** is 16 counted runs, the same bar as the phase arm of the base measurement. One green run is
  compatible with a 37.5 % flake rate and proves nothing.

**Pre-committed exclusion rule — host starvation.** A run is recorded as a **host-starvation abort**, excluded from the
denominator and re-run in its place, if and only if **both** hold:

1. its failure headline is a `Test timeout of Nms exceeded` **ceiling** (not an assertion that settled on a value), and
2. its wall-clock exceeds **5× the healthy median run** for this instrument on this host (healthy median ≈ 75 s, so the
   threshold is ≈ 375 s).

An assertion failure at normal speed is **never** excluded by this rule, whatever it asserts. Every excluded run is
reported in full below — headline, duration and host state — so a reader who rejects the rule can put it back; where
any run is excluded, the verdict is also reported with the excluded runs counted, as the alternative reading.

**Host health is measured, not assumed.** Each counted run records the 1/5/15-minute load averages and free swap
immediately before it starts. This is not ceremony: the abandoned first attempt below failed precisely because the host
degraded mid-sample, and nothing in the wrapper's own evidence would have said so.

### 8b. The abandoned first attempt, reported in full rather than deleted

A first attempt at the 16 runs was started at 15:06 UTC and abandoned after 7. It is kept at
`tests/e2e-runs/accordion-attempt1-01` … `-07` — renamed out of the counted glob, not deleted — because the host
degraded into swap thrash partway through and the sample stopped being a measurement of the code.

| Run | Wrapper exit | Wall-clock | Verdict |
|---|---|---|---|
| accordion-attempt1-01 | 0 | 75 s | green |
| accordion-attempt1-02 | 0 | 78 s | green |
| accordion-attempt1-03 | 0 | 71 s | green |
| accordion-attempt1-04 | 1 | **1132 s (18.9 min)** | red — `Test timeout of 120000ms exceeded`, carrying a symptom-(a) `toHaveCount` 2-vs-1 inside it |
| accordion-attempt1-05 | 1 | **1660 s (27.7 min)** | red — `Test timeout of 120000ms exceeded` on the *full journey* test; EQTYP-02 itself PASSED in this run |
| accordion-attempt1-06 | 0 | 75 s | green |
| accordion-attempt1-07 | — | aborted by operator | not evidence either way |

**Host state measured at 15:57 UTC, during run 05:** load averages **36.53 / 30.85 / 22.18**; swap **20 573 MiB of
21 504 MiB used, 930 MiB free**; 8 505 free pages (≈ 136 MiB). Runs 04 and 05 are 15× and 22× the healthy median and
both failed on a *ceiling*, not on a settled assertion — they satisfy both limbs of the pre-committed rule. Run 06,
executed immediately after the host recovered, was green in 75 s.

Two things are said plainly rather than smoothed over. First, run 04's error body does contain a genuine symptom-(a)
assertion failure (`toHaveCount` expected 1, received 2, 3 polls) — it is excluded on the starvation rule, not because
the symptom was absent. Its end-of-test ARIA snapshot shows the accordion **collapsed** with one option, i.e. the
collapse did arrive, after the 2 s assertion window; a `setTimeout(450)` starved behind a 19-minute test file is a
sufficient explanation and the trace needed to settle it was not attached to a timed-out run. Second, the attempt was
abandoned rather than continued: on a thrashing host `AccordionSelect`'s deliberate `DELAY.lg` collapse — which this
plan is forbidden to remove, and which the option-to-option path still uses — can exceed a 2 s assertion window no
matter what the component does, so continuing would have measured the host.

The counted sample below was therefore restarted from scratch, on a recovered host, at the same fix HEAD.

### 8c. Four arms, one instrument, one host, one database

The measurement grew from one arm to four, because the first negative control came back GREEN and that could not be
left as the answer. Every arm below is 16 preflight-confirmed (`preflight-successes=1`, `preflight-failures=0`),
project-scoped `voter-journey` runs through the same wrapper, on the same host and database, within one four-hour
window. No run returned exit 6 or 130, so counted == total in every arm and nothing was excluded under § 8a's rule.

| Arm | Body under test | Blob | Red / counted | Rate | Wilson 95 % |
|---|---|---|---|---|---|
| **A** | the shipped fix, `accordion-fix-01…16` | `d8b589b91` | **0 / 16** | **0 %** | 0.0 – 19.4 % |
| **B** | the fix with ONLY the reconciliation reverted, `accordion-nc-01…16` | `f13b9f81a` | **1 / 16** | 6.2 % | 1.1 – 28.3 % |
| **C** | the pre-fix body, byte-identical to base, `accordion-nc2-01…16` | `5c29233fc` | **4 / 16** | 25.0 % | 10.2 – 49.5 % |
| — | *(prior)* phase tip `404948d78`, `165-BASE-FLAKE-MEASUREMENT.md` | `5c29233fc` | 6 / 16 | 37.5 % | 18.5 – 61.4 % |
| — | *(prior)* base `integration/ship-12-squash` | `5c29233fc` | 0 / 22 | 0 % | — |

**Arm C is the contemporaneous pre-fix control, and it is the arm that makes arm A mean anything.** Its blob is
byte-identical to the base branch, the phase tip and this plan's own pre-plan HEAD — one blob id, `5c29233fc`, across
all three refs — so it is the real pre-fix code and not an invented mutation. At 4/16 it is statistically
indistinguishable from the 6/16 the base measurement recorded at the phase tip five hours earlier (Fisher two-tailed
**p = 0.70**), which is the evidence that the defect was still live at its documented rate while arm A was being
measured. Without arm C, arm A's 0/16 would be equally consistent with "the fix works" and "the flake went quiet
today" — and § 8d is why that alternative had to be taken seriously rather than waved away.

**Verdict on the fix.** Arm A versus the pooled pre-fix evidence (arm C + the phase-tip arm = 10/32 = 31.2 %):
Fisher's exact two-tailed **p = 0.0196**. Against a 31.2 % rate, a clean 16 has probability **0.0025**. Arm A versus
arm C alone is **p = 0.10** — stated because it is the weaker comparison and hiding it would flatter the result; the
pooling is legitimate because the two pre-fix arms are the same blob, wrapper, selector, host and database.

**EQTYP-02 was verified to have EXECUTED in all 48 runs** — `status` present, `retry: 0`, `skipped: 0`, 4 tests per
run. A green exit with a skipped test is a false green, and this project counts "did not run" as a failure.

### 8d. The first negative control came back GREEN, and was not allowed to stand as the answer

The plan's instruction was to revert the reconciliation, re-run until the failure is observed, and record it. Arm B
was run first at **8 runs and came back 0 / 8**. That is the outcome the plan named in advance as falsifying — and the
temptation it was written to forestall is to declare victory on arm A's green 16 and move on.

It was not the answer, for a reason that is arithmetic rather than a matter of judgement: **P(0 reds in 8 | rate 25 %)
= 0.10**. A 0/8 is unremarkable under the very rate it was supposed to reproduce. The control had no power, so it
carried no information in either direction. Two things followed:

1. **Arm C was run** — the whole fix reverted to the pre-fix body — to settle whether the flake was live *at all*
   today. It went red on its third run, with the identical symptom-(a) signature, and finished at 4/16.
2. **Arm B was extended to the same 16-run bar**, where P(0 | 25 %) falls to 0.010. It went **red on run 13**.

So the guard **is** observed RED under the reverted reconciliation — at 16 runs, not at 8. What the extension cost was
twenty minutes; what it bought was the difference between an honest measurement and a lucky one.

### 8e. What arm B does NOT license anyone to claim

Arm B is 1/16 and arm A is 0/16. Those two are **not** distinguishable (Fisher **p = 1.0**), and arm B is not
distinguishable from the un-fixed arm C either (**p = 0.33**). The defensible statements are therefore narrower than
the plan's framing assumed, and are worth writing down so a later reader does not inherit a stronger claim than the
evidence:

- **Supported:** the fix as a whole closes the regression (arm A vs pooled pre-fix, p = 0.0196).
- **Supported:** reverting the reconciliation reproduces the symptom — the red exists, with the same headline and the
  same end-state ARIA snapshot (Regional `[active] [selected]`, Municipal still listed beside it).
- **NOT supported:** that the reconciliation is the single load-bearing ingredient. The shipped fix has three parts
  (reconciliation, collapse-timer cancellation, non-animated correction), and this measurement cannot apportion credit
  between them. Arm B's 1/16 sits between arm A and arm C and is statistically consistent with both.
- **NOT supported:** that the remaining rate under any arm is exactly zero. 0/16 bounds the true rate at ≤ 19.4 %
  (Wilson upper bound), not at 0. Arm A is evidence of a large reduction, not of impossibility.

### 8f. The mutation, and the revert proven three ways

**Arm B mutation** — one line deleted from the shipped reconciliation, everything else held constant, so the arm has a
single variable:

```diff
   $effect(() => {
     const hasSelection = activeIndex != null && activeIndex >= 0;
     untrack(() => {
-      if (hasSelection && !hadSelection) setExpanded(false, true);
       hadSelection = hasSelection;
     });
   });
```

Runs `accordion-nc-09…16` were executed against a body reconstructed after arm C, and the reconstruction is **proven**
rather than assumed byte-identical to the one runs `01…08` used: the reconstructed file hashes to `f13b9f81a`, the
same blob id the first mutation's own `git diff` header recorded (`index d8b589b91..f13b9f81a`).

**Arm C mutation** — `git show 20ffd9325:<file> > <file>`, i.e. this plan's own pre-plan HEAD, which is the same blob
as `integration/ship-12-squash` and as the phase tip `404948d78`. Not an invented mutation: the production body.

**Pre-mutation hash:** `d8b589b9193aa089d5257f7af2e2dc323d89829a`, captured before either mutation was applied.

The tree was restored with `git checkout -- <one named file>` — never a blanket `git checkout -- .`, never a
`git clean`, which is prohibited outright in this repo.

| Proof | Result |
|---|---|
| `git diff --exit-code -- '…/AccordionSelect.svelte'` | **exit 0** |
| `git hash-object '…/AccordionSelect.svelte'` | `d8b589b919…` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** (full-tree porcelain also 0) |

### 8g. Host health, measured per run rather than assumed

Every counted run in arm A recorded its 1-minute load average and free swap before starting, in
`tests/e2e-runs/accordion-fix-NN/host-health.txt`. All 16 completed in **70–98 s** against a healthy median of ~75 s;
none came within 4× of § 8a's 375 s starvation threshold, so the exclusion rule pre-committed in § 8a **was never
invoked on the counted sample**. It was written for the abandoned attempt in § 8b and ended up applying to nothing
here, which is the outcome a pre-committed rule should have when the host behaves.

---

## 9. NC-3 — the standing scaffolding guard, observed failing four ways

> **Added by `165-06`.** Numbered **9**, continuing the sequence §§ 7 and 8 established. Nothing above is renumbered.
>
> **Row-id crosswalk, because the planning documents and this document disagree and the disagreement is recorded
> rather than reconciled** (the same handling § 2b and § 7 use for anchor drift). `165-VALIDATION.md` § *Negative
> Controls* and `165-RESEARCH.md` § *Negative controls (D-17)* name four pairs `NC-1`…`NC-4` by subject, and
> `165-06-PLAN.md` adds `NC-5` (the boundary) and `NC-6` (this guard). `165-05.1` was interpolated after all of those
> were written and took the id **`NC-2`** for the AccordionSelect reconciliation in § 8, which is already committed
> and cited by `165-05.1-SUMMARY.md`. Renumbering it would silently falsify a committed document; issuing a second
> `NC-2` would leave two rows with one id. So this document keeps its own sequence — one id per row, in the order the
> rows were measured — and carries the crosswalk instead:
>
> | Planning-document id | Subject | This document |
> |---|---|---|
> | `NC-1` (VALIDATION) | loader `untrack` | § 7 · **NC-1** |
> | — (introduced by `165-05.1`, id `NC-2`) | AccordionSelect reconciliation | § 8 · **NC-2** |
> | `NC-6` (165-06-PLAN) | the standing scaffolding guard | § 9 · **NC-3** |
> | `NC-2` (VALIDATION) | overlay-VT skip | § 10 · **NC-4** |
> | `NC-3` (VALIDATION) | name strip | § 11 · **NC-5** |
> | `NC-4` (VALIDATION) | `noScroll` | § 12 · **NC-6** |
> | `NC-5` (165-06-PLAN) | the host's `<svelte:boundary>` | § 13 · **NC-7** |

The claim under test: `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` is a real standing assertion on
criterion 6 (RNAV-06, D-20), not a file that would pass whatever the tree contained.

**Why this row carries four injections rather than one.** The guard makes three absence assertions and two
non-vacuity assertions, and they fail **independently**. An import-only guard and a marker-only guard fail
differently — that difference is the whole reason the marker text is scanned for at all (D-20, RESEARCH § *D-20's
standing assertion*: several marker lines in the spike tree carry no import, and one call site leaves none) — and a
guard whose walk is mis-rooted passes all three absence assertions while measuring nothing. Each injection below
isolates exactly one of those failure modes, and the **passing** assertions in each run are as much of the evidence
as the failing one.

**Pre-injection state.** All four injections create or edit files rather than replacing a line of production code, so
the pre-capture is a **manifest hash over the scanned population** rather than a single file's blob hash — the same
proof, taken over the set the guard actually measures:

```
find apps/frontend/src -type d \( -name node_modules -o -name .svelte-kit -o -name paraglide \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.svelte' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) -print \
  | LC_ALL=C sort | git hash-object --stdin
→ daac049c604788882e84374d7089ed4064dc547c   (823 files)
```

Injection 4 edits the guard file itself, so it additionally carries that file's own blob hash:
`dbcb6514148b6f09d32d11aa069ae49b0c3795c4`.

**Instrument, identical for all four and for the baseline:**
`yarn workspace @openvaa/frontend test:unit spike-scaffolding` (= `vitest run spike-scaffolding` in `apps/frontend`).
Every exit status below was read from `$?` **on the command itself**, with output redirected to a file — never through
a pipe, which would have reported the status of `sed` or `head` instead of the gate's. ANSI colour escapes are
stripped from the quoted output; nothing else is altered.

### 9a. Injection 1 — a file that IMPORTS the scaffolding module

Scratch file `apps/frontend/src/lib/_scratch-nc3-import.ts`, three lines:

```ts
import { labMount } from '$lib/spike/labPanel';

export const reintroduced = labMount;
```

**Verdict: RED. Exit code 1.**

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend

 ❯ src/lib/_guards/spike-scaffolding.test.ts (5 tests | 1 failed) 5ms
   ✓ the scan is not vacuous (D-20, invariant 1) > reaches real source under the frontend source root 0ms
   ✓ the scan is not vacuous (D-20, invariant 1) > excludes exactly this one file and no other 0ms
   × no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no source file imports the scaffolding module 3ms
     → These files import the deleted results-redraw scaffolding module: lib/_scratch-nc3-import.ts. Phase 165 shipped the fixes the lab prototyped and deleted the lab; an import of it means a spike branch has been merged with its scaffolding intact, which is what criterion 6 exists to close.: expected [ 'lib/_scratch-nc3-import.ts' ] to deeply equal []
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no scaffolding marker comment survives 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no parallel layered-results route tree exists 0ms

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

**Counts:** 5 executed, **1 failed**, 4 passed. The failure names the offending path, which is the property that makes
a future reintroduction diagnosable from the CI log alone rather than only reproducible locally.

**Revert:** `rm apps/frontend/src/lib/_scratch-nc3-import.ts` — the file was never tracked, so there was nothing to
`git checkout`; no `git clean`, no blanket checkout.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| manifest hash (command above) | `daac049c604788882e84374d7089ed4064dc547c` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 9b. Injection 2 — a file carrying ONLY a marker comment, and no import at all

This is the injection an import-only guard would miss, and it is the reason the marker check exists. Scratch file
`apps/frontend/src/lib/_scratch-nc3-marker.ts`, two lines:

```ts
// SPIKE: lab-only tab label, left behind when the scaffolding module was deleted.
export const label = 'Layered';
```

**Verdict: RED. Exit code 1.**

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend

 ❯ src/lib/_guards/spike-scaffolding.test.ts (5 tests | 1 failed) 5ms
   ✓ the scan is not vacuous (D-20, invariant 1) > reaches real source under the frontend source root 1ms
   ✓ the scan is not vacuous (D-20, invariant 1) > excludes exactly this one file and no other 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no source file imports the scaffolding module 0ms
   × no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no scaffolding marker comment survives 3ms
     → These lines still carry the scaffolding marker comment:
lib/_scratch-nc3-marker.ts:1: // SPIKE: lab-only tab label, left behind when the scaffolding module was deleted.
Criterion 6 forbids the markers in terms, and several of them never carried an import at all — which is why an import-only guard would pass on exactly this tree (invariant 2).: expected [ Array(1) ] to deeply equal []
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no parallel layered-results route tree exists 0ms

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

**The line that carries this row's point is the one that PASSED.** `no source file imports the scaffolding module`
reports ✓ on a tree that demonstrably still carries a marker comment. That is not an inference from the guard's
source — it is an observation. An import-only guard, which is what D-20's wording alone would have produced, is green
on exactly this tree. The marker check is doing work rather than decorating.

**Revert:** `rm apps/frontend/src/lib/_scratch-nc3-marker.ts`.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| manifest hash | `daac049c604788882e84374d7089ed4064dc547c` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 9c. Injection 3 — a parallel layered-results route directory

The third absence assertion, which neither injection above touches. A directory and one page file at
`apps/frontend/src/routes/(voters)/(located)/results-layered/+page.svelte`, containing `<p>layered</p>` — the shape
D-20 excludes in terms.

**Verdict: RED. Exit code 1.**

```
 ❯ src/lib/_guards/spike-scaffolding.test.ts (5 tests | 1 failed) 4ms
   ✓ the scan is not vacuous (D-20, invariant 1) > reaches real source under the frontend source root 0ms
   ✓ the scan is not vacuous (D-20, invariant 1) > excludes exactly this one file and no other 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no source file imports the scaffolding module 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no scaffolding marker comment survives 0ms
   × no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no parallel layered-results route tree exists 3ms
     → A parallel results implementation is present at: routes/(voters)/(located)/results-layered. D-20 excluded keeping one behind a dev-only route guard in terms: a second results implementation rots within one phase, and criterion 6 forbids the directory by name.: expected [ Array(1) ] to deeply equal []

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

Note that the page file's own text — `<p>layered</p>` — carries neither an import nor a marker, so the two checks
above it stay green. The directory check is the only thing standing between criterion 6 and a second results
implementation arriving with no scaffolding import at all.

**Revert:** `rm -rf 'apps/frontend/src/routes/(voters)/(located)/results-layered'`.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| manifest hash | `daac049c604788882e84374d7089ed4064dc547c` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 9d. Injection 4 — the non-vacuity block itself, against a mis-rooted walk

The three injections above prove the assertions fire. None of them proves the thing the whole file rests on: that a
walk which reaches nothing **fails loudly instead of passing quietly**. That failure mode cannot be produced by
adding a file — it is produced by the walk resolving somewhere else, which is exactly what a refactor that moves this
directory would do. So the injection edits one line of the guard itself:

```diff
-const SOURCE_ROOT = path.resolve(HERE, '..', '..');
+const SOURCE_ROOT = path.resolve(HERE, '..', 'i18n', 'tests', '__mocks__');
```

**Pre-mutation hash:** `dbcb6514148b6f09d32d11aa069ae49b0c3795c4`
(`git hash-object apps/frontend/src/lib/_guards/spike-scaffolding.test.ts`, captured before the file was touched.)

**Verdict: RED. Exit code 1.**

```
 ❯ src/lib/_guards/spike-scaffolding.test.ts (5 tests | 2 failed) 4ms
   × the scan is not vacuous (D-20, invariant 1) > reaches real source under the frontend source root 2ms
     → The walk of /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend/src/lib/i18n/tests/__mocks__ collected 7 source files and was expected to exceed 700, a floor derived from a measurement of this tree rather than copied from a document. Every check in this file measures that set, so a smaller one makes them all pass by looking at nothing. Either the walk is broken — a mis-resolved root, a pruned directory that should not be pruned, an extension set that no longer matches the tree — or the frontend source tree has been restructured, and in both cases this file has stopped guarding what it claims to guard.: expected 7 to be greater than 700
   × the scan is not vacuous (D-20, invariant 1) > excludes exactly this one file and no other 2ms
     → The self-exclusion covers a file other than this guard, or no longer covers this guard at all. It exists only because this file necessarily names the three forbidden literals as its own subject; a self-exclusion that widened would hide the next reintroduction behind the check meant to catch it.: expected [] to deeply equal [ Array(1) ]
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no source file imports the scaffolding module 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no scaffolding marker comment survives 0ms
   ✓ no results-redraw spike scaffolding survives in the frontend source (RNAV-06, criterion 6) > no parallel layered-results route tree exists 0ms

 Test Files  1 failed (1)
      Tests  2 failed | 3 passed (5)
```

**This is the false pass, demonstrated rather than reasoned about.** The three absence assertions all report ✓ — over
a population of **7 files** that contains no application source whatsoever. Without the non-vacuity block, that run
is a green guard measuring nothing, and it is the single most likely way this file dies: not by being deleted, but by
being left behind by a directory move. The second failure is the self-exclusion invariant catching the same event
from the other side — the guard file is no longer inside its own scan root, so the excluded set is empty rather than
holding one entry.

**Revert:** `git checkout -- apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` — one named file.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| `git hash-object apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` | `dbcb6514148b6f09d32d11aa069ae49b0c3795c4` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 9e. The pairing half, stated honestly

D-17 asks each pair to say what the same injection did **before** the guard existed. As with NC-1, the honest answer
is not "it was green under the old test" — **no instrument existed at all**. This guard is authored by `165-06`; no
file at that path exists on the branch base:

```
git ls-tree integration/ship-12-squash -- 'apps/frontend/src/lib/_guards/spike-scaffolding.test.ts'
→ no output, exit 0
```

**Positive control for that absence**, so the empty output reads as "observed absent" rather than "the command was
pointed at nothing":

```
git ls-tree integration/ship-12-squash -- 'apps/frontend/src/lib/_guards/eslint-store-guard.test.ts'
→ 100644 blob dae23d58f8221191f73a1ffa061f84850034e2a6	apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
```

All four injections above would therefore have been **green on the base branch** — not because they are benign, but
because nothing looked. That absence is what this row closes.

### 9f. The un-mutated baseline, measured rather than assumed

The same command, on the restored tree, after all four reverts:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-spike/apps/frontend

 ✓ src/lib/_guards/spike-scaffolding.test.ts (5 tests) 1ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

**Exit code 0**, 5 executed, 5 passed, **0 skipped** — a non-zero passing count under the filter, which is what
distinguishes a real green from `No test files found` returning the same exit code.

---

## 10. NC-4 — the overlay view-transition skip

> **Added by `165-06`.** VALIDATION's `NC-2`; see the crosswalk in § 9.

The claim under test: the `isOverlayNavigation` early return in the root layout's `onNavigate` is what keeps a
document View Transition from running for a drawer open or close, and the committed Playwright spec observes it.

**Shared environment for §§ 10-13.** All four rows ran back to back against **one** Supabase stack, kept up across
them with `--no-db-reset` on every wrapper invocation, so only the dev server was recycled between rows. Free space
inside the container runtime was checked before the first row rather than on the host alone — `docker exec
supabase_db_openvaa-local df -h /` reported **15G available of 103G**, and the project has recorded a no-space
condition *voiding* a run rather than reddening it, which would have made every verdict below meaningless.

```
docker info --format '{{.ServerVersion}} | containers={{.Containers}} running={{.ContainersRunning}}'
→ 29.7.2 | containers=24 running=24
docker exec supabase_db_openvaa-local df -h /
→ overlay  103G  83G  15G  86% /
```

**Pre-row baseline, taken BEFORE any mutation**, so the three reds below are anchored on both sides rather than only
after:

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-pre-baseline --no-db-reset --project voter-results-redraw
→ exit 0 ·  7 passed (25.3s) · playwright exit 0 · preflight failures 0, successes 1
```

**Mutation.** `apps/frontend/src/routes/+layout.svelte` — the overlay early return deleted from the merged
`onNavigate` hook. This restores the pre-fix behaviour exactly, which is what makes it realistic; the comment above
it is deliberately left in place, because the mutation is the code and not the prose.

```diff
@@ -156,7 +156,6 @@
     // LANDMINE: read `navigation.to?.url` — NOT `page.url`, which is the SOURCE url during onNavigate. `shouldAnimate` also gates reduced motion and ?notr=1.
     if (!shouldAnimate(navigation.to?.url)) return;
     // Opening / closing a modal overlay (the results entity drawer) gets no document VT: named groups would be painted above the top-layer dialog. The overlay's own motion is the transition. See `$lib/utils/viewTransition`.
-    if (isOverlayNavigation(navigation.from, navigation.to)) return;
     return new Promise<void>((resolve) => {
       startViewTransition(async () => {
         resolve(); // tells SvelteKit to apply the new DOM
```

**Pre-mutation hash:** `bb05cfc6d698127ab4e5f6266e9f91152bf77fdc`
(`git hash-object apps/frontend/src/routes/+layout.svelte`, captured before the file was touched.)

**Instrument:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc4-overlay-skip --no-db-reset --project voter-results-redraw`
The wrapper spawns and owns its own dev server on port 5273 and confirms the served-application preflight before any
spec body runs. Its exit status was read from `$?` on the command itself, output redirected to a file — never through
a pipe.

**Verdict: RED. Exit code 1.** The wrapper's own trailer confirms the run was *measured* rather than voided:
`playwright exit 1 · preflight failures 0, successes 1`. Verbatim (ANSI escapes stripped, nothing else altered):

```
  1) [voter-results-redraw] › tests/tests/specs/voter/voter-results-redraw.spec.ts:192:3 › voter-results-redraw — the two view-transition invariants (RNAV-03) › overlay navigations run no document transition, and any transition under an open dialog carries no named groups › overlay OPEN starts no document transition at all

    Error: opening the entity drawer started a document View Transition — `isOverlayNavigation` failed to exempt it, and its named groups paint above the top-layer dialog

    expect(received).toHaveLength(expected)

    Expected length: 0
    Received length: 1
    Received array:  [{"dialogOpen": false, "names": ["persistent-header", "main-content", "results-election-select", "results-entity-tabs"], "noNames": false, "url": "/results/3c850500-33e7-46a4-8f41-05d34d01eceb/organizations/organization/c5dfbc09-9c41-4a33-b943-6937219e2826"}]

      219 |         await viewTransitionLog.read(),
      220 |         'opening the entity drawer started a document View Transition — `isOverlayNavigation` failed to exempt it, and its named groups paint above the top-layer dialog'
    > 221 |       ).toHaveLength(0);
          |         ^
      222 |     });

  1 failed
    [voter-results-redraw] › … › overlay navigations run no document transition, and any transition under an open dialog carries no named groups
  6 passed (24.3s)
```

**Counts:** 7 executed, **1 failed**, 6 passed.

**Which assertion failed, and why it is the right one.** `overlay OPEN starts no document transition at all`. The
captured entry is exactly the shape the plan predicted: its `url` carries **both** the `entity` and `id` segments
(`/results/{electionId}/organizations/organization/{id}`), which is precisely the pair `isOverlayNavigation` keys on,
and its `names` array is non-empty — four named groups that would be painted above the top-layer dialog for the
duration of the transition. `dialogOpen` reads `false` because the log entry is written when the transition
*starts*, which is before the drawer's dialog has been shown; the defect is the transition existing at all, not its
dialog state.

**The non-vacuity step in the same run passed**, so the capture seam was alive: the spec's first step drives an
entity-tab switch — a plain in-app navigation that SHOULD start a transition — and asserts the log grows. A dead
instrument would have reddened there instead, and the absence assertions would then have been failing for the wrong
reason.

**Revert:** `git checkout -- apps/frontend/src/routes/+layout.svelte` — one named file. Never a blanket checkout,
never a `git clean`.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| `git hash-object apps/frontend/src/routes/+layout.svelte` | `bb05cfc6d698127ab4e5f6266e9f91152bf77fdc` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

**Un-mutated baseline**, the same command on the restored file:

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc4-baseline --no-db-reset --project voter-results-redraw
→ exit 0 ·  7 passed (23.7s) · playwright exit 0 · preflight failures 0, successes 1
```

---

## 11. NC-5 — the name strip, injected by dropping `!important` rather than by deleting the rule

> **Added by `165-06`.** VALIDATION's `NC-3`; see the crosswalk in § 9.

The claim under test: the `!important` in `:global(html.vt-no-names *) { view-transition-name: none !important; }` is
load-bearing, and the committed spec observes its absence.

**The injection is deliberately the realistic mistake and not the obvious one.** Deleting the rule is the obvious
injection and nobody makes it — a rule with a two-line landmine comment above it does not get deleted by accident.
Dropping the qualifier is the mistake a real editor makes, during a tidy-up or a lint sweep that treats `!important`
as a smell, and it *silently* restores the defect: the named elements carry their names as **inline style
declarations**, and an inline declaration beats any stylesheet rule that is not `!important`
(`165-RESEARCH.md` § *Pitfall 3*).

```diff
@@ -265,7 +265,7 @@
   /* A VT that runs while a modal dialog is open runs without named groups … */
   :global(html.vt-no-names *) {
-    view-transition-name: none !important;
+    view-transition-name: none;
   }
```

**Pre-mutation hash:** `bb05cfc6d698127ab4e5f6266e9f91152bf77fdc`
(same file as § 10, re-captured before this mutation was applied and identical to it, which is itself the proof that
§ 10's revert landed.)

**Instrument:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc5-name-strip --no-db-reset --project voter-results-redraw`

**Verdict: RED. Exit code 1.** (`playwright exit 1 · preflight failures 0, successes 1`.) Verbatim:

```
  1) [voter-results-redraw] › tests/tests/specs/voter/voter-results-redraw.spec.ts:192:3 › voter-results-redraw — the two view-transition invariants (RNAV-03) › overlay navigations run no document transition, and any transition under an open dialog carries no named groups › a transition running under an open dialog carries no named groups

    Error: a View Transition ran under an open dialog WITH named groups — every named element becomes its own group painted above the top-layer dialog, which is the layering defect this phase fixes

    expect(received).toEqual(expected) // deep equality

    - Expected  -  1
    + Received  + 14

    - Array []
    + Array [
    +   Object {
    +     "dialogOpen": true,
    +     "names": Array [
    +       "persistent-header",
    +       "main-content",
    +       "results-election-select",
    +       "results-entity-tabs",
    +       "entity-detail-tabs",
    +     ],
    +     "noNames": true,
    +     "url": "/results/0b1c4f0d-f605-42e4-8380-b085f26ee627/organizations/organization/58b3cac1-01ea-41f5-8f11-afbc0c9db4a7",
    +   },
    + ]

      249 |         underDialog.filter((call) => call.names.length > 0),
      250 |         'a View Transition ran under an open dialog WITH named groups — every named element becomes its own group painted above the top-layer dialog, which is the layering defect this phase fixes'
    > 251 |       ).toEqual([]);
          |         ^

  1 failed
  6 passed (25.5s)
```

**Counts:** 7 executed, **1 failed**, 6 passed.

**`noNames` reads `true` while `names` is non-empty, and that pair is the whole finding.** The class IS on the
document element — the strip machinery ran exactly as designed — and the names came back anyway. Nothing about the
mechanism failed; the single token that let the rule beat an inline declaration was removed, and the rule quietly
lost. A guard that only checked "was the class applied" would have been green on this tree.

**The two names the pitfall predicted are both present** — **`results-election-select`**
(`…/results/[[electionTab]]/+layout.svelte:158`, `style="view-transition-name: results-election-select"`) and
**`results-entity-tabs`** (`…/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte:111`,
`style="view-transition-name: results-entity-tabs"`).

**The measurement also corrects the pitfall's population, which is why it was measured rather than reasoned about.**
Five names return, not two. The other three are inline as well, set through Svelte's `style:` directive — which
compiles to an inline style property and therefore wins for exactly the same reason:

| Name | Where | Form |
|---|---|---|
| `results-election-select` | `…/results/[[electionTab]]/+layout.svelte:158` | `style="…"` attribute |
| `results-entity-tabs` | `…/[[entityTab=etPl]]/+layout.svelte:111` | `style="…"` attribute |
| `persistent-header` | `lib/layouts/main/Header.svelte:70` | `style:view-transition-name` directive |
| `main-content` | `lib/layouts/main/MainContent.svelte:66` | `style:view-transition-name` directive |
| `entity-detail-tabs` | `lib/dynamic-components/entityDetails/EntityDetails.svelte:154` | `style="…"` attribute |

Pitfall 3's *reasoning* is confirmed and its *scope* was understated: it counted the two names in the results tree,
and the surface is five, spanning the header, the main content wrapper and the drawer's own tab strip. The
`!important` is therefore load-bearing for the whole document, not only for the results layout.

**Revert:** `git checkout -- apps/frontend/src/routes/+layout.svelte`.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| `git hash-object apps/frontend/src/routes/+layout.svelte` | `bb05cfc6d698127ab4e5f6266e9f91152bf77fdc` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

**Un-mutated baseline:**

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc5-baseline --no-db-reset --project voter-results-redraw
→ exit 0 ·  7 passed (25.1s) · playwright exit 0 · preflight failures 0, successes 1
```

---

## 12. NC-6 — the `noScroll` option on the entity-tab change

> **Added by `165-06`.** VALIDATION's `NC-4`; see the crosswalk in § 9.

The claim under test: `{ noScroll: true }` on the entity-tab navigations is what keeps a voter's scroll position
across a tab switch, and the committed spec observes its removal.

**Mutation.** `…/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` — the option dropped from **one** of the
three branches, the organizations branch, because that is the branch the spec's tab-switch case drives
(`resultsPage.selectEntityTab('orgs')`). Removing it from one branch rather than all three is the realistic shape: a
partial edit is what a real change produces, and it also proves the assertion is sensitive to the specific
navigation it exercises rather than to the option's presence in the file.

```diff
@@ -90,7 +90,7 @@
     if (typed?.type === 'organization' || index === 1) {
-      goto(buildListRoute(activeElectionId, 'organizations'), { noScroll: true });
+      goto(buildListRoute(activeElectionId, 'organizations'));
       startEvent('results_changeTab', { section: 'organization' });
       return;
     }
```

**Pre-mutation hash:** `c8d5cdee997d13b2d8823a6dfe5533ca9b4b72d4`
(`git hash-object 'apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte'`.)

**Instrument:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc6-noscroll --no-db-reset --project voter-results-redraw`

**Verdict: RED. Exit code 1.** (`playwright exit 1 · preflight failures 0, successes 1`.) Verbatim:

```
  1) [voter-results-redraw] › tests/tests/specs/voter/voter-results-redraw.spec.ts:96:3 › voter-results-redraw — scroll survival and node identity (RNAV-02, RNAV-04) › scroll survives entity open, entity close and an entity-tab switch, and neither subtree remounts › an entity-TAB SWITCH keeps the scroll offset, and the list CONTAINER node survives

    Error: the page scrolled when the entity tab changed — `noScroll` did not hold (document height 2114 -> 2022)

    expect(received).toBe(expected) // Object.is equality

    Expected: 171
    Received: 0

      180 |         afterSwitch.y,
      181 |         `the page scrolled when the entity tab changed — \`noScroll\` did not hold (document height ${before.height} -> ${afterSwitch.height})`
    > 182 |       ).toBe(before.y);
          |         ^

  1 failed
  6 passed (24.2s)
```

**Counts:** 7 executed, **1 failed**, 6 passed. The scroll offset reads **0 where the baseline was 171** — the exact
verdict the plan predicted. The two preceding steps of the same test (entity open and entity close) passed, so the
red is attributable to the tab-switch navigation rather than to the harness losing the scrolled start; and the
step's own hard-asserted baseline (`before.y > 0`) held at 171, so the equality it failed on was not a vacuous
comparison from the top of the page.

### 12a. The pairing half, demonstrated rather than asserted

D-17 asks what the same mutation did **before** the guard existed. This row can answer more sharply than §§ 7 and 9,
because unlike their subjects the mutated construct **does** have a counterpart on the branch base — and the
instrument still does not.

**(1) The spec does not exist on the base branch**, with a positive control so the empty output reads as "observed
absent" rather than "the command was pointed at nothing":

```
git ls-tree integration/ship-12-squash -- 'tests/tests/specs/voter/voter-results-redraw.spec.ts'
→ no output, exit 0

git ls-tree --name-only integration/ship-12-squash -- 'tests/tests/specs/voter/'
→ tests/tests/specs/voter/.gitkeep
  tests/tests/specs/voter/cold-entry-dataroot.spec.ts
  tests/tests/specs/voter/eperm07-term-trigger.spec.ts
  tests/tests/specs/voter/voter-alliance.spec.ts
  tests/tests/specs/voter/voter-dark-mode.spec.ts
  tests/tests/specs/voter/voter-journey-mobile.spec.ts
  tests/tests/specs/voter/voter-journey.spec.ts
  tests/tests/specs/voter/voter-nominations.spec.ts
  tests/tests/specs/voter/voter-prefs-tracking.spec.ts
```

Nine voter specs on the base branch, and none of them is this one.

**(2) No scroll assertion exists ANYWHERE in the base E2E suite** — not merely "not in this spec":

```
git grep -cE 'scrollY|readScroll|noScroll' integration/ship-12-squash -- 'tests/tests/specs/'
→ no output, exit 1  (grep's "no matches")

git grep -lE 'scrollY|readScroll' integration/ship-12-squash -- 'tests/'
→ no output, exit 1
```

**(3) And the mutation IS applicable there.** The base branch carries the same `{ noScroll: true }` construct on the
equivalent tab-change navigation, in the unsplit L1 layout:

```
git grep -n 'noScroll' integration/ship-12-squash -- 'apps/frontend/src/routes/'
→ …/questions/+layout.svelte:189:    let noScroll = false;
  …/questions/+layout.svelte:210:        noScroll = true;
  …/questions/+layout.svelte:213:    goto(url, { noScroll });
  …/results/[[electionTab]]/+layout.svelte:246:    // `noScroll: true` mirrors the entity-card open path …
  …/results/[[electionTab]]/+layout.svelte:247:    goto(buildListRoute(activeElectionId, _urlPlural ?? _pluralForActiveType()), { noScroll: true });
```

**So the honest pairing is: the same mutation, made on the base branch, is GREEN — and it is green because nothing
looks.** That is what makes the red above mean something. It is not "an old test was weaker"; it is that a voter's
scroll position could be thrown away on every tab switch and the entire E2E suite would have stayed green through
the change, the review and the merge. The three commands above are the demonstration; none of it is asserted.

**Revert:** `git checkout -- '…/[[entityTab=etPl]]/+layout.svelte'` — one named file.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| `git hash-object '…/[[entityTab=etPl]]/+layout.svelte'` | `c8d5cdee997d13b2d8823a6dfe5533ca9b4b72d4` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

**Un-mutated baseline — and the shared post-revert baseline for §§ 10-12 at once:**

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-baseline --no-db-reset --project voter-results-redraw
→ exit 0 ·  7 passed (25.0s) · playwright exit 0 · preflight failures 0, successes 1
```

Read from the run's own JSON rather than from the console line, so "green" is distinguished from "nothing ran":

```
node -e "const r=require('./tests/e2e-runs/165-06-baseline/results.json'); console.log(JSON.stringify(r.stats))"
→ {"startTime":"2026-09-23T17:43:55.383Z","duration":24996.787,"expected":7,"skipped":0,"unexpected":0,"flaky":0}
```

**7 expected, 0 unexpected, 0 flaky, 0 skipped.** Three mutations applied and reverted, and the project is back
exactly where the pre-row baseline found it.

---

## 13. NC-7 — the host's `<svelte:boundary>` FIRES, and A1 is confirmed by measurement

> **Added by `165-06`.** The plan's `NC-5`; see the crosswalk in § 9.

The claim under test — **RESEARCH Assumptions Log A1**, the phase's one remaining open assumption:
`<svelte:boundary>` catches a throw raised during the render flush of `{@render shown.content()}`, which is where
spike 034's crash occurred.

**Why this row had to exist.** D-12 ships two halves. The opener-side convention (`$state.raw` last-defined entity,
kept current by `$effect.pre`) prevents the throw and is verifiable by reading. The boundary in the host prevents the
*hang* if a future opener forgets the convention — and it is **not** verifiable by reading: it is a pattern with
**zero other uses anywhere in this frontend** (`165-PATTERNS.md` § *No Analog Found*), and "it compiles" is not "it
fires". Wave 3 proved only the boundary's *outcome* — that a dismissal ends with no open dialog — on a tree where
nothing made the payload throw. Under this project's standing acceptance rule that is an untested net, not a guard,
and it was logged in `.planning/WINDOWS.md` as an `unrun-verify` for exactly that reason.

**Mutation.** `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` — the convention half
reverted: the `$state.raw` last-defined entity and its `$effect.pre` deleted, and both consumers (the payload snippet
and the payload's `title` getter) pointed back at the incoming prop. This is the shape spike 034 crashed on, so it is
realistic by construction rather than by argument.

```diff
@@ -32,19 +32,12 @@
   const contexts = getAllContexts();
   const key = drawerHost.newKey('entity');

-  // ⚠ The host keeps rendering `content` through its close animation — i.e. AFTER this component is destroyed, when the `entity` prop already reads `undefined` (the parent's `{#if}` went false). Rendering straight from the prop crashes `EntityDetails` mid-flush, which aborts the host's close (spike 034). So the payload renders from the last defined entity, which outlives the prop.
-  // svelte-ignore state_referenced_locally -- seeded once; kept current by the pre-effect below
-  let shownEntity = $state.raw(entity);
-  $effect.pre(() => {
-    if (entity) shownEntity = entity;
-  });
-
   // Opened once per mount; `content` and `title` read the entity reactively, so an A → B navigation that reuses this component just updates the content in the already-open drawer.
   $effect(() => {
     untrack(() =>
       drawerHost.open({
         key,
-        title: () => unwrapEntity(shownEntity).entity.name,
+        title: () => unwrapEntity(entity).entity.name,
@@ -57,5 +50,5 @@
 {#snippet content()}
-  <EntityDetails entity={shownEntity} class="min-h-full" />
+  <EntityDetails {entity} class="min-h-full" />
 {/snippet}
```

**Pre-mutation hash:** `9f6b76c63836d1d89e19f9ec0694f180ec1664e8`
(`git hash-object apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte`.)

**Instrument:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc7-boundary --no-db-reset --project voter-results-redraw`
The case that matters is the teardown contract's second step — *a dismissal always ends with no open dialog, even
though the opener is destroyed mid-close* — which asserts `role=dialog` resolves to zero after an Escape.

### 13a. The outcome, named from the three the plan enumerated

**Outcome 1 — the close case stayed GREEN *and* the boundary's error handler was observed to have run.** Exit code 0,
`7 passed (24.7s)`, `playwright exit 0 · preflight failures 0, successes 1`.

Green alone could not distinguish "the boundary caught it" from "the throw never happened", which is why the plan
required the firing to be *observed*. It was — through the `forensicCapture` fixture, which attaches every browser
`console` message and every uncaught `pageerror` to the test result. The boundary's `onerror` handler calls
`log.error('DrawerHost payload failed to render: …')`, so its firing is directly readable in the run's own JSON:

```
[2026-09-23T17:47:30.129Z] pageerror: Cannot read properties of undefined (reading 'name')

	in <unknown>
	in +layout.svelte
	in root.svelte
	in undefined

[2026-09-23T17:47:30.129Z] error: {level: 50, time: 1790185650123, msg: DrawerHost payload failed to render: Cannot destru… 'type' of 'unwrapped.entity' as it is undefined., severityText: ERROR}
```

The pair appears in **three of the five** console transcripts in the run — the scroll-survival test, the
view-transition test and the teardown test, i.e. every test that drives a dismissal:

```
node -e "…read results.json, decode each console.log attachment, print lines matching /pageerror|DrawerHost payload/…"
→ 6 matching lines across 3 of 5 transcripts
```

### 13b. The discriminating control — the firing is not a constant

"The boundary fired" is worthless as evidence unless it is *absent* when the convention is present. The same
extraction, run against three other runs of the same project on the same stack:

| Run | Tree | Transcripts | Lines matching `pageerror` or `DrawerHost payload` |
|---|---|---|---|
| `165-06-pre-baseline` | un-mutated | 5 | **0** |
| `165-06-baseline` | un-mutated (post §§ 10-12 reverts) | 5 | **0** |
| `165-06-nc4-overlay-skip` | a DIFFERENT mutation (§ 10) | 5 | **0** |
| `165-06-nc7-boundary` | this mutation | 5 | **6** |

The boundary never fires in normal operation, and it does not fire for an unrelated injected regression. It fires
precisely when the convention it backstops is removed — and with it firing, the close assertion stays green.

**Verdict on A1: CONFIRMED by measurement, not assumed.** The boundary catches a throw raised during the render flush
of the hosted payload and force-closes the dialog; the `unrun-verify` entry this row was opened to discharge is
discharged. D-12's second half is a guard, not a decoration.

### 13c. A second throw ESCAPES the boundary, and it is recorded rather than buried

The transcript above carries **two distinct errors**, not one, and only one of them is caught:

| Error | Message | Raised by | Caught? |
|---|---|---|---|
| Payload render | `Cannot destructure 'type' of 'unwrapped.entity' as it is undefined` | `unwrapEntity` inside `EntityDetails`, i.e. inside `{@render shown.content()}` | **Yes** — it is the message the boundary's own handler logged |
| Title getter | `Cannot read properties of undefined (reading 'name')` | the payload's `title()` getter, `unwrapEntity(entity).entity.name` | **No** — it surfaces as an uncaught `pageerror` |

The reason is structural and visible in the host's markup: the boundary wraps the **panel contents**
(`DrawerHost.svelte`, the `<svelte:boundary>` around `ContextBridge` + `{@render shown.content()}`), while the payload's
title is read in the dialog element's own `aria-label={shown?.title()}` binding — **outside** it.

**What this does and does not mean.** In this measurement it changed nothing: the boundary's `forceClose()` ran and the
dialog closed, so the close case passed. It is not claimed to be a live defect — reaching it requires an opener that
has already violated D-12's convention, which is the state this entire row had to manufacture. But it is a **named
gap** in the net: a hypothetical payload whose `title()` throws while its `content()` renders cleanly would never enter
the boundary at all. Recorded here, and filed in this phase's `deferred-items.md`, rather than quietly fixed inside a
negative-control row whose whole purpose is to leave the tree unchanged.

### 13d. Revert, proven three ways

`git checkout -- apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` — one named file.

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps` | **exit 0** |
| `git hash-object '…/EntityDrawerOpener.svelte'` | `9f6b76c63836d1d89e19f9ec0694f180ec1664e8` — **identical to the pre-capture** |
| `git status --porcelain apps packages tests` | **0 lines** |

### 13e. The un-mutated baseline

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-06-nc7-baseline --no-db-reset --project voter-results-redraw
→ exit 0 ·  7 passed (24.7s) · playwright exit 0 · preflight failures 0, successes 1

node -e "const r=require('./tests/e2e-runs/165-06-nc7-baseline/results.json'); console.log(JSON.stringify(r.stats))"
→ {"startTime":"2026-09-23T17:48:32.069Z","duration":24729.887000000002,"expected":7,"skipped":0,"unexpected":0,"flaky":0}
```

---

## 14. The seven rows, side by side

| § | Row | Injected regression | Instrument | Verdict | Pairing half |
|---|---|---|---|---|---|
| 7 | **NC-1** — loader `untrack` | the pre-fix tracked `url.pathname` / `url.search` read restored in `(located)/+layout.ts`, byte-compared against the base branch | `yarn workspace @openvaa/frontend test:unit layout.tracking` | **RED**, exit 1 — 4 failed / 1 passed | no instrument existed on the base branch |
| 8 | **NC-2** — `AccordionSelect` reconciliation | the `165-05.1` change reverted, measured over a 16-run bar | the phase project, 4 arms × 16 runs | **RED** (arm-level), with the abandoned first attempt reported in full | see § 8b-8e |
| 9 | **NC-3** — the standing scaffolding guard | 4 injections: a scaffolding import; a marker comment with **no** import; a `results-layered` route directory; a mis-rooted walk | `yarn workspace @openvaa/frontend test:unit spike-scaffolding` | **RED ×4**, exit 1 each | no instrument existed on the base branch |
| 10 | **NC-4** — overlay VT skip | the `isOverlayNavigation` early return deleted from the root layout's `onNavigate` | the phase project via the preflight-confirmed wrapper | **RED**, exit 1 — a transition recorded for an `entity`+`id` navigation, 4 named groups | no instrument existed on the base branch |
| 11 | **NC-5** — name strip | the `!important` **dropped** (not the rule deleted) from `html.vt-no-names *` | same | **RED**, exit 1 — `noNames: true` yet **five** names returned | no instrument existed on the base branch |
| 12 | **NC-6** — `noScroll` | the option dropped from the organizations branch of the entity-tab handler | same, its scroll-survival case | **RED**, exit 1 — offset 0 where the baseline was 171 | **GREEN on the base branch, demonstrated**: the construct exists there and no scroll assertion exists anywhere in its suite |
| 13 | **NC-7** — the host's `<svelte:boundary>` | D-12's opener-side convention reverted to a bare prop read | same, its dismissal case | **GREEN + boundary observed firing** (outcome 1 of the three named) — 6 error lines vs **0** in three control runs | wave 3 proved the outcome only; nothing had ever made the payload throw |

**Six product fixes, seven rows, eleven injections, and not one of them left behind.**

---

## 15. Verdict — evidence mapped to ROADMAP Phase 165's six criteria

| Criterion | What this document establishes | What it does NOT establish |
|---|---|---|
| **1. No results navigation remounts the results subtree** | § 7: the `layout.tracking` guard is real — the pre-fix loader body makes it fail with the exact tracked-read fingerprint spike 031 attributed the redraw to, and its own in-file positive control stays green under the same mutation | that no *other* cause reruns the load; D-03's residue below is the named exception |
| **2. Scroll is preserved** on open, close and tab switch, from a scrolled start | § 12: dropping `{ noScroll: true }` from one branch takes the offset from 171 to 0, and the step's hard-asserted scrolled start held, so the equality was not vacuous | the maximum-scroll clamp (deferred item D-165-03-01) — measured, mechanism not isolated, deliberately not asserted |
| **3. No document VT paints above an open modal** | §§ 10 and 11, the two halves separately: deleting the overlay exemption records a transition for an `entity`+`id` navigation with four named groups; dropping the `!important` returns five names while the strip class is still applied | that the visual result is correct to a human eye — that is the visual-regression project's instrument (D-19), not this one |
| **4. Results routes follow the layout**, existing URLs keep working, implied-default does not remount | the URL-shape and implied-default cases executed green in all **nine** wrapper runs recorded here, but no row injects a regression against them | **no negative control was taken for criterion 4.** D-17 scopes its pairs to the four *fixes*; the route split is structural and its guard is the spec's own vacuity assertions. Stated as a gap rather than papered over |
| **5. One app-wide drawer host**, content swaps without reopening, hosted content safe against its opener unmounting | § 13: A1 confirmed — the boundary fires, is observed firing, and does not fire in three control runs. The swap-not-reopen assertion executed green throughout | the extended-question-info half of criterion 5 (D-13) is exercised by `perm-interactive-info`, a different project, not measured in any row here |
| **6. The spike scaffolding is gone** | § 9: the standing guard exists, clears a non-vacuity floor derived at write time, and was observed failing against four distinct realistic reintroductions — including the marker-only one an import-only guard would have missed | it guards `apps/frontend/src` only. `.planning/spikes/` keeps the spike's records and probes on purpose (D-21), and the unmerged `spike/results-redraw` branch still exists as the reproduction rig (D-02) |

---

## 16. What is explicitly NOT discharged by this document

Stated in terms, because a negative-control document that implies more than it measured is worse than one that
measures less.

1. **The visual and accessibility gates are separate instruments, taken in a later plan.** Nothing here runs the
   `visual-regression` project or the axe smoke scan. D-19 requires the visual project to run **first** and baselines
   to be re-captured only when a diff is explained by an intended change, in
   `mcr.microsoft.com/playwright:v1.58.2-noble --platform linux/amd64` and never on a developer Mac. That did not
   happen in this plan, and the ENOSPC precondition D-19 names is not discharged here either.
2. **The cold-`/results` hazard (§ 2c) is measured, not fixed.** The verdict recorded there is **NOT REPRODUCED** —
   an absence observed under one specific cold entry on one HEAD, explicitly not a proof that the defect is fixed.
   Its cause lives in `apps/frontend/src/lib/supabase/server.ts` and `hooks.server.ts`, neither of which this phase
   touches, and `.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md` is deliberately
   left **pending**.
3. **D-03's named residue stands, and is accepted rather than overlooked.** The loader untrack fix removes the
   *params* cause of the rerun. A load rerun arriving from some **other** cause — a locale change, an explicit
   `invalidate()` — still collapses the `(located)` subtree to `<Loading/>`. D-03 accepted this in terms when it chose
   one mechanism in one place over the `keepReady` stale-while-revalidate path, and § 7's row does not and cannot
   speak to it: its instrument asserts what the load *reads*, not what happens when something else reruns it.
4. **Criterion 4 has no negative control** (see § 15). D-17 pairs the four fixes; the route split is structural.
5. **The document View Transition still intercepts pointer events on `<html>` for ~235-256 ms** during a transition.
   `165-05.1` closed the EQTYP-02 regression by removing the *state* that was racing that interception, not the
   interception itself, and filed the residue in this phase's `deferred-items.md`. Every run recorded in §§ 10-13 was
   green with the interception live; if a later click turns flaky, this is the first thing to look at.
6. **The maximum-scroll clamp (deferred item D-165-03-01) is a hypothesis, not an isolated mechanism.** No run has
   compared `scrollHeight` across the drawer open with `content-visibility: auto` removed.
7. **The title-getter gap found in § 13c is named, not fixed.** The host's boundary does not wrap the payload's
   `title()` read, which happens in the dialog's own `aria-label` binding.

---

## 17. Reproducibility and non-contamination

**Database state, per row.** Every wrapper invocation in §§ 10-13 carried `--no-db-reset`, so **one** Supabase stack
served all nine runs and only the dev server was recycled between them. The suite creates and owns its own project
(`00000000-0000-0000-0000-0000000000e2`) through the `data-setup-base` dependency project, which imports the
`e2e/base` dataset before each run and tears it down after, so no row inherited another row's data. § 9's four
injections need no database at all — they are vitest runs against the filesystem.

**Free space, checked inside the container runtime rather than on the host alone**, because this project has recorded
an ENOSPC condition *voiding* a run rather than reddening it: `overlay 103G 83G 15G 86% /` inside
`supabase_db_openvaa-local`, with 218 GiB free on the host.

**Every run was preflight-confirmed.** All nine wrapper invocations printed
`preflight failures 0, successes 1` — a *positive* assertion that the served application came from this working tree
and queries the project the suite seeds, not merely an absence of failures. No row's verdict rests on a run that
might have been driving a different checkout.

**Exit codes were read from `$?` on the command itself**, with output redirected to a file, for every measurement in
this plan. Never through a pipe: a pipeline reports its last stage's status, which would have made every verdict here
the exit code of `sed` or `tail`.

**No row left a mutation behind.** Eleven injections were applied and reverted across §§ 9-13:

| Row | Files mutated | Revert form |
|---|---|---|
| § 9 | 3 scratch files/directories created; 1 line of the guard itself edited | `rm` for the created ones (never tracked, so nothing to check out); `git checkout -- <one named file>` for the guard |
| § 10, § 11 | `apps/frontend/src/routes/+layout.svelte` (twice, separately) | `git checkout -- <one named file>` |
| § 12 | `…/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` | `git checkout -- <one named file>` |
| § 13 | `…/entityDetails/EntityDrawerOpener.svelte` | `git checkout -- <one named file>` |

**Never a `git clean`, never a blanket `git checkout -- .`, never a `git stash`.** Each revert was proven three ways
at the point it was taken — a scoped `git diff --exit-code`, a hash equal to the pre-capture, and an empty
`git status --porcelain apps packages tests` — and the whole set is re-proven at the close of this plan by the full
unit, type-check, lint and phase-project gates run on the restored tree, recorded in `165-06-SUMMARY.md`.

---

## Gates — § 18: the phase gate, every instrument at one head

Plan `165-07`. The section keeps this document's running numbering (§ 18, after § 17) while carrying the
literal heading the plan's acceptance check greps for. Rows are cited as **G-1 … G-n** so they cannot
collide with the NC-numbering of §§ 7-13.

Everything below obeys the same three rules the rest of this document obeys, restated because a gate
section is exactly where they are easiest to skip:

1. **Every exit status is read from the command itself**, with output redirected to a file and `$?` read
   separately. Never through a pipe — a pipeline reports its LAST stage's status, and this project has
   recorded two commits of hidden lint violations produced by exactly that mistake.
2. **Every turbo-backed gate is forced** (`TURBO_FORCE=true`). An unforced task can replay a cache entry
   taken before the edits under test and report green without measuring anything. The `Cached: 0 cached`
   line is recorded beside each one as the proof that it did not replay.
3. **Counts, not verdicts.** A gate recorded as "green" with no counts beside it is not a record.

### 18a. The head the static gates were taken at, and why it is not the head the plan started from

| | |
|---|---|
| Head at plan start | `5b9cb3d3a9f05bc326fee4291e0ca6e6cac400a8` |
| **Head the recorded static run was taken at** | **`1718a2d30db67ebf81a68bf13740a17c6d55738a`** |
| Head after the recorded run | `1718a2d30db67ebf81a68bf13740a17c6d55738a` — **equal**, so the run does not straddle a commit |
| Working tree during and after | `git status --porcelain` empty |

The head moved because **the first attempt at this chain came back RED at its third link**, and the plan's
own instruction for that case is to fix the cause rather than the gate and re-run the whole chain from the
top at the new head. A partially re-run chain is not a gate. The chain was therefore run **three times in
full**; only the third is the record, and the first two are reported below rather than deleted, because a
gate section that hides its own red attempts is the thing this document exists not to be.

#### The red, and what it was

`yarn format:check` exited **1** at `5b9cb3d3a`, naming **13 unformatted files**. The first thing done with
that number was to partition it, because "the format gate is red" and "this phase broke the format gate"
are different claims:

| Partition | Count | How established |
|---|---|---|
| Files **this phase touched** | **2** | `page.guards.test.ts` (165-04) and `voter-results-redraw.spec.ts` (165-03), both present in `git diff --name-only 4d023c587..HEAD` |
| Files **untouched by this phase**, already unformatted at the phase base | **11** | `git diff --quiet 4d023c587 HEAD -- <file>` clean for each, **and** `git show 4d023c587:<file> \| prettier --check --stdin-filepath <file>` reports each unformatted at the base blob |

So `yarn format:check` was **already red before phase 165 began**. The 11 are v2.15 integration-branch debt
this gate run *surfaced* rather than *caused* — and none of them exists on `main` at all, so the debt is the
branch's, not the repository's.

They were nevertheless fixed rather than deferred, for one reason that is not discretionary: `format:check`
is repo-wide and **CI runs it globally** (`.github/workflows/main.yaml`, step *"Run Prettier check
globally"*), so the branch cannot ship with them red and this phase's gate cannot be recorded green while
they stand. They are committed **separately** from the two that are ours, and the commit message says in
terms that they are not phase-165 changes.

Before writing, every one of the 13 reformats was proven semantics-preserving by comparing the file and its
prettier output **with all whitespace stripped**:

- **11 of 13** — byte-identical once whitespace is removed: pure reflow.
- **2 of 13** — `supabaseAdminWriter.test.ts` and `requireAdminIdentity.test.ts` additionally switch one
  test-description literal each from a single-quoted string carrying an escaped apostrophe to a
  double-quoted string. The string **value** is unchanged in both; only the escape disappears.
- The four `.sql` files in the set have no pgTAP run in this plan's chain, so their diffs were read line by
  line as well. Reflow only: no token added, removed or reordered.

#### The second red — a guard the reformat itself tripped, which is the argument for re-running the whole chain

The second full run of the chain came back green at links 1 and 3 and **RED at link 2**: `yarn lint:check`
exited **1**. The cause was the reformat from the previous paragraph. Prettier reflowed one statement in
`apps/supabase/supabase/schema/300-auth-tables.sql`:

```
-GRANT SELECT ON TABLE public.grants TO supabase_auth_admin;
+GRANT
+SELECT
+  ON TABLE public.grants TO supabase_auth_admin;
```

which desynchronised the **generated** `apps/supabase/supabase/migrations/00001_initial_schema.sql`. The
schema-migration parity guard inside `lint:check` caught it by name, printed the first differing line
(1509) with both sides, and named its own remedy. That remedy was run — `yarn schema:regenerate` — and its
whole diff is the same three-line reflow of the same one statement, reviewed as a diff and committed in the
commit that follows the schema edit, per D-17.

This is the concrete justification for the plan's "re-run the whole chain from the top" rule. Had the
format fix been applied and only `format:check` re-run, the chain would have been recorded green while a
stale generated migration sat in the tree.

### 18b. G-1 … G-6 — the recorded static run

All six taken at `1718a2d30`, in this order, each status read from the command.

| Row | Command, verbatim | Exit | Counts |
|---|---|---|---|
| **G-1** | `TURBO_FORCE=true yarn test:unit` | **0** | **257 test files, 3319 tests, all passed.** Turbo: `Tasks: 25 successful, 25 total` / `Cached: 0 cached, 25 total` — nothing replayed. Per workspace: supabase 15/170, core 3/8, matching 5/43, data 47/244, filters 1/22, app-shared 10/95, llm 2/39, question-info 2/22, argument-condensation 6/30, dev-seed 60/795, frontend 106/1851 |
| **G-2** | `TURBO_FORCE=true yarn lint:check` | **0** | Two turbo invocations inside the script: `Tasks: 11 successful, 11 total` / `Cached: 0 cached` and `Tasks: 23 successful, 23 total` / `Cached: 0 cached`. **11 standing repo guards reported `0 violation(s)`**, each with its own scanned population — the populations are what make a `0` non-vacuous. Comment hygiene: **1721 files scanned**, 2 vendored excluded by name, 2 of 2 rules live. Edge-function env defaults: 31 files, 3 of 3 checks live. Declared binaries: 16 workspaces, 20 invocations. Env-pair registry: 31 Deno + 1424 frontend files, 4 pairs derived, 35 `.env.example` assignments. Adapter-boundary casts: 30 files / 7517 lines. Cookie names: 824 files. No-session-in-loads: 12 modules / 532 lines, self-test flagging its 5 expected lines. Grant-enum census 4/4/4, 2/2/2, 23/23/23 with a 7-of-7 self-test. Edge-function required-env: 16 files, 10 names. i18n namespaces: 595 keys (159/121/315). Schema-migration parity: 26 schema files → 5984 lines, matching the generated migration exactly |
| **G-3** | `yarn format:check` | **0** | `All matched files use Prettier code style!` — against the 13 recorded above. Prettier 3.7.4. Not turbo-backed beyond its `app-shared` build prefix, so nothing to force |
| **G-4** | `TURBO_FORCE=true yarn build` | **0** | `Tasks: 14 successful, 14 total` / `Cached: 0 cached, 14 total`, 19.533 s. **14 build tasks** — every package plus the two apps; a real compile, not a cache hit |
| **G-5** | `yarn workspace @openvaa/frontend check` | **0** | `COMPLETED 2780 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. The script carries `--fail-on-warnings`, so the zero in the warning column is enforced, not merely observed |
| **G-6** | `TURBO_FORCE=true npx turbo run typecheck` | **0** | `Tasks: 23 successful, 23 total` / `Cached: 0 cached, 23 total`. `svelte-check found 0 errors and 0 warnings` for **both** `@openvaa/frontend` and `@openvaa/docs`. `Tasks: 0 successful` would have meant the run matched no task and measured nothing; 23 is the refutation of that |

**Zero red links, zero cache replays, one head, clean tree.** `Cached: 0 cached` appears on all four
turbo-backed rows, which is the positive form of the forcing claim — `TURBO_FORCE=true` in the command is
the intent, the `0 cached` line is the evidence it took effect.

### 18c. The heads, and why two of them are still "one head"

| Gate group | Head |
|---|---|
| Static chain (G-1 … G-6) | `1718a2d30db67ebf81a68bf13740a17c6d55738a` |
| E2E full suite and accessibility scan (G-7, G-8) | `9536af4e7370101b88f124120b720537e31f8e2a` |

`git diff --name-only 1718a2d30 9536af4e7` returns **exactly one path**, and it is this document. Zero
product source, zero test source, zero configuration differs between the two. The plan's "one head"
requirement is about the tree under test, and the tree under test is byte-identical across both. Stated
rather than glossed, because "two heads" and "two trees" are different claims and only the second would
matter.

### 18d. G-7 — the full E2E suite under the cardinal rule

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-07-full-suite --no-db-reset
```

**Exit 0.** Run directory: **`tests/e2e-runs/165-07-full-suite/`**.

| Field | Value |
|---|---|
| Playwright exit | `0` (`tests/e2e-runs/165-07-full-suite/exit`) |
| Preflight | **failures 0, successes 1** — a *positive* confirmation, not an absence. `E2E PREFLIGHT OK … verified against /Users/…/voting-advice-application-spike` and `E2E SERVED PROJECT OK 00000000-0000-0000-0000-0000000000e2` |
| Head stamped by the wrapper | `9536af4e7370101b88f124120b720537e31f8e2a` |
| Working tree at run start | `worktree-status.txt` **empty**; `dirty_files=0` |
| Wall clock | `2026-09-23T18:28:53Z` → `2026-09-23T18:40:09Z`; Playwright reports **11.1 m** (664,192 ms) |
| Posture | `ci_env=unset`, `eperm07_knobs=unset`, `observed_retries=0`, `observed_workers=6`, port 5273 |

**All five counts, because the cardinal rule turns on the four that are not "passed":**

| Count | Value | How derived |
|---|---|---|
| **expected (passed)** | **171** | `results.json` → `.stats.expected` |
| **unexpected (failed)** | **0** | `.stats.unexpected` |
| **flaky** | **0** | `.stats.flaky`. With `observed_retries=0` there was no retry budget for a flake to hide in — a test either passed on its first attempt or failed the run |
| **skipped** | **0** | `.stats.skipped` |
| **did not run** | **0** | Derived, not read off a field, because Playwright has no such field. **171 specs enumerated; 171 test objects; 0 of them carry an empty `results` array; 171 result records in total.** Enumerated minus executed is zero, so no test was collected and then never attempted, and no project cascade-skipped behind an upstream failure |

`171 passed (11.1m)`, zero in all four of the others, across **100 distinct Playwright projects** —
including the whole serial `perm-*` dependency chain, where a single upstream failure would have cascaded
into a wall of did-not-run cells. It did not.

**`--no-db-reset`, and why the run is still "from a known state".** The plan's action text asks for a
database reset. This run was taken with `--no-db-reset` instead, on the operator's explicit instruction
for this host, and the substitution does not weaken the run:

- The suite **creates and owns its own project** (`00000000-0000-0000-0000-0000000000e2`). The
  `data-setup-base` dependency project imports the `e2e/base` dataset at the head of the run and
  `data-teardown-base` removes it at the tail — both are *inside* the 171 and both passed. The known
  state the plan wants is supplied by the dependency graph, not by the reset.
- `CLAUDE.md` says so in terms: *"the suite creates and owns its own project, so clearing the database is
  **not** a precondition of a run"*.
- The project has a **recorded** storage-502 wedge behind `db:reset` on this host, and all nine wrapper
  runs recorded in §§ 10-13 of this document were taken the same way. This run is therefore consistent
  with the instrument the rest of the document used, rather than a lone variant.

### 18e. G-8 — the accessibility scan

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-07-a11y --no-db-reset --project a11y-smoke
```

**Exit 0.** Run directory: **`tests/e2e-runs/165-07-a11y/`**. Preflight failures 0, successes 1. Head
`9536af4e7`. 45 s wall clock.

| Count | Value |
|---|---|
| expected | **18** |
| unexpected | **0** |
| flaky | **0** |
| skipped | **0** |
| did not run | **0** (18 test objects, 0 with an empty `results` array) |

18 = **16 `a11y-smoke` tests** plus the `data-setup-base` / `data-teardown-base` pair its dependency
graph pulls in. The executed count is non-zero and the scan project itself contributed 16 of it, so this
is not a vacuous green.

**Why this is a measurement and not a formality.** This phase replaced the per-route drawer with the
app-wide host, and four of the sixteen scans land directly on that replacement:

| Scan | What it covers |
|---|---|
| `results` / `results (dark)` | the results list route whose layout this phase split across three files |
| `voter-detail-drawer` / `voter-detail-drawer (dark)` | **the entity drawer — opened by clicking the first entity card and waited for as `role=dialog`.** This is the surface `DrawerHost.svelte` now renders. The focus entry, the modal role and the accessible name are all inside this scan's subtree |
| `results-filter-drawer` / `results-filter-drawer (dark)` | the filter dialog on the same route, every filter row expanded |
| `navigation-a11y — route announcer is route-derived`, `navigation-a11y — focus lands on heading after Q→Q nav` | the route announcer and post-navigation focus, i.e. exactly the a11y half of the view-transition work |

Zero violations on all of them, in both themes. **No violation was absorbed into the scan's
configuration**: `tests/tests/specs/a11y/a11y-smoke.spec.ts` and the shared
`tests/tests/utils/axeScan.ts` are untouched by this phase (`git diff 4d023c587..HEAD` lists neither), so
the scan that returned zero is the same scan, at the same strictness, that held the contract before the
drawer was replaced.

**One honest qualification.** `a11y-smoke` is **default-on** — it is already one of the 100 projects
inside G-7's 171. G-8 is therefore an *isolating re-run*, not additional coverage: its value is that it
reports the scan's own counts separately instead of leaving them inside a 171-wide aggregate. It is
recorded as a second row rather than presented as a second instrument.

### 18f. What G-7's green does NOT mean

Restating three live items from § 16 so a reader who arrives at a green suite does not read more into it
than it carries:

1. **The document View Transition still intercepts pointer events on `<html>` for ~235-256 ms** during a
   transition (WINDOWS 278). `165-05.1` closed the EQTYP-02 regression by removing the *state* that was
   racing that interception — **not** the interception. This suite is green with the interception live, on
   this host, at this load (`load_at_start=10.39/13.22/12.22`, 14 CPUs, 6 workers). A slower host could
   still exceed the 2 s click budget. Green here is not a proof of absence.
2. **A second throw still escapes the host's `<svelte:boundary>`** — the payload's `title()` getter is
   read in `DrawerHost.svelte`'s own `aria-label` binding, outside the boundary (WINDOWS 279 /
   `D-165-06-01`). Not reachable without an opener that already violates D-12's convention, which is why
   no test here fails; a named gap in the net, not a closed one.
3. **The view-transition skip path has still never been TAKEN.** No run in this phase — this one included
   — has made `document.startViewTransition` absent or `prefers-reduced-motion: reduce` true. "It skips
   rather than fails" remains true **by construction** and is not covered by any row in this document.

And the gap § 15 already states: **criterion 4 (the route split) has no negative control.** D-17 scoped
its pairs to the four fixes; the split is structural, and its guard is the spec's own vacuity assertions.
G-7 exercises criterion 4 for the tenth consecutive wrapper run without a single red, but exercising is
not the same as injecting, and this document does not claim otherwise.

### 18g. G-9 — the visual regression project, in the pinned container (D-19)

Run **before any thought of re-capturing**, per D-19: the result of the run is the input to the
judgement, not the other way round. No `--update-snapshots` flag of any form was passed.

```
tests/scripts/visual-container.sh --run-dir tests/e2e-runs/165-07-visual
```

**Exit 0.** Run directory: **`tests/e2e-runs/165-07-visual/`**.

#### Provenance — recorded because a baseline whose provenance is unrecorded cannot be told from a developer-Mac capture

| Field | Value | Source |
|---|---|---|
| Container image | `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d` | `docker-argv.txt` |
| …which is the tag | `mcr.microsoft.com/playwright:v1.58.2-noble` | `image-inspect.json` → `.RepoTags` |
| Platform flag | `--platform linux/amd64` | `docker-argv.txt` |
| Image architecture / OS | `amd64` / `linux` | `image-inspect.json` |
| **Architecture observed INSIDE the container** | `uname_m=x86_64` | `provenance.txt` — the host is an arm64 Mac, so this is the positive proof the amd64 platform flag took effect rather than being silently ignored |
| Container OS | `Ubuntu 24.04.3 LTS` (noble) | `provenance.txt` |
| Node in container | `v24.13.0` | `provenance.txt` |
| Docker | `29.7.2` | `docker-version.txt` |
| Config | `tests/playwright.config.ts` — the **shipped** configuration, no measurement overlay | `pw-args.txt` |
| Invocation | `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json` | `pw-args.txt` |
| Preflight | `E2E PREFLIGHT OK … verified against /Users/…/voting-advice-application-spike` and `E2E SERVED PROJECT OK 00000000-0000-0000-0000-0000000000e2` | `stdout.log` |

`visual-container.sh` **refuses to pull** (exit 4 if the pinned digest is absent), so the image used is
provably the one already present locally at that digest, not a tag that re-resolved.

**Free space, measured inside the container runtime rather than on the host alone**, because D-19 records
that an ENOSPC condition *voids* a run rather than reddening it, and a voided run is not evidence either
way. Measured immediately before the run:

```
overlay  103G  82G  16G  85% /      (inside supabase_db_openvaa-local)
/dev/disk3s1s1  926Gi  12Gi  219Gi  6%  /   (host)
```

**16 GiB free inside the runtime, 219 GiB on the host.** The 2.39 GB pinned image was already resident,
so the run added no image pull to that budget. No no-space condition occurred, and the run is evidence.

#### Result

| Count | Value |
|---|---|
| expected | **7** |
| unexpected | **0** |
| flaky | **0** |
| skipped | **0** |
| did not run | **0** (7 test objects, 0 with an empty `results` array) |

7 = the **4 baselines** plus `data-setup-base`, `auth-setup` and `data-teardown-base`. Per baseline:

| Baseline | Result |
|---|---|
| `voter-results-desktop.png` (1280×720 viewport, full page) | **matched** |
| `voter-results-mobile.png` (390×844, `isMobile`) | **matched** |
| `candidate-preview-desktop.png` | **matched** |
| `candidate-preview-mobile.png` | **matched** |

#### Disposition — there is nothing to dispose of

**No baseline differed.** Stated explicitly with the run's exit code, as the plan's acceptance criterion
requires for this case: **exit 0, 4 of 4 baselines matched, 0 diff images produced.**

Consequently:

- **No baseline was re-captured.** Not on a developer Mac, not in the container, not at all.
- **No operator disposition was required**, because D-19's judgement has no subject: it decides between
  *re-capture* and *investigate* for a **differing** baseline, and there is no differing baseline.
- `git status --porcelain tests/tests/specs/visual/` is **empty** after the run — the four `.png` files on
  disk are untouched, which is the mechanical proof that nothing was rebased. `git status --porcelain
  apps packages` is empty too: the visual run left no product source modified.

**Why zero is the expected result here, rather than a suspicious one.** The plan named two plausible
sources of intended visual change and both were checked against the actual capture:

1. **The results layout split (D-07/165-04)** moved markup nesting *between three route files*. SvelteKit
   composes nested layouts into one rendered document, so a split that preserves behaviour also preserves
   the rendered DOM — which is exactly what the phase claimed and what §§ 7 and 12 measured by other
   means. A zero diff is the *prediction* of that claim, not a surprise.
2. **The drawer host (165-02/165-05)** replaced the per-route drawer. It does not appear in any baseline
   **because no baseline captures an open drawer** — both voter baselines screenshot the results list with
   no overlay showing.

That second point is a **limit of this instrument and is recorded as one**: G-9's green says nothing about
how the drawer host *looks*. The drawer's appearance is covered here only indirectly, by G-8's axe scans
of `voter-detail-drawer` in both themes — which measure conformance, not appearance. If anyone wants a
visual guarantee on the host's rendering, it needs a fifth baseline that this phase did not add.

**Why a green here is a measurement and not a blind pass.** The standing acceptance rule asks that a check
be observed failing before it is claimed to guard. This gate has been: `VGATE-01` in Phase 146 recorded the
`MatchScore.svelte` `text-lg → text-2xl` injection caught on **both** voter baselines at **23.9× and 24.2×**
the configured cap, and `VGATE-03` derived that cap from a 40-cell noise matrix that measured **0 in all
40 cells**. The instrument's sensitivity is therefore established evidence, carried forward rather than
re-derived — this plan adds no new injection for it, and D-17 did not ask for one.

---

## Gate verdict

Nine rows, one tree, every status read from the command that produced it.

| Row | Gate | Exit | The number that matters |
|---|---|---|---|
| G-1 | `TURBO_FORCE=true yarn test:unit` | 0 | 257 files / 3319 tests; `0 cached` of 25 |
| G-2 | `TURBO_FORCE=true yarn lint:check` | 0 | 11 standing guards at `0 violation(s)`, each with its scanned population; `0 cached` of 11 and of 23 |
| G-3 | `yarn format:check` | 0 | all matched files conform, after 13 were fixed |
| G-4 | `TURBO_FORCE=true yarn build` | 0 | 14 build tasks, `0 cached` |
| G-5 | `yarn workspace @openvaa/frontend check` | 0 | 2780 files, 0 errors, 0 warnings, `--fail-on-warnings` |
| G-6 | `TURBO_FORCE=true npx turbo run typecheck` | 0 | 23 tasks, `0 cached`, svelte-check 0/0 twice |
| G-7 | full E2E suite via the wrapper | 0 | **171 / 0 / 0 / 0 / 0**, preflight successes 1, 100 projects |
| G-8 | `a11y-smoke` via the wrapper | 0 | 18 / 0 / 0 / 0 / 0, of which 16 are the scan's own |
| G-9 | `visual-regression` in the pinned amd64 container | 0 | 7 / 0 / 0 / 0 / 0; 4 of 4 baselines matched, 0 re-captured |

**Zero red links. Zero cache replays. Zero did-not-run cells.** The phase's cardinal rule is discharged
with all five counts stated rather than with a passed count alone.

**And the four things this verdict still does not cover**, carried from § 16 unchanged rather than quietly
dropped now that everything is green: the live ~235-256 ms pointer interception on `<html>` (WINDOWS 278);
the `title()` throw that escapes the host boundary (WINDOWS 279); the view-transition **skip path**, which
no run in this phase has ever taken; and **criterion 4, which has no negative control at all**.

---

## Residue accepted by this phase

Collected here so a later reader finds them together instead of reconstructing them from eight plan
summaries. **Each of these was accepted deliberately.** None is an oversight, and none is closed.

This section is about costs the phase **chose**. It does not replace § 16 (*What is explicitly NOT
discharged by this document*) or § 18f (*What G-7's green does NOT mean*), which are about limits of
the **evidence** rather than choices about the product; those two stand unchanged and unabsorbed.

- **The load-rerun collapse (D-03).** The phase ships the `untrack` fix alone and **deletes** the
  stale-while-revalidate alternative (`keepReady`) rather than keeping both. The fix removes the
  *params* cause of the rerun — and only that cause. A load rerun arriving from somewhere else — a
  locale change, an explicit `invalidate()` — still flips `(located)/+layout.svelte`'s `ready` flag
  and collapses the located subtree to `<Loading/>`. D-03 chose one mechanism in one place over a
  second caching layer, in terms, and § 7's row cannot speak to this: its instrument asserts what
  the load *reads*, not what happens when something else reruns it. Accepted, not overlooked.
- **The deliberate scroll asymmetry (D-15).** Entity open, entity close and entity-tab switch keep
  scroll; an **election change** keeps the default scroll-to-top, because switching election replaces
  the whole list with content the voter has not seen and landing mid-list in it is disorienting.
  **Accepted cost:** it reads as inconsistent beside the tab behaviour one level down. That is
  precisely why the absence of `{ noScroll: true }` carries a comment at the site
  (`results/[[electionTab]]/+layout.svelte`) saying it is deliberate rather than an oversight — the
  next reader's first instinct will be to "fix" the inconsistency.
- **The abandoned `redrawLab` local-storage key.** The lab wrote one `localStorage` key —
  `redrawLab`, from `lib/spike/redrawLab.svelte.ts` — into the browser profile of every developer who
  used it. The module is deleted, so **nothing reads the key after this phase**; it is inert rather
  than harmful, and there is no migration. It is recorded here for one reason: so that a future
  "why is there a `redrawLab` key in my profile, and is something still reading it?" has a written
  answer instead of an investigation. It was the lab's only persisted artefact
  (`165-RESEARCH.md` § *Runtime State Inventory*).
- **The deleted drawer-first source-order comment.** The results layout carried a comment asserting
  that the drawer is rendered before the main content so that it paints first on a cold deeplink.
  Under the app-wide host that claim is **false**: a modally-opened `<dialog>` sits in the top layer
  and paints above the document regardless of where its opener appears in source order — the results
  tree's source order is no longer in that race at all. The comment was **deleted rather than carried
  forward**, because a confident, load-bearing-looking assertion that is wrong costs a future reader
  a test to discover. Recorded here, and in `165-02-SUMMARY.md` § *The deleted drawer-first
  source-order comment*, so the deletion is a decision on the record rather than a silent removal.
- **The in-drawer tab transition.** Switching tabs inside the drawer still animates as a
  whole-viewport root cross-fade, because stripping the `view-transition-name`s — which is what stops
  the page painting over the drawer — is exactly what collapses the viewport into one `root` image.
  The parked improvement is an element-scoped View Transition, or a plain CSS fade, on the drawer's
  tab panel (spike 032's open nit; `165-CONTEXT.md` § *Deferred Ideas*, first item). Cosmetic, and
  **this is the residue half of the folded todo** `2026-06-15-fix-view-transition-flicker-in-results-section.md`,
  which is therefore closed *with* it rather than marked done: that todo's first symptom (scroll lost
  after drawer close) is closed outright as RNAV-02, its second is this.

**One more thing this phase's diff contains that is not this phase's work**, stated so nobody reads
the changed-file list as a description of the phase: `165-07`'s gate run found `yarn format:check`
already red at the phase base, and fixed **13** unformatted files of which **11** were pre-existing
v2.15 integration-branch debt that Phase 165 never touched (WINDOWS 281). They were fixed because CI
runs `format:check` globally, not because the phase had anything to do with them.
