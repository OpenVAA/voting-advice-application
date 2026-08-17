# Phase 137 — Discussion Questions (answer all at once)

**Phase:** 137 — E2E Preflight Integrity — Assert the Served Application
**Requirements:** INTEG-04, INTEG-05, INTEG-06
**Goal:** Every E2E run in this repo proves the page under test was served by this checkout — enforced by the harness, not by operator memory.

**How to answer:** write your pick after each `➜ Answer:` line (letter, or free text). Anything you leave blank I'll take the **Recommended** option for. Free-text overrides are fine anywhere.

---

## Scout findings this doc is grounded in (all verified, with refs)

| # | Finding | Evidence |
|---|---|---|
| F1 | **No preflight exists today.** No `globalSetup`, no `globalTeardown`, no app-level `webServer`. The only `webServer` is the `PLAYWRIGHT_BANK_AUTH`-gated mock OIDC issuer. | `tests/playwright.config.ts:1119-1135` |
| F2 | **The only liveness check in the repo is CI's blind loop** — `curl -s http://localhost:5173 > /dev/null` × 60, which asserts nothing about identity *and does not fail when the server never comes up* (it just falls through). | `.github/workflows/main.yaml:246-250`, `:326-330` |
| F3 | **The retired "listener is a node process" wording is not in `CLAUDE.md`** — it only ever existed as prose in archived `.planning` docs, never as code. INTEG-06 is mostly an *add*, not an edit. | `CLAUDE.md` (no match); `.planning/milestones/v2.14-phases/135-*/135-04-PLAN.md:47` |
| F4 | **The todo's proposed marker is insufficient.** `<title>` is `t('dynamic.appName')` — locale-dependent (en `Election Compass` / fi `Vaalikone` / sv `Valkompassen` / da / et / fr / lb), **DB-overridable** via `translationOverrides`, and replaced entirely by `maintenance.title` under maintenance mode. | `apps/frontend/src/routes/+layout.svelte:215`; `apps/frontend/src/routes/+layout.ts:26-28`; `apps/frontend/messages/*/dynamic.json:6` |
| F5 | **Measured live during scouting:** `:5173` is currently held by **a sibling OpenVAA checkout in Docker** serving `<title>Valkompass</title>` from module root `/@fs/opt/frontend/…`, and it **301-redirects `/` → `/sv/`** (so a bare `curl -s` with no `-L` returns an empty body). Had its base locale been `en`, it would have **passed** the proposed title grep while serving a different checkout. | `lsof -nP -iTCP:5173` → `com.docke 62915` |
| F6 | **`yarn dev` drifts silently.** `vite.config.ts` sets only `port` — no `strictPort` — so when 5173 is taken our server quietly moves to 5174 while Playwright's `baseURL` keeps pointing at 5173. **That drift is the mechanism of the original incident.** | `apps/frontend/vite.config.ts:24-26`; `tests/playwright.config.ts:121` |
| F7 | **`data-setup-base` is NOT a universal chokepoint.** The voter permutation family's first setup (`data-setup-perm-1e1cg1co`) has **no upstream dependency** and runs in parallel with the base family. A single dependency edge onto `data-setup-base` would leave the whole perm family ungated. | `tests/README.md` (concurrency model); `tests/playwright.config.ts:289`, `:472+` |
| F8 | Config already has a precedent for "enforced, not remembered": a **module-load-time throw** (orphan-probe guard) that fails every `playwright test` invocation by name. It is sync/fs-only, so an HTTP preflight cannot live there. | `tests/playwright.config.ts:33-47` |
| F9 | ~97 project entries; `baseURL` derives from `FRONTEND_PORT` (default 5173). Second consumer of the var: `toCallbackUrl` in the email fixture. | `tests/playwright.config.ts:121`; `tests/tests/fixtures/shared/emailBucket.fixture.ts:221` |
| F10 | No identity-bearing endpoint exists. `+server.ts` inventory: `cache`, `feedback`, `candidate/preregister`, `auth/*`, `oidc/*`, `data/[collection]`, `admin/jobs/*`. `svelte.config.js` sets no explicit `kit.version.name`. | `apps/frontend/src/routes/api/**` |

---

# Area 1 — Identity marker (what the preflight actually asserts)

### Q1.1 — What is the load-bearing proof?

| | Option | Trade-off |
|---|---|---|
| **A** | `<title>` grep, per the todo | Cheapest, zero new concepts. **But F4+F5 measured it insufficient** — a sibling OpenVAA checkout passes it, and it breaks on locale/maintenance/DB override. |
| **B** | **Vite `/@fs/<ABS_REPO_PATH>/apps/frontend/src/routes/+layout.svelte` probe** | Returns 200 only if the listening Vite server's `server.fs.allow` root is *this* checkout. Absolute filesystem paths cannot collide between checkouts — the Docker sibling (root `/opt/frontend`) 403/404s. Dev-server-only. Needs one manual verification against a live `yarn dev` (no `server.fs` config is set, so SvelteKit defaults apply). |
| **C** | Module-content probe — `GET /src/routes/+layout.svelte`, compare the transformed body against a unique string read from the on-disk file | Proves the served *code* is this working tree, not merely this repo path. Slightly more brittle (Vite transforms the body). |
| **D** | **Composite: (a) 2xx after following redirects + (b) the B probe as the proof + (c) title ∈ known `dynamic.appName` set as a cheap sanity check** | Strongest. The redirect-following clause specifically closes the F5 `301 → /sv/` empty-body hole. More code than A. |

**➜ Recommended: D** (with B as the load-bearing clause; C available as a fallback if the `/@fs` probe fails manual verification in research).

**➜ Answer:**

---

### Q1.2 — Must the check also work against a non-dev server (preview / built / Docker)?

Today E2E only ever runs against `yarn dev` — locally and in CI (`yarn workspace @openvaa/frontend dev &`). `/@fs/` exists only in dev.

| | Option | Trade-off |
|---|---|---|
| **A** | **Dev-only.** If the `/@fs` probe 404s, the preflight fails and names "the listener is not this checkout's Vite dev server" as the reason | Simplest; "not a dev server" is itself a legitimate failure. Would need revisiting if E2E ever targets a preview build. |
| **B** | Add a dev-only identity endpoint (`/api/__identity` returning repo root + git HEAD) | Works in dev *and* preview, and is fork-agnostic by construction. But it adds an app route — production surface to reason about, plus a guard so it never ships enabled. |
| **C** | Composite with a build-stamped fallback (`kit.version.name`) | Requires setting an explicit version stamp; the default is a build timestamp, not a checkout identifier (F10). |

**➜ Recommended: A** — dev-only, with the limitation stated in the doc. (B is the right answer *only if* you expect E2E-against-preview soon; say so and I'll route it.)

**➜ Answer:**

---

### Q1.3 — Fork-safety: derived or hardcoded?

OpenVAA is a framework other people fork and deploy. A check hardcoding `Election Compass` or your machine's absolute path breaks for every downstream adopter.

| | Option | Trade-off |
|---|---|---|
| **A** | **Derive everything at runtime** from the config's own location (`path.resolve` up from `TESTS_DIR`) + `package.json` name. Zero hardcoded strings; works unchanged in any fork or CI checkout path | Slightly more code. Also automatically correct on CI runners, where the absolute path differs from your Mac. |
| **B** | Hardcode this repo's identity | Simpler, but breaks in CI (different checkout path) and for forks. |

**➜ Recommended: A** — and note it's not just fork-hygiene: CI's checkout path differs from yours, so a hardcoded path would fail in CI anyway.

**➜ Answer:**

---

# Area 2 — Enforcement point (so it cannot be skipped — INTEG-05)

### Q2.1 — Where does the preflight run?

| | Option | Trade-off |
|---|---|---|
| **A** | A new root-most `preflight` **setup project**, with every dependency-less setup project depending on it | Visible as a row in the HTML report. **But F7:** the perm family's first setup has no deps, so this needs an edge on *several* roots — and a new root project added later silently escapes the gate. |
| **B** | **`globalSetup`** | One line, covers 100% of invocations — `yarn test:e2e`, a bare `npx playwright test`, `--project=X`, `--grep`. Cannot be escaped by adding a project later. Aborts before the first spec executes, which is criterion 3's literal wording. Failure surfaces in the terminal rather than as a report row. |
| **C** | Both — `globalSetup` for the hard abort, plus a trivial `preflight` project for report visibility | Belt-and-braces; the project row is redundant once globalSetup aborts the run. |

**➜ Recommended: B.** F7 is the deciding fact — A has a known hole today *and* a maintenance hole tomorrow.

**➜ Answer:**

---

### Q2.2 — Does it gate CI too?

| | Option | Trade-off |
|---|---|---|
| **A** | **Yes — same `globalSetup` everywhere, and CI's blind wait loop is repaired or deleted** | CI's loop is currently blind *and* fails open (F2). The preflight replaces it properly. Covers the `e2e-visual` job as well. |
| **B** | Skip in CI (`if (process.env.CI) return`) | That is a skip path, which is exactly what INTEG-05 forbids. |

**➜ Recommended: A** — and delete CI's wait loop entirely if Q2.3 gives the preflight polling (below), rather than keeping two half-checks.

**➜ Answer:**

---

### Q2.3 — Wait, or fail fast?

| | Option | Trade-off |
|---|---|---|
| **A** | Assert once, fail immediately | Operator is expected to have `yarn dev` healthy. Races against a just-started server. |
| **B** | **Poll up to ~30 s, then fail** | Absorbs the "just started the dev server" race, and lets CI drop its own 120 s wait loop — one mechanism instead of two. |

**➜ Recommended: B** (30 s locally; CI may need longer — I'll let research pick the exact ceiling against the observed CI startup time).

**➜ Answer:**

---

# Area 3 — Failure behaviour and closing the drift at source

### Q3.1 — Any bypass?

**➜ Recommended: none.** No `PLAYWRIGHT_NO_PREFLIGHT` env. `FRONTEND_PORT` is the escape hatch — it points the suite at *your own* server on another port, which is the legitimate workaround (and it's what Phase 136 used at 5174). A bypass flag would re-open exactly the hole INTEG-05 closes.

**➜ Answer (confirm / object):**

---

### Q3.2 — Add `strictPort: true` to `vite.config.ts`? ⚠️ *This one changes daily dev UX for everyone*

F6: the drift — our server silently taking 5174 while Playwright watches 5173 — is *the mechanism* of the original incident. The preflight catches the consequence; `strictPort` prevents the cause.

| | Option | Trade-off |
|---|---|---|
| **A** | **Add `strictPort: true`** | `yarn dev` fails loudly ("port 5173 in use") instead of drifting. Kills the failure mode at source. **Cost:** every developer must now free the port or set `FRONTEND_PORT` explicitly — including you, right now, with the sibling container on 5173. |
| **B** | Leave as-is | Zero ergonomic change; the preflight is the only line of defence, and the drift keeps happening (it just gets caught). |
| **C** | Add it, but default the dev port away from 5173 at the same time (see Q3.4) | Loud *and* rarely triggered. Two changes instead of one. |

**➜ Recommended: A** — but this is genuinely your call on dev ergonomics, and I'd rather you decide than assume.

**➜ Answer:**

---

### Q3.3 — What the failure message says

**➜ Recommended contents:** expected port · expected checkout (absolute path) · what actually answered (HTTP status, final URL after redirects, served module root, `<title>`) · the two remedies verbatim (`stop the other server` / `re-run with FRONTEND_PORT=<port your server is actually on>`).

**Optional extra:** also shell out to `lsof -nP -iTCP:<port>` and print the squatting process. Genuinely useful for diagnosis (it's how the sibling container was identified) — but it's macOS/Linux-only and adds a subprocess to the preflight.

**➜ Answer (include `lsof` line? yes / no / free text):**

---

### Q3.4 — Change the default local E2E port away from 5173? *(scope call)*

The driving todo suggests it ("consider defaulting local E2E to a less contended port"). The roadmap's success criteria do **not** require it — they only require `FRONTEND_PORT` be *documented* as the escape hatch.

| | Option |
|---|---|
| **A** | **Out of scope** — document `FRONTEND_PORT`, leave the default at 5173 |
| **B** | In scope — move the default (e.g. 5273) so contention is rare |

**➜ Recommended: A** — B touches the vite config, the Playwright baseURL, the email-callback fixture, both CI jobs, and every runbook. That's a change worth making deliberately, not as a rider on an integrity phase. I'll capture it as a deferred idea.

**➜ Answer:**

---

# Area 4 — Proving it (the two-run negative control) and the doc surface

### Q4.1 — How is the "foreign dev server" staged?

Criterion 1 requires a **real second Vite project answering 200** on the target port.

| | Option | Trade-off |
|---|---|---|
| **A** | Use the **sibling OpenVAA container currently holding `:5173`** | Real, live right now, and a *harder* case than the original incident — it's the same application from a different checkout, which defeats naive markers a random project wouldn't. Not reproducible for anyone re-running the control later. |
| **B** | Spin a throwaway minimal Vite project in the scratch dir | Fully reproducible; weaker adversary. |
| **C** | **Both** — A as the realistic adversary, B scripted so the control is repeatable on any machine | Two runs instead of one; the repeatable half is what makes the evidence durable. |

**➜ Recommended: C.**

**➜ Answer:** B

---

### Q4.2 — How is the OLD check's blindness demonstrated?

Awkward fact (F3): the retired check **never existed in code** — only as runbook prose. There is nothing in the tree to run "before".

| | Option | Trade-off |
|---|---|---|
| **A** | **Write the retired check as a throwaway script during the phase**, run it against the foreign server → record PASS, then run the new preflight → record FAIL | Satisfies the standing acceptance rule literally (two-run control: blindness, then catch). Throwaway script is not committed to the harness. |
| **B** | Skip the blindness half — nothing to retire in code | Cheaper, but the milestone's non-negotiable rule is "prove the guard fails before claiming it guards", and criterion 1 explicitly demands the two-run control. |

**➜ Recommended: A.**

**➜ Answer:**

---

### Q4.3 — Where does the evidence live?

| | Option |
|---|---|
| **A** | In the plan SUMMARY only |
| **B** | **A dedicated `137-NEGATIVE-CONTROL.md` in the phase dir** — precedent: `136-VISUAL-DISCRIMINATION-EVIDENCE.md` |

**➜ Recommended: B** — the milestone will want to cite this repeatedly, and a phase-level evidence doc is the established shape.

**➜ Answer:**

---

### Q4.4 — Scope of INTEG-06's "grep returns nothing"

As literally written, criterion 4 is unsatisfiable: the archived summaries (`136-01-SUMMARY.md:270`, `135-04-SUMMARY.md`, …) *describe* the defeated check — they are the historical record of the incident and rewriting them would destroy the evidence trail.

**➜ Recommended:** scope the grep to **live docs only** — `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`. Archived `.planning/milestones/**` stays untouched, and CONTEXT.md records the scoping explicitly so the verifier doesn't flag it as a miss.

**➜ Answer (confirm / object):**

---

### Q4.5 — Which live docs get the new wording, and how much?

**➜ Recommended split:**

- **`CLAUDE.md`** (E2E section, ~4 lines): the preflight runs automatically and aborts the run; what it asserts (the served app's own response proves this checkout); `FRONTEND_PORT=<port>` as the alternate-port escape hatch when your port is contended.
- **`tests/README.md`** (Run / prereqs section, fuller): the same plus how to read the failure message and the two remedies.
- **`tests/IDURA-TEST-RUNBOOK.md`**: one cross-reference line (it already tells the operator to use `FRONTEND_PORT=5174`).

**➜ Answer (adjust / confirm):**

---

## Anything else

Free text — constraints, references I should read, things I've framed wrongly, or ideas to capture as deferred:

**➜**
