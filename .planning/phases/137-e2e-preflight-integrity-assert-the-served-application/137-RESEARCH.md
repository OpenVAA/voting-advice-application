# Phase 137: E2E Preflight Integrity — Assert the Served Application - Research

**Researched:** 2026-08-13
**Domain:** Playwright harness enforcement · Vite/SvelteKit dev-server identity · CI readiness gating
**Confidence:** HIGH (every load-bearing claim measured live this session; commands + outputs recorded)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `137-CONTEXT.md` § Implementation Decisions.

**D-A — Identity marker (what the preflight asserts)**

- **D-01 (Q1.1):** Composite assertion, three clauses:
  (a) the target URL returns 2xx **after following redirects** — closes the measured `301 → /sv/`
  empty-body hole (F5);
  (b) **load-bearing proof:** a `GET` of Vite's `/@fs/<ABS_REPO_ROOT>/apps/frontend/src/routes/+layout.svelte`
  returns 200 — only true when the listening Vite server's `server.fs.allow` root is this checkout;
  absolute filesystem paths cannot collide between checkouts;
  (c) cheap sanity check: `<title>` ∈ the known `dynamic.appName` set.
  **Fallback if (b) fails manual verification during research:** the Q1.1 option C module-content
  probe (`GET /src/routes/+layout.svelte`, compare transformed body against a unique string read
  from the on-disk file). Research MUST verify (b) against a live `yarn dev` before planning locks it.
  A bare `<title>` grep (the driving todo's proposal) is **rejected** — measured insufficient (F4, F5):
  it is locale-dependent, DB-overridable via `translationOverrides`, replaced under maintenance mode,
  and a sibling OpenVAA checkout would have passed it.
- **D-02 (Q1.2):** **Dev-server-only.** `/@fs/` exists only in dev, and E2E only ever runs against
  `yarn dev` (locally and in CI). If the `/@fs` probe 404s, the preflight FAILS and names
  "the listener is not this checkout's Vite dev server" as the reason — "not a dev server" is itself
  a legitimate failure. No `/api/__identity` route is added (rejected: adds production surface).
  Limitation stated in the docs; revisit only if E2E ever targets a preview build.
- **D-03 (Q1.3):** **Everything derived at runtime**, zero hardcoded strings — repo root via
  `path.resolve` up from the tests dir, app name from the messages catalogue / `package.json`.
  Not merely fork-hygiene: CI's checkout path differs from the developer's, so a hardcoded absolute
  path would fail in CI outright.

**D-B — Enforcement point (INTEG-05)**

- **D-04 (Q2.1):** **`globalSetup`** in `tests/playwright.config.ts`. Rejected the "preflight setup
  project" alternative on F7: the voter permutation family's first setup
  (`data-setup-perm-1e1cg1co`) has no upstream dependency, so a single dependency edge would leave
  that family ungated — and any root project added later would silently escape the gate.
  `globalSetup` covers 100% of invocations (`yarn test:e2e`, bare `npx playwright test`,
  `--project=X`, `--grep`) and aborts before the first spec executes, which is criterion 3's literal
  wording. — **Reversibility:** reversible — one config hook plus its module.
- **D-05 (Q2.2):** **Same `globalSetup` gates CI.** No `if (process.env.CI) return` — that is
  precisely the skip path INTEG-05 forbids. CI's existing blind wait loop
  (`.github/workflows/main.yaml:246-250` and `:326-330`) is **deleted**, not kept alongside: it
  asserts nothing about identity and fails open when the server never comes up (F2). One mechanism,
  not two half-checks. Covers the `e2e-visual` job as well.
- **D-06 (Q2.3):** **Poll, then fail** — ~30 s locally, absorbing the just-started-dev-server race
  and letting CI drop its own 120 s wait. Research picks the exact CI ceiling against observed CI
  startup time.

**D-C — Failure behaviour and closing the drift at source**

- **D-07 (Q3.1):** **No bypass.** No `PLAYWRIGHT_NO_PREFLIGHT` env var. `FRONTEND_PORT` is the
  legitimate escape hatch — it points the suite at the operator's *own* server on another port
  (as Phase 136 did at 5174). A bypass flag would re-open exactly the hole INTEG-05 closes.
- **D-08 (Q3.2):** **Add `strictPort: true` to `apps/frontend/vite.config.ts`.**
  ⚠️ **This changes daily dev UX for every developer** and was flagged in the questions doc as the
  operator's call; it is being taken as the recommended default on the blank-answer rule. F6 is the
  reason: `vite.config.ts:24-26` sets `port` without `strictPort`, so when 5173 is taken our server
  silently moves to 5174 while Playwright's `baseURL` keeps pointing at 5173 — **that drift is the
  mechanism of the original incident**. The preflight catches the consequence; `strictPort` prevents
  the cause. Cost: `yarn dev` now fails loudly ("port 5173 in use") and each developer must free the
  port or set `FRONTEND_PORT` explicitly. — **Reversibility:** reversible — deleting one config line
  restores current behaviour; no migration, no published contract. **Planner must raise this as a
  `checkpoint:decision` before the task that implements it**, since it alters shared developer
  workflow rather than test-only surface.
- **D-09 (Q3.3):** Failure message contents: expected port · expected checkout (absolute path) ·
  what actually answered (HTTP status, final URL after redirects, served module root, `<title>`) ·
  both remedies verbatim ("stop the other server" / "re-run with `FRONTEND_PORT=<port your server is
  actually on>`"). **Include the `lsof -nP -iTCP:<port>` squatting-process line** (recommended
  default) — it is how the sibling container was identified during scouting. It must be
  best-effort: wrapped so a non-macOS/Linux platform or a missing `lsof` degrades to omitting the
  line, never to crashing the preflight or masking the real failure message.
- **D-10 (Q3.4):** Changing the default local E2E port away from 5173 is **out of scope** —
  documenting `FRONTEND_PORT` as the escape hatch is all the success criteria require. Deferred.

**D-D — Proving it (negative control) and doc surface**

- **D-11 (Q4.1 — the operator's one explicit answer, B):** The foreign dev server is staged as a
  **throwaway minimal Vite project spun up in the scratch dir**, not the live sibling OpenVAA
  container. Rationale for B over the recommended C: full reproducibility on any machine, and the
  control does not depend on a container that happens to be running today. **Planning note:** the
  weaker adversary is the accepted trade-off, but the staged project MUST still exercise the
  failure modes the scout measured — it must answer 200 on the target port and should reproduce the
  redirect-to-locale shape (F5) so clause (a) of D-01 is genuinely exercised.
- **D-12 (Q4.2):** The retired check's blindness is demonstrated by **writing the retired
  "listener is a `node` process" check as a throwaway script during the phase**, running it against
  the foreign server → record PASS, then running the new preflight against the same scenario →
  record FAIL. This satisfies the milestone's standing acceptance rule literally. The throwaway
  script is **not committed to the harness** (scratch dir only; its source is quoted in the evidence
  doc). Needed because F3: the retired check never existed in code — only as runbook prose.
- **D-13 (Q4.3):** Evidence lives in a dedicated **`137-NEGATIVE-CONTROL.md`** in the phase dir,
  following the `136-VISUAL-DISCRIMINATION-EVIDENCE.md` precedent.
- **D-14 (Q4.4):** INTEG-06's "grep returns nothing" is **scoped to live docs only** —
  `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`. Archived `.planning/milestones/**`
  is explicitly **untouched**: those summaries (`136-01-SUMMARY.md:270`, `135-04-SUMMARY.md`, …)
  are the historical record of the incident and rewriting them would destroy the evidence trail.
  As literally written the criterion is unsatisfiable; this scoping is recorded here so the
  verifier does not flag it as a miss.
- **D-15 (Q4.5):** Doc split:
  - `CLAUDE.md` (E2E section, ~4 lines) — the preflight runs automatically and aborts the run; what
    it asserts (the served app's own response proves this checkout); `FRONTEND_PORT=<port>` as the
    alternate-port escape hatch. Plus the `strictPort` consequence for `yarn dev` (from D-08).
  - `tests/README.md` (Run / prereqs section, fuller) — the same, plus how to read the failure
    message and the two remedies.
  - `tests/IDURA-TEST-RUNBOOK.md` — one cross-reference line (it already directs the operator to
    `FRONTEND_PORT=5174`).

### Claude's Discretion

- Exact CI poll ceiling (D-06) — research picks it against observed CI startup time.
- Module layout of the preflight (single `tests/global-setup.ts` vs. a helper module) and its unit
  boundaries.
- Exact wording of the doc edits within the D-15 split.
- Whether the D-01(c) title sanity-check reads the known app-name set from the messages catalogue
  or from a derived constant — provided D-03 (nothing hardcoded) holds.

### Deferred Ideas (OUT OF SCOPE)

- **Move the default local E2E port away from 5173** (e.g. to 5273) so contention is rare — from
  the driving todo's "consider defaulting local E2E to a less contended port" and Q3.4 option B.
  Deferred because it touches `vite.config.ts`, the Playwright `baseURL`, the email-callback
  fixture, both CI jobs, and every runbook — a deliberate change, not a rider on an integrity phase.
  D-08 (`strictPort`) makes the contention loud in the meantime, which is the safety-relevant half.
- **Identity-bearing app endpoint (`/api/__identity` returning repo root + git HEAD)** — Q1.2
  option B. Only worth building if E2E ever runs against a preview/built server, where `/@fs/`
  does not exist. Revisit then; it needs a guard so it never ships enabled.
- **`kit.version.name` build stamp** — Q1.2 option C. Would give a built-server identity marker;
  the SvelteKit default is a build timestamp, not a checkout identifier (F10). Pairs with the item
  above if preview-target E2E ever lands.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description (verbatim from `.planning/REQUIREMENTS.md`) | Research Support |
|----|---------------------------------------------------------|------------------|
| **INTEG-04** | "The E2E preflight asserts the **served application's own response**, not the listener process — a foreign dev server occupying the port fails the preflight, proven by running it against one." | §R1 — the `/@fs` probe is VERIFIED to return 200 only for this checkout, and a real foreign Vite server carrying an *identical* `<title>` was measured to FAIL it (§R6, run 2). |
| **INTEG-05** | "The preflight is enforced by the harness rather than remembered by the operator, so it cannot be skipped." | §R2 — `globalSetup` measured to run on full runs, `--project=X`, `--grep`, `--grep` with no matches, and `--shard`; a throw aborts with exit 1 before any spec body executes. |
| **INTEG-06** | "The E2E runbook (CLAUDE.md and the phase runbook) states the response-content check and no longer instructs 'assert the listener is a node process'." | §R7 — baseline grep over the D-14 live-doc scope recorded as **zero matches today**; exact doc anchors and the retired wording's archived source located. |

`[VERIFIED: .planning/REQUIREMENTS.md:48-50]` — read this session; the three lines are quoted verbatim above.
</phase_requirements>

---

## Summary

The phase's single riskiest assumption — D-01 clause (b), the `/@fs/<ABS_REPO_ROOT>/…/+layout.svelte`
probe — **was verified empirically against a live dev server of this checkout and against two
different foreign Vite servers. It works, and it is the only clause that works.** Against this
checkout's server it returns `200 text/javascript`, and the response body *itself* echoes the
absolute repo root back in its Vite HMR preamble. Against a deliberately-staged adversary that
carries a byte-identical `<title>Election Compass</title>` and reproduces the `301 → /sv/`
redirect shape, it returns `403`. No fallback to Q1.1 option C is needed; D-01 stands as written.

Two facts were measured that the scout's F1–F10 table did not capture, and both change what the
plan must contain. **First:** `strictPort: true` (D-08) does **not** close the failure mode that is
live on this machine right now. Docker Desktop holds the IPv6 *wildcard* `[::]:5173`, and macOS
permits Vite to additionally bind the *more specific* `[::1]:5173` — so `yarn dev` starts
successfully, prints `Local: http://localhost:5173/`, and two different applications are
simultaneously reachable on port 5173: `localhost:5173` serves **ours**, `127.0.0.1:5173` serves the
**foreign** one. `strictPort` cannot catch this because the bind *succeeds*. This does not
invalidate D-08 (the same-address-family drift it targets was also reproduced live, and `strictPort`
does catch that) — it means D-08 is necessary but not sufficient, and the preflight is the only
guard that covers the shadow-bind. **Second:** a `FRONTEND_PORT` value written into `.env` moves
Playwright's `baseURL` but does **not** move the dev server, because `vite.config.ts` reads
`process.env` at config-evaluation time and nothing loads the root `.env` into the frontend's
process env. The escape hatch only works when the variable is exported in the shell for *both*
commands — which the D-15 docs must say explicitly, or the documented remedy becomes a new source
of false greens.

Everything else resolved cleanly. `globalSetup` receives a full `FullConfig` (so `baseURL` is read,
not recomputed), runs on every invocation shape except `--list`, and aborts with exit code 1 before
any spec body runs. Repo root derivation is trivial and ESM-safe (`TESTS_DIR` already uses
`import.meta.url`). The CI wait loops are at 245-250 and 325-330 — one line later than the scout's
citation, because the `- name:` line belongs to the step being deleted. Cold-start on this machine
is 5.2 s to first `200` on `/`; the recommended CI ceiling is **120 s**, chosen because it is
exactly the budget the deleted loop already granted, making the swap a strict improvement rather
than a tolerance change. No new packages are required — the whole preflight is Node built-ins plus
the `@playwright/test` types already present.

**Primary recommendation:** Implement the preflight as a single ESM module invoked from
`globalSetup`, asserting clauses (a)→(b)→(c) in that order against `config.projects[0].use.baseURL`,
polling to a `process.env.CI ? 120_000 : 30_000` ceiling, and failing with the D-09 message. Add
`strictPort: true` behind the mandated `checkpoint:decision`, and document in the same breath that
it does not cover the wildcard shadow-bind — the preflight does.

---

## ⚠ New measured facts that QUALIFY (do not overturn) locked decisions

No locked decision was found to be technically impossible. Two were found to be **incomplete** in
ways the plan must handle. Recording them here rather than silently substituting an alternative, per
the research constraints.

### QUAL-1 — `strictPort: true` (D-08) does not catch the wildcard shadow-bind

**D-08's stated premise** (from CONTEXT.md): *"when 5173 is taken our server silently moves to 5174
while Playwright's `baseURL` keeps pointing at 5173 — that drift is the mechanism of the original
incident."*

That premise is **true and was reproduced live** (§R5, Test A2/B2). But it is not the only shape the
collision takes, and the *other* shape is the one currently live on this machine.

Measured, this session:

```
$ lsof -nP -iTCP:5173
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node      57379 kallejarvenpaa   47u  IPv6 0xcbf956cca9980200      0t0  TCP [::1]:5173 (LISTEN)
com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)

$ curl -sL http://localhost:5173/  | grep -o '<title>[^<]*</title>'
<title>Election Compass</title>          # ← OUR checkout

$ curl -sL http://127.0.0.1:5173/ | grep -o '<title>[^<]*</title>'
<title>Valkompass</title>                # ← the FOREIGN sibling container
```

The Vite server that produced the `[::1]:5173` row above was started **with `--strictPort`** and
started **successfully**:

```
$ node_modules/.bin/vite dev --port 5173 --strictPort     # Docker already on *:5173
  VITE v6.4.1  ready in 1498 ms
  ➜  Local:   http://localhost:5173/
>>> PROCESS STILL RUNNING — strictPort did NOT catch it
```

`[VERIFIED: measured 2026-08-13, scratchpad/strict-C.log + scratchpad/shadow-bind-5173.txt]`

**Why:** Docker Desktop's listener binds the IPv6 wildcard with `SO_REUSEADDR`; the macOS kernel
therefore permits a second, *more specific* bind on `[::1]`. Connections are routed to the most
specific match, so the address family the client picks decides which application answers.
`strictPort` only fires on `EADDRINUSE`, and no `EADDRINUSE` occurs.

**Corroboration that this is a recurring, already-observed shape in this repo** — the mirror-image
case is recorded in the archive:
`[CITED: .planning/milestones/v2.14-phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-05-SUMMARY.md:139]`
> "A stale prior-wave node process held `[::1]:5173` (IPv6 only), so a fresh `yarn dev` bound :5174
> instead (the 'stale server steals port' gotcha)"

Both directions are now explained by one model: Vite binds `[::1]:<port>` only; if that exact
address is taken it drifts (or, with `strictPort`, fails); if only the *wildcard* is taken it
shadow-binds and both servers coexist.

**Implication for the plan — not a decision reversal:**
1. D-08 stays. It closes the drift case, proven in §R5.
2. The plan must NOT claim `strictPort` "prevents the cause" without qualification. The D-15 doc
   wording and the plan's own rationale should say: `strictPort` closes same-address drift; the
   preflight is what closes the wildcard shadow-bind.
3. This is a **gift for the negative control**: the shadow-bind is a live, real, currently-running
   adversary that is *harder* than the D-11 staged project. D-11 remains the reproducible control
   (as the operator chose), but the shadow-bind is worth capturing in `137-NEGATIVE-CONTROL.md` as
   an additional observed scenario — it costs nothing, it is already measured, and it is the exact
   "false green from a foreign server" the milestone exists to eliminate.
4. **Preflight design consequence:** the preflight MUST probe the *same host string* Playwright uses
   (`localhost`, from `baseURL`) rather than normalising to `127.0.0.1`. Normalising would make the
   preflight test a different server than the specs use. See §R1 "Host-string discipline".

### QUAL-2 — `FRONTEND_PORT` in `.env` moves Playwright but NOT the dev server

D-07 and D-15 both rest on `FRONTEND_PORT` being "the legitimate escape hatch". Measured, it is a
**half-wired** hatch, and the half that is missing is the one an operator would reach for first.

| Consumer | Reads `.env`? | Mechanism | Evidence |
|---|---|---|---|
| Playwright `baseURL` | **YES** | `dotenv.config()` at `tests/playwright.config.ts:8` loads the root `.env` into `process.env` | `[VERIFIED: tests/playwright.config.ts:8]` — `dotenv.config();` |
| `toCallbackUrl` fixture | **YES** | same process, same `dotenv.config()` | `[VERIFIED: tests/tests/fixtures/shared/emailBucket.fixture.ts:221-222]` |
| The frontend **dev server** | **NO** | `vite.config.ts` reads `process.env` at *config-evaluation* time, before any `.env` loading; the frontend has no `.env` of its own and Vite's `envDir` defaults to `apps/frontend` | Controlled experiment below |

Controlled experiment (run in an isolated scratch project so no repo file was touched — a `.env`
containing `FRONTEND_PORT=5473` placed in the Vite project root):

```
### .env in project root says FRONTEND_PORT=5473. Does vite.config see it? ###
[CONFIG-EVAL] process.env.FRONTEND_PORT = undefined
[CONFIG-EVAL] Number(...) = NaN
  ➜  Local:   http://localhost:5173/          # ← fell back to Vite's default, IGNORED the .env

### Control: FRONTEND_PORT exported in the SHELL ###
[CONFIG-EVAL] process.env.FRONTEND_PORT = "5473"
[CONFIG-EVAL] Number(...) = 5473
  ➜  Local:   http://localhost:5473/          # ← honoured
```

`[VERIFIED: measured 2026-08-13, scratchpad/envtest.log + scratchpad/envtest2.log]`

**Consequences:**
- The escape hatch is `FRONTEND_PORT=<port> yarn dev` **and** `FRONTEND_PORT=<port> yarn test:e2e`
  — exported in the shell for *both*. Writing it into `.env` alone points Playwright at a port the
  dev server never took, which the new preflight will (correctly) fail on with a confusing-looking
  message. **D-15 must state this**; it is squarely within "FRONTEND_PORT's role as the
  alternate-port escape hatch is documented" (criterion 4).
- CI is accidentally consistent: `.env.example:15` is `FRONTEND_PORT=5173` and CI does
  `cp .env.example .env`, so Playwright targets 5173; the dev server independently defaults to 5173.
  They agree **by coincidence, not by wiring**. If `.env.example`'s port were ever changed, CI would
  break silently. Worth one sentence in the plan's notes; changing it is out of scope (D-10).
- `Number(process.env.FRONTEND_PORT)` is `NaN` whenever the var is unset. Vite sanitises `NaN` to
  its default 5173, and `strictPort` behaves correctly alongside a `NaN` port (§R5, Test D/E) — so
  **D-08 carries no NaN hazard.** This was explicitly tested because it was the obvious way for
  D-08 to break every developer's `yarn dev`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Assert the served app's identity | Test harness (Playwright `globalSetup`, Node process) | — | Must run before any browser exists; it is a property of the *run*, not of a test. Cannot live in a fixture (fixtures run per-worker, after the gate is needed). |
| Abort the run on identity mismatch | Test harness (`globalSetup` throw) | — | Playwright's own contract: a `globalSetup` rejection terminates the run with exit 1 before spec bodies execute (§R2). |
| Prevent same-address port drift | Application build tooling (`apps/frontend/vite.config.ts`) | — | The drift happens at server-bind time; only Vite can refuse it. Test-side code cannot prevent a bind it does not perform. |
| Detect the wildcard shadow-bind | Test harness (preflight) | — | No bind error occurs, so no build-tool guard can see it (QUAL-1). Only a content assertion on the response distinguishes the two servers. |
| Gate CI readiness | Test harness (same `globalSetup`) | CI workflow (removal of the competing loop) | D-05: one mechanism. CI's role reduces to *not* running a second, weaker check. |
| Derive expected identity | Test harness, at runtime from disk | — | D-03. Both the repo root and the app-name set are properties of the checkout, readable with `fs`/`path`; hardcoding breaks CI (different checkout path). |
| Document the contract | Live docs (`CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`) | — | D-14/D-15. |

**No application-tier responsibility.** D-02 explicitly rejects an app route; nothing under
`apps/frontend/src/routes/api/**` is touched. The only application-tier edit in the whole phase is
one line of `vite.config.ts`.

---

## R1 — The load-bearing probe: MANUAL VERIFICATION (research priority 1)

### Verdict

**D-01 clause (b) is VERIFIED and requires no fallback.** The Q1.1 option C module-content probe is
**not needed**; it should be recorded as unused rather than implemented.

### R1.1 — Environment the verification ran in

`[VERIFIED: measured 2026-08-13]`

| Fact | Value | How obtained |
|------|-------|--------------|
| Repo root (this checkout) | `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd` | `pwd` |
| Who held `:5173` at start | Docker Desktop, the sibling OpenVAA container | `lsof -nP -iTCP:5173` → `com.docke 62915 … TCP *:5173 (LISTEN)` |
| Port used for this checkout's server | **5273** (free; per the research brief, did not fight for 5173) | `lsof -nP -iTCP:5273` → empty before start |
| Server start command | `FRONTEND_PORT=5273 yarn workspace @openvaa/frontend dev` | — |
| Vite version **as resolved by the frontend** | **6.4.1** | `apps/frontend/node_modules/.bin/vite --version` → `vite/6.4.1 darwin-arm64 node-v24.14.1` |
| Vite version hoisted at repo root | 7.3.0 | `node -e "require('vite/package.json').version"` |
| SvelteKit | 2.55.0 | `node -e "require('@sveltejs/kit/package.json').version"` |
| Playwright | 1.58.2 | `node -e "require('@playwright/test/package.json').version"` |
| Node | v24.14.1 | `node --version` |
| Supabase local | up (`:54321` → 200) | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:54321/rest/v1/` |

> **Planner note — version split.** `apps/frontend/package.json:50` declares `"vite": "^6.4.1"` and
> resolves to its **own** nested copy at 6.4.1, while the workspace root hoists 7.3.0. Every claim
> below about the app's dev server was measured against **6.4.1**, the version that actually serves
> `yarn dev`. `[VERIFIED: apps/frontend/package.json:50]` — `"vite": "^6.4.1",`

### R1.2 — Clause (b) against THIS checkout's server → **200**

Command and exact output:

```
URL: http://localhost:5273/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte
status=200 type=text/javascript size=39470

--- first 300 bytes of body ---
import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version
```

`[VERIFIED: measured 2026-08-13, scratchpad/probe-own-server.txt]`

**Bonus signal the plan should exploit:** the 200 body *contains the absolute repo root as a
literal string*, inside the `__vite__createHotContext("…")` argument. So the probe can be made
strictly stronger at zero extra cost: assert `status === 200` **and** that the body contains the
probed absolute path. That upgrades the check from "a Vite server is willing to serve this path" to
"a Vite server transformed *this exact file* and told us so". Recommended, and free.

### R1.3 — Clause (b) against foreign servers → **404 / 403** (the discriminator holds)

| # | Server | Request | Result |
|---|--------|---------|--------|
| B | Sibling OpenVAA Docker container on `:5173` | `/@fs<OUR_ROOT>/apps/frontend/src/routes/+layout.svelte` | **404** |
| — | Staged minimal Vite adversary on `:5373` (§R6) | same URL | **403** (`outside of Vite serving allow list`) |
| C | **Our** server on `:5273` | `/@fs/opt/frontend/src/routes/+layout.svelte` (the sibling's path) | **404** |

`[VERIFIED: measured 2026-08-13, scratchpad/discriminator-matrix.txt + scratchpad/negcontrol-run2.txt]`

> **Planner instruction (important):** assert **`status === 200`**, never `status !== 404`. Two
> different non-200 codes were measured — `404` when the path is inside the allow list but absent,
> `403` when the path is outside the allow list — and which one a given foreign server produces
> depends on where *its* root is. A `!== 404` check would pass against the 403 adversary.

**Sanity control — the foreign server is not blanket-404ing `/@fs`.** The sibling container *does*
serve its own `/@fs` paths, so its 404 for our path is a genuine discrimination, not an artefact of
`/@fs` being disabled:

```
  /@fs/opt/frontend/.svelte-kit/generated/client/app.js -> 200
  /@fs/opt/frontend/src/routes/+layout.svelte           -> 404
```

### R1.4 — ⚠ CRITICAL: the effective `fs.allow` root is NOT the workspace root

The research brief hypothesised: *"in a yarn-workspaces monorepo Vite's default `fs.allow` is
typically the workspace ROOT, not the app dir."* **That hypothesis is false for this repo.**
SvelteKit's Vite plugin replaces Vite's default with its own explicit list.

Measured by reading the 403 body verbatim (`GET /@fs<ROOT>/package.json`):

```
403 Restricted
The request url "/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/package.json" is outside of Vite serving allow list.
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/.svelte-kit
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/node_modules
- /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules
```

`[VERIFIED: measured 2026-08-13, scratchpad/fs-allow-list.txt]` — the six entries are quoted
verbatim above.

Corroborating 403s from the same server:

```
/@fs<ROOT>/package.json                 -> 403
/@fs<ROOT>/packages/core/src/index.ts   -> 403
/@fs/etc/hosts                          -> 403
```

**Consequences the planner must honour:**

1. **The D-01 probe path is inside the allow list — by virtue of `apps/frontend/src/routes`, which
   is SvelteKit's `kit.files.routes`.** This is why clause (b) works. It is not luck, but it *is*
   contingent on the chosen path.
2. **Do not substitute a "more obvious" root marker.** `/@fs<ROOT>/package.json`,
   `/@fs<ROOT>/yarn.lock`, `/@fs<ROOT>/.git/HEAD`, `/@fs<ROOT>/packages/**` all return **403** from
   our own server. Any of them would make the preflight fail against a correct checkout — a
   catastrophic false negative that would block every E2E run in the repo.
3. **Safe alternates**, if the planner ever needs a second probe: anything under
   `apps/frontend/src/**` or `apps/frontend/.svelte-kit/**`. `+layout.svelte` is the best choice
   already — it is a committed source file that cannot vanish (the app has no routes without it)
   and is not a generated artefact.
4. No `server.fs` configuration exists in the repo, so this list is purely SvelteKit's default and
   will hold for any fork. `[VERIFIED: apps/frontend/vite.config.ts:1-27]` — read this session in
   full; the `server` block is exactly:
   ```
   24	  server: {
   25	    port: Number(process.env.FRONTEND_PORT)
   26	  }
   ```
   There is no `fs` key and no `strictPort` key anywhere in the file.

### R1.5 — Clause (a) and clause (c) verified

```
--- (a) GET / with -L ---
status=200 final=http://localhost:5273/ redirects=0
--- (a) GET / WITHOUT -L ---
status=200
--- (c) title ---
<title>Election Compass</title>
--- module root evidence in served HTML ---
/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/.svelte-kit/generated/client/app.js
```

`[VERIFIED: measured 2026-08-13, scratchpad/probe-own-server.txt]`

Against the foreign sibling, the same requests give `301` without `-L`, `200` at
`http://localhost:5173/sv` with `-L`, `<title>Valkompass</title>`, and module root
`/@fs/opt/frontend/…` — confirming F5 exactly.

**Free extra signal for the D-09 message:** the *served HTML at `/`* contains the serving checkout's
absolute module root (`/@fs…/.svelte-kit/generated/client/app.js`). Extracting it costs nothing (the
HTML is already fetched for clause (a)/(c)) and gives the operator the single most diagnostic line
in the failure message — "the server that answered is rooted at `/opt/frontend`". D-09 already asks
for "served module root"; this is where it comes from. Regex used and confirmed working:
`/\/@fs([^"']*?)\/\.svelte-kit/`. It must degrade to `(not found)` rather than throw — verified
against the minimal adversary, which has no `.svelte-kit` (§R6).

### R1.6 — The `dynamic.appName` set for clause (c)

`[VERIFIED: apps/frontend/messages/*/dynamic.json:6]` — the seven files were read this session and
the values are quoted verbatim:

| Locale dir | `dynamic.appName` (verbatim) | Line |
|---|---|---|
| `da` | `"Valgtest"` | `apps/frontend/messages/da/dynamic.json:6` |
| `en` | `"Election Compass"` | `apps/frontend/messages/en/dynamic.json:6` |
| `et` | `"Valimiskompass"` | `apps/frontend/messages/et/dynamic.json:6` |
| `fi` | `"Vaalikone"` | `apps/frontend/messages/fi/dynamic.json:6` |
| `fr` | `"Boussole électorale"` | `apps/frontend/messages/fr/dynamic.json:6` |
| `lb` | `"Wal-Kompass"` | `apps/frontend/messages/lb/dynamic.json:6` |
| `sv` | `"Valkompassen"` | `apps/frontend/messages/sv/dynamic.json:6` |

**Structural gotcha — the key is nested, not top-level.** The value lives at `.dynamic.appName`, not
`.appName`. Verified by reading `apps/frontend/messages/en/dynamic.json:1-10`:

```
1	{
2	  "dynamic": {
3	    "about": {
4	      "heroEmoji": "⚙️"
5	    },
6	    "appName": "Election Compass",
```

A first attempt at extraction using `require(f).appName` returned `undefined` for all seven files.
The correct accessor is `JSON.parse(...).dynamic.appName`. `[VERIFIED: apps/frontend/messages/en/dynamic.json:1-6]`

**Reading it at preflight time is cheap and robust** (D-03, and the discretion item on catalogue vs.
derived constant): seven `readFileSync` + `JSON.parse` calls on files of a few KB, done once per
run. Enumerate the directory rather than hardcoding the locale list — the set grows (the archive
shows an Arabic locale in flight on `feat-rtl-locales`), and D-03 forbids hardcoding.

**Keep clause (c) NON-fatal-by-default in one specific case:** the `sv` locale's value in this
checkout is `"Valkompassen"` while the foreign sibling serves `"Valkompass"` — one character apart.
Clause (c) is a *sanity check*, not the proof (D-01 says so explicitly). If the title is empty or
absent (maintenance mode replaces it per F4, `apps/frontend/src/routes/+layout.ts:26-28`), skip the
clause rather than fail; if it is present and outside the set, fail. The prototype does exactly this.

### R1.7 — Host-string discipline (arising from QUAL-1)

The preflight must derive its target from `config.projects[0].use.baseURL` and use that URL string
**unmodified**. Do not rewrite `localhost` → `127.0.0.1` for "reliability". Measured evidence that
this matters:

```
node dns.lookup(localhost, all): [{"address":"::1","family":6},{"address":"127.0.0.1","family":4}]
node dns.lookup(localhost) default pick: {"a":"::1","f":6}
node fetch  -> status 200 title Election Compass
chromium    -> status 200 url http://localhost:5173/ title Election Compass
```

`[VERIFIED: measured 2026-08-13, scratchpad/host-resolution-result.txt]`

On this machine, with the shadow-bind live, **Node `fetch` and Playwright's Chromium agree**: both
resolve `localhost` to `::1` and both reach *our* server. That agreement is what makes a Node-side
preflight a valid proxy for what the specs will see — but it is an agreement, not a guarantee, and
it only holds because both use the same hostname. `[ASSUMED]` that the agreement also holds on
Linux/CI; it was not measured there. The mitigation is the same either way: probe the exact
`baseURL` string, and never normalise it.

---

## R2 — `globalSetup` mechanics in Playwright 1.58.2 (research priority 2)

All results below come from an **isolated scratch harness** (a throwaway config + two specs +
a `globalSetup` under the scratchpad, with `node_modules` symlinked from the repo). No repo file was
created or modified. `[VERIFIED: measured 2026-08-13, scratchpad/pw/]`

### R2.1 — Signature and arguments

Declared type: `globalSetup?: string|Array<string>;`
`[VERIFIED: node_modules/playwright/types/test.d.ts:1301]`

The module's default export **receives a `FullConfig`**. Measured keys of the received object:

```
configFile, rootDir, forbidOnly, fullyParallel, globalSetup, globalTeardown, globalTimeout,
grep, grepInvert, maxFailures, metadata, preserveOutput, projects, quiet, reporter,
reportSlowTests, runAgents, shard, tags, updateSnapshots, updateSourceMethod, version,
workers, webServer
```

And the value the preflight needs is directly readable:

```
[GS] projects[0].use.baseURL: http://localhost:5173
```

`[VERIFIED: measured 2026-08-13, scratchpad/pw run 1]`

**So `baseURL` is READ, not recomputed** — satisfying the research brief's requirement and avoiding a
second, drift-prone copy of the `FRONTEND_PORT` expression.

**Two subtleties the planner must handle:**

1. **`FullConfig` exposes no top-level `use`.** The top-level `use.baseURL` at
   `tests/playwright.config.ts:121` is only visible *through a project*. Read
   `config.projects[0]?.use?.baseURL`.
2. **`config.projects` is NOT filtered by `--project`.** Measured: running `--project=beta` still
   reported `projects: alpha|beta`. Harmless here (all ~97 projects inherit the single top-level
   `baseURL`), but the plan should either read `projects[0]` with a documented comment, or defensively
   collect the distinct `baseURL` values across all projects and fail loudly if there is more than
   one. The former is simpler and correct for today's config.
3. Provide a fallback if `baseURL` is somehow absent, mirroring line 121's own expression, so the
   preflight never silently probes `undefined`.

### R2.2 — Which invocations run it (INTEG-05's "cannot be skipped")

| Invocation | `globalSetup` ran? | Evidence |
|---|---|---|
| Full run (`playwright test`) | ✅ | `[GS] globalSetup RAN` + `2 passed` |
| `--project=beta` | ✅ | `[GS] globalSetup RAN` + `1 passed` |
| `--grep "spec A"` | ✅ | `[GS] globalSetup RAN` + `1 passed` |
| `--grep` matching **nothing** | ✅ | `[GS] globalSetup RAN`, then `Error: No tests found`, exit 1 |
| `--shard=1/2` | ✅ | `[GS] globalSetup RAN`, `Running 1 test using 1 worker, shard 1 of 2` |
| **`--list`** | ❌ **DOES NOT RUN** | Output was only `Listing tests: … Total: 2 tests in 2 files`; no `[GS]` line |

`[VERIFIED: measured 2026-08-13, scratchpad/pw runs 1–5, 10]`

**The `--list` exemption is correct and should be documented, not fixed.** `tests/README.md:21-25`
already advertises `--list` as a "no dropped specs" check explicitly usable **without a running dev
server**:

```
21	List the discovered tests without a running dev server (useful as a "no dropped specs" check):
22	
23	```bash
24	cd tests && npx playwright test --list
25	```
```

`[VERIFIED: tests/README.md:21-25]` — quoted verbatim. If `globalSetup` ran on `--list`, this
documented workflow would break. Note that the **module-load-time orphan-probe throw** at
`tests/playwright.config.ts:33-47` *does* still fire on `--list` (it runs at config evaluation), so
the two guards are complementary: config-load guards cover `--list`, `globalSetup` covers execution.
INTEG-05 is about runs, not listings — this is a clean fit.

### R2.3 — How a throw surfaces

Measured with a deliberately multi-line error:

```
Error: PREFLIGHT FAILED: this is the multi-line failure message.
  line two
  line three

   at ../global-setup.ts:11

   9 |   console.log('[GS] CI-ish env FRONTEND_PORT:', process.env.FRONTEND_PORT ?? 'UNSET');
  10 |   if (process.env.GS_THROW) {
> 11 |     throw new Error('PREFLIGHT FAILED: this is the multi-line failure message.\n  line two\n  line three');
     |           ^
  12 |   }
  13 | }
    at globalSetup (…/global-setup.ts:11:11)
--- exit code: 1 ---
```

`[VERIFIED: measured 2026-08-13, scratchpad/pw run 6]`

Findings:
- **Exit code 1.**
- **Multi-line messages are preserved verbatim**, including leading indentation — so the D-09
  message can be formatted as a readable block. Confirmed again with the real prototype in §R6.
- **No spec body executed** — `[SPEC] A executed` / `[SPEC] B executed` are absent from runs 6, 7
  and 9, and present in every non-throwing run. This is criterion 3's "aborts before the first spec
  executes", measured rather than assumed.
- Playwright appends a **source code frame and stack trace** after the message. The message must
  therefore be self-contained and front-loaded: the operator reads the first ~10 lines before the
  code frame pushes them up. Put the reason and the two remedies in the message body, not in a
  trailing hint.
- Throwing under `--project=beta` behaves identically (run 7).

### R2.4 — Ordering vs. the bank-auth `webServer`

The research brief asked specifically whether the `PLAYWRIGHT_BANK_AUTH`-gated `webServer` at
`tests/playwright.config.ts:1119-1135` starts before or after `globalSetup`.

**Measured: `webServer` starts BEFORE `globalSetup`.** A sentinel-file experiment:

```
[GS-ORDER] webServer already started when globalSetup ran? -> true
Error: [GS-ORDER] deliberate abort
--- after run ---
WEBSERVER_STARTED exists: YES
GS_RAN content (webServer-was-up-at-GS-time): true
--- port 9911 still bound? ---
(nothing — freed)
```

`[VERIFIED: measured 2026-08-13, scratchpad/pw/ws-config.ts + gs-order.ts]`

**Consequence (a note, not a blocker):** in a `PLAYWRIGHT_BANK_AUTH=1` run, the mock OIDC issuer is
spawned and its HTTPS JWKS readiness probe completes *before* the preflight runs. If the preflight
then fails, the issuer was started for nothing — but Playwright **tore it down cleanly** (port 9911
was free after the aborted run), so there is no orphan process and no operator action. Cost is a few
seconds on an already-failing run. No design change needed; worth one comment in the preflight
module so a future reader does not "fix" it.

### R2.5 — TypeScript / module-system considerations

- **No transpile configuration is needed.** Playwright transpiles a `.ts` `globalSetup` with the same
  loader it uses for the config and specs. The scratch harness used a `.ts` `globalSetup` importing
  `import type { FullConfig } from '@playwright/test'` with zero extra setup.
- **The config is ESM and `import.meta.url` works today.** `tests/tests/utils/testsDir.ts` already
  relies on it and is imported by `playwright.config.ts:6`:
  ```
  1	import path from 'path';
  2	import { fileURLToPath } from 'url';
  3	
  4	/**
  5	 * The folder containing the e2e test files.
  6	 */
  7	export const TESTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  ```
  `[VERIFIED: tests/tests/utils/testsDir.ts:1-7]` — quoted verbatim.
- **`yarn typecheck:tests` will cover the new module wherever it lands.**
  `[VERIFIED: tests/tsconfig.json:15]` — `"include": ["tests/**/*.ts", "*.ts", "../apps/frontend/src/lib/types/global.d.ts"],`
  `"*.ts"` (relative to `tests/`) covers `tests/global-setup.ts`; `"tests/**/*.ts"` covers
  `tests/tests/support/preflight.ts`. Either placement is type-checked by
  `yarn typecheck:tests` → `tsc -p tests/tsconfig.json --noEmit`
  `[VERIFIED: package.json — "typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit"]`
- **`globalSetup` path resolution is relative to the config file's directory** (`tests/`). The
  scratch harness used `globalSetup: './global-setup.ts'` successfully. Note the contrast with the
  `webServer.command` gotcha already documented at `tests/playwright.config.ts:1120-1126` (a bare
  relative path doubled into `tests/tests/tests/…`) — that gotcha applies to the *spawn cwd*, not to
  `globalSetup` module resolution. A repo-relative `'./global-setup.ts'` is correct and simplest.

---

## R3 — Deriving repo identity at runtime (D-03) (research priority 3)

### R3.1 — Repo root

`TESTS_DIR` is `<repo-root>/tests/tests` (from `tests/tests/utils/testsDir.ts`, which resolves
`../` from `tests/tests/utils`). Therefore:

| If the preflight module lives at… | Derive the root as… |
|---|---|
| `tests/global-setup.ts` | `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')` |
| `tests/tests/support/preflight.ts` | `path.resolve(TESTS_DIR, '..', '..')` — reusing the existing helper |

**Recommendation:** reuse `TESTS_DIR`. It is already the repo's single source of "where am I",
already imported by `playwright.config.ts:6`, and already proven to work under Playwright's TS
loader. Adding a second, independent `import.meta.url` derivation creates two things that must stay
in agreement.

Corroboration that `TESTS_DIR` behaves as claimed: `playwright.config.ts:10` builds
`STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json')` → `<root>/tests/playwright/…`,
which is the real on-disk location.
`[VERIFIED: tests/playwright.config.ts:10]` — `export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');`

**Sanity assertion worth adding (cheap, catches a moved file):** after deriving the root, assert
`fs.existsSync(path.join(root, 'apps/frontend/src/routes/+layout.svelte'))`. If the file the probe
targets is not on disk, the preflight is broken and should say *that*, not "the server is foreign".
This is the difference between a guard that fails correctly and one that fails confusingly.

### R3.2 — App-name set

Enumerate `<root>/apps/frontend/messages/*/dynamic.json`, `JSON.parse`, take `.dynamic.appName`.
Seven locale dirs today: `da, en, et, fi, fr, lb, sv`
`[VERIFIED: ls apps/frontend/messages/ — measured 2026-08-13]`. See §R1.6 for the values and the
nesting gotcha.

### R3.3 — Confirmation that a hardcoded path would break CI

`[VERIFIED: .github/workflows/main.yaml:208-209]` — the E2E job checks out with:
```
      - name: "Checkout source code"
        uses: actions/checkout@v4
```
`actions/checkout@v4` with no `path:` input places the repo at `$GITHUB_WORKSPACE`, which on a
`ubuntu-latest` runner is `/home/runner/work/<repo>/<repo>` — categorically different from
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`. `[ASSUMED]` for the exact
runner path string (not measured on a runner this session); `[VERIFIED]` that it is not the
developer's macOS path, which is all D-03's argument requires. Both jobs are `runs-on: ubuntu-latest`
`[VERIFIED: .github/workflows/main.yaml:204, :286]`.

---

## R4 — The CI wait-loop removal (D-05) (research priority 4)

### R4.1 — Exact line ranges (CORRECTED from the scout's citation)

The scout cited `:246-250` and `:326-330`. Those are the `run:` block **only**. Deleting just those
leaves an orphaned `- name: "Wait for frontend"` with no body, which is invalid YAML for a step.
**The whole step must go: 245-250 and 325-330** (plus the trailing blank line, 251 / 331, to avoid a
double blank).

`e2e-tests` job — `[VERIFIED: .github/workflows/main.yaml:242-253]`, read this session, quoted verbatim:

```
242	      - name: "Start frontend"
243	        run: yarn workspace @openvaa/frontend dev &
244	
245	      - name: "Wait for frontend"
246	        run: |
247	          for i in $(seq 1 60); do
248	            curl -s http://localhost:5173 > /dev/null 2>&1 && break
249	            sleep 2
250	          done
251	
252	      - name: "Run E2E tests"
253	        run: yarn test:e2e
```

`e2e-visual` job — `[VERIFIED: .github/workflows/main.yaml:322-333]`, quoted verbatim:

```
322	      - name: "Start frontend"
323	        run: yarn workspace @openvaa/frontend dev &
324	
325	      - name: "Wait for frontend"
326	        run: |
327	          for i in $(seq 1 60); do
328	            curl -s http://localhost:5173 > /dev/null 2>&1 && break
329	            sleep 2
330	          done
331	
332	      - name: "Run visual regression tests (blocking)"
333	        run: PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"
```

**Both jobs confirmed covered** (D-05 explicitly requires `e2e-visual` too). The two blocks are
byte-identical.

**F2 confirmed:** the loop `break`s on the first successful `curl` but has **no `exit 1` on
exhaustion** — after 60 failed attempts it simply falls out of the loop and the step succeeds. It is
fail-open, exactly as the scout recorded.

**Line-number drift warning for the planner:** deleting 245-251 shifts every subsequent line by 7,
so the `e2e-visual` block moves from 325-331 to 318-324. **Delete the later block first, or match on
content rather than line number.** This is the kind of off-by-N that produces a plan that half-applies.

### R4.2 — Poll ceiling evidence (D-06)

**The existing loop's budget is 60 × 2 s = 120 s**, and its `curl` targets `http://localhost:5173`
with no `-L` and no content check.

**Measured cold-start on this machine** (M-series Mac, after `yarn workspace @openvaa/frontend clean`
— i.e. `.svelte-kit` and `node_modules/.vite` both wiped, which is precisely what `yarn dev` does
every time via `dev:clean`):

| Milestone | Elapsed from process spawn |
|---|---|
| Socket LISTENing | **2.9 s** |
| First `200` on `/` (cold SSR compile) | **5.2 s** |
| `/@fs` probe after `/` warmed | **0.1 s** |
| Vite's own self-report | `VITE v6.4.1  ready in 2057 ms` |

`[VERIFIED: measured 2026-08-13, scratchpad/cold-start.log]`

Warm-path latency is negligible: `/` at 0.023–0.053 s, `/@fs` probe at 0.0006–0.001 s.

**CI timing evidence: NOT OBTAINABLE this session.** `gh` is authenticated, but `gh run list` shows
the most recent `Main tests & validation` run as **2026-07-26** (`30197131018`, `failure`, 8m11s) —
over two weeks stale, on `feat-rtl-locales`, and there is no run on the current branch. Per-step
timings for a workflow that old are not a sound basis for a ceiling.
`[VERIFIED: gh run list --limit 8 — measured 2026-08-13]`

**Recommended ceiling: `process.env.CI ? 120_000 : 30_000` ms.**

The reasoning is deliberately not a guess about runner speed:

1. **120 s in CI is exactly the budget the deleted loop already granted.** Choosing it makes the
   swap *strictly* an improvement — same tolerance, but it now **fails** instead of falling through.
   Any other number is a tolerance change smuggled into an integrity phase, and would need its own
   justification. This is the defensible choice precisely *because* CI timing data was unavailable.
2. **30 s locally matches D-06's stated intent** and is ~6× the measured 5.2 s cold-start, leaving
   ample headroom for a slower machine or a genuinely cold `node_modules`.
3. **Poll only the liveness clause.** Poll clause (a) (something answers 2xx) until the ceiling;
   once it answers, evaluate clauses (b) and (c) **once**. They are sub-millisecond and a retry
   loop on them would convert a genuine identity mismatch into a 120 s hang before the same failure.
4. Use a modest interval (500 ms–1 s) so a locally-fast server costs ~3 polls, not a fixed 2 s
   quantum like the shell loop's `sleep 2`.

**One risk to state in the plan:** after removing the wait loop, `yarn test:e2e` starts immediately
after the backgrounded `yarn workspace @openvaa/frontend dev &`. Playwright's own startup (config
load, ~97 project resolution, worker spawn) buys some slack before `globalSetup`, but the preflight
poll is now the *only* thing absorbing CI cold-start. This is by design (D-05: one mechanism), and
120 s preserves the prior budget — but it is the change most likely to surface as a CI-only failure,
so the plan's verification must include a real CI run, not just a local one.

---

## R5 — `strictPort: true` blast radius (D-08) (research priority 5)

### R5.1 — Everything that reads or sets the frontend port

| Site | Verbatim content | Role |
|---|---|---|
| `apps/frontend/vite.config.ts:24-26` | `server: {` / `port: Number(process.env.FRONTEND_PORT)` / `}` | **The edit site.** No `strictPort` today. `[VERIFIED: read in full this session]` |
| `tests/playwright.config.ts:121` | `baseURL: process.env.FRONTEND_PORT ? \`http://localhost:${process.env.FRONTEND_PORT}\` : 'http://localhost:5173'` | Playwright's target. `[VERIFIED: tests/playwright.config.ts:121]` |
| `tests/playwright.config.ts:8` | `dotenv.config();` | Loads the root `.env` into the **Playwright** process only (QUAL-2). `[VERIFIED]` |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts:221-222` | `const frontendPort = process.env.FRONTEND_PORT ?? '5173';` / `const frontendUrl = \`http://localhost:${frontendPort}\`;` | Second consumer (F9). Same `localhost` host string as `baseURL` — **consistent, no change needed.** `[VERIFIED]` |
| `.env.example:15` | `FRONTEND_PORT=5173` | The documented default; CI copies it. `[VERIFIED: .env.example:15]` |
| `.github/workflows/main.yaml:243, :323` | `run: yarn workspace @openvaa/frontend dev &` | Does **not** set `FRONTEND_PORT`; relies on the Vite default. `[VERIFIED]` |
| `.github/workflows/main.yaml` (both jobs) | `- name: "Configure environment"` / `run: cp .env.example .env` | Creates the `.env` Playwright reads. `[VERIFIED: .github/workflows/main.yaml:211-212, :291-292 region]` |
| `package.json` scripts | `"dev"`, `"_dev:concurrent"`, `"dev:reset"`, `"test:e2e"` — **none mention `FRONTEND_PORT`** | No script hardcodes a port. `[VERIFIED: package.json scripts block read in full]` |
| `tests/IDURA-TEST-RUNBOOK.md:275` | `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 \` | The one runbook that already teaches the escape hatch. `[VERIFIED]` |

**Docker/preview paths are NOT affected.** `apps/frontend/package.json:9` is
`"preview": "vite preview"`, and `vite preview` uses `server.preview.port`, not `server.port` — the
`strictPort: true` added under `server:` does not apply to it. The production container runs
`adapter-node` output (`@sveltejs/adapter-node`, `apps/frontend/package.json:24`), which does not
read `vite.config.ts` at all. `[VERIFIED: apps/frontend/package.json:9, :24]`

**No CI job assumes drift-to-next-port.** Both jobs `curl http://localhost:5173` explicitly and
Playwright targets 5173 via `.env`. Nothing reads back the actual bound port. So `strictPort` in CI
changes behaviour only in the case where 5173 is already taken on the runner — which would today
produce a *silent false green* (server on 5174, tests against 5173, wait loop falls through) and
would tomorrow produce a loud bind failure. That is a strict improvement.

### R5.2 — Measured behaviour, all four cases

| # | `strictPort` | Port state | Result | Evidence |
|---|---|---|---|---|
| **A2** | off | our own server on `[::1]:5173` | `Port 5173 is in use, trying another one...` → `Local: http://localhost:5174/` — **silent drift, exit 0** | `scratchpad/strict-A2.log` |
| **B2** | **on** | our own server on `[::1]:5173` | `error when starting dev server:` / `Error: Port 5173 is already in use` → **PROCESS EXITED** | `scratchpad/strict-B2.log` |
| **C** | **on** | only Docker's wildcard `*:5173` | `ready in 1498 ms` / `Local: http://localhost:5173/` → **PROCESS STILL RUNNING** (shadow-bind, QUAL-1) | `scratchpad/strict-C.log` |
| **D** | **on** | `FRONTEND_PORT` unset → `port: NaN` | `ready in 1884 ms` / `Local: http://localhost:5173/` → **no NaN hazard** | `scratchpad/strict-D.log` |
| **E** | off | `FRONTEND_PORT` unset → `port: NaN` | `ready in 1539 ms` / `Local: http://localhost:5173/` (baseline for D) | `scratchpad/strict-E.log` |

`[VERIFIED: all measured 2026-08-13 with apps/frontend/node_modules/.bin/vite (6.4.1)]`

**Reading of the matrix:**
- **A2 vs B2 is the D-08 justification, reproduced.** The drift is real and `strictPort` kills it.
- **C is QUAL-1.** `strictPort` is silent here. Document it; do not pretend otherwise.
- **D vs E clears the NaN concern.** `Number(undefined) === NaN`, Vite sanitises it to its default
  5173, and `strictPort` alongside it neither throws nor picks a random port. **D-08 will not break
  `yarn dev` for a developer with no `FRONTEND_PORT` set** — which is every developer who has not
  exported it, since `.env` does not reach Vite (QUAL-2).

### R5.3 — Developer-facing consequence (for the `checkpoint:decision`)

After D-08, a developer whose 5173 is occupied *by a same-family listener* gets:

```
error when starting dev server:
Error: Port 5173 is already in use
```

…and `yarn dev` exits instead of quietly serving on 5174. The remedy is to free the port or run
`FRONTEND_PORT=<port> yarn dev` **and** `FRONTEND_PORT=<port> yarn test:e2e` (QUAL-2 — the export
must reach both). The checkpoint should present exactly this: the concrete new error text, the
two-command remedy, and the honest caveat that it does not cover the Docker wildcard case.

---

## R6 — Negative-control staging (D-11 / D-12) (research priority 6)

**The full two-run control was prototyped and executed this session.** Both runs behaved as the
success criteria require. What follows is a working recipe, not a proposal.

### R6.1 — The adversary (D-11): a throwaway minimal Vite project

Built under the scratch dir, with `node_modules` symlinked from the repo so no install is needed.
Deliberately made the **hardest** adversary the D-11 trade-off allows: it carries a **byte-identical
`<title>Election Compass</title>`** and reproduces the F5 `301 → /sv/` redirect shape, so clauses
(a) and (c) are both genuinely exercised and both are defeated — leaving clause (b) as the only
thing standing.

`$SCRATCH/foreign-app/package.json`
```json
{ "name": "foreign-adversary", "private": true, "type": "module" }
```

`$SCRATCH/foreign-app/index.html`
```html
<!doctype html>
<html lang="sv">
  <head><meta charset="utf-8" /><title>Election Compass</title></head>
  <body><div id="app">foreign</div><script type="module" src="/src/main.js"></script></body>
</html>
```

`$SCRATCH/foreign-app/src/main.js`
```js
document.querySelector('#app').textContent = 'foreign app served from a DIFFERENT checkout';
```

`$SCRATCH/foreign-app/vite.config.js` — the redirect-to-locale middleware that reproduces F5:
```js
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [
    {
      name: 'locale-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '') {
            res.statusCode = 301;
            res.setHeader('location', '/sv/');
            res.end();
            return;
          }
          if (req.url === '/sv/' || req.url === '/sv') {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ]
});
```

Launch:
```bash
ln -s <REPO_ROOT>/node_modules $SCRATCH/foreign-app/node_modules
cd $SCRATCH/foreign-app
<REPO_ROOT>/node_modules/.bin/vite dev --port 5373 --strictPort
#   VITE v7.3.0  ready in 206 ms
#   ➜  Local:   http://localhost:5373/
```

`[VERIFIED: measured 2026-08-13, scratchpad/foreign-app.log]`

> **Port choice matters.** Stage the adversary on a port the operator's own server is NOT on, and
> point the preflight at it explicitly, rather than fighting for 5173. Trying to stage on 5173 while
> Docker holds the wildcard produces the shadow-bind (QUAL-1) and muddies which server is under
> test. The control is about *content*, not about winning a port race.

### R6.2 — The retired check as a throwaway script (D-12)

Derived from the two archived prose sources. Verbatim originals:

`[VERIFIED: .planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/135-04-SUMMARY.md:32]`
> "Assert the :5173 listener is a node process whose command path contains THIS repo before trusting any local E2E measurement — an HTTP 200 proves only that something answered"

`[VERIFIED: .planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/135-04-PLAN.md:45-48]` — the operative instruction, quoted verbatim:
> "Three CONSECUTIVE full-suite `yarn test:e2e` runs. Before EACH run: kill the `:5173` process,
> relaunch `yarn dev`, wait healthy, and assert the listener is `node` (`lsof -nP -iTCP:5173
> -sTCP:LISTEN`) per DEF-135-03 — a sibling checkout's Docker container can win the port and serve a
> stale build answering 200."

`[VERIFIED: .planning/milestones/v2.14-phases/136-real-guards-visual-repair-sweep-remediation/136-01-SUMMARY.md:270]`
> "It is a `node` process answering 200, so it passes the documented 'assert the listener is a node process' check"

The Phase-136 gate additionally used a title grep, recorded verbatim at
`[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:119]`:
> "**Port identity was asserted by RESPONSE CONTENT, not process type** — `curl -s http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'`"

The throwaway script implements **both** (the strictly stronger reading of "the retired check"), so
the blindness demonstration cannot be dismissed as attacking a straw man:

```bash
#!/bin/bash
# The RETIRED check, as it existed only as runbook prose:
#   "assert the listener is a node process (lsof -nP -iTCP:$PORT -sTCP:LISTEN)"
#   plus the Phase-136 title variant: curl | grep -q '<title>Election Compass</title>'
PORT="$1"
LISTENER=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1}')
if [ "$LISTENER" != "node" ]; then echo "  [retired] RESULT: FAIL (listener is not a node process)"; exit 1; fi
if curl -sL "http://localhost:$PORT/" | grep -q '<title>Election Compass</title>'; then
  echo "  [retired] RESULT: PASS (node process + title matches)"; exit 0
else
  echo "  [retired] RESULT: FAIL (title mismatch)"; exit 1
fi
```

### R6.3 — RUN 1 (blindness) — measured output

```
############################################################
# RUN 1 — the RETIRED check against the FOREIGN server :5373
############################################################
  [retired] lsof -nP -iTCP:5373 -sTCP:LISTEN
  [retired] listener COMMAND = 'node'
  [retired] curl -s http://localhost:5373/ | grep '<title>Election Compass</title>'
  [retired] RESULT: PASS (node process + title matches)
  >>> exit=0

############################################################
# RUN 1b — the RETIRED check against OUR server :5273
############################################################
  [retired] RESULT: PASS (node process + title matches)
  >>> exit=0
```

`[VERIFIED: measured 2026-08-13, scratchpad/negcontrol-run1.txt]`

**The retired check cannot tell the two apart. Both exit 0.** That is criterion 1's first run,
discharged.

### R6.4 — RUN 2 (the catch) — measured output

```
############################################################
# RUN 2 — the NEW preflight against the FOREIGN server :5373
############################################################
  [preflight] RESULT: FAIL
  E2E PREFLIGHT FAILED — the server on port 5373 is not this checkout's dev server.
    reason:            the listener is not this checkout's Vite dev server (GET /@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte returned 403, expected 200)
    expected port:     5373 (http://localhost:5373)
    expected checkout: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
    observed:          HTTP 200 -> http://localhost:5373/sv/; <title>Election Compass</title>; served module root: (not found)
    listening process:
      COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
      node    62312 kallejarvenpaa   30u  IPv6 0xa88a40212b978d44      0t0  TCP [::1]:5373 (LISTEN)
    remedies:
      - stop the other server occupying port 5373, then start this repo's `yarn dev`; or
      - re-run with FRONTEND_PORT=<port your server is actually on>
  >>> exit=1

############################################################
# RUN 2b — the NEW preflight against OUR server :5273
############################################################
  [preflight] RESULT: PASS  {"ok":true,"title":"Election Compass","fsStatus":200,"finalURL":"http://localhost:5273/","status":200}
  >>> exit=0
```

`[VERIFIED: measured 2026-08-13, scratchpad/negcontrol-run2.txt]`

Note what the message proves: the adversary **passed clause (a)** (200 after following the redirect
to `/sv/`) and **passed clause (c)** (identical title), and was caught **solely by clause (b)**. This
is the cleanest possible demonstration that clause (b) is load-bearing and clauses (a)/(c) are not.

Criterion 2 ("with this repo's own dev server on the same port, the preflight passes") is
discharged by run 2b — the check is correct, not merely strict.

### R6.4b — The bonus adversary (recommend including in `137-NEGATIVE-CONTROL.md`)

Beyond the staged project, the **live shadow-bind** (QUAL-1) is a second, harder, already-measured
adversary: a real sibling OpenVAA checkout, same application, different repo root, reachable on the
*same port number* as ours. `curl 127.0.0.1:5173` → `Valkompass`; `curl localhost:5173` → ours. It
costs nothing to record and it is a far more convincing artefact than the minimal project alone. It
does not replace D-11 (which the operator chose for reproducibility) — it supplements it.

### R6.5 — `lsof` best-effort wrapping (D-09)

The prototype's implementation, verified to render correctly in the failure block above:

```js
function squatter(port) {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).trim();
  } catch { return null; }          // best-effort: missing/unsupported lsof → omit the line
}
```

Requirements the plan must preserve:
- **`execFileSync`, not `execSync`** — the port is interpolated into an argument; `execFileSync`
  takes an argv array and never invokes a shell, so there is no injection surface even if `baseURL`
  is attacker-influenced.
- **Swallow every error** (`ENOENT` on a platform without `lsof`, non-zero exit when nothing is
  listening, a hang guard via `timeout`). Returning `null` must omit the line, never abort.
- **Add `timeout: 5000`** to the options. `lsof` can block on a stale NFS mount; a hung diagnostic
  must never outlive the failure it is decorating. (Not exercised in the prototype — `[ASSUMED]`
  that 5 s is generous; it returned in well under 100 ms in every observed run.)
- `-sTCP:LISTEN` is the right filter: without it, `lsof` also lists ESTABLISHED client sockets and
  the output becomes noise.

---

## R7 — Doc surfaces (D-14 / D-15) (research priority 7)

### R7.1 — INTEG-06 baseline grep, run NOW

Scope per D-14: `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`.

```
--- pattern: 'node process' ---
  (no match)
--- pattern: 'listener' ---
  (no match)
--- pattern: 'assert the listener' ---
  (no match)
```

`[VERIFIED: measured 2026-08-13, case-insensitive grep over the three files]`

**Scout finding F3 CONFIRMED.** The retired wording is not in any live doc. **INTEG-06 is a pure
ADD.** The "grep returns nothing" half of criterion 4 is *already* satisfied and will remain so as
long as the new wording does not reintroduce the phrase — which means the plan must be careful
about how it describes what is being replaced. **Do not write "this replaces the old 'assert the
listener is a node process' check" into a live doc**: that sentence would itself make the criterion-4
grep return a hit. Describe the new behaviour positively, and leave the history in the archive and
in `137-NEGATIVE-CONTROL.md`.

The verifier should re-run this exact grep after the doc edits and expect the same zero result.

### R7.2 — `CLAUDE.md` anchor (D-15: E2E section, ~4 lines)

`[VERIFIED: CLAUDE.md:30-45]` — read this session, structure quoted:

```
30	### Testing
32	```bash
33	yarn test:unit                 # Run all unit tests (vitest)
34	yarn test:unit:watch          # Run unit tests in watch mode
35	yarn test:e2e                 # Run Playwright E2E tests (requires yarn dev running)
36	yarn playwright install       # Install Playwright browsers
37	```
39	#### E2E Hard Rule (cardinal failure)
41	> **Failing E2E tests are a CARDINAL FAILURE. …**
43	- **No "known-flaky" exemptions.** …
44	- **Prefer E2E for interim verification.** …
45	- A "did not run" E2E test counts as a failure …
47	### Linting & Formatting
```

**Recommended insertion point:** a new `#### E2E preflight` subsection immediately after the
`E2E Hard Rule` bullet list (i.e. after line 45, before line 47). Rationale: the Hard Rule says
failing E2E is cardinal; the very next thing a reader needs is "…and here is the gate that fires
before any test runs, and why it might abort your run." Placing it before the Hard Rule would bury
the cardinal rule.

The four lines must carry (per D-15 + QUAL-1 + QUAL-2): (1) it runs automatically from `globalSetup`
and aborts the run; (2) what it asserts — the served app's own HTTP response proves this checkout;
(3) `FRONTEND_PORT=<port>` exported for **both** `yarn dev` and `yarn test:e2e` as the alternate-port
escape hatch; (4) `yarn dev` now fails loudly on a taken port (`strictPort`).

Note line 35's existing parenthetical — `# Run Playwright E2E tests (requires yarn dev running)` — is
already almost right and could gain "…and is preflight-checked" for one-line reinforcement.

### R7.3 — `tests/README.md` anchor (D-15: Run / prereqs, fuller)

`[VERIFIED: tests/README.md:5-25]` — quoted verbatim:

```
 5	## Run
 6	
 7	```bash
 8	# Prereqs: yarn install && (in another shell) yarn dev
 9	yarn test:e2e                              # full suite — configured for 6 workers (1 on CI)
10	yarn test:e2e --project=voter-journey      # one project (still pulls in its dependency chain)
11	yarn test:e2e --grep "result card"         # filter by title substring
12	yarn test:e2e --reporter=line              # less noisy output
13	```
15	Type-check the suite without running it:
17	```bash
18	yarn typecheck:tests                       # tsc --noEmit over tests/
19	```
21	List the discovered tests without a running dev server (useful as a "no dropped specs" check):
23	```bash
24	cd tests && npx playwright test --list
25	```
```

**Recommended insertion point:** immediately after the line 13 fence, before "Type-check the suite"
(line 15). The `# Prereqs:` comment on line 8 is the natural hook — the fuller prose explains what
happens when that prereq is not met.

Content per D-15: everything from `CLAUDE.md` plus **how to read the failure message** (walk the
`reason` / `expected checkout` / `observed` / `listening process` fields) and **the two remedies
verbatim**. Add the QUAL-2 warning explicitly: setting `FRONTEND_PORT` in `.env` moves Playwright
but not the dev server.

**Also worth one line here:** line 21-25 documents `--list` as usable *without a running dev server*.
That remains true (§R2.2 — `globalSetup` does not run on `--list`) and the doc should say so
explicitly now that a preflight exists, or a reader will assume the preflight broke it.

### R7.4 — `tests/IDURA-TEST-RUNBOOK.md` anchor (D-15: one cross-reference line)

`[VERIFIED: tests/IDURA-TEST-RUNBOOK.md:275]` — the sole `FRONTEND_PORT` occurrence in the file:
```
275	PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 \
```
It sits inside the `## EFLOW-10 — deterministic E2E run` section (heading at `:192`).
`[VERIFIED: tests/IDURA-TEST-RUNBOOK.md:192]`

**Recommended:** one line immediately after the command block containing line 275, cross-referencing
`tests/README.md` § Run for the preflight, and noting that `FRONTEND_PORT=5174` here must also be
exported when starting `yarn dev` (QUAL-2) — this file is the one place that already teaches an
alternate port, so it is the highest-value place for that correction.

**Caution:** this file contains `127.0.0.1` in many places (`:118`, `:122`, `:131`, `:318`, …), but
those refer to Supabase, the mock OIDC issuer, and `config.toml [auth].site_url` — **not** the
frontend under test. Do not "normalise" them. Line 134 already warns:
> "consistently — `localhost` vs `127.0.0.1` must match what you browse with"

which is the same hazard QUAL-1 surfaced, independently noticed. Worth citing in the plan as
in-repo precedent that this distinction is load-bearing.

---

## Standard Stack

**No new dependencies. Nothing to install.**

### Core (all already present)

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `@playwright/test` | 1.58.2 | `globalSetup` hook, `FullConfig` type | Already the harness. `[VERIFIED: node_modules/@playwright/test/package.json]` |
| Node `fetch` (global, undici) | Node v24.14.1 | HTTP probes with `redirect: 'follow'` | Built in since Node 18; no `node-fetch`/`axios` needed. Measured working. |
| Node `fs`, `path`, `url` | built-in | Read the messages catalogue; derive the repo root | D-03's derivation is pure stdlib. |
| Node `child_process.execFileSync` | built-in | Best-effort `lsof` line (D-09) | Shell-free argv form; no injection surface. |
| `dotenv` | already imported at `tests/playwright.config.ts:8` | Root `.env` → Playwright's `process.env` | Existing behaviour, unchanged. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Node global `fetch` | `playwright.request.newContext()` | Would use Playwright's network stack (closer to what specs do) but pulls a browser-adjacent API into `globalSetup` for no measured benefit — Chromium and Node were measured to agree on resolution (§R1.7). `fetch` is simpler and dependency-free. |
| `globalSetup` | a root `preflight` setup project | Rejected by D-04 on F7. Independently confirmed: `config.projects` shows ~97 projects and `globalSetup` is the only hook measured to fire on every invocation shape (§R2.2). |
| `/@fs` probe | Q1.1 option C module-content probe | **Not needed** — clause (b) verified (§R1.2). Option C is also strictly weaker here: it would need `/src/routes/+layout.svelte` (a *relative* path), which is not checkout-unique — the sibling OpenVAA container would serve its own file at the same relative URL. Absolute-path uniqueness is the whole point. |

### Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every module used is either a Node
built-in or already present in `package.json` / `yarn.lock` and in active use by the existing
harness. No `npm install` / `yarn add` step appears in any recommendation above.

- Packages removed due to `[SLOP]` verdict: **none** (none proposed).
- Packages flagged `[SUS]`: **none** (none proposed).

---

## Architecture Patterns

### System architecture — the preflight's place in a run

```
  operator / CI:  yarn test:e2e   (or npx playwright test --project=X, --grep, --shard)
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Playwright config LOAD  (tests/playwright.config.ts)         │
  │   • dotenv.config()            → root .env into process.env  │
  │   • orphan-probe guard :33-47  → THROWS on --list too        │
  │   • baseURL :121 from FRONTEND_PORT                          │
  └──────────────────────────────┬──────────────────────────────┘
                                 │      (--list stops here → no preflight, by design)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ webServer (only when PLAYWRIGHT_BANK_AUTH)  ← starts FIRST   │
  │   mock OIDC issuer :9443, readiness-probed                   │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌═════════════════════════════════════════════════════════════┐
  ║ globalSetup  →  PREFLIGHT           ◀── THE NEW GATE         ║
  ║   in:  config.projects[0].use.use.baseURL                    ║
  ║   derive: REPO_ROOT (TESTS_DIR/../..), appName set (fs)      ║
  ║                                                              ║
  ║   poll ≤ CI?120s:30s ──▶ (a) GET baseURL, follow redirects   ║
  ║                              └─ 2xx?  ──no──▶ FAIL           ║
  ║                          (b) GET /@fs<ROOT>/apps/frontend/   ║
  ║                                  src/routes/+layout.svelte   ║
  ║                              └─ ===200? ─no──▶ FAIL ◀ LOAD-  ║
  ║                                                      BEARING ║
  ║                          (c) <title> ∈ appName set?          ║
  ║                              └─ present & outside ─▶ FAIL    ║
  ║                                                              ║
  ║   FAIL ⇒ throw ⇒ exit 1, NO spec body runs                   ║
  ╚══════════════════════════════┬══════════════════════════════╝
                                 ▼ (pass only)
  ┌─────────────────────────────────────────────────────────────┐
  │ ~97 projects: data-setup-base ┐   data-setup-perm-1e1cg1co ┐ │
  │                               ├─ journeys …                 │ │
  │        (F7: parallel dependency-less roots — why the gate    │
  │             must be global, not graph-based)                 │
  └─────────────────────────────────────────────────────────────┘
```

### Recommended module layout

```
tests/
├── playwright.config.ts          # + globalSetup: './global-setup.ts'   (one line)
├── global-setup.ts               # thin: read baseURL from FullConfig, call assertServedApp()
└── tests/
    └── support/
        └── preflight.ts          # the logic: derivation, 3 clauses, poll, D-09 message
```

**Why split.** `global-setup.ts` is the Playwright-shaped adapter (takes `FullConfig`, throws);
`preflight.ts` is a pure-ish function `assertServedApp({ baseURL, repoRoot, deadlineMs })` that a
unit test can call directly with a stub server. Both are covered by `yarn typecheck:tests` (§R2.5).
A single-file version also works and is defensible for ~120 lines — the discretion is the planner's
(CONTEXT.md § Claude's Discretion), but the split is what makes §"Validation Architecture" testable
without a real dev server.

### Pattern 1 — Read the target, never recompute it

**What:** derive the probe target from `FullConfig`, not from `process.env.FRONTEND_PORT`.
**When:** always.
**Why:** a second copy of the `:121` expression is a second thing that can drift — and drift is the
category of bug this whole phase exists to eliminate.

```ts
// Source: measured shape of FullConfig, §R2.1
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL
    ?? (process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173');
  await assertServedApp({ baseURL, repoRoot: path.resolve(TESTS_DIR, '..', '..') });
}
```

### Pattern 2 — Poll liveness, assert identity once

**What:** the retry ceiling applies to clause (a) only.
**Why:** clauses (b)/(c) are deterministic given a live server (0.1 ms–0.1 s measured). Retrying
them turns a real identity mismatch into a 120 s stall before the identical failure — a worse
operator experience for zero benefit.

### Pattern 3 — Assert `=== 200`, and assert the echoed path

```ts
// Source: measured body of the 200 response, §R1.2
const fsURL = `${baseURL}/@fs${probeAbsPath}`;
const res = await fetch(fsURL);
const body = res.status === 200 ? await res.text() : '';
const ok = res.status === 200 && body.includes(probeAbsPath);   // the HMR preamble echoes it back
```

### Anti-Patterns to Avoid

- **`status !== 404`** — measured 403 from a foreign server whose root is elsewhere (§R1.3). Use `=== 200`.
- **Probing `/@fs<ROOT>/package.json`, `/yarn.lock`, `/.git/HEAD`, `/packages/**`** — all **403 from
  our own server** (§R1.4). Would fail every correct run.
- **Rewriting `localhost` → `127.0.0.1`** — would test a different server than the specs use under
  the shadow-bind (QUAL-1).
- **`if (process.env.CI) return`** — forbidden by D-05; it is the skip path INTEG-05 exists to close.
- **Reading `.appName` instead of `.dynamic.appName`** — returns `undefined` for all seven locales (§R1.6).
- **Making clause (c) fatal when the title is absent** — maintenance mode legitimately replaces it
  (F4, `apps/frontend/src/routes/+layout.ts:26-28`).
- **Writing the phrase "assert the listener is a node process" into a live doc** — it would make
  criterion 4's own grep fail (§R7.1).
- **`execSync` with an interpolated port** — use `execFileSync` with an argv array.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Run-wide gate that cannot be skipped | A dependency edge onto a "preflight" project | Playwright `globalSetup` | F7: parallel dependency-less roots exist today and new ones escape silently. `globalSetup` measured to fire on every invocation shape (§R2.2). |
| Waiting for the dev server | A shell `for i in $(seq 1 60); curl … ; sleep 2` loop | The preflight's own poll | The existing loop is fail-open (F2, §R4.1) and asserts nothing. D-05: one mechanism. |
| Following redirects | Manual `location:` header chasing | `fetch(url, { redirect: 'follow' })` | Node's fetch handles the F5 `301 → /sv/` chain and exposes the final URL as `res.url`, which D-09 wants anyway. |
| Proving the checkout | Comparing git SHAs, `package.json` name, or `<title>` | The `/@fs<ABS_PATH>` 200 | Measured: title is defeatable by a 6-line adversary (§R6.3); the absolute path is not (§R1.3). |
| Preventing same-port drift | A wrapper script around `yarn dev` | Vite's `strictPort` | One config line; measured to exit the process (§R5.2 B2). |
| Finding the port squatter | Parsing `/proc/net/tcp` or `netstat` | `lsof -nP -iTCP:<port> -sTCP:LISTEN`, best-effort | Already the repo's documented idiom (135-04-PLAN.md:46). Wrap it; never depend on it. |

**Key insight:** every custom alternative in this table was *already tried* somewhere in this repo's
history and is the reason the phase exists. The CI wait loop, the title grep, and the "is it a node
process" check are three hand-rolled identity/readiness checks, and all three were measured blind
this session.

---

## Common Pitfalls

### Pitfall 1: Probing a path outside SvelteKit's `fs.allow`
**What goes wrong:** the preflight returns 403 against a perfectly correct checkout and blocks every E2E run.
**Why:** SvelteKit **replaces** Vite's default allow list with six specific entries (§R1.4); the repo root is not among them.
**How to avoid:** probe only under `apps/frontend/src/**` or `apps/frontend/.svelte-kit/**`. Keep `+layout.svelte`.
**Warning signs:** a 403 whose body says `outside of Vite serving allow list` and lists our own directories.

### Pitfall 2: Deleting the CI wait loops by line number, in order
**What goes wrong:** the second deletion lands 7 lines off and removes part of the wrong step.
**Why:** removing 245-251 shifts everything below it.
**How to avoid:** delete the `e2e-visual` block (325-331) first, or match on the verbatim content in §R4.1.
**Warning signs:** a workflow diff touching `- name: "Run visual regression tests (blocking)"`.

### Pitfall 3: Deleting only the `run:` body, leaving an orphan step name
**What goes wrong:** invalid workflow — a step with `name:` and no action.
**Why:** the scout's `:246-250` / `:326-330` citation covers the body only; the step starts at 245 / 325.
**How to avoid:** delete 245-251 and 325-331 inclusive.

### Pitfall 4: Believing `.env` moves the dev server
**What goes wrong:** operator sets `FRONTEND_PORT=5273` in `.env`, `yarn dev` binds 5173, Playwright targets 5273, preflight fails with a message the operator reads as a bug in the preflight.
**Why:** QUAL-2 — `vite.config.ts` reads `process.env` before any `.env` loading; only Playwright's `dotenv.config()` sees the file.
**How to avoid:** document `FRONTEND_PORT=<port>` exported for **both** commands. This is a D-15 deliverable, not a nice-to-have.
**Warning signs:** a failure message whose "expected port" is not the port `yarn dev` printed.

### Pitfall 5: Assuming `strictPort` closed the hole
**What goes wrong:** the plan claims the drift is prevented at source; the Docker wildcard shadow-bind still yields two apps on one port and the claim is false (QUAL-1).
**How to avoid:** state both halves — `strictPort` for same-address drift, the preflight for the shadow-bind.
**Warning signs:** `lsof -nP -iTCP:5173` showing two LISTEN rows; `curl localhost:` and `curl 127.0.0.1:` returning different titles.

### Pitfall 6: Reintroducing the retired phrase while documenting its retirement
**What goes wrong:** criterion 4's grep returns a hit — caused by the very edit meant to satisfy it.
**How to avoid:** describe the new check positively in live docs; keep the history in `137-NEGATIVE-CONTROL.md` and the archive (§R7.1).

### Pitfall 7: A hung `lsof` outliving the failure
**What goes wrong:** the diagnostic decoration blocks the abort.
**How to avoid:** `execFileSync(..., { timeout: 5000 })` inside `try/catch`, returning `null` on any error.

### Pitfall 8: Retrying clause (b) inside the poll
**What goes wrong:** a genuine foreign server produces a 120 s hang before failing.
**How to avoid:** poll clause (a) only (Pattern 2).

---

## Runtime State Inventory

This phase is a harness/config change, not a rename or migration. Completed for completeness because
the phase touches CI and developer workflow.

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | **None** — the preflight reads no database and writes no rows. Verified: no Supabase/`dev-seed` surface is touched by any decision D-01…D-15. | none |
| Live service config | **None in a UI/DB.** The only external service in scope is Docker Desktop's sibling container holding `*:5173`, which is *not* configuration this repo owns — it is an environmental adversary (QUAL-1). | none (documented, not changed) |
| OS-registered state | **None.** No launchd/systemd/scheduler registration exists for `yarn dev`; it is started interactively or by the CI step at `main.yaml:243`/`:323`. | none |
| Secrets / env vars | **`FRONTEND_PORT` — name unchanged, semantics clarified.** Two consumers today (`playwright.config.ts:121`, `emailBucket.fixture.ts:221-222`), both via `dotenv.config()`; the dev server does **not** read it from `.env` (QUAL-2). No key renamed, no new var added (D-07 forbids a bypass var). `.env.example:15` unchanged. | doc-only (D-15) |
| Build artifacts / installed packages | **None stale.** No package rename, no `dist` semantics change. `.svelte-kit` and `node_modules/.vite` were wiped and regenerated during the cold-start measurement (§R4.2) — this is exactly what `yarn dev` does every run via `dev:clean`, so no residue. | none |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node | preflight runtime | ✓ | v24.14.1 | — |
| `@playwright/test` | `globalSetup` | ✓ | 1.58.2 | — |
| Vite (frontend-resolved) | `/@fs` probe semantics | ✓ | **6.4.1** | — |
| SvelteKit | `fs.allow` list shape | ✓ | 2.55.0 | — |
| Local Supabase | clause (a) rendering `/` | ✓ | responding 200 on `:54321` | clause (a) still returns 200 without seed data (measured: `Invalid result from DataProvider: Result is empty` logged, page still 200) |
| `lsof` | D-09 diagnostic line | ✓ (macOS) | system | **required fallback:** omit the line (D-09 mandates best-effort). Not guaranteed on the CI container image. |
| `gh` CLI | CI timing evidence | ✓ authenticated | — | **used, but data stale** — newest workflow run 2026-07-26 (§R4.2); ceiling chosen from the existing loop's budget instead |
| `timeout` (coreutils) | — | ✗ (macOS) | — | not needed by the deliverable; only bit the research (`env: timeout: No such file or directory`). Do **not** put `timeout` in any macOS-run script. |
| Docker Desktop | negative-control adversary | ✓ (holding `*:5173`) | — | D-11's staged Vite project is the reproducible substitute (§R6.1) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `lsof` (omit the D-09 line); `timeout` (avoid entirely).

---

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Unit framework | Vitest (`yarn test:unit` → `turbo run test:unit`) `[VERIFIED: package.json]` |
| E2E framework | Playwright 1.58.2, config `tests/playwright.config.ts` |
| Test config for `tests/` | `tests/tsconfig.json` (type-check only; **the `tests/` workspace has no vitest project**) |
| Quick run command | `yarn typecheck:tests` + the preflight's own two-run control |
| Full suite command | `yarn test:e2e` |

> **Wave 0 gap, stated plainly:** `tests/package.json` is **empty/absent as a workspace manifest**
> (`cat tests/package.json` returned nothing) and there is no vitest project under `tests/`. So a
> conventional unit test for `preflight.ts` has **no existing home**. Two honest options for the
> planner: (i) put the pure helpers under an existing package that already has vitest, or (ii) accept
> that the preflight's validation is behavioural (the two-run control + real-suite runs) rather than
> unit-level. **(ii) is recommended** — the check's whole value is its behaviour against a real
> foreign server, which a mocked unit test would not exercise, and standing up a new vitest project
> inside `tests/` is scope this phase did not ask for.

### Phase requirements → validation map

| Req | Behaviour to validate | Type | Command | Exists? |
|---|---|---|---|---|
| INTEG-04 | Foreign dev server on the target port ⇒ preflight FAILS, naming the mismatch | behavioural, 2-run control | stage adversary (§R6.1), then `npx playwright test -c tests/playwright.config.ts --grep <trivial> ` with `FRONTEND_PORT=<adversary port>` ⇒ expect exit 1 | ❌ Wave 0 (prototype proven, §R6.4) |
| INTEG-04 | This checkout's own server ⇒ preflight PASSES, suite proceeds | behavioural | `FRONTEND_PORT=<own port> yarn test:e2e --project=<one cheap project>` ⇒ exit 0, specs execute | ❌ Wave 0 (prototype proven, §R6.4, run 2b) |
| INTEG-05 | Cannot be skipped | behavioural matrix | run with no flags, `--project=X`, `--grep`, `--shard=1/2` against a wrong port ⇒ all exit 1 before any spec body | ❌ Wave 0 (mechanism proven, §R2.2) |
| INTEG-05 | Aborts *before* the first spec | behavioural | assert no spec stdout in the failing run's output | ❌ Wave 0 (proven, §R2.3) |
| INTEG-06 | Retired wording absent from live docs | static | `grep -rn -i "listener\|node process" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md` ⇒ **no match** | ✅ passes today (§R7.1); must still pass after edits |
| INTEG-06 | New wording present | static | grep for `FRONTEND_PORT` + "preflight" in the three files ⇒ match in each | ❌ Wave 0 |
| D-05 | CI loops gone, both jobs | static | `grep -c "Wait for frontend" .github/workflows/main.yaml` ⇒ **0** | ❌ Wave 0 |
| D-08 | `strictPort` present and effective | static + behavioural | `grep -n strictPort apps/frontend/vite.config.ts`; occupy the port same-family and confirm `yarn dev` exits non-zero | ❌ Wave 0 (behaviour proven, §R5.2 B2) |
| Regression | The whole suite still green | E2E | `yarn test:e2e` — cardinal rule | ✅ exists |

### How criterion 1's two-run negative control is captured as durable evidence

Criterion 1 is the only success criterion that requires an *observation of a failure* as its proof,
so the evidence must survive the run that produced it. Per D-13 it lands in
`137-NEGATIVE-CONTROL.md`, which must contain, for the **same** staged scenario:

1. **The adversary's construction** — the four files verbatim (§R6.1) plus the launch command, so
   any reader can rebuild it. This is the whole point of the operator's choice of D-11 option B.
2. **Run 1, the retired check** — the throwaway script's source verbatim (§R6.2), the command, and
   its **stdout showing `PASS` / exit 0** against the adversary. Plus the same script against our own
   server, also `PASS` — the pair is what demonstrates *blindness* rather than mere leniency. A
   single PASS proves nothing; the indistinguishability is the finding.
3. **Run 2, the new preflight** — the command and its **stdout showing the full D-09 failure block
   and exit 1** against the same adversary, and **PASS against our own server**. Both halves, or
   criterion 2 is not discharged.
4. **The environment stamp** — versions from §R1.1, the date, and `lsof` output for the ports
   involved, so a future reader can tell whether a re-run that behaves differently is a regression or
   a different environment.
5. **Recommended addition** — the QUAL-1 shadow-bind observation (§R6.4b), labelled as a *found* (not
   staged) adversary, with the `curl localhost:` vs `curl 127.0.0.1:` title pair. It is the most
   convincing single artefact available and it is already measured.

The prototype in this research produced items 2–4 in full; §R6.3 and §R6.4 can be lifted directly
into the evidence doc, with the run re-executed against the *committed* preflight rather than the
prototype.

### Sampling rate

- **Per task commit:** `yarn typecheck:tests` + `yarn lint:check`.
- **Per wave merge:** the static greps (INTEG-06, D-05, D-08) + one preflight PASS run.
- **Phase gate:** the full two-run negative control, recorded to `137-NEGATIVE-CONTROL.md`, **plus**
  a full `yarn test:e2e` green (cardinal rule), **plus** a real CI run — because the CI wait-loop
  removal (§R4.2) is the one change whose failure mode is CI-only and cannot be caught locally.

### Wave 0 gaps

- [ ] `tests/global-setup.ts` (or equivalent) — covers INTEG-04, INTEG-05
- [ ] `tests/tests/support/preflight.ts` — the clause logic
- [ ] The staged adversary recipe, scripted for repeatability — covers criterion 1
- [ ] `137-NEGATIVE-CONTROL.md` — the durable evidence (D-13)
- [ ] No test-framework install needed.

---

## Security Domain

`security_enforcement` is absent from `.planning/config.json` → treated as **enabled**.
`[VERIFIED: .planning/config.json — read this session; keys are mode, depth, parallelization, commit_docs, model_profile, granularity, workflow, model_overrides]`

### Applicable ASVS categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | The preflight authenticates nothing; it runs before any auth setup project. |
| V3 Session Management | no | No session created or consumed. |
| V4 Access Control | no | No authorization decision. |
| V5 Input Validation | **yes** | The port/URL flows into an `lsof` argv and into `fetch`. Use `new URL(baseURL).port` (rejects malformed input) and `execFileSync` with an argv array — never a shell string. |
| V6 Cryptography | no | No crypto. |
| V12 Files & Resources | **yes (indirectly)** | The phase *depends on* Vite's `server.fs.allow` boundary being enforced — it is the mechanism that makes the probe discriminate. The phase must **not** widen it. Adding `server.fs.allow` entries to make a "nicer" probe path work would weaken a real security control (arbitrary file read from the dev server) for a test convenience. Explicitly out of bounds. |
| V14 Configuration | **yes** | The only app-tier change is `strictPort: true`. It reduces ambiguity about what is listening — a net configuration-hygiene gain. D-02's rejection of `/api/__identity` correctly avoids adding production surface. |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation | Status in this phase |
|---|---|---|---|
| Command injection via interpolated port into `lsof` | Tampering / Elevation | `execFileSync` with argv array + `timeout`; no shell | Specified in §R6.5 |
| Widening `server.fs.allow` to ease the probe → arbitrary file read from the dev server | Information Disclosure | Do not touch `server.fs`; choose a path already inside SvelteKit's defaults | Specified in §R1.4 (the chosen path needs no config change) |
| Adding a dev/identity endpoint that ships enabled to production | Information Disclosure | Do not add one | **D-02 already rejects it**; deferred item carries the "needs a guard so it never ships enabled" caveat |
| Secrets leaking into the failure message | Information Disclosure | The D-09 message prints port, absolute repo path, HTTP status, final URL, `<title>`, module root, and `lsof` output — **no env values, no tokens**. `lsof` output includes a username and PIDs; acceptable for a local dev diagnostic, and it is what the existing runbook already prints. | Verify the plan does not add `process.env` dumps to the message |
| Test harness silently passing against an untrusted server | Spoofing | **This is the entire phase.** | — |

**One concrete instruction for the plan:** the failure message must not interpolate the *response
body* wholesale (only the extracted `<title>` and module root). A hostile or merely enormous foreign
response would otherwise be dumped into CI logs.

---

## State of the Art

| Old approach | Current approach | When changed | Impact |
|---|---|---|---|
| Vite's default `server.fs.allow` = workspace root | **SvelteKit replaces it** with `src/lib`, `src/routes`, `.svelte-kit`, `src`, `apps/frontend/node_modules`, root `node_modules` | SvelteKit 2.x (measured on 2.55.0) | Determines which `/@fs` paths are probe-able (§R1.4) — the single most consequential correction in this research |
| `node-fetch` / `axios` for Node HTTP | Global `fetch` with `redirect: 'follow'` | Node 18+ (running v24.14.1) | No dependency needed for clause (a) |
| `globalSetup` returning a teardown function | `globalSetup` / `globalTeardown` as separate config keys, each accepting `string \| Array<string>` | Playwright 1.49+ (measured on 1.58.2) | `globalSetup?: string\|Array<string>` — arrays are supported if the phase ever needs to compose gates `[VERIFIED: types/test.d.ts:1301]` |

**Deprecated / outdated in this context:**
- The CI shell wait loop — being deleted (D-05).
- The `<title>` grep as an identity check — measured defeated by a 6-line adversary (§R6.3).
- "Assert the listener is a `node` process" — measured blind (§R6.3); never existed in code (F3).

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | CI's cold-start fits inside 120 s | §R4.2 | CI-only preflight timeouts. **Mitigated by construction:** 120 s is exactly the budget the deleted loop already granted, so this cannot be *worse* than today — only louder. Must be confirmed by a real CI run in the phase gate. |
| A2 | Node's and Chromium's `localhost` resolution agree on Linux/CI as they do on macOS | §R1.7 | The preflight could validate one server while specs hit another under a CI shadow-bind. Low likelihood (CI runners rarely have a competing listener) and mitigated by probing the exact `baseURL` string. Not measured on Linux. |
| A3 | `actions/checkout@v4` places the repo at `/home/runner/work/<repo>/<repo>` | §R3.3 | None material — the argument only needs "not the developer's macOS path", which is verified. |
| A4 | `lsof` is present on the CI container image | §R6.5 / Environment | None — D-09 mandates best-effort; absence omits one diagnostic line. |
| A5 | A 5 s `timeout` on `execFileSync('lsof')` is generous | §R6.5 | A pathological `lsof` hang could still delay an abort by 5 s. Observed <100 ms in every run this session. |
| A6 | The seven-locale `dynamic.appName` set is the complete set for clause (c) | §R1.6 | A new locale would make clause (c) reject a legitimate title — **mitigated by enumerating the directory at runtime rather than hardcoding**, which is D-03's requirement anyway. Note an Arabic locale is in flight on `feat-rtl-locales` per project memory. |
| A7 | The root `.env` contains `FRONTEND_PORT=5173` (matching `.env.example:15`) | QUAL-2 | Reading `.env` was denied by the permission system (secrets file). If the local `.env` diverges, the operator's Playwright `baseURL` differs from the assumed 5173 — which the preflight would *correctly* surface. `.env.example:15` is verified; the live `.env` is not. |

---

## Open Questions

1. **Does the shadow-bind occur on Linux/CI?**
   - Known: it occurs on macOS with Docker Desktop's `SO_REUSEADDR` wildcard bind (§QUAL-1, measured).
   - Unclear: Linux's default `bindv6only` and socket semantics differ; a wildcard bind there normally *does* block a more-specific bind.
   - Recommendation: do not attempt to fix it in this phase. The preflight catches it wherever it occurs; that is sufficient. Note it in `137-NEGATIVE-CONTROL.md` as macOS-observed.

2. **Should the `137-NEGATIVE-CONTROL.md` adversary recipe be committed as a script?**
   - Known: D-12 says the *retired-check script* is scratch-only, not committed to the harness.
   - Unclear: D-11/D-13 do not say whether the *adversary* recipe may be committed as a doc-embedded snippet.
   - Recommendation: embed the four files verbatim **inside** `137-NEGATIVE-CONTROL.md` (as §R6.1 does here) rather than adding runnable files to the repo. This satisfies "reproducible on any machine" without adding harness surface — and matches the `136-VISUAL-DISCRIMINATION-EVIDENCE.md` precedent of evidence-as-document.

3. **Should clause (b) also assert the echoed absolute path in the body?**
   - Known: the 200 body contains the probed absolute path verbatim (§R1.2, measured).
   - Unclear: whether Vite guarantees the `__vite__createHotContext("…")` preamble across versions.
   - Recommendation: assert it, but as a **secondary** condition combined with `status === 200`, and derive the expected substring from the same variable used to build the URL — so a future Vite that drops the preamble degrades to the status check rather than failing every run. Flag for re-verification if Vite is upgraded past 6.x.

4. **Exact CI poll ceiling — is 120 s defensible without CI data?**
   - Known: newest workflow run is 2026-07-26 (§R4.2); no current-branch run exists.
   - Recommendation: 120 s, justified as budget-preserving rather than as a startup-time estimate. If the phase's CI run shows the preflight passing in ≪120 s, a follow-up may tighten it with data — but tightening is not this phase's job.

---

## Project Constraints (from CLAUDE.md)

Directives extracted from `./CLAUDE.md` that bind this phase's plan:

| Directive | Source | Bearing on Phase 137 |
|---|---|---|
| **E2E Hard Rule — failing E2E is a CARDINAL FAILURE**; no task completes while any E2E test fails | `CLAUDE.md:39-45` | The phase gate must include a full green `yarn test:e2e`. The preflight itself must not introduce a failure mode that trips this. |
| **No "known-flaky" exemptions**; a "did not run" counts as a failure | `CLAUDE.md:43, :45` | A preflight abort makes *every* test "did not run" — so a flaky preflight is maximally severe. The poll ceiling (§R4.2) and the poll-liveness-only pattern exist to keep it deterministic. |
| **Prefer running the whole E2E suite** for interim verification | `CLAUDE.md:44` | Verification steps should call `yarn test:e2e`, not ad-hoc curls. |
| **`db:*` = database only; `dev:*` = full stack**; no `supabase:*` scripts, no deprecated aliases | `CLAUDE.md` § Database & Stack Commands | Any command written into the D-15 docs must use the harmonised names. `yarn dev` (full stack) is the correct prereq wording; `yarn db:reset` is DB-only. |
| **Never commit sensitive data (.env files)** | `CLAUDE.md` § Important Implementation Notes | The preflight must not echo env values into failure messages (§ Security Domain). Note the live `.env` was not readable during research by design. |
| **Use TypeScript strictly — avoid `any`, prefer explicit types** | `CLAUDE.md` § Important Implementation Notes | `preflight.ts` must type its options object and use `FullConfig` rather than `any`. `yarn typecheck:tests` enforces it. |
| **Check work against the Code Review Checklist** | `CLAUDE.md` § Code Review, `.agents/code-review-checklist.md` | Applies to the two new TS modules. |
| **Localization — all user-facing strings support multiple locales** | `CLAUDE.md` § Important Implementation Notes | **Not applicable:** the preflight message is developer-facing tooling output, not app UI. Worth stating so a reviewer does not flag it. |

---

## Sources

### Primary (HIGH confidence — measured live this session)

- **Live dev server of this checkout on `:5273`** (Vite 6.4.1 / SvelteKit 2.55.0) — clause (a)/(b)/(c) verification, `fs.allow` enumeration, cold-start timing. `scratchpad/probe-own-server.txt`, `scratchpad/fs-allow-list.txt`, `scratchpad/cold-start.log`
- **Live foreign sibling OpenVAA container on `:5173`** (Docker Desktop) — the F5 adversary, re-measured; the shadow-bind discovery. `scratchpad/discriminator-matrix.txt`, `scratchpad/shadow-bind-5173.txt`
- **Staged minimal Vite adversary on `:5373`** — the D-11 recipe, executed. `scratchpad/foreign-app.log`
- **Isolated Playwright harness** (`scratchpad/pw/`) — `globalSetup` signature, invocation matrix, throw semantics, webServer ordering. Playwright 1.58.2.
- **`strictPort` matrix** (Tests A2/B2/C/D/E) — `scratchpad/strict-*.log`
- **`.env`-vs-shell experiment** — `scratchpad/envtest.log`, `scratchpad/envtest2.log`
- **Negative-control prototype, both runs** — `scratchpad/negcontrol-run1.txt`, `scratchpad/negcontrol-run2.txt`
- **Host-resolution comparison (Node vs Chromium)** — `scratchpad/host-resolution-result.txt`

### Primary (HIGH confidence — repo files read this session)

- `apps/frontend/vite.config.ts` (full, 27 lines) · `apps/frontend/svelte.config.js` (full) · `apps/frontend/package.json`
- `tests/playwright.config.ts` (`:1-60`, `:110-135`, `:1100-1145`) · `tests/tests/utils/testsDir.ts` (full) · `tests/tsconfig.json` (full) · `tests/tests/fixtures/shared/emailBucket.fixture.ts:205-235`
- `.github/workflows/main.yaml:200-345`
- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/dynamic.json`
- `CLAUDE.md:28-48` · `tests/README.md:1-40` + heading map · `tests/IDURA-TEST-RUNBOOK.md` (anchors)
- `package.json` (scripts, full) · `.env.example:15` · `.planning/config.json` · `.planning/REQUIREMENTS.md:48-50` · `.planning/STATE.md:37-41`
- `node_modules/playwright/types/test.d.ts:1301`

### Secondary (MEDIUM confidence — archived planning record)

- `.planning/milestones/v2.14-phases/135-*/135-04-PLAN.md:45-48` and `135-04-SUMMARY.md:32` — retired-check wording
- `.planning/milestones/v2.14-phases/136-*/136-01-SUMMARY.md:270, :274` — the incident narrative
- `.planning/milestones/v2.14-REQUIREMENTS.md:119` — the Phase-136 title-grep variant
- `.planning/milestones/v2.14-phases/131-*/131-05-SUMMARY.md:139` — the mirror-image `[::1]` bind observation

### Tertiary (LOW confidence)

- `gh run list` — CI history checked, **found stale** (newest relevant run 2026-07-26); explicitly **not** used to set the poll ceiling.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| D-01 clause (b) load-bearing probe | **HIGH** | Verified against one own server and two distinct foreign servers, with response bodies recorded |
| `fs.allow` scoping | **HIGH** | The effective allow list was read verbatim out of a live 403 response |
| `globalSetup` mechanics | **HIGH** | Six invocation shapes plus throw semantics and webServer ordering, all executed |
| `strictPort` behaviour | **HIGH** | Five-case matrix executed on the frontend's own Vite 6.4.1 |
| `.env` / dev-server asymmetry | **HIGH** | Controlled two-arm experiment |
| Negative control feasibility | **HIGH** | Both runs executed end to end; outputs recorded |
| CI line ranges | **HIGH** | Read verbatim with indentation preserved |
| CI poll ceiling | **MEDIUM** | No current CI timing data available; ceiling chosen to preserve the existing budget rather than estimated |
| Cross-platform resolution (A2) | **LOW** | Measured on macOS only |

**Research date:** 2026-08-13
**Valid until:** 2026-09-12 (30 days) — **or immediately on any upgrade of Vite, SvelteKit, or
Playwright**, since §R1.4 (`fs.allow` list) and §R2 (`globalSetup` contract) are version-coupled.

**Servers started during research — all terminated.** Final port state verified:
`5173` = Docker container only (pre-existing, not ours, left running); `5174`, `5175`, `5273`,
`5373`, `5473`, `9911` all free. Repo working tree unchanged (`git status --porcelain` shows only
the two pre-existing modifications present at session start). No repo source file was created,
modified, or deleted; all experiments ran in the scratchpad with `node_modules` symlinked.
