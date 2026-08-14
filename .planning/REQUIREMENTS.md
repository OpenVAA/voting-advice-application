# Requirements: OpenVAA — Milestone v2.15 Trustworthy Foundations

**Defined:** 2026-08-12
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Milestone goal:** Make every automated check in the repo one that can be developed against — closing the coverage holes, blind assertions, untrustworthy test data, and missing CI gates that v2.14 surfaced but did not close.

## Standing acceptance rule (applies to every requirement below)

Carried from v2.14 and non-negotiable for this milestone: **prove the guard fails before claiming it guards.**
Every new or repaired check is run as a negative control **twice** — once against the old assertion to demonstrate
blindness, once against the new one to demonstrate the catch. A requirement whose check has not been observed
failing against a realistic injected regression is **not** satisfied, however green the suite looks.

Corollary for the visual gate specifically: baselines are captured only in
`mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`, with the dev server bound `--host 0.0.0.0`.
**Never on a developer Mac** — that mismatch left the visual-regression project non-functional from v1.2 to Phase 136.

## v2.15 Requirements

### Visual Regression Gate

- [ ] **VGATE-01**: An injected component-level regression of the magnitude measured at v2.14 close (~19,500 diff px) is caught on **every** baseline in the suite, including `voter-results-desktop` (1280×3684), which previously passed it at 0.41% of its ratio budget.
- [ ] **VGATE-02**: The gate's diff budget no longer scales with captured page height — a baseline that grows taller does not silently raise its own tolerance.
- [ ] **VGATE-03**: The chosen sensitivity mechanism (absolute `maxDiffPixels` cap vs bounded/element-scoped capture) is selected from **measured** per-baseline run-to-run noise, and those measurements are recorded so the threshold can be re-derived rather than re-guessed.
- [ ] **VGATE-04**: The app loads its Inter typeface from its own origin — the `e2e-visual` job completes green with all egress to `fonts.googleapis.com` blocked.
- [ ] **VGATE-05**: The production app issues no third-party font request (the privacy/latency win the self-hosting delivers independently of testing).
- [ ] **VGATE-06**: Baselines are re-captured in the CI-matching container after VGATE-01..05 land, and the full visual project passes green there across consecutive runs.

### Package Unit-Test Coverage

- [ ] **UNIT-01**: `yarn test:unit` executes the test files in `@openvaa/matching` and `@openvaa/core`; a deliberately failing assertion in either turns CI red.
- [ ] **UNIT-02**: Each of `@openvaa/llm`, `@openvaa/question-info`, and `@openvaa/argument-condensation` is either wired into `test:unit` or carries an explicit, documented skip contract naming the blocker (e.g. requires a live API key) — no package is silently absent from CI.
- [ ] **UNIT-03**: Every package wired in is confirmed green **before** its script is added, so the wiring never turns CI red on someone else's schedule.
- [ ] **UNIT-04**: A CI guard fails **by name** when a `packages/*` workspace contains test files but declares no `test:unit` script, so the hole cannot reopen with the next package added.

### Candidate-App Scan Coverage

- [ ] **CSCAN-01**: An authenticated scan fixture allows the axe route family to reach candidate `(protected)` routes.
- [ ] **CSCAN-02**: The axe scan covers the candidate app's principal routes across both themes and reports zero violations; violations surfaced by the first scan of these never-measured surfaces are **fixed within this milestone**, not deferred.
- [ ] **CSCAN-03**: `assertNoRawI18nKeys` runs on the candidate routes, and the two named blind sites — `candidate-journey.spec.ts:921` (`toHaveText(/edit/i)`) and `candidateProfilePage.fixture.ts:174` (`toContainText(/required/i)`) — now fail when their key renders raw, proven by injection.
- [ ] **CSCAN-04**: The raw-i18n-key claim is true for the application as a whole, not only voter surfaces — the overstatement recorded against REAL-04 at v2.14 close is retired.

### E2E Integrity

- [x] **INTEG-01**: The intermittent `EPERM-07` term-trigger failure is diagnosed to a **named root cause**, not merely stopped from reproducing. — Evidence: `138-DIAGNOSIS.md` § Named root cause (an ordering defect: URL committed at `client.js:1759-1760` before the DOM swap at `:1824`; the settle released at the URL), forced 15/15.
- [x] **INTEG-02**: The fix holds across a determinism run long enough to exercise the observed 1-in-8 failure rate. — Evidence: `138-DETERMINISM-LEDGER.md` § Verdict (16/16 consecutive full-suite runs on one pinned HEAD, 135 executed / 135 passed each, retries 0, every run preflight-confirmed) and `138-NEGATIVE-CONTROL.md` (pre-fix 5/5 fail, post-fix 0/5).
- [x] **INTEG-03**: `.planning/v2.14-CARDINAL-RULE-WAIVER.md` is discharged and recorded closed; the cardinal E2E rule is back in force unwaived, with no successor waiver opened. — Evidence: `.planning/v2.14-CARDINAL-RULE-WAIVER.md` § Discharged (2026-08-14, Phase 138 — four conditions answered, three evidence documents cited, exactly one waiver file under `.planning/`, forbidden-artefact audit 0 matches).
- [x] **INTEG-04**: The E2E preflight asserts the **served application's own response**, not the listener process — a foreign dev server occupying the port fails the preflight, proven by running it against one.
- [x] **INTEG-05**: The preflight is enforced by the harness rather than remembered by the operator, so it cannot be skipped.
- [x] **INTEG-06**: The E2E runbook (CLAUDE.md and the phase runbook) states the response-content check and no longer instructs "assert the listener is a node process".

### Assertion Quality

- [ ] **ASSERT-01**: The single-source findings — F15, F16, F18, F19 and the F20 table — are re-read against the live code and each is independently **confirmed or withdrawn** before any remediation is planned around it.
- [ ] **ASSERT-02**: **F3** — the 27 `*.teardown.ts` row-count assertions assert the expected count; a teardown that deletes nothing fails.
- [ ] **ASSERT-03**: **F19** — the `toBeDefined()` sites on `URLSearchParams.get()` / `FormData.get()` (which return `string | null` and never `undefined`) assert an actual value; a missing parameter fails.
- [ ] **ASSERT-04**: **F13** — `TemplateSchema` rejects unknown fields, so the six "accepts field X" tests fail when the schema stops declaring that field. Fallout from tightening is owned, not worked around.
- [ ] **ASSERT-05**: **F9** — a positive control exists for the `perm-hide-category-tags` / `perm-hide-election-tags` absence assertions; a tag that never renders at all now fails the pair instead of satisfying it.
- [ ] **ASSERT-06**: **F10** — `voter-journey.spec.ts`'s documented `expect.soft` budget matches the file's actual count (137, not 3), or the stated budget is enforced.
- [ ] **ASSERT-07**: **F15, F16, F17, F18, F20** — each finding that survives ASSERT-01 either asserts observable output rather than wiring, or is explicitly withdrawn with the reasoning recorded.
- [ ] **ASSERT-08**: The `svelte/store` ESLint guard covers the whole `apps/frontend/src/**` tree; a `svelte/store` import in `lib/components`, `lib/utils`, dynamic-components or candidate components fails `yarn lint:check`, proven by injection.
- [ ] **ASSERT-09**: Any pre-existing `svelte/store` usage surfaced by widening the guard is triaged per site — migrated to runes, or explicitly allowed with a recorded reason.

### Seed-Data Trustworthiness

- [ ] **TMPL-01**: Template `fixed[]` rows are typed per collection, so a sentinel or column the pipeline does not resolve (the `_elections`-on-a-`questions`-row case) is a **TypeScript error at authoring time**.
- [ ] **TMPL-02**: The seed pipeline **throws** on an unknown row property, naming the row's `external_id`, the offending key, and the collection — no silently dropped field.
- [ ] **TMPL-03**: `yarn db:reset-with-data` produces a dataset whose voter results page renders parties/organizations (currently 0) and shows the candidates tab (currently absent).
- [ ] **TMPL-04**: The `default` template's constant naming is reconciled with the `e2e/base` conventions, so the data shape reads consistently across templates.

### CI and Type-System Gates

- [ ] **CIGATE-01**: A GitHub Actions job runs `yarn db:lint:sql`; a lint violation introduced into a migration turns the build red. (The script exists today; no job invokes it.)
- [ ] **CIGATE-02**: SQL files are format-checked by the standard gate and auto-fixable by the standard format command, consistent with how the rest of the repo is formatted.
- [ ] **CIGATE-03**: A CI job scans for committed secrets and known-vulnerable dependencies; a planted test secret is caught, proven by injection.
- [ ] **CIGATE-04**: Every `RETURNS TABLE` RPC is enumerated against its semantically-nullable output columns (`get_nominations`'s `parent_nomination_id` and the four mutually-exclusive entity-id columns, `get_candidate_user_data`, and any others), with a **recorded remedy chosen per RPC**.
- [ ] **CIGATE-05**: Consumers of nullable RPC columns keep their null-guards without TypeScript flagging them as dead code — either through a single documented type-override layer or a restructured RPC, not scattered ad-hoc casts each new consumer must know about.

## Future Requirements

Deferred — tracked, not in this milestone's roadmap.

### Product Gaps

- **PARTY-01**: Generalize the candidate app to support parties/organizations as first-class registrants
- **FILTUI-01**: FilterGroup AND/OR mode toggle in the voter results filter dialog
- **SETTINGS-02/03**: Voter-side `answer.info` authoring and required-info-question enforcement (carried; scope reversed at v2.14 and still unrouted)

### Architecture

- **CAND-STORE-01**: Migrate the candidate answer store to a more robust architecture (architectural; carried since v2.4)
- **ADPT-AUTH-01**: Move Supabase-specific auth code out of frontend routes into the adapters
- **PROJSCOPE-01**: Per-instance project scoping in the frontend data provider
- **ADAPTER-PKG-01**: TSConfig-based importable package adapter loading
- **CIRCDEP-01**: 165 pre-existing intra-package circular dependencies in `data`/`matching`/`filters` (the `internal.ts` barrel pattern) — dedicated structural refactor

### Test Coverage (next test-focused milestone)

- **ESCOPE-01**: E2E coverage for election- and constituency-scoped questions (blocked on a backend `jsonb → uuid[]` migration)
- **EBANK-01**: Full bank-authentication round-trip E2E spec
- **QSPEC-I18N-01**: Migrate literal English strings in voter specs to `t()` lookups
- **ANALYTICS-01**: Convert analytics to a dynamic setting + consent E2E

## Out of Scope

| Item | Reason |
|------|--------|
| Accepting the visual-gate sensitivity floor as documented-only (option C) | The operator chose to fix it. A gate that is a component-level guard on some baselines and a layout-level guard on others, with nothing saying which, is the ambiguity this milestone exists to remove. |
| Patching the two named candidate-app raw-key sites in place | Closes two instances and leaves the class open on every candidate surface including future ones. The route-family extension is the fix; site patches are not. |
| Renewing or re-scoping the DEF-135-04 waiver | INTEG-03 discharges it. Carrying a waiver against the project's own cardinal rule across a second milestone normalises it. |
| New product/feature surface | This is a scaffolding and coverage milestone over existing features. Product gaps stay in Future above. |
| Admin app | Excluded from feature/E2E scope (standing exclusion since v2.14); the candidate-app scan extension does not extend to it. |
| Wiring the three Experimental packages green-at-any-cost | UNIT-02 permits an honest documented skip. Adding a script that fails is worse than the hole it closes. |
| Re-baselining visual snapshots on a developer Mac | Platform mismatch is the exact defect that left the visual project non-functional from v1.2 to Phase 136. |

## Traceability

**Coverage: 38/38 v2.15 requirements mapped to exactly one phase each. No orphans, no duplicates.**
Roadmap: `.planning/ROADMAP.md` (Phases 137-150). Future Requirements above are deliberately unmapped.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VGATE-01 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| VGATE-02 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| VGATE-03 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| VGATE-04 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| VGATE-05 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| VGATE-06 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Pending |
| UNIT-01 | Phase 141 — Package Unit-Test Coverage + `test:unit` Invariant Guard | Pending |
| UNIT-02 | Phase 141 — Package Unit-Test Coverage + `test:unit` Invariant Guard | Pending |
| UNIT-03 | Phase 141 — Package Unit-Test Coverage + `test:unit` Invariant Guard | Pending |
| UNIT-04 | Phase 141 — Package Unit-Test Coverage + `test:unit` Invariant Guard | Pending |
| CSCAN-01 | Phase 147 — Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate | Pending |
| CSCAN-02 | Phase 148 — Candidate-App A11y Remediation to Zero | Pending |
| CSCAN-03 | Phase 147 — Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate | Pending |
| CSCAN-04 | Phase 147 — Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate | Pending |
| INTEG-01 | Phase 138 — DEF-135-04 — `EPERM-07` Root Cause + Waiver Discharge | Complete |
| INTEG-02 | Phase 138 — DEF-135-04 — `EPERM-07` Root Cause + Waiver Discharge | Complete |
| INTEG-03 | Phase 138 — DEF-135-04 — `EPERM-07` Root Cause + Waiver Discharge | Complete |
| INTEG-04 | Phase 137 — E2E Preflight Integrity — Assert the Served Application | Satisfied |
| INTEG-05 | Phase 137 — E2E Preflight Integrity — Assert the Served Application | Satisfied (CI-runner half deferred — see STATE deferred table, T-137-11) |
| INTEG-06 | Phase 137 — E2E Preflight Integrity — Assert the Served Application | Satisfied |
| ASSERT-01 | Phase 139 — Single-Source Sweep Findings — Confirm or Withdraw | Pending |
| ASSERT-02 | Phase 140 — Blind-Matcher Remediation | Pending |
| ASSERT-03 | Phase 140 — Blind-Matcher Remediation | Pending |
| ASSERT-04 | Phase 144 — Seed-Template Strict Typing + Unknown-Prop Guard | Pending |
| ASSERT-05 | Phase 140 — Blind-Matcher Remediation | Pending |
| ASSERT-06 | Phase 140 — Blind-Matcher Remediation | Pending |
| ASSERT-07 | Phase 142 — Assertion Design — Wiring-Only Tests Assert Output | Pending |
| ASSERT-08 | Phase 143 — `svelte/store` Guard — App-Wide Reach + Fallout Triage | Pending |
| ASSERT-09 | Phase 143 — `svelte/store` Guard — App-Wide Reach + Fallout Triage | Pending |
| TMPL-01 | Phase 144 — Seed-Template Strict Typing + Unknown-Prop Guard | Pending |
| TMPL-02 | Phase 144 — Seed-Template Strict Typing + Unknown-Prop Guard | Pending |
| TMPL-03 | Phase 145 — Default Seed Template Repair | Pending |
| TMPL-04 | Phase 145 — Default Seed Template Repair | Pending |
| CIGATE-01 | Phase 149 — CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | Pending |
| CIGATE-02 | Phase 149 — CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | Pending |
| CIGATE-03 | Phase 149 — CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | Pending |
| CIGATE-04 | Phase 150 — `RETURNS TABLE` Nullability — Audit + Single Override Mechanism | Pending |
| CIGATE-05 | Phase 150 — `RETURNS TABLE` Nullability — Audit + Single Override Mechanism | Pending |

### Phase → requirement rollup

| Phase | Requirements | Count |
|-------|--------------|-------|
| 137 — E2E Preflight Integrity | INTEG-04, INTEG-05, INTEG-06 | 3 |
| 138 — `EPERM-07` Root Cause + Waiver Discharge | INTEG-01, INTEG-02, INTEG-03 | 3 |
| 139 — Single-Source Findings Confirm/Withdraw | ASSERT-01 | 1 |
| 140 — Blind-Matcher Remediation | ASSERT-02, ASSERT-03, ASSERT-05, ASSERT-06 | 4 |
| 141 — Package Unit-Test Coverage + Guard | UNIT-01, UNIT-02, UNIT-03, UNIT-04 | 4 |
| 142 — Assertion Design | ASSERT-07 | 1 |
| 143 — `svelte/store` Guard App-Wide | ASSERT-08, ASSERT-09 | 2 |
| 144 — Seed-Template Strict Typing | TMPL-01, TMPL-02, ASSERT-04 | 3 |
| 145 — Default Seed Template Repair | TMPL-03, TMPL-04 | 2 |
| 146 — Visual Gate | VGATE-01..06 | 6 |
| 147 — Candidate Scan Reach | CSCAN-01, CSCAN-03, CSCAN-04 | 3 |
| 148 — Candidate A11y to Zero | CSCAN-02 | 1 |
| 149 — CI Gates (SQL + secrets/vuln) | CIGATE-01, CIGATE-02, CIGATE-03 | 3 |
| 150 — RPC Nullability | CIGATE-04, CIGATE-05 | 2 |
| **Total** | | **38** |
