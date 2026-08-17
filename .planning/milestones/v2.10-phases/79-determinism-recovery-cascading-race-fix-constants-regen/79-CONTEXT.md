# Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the `candidate-profile.spec.ts:85-145` cascading race so the `serial`-mode candidate-profile describe block stops "did not run"-cascading downstream tests through the `auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password` dependency chain (DETERM-04), then regenerate the parity-script PASS_LOCKED / DATA_RACE / CASCADE constants in `tests/scripts/diff-playwright-reports.ts` from a clean 3-run cold-start baseline that reflects the post-fix suite (DETERM-05). The post-fix anchor (expected ~63 PASS_LOCKED = 47 v2.9 anchor + ~16 cascade-unblocked tests) becomes the binding parity gate for Phases 80-82.

**Sequential order:** DETERM-04 → DETERM-05. The 3-run cold-start gate for DETERM-05 cannot capture a clean baseline until the cascade is resolved.

**Two REQs from REQUIREMENTS.md:** DETERM-04 (cascading-race fix) and DETERM-05 (parity-script constants regen). No new capabilities — implementation decisions only.

</domain>

<decisions>
## Implementation Decisions

### Fix Path for Cascading Race (DETERM-04)

- **D-01: Primary path is FRONTEND RACE FIX; FALLBACK is test restructure.** The RCA plan + fix plan land first, attempting to patch the underlying post-set-password redirect race at the application layer. Test restructure becomes the contingent path if the frontend fix doesn't resolve the cascade.

- **D-02: Fallback trigger is TIME-BOXED at 1 RCA plan + 1 fix plan.** If after those 2 plans the 3-run cold-start cascade still reproduces 3/3 (cascade-skip on candidate-profile + downstream "did not run" through the project dependency chain), pivot immediately to the restructure path. Deterministic exit criterion; caps investigation cost.

- **D-03: Fallback restructure shape — `register-fresh-candidate.setup.ts` extracts registration + ToU acceptance.** New setup project at `tests/tests/setup/register-fresh-candidate.setup.ts` extracts steps 1-7 of the current `should register the fresh candidate via email link` test (email-link → set-password → manual-login-if-redirected → ToU checkbox). Mirrors `auth.setup.ts`'s retry-tolerance pattern (3-attempt `waitForLoginForm` loop). New project depends on `candidate-app`; `candidate-app-mutation` then depends on `register-fresh-candidate-setup` instead of `candidate-app`. Downstream tests in `candidate-profile.spec.ts` just `loginAsCandidate(page)` and proceed.

- **D-04: RCA plan instruments BOTH hypotheses in parallel.** Single RCA plan captures evidence for both root-cause candidates simultaneously:
  - **Hypothesis 1 (auth session propagation):** Inspect Supabase session cookies + JWT state at the `client.setPassword() → /login redirect` window. Capture via Playwright network panel.
  - **Hypothesis 2 (ToU hydration timing):** Capture SvelteKit hydration timing on the post-redirect `/login` page (or wherever the ToU checkbox should render) + ToU checkbox render timing via Playwright network panel + console logs.
  - One plan, two evidence streams — picks the actual root cause empirically; doesn't waste a plan if hypothesis 1 is dead-on-arrival.

- **D-05: RCA artifacts are COMMITTED traces + RESEARCH.md section.** Network panel + console logs + screenshots land in `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/` (binary artifacts committed); findings inline in the phase's RESEARCH.md §"DETERM-04 RCA". Forensic-grade evidence — lets a future operator (or v2.11 phase) re-examine if the race reopens.

- **D-06: If one hypothesis is empirically disproven, RESEARCH.md DOCUMENTS THE DISPROOF and the fix plan focuses solely on the confirmed root cause.** The disproven path is NOT instrumented in the fix (no belt-and-suspenders); the disproof evidence is preserved for future races.

### Constants Regen (DETERM-05)

- **D-07: Mechanism — COPY `regen-constants.mjs` into Phase 79 post-fix/.** Source: `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs` (archived v2.9 version). Destination: `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs`. Phase 79's copy is the canonical Phase 79 regen artifact; archived original stays as v2.9 historical record. The IMGPROXY_TIED_TITLES list (Phase 73 D-09 structural binding — 14 entries × dual-project re-auth = 15 DATA_RACE IDs) is preserved verbatim. If a future archive sweep relocates the v2.9 source, Phase 79's copy is self-contained.

- **D-08: Regen gate — STRICT SHA-256 IDENTITY across 3 cold-start runs.** Compute `sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>\n") for each test entry)` per run; only regen if all 3 hashes match. Matches Phase 75 SC #4 precedent (recorded hash `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` at v2.9 close). If any single test flakes across the 3 runs, escalate per D-09 — don't regen against a non-stable baseline.

- **D-09: Instability protocol — RE-RUN + INVESTIGATE the flake first.** If 3-run SHA-256 identity FAILS (e.g., 2/3 match, 1 has a non-DATA_RACE-pool flake):
  - Pause regen. Add 3 more cold-start runs (6 total).
  - If the flake reproduces in any of the 3 fresh runs, it's a real determinism regression — file a follow-up todo at `.planning/todos/pending/2026-05-XX-phase79-flake-regression.md` + escalate to operator via STATUS.md flag.
  - If the 3 fresh runs are SHA-identical, use those as the regen source (the original flake was a transient post-fix hydration artifact).
  - Cap at one re-run cycle; surfaces unknown races BEFORE they're baked into the anchor.

- **D-10: Commit shape — ONE ATOMIC COMMIT per DETERM-05 plan.** Single commit lands: (1) `post-fix/run-{1,2,3}.json` captures, (2) `post-fix/sha256.txt` identity record, (3) `post-fix/regen-output.txt` (script stdout), (4) the constants update in `tests/scripts/diff-playwright-reports.ts` (PASS_LOCKED + DATA_RACE + CASCADE arrays), (5) `post-fix/imgproxy-audit.txt` (IMGPROXY_TIED_TITLES audit log — verifies 0 collisions with any new test titles). Reverting the constants reverts everything; preserves Phase 73 self-contained pattern.

### 3-Run Cold-Start Gate Execution

- **D-11: Gate runner — AGENT-INLINE via Bash run_in_background.** Agent runs the 3 cold-start captures itself via `Bash(run_in_background=true)`, monitors completion notifications. Each cold-start is ~54 min; ~162 min total wall time + agent supervision (excluding pre-gate confirm per D-12). No operator interruption. Operator (kalle) is intentionally going away during execution; agent runs autonomously.

- **D-12: Pre-gate confirm — DETERM-04 fix plan ends with a 1-RUN cold-start smoke BEFORE handing off to the 3-run gate.** If the cascade reproduces in that 1-run smoke, the fix isn't done — iterate before triggering the 3-run gate. If green, the 3-run gate starts immediately. Total wall time: ~216 min worst-case (54 confirm + 162 gate); savings: avoids burning ~162 min on a broken fix.

- **D-13: Cold-start protocol per run (canonical chain).** Per D-12 + each gate run:
  1. `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` (LANDMINE-9 manual chain — yarn `&&`-chain forwards trailing args to the LAST command, so the canonical Likert-only-reset must be explicit; per Phase 78 CLEAN-05).
  2. Spin up dev server in background: `yarn workspace @openvaa/frontend dev` (or `yarn dev` if Supabase also needs starting).
  3. Wait for `http://localhost:5173` ready (poll via curl with timeout).
  4. Capture: `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-N.json`.
  5. Kill the Vite dev server (preserve Supabase between runs unless 502 per D-14).
  6. Repeat for next run.

- **D-14: imgproxy 502 recovery — RESTART Supabase + RE-RUN the same run-N (overwrite).** Per Phase 73 D-09 framing (imgproxy is documented infrastructure flake, not test failure):
  - On 502 detection: `supabase stop && supabase start && yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`, then restart Vite, then re-capture into the SAME `run-N.json` (overwrite).
  - Cap: up to 2 retries per run.
  - Escalate to operator via STATUS.md if a single run needs 3+ retries.

- **D-15: User pre-departure setup.** Operator kills the Vite frontend dev server (port 5173) before leaving. Supabase stays up (agent will `db:reset` between runs; only restarts Supabase on imgproxy 502 per D-14). Agent assumes Supabase is up at phase entry.

- **D-16: Wake-up artifact — `STATUS.md` at phase root, updated at every agent wake-up.** Path: `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md`. Contents updated at every wake-up:
  - Phase progress: DETERM-04 status (RCA plan / fix plan / confirm smoke), DETERM-05 status (gate run-N progress, regen status)
  - Last completed plan + commit SHA
  - Current run-N progress if mid-gate (e.g., "run-2 of 3 in progress, started 22:35 UTC")
  - Any escalation flags: imgproxy retries, SHA-256 mismatch, RCA pivot-to-restructure trigger, operator-checkpoint-needed events
  - Operator skims STATUS.md + recent git log on return. One file to check.

### Claude's Discretion

- Exact instrumentation tooling for the RCA plan (Playwright tracing API, custom console.log hooks, Supabase admin API session inspection) — pick whatever produces the clearest evidence; commit the chosen approach into RESEARCH.md.
- Whether to retain the `loginIfRedirectedToLoginPage` helper in the test file under both fix paths (frontend race fix → keep; restructure path → move into setup project).
- Whether to add a regression test for the post-fix behavior (e.g., assert ToU checkbox renders within N ms of redirect on a fresh-registered candidate) — defer to planner if the cost is non-trivial.
- Naming of the new setup project under the restructure path: `register-fresh-candidate-setup` is suggested; planner picks the final name.

### Folded Todos

- **`.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md`** — the source-of-truth todo for DETERM-04. Original problem: cold-start cascade from `candidate-profile.spec.ts:85-145` registration-redirect race cascade-skips 43+ downstream tests; blocks parity-script regen capability. Fits this phase's DETERM-04 scope directly; the todo's §"Recommended approach (v2.10+ phase)" enumerates RCA → fix-or-rewrite → 3-run gate, which is exactly the sequence this CONTEXT codifies.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cascading-race root cause + scope source

- `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md` — Source-of-truth todo for DETERM-04. Contains the root-cause hypotheses (auth session propagation vs ToU hydration timing), empirical impact across Phases 76/77/78, and the §"Recommended approach (v2.10+ phase)" sequence.
- `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md` §2 — Original Phase 76 P02 deferred-item discovery; documents the cascade-impact analysis + §"Recommendation" enumeration of fix paths (cold-start triage, short-term workaround via Alpha credentials, alternative spec-extraction path).
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` — Phase 78 close-out verdict (PASS-WITH-DEFERRAL on CLEAN-05); §"Constants Regen Decision" + §"When operator runs the gate" enumerate the regen protocol prerequisites Phase 79 inherits.
- `.planning/milestones/v2.9-phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md` §"3-Run Determinism Record" — Phase 77 deferred-with-rationale precedent.
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-RESEARCH.md` §"Auth-Setup Race ↔ Phase 76 Deferred-Items Cross-Reference" — Phase 78 RESEARCH Q2 OUT-OF-SCOPE confirmation that the cascade is in the post-set-password redirect window, not downstream-test-quality.

### Test surface + Playwright config

- `tests/tests/specs/candidate/candidate-profile.spec.ts:85-145` — The failing test (`should register the fresh candidate via email link`); steps 1-7 of registration flow; ToU acceptance at step 7 (`expect(touCheckbox).toBeVisible({ timeout: 10000 })` at line 139 is the typical fail surface). RCA must instrument here.
- `tests/tests/specs/candidate/candidate-profile.spec.ts:48-63` — Module-level `loginIfRedirectedToLoginPage` helper (Pattern 4 canonical 3 per Phase 78 P06 hoisting); decides whether to manually log in vs assume session is established.
- `tests/playwright.config.ts:99-164` — Project dependencies chain (`data-setup → auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password`). The restructure path inserts a new `register-fresh-candidate-setup` project between `candidate-app` and `candidate-app-mutation`.
- `tests/tests/setup/auth.setup.ts:23-57` — `waitForLoginForm` retry-tolerance pattern (3-attempt loop) that the restructure path MUST mirror for the new `register-fresh-candidate.setup.ts` project.

### Parity-script + regen tooling

- `tests/scripts/diff-playwright-reports.ts:94-160` — The PASS_LOCKED + DATA_RACE + CASCADE arrays that DETERM-05 regenerates. The IMGPROXY_TIED_TITLES (DATA_RACE_TESTS subset, lines 146-160) MUST NOT grow per Phase 73 D-09 structural binding.
- `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs` — Archived v2.9 version of the regen script (copy this verbatim into Phase 79's post-fix/ per D-07). Contains the IMGPROXY_TIED_TITLES list at lines 64-78 + the `categorizeStatus` + `flattenReport` logic.

### Cold-start protocol + LANDMINE-9 chain

- `CLAUDE.md` §"Seeding local data" — Documents the `--likert-only` flag + the LANDMINE-9 yarn arg-forwarding caveat ("Canonical invocation for a fully Likert-only reset is the manual chain: `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`"). Phase 79 uses this manual chain verbatim per D-13.
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` §"Determinism Outcome" — Documents the seed protocol + 3-run cold-start prerequisites Phase 79 inherits.

### Phase 73 structural-binding contracts

- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-REVIEW.md` — Phase 73 D-09 structural binding for DATA_RACE pool; the IMGPROXY-tied test set is FROZEN at 14 entries × dual-project re-auth = 15 IDs.
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/post-fix/run-3-report.json` (and the inline regen header at `tests/scripts/diff-playwright-reports.ts:42-92`) — Phase 75 baseline that Phase 79 supersedes. Phase 75 hash recorded: `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc`.

### Roadmap + requirements

- `.planning/ROADMAP.md` §"Phase 79: Determinism Recovery" — Phase definition, success criteria, dependency on Phases 80-82.
- `.planning/REQUIREMENTS.md` §DETERM-04 + §DETERM-05 — Full requirement text; Phase 79 implements both REQs 1:1.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`tests/tests/setup/auth.setup.ts`** — Canonical Playwright setup-project pattern with retry-tolerance (3-attempt `waitForLoginForm` loop wrapping a `domcontentloaded` goto + `waitFor visible` cycle); writes `playwright/.auth/user.json` storageState. The restructure path (fallback per D-03) clones this shape into `register-fresh-candidate.setup.ts` (steps 1-7 of current registration test wrapped in retry-tolerance).
- **`tests/tests/setup/re-auth.setup.ts`** — Reference pattern for re-authentication after a mutation-destructive flow; demonstrates the dual-project trick (re-auth.setup runs under TWO projects per Phase 73 D-09 IMGPROXY_TIED_TITLES tally; the `× 2` is preserved in DATA_RACE_TESTS).
- **`.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs`** — Drop-in regen tool; only `reportPath` needs adjusting to point at Phase 79's `run-3.json`. Copy verbatim per D-07.
- **`tests/scripts/diff-playwright-reports.ts:23-91`** (regen header comments) — Inline documentation of the regen delta semantics (Phase 75 grew +43 PASS_LOCKED over Phase 74 via a healthier cold-start; Phase 79 expected to grow +16 over Phase 75 via cascade-unblock). Pattern to follow when updating the comment header post-Phase-79 regen.
- **`apps/frontend/src/routes/candidate/...`** (location TBD by RCA) — The frontend race fix landing site under D-01's primary path. RCA plan identifies the exact file(s) — candidates: candidate `(protected)/+layout.svelte` (ToU hydration), candidate `register/password/+page.svelte` (set-password redirect), Supabase auth helper module.

### Established Patterns

- **Project-dependency-chain pattern** (per `tests/playwright.config.ts:67-164`) — Tests live in projects with `dependencies: [...]` arrays; a parent project's failure cascade-skips children with "did not run" status. The restructure path leverages this: extracting registration into a setup project means the cascade contract becomes "if registration fails, only the setup-project test is marked failed; downstream tests still run if they don't depend on it." Combined with retry-tolerance (per `auth.setup.ts:23-57`), the new setup project breaks the cascade-fail-cascade-skip chain.
- **Module-level helper hoist for `playwright/no-conditional-in-test`** (per `candidate-profile.spec.ts:48-63` + RESEARCH §"Pattern 4 canonical 3") — Conditional dispatch lives in module-level helpers, not test bodies. The frontend race fix path retains this pattern; the restructure path moves the helper into the setup module.
- **`// reason:` accept-with-rationale comment block** (per CLAUDE.md §"Svelte Warning-Accepted Format" + Phase 78 P03 13 per-cast `// reason:` blocks) — If the RCA reveals a race that can't be cleanly fixed but is acceptable in practice (e.g., a Svelte 5 hydration timing that's framework-emitted), use this comment convention; do NOT use it as a default escape hatch.
- **Phase 73 self-contained `post-fix/` pattern** — Every regen phase writes `regen-constants.mjs` + `run-N.json` + `parity-output.txt` into its own `post-fix/` directory (not the v2.9 archive). Phase 79 follows this verbatim per D-07.

### Integration Points

- **`tests/scripts/diff-playwright-reports.ts`** — DETERM-05's constants update lands here (PASS_LOCKED + DATA_RACE + CASCADE arrays + regen header comment block at lines 42-92). The IMGPROXY_TIED_TITLES audit (D-10) verifies no collisions with any new test titles before the array update commits.
- **`tests/tests/specs/candidate/candidate-profile.spec.ts:65-66`** — `test.describe.configure({ mode: 'serial' })` boundary. The frontend race fix path keeps this; the restructure path either keeps it (downstream tests no longer cascade on registration since it's in a setup) or removes it (all downstream tests are independent and use `loginAsCandidate(page)`).
- **`tests/tests/setup/*.setup.ts` + `tests/playwright.config.ts:99-164`** — The restructure path adds a new setup file + a new project entry + repoints `candidate-app-mutation` dependency from `candidate-app` to the new setup project.

</code_context>

<specifics>
## Specific Ideas

- **RCA evidence streams** (per D-04 + D-05): the user prefers BOTH hypotheses instrumented in parallel + traces committed to `post-fix/rca-traces/`. The forensic-grade evidence stream is intentional — Phase 76/77/78 each documented this race in prose only; Phase 79 captures empirical evidence so future races (if they recur) can be diagnosed faster.
- **STATUS.md as wake-up dashboard** (per D-16): the user is going away during the long-running 3-run gate. A single STATUS.md file at the phase root, updated at every agent wake-up, is the preferred return surface. Treat it as a structured journal — sections for DETERM-04 progress, DETERM-05 progress, escalation flags, and "what to do on return."
- **Pre-departure setup expectation** (per D-15): user kills Vite (port 5173) before leaving; Supabase stays up. Agent assumes Supabase is healthy on entry; recycles only on imgproxy 502 (D-14).

</specifics>

<deferred>
## Deferred Ideas

- **Regression test for post-fix ToU hydration timing** — If the RCA confirms hypothesis 2 (ToU hydration), a future hygiene plan could add a `candidate-profile-tou-hydration.spec.ts` regression test asserting the ToU checkbox renders within N ms of the post-registration redirect. NOT in v2.10 scope; routed to a future a11y/UX hardening pass.
- **Generic post-`updateUser({password})` redirect race** — Phase 78 CLEAN-04 fixed code-quality issues in the helper but explicitly noted "LANDMINE-2: this fix is code-quality only. It does NOT resolve the candidate-profile cascading race." If RCA confirms hypothesis 1 (auth session propagation), the fix MAY generalize to `updateUser` flows elsewhere (e.g., `candidate-password.spec.ts`'s session-token-revocation flow). Out of Phase 79 scope; capture as a follow-up todo if the generalization is non-trivial.
- **Splitting `candidate-profile.spec.ts` into separate files** — Phase 76 deferred-items §2 §Recommendation #3 enumerated the "extract A11Y-02 persistence tests into `candidate-profile-persistence.spec.ts`" alternative. The current CONTEXT chooses the setup-project restructure path (D-03) instead. The spec-split alternative is NOT chosen for Phase 79 but remains a possible future refactor.

### Reviewed Todos (not folded)

The `cross_reference_todos` step surfaced 28 todos. Only `2026-05-12-candidate-profile-cascading-race.md` was folded (D-01..D-16); the remaining 27 are out of Phase 79 scope:

- `2026-05-12-a11y-axe-first-run-violations.md` — Routed to Phase 80 (A11Y-04 axe cite-and-fix). Not v2.10 Phase 79.
- `2026-05-12-a11y-01-product-gap-cells.md` — Routed to Phases 81 + 82 (A11Y-05/06/07 email/url/required-empty cells). Not v2.10 Phase 79.
- `2026-05-12-settings-02-voter-authoring-product-gap.md`, `2026-05-12-settings-03-voter-required-product-gap.md`, `2026-05-12-voters-layout-non-reactive-appsettings.md` — Re-deferred to v2.11+ per ROADMAP §"Out of Scope".
- `2026-05-13-filtergroup-or-mode-ui-product-gap.md`, `2026-05-13-constituency-filter-product-gap.md` — Re-deferred to v2.11+ filter-features milestone.
- `2026-05-12-qspec-01-i18n-hardening.md`, `2026-05-12-qspec-02-multi-choice-categorical-variant.md`, `2026-05-12-58-e2e-audit-addendum-qspec.md` — Backlog QSPEC follow-ups; not v2.10.
- `2026-04-25-normalise-app-shared-paradigm.md`, `2026-04-25-remove-mergesettings-reexports.md`, `2026-04-30-alliance-tab-rendering-and-sections-config.md`, `2026-05-08-cleanup-65-01-bind-rationale-comments.md`, `2026-05-09-rewrite-parent-answer-imputation.md`, `2026-05-11-e2e-01-single-locale-runtime-override.md` — Closed/superseded or routed to future milestones; cross-reference matcher false positives (keyword similarity, not scope similarity).
- `frontend-project-id-scoping.md`, `results-url-refactor-followups.md` — Sharable URLs + multi-tenant pair re-deferred to v2.11+ per ROADMAP §"Out of Scope".
- `2026-03-28-generalize-candidate-app-to-party-app.md`, `2026-03-28-investigate-migrating-candidate-answer-store.md`, `adapter-package-loading.md`, `rename-admin-writer.md`, `sql-linting-formatting.md`, `2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md`, `password-reset-code-method.md`, `register-page-registrationkey-method.md` — Unrelated long-running backlog items; cross-reference matcher false positives.

</deferred>

---

*Phase: 79-determinism-recovery-cascading-race-fix-constants-regen*
*Context gathered: 2026-05-12*
