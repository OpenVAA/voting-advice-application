# Milestones

## v2.5 Dev Data Seeding Toolkit (Shipped: 2026-04-24)

**Phases completed:** 4 phases, 34 plans, 63 tasks

**Key accomplishments:**

- Scaffolded @openvaa/dev-seed as a private Yarn 4 workspace — package manifest, tsconfig, vitest marker, and placeholder src/index.ts — linked into root devDependencies and amended REQUIREMENTS.md GEN-03 per D-25.
- One-liner:
- Zod v4 TemplateSchema + `Template` (via z.infer<>) + seeded-faker Ctx factory + `defaultRandomValidEmit` across all 9 question_type variants + AnswerEmitter seam for Phase 57 — Wave 3 generators can now import their type surface from one place.
- Eight foundation-layer generator classes (6 real + 2 pass-through per D-11) implementing the canonical D-04/D-08/D-26 pattern that Plans 05/06/07 extend.
- 5 content generators — question_categories, questions (shape-valid LIKERT/categorical choices), candidates (D-27 answerEmitter seam), app_settings (updateAppSettings routing), feedback (stub)
- Polymorphic nomination generator with client-side FK validation; emits exactly one of {candidate,organization,faction,alliance} per row, drops the legacy "emit both, strip one" workaround, and fails fast with a descriptive error when upstream refs are empty. 14 of 14 generators now in place — Wave 3 complete.
- Status:
- 14 per-generator vitest suites + shared `makeCtx` factory — 96 tests covering D-22 pure I/O, GEN-04 external_id prefix, GEN-08 ref validation, D-27 answerEmitter seam, and RESEARCH §4.13/§9 invariants.
- 4 cross-cutting test files (33 tests) covering pipeline orchestration, writer env-enforcement + call-shape, seeded determinism, and template validation — the behaviors no single generator owns. Brings the Phase 56 test file count to 18 (14 per-generator + 4 cross-cutting) and test count to 129 total.
- D-24 admin-client split complete: tests/tests/utils/supabaseAdminClient.ts is now a 486-line subclass of @openvaa/dev-seed's SupabaseAdminClient base, inheriting bulk-write methods while preserving auth/email + legacy E2E query helpers in tests/.
- Box-Muller helper (Pitfall-1-safe, D-57-11 short-circuit) + LatentHooks type barrel + Ctx/TemplateSchema `.latent?` extension — ships the Wave 1 foundation that every downstream Plan 57-02..57-07 file imports.
- Pure sub-step defaults for `LatentHooks.dimensions` (GEN-06a) and `LatentHooks.spread` (GEN-06c) — zero RNG, zero I/O, <80 lines across two files. Wave-2 parallel-safe (no overlap with Plans 03-06).
- `defaultCentroids(dims, eigenvalues, parties, ctx, tplCentroids?)` — farthest-point greedy max-min sampler with eigenvalue-scaled Gaussian pool, D-57-05 partial-anchor merge, and T-57-14/T-57-15 defense-in-depth. Ships GEN-06b / GEN-06g.
- `defaultPositions(partyIdx, centroids, spread, ctx)` — per-candidate isotropic Gaussian draw around a party centroid (`N(centroid, spread² · I)`). The ONLY sub-step that runs per-candidate (D-57-13); delegates to Plan 57-01's `boxMuller` for both the draw and the `spread=0` short-circuit.
- `defaultLoadings(questions, dims, ctx, tplLoadings?)` — the GEN-06e Wave-2 sub-step default that produces a dense `(|questions| × dims)` loading matrix keyed by question `external_id`, sampled iid from N(0, 1) via Plan 01's `boxMuller`, with D-57-07 per-question template overrides (copy-safe, wrong-length fallback), a Pitfall-3 empty-questions guard, and a Phase-56-style missing-external_id skip.
- defaultProject (GEN-06f) dispatches all 8 question_type enum variants via per-type switch: ordinal via COORDINATE inverse-normalize (D-57-08), single/multi categorical via per-choice N(0,1) argmax with ≥1 guardrail (D-57-09), non-choice types via defaultRandomValidEmit passthrough (D-57-10); per-pipeline-run choice-loading cache via WeakMap<Ctx, …>; A2 fix applied to QuestionsGenerator.LIKERT_5 so the ordinal mapping no longer needs the parseInt(id) fallback.
- The Wave 3 capstone — assembles Plans 01-06 into `latentAnswerEmitter(template)`, wires it through the pipeline via `ctx.answerEmitter ??= …`, and proves end-to-end clustering on 4 parties × 10 candidates × 12 Likert-5 questions. Measured clustering ratio at defaults (seed 42): 0.0713 (threshold < 0.5 — ~7× headroom). Measured inter-question `|r|`: 0.993 (threshold > 0.1).
- Grep-verified Playwright spec inventory — 21 spec files, 34 runtime external_id references catalogued, 17 relational triangles mapped, and 25 fixture-only items flagged for omission from the forthcoming e2e template (D-58-15).
- TMPL-07 template flag + `fanOutLocales()` utility that expands `{ en: '...' }` JSONB fields to `{ en, fi, sv, da }` using per-locale Faker instances with hardcoded iteration order (NF-04 Pitfall #1 compliance)
- Pitfall #2 (schema wording drift).
- Node-builtin parseArgs CLI that loads a template (built-in name or filesystem path), runs the Phase 56/57 pipeline, fans out locales (Plan 03), writes to Supabase via the Writer, and prints a D-58-14 aligned-table summary — exit 0 on success, exit 1 with D-58-12 actionable messages on failure
- TMPL-04 default template — 1 election × 13 constituencies × 8 invented parties × 100 candidates (non-uniformly distributed via PARTY_WEIGHTS [20,18,15,12,10,10,8,7]) × 24 questions (18 ordinal / 4 categorical / 1 multi-choice / 1 boolean) × 4 categories, with generateTranslationsForAllLocales: true. Registered in BUILT_IN_TEMPLATES for CLI resolution; paired Overrides wired through runPipeline.
- `yarn workspace @openvaa/dev-seed seed:teardown` removes every row with `external_id LIKE ${prefix}%` from the 10 allowed_collections content tables (Pitfall #6 guardrail — excludes accounts/projects/feedback/app_settings), then deterministically reclaims candidate portrait objects from Storage via Path 2 list+remove (Pitfall #5 — doesn't rely on the async pg_net trigger). Three root aliases wire `dev:seed`, `dev:seed:teardown`, and `dev:reset-with-data` (= `yarn supabase:reset && yarn dev:seed --template default` per D-58-11).
- TMPL-05 e2e template authored from 58-E2E-AUDIT.md (D-58-15 audit-driven, no mechanical JSON port) — 2 elections × 2 constituencies × 2 constituency_groups × 4 organizations × 5 question_categories × 17 questions × 14 candidates × 18 nominations × generateTranslationsForAllLocales: false (D-58-16). Registered in BUILT_IN_TEMPLATES.e2e; `--template e2e` resolves to this template. Every fixed[] entry carries an inline audit citation; 99 parity tests gate against drift.
- DX-03 integration test against live local Supabase asserts 1 election × 13 constituencies × 8 organizations × 100 candidates × 24 questions × 4 categories × 100 nominations with all 4 locale keys on elections.name, 100 portraits uploaded, and elapsed < 10_000 ms (NF-01). Determinism suite extended with 3 new cases covering Pitfall #1 locale fan-out end-to-end (NF-04).
- Total (89) matches exactly
- 1. [Rule 3 - Blocking] Plan-specified tsc verification gate referenced a nonexistent tests/ tsconfig
- Chose approach (b)
- 1. [Rule 2 — Missing critical functionality] Preserved legacy `updateAppSettings` calls in all 4 setup files
- PARITY GATE: FAIL. 22 surface regressions across 3 real root causes — candidate-questions CAND-12 comment-persistence timeout (cascades into 18 tests), runTeardown('test-') deleting zero rows in both teardowns, and a cosmetic baseline ID drift from the Plan 59-02 snake_case migration. Phase 59 remains OPEN; Plan 06 (fixture deletion) is BLOCKED until parity flips green.
- 7 legacy files deleted (3 core JSON fixtures + 3 orphan overlays + mergeDatasets.ts), D-59-09 three-gate verification green, repo now has zero references to the retired filenames outside .planning/
- Phase 59 completion gate authored — 4/4 success criteria verified (including PARITY GATE: PASS carry-forward from Plan 05 and E2E-04 dep-graph evidence), D-24 public-surface table fully enumerated from source, deps-check.txt proves zero cycles at the tests/ ↔ @openvaa/dev-seed boundary. Milestone v2.5 (Phases 56-59) closeable.

---

## v2.3 Idura FTN Auth (Shipped: 2026-03-27)

**Phases completed:** 4 phases, 8 plans, 14 tasks

**Key accomplishments:**

- Commit:
- Signicat OIDC provider wrapping existing PKCE+client_secret auth, Idura provider with working JWE claims and Phase 46 stubs, and factory dispatching on PUBLIC_IDENTITY_PROVIDER_TYPE
- RS256-signed JAR authorization requests and private_key_jwt token exchange for Idura FTN, with provider-abstracted server-side authorize and token endpoints
- Provider-agnostic /api/oidc/callback with CSRF state verification, dual-provider preregister page, and cookie-based code_verifier replacing localStorage
- Provider-agnostic identity-callback Edge Function with PROVIDER_CONFIGS mapping Signicat (birthdate) and Idura (sub) claim-based identity matching, full audit metadata in app_metadata
- Shared JWE/JWT test fixtures with jose v6 and 36 unit tests covering both Signicat and Idura provider compliance plus RSA-OAEP/RSA-OAEP-256 decryption
- JAR construction, private_key_jwt assertion, and Edge Function claim extraction tests with 35 new tests across 4 test files and extracted claimConfig.ts pure functions
- Partial

---

## v2.2 Deno Feasibility Study (Paused: 2026-03-27)

**Phases completed:** 1 of 3 phases (Phase 42), 2 plans, 5 tasks
**Timeline:** 1 day (2026-03-26)
**Requirements:** 8/14 satisfied (6 EVAL/RPT deferred)

**Key accomplishments:**

- Deno 2.7.8 validated as runtime for full OpenVAA monorepo (SvelteKit, Supabase auth, E2E tests)
- SvelteKit production build serves under Deno with zero code changes and zero Deno-specific failures
- 54/67 E2E tests pass against Deno-served frontend; Supabase PKCE auth works end-to-end
- Hybrid deno.json+package.json workspace coexists with Turborepo/Changesets/tsup
- @openvaa/core 17 tests pass via deno test with vitest compatibility shim
- Code rolled back to avoid maintenance burden; research artifacts preserved

### Known Gaps

- EVAL-01: Toolchain comparison not completed (Phase 43 paused)
- EVAL-02: Build performance benchmarks not completed (Phase 43 paused)
- EVAL-03: Security model assessment not completed (Phase 43 paused)
- RPT-01: Go/no-go recommendation not produced (Phase 44 paused)
- RPT-02: Migration/cherry-pick plan not produced (Phase 44 paused)
- RPT-03: Performance benchmarks not produced (Phase 44 paused)

---

## v2.1 E2E Test Stabilization (Shipped: 2026-03-26)

**Phases completed:** 1 combined phase (40-41), 6 tasks
**Timeline:** 4 days (2026-03-23 → 2026-03-26)
**Requirements:** 4/4 satisfied

**Key accomplishments:**

- Fixed protected layout hydration — root-caused two interacting Svelte 5 bugs (multiple $state writes in $effect .then() + $bindable props_invalid_value on undefined)
- Fixed candidate registration invite flow — session-based redirect to login after password set
- Fixed password reset — session-based flow without legacy Strapi-era code param
- Fixed feedback popup timing — PopupRenderer runes-mode wrapper component with countdown restart logic
- Fixed E2E test reliability — fresh login over stale storageState, constituency test data, popup setting isolation

---

## v2.0 Branch Integration (Shipped: 2026-03-22)

**Phases completed:** 11 phases, 42 plans
**Timeline:** 1 day (2026-03-22)

**Key accomplishments:**

- Integrated Supabase backend (17 tables, 269 pgTAP tests, 3 Edge Functions) from parallel branch
- Built frontend Supabase adapter (DataProvider, DataWriter, AdminWriter, FeedbackWriter) with 85 unit tests
- Migrated auth from Strapi JWT to Supabase cookie-based PKCE sessions with Paraglide i18n preserved
- Migrated E2E test infrastructure (SupabaseAdminClient, Mailpit email, Supabase-format datasets)
- Removed Strapi entirely (262 files, 47,524 lines deleted) with thorough codebase cleanup
- Updated CI pipeline (pgTAP job, skill-drift-check, Supabase CLI E2E) and documentation
- Integrated 15 Claude Skills files and merged planning artifacts from parallel branch

### Known Gaps

- 10 E2E tests skipped due to Svelte 5 `pushState` reactivity bug (framework-level issue)
- Phase 37 Plan 03 (FIXME/TODO audit) not formally executed
- `candidate-questions` test dataset lacks `customData.allowOpen = true`

---

## v1.4 Svelte 5 Migration (Candidate App) (Shipped: 2026-03-22)

**Phases completed:** 2 phases, 7 plans, 14 tasks

**Key accomplishments:**

- 10 candidate route files migrated to Svelte 5 runes mode: 3 layouts with snippet children, forgot-password with native onsubmit, questions page with $derived, and 5 simple page runes opt-ins
- 7 candidate auth/preregister pages migrated to Svelte 5 runes with $derived, $effect, $state, and page from $app/state
- Migrated 4 candidate route files (root layout, home, preview, settings) to Svelte 5 runes with $effect, $derived.by(), $state, and snippet children
- 4 most complex candidate route files migrated: profile ($derived.by submit routing), questions layout ($effect redirect/progress), [questionId] (D-07 derivation/effect split), protected layout (D-10 async $effect data-loading)
- Zero legacy Svelte 4 patterns across all 25 candidate route files confirmed; svelte-check reports zero TypeScript errors (120 warnings non-blocking)
- Diagnosed SES email tests as environment issue (conflicting Vite server), fixed hooks.server.ts locale bug, achieved 18/20 candidate E2E tests passing with 2 remaining Vite dev mode streaming issues
- Fixed 2 failing candidate E2E registration tests via API-based ToU workaround, cookie domain transfer, and auth rate limit mitigation -- all 20 candidate tests now pass

---

## v1.3 Svelte 5 Migration (Content) (Shipped: 2026-03-20)

**Phases completed:** 5 phases, 19 plans
**Timeline:** 3 days (2026-03-18 → 2026-03-20)
**Branch:** feat-gsd-roadmap (99 commits, 334 files, +18.2k/-4.3k lines)
**Requirements:** 20/20 satisfied

**Key accomplishments:**

- 98 shared and voter-app leaf components migrated to Svelte 5 runes mode ($props, $derived, $effect, $bindable)
- All container components converted from named slots to snippet props with 39+ route consumer updates
- All voter route pages and layouts migrated from $: reactive statements to $derived/$effect runes
- All TODO[Svelte 5] markers resolved in v1.3 scope; candidate app call sites updated for API changes
- Zero legacy Svelte 4 patterns remaining in voter app routes and shared components
- All 26 voter-app E2E tests passing after full migration with zero TypeScript errors

### Known Gaps

- **Nyquist validation:** Partial across phases 23-26 (phase 24 missing VALIDATION.md)
- **Snippet reactivity bug:** $state mutations in event handlers don't trigger re-render in {#snippet} blocks (likely Svelte 5 core issue)
- **E2E test count:** Requirement stated "92 tests" but voter-app scope is 26 tests (all passing)
- **2 pre-existing test failures:** auth-setup (Strapi timeout), voter-settings category intros (data configuration)

---

## v1.2 Svelte 5 Migration (Infrastructure) (Shipped: 2026-03-18)

**Phases completed:** 7 phases, 14 plans
**Timeline:** 3 days (2026-03-15 → 2026-03-18)
**Branch:** feat-gsd-roadmap (96 commits, 861 files, +29.5k/-6.3k lines)
**Requirements:** 31/31 satisfied

**Key accomplishments:**

- Fresh SvelteKit 2 + Svelte 5 scaffold with native TypeScript, @tailwindcss/vite replacing PostCSS
- Tailwind 4 CSS-first configuration with DaisyUI 5 and full theme token migration from JS to CSS
- Migrated i18n from sveltekit-i18n to Paraglide JS — 740 call sites, compile-time type safety, runtime override wrapper
- Full monorepo dependency bump with Yarn catalog expansion (13 → 30 entries)
- Node 22 migration with Docker, CI, and 92 E2E tests validated end-to-end
- OXC toolchain evaluated and deferred (Svelte template linting not supported)
- Migration cleanup: dead code removal and TypeScript error fixes

### Known Gaps

- **Nyquist validation:** Incomplete across phases (draft/missing VALIDATION.md files)
- **Human testing debt:** Language switching and runtime overrides need live Docker stack testing
- **Svelte 5 runes:** 13 TODO[Svelte 5] markers deferred to content migration milestone

---

## v1.1 Monorepo Refresh (Shipped: 2026-03-15)

**Phases completed:** 6 phases, 15 plans
**Timeline:** 4 days (2026-03-12 → 2026-03-15)
**Branch:** feat-gsd-roadmap (87 commits, 1,717 files, +14.7k/-3.2k lines)
**Requirements:** 23/24 satisfied (VER-04 deferred by user)

**Key accomplishments:**

- Turborepo integration with cached parallel builds and dependency-aware task orchestration
- Monorepo restructured to apps/ + packages/ convention with full Docker/CI/E2E updates
- Changesets for automated versioning, changelogs, and release PRs
- npm publishing readiness — tsup builds, metadata, fresh install verified for 4 packages (@openvaa/core, data, matching, filters)
- Yarn 4.13 with dependency catalogs and Vercel remote caching in CI
- Tech debt cleanup — 9 audit items resolved across pre-commit hooks, version strings, docs

### Known Gaps

- **VER-04**: Changeset bot for PRs — deferred by user (can be installed later via GitHub App)
- **PUB-01**: @openvaa npm org — partial (registry check passed, human must confirm access credentials)
- **Phase 14**: Trusted publishing postponed until after initial manual npm publish

---

## v1.0 E2E Testing Framework (Shipped: 2026-03-12)

**Phases completed:** 7 phases, 31 plans
**Timeline:** 11 days (2026-03-01 → 2026-03-11)
**Branch:** feat-gsd-roadmap (147 commits, 268 files, +31k/-889 lines)
**Requirements:** 56/56 satisfied

**Key accomplishments:**

- Rebuilt Playwright infrastructure: upgrade to 1.58.2, project dependencies, API data management, 53+ testId attributes
- Complete candidate app coverage: auth, registration, profile, questions, settings, app modes (15 requirements)
- Complete voter app journey: landing through results, matching verification, entity details (19 requirements)
- Configuration variant testing: multi-election, constituency, results sections via overlay datasets
- CI pipeline with GitHub Actions, HTML reports, @smoke/@voter/@candidate tagging
- Visual regression and performance benchmarks as opt-in test capabilities

---
