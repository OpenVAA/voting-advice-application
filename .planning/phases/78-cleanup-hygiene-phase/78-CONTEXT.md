# Phase 78: Cleanup Hygiene Phase - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question — see DISCUSSION-LOG.md for the audit trail)

<domain>
## Phase Boundary

Close five residual cleanup workstreams in one bundled phase (same shape as v2.7 P68 Dev-Tooling Trio / v2.8 P72 Package Hygiene Trio, scaled up to 5 workstreams):

- **CLEAN-01 — `dev:* → db:*` Supabase script rename** per `.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md`. Adds `yarn dev:clean` (wipes `apps/frontend/.svelte-kit` + `node_modules/.vite/`). `db:reset` and `db:reset-with-data` chain `dev:clean` after the supabase reset (the v2.8-close hidden-gotcha recipe). Updates root `package.json`, CI workflows, `CLAUDE.md` "Supabase Commands" section. Old `dev:*` names kept as deprecated aliases with a one-line warning, to be dropped after one milestone.
- **CLEAN-02 — Voter-not-located deferred-target redirect** per `2026-05-10-redirect-unlocated-voter-to-selectors.md`. Voters hitting located routes (`/results/...`, `/questions/...`) without `selectedElection + selectedConstituency` set are redirected through the selector with the original route preserved via `?next=` query param. After the voter completes selection, they resume the originally-requested route. E2E coverage included.
- **CLEAN-03 — Post-71 carry-forward trio:**
  - **CLEAN-03a** D-04 per-cast `// reason:` distribution in `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (13 cast sites; cluster-level anchor distributed to per-site lines) per `2026-05-10-d04-per-cast-reason-distribution.md`.
  - **CLEAN-03b** `setStore` structural cast cleanup at `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:41` per `2026-05-10-getroute-setstore-cast-cleanup.md`.
  - **CLEAN-03c** CLAUDE.md anchor for the Svelte warning-accepted format per `2026-05-09-claude-md-svelte-warning-accepted-format.md`.
- **CLEAN-04 — i18n wrapper tightening** per `2026-05-09-tighten-i18n-wrapper.md`. Stricter `TranslationKey` typing on `t()`; audit `t.get = t` alias usage (remove if zero consumers; inline-document if consumers exist); update i18n tests to add TS-level assertion that missing keys are a compile-time error. Paired with E2E-08 (Phase 74 locale switching) per ROADMAP Pairing note Order B — Phase 74 landed first; Phase 78 lands the i18n tightening; the existing E2E-08 spec re-validates against the tightened wrapper.
- **CLEAN-05 — Phase 73 review backlog + voter-fixture race-fix Path B:**
  - **Voter-fixture race (Path B + `--likert-only`)** per `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`. Adds `--likert-only` seed mode to `@openvaa/dev-seed` (CLI flag + e2e template override). After: `yarn db:reset-with-data --likert-only` (or `db:seed --likert-only` per the CLEAN-01 rename) feeds a 16-Likert-only opinion-question seed; `voter.fixture.ts answeredVoterPage` keeps its Likert-only loop. The 16 tests in the post-73 DATA_RACE pool flip to PASS_LOCKED. Heterogeneous-question-type coverage deferred to future-milestone backlog (out of scope).
  - **Phase 73 review findings (13 items: CR-02 + 7 WR + 5 IN)** from `.planning/phases/73-determinism-baseline/73-REVIEW.md`. Each finding either fixed in code or accepted inline with a `// reason:` block per the v2.8 Phase 70 Cat A convention.

Phase 78 is independent of Phases 74-77 (per ROADMAP Pairing note); only depends on Phase 73 closure. Same shape as v2.7 P68 / v2.8 P72 hygiene trios — scaled up. May develop in parallel with Phases 76 / 77.

</domain>

<decisions>
## Implementation Decisions

### Plan grouping + sequence

- **D-01 — 7 plans.** ROADMAP estimates "~6-8 plans — 1 per CLEAN-01/02/04 + CLEAN-03 potentially splitting into 1 plan per sub-finding given the 3-pack shape + CLEAN-05 splitting into 2-3 plans by sub-cluster" (line 268). Auto-selected layout:
  1. **Plan 01 — CLEAN-01 (`dev:* → db:*` rename + `dev:clean` + chain).** Renames the 7 `dev:*` scripts to `db:*` per the explicit mapping in the source todo (`dev:start → db:start`, etc.). Adds `yarn dev:clean` that wipes `apps/frontend/.svelte-kit` + `node_modules/.vite/`. Chains `dev:clean` into both `db:reset` and `db:reset-with-data` after the supabase reset. Updates: root `package.json` scripts block (lines 10-17 per scout §1); CLAUDE.md "Supabase Commands" section (line 55); `.planning/` cross-references (PLAN.md / VALIDATION.md files mentioning `yarn dev:reset-with-data` — preserved-via-alias for back-compat). CI workflows: scout §1 found NO `.github/workflows/*.yml` references; verify at PLAN.md time and update if any introduced post-scout. Old `dev:*` names KEPT as deprecated aliases with a one-line warning emitted via `echo` in the script body (per source todo "Approach" step 1).
  2. **Plan 02 — CLEAN-02 (voter-not-located deferred-target redirect).** Implements the redirect logic at the located-route layout (`apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts` or +page.server.ts — planner verifies at PLAN.md time). Captures target URL via `?next=` query param; redirects to `/elections` if no election picked, then `/constituencies`. After selector completes, redirects to the original URL. Test cases per source todo: direct link with no election picked; multi-election + multi-const setup; single-election (auto-select) + multi-const; refresh on located route after localStorage cleared. E2E spec: NEW `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` (or extension to existing `voter-journey.spec.ts` per Claude's Discretion).
  3. **Plan 03 — CLEAN-03 bundled trio (3a + 3b + 3c).** Per ROADMAP line 268 the planner MAY split CLEAN-03 into per-sub-finding plans; default bundles for plan-count efficiency (mirrors v2.8 P70 multi-cat single-plan precedent — Cat A / Cat B / Cat C handled across 5 plans BUT also bundled-when-small precedents like P70-05 BIND-01 single plan for 26 comment strips):
     - **3a** Distribute the cluster-level `// reason:` anchor at `supabaseDataProvider.ts` to per-cast lines for all 13 cast sites. Distinguish `parseStoredImage(data.image as Json as unknown as StoredImage | null, ...)` (JSONB → typed-shape, runtime-guarded by `parseStoredImage`) from `parseAnswers(answers as Json as unknown as LocalizedAnswers | null)` (JSONB → answers, structural guard inside `parseAnswers`). Grep gate (≥7 matches per scout §3a) re-asserted.
     - **3b** Refactor the `setStore` structural cast at `getRoute.svelte.ts:41`. Three viable fixes per source todo / scout §3b: (1) direct `const setStore: (v: RouteBuilder) => void = store.set;`; (2) inline use `afterNavigate(() => store.set(buildFn()));`; (3) `store.update(() => buildFn())`. Default option: (2) inline use — simplest; doesn't introduce a one-shot variable; matches the `update()` semantics already in use elsewhere in the file.
     - **3c** Add a CLAUDE.md anchor section documenting the Svelte warning-accepted format (`// svelte-warning: accepted — <reason>` per source todo). Either §"Important Implementation Notes" or new §"Svelte Warning Conventions". Default: new sub-section under "Important Implementation Notes" (avoids growing the section count; keeps the convention adjacent to related Svelte 5 notes).

     Risk: Plan 03 bundles 3 sub-findings across different surfaces. Planner may split into 03a / 03b / 03c if scope exceeds per-plan ceiling. Default: 1 bundled plan.
  4. **Plan 04 — CLEAN-04 (i18n wrapper tightening).** Per source todo + scout §4:
     - Tighten `t()` signature in `apps/frontend/src/lib/i18n/wrapper.ts` to use `TranslationKey` (auto-generated union from `apps/frontend/src/lib/types/generated/translationKey.ts`) instead of `string`. Compile-time validation catches missing keys (the v2.8 P69 `results.alliance.summary` leak would have been caught).
     - Audit `t.get = t` alias usage across `apps/frontend/src/lib/` + `tests/`. If zero consumers: delete the alias. If consumers exist: rewrite to plain `t()` callsites, then delete OR document inline if rewrites are infeasible.
     - Update `apps/frontend/src/lib/i18n/tests/translations.test.ts` with a TS-level assertion (e.g., `// @ts-expect-error` line on a `t('nonexistent.key')` call) that catches regressions if the type tightening is loosened.
     - Acceptance gate: `yarn workspace @openvaa/frontend check` baseline does NOT regress beyond the v2.7-close baseline (160 errors / 12 warnings); reductions are welcome but not required. `yarn test:unit` + Phase-73 Playwright determinism baseline remain green.

     **Pairing with E2E-08 (Order B):** Phase 74 P06 landed E2E-08 against the PRE-tightening wrapper; Phase 78 P04 tightens; the existing E2E-08 spec re-validates against the tightened wrapper. Recorded in `78-VERIFICATION.md` "Pairing direction" field at phase close.
  5. **Plan 05 — CLEAN-05 voter-fixture race-fix (Path B + `--likert-only`).** Adds `--likert-only` seed mode to `@openvaa/dev-seed`:
     - CLI flag: extend the dev-seed CLI entrypoint to accept `--likert-only` (`db:reset-with-data --likert-only` or `db:seed --likert-only` post-CLEAN-01-rename).
     - Template override: extend `packages/dev-seed/src/templates/e2e.ts` `questions.fixed[]` to restrict to `singleChoiceOrdinal` opinion questions when the flag is set. Estimated scope per source todo: ~15 LOC in template + ~1 LOC in fixture default + plumbing the CLI flag through `dev-seed`.
     - Wire `voter.fixture.ts answeredVoterPage` to keep its Likert-only loop (no fixture change; the seed change feeds compatible data).
     - Acceptance: `yarn db:reset-with-data --likert-only` runs cleanly + the 16 voter-app tests in the post-73 DATA_RACE pool pass on cold-start `--workers=1`. Heterogeneous-question-type coverage deferred to future-milestone backlog (per source todo's "Out of scope" line).

     **NOTE — order dependency:** Plan 05 depends on Plan 01 (the `db:*` rename + `dev:clean` aren't pre-requisites for the SEED flag itself, but the verification-gate parity-script regen runs against the post-CLEAN-01 script names). If Plan 01 has not landed yet, Plan 05 falls back to `dev:reset-with-data --likert-only` (the imperative pre-rename form).
  6. **Plan 06 — CLEAN-05 review-findings sweep (CR-02 + 7 WR + 5 IN).** Closes the 13 Phase 73 review findings from `.planning/phases/73-determinism-baseline/73-REVIEW.md`. Each finding either fixed in code OR accepted inline with a `// reason:` block per the v2.8 Phase 70 Cat A convention. Per-finding action per scout §5a:
     - **CR-02** (`voter-popups.spec.ts:138,220`) — Replace `waitFor({state:'visible'})` on already-visible anchors with `expect(dialog).toBeHidden({ timeout: 3000 })` / `expect(dialogLocator).toHaveCount(0, { timeout: 3000 })` so the 2-5s popup-delay wait actually takes 2-5s.
     - **WR-01** (`multi-election.spec.ts:145`) — Replace `.catch(() => false)` swallow-trap with union waitFor + deterministic branch on resolved anchor (`answerOption.first().or(categoryStart).waitFor({state:'visible'})`).
     - **WR-02** (`constituency.spec.ts:89-98`, `startfromcg.spec.ts:120-128`) — Rewrite race-prone `selectElectionFromAccordionIfPresent` helpers to branch deterministically on resolved anchor (or dedicated accordion waitFor after union).
     - **WR-03** (`multi-election.spec.ts:215-231`) — Root-cause-or-document the SvelteKit silent `goto()` fallback; add hard precondition asserts on `electionUuids`/`constituencyUuids` in `beforeAll`.
     - **WR-04** (`auth.setup.ts:29-48`) — Drop the wasted `reload()` in retry loop (immediately replaced by next `goto()`).
     - **WR-05** (`supabaseAdminClient.ts:340-377`) — Wrap `forceRegister`'s 4-step mutation in try/catch with compensating `auth.admin.deleteUser` rollback on partial failure.
     - **WR-06** (`supabaseAdminClient.ts:532-547`) — Propagate per-user errors in `deleteAllTestUsers` (collect errors or fail-fast on first).
     - **WR-07** (`supabaseAdminClient.ts:122-156`) — Delete `fixGoTrueNulls` as dead code (or wire into `safeListUsers` with upstream-issue link if still relevant).
     - **IN-01** (`candidate-bank-auth.spec.ts:28-33`) — Throw-on-missing-key (or `// reason:` block) for the demo-JWT fallback.
     - **IN-02** (`candidate-bank-auth.spec.ts:169`) — Tighten the `body.error ?? body.msg ?? body.details` precedence chain with `typeof` checks (replace as-cast).
     - **IN-03** (`candidate-questions.spec.ts:34`, `candidate-settings.spec.ts:64`, `voter-results.spec.ts:170,219,277`) — Audit unjustified `getByTestId` usages; replace with semantic locators OR add `// reason:` blocks per v2.8 P70 Cat A.
     - **IN-04** (`voter-results.spec.ts:206-211`) — Strengthen the trivial `toBeLessThanOrEqual` filter assertion (assert strict inequality or compute expected filtered count).
     - **IN-05** (`data.setup.ts:144-146`) — Replace the tautological `expect(true).toBe(true)` with a semantic post-condition check (verify auth user was created + linked).

     Risk: Plan 06 covers 13 findings across ~9 files. Planner may split into 06a (CR + WR — 8 findings, test-determinism focused) + 06b (IN — 5 findings, polish). Default: 1 bundled Plan 06.
  7. **Plan 07 — Verification gate.** Same shape as Phase 74 P07 / Phase 75 P02b / Phase 76 P04 / Phase 77 P05. Runs:
     - `yarn db:reset-with-data --likert-only` cleanly (CLEAN-05 acceptance).
     - 3-run cold-start `--workers=1` × 3 identical pass/fail set with the 16 previously-DATA_RACE tests now passing (CLEAN-05 acceptance).
     - `tests/scripts/diff-playwright-reports.ts` constants re-regenerated against the post-CLEAN-05 baseline (PASS_LOCKED grows by 16, DATA_RACE shrinks by 16) with `PARITY GATE: PASS`.
     - All 12 review findings (CR-02 + 7 WR + 5 IN — 13 total minus the voter-fixture race-fix which is its own Plan 05) verified resolved or accepted inline.
     - `STATE.md §Blockers/Concerns` Phase 73 follow-up entries removed.
     - `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` moved to `.planning/todos/completed/`.
     - `73-REVIEW.md` annotated with per-finding resolution (or post-close cross-link to the CLEAN-05 plan(s)).
     - Source todos (6 items) removed from `.planning/todos/pending/` (or marked resolved).

     Produces `78-VERIFICATION.md`. Includes vite-cache wipe + parity-script self-identity smoke (per D-12).

  **Plan-count total: 7 plans** (Plan 01 CLEAN-01 / Plan 02 CLEAN-02 / Plan 03 CLEAN-03 trio / Plan 04 CLEAN-04 / Plan 05 CLEAN-05 voter-fixture / Plan 06 CLEAN-05 review findings / Plan 07 verification gate). Matches ROADMAP's "~6-8 plans" estimate.

### `db:*` rename + alias semantics

- **D-02 — Deprecated aliases kept with one-line warning.** Per source todo "Approach" step 1: each old `dev:*` script is kept as a deprecated alias that prints a one-line warning via `echo "[deprecated] yarn dev:reset is now yarn db:reset; alias preserved for back-compat" >&2 && yarn db:reset` (or shell-equivalent forwarder). Reason: 4 PLAN.md / VALIDATION.md files reference `yarn dev:reset-with-data` etc. across `.planning/`; preserving aliases means downstream phases (especially Phases 76 / 77 active in parallel) don't break. Aliases planned for removal "after one milestone" — captured in `<deferred>` as a v2.10+ cleanup.

- **D-03 — Chain semantics for `db:reset` / `db:reset-with-data`.** Per source todo "Chain semantics": both scripts run the Supabase reset AND `dev:clean` (the cache wipe). Concrete sequencing: supabase reset first → `dev:clean` after (so cache wipe doesn't fire BEFORE the reset finishes, avoiding races on still-active vite dev server). Implementation: chain via `&&` in the script body. Cross-reference: v2.8 P69 parity-gate-followup completed-todo documents the vite-cache gotcha that motivates this.

- **D-04 — CI workflow scan.** Per scout §1: no `.github/workflows/*.yml` references to `dev:reset` / `dev:seed` found at scout time. Plan 01 verifies at PLAN.md time (re-runs the grep against any post-scout YAML changes) and updates if any introduced; otherwise no-op.

### Redirect implementation strategy (CLEAN-02)

- **D-05 — `?next=` query param round-trip.** Per source todo "Approach" steps 2-3: SvelteKit's `redirect(303, ...)` is used; the deferred target is captured via `?next=<encoded-pathname-and-search>`. The selector page's submit handler reads `url.searchParams.get('next')` and redirects to that target after a successful selection. Encoding: `encodeURIComponent(url.pathname + url.search)` to preserve query string state (e.g., selected entityType, drawer state). Limit: deferred target MUST match the voter app's URL whitelist (no open-redirect vulnerability — restrict to `^/[a-z]{2}?/?` paths within the voter app); planner adds the whitelist check at PLAN.md time.

- **D-06 — Gate location:** `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts` (load function). Per scout §2 the located-route layout is where `selectedElection` / `selectedConstituency` are resolved. The load function checks state from the voter context (which reads from cookie / localStorage via `voterContext.svelte.ts` per scout §2); if EITHER state is missing, throw `redirect(303, /elections?next=...)`. Planner confirms the gate signature at PLAN.md time + identifies whether `+page.server.ts` or `+layout.ts` is the cleanest insertion point (the `(located)` route group's existing load may need to grow OR a new `+layout.server.ts` may be cleaner).

- **D-07 — E2E spec coverage scope:** NEW `tests/tests/specs/voter/voter-not-located-redirect.spec.ts`. Asserts the 4 cases from source todo "Test cases":
  - Direct link to `/results/X` with no election picked → bounce → final URL matches `/results/X`.
  - Multi-election + multi-const → bounce twice (election → constituency) → final URL preserved.
  - Single-election (auto-select) + multi-const → bounce only to constituency → final URL preserved.
  - Refresh on located route after localStorage cleared mid-session → bounce → resume.

  Default Playwright project: `voter-app`. Spec uses `page.context().clearCookies()` + `page.evaluate(() => localStorage.clear())` to set up the "fresh voter" state.

### CLEAN-03 sub-finding implementation

- **D-08 — 3a per-cast distribution.** Distribute the cluster-level `// reason:` anchor in `supabaseDataProvider.ts` (at lines 105-191 per scout §3a; 13 cast sites total) to per-cast lines. Reason text differs per cast category:
  - **Image casts** (e.g., `data.image as Json as unknown as StoredImage | null`): `// reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.`
  - **Answer casts** (e.g., `answers as Json as unknown as LocalizedAnswers | null`): `// reason: JSONB → LocalizedAnswers shape; structural guard applied inside parseAnswers.`
  - **Settings / metadata casts** (the remaining ~6 sites): planner classifies per the cast's target type and adds per-site reason text at PLAN.md time.

  Grep gate (≥7 matches per scout §3a) is already satisfied at HEAD. The CLEAN-03a deliverable is convention-tightening only — no behavioral change.

- **D-09 — 3b refactor approach.** Per scout §3b three viable fixes for the `setStore` cast at `getRoute.svelte.ts:41`:
  - **(1) Direct assignment** — `const setStore: (v: RouteBuilder) => void = store.set;` — simplest; introduces a one-shot variable name `setStore`.
  - **(2) Inline use** — `afterNavigate(() => store.set(buildFn()));` — eliminates the variable entirely.
  - **(3) `store.update()` semantic** — `afterNavigate(() => store.update(() => buildFn()));` — preserves the writable's atomicity contract.

  Default selection: **(2) inline use**. Rationale: simplest; eliminates the structural-cast pattern at the source (the cast was a workaround for extracting `set` from a `Readable<RouteBuilder>` factory return); doesn't introduce a one-shot name. (3) is RECOMMENDED-as-alternative if there's a multi-line `set` body that benefits from `update()`'s atomicity — planner's call at PLAN.md time.

  Phase 71 reviewer marked this as `IN-03 — No action required` (per scout §3b). Phase 78 P03b reverses that decision (the consolidated CLEAN-03 trio close is the right time to land this; not a piecemeal fix).

- **D-10 — 3c CLAUDE.md anchor.** Add a new sub-section under "Important Implementation Notes" titled "Svelte Warning-Accepted Format" with the canonical pattern:
  ```
  ## Important Implementation Notes
  ...
  ### Svelte Warning-Accepted Format

  When a Svelte / vite-plugin-svelte / SvelteKit warning is intentionally accepted (rather than fixed at the source), use this inline format:

  // svelte-warning: accepted — <one-sentence-rationale>

  Place the comment IMMEDIATELY ABOVE the warning-triggering line. Rationale should explain WHY the warning is accepted (e.g., "framework-emitted false positive for prop reassignment in init phase"). Per v2.8 Phase 70 Cat A convention.
  ```
  Per source todo "Action after the FIRST real Option B case lands in codebase" — the deferred origin was 2026-05-09 awaiting a first in-tree Option B example. Since Phase 70 D-05 + the bind-rationale strip (P70 BIND-01) established the format, Phase 78 P03c lands the anchor without waiting for additional examples.

### i18n wrapper tightening (CLEAN-04)

- **D-11 — Stricter typing scope + audit deliverable.** Per source todo + scout §4:
  - **t() signature tightening:** `wrapper.ts` `t(key: string, ...)` → `t(key: TranslationKey, ...)`. The auto-generated union type at `apps/frontend/src/lib/types/generated/translationKey.ts` is regenerated by `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` post-build. Planner verifies the generator runs in the build pipeline (CI / local `yarn build`) at PLAN.md time.
  - **`t.get = t` alias audit:** Grep `apps/frontend/src/lib/` + `tests/` for `t.get` usages. Three outcomes per consumer site:
    - **Zero consumers:** Delete the alias entirely (one-line removal in wrapper.ts).
    - **1-5 consumers:** Rewrite to plain `t()` callsites; delete the alias.
    - **Many consumers (>5):** Keep the alias with an inline `// reason:` block documenting why it exists; planner records the count in `78-VERIFICATION.md`.

    Default disposition: planner picks at PLAN.md time after grep audit. RECOMMENDED: delete-if-zero-consumers (likely outcome per source todo's "either delete it; if consumers exist, rewrite" language).
  - **Test update:** Add a `// @ts-expect-error` assertion in `apps/frontend/src/lib/i18n/tests/translations.test.ts` on a `t('nonexistent.key')` call to LOCK the typing tightening against future regressions. If the type is loosened, the `@ts-expect-error` directive fails, surfacing the regression at test-time.

  **Acceptance gates:**
  - `yarn workspace @openvaa/frontend check` baseline does NOT regress beyond v2.7-close baseline (160 errors / 12 warnings).
  - `yarn test:unit` remains green.
  - Phase 73 Playwright determinism baseline preserved (E2E-08 spec re-validates against tightened wrapper per D-12 Pairing).

- **D-12 — Pairing direction with E2E-08 (Order B confirmed per ROADMAP Pairing note).** Phase 74 P06 landed E2E-08 (locale-switching coverage) BEFORE this phase. Phase 78 P04 tightens the i18n wrapper; the existing E2E-08 spec then re-validates against the tightened wrapper. If the tightening surfaces any E2E-08 regressions (e.g., a translation key the spec uses no longer typechecks because it was renamed or removed mid-flight), Plan 04 fixes them inline. Recorded in `78-VERIFICATION.md` "Pairing direction: Order B" field.

### Voter-fixture race-fix scope (CLEAN-05a)

- **D-13 — Path B locked; `--likert-only` seed modifier.** Per source todo (operator-locked on 2026-05-11): Path B is the chosen approach. Heterogeneous-question-type coverage is EXPLICITLY OUT OF SCOPE (the dedicated specs that would cover heterogeneous types are deferred to a future-milestone backlog). Plan 05 scope per source todo:
  - **`@openvaa/dev-seed` CLI flag:** Add `--likert-only` to the dev-seed CLI entry point.
  - **Template override:** When `--likert-only` is passed, the `e2e` template's `questions.fixed[]` restricts to `singleChoiceOrdinal` opinion questions (≤16 questions). Plan 05 audits the current `e2e.ts` to confirm: Phase 75 added `test-question-boolean-1` at sort 18; Phase 74 added `test-question-directional-1` at sort 17; Phase 77 will add `test-question-number-1` at sort 19 (potentially in parallel — coordination per D-15). The `--likert-only` override SKIPS sorts 17-19+ to keep the loop at 16 ordinals.
  - **Fixture-side change:** ≤1 LOC in `voter.fixture.ts answeredVoterPage` — preserves the existing Likert-only loop semantics.
  - **CLI plumbing:** `db:reset-with-data` (post-rename) / `db:seed` accepts the flag and forwards to dev-seed.

  Estimated scope per source todo: ~15 LOC in template + ~1 LOC in fixture default + plumbing the CLI flag. The 16 voter-app tests in the post-73 DATA_RACE pool (per scout §5b: voter-detail × 4, voter-journey × 1, voter-matching × 1, voter-results × 12, voter-settings × 1; verified count = 19; actual operator count per source todo = 16 — planner reconciles at PLAN.md time) flip from DATA_RACE → PASS_LOCKED after this lands.

### Phase 73 review findings sweep (CLEAN-05b)

- **D-14 — 13 findings per-finding action per scout §5a.** Default disposition per finding listed in D-01 Plan 06 above. Planner may opt to GROUP findings by surface for efficient editing:
  - **`tests/tests/specs/variants/` cluster** (CR-02 + WR-01 + WR-02 + WR-03) — 4 findings, all in variants spec files. Group-edit.
  - **`tests/tests/setup/` cluster** (WR-04) — 1 finding.
  - **`tests/tests/utils/supabaseAdminClient.ts` cluster** (WR-05 + WR-06 + WR-07) — 3 findings, all in admin client. Group-edit.
  - **`tests/tests/specs/candidate/` cluster** (IN-01 + IN-02 + IN-03 part) — 3 findings.
  - **`tests/tests/specs/voter/` cluster** (IN-03 part + IN-04 + CR-02) — overlap with variants cluster; resolve once.
  - **`tests/tests/setup/data.setup.ts`** (IN-05) — 1 finding.

  Acceptance per ROADMAP SC #5 final bullet: each finding either fixed in code OR accepted inline with `// reason:` block. The `// reason:` block follows v2.8 P70 Cat A canonical shape (per scout §3 + Phase 73 D-07 + Phase 74 D-11 + Phase 75 D-06 + Phase 76 D-11a / Phase 77 D-11 inheritance).

### Plan order + dependency direction

- **D-15 — Plan ordering & parallelism map:**
  ```
  Plan 01 (CLEAN-01 rename) ─────────┐
                                      ├──→ Plan 07 (verification gate)
  Plan 02 (CLEAN-02 redirect) ───────┤
                                      │
  Plan 03 (CLEAN-03 trio) ───────────┤
                                      │
  Plan 04 (CLEAN-04 i18n tighten) ───┤
                                      │
  Plan 05 (CLEAN-05 voter-fixture) ──┤  ← depends on Plan 01 (db:* alias OR fallback to dev:*)
                                      │
  Plan 06 (CLEAN-05 review findings)─┘
  ```
  Plans 01-06 are mostly INDEPENDENT (different surfaces: scripts / routes / data-provider / i18n / dev-seed / test files). Plan 05 has a weak dependency on Plan 01 (uses the post-rename script names; falls back to pre-rename `dev:*` if Plan 01 hasn't landed). Plan 07 depends on ALL of 01-06 landed.

  Cross-phase: Phase 78 runs in parallel with Phases 76 + 77 (per ROADMAP line 261). Phase 76 + 77 specs use the existing `dev:*` scripts; Phase 78 P01 lands the aliases so neither phase breaks; Phase 78 P01 + P05 work together (P05 uses the new flag against either pre- or post-rename CLI per fallback).

- **D-16 — Pairing direction with Phase 74 E2E-08 (Order B):** Already confirmed (per ROADMAP Pairing note + Phase 74 D-06). Phase 78 P04 lands the i18n tightening; the existing E2E-08 spec at `tests/tests/specs/voter/voter-locale-switching.spec.ts` re-validates against the tightened wrapper. If regressions surface, Plan 04 fixes inline.

### Determinism contract + parity-gate regen

- **D-17 — Determinism contract.** All test changes from CLEAN-05 (Plans 05 + 06) MUST pass 3× cold-start `--workers=1` identically per the Phase-73 gate shape. After Plan 05 lands, the 16 post-73 DATA_RACE tests MUST flip to PASS_LOCKED (this is the explicit acceptance per ROADMAP SC #5 final bullet (b)). After Plan 06 lands, no new DATA_RACE entries introduced. Plan 07 verification gate asserts both via the 3-run smoke + parity-script regen.

- **D-18 — Parity-script constants regen — REQUIRED for this phase.** Plan 07 verification gate regenerates `tests/scripts/diff-playwright-reports.ts` constants. The expected delta: `PASS_LOCKED` grows by 16 (from the post-73 baseline of 4); `DATA_RACE` shrinks by 16 (from the post-73 baseline of 15 → 19, accounting for Phase 74 additions). Planner computes the exact post-CLEAN-05 expected counts at Plan 07 time after re-reading the current post-Phase-77 baseline (Phase 77 may add new PASS_LOCKED entries that further adjust the count).

### Vite-cache wipe + end-of-phase gate

- **D-19 — Vite-cache wipe is mandatory before the 3-run smoke.** Plan 07's verification gate MUST start with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per the v2.8-close gotcha. The new `yarn dev:clean` (added by Plan 01 of THIS phase) IS the durable form; once Plan 01 lands, Plan 07 may invoke `yarn dev:clean` directly. Order: Plan 01 → Plan 07. Plan 07 uses `yarn dev:clean` if Plan 01 landed; falls back to imperative recipe if order somehow differs.

### Locator + lint convention

- **D-20 — Inherits Phase 74 D-11 / Phase 75 D-06 / Phase 76 D-11a / Phase 77 D-11.** Role/aria locators by default; `getByTestId(...)` only with inline `// reason:` per v2.8 P70 Cat A. The post-Phase-73 `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable. All NEW Plan 02 spec (voter-not-located-redirect.spec.ts) and all Plan 06 sweep edits MUST pass `yarn lint:check` clean.

  Specifically Plan 06 IN-03 ("audit unjustified getByTestId usages") is the SOURCE of the inline `// reason:` convention being enforced in Phase 78. The 5 sites identified by IN-03 (per scout §5a: `candidate-questions.spec.ts:34`, `candidate-settings.spec.ts:64`, `voter-results.spec.ts:170,219,277`) get either semantic-locator rewrites OR `// reason:` blocks.

### Claude's Discretion

- **CLEAN-03 split into 03a / 03b / 03c vs. bundled into Plan 03.** Default: bundled. Alternative: split for finer atomicity. Planner's call at PLAN.md time based on per-plan ceiling.
- **CLEAN-05 split into Plan 05 (voter-fixture) + Plan 06 (review findings) vs. further split into 06a (CR+WR) + 06b (IN).** Default: 2 plans (05 + 06). Alternative: 3 plans (05 + 06a + 06b). Planner's call.
- **Whether to delete `t.get = t` alias unconditionally vs. consumer-conditional.** Default: consumer-conditional grep audit at Plan 04 start. Alternative: unconditional delete (and rewrite all consumers in-place). RECOMMENDED: grep-first.
- **Whether CLEAN-03c CLAUDE.md anchor lives in a new top-level section or under "Important Implementation Notes".** Default: under "Important Implementation Notes" sub-section. Alternative: new top-level "## Svelte Conventions" section. Default avoids growing the section count.
- **Whether Plan 07 verification gate updates STATE.md / cleans up `.planning/todos/pending/` items inline OR as a post-phase commit.** Default: inline (in Plan 07's commits, before the `78-VERIFICATION.md` commit). Alternative: as a separate `chore` commit post-VERIFICATION.

### Folded Todos

Phase 78 explicitly RESOLVES six source todos (per ROADMAP SC #6 + the per-CLEAN-0X mapping):
- `.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` → CLEAN-01 (Plan 01). Removed at phase close.
- `.planning/todos/pending/2026-05-10-redirect-unlocated-voter-to-selectors.md` → CLEAN-02 (Plan 02). Removed at phase close.
- `.planning/todos/pending/2026-05-10-d04-per-cast-reason-distribution.md` → CLEAN-03a (Plan 03). Removed at phase close.
- `.planning/todos/pending/2026-05-10-getroute-setstore-cast-cleanup.md` → CLEAN-03b (Plan 03). Removed at phase close.
- `.planning/todos/pending/2026-05-09-claude-md-svelte-warning-accepted-format.md` → CLEAN-03c (Plan 03). Removed at phase close.
- `.planning/todos/pending/2026-05-09-tighten-i18n-wrapper.md` → CLEAN-04 (Plan 04). Removed at phase close.

Plus one operator-locked Path B todo moved to completed:
- `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` → CLEAN-05a (Plan 05). Moved to `.planning/todos/completed/` at phase close.

Total: 7 todos resolved in Phase 78.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 78 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §CLEAN-01 / CLEAN-02 / CLEAN-03 / CLEAN-04 / CLEAN-05 — locked success criteria; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 78: Cleanup Hygiene Phase" (lines 236-262) — phase goal + dependencies + Pairing note + 6 success criteria + plan estimate.
- `.planning/STATE.md` — v2.9 milestone state; Phase 73 closed 2026-05-11; Phase 78 ready to discuss/plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone framing + 6-phase shape; Phase 78 is the residual cleanup tail.

### Folded source todos (RESOLVED in Phase 78)

- `.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` → CLEAN-01 (Plan 01). The full rename mapping + chain semantics + back-compat alias approach + CI workflow check + cross-references to v2.8 P69 parity-gate vite-cache gotcha.
- `.planning/todos/pending/2026-05-10-redirect-unlocated-voter-to-selectors.md` → CLEAN-02 (Plan 02). Goal + approach + 4 test cases + cross-reference to located-route layout + voter-context state.
- `.planning/todos/pending/2026-05-10-d04-per-cast-reason-distribution.md` → CLEAN-03a (Plan 03).
- `.planning/todos/pending/2026-05-10-getroute-setstore-cast-cleanup.md` → CLEAN-03b (Plan 03).
- `.planning/todos/pending/2026-05-09-claude-md-svelte-warning-accepted-format.md` → CLEAN-03c (Plan 03).
- `.planning/todos/pending/2026-05-09-tighten-i18n-wrapper.md` → CLEAN-04 (Plan 04).
- `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` → CLEAN-05a (Plan 05); operator-locked Path B + scope-bounded LOC estimate.

### Phase 73 review backlog (CLEAN-05b source)

- `.planning/phases/73-determinism-baseline/73-REVIEW.md` — 13 findings (CR-02 + 7 WR + 5 IN); see scout §5a for per-finding file:line anchors + 1-line description. Annotated at phase close with per-finding resolution (per ROADMAP SC #5 acceptance g).
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — Phase 73 verdict + baseline (4 PASS_LOCKED / 19 DATA_RACE post-additions / 55 CASCADE). The post-CLEAN-05 baseline target.

### Pattern references (v2.7 P68 / v2.8 P72 — hygiene trio precedents)

- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-CONTEXT.md` — v2.7 hygiene trio shape (3 independent workstreams in 1 phase). Phase 78 scales this up to 5.
- `.planning/milestones/v2.8-phases/72-package-hygiene-trio/72-01-PLAN.md` / `72-02-PLAN.md` / `72-03-PLAN.md` — v2.8 plan-per-workstream pattern. Phase 78 follows similar shape (5 workstreams → 5-6 main plans + verification gate).
- `.planning/milestones/v2.8-phases/72-package-hygiene-trio/72-VERIFICATION.md` — v2.8 close verdict; Phase 78's `78-VERIFICATION.md` mirrors.

### Pattern references (Phase 73 / 74 / 75 / 76 / 77 — direct precedents)

- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — determinism contract Phase 78 P05 + P07 inherit.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-06 — Order B Pairing direction (E2E-08 + CLEAN-04). Phase 78 D-12 inherits.
- `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` — Phase 74 close verdict shape.
- `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` — Phase 75 close.
- `.planning/phases/76-profile-a11y/76-CONTEXT.md` — sibling Phase 76 context (Phase 78 lands in parallel).
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-CONTEXT.md` — sibling Phase 77 context (Phase 78 lands in parallel).

### `dev:* → db:*` rename surface (Plan 01)

- `package.json` (root) scripts block — current `dev:*` and `supabase:*` script definitions. Per scout §1 lines 10-17. Plan 01 modifies.
- `CLAUDE.md` §"Supabase Commands" (line 55 per scout §1) — canonical doc; synced post-rename.
- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke (2026-05-10)" — origin of the vite-cache gotcha that motivates `dev:clean` chaining.
- `.planning/todos/completed/2026-05-09-phase-69-parity-gate-followup.md` §"Pre-capture caveat" — permanent home for the vite-cache gotcha rationale.

### Voter-not-located redirect surface (Plan 02)

- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/` — located-route directory. Plan 02 inserts gate in `+layout.ts` or `+layout.server.ts`.
- `apps/frontend/src/lib/contexts/voter/voterContext.type.ts:31` — `selectedElections: Array<Election>` shape (per scout §2).
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — state-setter patterns; Plan 02 reads (not writes).
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte` — election selector; `?next=` consumer.
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte` — constituency selector; `?next=` consumer.

### supabaseDataProvider per-cast reasoning surface (Plan 03a)

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:105-191` — 13 `as Json` cast sites (per scout §3a). Plan 03a distributes per-cast `// reason:` blocks.

### getRoute structural cast surface (Plan 03b)

- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:35-44` — writable creation + structural cast + `afterNavigate` loop (per scout §3b). Plan 03b refactors.
- `apps/frontend/src/lib/contexts/app/dataContext.ts` — analog `store as { set: ... }` pattern (per scout §3b). NOT modified by Plan 03b (different file); flag in `78-VERIFICATION.md` if pattern eradication beyond `getRoute.svelte.ts` is desired in a future phase.

### CLAUDE.md anchor target (Plan 03c)

- `CLAUDE.md` §"Important Implementation Notes" — current section. Plan 03c adds new sub-section "Svelte Warning-Accepted Format".

### i18n wrapper tightening surface (Plan 04)

- `apps/frontend/src/lib/i18n/wrapper.ts` — `t()` function signature. Plan 04 tightens to `TranslationKey`.
- `apps/frontend/src/lib/types/generated/translationKey.ts` — auto-generated `TranslationKey` union.
- `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` — type generator. Planner verifies it runs in CI/local build at PLAN.md time.
- `apps/frontend/src/lib/i18n/tests/translations.test.ts` — i18n tests; Plan 04 adds `@ts-expect-error` assertion.
- `apps/frontend/src/lib/i18n/{init,overrides,index}.ts` — companion files; not modified by Plan 04 unless audit surfaces dependencies.
- `apps/frontend/src/lib/i18n/README.md` — i18n surface doc; may be updated post-tightening.

### Voter-fixture race-fix surface (Plan 05)

- `tests/tests/fixtures/voter.fixture.ts:75-92` (answeredVoterPage fixture loop + URL wait per scout §5b). Plan 05 makes ≤1 LOC change (or no change if seed override is sufficient).
- `packages/dev-seed/src/templates/e2e.ts` — Plan 05 adds `--likert-only` template override branch. Coordinates with Phase 77 if Phase 77's number question (sort 19) lands first.
- `packages/dev-seed/src/index.ts` (or CLI entry; planner finds at PLAN.md time) — Plan 05 adds CLI flag plumbing.
- `tests/playwright-results/voter-results-voter-result-57295-eded-RESULTS-01-RESULTS-02--voter-app/error-context.md` — trace evidence (Q25/40 categorical with 3 options per scout §5b); confirms the heterogeneous-type race shape.

### Phase 73 review-findings surface (Plan 06)

- `.planning/phases/73-determinism-baseline/73-REVIEW.md` — 13 findings. Per-finding file:line anchors per scout §5a:
  - CR-02: `tests/tests/specs/voter/voter-popups.spec.ts:138,220`
  - WR-01: `tests/tests/specs/variants/multi-election.spec.ts:145`
  - WR-02: `tests/tests/specs/variants/constituency.spec.ts:89-98`, `tests/tests/specs/variants/startfromcg.spec.ts:120-128`
  - WR-03: `tests/tests/specs/variants/multi-election.spec.ts:215-231`
  - WR-04: `tests/tests/setup/auth.setup.ts:29-48`
  - WR-05: `tests/tests/utils/supabaseAdminClient.ts:340-377`
  - WR-06: `tests/tests/utils/supabaseAdminClient.ts:532-547`
  - WR-07: `tests/tests/utils/supabaseAdminClient.ts:122-156`
  - IN-01: `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:28-33`
  - IN-02: `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:169`
  - IN-03: `tests/tests/specs/candidate/candidate-questions.spec.ts:34`, `tests/tests/specs/candidate/candidate-settings.spec.ts:64`, `tests/tests/specs/voter/voter-results.spec.ts:170,219,277`
  - IN-04: `tests/tests/specs/voter/voter-results.spec.ts:206-211`
  - IN-05: `tests/tests/setup/data.setup.ts:144-146`

### Verification gate tooling (Plan 07)

- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06. Plan 07 invokes for constants regen.
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator. Plan 07 bind-source for the regen.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list (Plan 07 cross-checks).

### Project-level conventions

- `CLAUDE.md` §"Development Commands" — `yarn test:e2e` invocation contract; updated by Plan 01 post-rename.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — relevant for Plan 04 i18n tests if `t` is read via context (it isn't today; flag in `78-VERIFICATION.md` if a regression surfaces).
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'`. All Plan 02 + Plan 06 changes MUST pass `yarn lint:check`.
- `tests/playwright.config.ts:43-50` — `timeout: 90000`; `fullyParallel: true`; `workers: process.env.CI ? 1 : 6`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`mergeSettings` from `@openvaa/app-shared`** — canonical for variant template overlays. Not directly used by Phase 78 plans (no new variants in Phase 78); referenced as established pattern.
- **`SupabaseAdminClient` test utilities** at `tests/tests/utils/supabaseAdminClient.ts` — modified by WR-05 + WR-06 + WR-07 in Plan 06.
- **`buildRoute({ route, locale })`** at `tests/tests/utils/buildRoute.ts` — canonical route construction; Plan 02 spec uses for navigation.
- **`afterNavigate` from SvelteKit** at `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — Plan 03b refactor surface.
- **`Readable` / `Writable` from `svelte/store`** — Plan 03b refactor surface (the structural-cast at line 41 is a workaround for `Readable` not exposing `set`).
- **`@openvaa/dev-seed` CLI** — Plan 05 extends with `--likert-only` flag.
- **`t()` translation function** at `apps/frontend/src/lib/i18n/wrapper.ts` — Plan 04 tightens signature.
- **`parseStoredImage` / `parseAnswers`** runtime guards in `supabaseDataProvider.ts` — Plan 03a distinguishes these as the rationale-source for the per-cast `// reason:` distinction.

### Established Patterns

- **Bundled hygiene phase** (v2.7 P68 + v2.8 P72): multiple independent cleanup workstreams in one phase. Phase 78 scales to 5.
- **Inline `// reason:` justification for accepted lint warnings** (v2.8 P70 Cat A): canonical shape. Plans 06 + 03a inherit verbatim.
- **3-run determinism gate** (v2.6 P64 + Phase 73 SC #4 + Phase 74 D-09 + Phase 75 D-07 + Phase 76 D-09 + Phase 77 D-09): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set is the gate. Phase 78 P07 runs this.
- **Parity-script constants regen** (Phase 73 P06 + Phase 74 P07 + Phase 75 P02b + Phase 76 P04 + Phase 77 P05): conditional re-run when pass/fail set changes. Phase 78 P07 REQUIRES regen (16-test PASS_LOCKED swap is the explicit deliverable).
- **Deprecated-alias warning pattern** for renamed scripts — Plan 01 inherits the v2.7 P68 alias-with-deprecation-warning convention (if v2.7 P68 established it; planner verifies — common shape in JS tooling).
- **PASS-WITH-DEFERRAL** (Phase 74 D-04 / Phase 75 D-03 / Phase 76 D-06): if a CLEAN-04 `t.get` audit surfaces many consumers and rewrite is infeasible, the alias is KEPT with inline `// reason:` (matches the precedent's deferral shape).

### Integration Points

- **`package.json` (root)** — Plan 01 modifies scripts block.
- **`CLAUDE.md`** — Plans 01 + 03c update.
- **CI workflows (`.github/workflows/*.yml`)** — Plan 01 may modify if `dev:*` references exist (scout §1: none found at scout time).
- **`apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts` (or `+layout.server.ts`)** — Plan 02 adds redirect gate.
- **`tests/tests/specs/voter/voter-not-located-redirect.spec.ts`** — NEW (Plan 02).
- **`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`** — Plan 03a per-cast `// reason:` distribution.
- **`apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`** — Plan 03b structural cast refactor.
- **`apps/frontend/src/lib/i18n/wrapper.ts`** — Plan 04 t() tightening.
- **`apps/frontend/src/lib/i18n/tests/translations.test.ts`** — Plan 04 adds `@ts-expect-error` assertion.
- **`packages/dev-seed/src/templates/e2e.ts`** — Plan 05 adds `--likert-only` template override.
- **`packages/dev-seed/src/index.ts` (or CLI entry)** — Plan 05 adds CLI flag plumbing.
- **`tests/tests/fixtures/voter.fixture.ts`** — Plan 05 ≤1 LOC change (if needed).
- **Multiple test files** (per Plan 06 group-edit clusters per D-14):
  - `tests/tests/specs/variants/multi-election.spec.ts` (WR-01 + WR-03)
  - `tests/tests/specs/variants/constituency.spec.ts` (WR-02 part)
  - `tests/tests/specs/variants/startfromcg.spec.ts` (WR-02 part)
  - `tests/tests/specs/voter/voter-popups.spec.ts` (CR-02)
  - `tests/tests/specs/voter/voter-results.spec.ts` (IN-03 part + IN-04)
  - `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (IN-01 + IN-02)
  - `tests/tests/specs/candidate/candidate-questions.spec.ts` (IN-03 part)
  - `tests/tests/specs/candidate/candidate-settings.spec.ts` (IN-03 part)
  - `tests/tests/setup/auth.setup.ts` (WR-04)
  - `tests/tests/setup/data.setup.ts` (IN-05)
  - `tests/tests/utils/supabaseAdminClient.ts` (WR-05 + WR-06 + WR-07)
- **`tests/scripts/diff-playwright-reports.ts`** — Plan 07 invokes for constants regen.
- **`STATE.md`** — Plan 07 updates §Blockers/Concerns (removes Phase 73 follow-up entries).
- **`.planning/todos/pending/` + `.planning/todos/completed/`** — Plan 07 moves resolved todos.

</code_context>

<specifics>
## Specific Ideas

- **`dev:clean` script shape:**
  ```json
  "dev:clean": "rm -rf apps/frontend/.svelte-kit apps/frontend/node_modules/.vite"
  ```
- **Deprecated-alias warning shape:**
  ```json
  "dev:reset": "echo '[deprecated] Use yarn db:reset; alias will be removed after v2.10' >&2 && yarn db:reset"
  ```
- **`db:reset` chained form:**
  ```json
  "db:reset": "supabase db reset && yarn dev:clean",
  "db:reset-with-data": "supabase db reset && yarn db:seed && yarn dev:clean"
  ```
- **CLEAN-02 redirect logic sketch (in `+layout.ts`):**
  ```ts
  export const load: LayoutLoad = async ({ url, depends }) => {
    const ctx = getVoterContext();
    if (!ctx.selectedElections.length || !ctx.selectedConstituencies.length) {
      const next = encodeURIComponent(url.pathname + url.search);
      // Whitelist: only voter-app routes allowed in next
      if (!/^\/[a-z]{2}\/.*/.test(url.pathname + '/')) throw redirect(303, '/');
      throw redirect(303, `/elections?next=${next}`);
    }
    return {};
  };
  ```
- **CLEAN-02 selector consumption sketch:**
  ```ts
  // In /elections submit handler:
  const next = url.searchParams.get('next');
  if (next && /^\/[a-z]{2}\/[a-zA-Z0-9\/?&=_-]*$/.test(next)) {
    goto(decodeURIComponent(next));
  } else {
    goto('/constituencies');
  }
  ```
- **CLEAN-03a per-cast `// reason:` template:**
  ```ts
  // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
  const image = parseStoredImage(data.image as Json as unknown as StoredImage | null, ...);

  // reason: JSONB → LocalizedAnswers shape; structural guard applied inside parseAnswers.
  const answers = parseAnswers(data.answers as Json as unknown as LocalizedAnswers | null);
  ```
- **CLEAN-04 t() signature change:**
  ```ts
  // Before:
  export function t(key: string, params?: Record<string, unknown>): string { ... }
  // After:
  import type { TranslationKey } from '$lib/types/generated/translationKey';
  export function t(key: TranslationKey, params?: Record<string, unknown>): string { ... }
  ```
- **CLEAN-04 @ts-expect-error assertion:**
  ```ts
  // In translations.test.ts:
  test('TranslationKey type prevents missing keys at compile-time', () => {
    // @ts-expect-error — 'definitely.not.a.real.key' is not a TranslationKey
    t('definitely.not.a.real.key');
    expect(true).toBe(true); // smoke; the real assertion is the compiler.
  });
  ```
- **CLEAN-05a `--likert-only` template override sketch:**
  ```ts
  // In packages/dev-seed/src/templates/e2e.ts:
  export function buildE2eTemplate(opts: { likertOnly?: boolean } = {}): SeedTemplate {
    const base = { /* ... existing ... */ };
    if (opts.likertOnly) {
      base.questions.fixed = base.questions.fixed.filter(q => q.type === 'singleChoiceOrdinal');
    }
    return base;
  }
  ```
- **CR-02 voter-popups fix:**
  ```ts
  // Before (at line 138 / 220):
  await page.locator(dialogSelector).waitFor({ state: 'visible' });
  // After:
  await expect(page.locator(dialogSelector)).toBeHidden({ timeout: 3000 });
  // OR for the negative case at line 220:
  await expect(page.locator(dialogSelector)).toHaveCount(0, { timeout: 3000 });
  ```
- **WR-01 swallow-trap fix:**
  ```ts
  // Before:
  const visible = await answerOption.first().isVisible().catch(() => false);
  // After:
  await answerOption.first().or(categoryStart).waitFor({ state: 'visible' });
  const reachedAnswer = await answerOption.first().isVisible();
  if (reachedAnswer) { /* answer branch */ } else { /* category branch */ }
  ```
- **Planner re-baseline at PLAN.md time:** Re-run `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=html` at Phase 78 start to confirm the Phase 75-close + Phase 76-close + Phase 77-close baselines hold. If baseline drifted, surface as a Phase 78 blocker before sweep. Mirrors Phase 74 + 75 + 76 + 77 specifics.

</specifics>

<deferred>
## Deferred Ideas

- **Removal of deprecated `dev:*` aliases** (D-02): kept for one milestone (per source todo "Plan to drop the aliases after one milestone"). Captured as a v2.10+ cleanup follow-up at Phase 78 close.
- **Heterogeneous-question-type voter-fixture coverage** (D-13): out of Phase 78 scope per operator-locked Path B. Captured for a future-milestone backlog (potentially v2.10+ dedicated specs for non-Likert opinion question types).
- **`dataContext.ts` `setStore`-equivalent structural-cast eradication** (D-09 + canonical_refs `dataContext.ts` note): Phase 78 P03b only fixes `getRoute.svelte.ts:41`. The analog pattern in `dataContext.ts` is OUT OF Phase 78 scope; flagged in `78-VERIFICATION.md` if a future phase wants to eradicate the pattern repo-wide.
- **`t.get = t` alias removal vs. retention** (D-11 PASS-WITH-DEFERRAL outcome): if many consumers exist, the alias is KEPT with inline `// reason:` block; not deleted. Captured in `78-VERIFICATION.md`.
- **`@ts-expect-error` regression-locking tests for OTHER tightened APIs** (Plan 04 specifics): the i18n test pattern can extend to other typed APIs but only if a comparable tightening lands. Out of Phase 78 scope.
- **Visual-regression coverage of i18n wrapper changes** (Plan 04 + Phase 74 E2E-08 pairing): the existing E2E-08 spec is text-based; visual-regression isn't planned. Future phase if needed.
- **CLEAN-03 sub-finding eradication beyond the named sites**: Plan 03b refactors `getRoute.svelte.ts:41` only; analogs elsewhere may exist. Out of scope; flag if surfaced.
- **CLEAN-05 review-findings beyond the 13 in `73-REVIEW.md`**: any NEW findings surfacing in Phase 74 / 75 / 76 / 77 reviews are NOT in Phase 78 scope — they belong in their respective phase close OR a future cleanup phase.
- **`58-E2E-AUDIT.md`-style addendum for `--likert-only` seed mode** (Phase 75 / 77 specifics): RECOMMENDED-but-not-blocking if Plan 05 extends `e2e.ts`. Planner's call at Plan 05 close.

### Reviewed Todos (folded vs. not folded)

**Folded into Phase 78** (per Folded Todos in `<decisions>` — 7 source todos resolved):
- `2026-05-10-rename-package-scripts-dev-to-db.md` → CLEAN-01 (Plan 01).
- `2026-05-10-redirect-unlocated-voter-to-selectors.md` → CLEAN-02 (Plan 02).
- `2026-05-10-d04-per-cast-reason-distribution.md` → CLEAN-03a (Plan 03).
- `2026-05-10-getroute-setstore-cast-cleanup.md` → CLEAN-03b (Plan 03).
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` → CLEAN-03c (Plan 03).
- `2026-05-09-tighten-i18n-wrapper.md` → CLEAN-04 (Plan 04).
- `2026-05-11-voter-fixture-heterogeneous-question-types.md` → CLEAN-05a (Plan 05). Moved to `.planning/todos/completed/` at phase close.

**Reviewed-but-not-folded** (routed elsewhere or stale):
- `2026-04-27-extend-e2e-filter-type-coverage.md` — Phase 77 / SETTINGS-01 (folded there).
- `2026-05-11-e2e-01-single-locale-runtime-override.md` — Phase 74 D-04 deferral; future runtime-override capability.
- `2026-05-12-58-e2e-audit-addendum-qspec.md` — Phase 75 follow-up.
- `2026-05-12-qspec-01-i18n-hardening.md` — Phase 75 follow-up; partially relevant to Phase 78 CLEAN-04 (i18n tightening may close the QSPEC-01 hardening gap as a side effect); planner verifies at PLAN.md time.
- `2026-05-12-qspec-02-multi-choice-categorical-variant.md` — Phase 75 follow-up; v2.10+ feature phase.
- `2026-04-25-normalise-app-shared-paradigm.md` — already resolved by v2.8 P72 SHARED-01/02. Stale; surface for removal from `.planning/todos/pending/` at v2.9 close.
- `2026-04-25-remove-mergesettings-reexports.md` — already resolved by v2.8 P72. Stale.
- `2026-04-30-alliance-tab-rendering-and-sections-config.md` — Phase 69 ALLIANCE-01 territory; already shipped. Stale.
- `2026-05-08-cleanup-65-01-bind-rationale-comments.md` — v2.8 P70 BIND-01 territory; already shipped. Stale.
- `2026-05-08-expander-state-referenced-locally.md` — v2.8 P70 Cat A territory; already shipped. Stale.
- `2026-05-08-results-layout-missing-slot-render-tag.md` — already resolved by v2.8 P70 WARN-01. Stale.
- `2026-03-28-generalize-candidate-app-to-party-app.md` — v2.10+ architectural change.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architectural investigation; future milestone.
- `2026-05-09-rewrite-parent-answer-imputation.md` — matching-package internal; future matching-focused milestone.
- `2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md` — separate milestone (deltas unscoped).
- `adapter-package-loading.md` — medium-priority; not v2.9.
- `configurable-mock-data.md` — medium-priority; v2.10+.
- `frontend-project-id-scoping.md` — v2.10 candidate (multi-tenant prep).
- `password-reset-code-method.md` — Strapi-era leftover.
- `register-page-registrationkey-method.md` — Strapi-era leftover.
- `rename-admin-writer.md` — dev-seed internal API hygiene; low priority.
- `results-url-refactor-followups.md` — v2.10 candidate (sharable URLs).
- `sql-linting-formatting.md` — CI hygiene; not v2.9.
- `2026-04-28-cleanup-nominations-table.md` — DB-01 deferred 2026-04-29.

Phase 78 explicitly RESOLVES 7 source todos (folded above) + closes the 13 Phase 73 review findings (CLEAN-05b). Source-todo removal + STATE.md cleanup happens at Plan 07.

</deferred>

---

*Phase: 78-Cleanup Hygiene Phase*
*Context gathered: 2026-05-12*
