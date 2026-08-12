# Phase 120: E2E Specs — Settings-Permutation Matrix - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning
**Source:** The "what to build" for this phase is **already locked** by the operator-approved Phase-118 deliverable `.planning/v2.14-E2E-COVERAGE-PLAN.md` (§Build List → EPERM (Phase 120)) — every EPERM spec is specified there at semantic-step depth (spec path, project wiring, seed delta, fixtures, behaviour steps). This discussion adds the one thing the coverage plan predates: **how the deferred Phase-119 probe-closure (`DEF-119-08-01`) folds into the start of Phase 120.**

<domain>
## Phase Boundary

Phase 120 has **two sequential parts**, in this order:

**Part 1 — Close Phase 119 (deferred-probe gate, `DEF-119-08-01`).** Get the 4 deferred perm-seeded probes — `video` (`perm-question-video`), `questionInfo` (`perm-interactive-info`), `popupNotice` (`show-feedback-survey`), `orgMatching` (`perm-org-matching`) — green **once in true isolation** against a fresh Vite dev server + clean local Supabase, each seeded with its own perm template. This is the binding Phase-119 carry-forward (119-UAT test #1). Two binding conditions apply (CONDITION 1 + 2 below). Once green → run `/gsd-verify-work 119` to formally close Phase 119.

**Part 2 — Author the EPERM specs (Phase 120 proper).** Build the **partial/missing** EPERM specs from the coverage plan's build list: **EPERM-04, -05, -06, -07, -09, -10, -11**, each as a real perm-chain Playwright node (spec + perm template wiring already authored in 119 at the dev-seed layer + setup/teardown + project entry). Every EPERM spec must pass **3× deterministically** (fresh server, clean DB) per ROADMAP SC5 and the E2E cardinal rule.

**IN SCOPE:**
- The 4-probe isolation harness + re-diagnosis (Part 1) and the `/gsd-verify-work 119` close.
- `tests/playwright.config.ts` project wiring + `tests/tests/setup/perm/*` `data-setup-*`/`data-teardown-*` pairs for the new/changed EPERM perm nodes (this was explicitly OUT-of-scope for 119, deferred to here).
- The `*.spec.ts` files + assertions for EPERM-04/05/06/07/09/10/11.
- EPERM-09 **rename** (`git mv perm-header-show-feedback.spec.ts → perm-show-feedback-survey.spec.ts` + matching project/setup/teardown rename) and EPERM-11 **consolidation** (absorb `perm-disable-voter-app` + `perm-disable-candidate-app` into one `perm-access-disable.spec.ts`, delete the two old specs/projects, add global `underMaintenance`).

**OUT OF SCOPE:**
- **EPERM-01, -02, -03 (candidate/org bulk), -08** — "confirmed covered, no new code" per the coverage plan's EPERM Coverage Map (re-confirm only, don't rebuild).
- **EPERM-03 alliance-presence slice** and **EPERM-04 alliance tab-control** — DEFERRED → Phase 130 (ride UNBLK-06 alliance render; alliances not rendered yet).
- **EPERM-05 alliance-typed markers** — OUT entirely per operator NOTE ("leave out alliances"); not deferred, not built. Only the **organization** slice is net-new in 120.
- EFLOW (121), bank-auth (122), EQTYP / EFLOW-02 / nominations (deferred cluster → 129/130).
</domain>

<decisions>
## Implementation Decisions

### Part 1 — Deferred-probe closure (the 4 gray areas resolved this session)

- **D-01 — Standalone `_probes` first (probe→spec relationship).** Build a **dedicated, committed `_probes` Playwright project** (the proper `_probes`/setup project the 119-08 session used only a throwaway ad-hoc config for), get all 4 deferred probes green standalone — that closes 119 — **then separately** author the full EPERM specs as real perm-chain nodes. Closure and the full-spec build are kept as **distinct gates**, NOT folded into one node. The 4 probes back EPERM-06/07/09/10 1:1 (video→06, questionInfo→07, popupNotice→09, orgMatching→10), so their green-in-isolation result de-risks those four spec builds, but the probe is not grown in-place into the spec.

- **D-02 — Dedicated isolation project + trace (re-diagnosis structure).** The `_probes`/setup Playwright project runs **ONE probe at a time** against a fresh Vite server + clean local Supabase, each seeded with only its own perm template (perm seeds clobber the `app_settings` singleton — keep them out of the shared serial chain). Before proposing ANY fix, capture a **trace/measurement that SEPARATES the two conflated failure modes** the 119-08 verdict lumped together — (a) `voter-questions-start` Button detaches mid-click (TOCTOU) vs (b) Button intermittently never mounts — AND rules out the degraded-env confound (stale Vite modules, `/results` cold-start timeouts) as an independent cause.

- **D-03 — Probes green → verify 119 → then full specs (closure sequencing).** Clean sequential close: 4 probes green in isolation → `/gsd-verify-work 119` satisfies 119-UAT test #1 and formally closes Phase 119 → then Phase 120 proper (the full EPERM specs) proceeds. Phase 120 plans may be structured so Part 1 is the first plan/wave and the close gate precedes the spec-build plans.

- **D-04 — Minimal / default-additive (existing-spec edits).** Follow the coverage plan default: new perm datasets are **additive** (own namespaced perm templates — already authored in 119). Edit existing specs ONLY where genuinely **non-additive** — specifically the **EPERM-05 organization slice** if making a party answer-incomplete shifts `voter-journey`'s rigid org-card counts (~lines 749–781); default to additive (assert-only) and confirm against `base.ts` org rows at build time. Do the EPERM-09 `git mv` + EPERM-11 consolidation exactly as the coverage plan specifies — no opportunistic re-baselining of adjacent expectations.

### Binding conditions carried from `DEF-119-08-01` (NON-NEGOTIABLE)

- **CONDITION 1 (binding):** the 4 probes MUST first be re-tested in TRUE ISOLATION (minimal mixing, fresh/clean env). The 119-08 evidence (contaminated, multi-run, degraded-env session) must NOT be trusted as a clean signal.
- **CONDITION 2 (binding):** the recorded 119-08 root-cause — "minimal perm seeds make `voterCtx.selectedQuestionBlocks` churn → `voter-questions-start` detaches/never-mounts, and full `e2e/base` doesn't churn this way" — is **UNCONFIRMED / SUSPICIOUS**, NOT fact. Re-diagnose independently before any fix. Three operator objections to answer: (1) a SMALLER seed churning MORE than the larger seed is unexplained; (2) two failure modes conflated without a trace separating them; (3) the degraded Vite env could itself produce intermittent mount failures. ([[feedback_flag_unverified_root_cause]])
- **Suspected-but-UNCONFIRMED fix:** the shared `tests/tests/fixtures/voter/voter-journey.fixture.ts` intro-start hardening (churn-robust mount→click→navigate around `voter-questions-start`) is the *suspected* fix but is **NOT to be applied** until isolation confirms it. A naive `dispatchEvent('click')` change at `voter-journey.fixture.ts:209` was tried in 119-08 and **REVERTED** (regressed the base journey / entityFilters probe). Any fix should ride the proper `_probes` setup-project wiring (keeps perm seeds out of the shared serial chain), not be forced onto the broadly-used journey fixture under a flaky env.

### Locked by the approved coverage plan (do NOT re-derive — read §Build List → EPERM)

- **Perm-chain serial-DAG facts:** the perm-* family is a strictly serial chain (each `data-setup-perm-X` `dependencies: [<previous perm SPEC>]`) because every perm setup clobbers the shared `app_settings` JSONB singleton. The chain's **END node is `perm-disable-allow-open`** (confirmed in `tests/playwright.config.ts:798–813` this session). New perm nodes append to the tail: `data-setup-perm-<new>` `dependencies: [perm-disable-allow-open]` (or the previous new perm in append order) → `perm-<new>` `dependencies: [data-setup-perm-<new>]` → `data-teardown-perm-<new>` via the setup's `teardown:` key; `extraTeardownPrefix: 'test-perm-'` for cross-chain isolation. **Append order among the new EPERM nodes is Claude's discretion** (see below).
- **Per-EPERM build blocks** (spec path / project wiring / seed delta / fixtures / semantic steps) are fully specified in `v2.14-E2E-COVERAGE-PLAN.md §Build List → EPERM (Phase 120)`, lines ~132–210. Executors read one block and build with no further audit.
- **EPERM-06 video semantics (operator-corrected):** the question video is **information about the question** on `customData.video` (`VideoContent`), rendered by the standalone `Video` component (NOT the hero `<figure>`) — its generic test-id was added in 119. Voter visibility matrix (video on q1/q3/q5 only, none on category intros) + candidate `hideVideo` flag.
- **EPERM-07 in full:** popup-modal (`interactiveInfo.enabled=true`) AND static-expander modes, per-question; PLUS advanced content readers — `infoSections`, `arguments` on one each of Likert/Boolean/Categorical (categorical grouped by `choiceId`). Separately, the `customData.terms` voter-journey extension (added to `e2e/base` in 119).
- **EPERM-10 matching-results PRIMARY:** assert org match scores differ per `none`/`answersOnly`/`impute` with EXACT expected values (blank org answers penalised as polar-opposite under `answersOnly`; member-imputed under `impute`); About-page disclosure text is secondary.

### Claude's Discretion
- **Append order** of the new/changed EPERM perm nodes within the serial chain tail (after `perm-disable-allow-open`).
- Whether the committed `_probes` project is **retired** once the full EPERM specs subsume the probe assertions, or **kept** as fast isolation smoke tests — decide at plan/build time (lean: keep, since they exercise a different, single-probe isolation path than the full perm-chain specs; but avoid asserting the same thing twice).
- Exact plan/wave decomposition (e.g. Part 1 probe-closure as wave 1, EPERM spec builds batched across subsequent waves).
- The actual confirmed root cause + the actual fix, once isolation re-diagnosis (D-02) produces it.

### UI hint
ROADMAP marks Phase 120 `UI hint: yes`, but this phase authors **E2E test specs that assert existing UI** — it does not redesign or add UI surface. Per [[feedback_skip_ui_spec_for_a11y_only_phases]] precedent (skip `gsd-ui-phase` for non-visual-redesign phases), **skip the `/gsd-ui-phase` auto-spawn** — no UI-SPEC.md needed.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Approved plan + locked decisions (PRIMARY)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — the operator-approved coverage + build plan. **§Build List → EPERM (Phase 120)** (lines ~132–210) is the per-spec build contract; **§EPERM Coverage Map** (lines ~55–73) carries the covered/partial/missing verdicts + per-row evidence; **§Extension-Scope Pins** (lines ~308–326) gives the exact net-new delta per extension; **§Deferred-Build Markers** (lines ~328–360) confirms the EPERM-03 alliance slice + EPERM-04 alliance tab → 130.
- `.planning/v2.14-E2E-DISCUSSION-POINTS.md` — the operator's `★ DECISIONS LOCKED` (A1 / 119.3 / 119.4 / 122.2 + EPERM operator NOTEs).
- `.planning/phases/119-e2e-fixtures-helpers-seed/deferred-items.md` — **`DEF-119-08-01`** (the 4 deferred probes + per-probe seed/run commands + CONDITION 1/2 + the suspected-but-unconfirmed fix). The binding Part-1 carry-forward.
- `.planning/phases/119-e2e-fixtures-helpers-seed/119-CONTEXT.md` — what 119 built (fixtures, helpers, perm templates, the new test-ids) that the EPERM specs consume.
- `.planning/phases/119-e2e-fixtures-helpers-seed/119-UAT.md` — UAT test #1 (the binding probe-closure criterion `/gsd-verify-work 119` must satisfy).

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` — EPERM-01..11 definitions + per-requirement operator NOTEs + traceability (EPERM-03 alliance sub-assertion → 130).
- `.planning/ROADMAP.md` — Phase 120 goal + 5 success criteria (SC5 = 3× determinism); perm-chain dependency notes.

### Live code to ground against
- `tests/playwright.config.ts` — the serial project DAG; perm-chain END node `perm-disable-allow-open` (lines 798–813); per-project `testDir` scoping (`./tests/specs/perm`, `./tests/specs/voter`) — note `_probes/` matches NO committed project today, so a new project entry is required for Part 1.
- `tests/tests/specs/_probes/{video,questionInfo,popupNotice,orgMatching}.probe.spec.ts` — the 4 deferred probes (the other 4 — entityFilters/navMenu/theme/trackingIntercept — are already live-green and back EFLOW specs).
- `tests/tests/fixtures/voter/voter-journey.fixture.ts` — the shared intro-start fixture (line ~209 is the reverted-change site; the suspected hardening target, gated on D-02 re-diagnosis).
- `tests/tests/specs/voter/voter-journey.spec.ts` — the EXTEND target for EPERM-04 (~lines 854–989) and EPERM-05 org slice (~lines 877–951); its rigid org-card counts (~749–781) are the non-additive ripple risk.
- `tests/tests/specs/perm/{perm-header-show-feedback,perm-disable-voter-app,perm-disable-candidate-app}.spec.ts` — EPERM-09 rename source + EPERM-11 consolidation sources.
- `packages/dev-seed/src/templates/e2e/perm/{question-video,interactive-info,show-feedback-survey,org-matching,access-disable}.ts` — the perm templates authored in 119 that these specs seed.
- `apps/frontend/src/lib/components/video/Video.svelte`, `packages/app-shared/src/data/customData.type.ts` (`VideoContent`/`infoSections`/`arguments`/`terms`) — the rendered surfaces the EPERM-06/07 specs assert.

### Determinism precedent
- v2.10 final suite (82/2) + v2.11 gate (84/0) — the 3×-green determinism standard SC5 must hold. [[feedback_e2e_did_not_run]] — a "did not run" EPERM spec counts as a FAILURE.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All Phase-119 fixtures/helpers/test-ids** are already built + smoke-tested: `Video` test-id + `expectVideo`, `expectInfoMode`/`expectInfoSections`/`expectArguments`, survey/feedback-popup handle + dismiss-and-reload helper, org-match-score readout + About-disclosure handle. The EPERM specs consume these directly — no new fixtures expected (A8 fixtures-first already satisfied).
- **`_probes` scaffolding partially exists:** 8 `*.probe.spec.ts` files are committed under `tests/tests/specs/_probes/`; 4 are already live-green. Part 1 needs the **project wiring** to make the 4 deferred ones runnable (the files exist; no committed project matches `_probes/`).
- **Existing perm specs** (`perm-hide-hero`, `perm-header-show-feedback`, the per-app disable specs) are the structural templates to mirror for the new EPERM nodes.

### Established Patterns
- **Perm-singleton pattern:** specs needing multiple settings values (EPERM-10 none/answersOnly/impute; EPERM-11 voterApp/candidateApp/underMaintenance) re-seed the `app_settings` singleton per sub-test.
- **Serial perm chain:** strictly serial, append-to-tail, `extraTeardownPrefix: 'test-perm-'` isolation — a bare `*.spec.ts` with no project entry never runs (Pitfall 3).
- **Behaviour-via-`data-testid`** routed through the `testIds` util; `no-restricted-locators` ESLint guard rejects raw CSS/text locators (A3).

### Integration Points
- New perm project nodes append after `perm-disable-allow-open` in `tests/playwright.config.ts`; each gets a `setup`/`teardown` pair in `tests/tests/setup/perm/`.
- EPERM-04/05 extend `voter-journey.spec.ts` in place (reuse `data-setup-base`, no new project).
- The Part-1 `_probes` project is a distinct, isolation-scoped Playwright project (its own setup that seeds one perm template at a time), separate from the perm serial chain.
</code_context>

<specifics>
## Specific Ideas

- **The 119↔120 seam is the only genuinely new decision here.** Everything else (the EPERM build blocks) was batch-decided in Phase 118 and is locked in the coverage plan — the planner should treat `v2.14-E2E-COVERAGE-PLAN.md §Build List → EPERM` as a near-SPEC and not re-scope.
- **Trace-first, fix-second (D-02).** The re-diagnosis must produce an artifact (Playwright trace + a measurement separating detach-vs-never-mounts) before any code change. The 119-08 conflation of two failure modes under one "reactive churn" banner is exactly what CONDITION 2 forbids carrying forward.
- **`/gsd-verify-work 119` is the explicit close ritual** once probes are green — don't let Phase 119 linger in `held pending UAT`; flip it closed before declaring Part 2.
- **Run discipline:** local Supabase up + a Vite frontend on a **free port** (5173 is occupied by the broken Docker build per `DEF-119-08-01` + [[project_e2e_env_blockers_2026_06]]); `FRONTEND_PORT=<port>`. Restart the dev server if HMR staleness is suspected before trusting a probe result ([[project_e2e_hmr_staleness_restart]]).
</specifics>

<deferred>
## Deferred Ideas

- **EPERM-03 alliance-presence slice + EPERM-04 alliance tab-control** — Phase 130 (ride UNBLK-06 alliance render, built Phase 129). Not Phase 120.
- **EPERM-05 alliance-typed missing-data markers** — OUT entirely per operator NOTE; never built.
- **EFLOW specs** (121), **bank-auth round-trip** (122), **EQTYP / EFLOW-02 / nominations** deferred cluster (129/130).
- **Whether to retire the `_probes` project** after the EPERM specs subsume the probe assertions — revisit at Phase-120 close (D-05 discretion above).

None — discussion stayed within phase scope (the only scope-adjacent topic, EFLOW/bank-auth, is correctly owned by 121/122).
</deferred>

---

*Phase: 120-e2e-specs-settings-permutation-matrix*
*Context gathered: 2026-06-15*
