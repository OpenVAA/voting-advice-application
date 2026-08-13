# Phase 137: E2E Preflight Integrity — Assert the Served Application - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Every E2E run in this repo proves the page under test was served by *this checkout*, enforced by
the Playwright harness rather than by operator memory. Delivers: (1) a runtime preflight that
asserts the served application's own HTTP response identifies this working tree, (2) an
unskippable enforcement point, (3) prevention of the underlying port-drift at source, (4) a
two-run negative control proving the guard catches what the retired check missed, and (5) the
live-doc rewrite of the E2E runbook wording.

Satisfies INTEG-04, INTEG-05, INTEG-06.

**Not in scope:** changing the default local E2E port; any E2E-against-preview/built-server
support; any new production app route.

</domain>

<decisions>
## Implementation Decisions

Answers were captured in `137-DISCUSSION-QUESTIONS.md`. The operator answered Q4.1 explicitly
(**B**) and left every other question blank; per that document's own stated rule ("anything you
leave blank I'll take the **Recommended** option for"), all remaining decisions below are the
recommended options. Each is grounded in a scout finding (F1–F10) recorded in that file.

### D-A — Identity marker (what the preflight asserts)

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

### D-B — Enforcement point (INTEG-05)

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

### D-C — Failure behaviour and closing the drift at source

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
  documenting `FRONTEND_PORT` as the escape hatch is all the success criteria require. Deferred
  (see below).

### D-D — Proving it (negative control) and doc surface

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase inputs
- `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-DISCUSSION-QUESTIONS.md`
  — the full scout-finding table F1–F10 with file:line evidence, and every option considered per
  decision. **The single most important ref for this phase**; do not re-scout what it already measured.
- `.planning/ROADMAP.md` § "Phase 137" — the four success criteria verbatim.
- `.planning/REQUIREMENTS.md:48-50` — INTEG-04, INTEG-05, INTEG-06.
- `.planning/STATE.md` — the milestone-wide standing acceptance rule (negative control run twice).

### Test harness (the surface being changed)
- `tests/playwright.config.ts` — `:33-47` module-load-time orphan-probe throw (F8, the
  "enforced not remembered" precedent); `:121` `baseURL` from `FRONTEND_PORT`; `:289`, `:472+`
  setup-project topology (F7); `:1119-1135` the only existing `webServer` (bank-auth mock OIDC, F1).
- `tests/README.md` — concurrency model; the Run/prereqs section edited per D-15.
- `tests/IDURA-TEST-RUNBOOK.md` — already documents `FRONTEND_PORT=5174`; gets one cross-ref line.
- `tests/tests/fixtures/shared/emailBucket.fixture.ts:221` — `toCallbackUrl`, the second consumer
  of `FRONTEND_PORT` (F9); must stay consistent with any port handling.

### Application under test
- `apps/frontend/vite.config.ts:24-26` — `port` without `strictPort` (F6, the drift mechanism);
  edited per D-08.
- `apps/frontend/src/routes/+layout.svelte:215` — the `<title>` = `t('dynamic.appName')` binding (F4).
- `apps/frontend/src/routes/+layout.ts:26-28` — `translationOverrides` / maintenance-mode title
  replacement (F4).
- `apps/frontend/messages/*/dynamic.json:6` — the per-locale `appName` set for D-01 clause (c).

### CI
- `.github/workflows/main.yaml:246-250` and `:326-330` — the blind, fail-open wait loops (F2)
  deleted per D-05; both the E2E and `e2e-visual` jobs.

### Precedent for the evidence doc
- `.planning/milestones/v2.14-phases/136-*/136-VISUAL-DISCRIMINATION-EVIDENCE.md` — the shape
  `137-NEGATIVE-CONTROL.md` should follow (D-13).

### Project conventions
- `CLAUDE.md` § Testing / "E2E Hard Rule" — the cardinal-failure rule and the section edited per D-15.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/playwright.config.ts:33-47`** — the orphan-probe module-load-time throw is the in-repo
  precedent for "enforced, not remembered". It cannot host this check (it is sync/fs-only and an
  HTTP preflight is async, per F8), but its failure-message style and its
  fails-every-invocation-by-name posture are the model to copy.
- **`FRONTEND_PORT`** — already the single source of the port for both `baseURL` (`:121`) and
  `toCallbackUrl` (F9). The preflight derives its target from the same value; no new env var.

### Established Patterns
- **No preflight/globalSetup exists today** (F1) — this is a greenfield hook, not a modification of
  an existing one. The sole `webServer` entry is `PLAYWRIGHT_BANK_AUTH`-gated and unrelated.
- **Setup-project topology is not a chokepoint** (F7) — parallel dependency-less roots are the norm
  in this config, which is why enforcement must be global rather than graph-based.
- **Runtime derivation over hardcoding** — required by CI, where the checkout path differs from the
  developer's machine (D-03).

### Integration Points
- `tests/playwright.config.ts` — new `globalSetup` entry pointing at the new preflight module.
- `apps/frontend/vite.config.ts` — `strictPort: true` (D-08).
- `.github/workflows/main.yaml` — removal of two wait loops across two jobs (D-05).
- `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` — doc surface (D-15).

</code_context>

<specifics>
## Specific Ideas

- **The measured adversary that shaped this phase:** during scouting, `:5173` was held by a sibling
  OpenVAA checkout running in Docker, serving `<title>Valkompass</title>` from module root
  `/@fs/opt/frontend/…` and 301-redirecting `/` → `/sv/`. Had its base locale been `en`, it would
  have **passed** the naive title grep while serving an entirely different checkout. Every clause of
  D-01 exists to defeat a specific part of that observation — this is the concrete "it must fail
  against *this*" target for the negative control.
- **Standing milestone rule applies in full:** prove the guard fails before claiming it guards —
  negative control run twice (once against the old assertion to demonstrate blindness, once against
  the new one to demonstrate the catch). D-12 and D-13 are how this phase discharges it.

</specifics>

<deferred>
## Deferred Ideas

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

### Reviewed Todos (not folded)

`todo.match-phase 137` returned only keyword-noise matches, none within this phase's scope:
- "Generalize candidate app to a party app as well" — unrelated feature work.
- "Display the nominating organization in candidate/profile nominations" — unrelated feature work.
- "After runes update, recheck app header styling, banner images, post-login candidate nav" —
  unrelated UI verification.
- "Extend the `svelte/store` ESLint guard frontend-wide" — already mapped to **Phase 143**
  (ASSERT-08, ASSERT-09).

</deferred>

---

*Phase: 137-e2e-preflight-integrity-assert-the-served-application*
*Context gathered: 2026-08-13*
