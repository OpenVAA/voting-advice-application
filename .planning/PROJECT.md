# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Supabase backend, and shared packages for matching algorithms, filters, and data management. The monorepo uses Turborepo for cached builds, Changesets for versioning, and publishes core packages to npm. This project covers framework evolution: modernizing infrastructure, building Claude development skills, upgrading the frontend stack, and stabilizing the Supabase backend.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Current State

**v2.6 Svelte 5 Migration Cleanup shipped 2026-04-28.** 5 phases (60-64), 18 plans, 48 tasks across 4 days (137 commits). Delivered:

- Runes-mode migration of the last two legacy layouts: root `+layout.svelte` and `candidate/(protected)/+layout.svelte` — both refactored from the hydration-unsafe `$effect + Promise.all(...).then()` pattern to a pure `$derived.by` discriminated-union validity check + a dedicated `$effect` for `$dataRoot` / `userData.init` batching. SSR microtask race eliminated; protected-layout stuck-at-`<Loading />` fixed.
- `PopupRenderer` wrapper deleted atomically — inline popup rendering via `{@const Component = item.component}` + `<Component ...>` works under Svelte 5 runes on full-page SSR+hydration; D-09 `voter-popup-hydration.spec.ts` E2E proves it.
- Voter-app question flow: BooleanQuestion renderer (`isBooleanQuestion` type guard + `OpinionQuestionInput` 2-button branch); candidate result-detail boolean match-breakdown via shared dispatch; category-selection migrated from `sessionStorageWritable` to pure `$state<Array<Id>>` with default-all-checked seeding; candidate-questions reactivity restored via push-based `$state + $effect` mirror replacing the pull-chain `$derived.by` helper-store chain (8 direct + 18 cascade tests unblocked).
- Results page consolidated: `EntityListControls` + `EntityList` merged into `EntityListWithControls`; `filterContext` (Symbol-keyed module with `$state` version counter that bridges `FilterGroup.onChange → $derived` consumers, scoped per `(electionId, entityTypePlural)` tuple); single 4-segment optional-param route `/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` with typed American-spelled param matchers; coupling-guard `+page.ts` 307-redirects malformed URLs; drawer-first DOM source order + `content-visibility: auto` for cold-deeplink paint.
- Phase 64 (Phase 62-bis) closed the parity gate: 6 silent `test.skip(true)` voter-results paths converted to `expect.poll` hard assertions (D-11); supabase adapter now reverse-fills nomination parent → children id arrays (closes the "empty parties tab" + cross-type drawer gaps); 4-layer reactivity-cascade fix (content-equality guards on `selectedElections`/`selectedConstituencies` `$state` reassignment + ref-equality guards on `appSettingsValue`/`appCustomizationValue` + `noScroll: true` on `goto()` for drawer close + `void fctx.version` subscription on `numActiveFilters`); 9-step manual smoke approved 9/9; 50+ pre-existing svelte-compiler warnings cleared across 5 categories.
- Default seed densified mid-Phase-64 to 5 constituencies × 8 parties × matrix-distributed candidates (327 total) so the parties tab and categorical-question filter axes are realistically exercisable in dev.
- Dev-seed e2e template now ships its own `app_settings.fixed[]` block — `mergeSettings` + `DeepPartial` hoisted from frontend `utils/merge.ts` to `@openvaa/app-shared` as a tested shared utility; 4 legacy `updateAppSettings(...)` calls retired (~60 lines).
- v2.6 anchor parity gate: PARITY GATE: PASS at HEAD `2c7ad2dea` (the post-v2.6 baseline regenerated in Plan 64-03). Imgproxy intermittent crash remains acknowledged infrastructure debt (out of scope; fixable with `supabase stop && supabase start`).

**Historical context (pre-v2.6):** v2.5 (2026-04-24) shipped `@openvaa/dev-seed` (14 generators, latent-factor answer model, default + e2e templates, parity gate vs SHA `f09daea34`). v2.4 (2026-03-28) shipped the full Svelte 5 rewrite (global runes mode, 167 opt-ins removed, 141 components on direct property access). v2.3 delivered Idura FTN bank auth + IdentityProvider abstraction. v2.2 paused (Deno feasibility validated, evaluation deferred).

Known infrastructure issue: local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue, fix with `supabase stop && supabase start`.

## Last Shipped: v2.9 E2E Coverage + Suite Determinism (2026-05-12)

**Delivered:** 6 phases (73-78), 32 plans, 89 tasks across 3 days. Audit verdict: `tech_debt` — 24/24 requirements satisfied (12 PASS + 12 PASS-WITH-DEFERRAL); 8 v2.10+ candidate todos filed for routed deferrals.

- **Phase 73 (DETERM-01/02/03):** Skip-modifier sweep (0 `test.skip(true, …)` remaining); 19 data-loading races investigated + fixed deterministically; 98 `playwright/*` warnings resolved via mechanical sweeps (no-networkidle / no-raw-locators) + voter/candidate-spec rewrites (no-conditional-in-test). 3-run cold-start SHA-identical at `e2e56e73fa42…`; lint-gate bumped warn→error.
- **Phase 74 (E2E-01..08):** 8 new spec surfaces in one phase. Multilocale translation surface (E2E-01); browse-without-match (E2E-02 + new `variant-low-minimum-answers` project); feedback persistence (E2E-03); 5-cell selector matrix (E2E-04 + 2 new variant projects); 4-case voter-vs-entity answer rendering (E2E-05); skip/delete/back CTA toggle (E2E-06); per-category SubMatch (E2E-07); locale switching (E2E-08).
- **Phase 75 (QSPEC-01 + QSPEC-02):** Permanent E2E user-story gates for Boolean opinion + single-choice categorical opinion (deduplicated against matching tests via unified dedup audit artifact); `walkToQuestion(page, sortOrder)` helper extracted; multi-choice deferred to follow-up todo.
- **Phase 76 (A11Y-01/02/03):** Profile validation rejection cells (image-type / image-size / name-too-long) + reload-persistence extension (displayName + bio + social link) + `@axe-core/playwright@4.11.3` integrated with `PLAYWRIGHT_A11Y` env-gated 6-route smoke. First-run baseline: 5 WCAG 2.1 AA violations across results + voter-detail-drawer (cite-and-fix routed to v2.10+).
- **Phase 77 (SETTINGS-01/02/03):** Per-toggle matrix on candidate-settings (10 wave-A cells) + filter-type matrix on voter-results (6 wave-B cells folding the filter-type-coverage source todo); `customData.allowOpen` display-side via new `variant-allowopen` project (LANDMINE-1 reframing — voter-authoring half is PRODUCT-GAP); per-question visibility + must-answer via new `variant-hidden-required` project chain (voter-hidden + candidate-required cells).
- **Phase 78 (CLEAN-01..05):** `dev:* → db:*` rename + new `dev:clean` cache wipe + `db:reset`/`db:reset-with-data` chain (8 deprecated aliases preserved through v2.10); voter-not-located `?next=` deferred-target redirect (5-cell E2E spec); 13 per-cast `// reason:` blocks + `setStore` cast elimination + CLAUDE.md Svelte warning-accepted format anchor; i18n wrapper tightened to `TranslationKey` union + `t.get` alias retired (E2E-08 Order B re-validation 5/5 PASS); `--likert-only` CLI flag added to `@openvaa/dev-seed` + 13 Phase 73 review findings + bonus CR-01 closed.

**Cross-phase contracts:** Phase 73 DATA_RACE pool (15 IMGPROXY-tied) preserved structurally through 78. Phase 75 PASS_LOCKED constants (47/15/33) preserved across 76/77/78 via three architectural-deferral decisions; constants regen DEFERRED-WITH-RATIONALE due to inherited candidate-profile cascading race (routed to v2.10+ as HIGH severity).

**Routed to v2.10+ (operator-approved):** candidate-profile cascading race (HIGH); A11Y-01 PRODUCT-GAP cells (email/url/required-empty); axe cite-and-fix (5 violations); SETTINGS-02 voter-authoring; SETTINGS-03 voter-required; FilterGroup OR-mode UI; voters-layout non-reactive topbar; constituency-filter PRODUCT-GAP (LOW).

**Out of scope (deferred to v2.10+):** Sharable URLs + multi-tenant pair (`results-url-refactor-followups` + `frontend-project-id-scoping`). Luxembourg + Danish VAA reconciliation (deltas unscoped).

## Previous: v2.8 Alliance Card + Frontend Hygiene Sweep (2026-05-10)

**Delivered:** 4 phases (69-72), 13 plans, ~37 tasks across 3 days. Closed v2.7's deferred Svelte 5 / typing / lint / packaging loose ends and finished the alliance card render path in one cohesive frontend hygiene + small-UI-feature milestone. Bundled parity gate PASSED across Phases 69+70+71.

- **Phase 69 (ALLIANCE-01):** Voter results "Alliances" tab renders working entity cards. EntityCard's "subentities" branch extended to handle `OBJECT_TYPE.AllianceNomination → OrganizationNomination` (was hard-coded `OrganizationNomination → CandidateNomination`); `cardContents.alliance` widened with `'organizations'` token; drawer-open path from alliance card works (info + member-orgs tabs; no opinions tab — alliances do not have own answers). Reconciles v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS to PASS.
- **Phase 70 (WARN-01 + BIND-01):** Svelte 5 / SSR / a11y warning sweep across three categories — Cat A (`state_referenced_locally`, 9 sites) rewritten via Option A inline ignore-with-rationale preamble; Cat B (1 missing `{@render children()}` site in `WithPolling.svelte`) fixed via 3-part Snippet patch; Cat C (1 a11y `<label>` interactive-target) fixed via `<button type="button">`. Plus: 92 inline `// bind: keep —` rationale comments stripped from `apps/frontend/src/lib/**/*.svelte` (BIND-01 SC-4 grep gate satisfied 26 → 0 across 24 files). Workspace svelte-check ends at 0 warnings.
- **Phase 71 (TYPING-01):** 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C resolved. 67 `@typescript-eslint/no-explicit-any` errors fixed via real types (preferred) or `unknown` + runtime narrow + inline `// reason:` D-04 anchor (introduced fresh in this phase); 13 `naming-convention` + 11 `func-style` + 4 long-tail also resolved. Frontend lint baseline now 0 errors / 98 warnings (warnings out of scope — tracked as `2026-05-10-tests-playwright-hygiene-sweep` for v2.9 Phase A). Svelte-check baseline 159 errors (≤ 160 gate; net −1 incidental tightening). Verification: PASS-WITH-DEFERRAL (Playwright manual smoke deferred to bundled parity gate that subsequently PASSED).
- **Phase 72 (SHARED-01 + SHARED-02 + LINT-01):** `@openvaa/app-shared` normalised to match `core`/`data`/`matching`/`filters` paradigm (flat `src/index.ts` barrel, `tsconfig.json` extends shared-config, `tsup.config.ts`, no `.js` extensions on TS-internal relative imports — packages/README.md captures the canonical paradigm). `mergeSettings` re-export shim in `apps/frontend/src/lib/utils/merge.ts` retired (3 consumers re-pointed to `@openvaa/app-shared`). `@openvaa/supabase` lint-script disambiguated (`yarn supabase:lint` → `yarn supabase:lint:sql`; root `yarn lint:check` no longer invokes SQL linter). Same shape as v2.7 Phase 68 Dev-Tooling Trio.
- **Audit verdict:** parity gate PASS across the bundled smoke; all 7 v2.8 requirements wired end-to-end; `yarn build` + `yarn test:unit` + workspace svelte-check + frontend lint:check all green; v2.6 parity baseline `67p/1f/34c` holds at HEAD. Post-fix cleanup batches landed for Phase 69 + Phase 71. Carry-forward debt: 19 data-loading race E2E failures (PROJECT.md Future), 98 `playwright/*` warnings in `tests/`, `test.skip(true, …)` modifiers across the suite — all anchored as v2.9's "determinism first" phase.

**Out of scope (deferred to v2.9+):** E2E coverage workstream (now the v2.9 anchor — see Current Milestone above). Sharable URLs + multi-tenant pair (`results-url-refactor-followups` + `frontend-project-id-scoping`) deferred to v2.10. Luxembourg + Danish VAA reconciliation (`2026-05-10-incorporate-luxembourg-and-danish-vaa-changes`) deferred to a separate milestone; deltas unscoped.

## Current Milestone: v2.10 Test Reliability + A11y Compliance

**Goal:** Restore Playwright suite parity-regen capability and reach WCAG 2.1 AA on the 2 axe-baselined routes by closing v2.9's HIGH/MEDIUM a11y + test-determinism deferrals **+ close the 2 test-reliability surfaces that Phase 79's DETERM-04 fix exposed (image-upload cascade + voter-app flakes)**.

**Target features (5-item scope; original 3 carry-forwards from v2.9 + 2 follow-ups added 2026-05-13 post-Phase-79-close):**

- ✓ **HIGH — Candidate-profile cascading race fix + parity-script regen.** Phase 79 SHIPPED 2026-05-13: URL-predicate fix at `candidate-profile.spec.ts:51` (RCA verdict — not the originally-hypothesized frontend race) + v2.10 anchor locked at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE; passed-with-deferral on SC #1 partial).
- **MEDIUM — A11Y axe cite-and-fix.** 5 first-run WCAG 2.1 AA violations across `/results` + voter-detail-drawer routes (3 distinct rule-IDs; 2 of 3 are shared-component fixes that resolve in both routes simultaneously). Phase 80.
- **MEDIUM — A11Y-01 PRODUCT-GAP cells.** Candidate profile field-validation negative paths: email-format + url-format + name-too-short / required-empty rejection assertions. Phases 81+82.
- **MEDIUM — Image-upload cascade resolution.** `should upload a profile image (CAND-03)` `waitForEvent('filechooser')` TIMEOUT cascade-skips 5 downstream tests in candidate-profile.spec.ts's serial describe block. Pre-existing failure, masked by the DETERM-04 registration cascade prior to Phase 79; surfaced in the post-fix baseline. Phase 83 (DETERM-06) — mitigations from todo §"Recommended approach": selector-drift fix / pre-filechooser delay / imgproxy re-enable.
- **MEDIUM — Voter-app flake stabilization.** `voter-matching > should show worst match candidate as last result` + `voter-detail > should open party detail drawer` flake ~33% across cold-start runs (verified across Phase 79's 6 captures). Both are in the v2.10 PASS_LOCKED roster (NOT IMGPROXY-tied; cannot be added to DATA_RACE pool per Phase 73 D-09 binding). Phase 83 (DETERM-07) — fix / deterministic-skip / FAILURE-CLASS routing decided at discuss-phase.

**Key context for v2.10:**

- Phase numbering continues from v2.9 last phase (78) → v2.10 starts at **Phase 79** and now extends through **Phase 83**.
- ✓ **Cross-cutting contract DELIVERED:** The cascading-race fix and the parity-script constants regen both landed in Phase 79. The v2.10 verification anchor is locked at SHA `ff0334f856…`; subsequent phases verify against it.
- **Phase 83 added 2026-05-13** post-Phase-79-close to absorb the 2 follow-up todos (`2026-05-13-candidate-profile-image-upload-cascade.md` + `2026-05-13-voter-matching-detail-flakes.md`) as in-milestone gap closure rather than re-deferring to v2.11+.
- **Re-deferred to v2.11+** (need new UI/architecture work, not in v2.10 scope): SETTINGS-02 voter `answer.info` authoring; SETTINGS-03 voter `customData.required` enforcement; FilterGroup OR-mode UI; voters-layout non-reactive topbar/popup; constituency-filter PRODUCT-GAP.
- **Stale-but-resolved todos cleared at milestone start:** Expander state-referenced-locally + results-layout missing slot — both already landed in v2.8 Phase 70 via `// svelte-ignore` + `// reason:` accept-with-rationale (moved pending → done).
- Deprecated `dev:*` aliases scheduled for removal at v2.10 close (per Phase 78 Plan 01 SUMMARY).

## Requirements

### Validated

- ✓ SvelteKit 2 frontend with voter and candidate apps — existing
- ✓ Strapi v5 backend with Postgres — existing
- ✓ Matching algorithm package with multiple distance metrics — existing
- ✓ Entity filtering package — existing
- ✓ Shared data model package — existing
- ✓ App-shared settings and utilities package — existing
- ✓ Docker-based development environment — existing
- ✓ Internationalization support — existing
- ✓ Admin tools plugin (import/delete data) — existing
- ✓ Extensible, modular E2E testing framework with full coverage — v1.0
- ✓ Turborepo for cached, dependency-aware parallel builds — v1.1
- ✓ apps/ + packages/ monorepo directory convention — v1.1
- ✓ Changesets for automated versioning, changelogs, and release PRs — v1.1
- ✓ npm publishing readiness for core, data, matching, filters (tsup builds, metadata, verified) — v1.1
- ✓ Yarn 4.13 with dependency catalogs — v1.1
- ✓ Vercel remote caching in CI — v1.1
- ✓ Per-workspace lint/typecheck via Turborepo — v1.1
- ✓ Svelte 5 frontend infrastructure (fresh scaffold, Tailwind 4, DaisyUI 5) — v1.2
- ✓ Full dependency bump across monorepo (Node 22, Yarn catalog 30 entries) — v1.2
- ✓ Paraglide JS i18n with compile-time type safety and runtime override wrapper — v1.2
- ✓ OXC toolchain evaluation (deferred — Svelte template linting not supported) — v1.2
- ✓ Svelte 5 content migration — voter app and shared components fully runes-idiomatic — v1.3
- ✓ All leaf/container/route components use $props(), $derived, $effect, $bindable, snippet props — v1.3
- ✓ Zero legacy Svelte 4 patterns in voter app (no $:, on:event, <slot>, createEventDispatcher) — v1.3
- ✓ 26 voter-app E2E tests passing after migration — v1.3
- ✓ Svelte 5 candidate app migration — all 25 route files runes-idiomatic — v1.4
- ✓ Zero legacy Svelte 4 patterns in candidate app — v1.4
- ✓ Zero TypeScript errors in candidate app — v1.4
- ✓ All candidate-app E2E tests passing (20 tests across 5 files) — v1.4
- ✓ Supabase backend integrated (17 tables, 269 pgTAP tests, 3 Edge Functions) — v2.0
- ✓ Frontend Supabase adapter (DataProvider, DataWriter, AdminWriter, FeedbackWriter) — v2.0
- ✓ Auth migrated to Supabase cookie-based PKCE sessions — v2.0
- ✓ E2E tests migrated to SupabaseAdminClient and Mailpit — v2.0
- ✓ Schema reorganization verified (numbered files, p_ prefixes, public. qualifiers) — v2.0
- ✓ Strapi fully removed (262 files, 47,524 lines) — v2.0
- ✓ CI/CD updated (pgTAP, skill-drift-check, Supabase CLI E2E) — v2.0
- ✓ Claude Skills integrated (data, matching, filters, database) — v2.0
- ✓ Planning documents merged from parallel branch — v2.0
- ✓ Candidate registration email flow end-to-end (invite, Mailpit, session) — v2.1
- ✓ Candidate password reset email flow end-to-end (request, Mailpit, new password) — v2.1
- ✓ Fresh candidate registration with protected route access — v2.1
- ✓ Feedback popup reliable timing on results page — v2.1
- ✓ Provider abstraction layer (IdentityProvider interface, configurable claim mapping) — v2.3
- ✓ Idura FTN bank auth (server-side JAR, private_key_jwt token exchange) — v2.3
- ✓ Provider-agnostic /api/oidc/{authorize,token,callback} routes — v2.3
- ✓ identity-callback Edge Function with configurable identityMatchProp/extractClaims — v2.3
- ✓ Signicat backward compatibility (PKCE + client_secret flow unchanged) — v2.3
- ✓ 71 new unit tests for provider abstraction, JWE, JAR, Edge Function claims — v2.3
- ✓ Bank-auth E2E tests with @bank-auth tag (disabled by default) — v2.3
- ✓ Context system rewrite with Svelte 5 native reactivity ($state/$derived) — v2.4
- ✓ All remaining Svelte 4 route files migrated to runes (admin app + root layout) — v2.4
- ✓ Global runes mode enabled (compilerOptions.runes: true + dynamicCompileOptions for node_modules) — v2.4
- ✓ All 167 per-file runes opt-ins removed — v2.4
- ✓ 141 consumer components migrated to direct property access — v2.4
- ✓ @openvaa/dev-tools workspace with keygen + pem-to-jwk CLIs — post-v2.4
- ✓ Modular per-entity generator architecture (`@openvaa/dev-seed/src/generators/`) — v2.5
- ✓ Unified template model with smart defaults and mixed hand-authored + synthetic rows — v2.5
- ✓ Built-in default template and E2E template; custom templates loadable from any path — v2.5
- ✓ `generateTranslationsForAllLocales` flag honoring `staticSettings.supportedLocales` — v2.5
- ✓ CLI surface — `seed`, `seed:teardown`, root-level `yarn dev:reset-with-data` — v2.5
- ✓ `tests/seed-test-data.ts` rewritten on top of the new generator; legacy JSON fixtures retired — v2.5
- ✓ Matching-realistic synthetic candidate positions (party-axis clustering via latent-factor pipeline) — v2.5
- ✓ Optional deterministic `seed: number` for reproducible faker output — v2.5
- ✓ Root `+layout.svelte` migrated to Svelte 5 runes mode — `$props`, `$derived.by` discriminated-union validity, `{@render children()}`; no `export let`, no `$:`, no `<slot />` — v2.6
- ✓ Candidate `(protected)/+layout.svelte` renders post-hydration on full page loads — `Promise.all().then()` + `await tick()` pattern replaced with `$derived.by` 4-way `layoutState` + dedicated `$effect` for batched store mutations — v2.6
- ✓ `PopupRenderer` workaround removed — inline popup rendering via `{@const Component = ...}` + `<Component ...>` works under runes — v2.6
- ✓ Boolean-type questions render binary answer control in voter flow + candidate result-detail match-breakdown — v2.6
- ✓ Category-selection screen has default-all-checked seeding + reactive question-count derivation — v2.6
- ✓ Candidate-app question-list reactivity restored — testIds visible within Playwright timeout; 6 direct + 18 cascade tests pass — v2.6
- ✓ `EntityListControls` + `EntityList` merged into `EntityListWithControls`; infinite `$effect + filterGroup.onChange` loop replaced with `$derived` over a `$state` version counter — v2.6
- ✓ Voter results-page filters re-enabled; shared `filterContext` scoped per `(electionId, entityTypePlural)` tuple, exposed via `voterContext` getter for future LLM-chat integration — v2.6
- ✓ Empty `results/+page.svelte` removed; results list and entity-detail drawer share a 4-segment optional-param route with typed American-spelled param matchers; coupling-guard `+page.ts` 307-redirects malformed URLs; drawer-first paint via DOM source order + `content-visibility: auto` — v2.6
- ✓ E2E carry-forward pool measurably reduced from post-v2.5 baseline; `e2e` template ships `app_settings.fixed[]`; 4 legacy `updateAppSettings(...)` calls deleted; `mergeSettings` + `DeepPartial` hoisted to `@openvaa/app-shared` — v2.6
- ✓ 92 `bind:*` directives audited and justified across `apps/frontend/src/lib/**/*.svelte`; 2 `{#key}` annotations + 1 Pattern B keyed each + 6 reactive-accessor destructure rewrites; CLAUDE.md "Context Destructuring Rule (Svelte 5)" subsection codifies the v2.6 P61-03 hazard structurally — v2.7 (Phase 65)
- ✓ `supabaseDataProvider.ts` zero `as unknown as { ... }` casts over the v2.6 P64 reverse-fill pass; `InternalFlatNomination` defined once in a sibling `.types.ts` file and reused across the parent/child mapping loops — v2.7 (Phase 66)
- ✓ Default seed ships 2 alliances (Progressive Front + Conservative Bloc, invented neutral names) + 10 alliance-noms + 30/10 org-nom parent split; the v2.6 P64 supabase-adapter alliance reverse-fill of `organizationNominationIds` is empirically exercised on every dev-seed run; 3 cross-cutting bugs surfaced + fixed during smoke (AllianceNomination dual-emission constructor, partial seed `results` block wipe, missing optional-chain on cardContents reads) — v2.7 (Phase 67)
- ✓ Frontend autoreload composed via Turborepo `--watch` + Vite HMR over `dist/` (existing `yarn watch:shared`) + `vite-plugin-restart` for `.env`; root `yarn dev` script launches package watcher + Vite dev concurrently; `apps/frontend/README.md` Dev workflow section documents the contract — v2.7 (Phase 68 / DEVTOOLS-01)
- ✓ ESLint gains `eslint-plugin-unused-imports` + `no-restricted-imports` `$lib`-preference rule + paraglide `ignores`; new rules surface 0 violations; lint:fix auto-sweep applied. _(95 pre-existing apps/frontend errors deferred per user-approved Option C — v2.8 candidate)_ — v2.7 (Phase 68 / DEVTOOLS-02)
- ✓ Deno IDE scope corrected to `apps/supabase/supabase/functions` (doubled `supabase/`; CONTEXT.md D-03 had wrong path); 5 wrong package entries + phantom `_deno_shims/` removed; `.vscode/settings.json` tracked via `.gitignore` carve-out — v2.7 (Phase 68 / DEVTOOLS-03)
- ✓ Voter results "Alliances" tab renders working entity cards via EntityCard subentities-branch widening to handle `OBJECT_TYPE.AllianceNomination → OrganizationNomination`; `cardContents.alliance` widened with `'organizations'` token; alliance-detail drawer renders info + member-orgs tabs (no opinions tab — alliances do not own answers); reconciles v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS to PASS — v2.8 (Phase 69 / ALLIANCE-01)
- ✓ Svelte 5 / SSR / a11y warning sweep across three categories — Cat A (`state_referenced_locally`, 9 sites) Option A inline ignore-with-rationale preamble; Cat B (1 missing `{@render children()}` in `WithPolling.svelte`) 3-part Snippet patch; Cat C (1 a11y `<label>` interactive-target) `<button type="button">` replacement; workspace svelte-check ends at 0 warnings — v2.8 (Phase 70 / WARN-01)
- ✓ 92 inline `// bind: keep —` rationale comments stripped from `apps/frontend/src/lib/**/*.svelte`; `bind:*` directives left untouched; rationale captured permanently in CLAUDE.md "Context Destructuring Rule (Svelte 5)" section; grep gate `git grep -nE "// bind: (keep\|ok\|justified)"` 26 → 0 across 24 files — v2.8 (Phase 70 / BIND-01)
- ✓ Frontend strict-typing cleanup — 95 pre-existing `apps/frontend/` ESLint errors (deferred under v2.7 Phase 68 Option C: 67 `no-explicit-any`, 13 `naming-convention`, 11 `func-style`, 4 long-tail) all resolved via real types or `unknown` + runtime narrow + inline `// reason:` D-04 anchor; frontend lint baseline 0 errors / 98 warnings (warnings → v2.9 Phase A); svelte-check 159 errors (≤ 160 gate, net −1 incidental tightening) — v2.8 (Phase 71 / TYPING-01)
- ✓ `@openvaa/app-shared` normalised to canonical core/data/matching/filters paradigm — flat `src/index.ts` barrel, `tsconfig.json` extends shared-config, `tsup.config.ts`, no `.js` extensions on TS-internal relative imports; `packages/README.md` captures the canonical paradigm anchor — v2.8 (Phase 72 / SHARED-01)
- ✓ `mergeSettings` re-export shim in `apps/frontend/src/lib/utils/merge.ts` retired; consumers re-pointed to `@openvaa/app-shared` directly; `git grep -nE "from ['\"]\\$lib/utils/merge['\"]"` returns 0 matches — v2.8 (Phase 72 / SHARED-02)
- ✓ `@openvaa/supabase` lint-script disambiguated — `yarn supabase:lint` → `yarn supabase:lint:sql`; root `yarn lint:check` no longer invokes SQL linter; turbo task fan-out unaffected (script-existence-driven); CLAUDE.md Supabase Commands updated — v2.8 (Phase 72 / LINT-01)

- ✓ Determinism baseline — 0 `test.skip(true, …)` modifiers + 19 data-loading races resolved + 98 `playwright/*` warnings cleared; 3-run cold-start SHA-identical (`e2e56e73fa42…`) — v2.9 (Phase 73 / DETERM-01..03)
- ✓ High-leverage E2E coverage — multilocale translation surface, browse-without-match, feedback persistence, 5-cell selector matrix, 4-case voter-vs-entity answer rendering, skip/delete/back CTA toggle, per-category SubMatch, locale switching; +3 new Playwright variant projects — v2.9 (Phase 74 / E2E-01..08)
- ✓ Question-rendering specs — focused E2E user-story gates for Boolean opinion (QSPEC-01) + single-choice categorical opinion (QSPEC-02), deduplicated against matching tests via unified dedup audit; `walkToQuestion` helper extracted — v2.9 (Phase 75)
- ✓ Profile validation rejection paths + reload-persistence extension + `@axe-core/playwright@4.11.3` 6-route WCAG 2.1 AA smoke wired with `PLAYWRIGHT_A11Y` env-gate; first-run baseline: 5 violations across 2 routes (cite-and-fix → v2.10+) — v2.9 (Phase 76 / A11Y-01..03)
- ✓ `appSettings` / `appCustomization` per-toggle matrix — 10 wave-A cells + 6 wave-B filter-type cells folding the filter-type-coverage source todo; `customData.allowOpen` display-side coverage (LANDMINE-1 reframing — voter-authoring PRODUCT-GAP routed to v2.10+); per-question visibility + must-answer (voter-hidden + candidate-required cells; voter-required PRODUCT-GAP routed to v2.10+) — v2.9 (Phase 77 / SETTINGS-01..03)
- ✓ Cleanup hygiene bundle — `dev:* → db:*` rename + new `dev:clean` cache wipe + `db:reset`/`db:reset-with-data` chain (8 deprecated aliases preserved through v2.10); voter-not-located `?next=` redirect with URL-whitelist guard + 5-cell E2E spec; 13 per-cast `// reason:` blocks + `setStore` cast elimination + CLAUDE.md Svelte warning-accepted format anchor; i18n wrapper tightened to `TranslationKey` union; `--likert-only` CLI flag added to `@openvaa/dev-seed` (Path B voter-fixture race resolution); 14 Phase 73 review findings closed — v2.9 (Phase 78 / CLEAN-01..05)

### Active

**v2.10 (Test Reliability + A11y Compliance) — in progress.** Phase 79 SHIPPED 2026-05-13 (DETERM-04 + DETERM-05 passed-with-deferral; v2.10 anchor locked at SHA `ff0334f856…`). 4 phases remaining: Phase 80 A11Y-04 axe cite-and-fix; Phase 81 A11Y-05+06 email+url cells; Phase 82 A11Y-07 required-empty cell; Phase 83 DETERM-06+07 test-reliability follow-ups (image-upload cascade + voter-app flakes, added 2026-05-13). See "Current Milestone" above for the 5-item scope. REQ-IDs land via REQUIREMENTS.md.

**Pending todos** (carried forward, lower priority — not yet on a milestone roadmap):
- Generalize candidate app to support parties as first-class registrants
- Investigate migrating candidate answer store (architectural)
- `password-reset-code-method` + `register-page-registrationkey-method` (Strapi-era leftovers; both medium priority)
- `configurable-mock-data` (Supabase replacement for `GENERATE_MOCK_DATA_ON_INITIALISE`)
- `adapter-package-loading` (tsconfig-based importable adapter)
- `2026-05-09-rewrite-parent-answer-imputation` (matching-package internal — future matching-focused milestone)
- `rename-admin-writer` (dev-seed internal API hygiene)
- `sql-linting-formatting` (CI hygiene)

### Future
- [ ] Claude Skills: architect, components, LLM (deferred to post-Svelte 5 stabilization)
- [ ] Deno full evaluation and go/no-go report (runtime validated in v2.2, evaluation/report deferred)
- [ ] Admin app migration (frontend Admin App)
- [ ] Merge app_settings and app_customization tables
- [ ] WithAuth interface refactoring
- [ ] TSConfig-based importable adapter loading
- [ ] Automated security and secrets scanning and testing
- [ ] Trusted publishing for npm (OIDC, deferred until after initial manual publish)
- [ ] Changeset bot for PR reminders (deferred from v1.1)
- [ ] SQL linting and formatting tooling
- [ ] Svelte 5 migration cleanup — resolve 19 pre-existing data-loading race E2E failures; retire toStore/fromStore bridges
- [ ] Settings & configuration paradigm reorganization
- [ ] Generalize candidate app to support parties (organizations) as first-class registrants
- [ ] AdminWriter rename (naming cleanup, carried from v2.4)

### Out of Scope

- Mobile native apps — web-first approach
- Package manager migration (pnpm) — high risk, low reward with Turborepo on Yarn 4
- Nx adoption — overkill for 9-package monorepo
- Lerna adoption — legacy tool, Nx wrapper
- semantic-release — poor monorepo support vs explicit-intent Changesets
- Publishing all packages — only core/data/matching/filters are general-purpose
- oxlint migration — Svelte template linting not supported; re-evaluate when Svelte support ships

## Context

The project is a mature monorepo used for real election deployments. As of v2.6:

- **Codebase:** 195 plans + 6 tasks completed across 11 shipped milestones (32 days, 2026-03-01 → 2026-04-28); v2.6 alone added ~5,400 LOC across 146 frontend/test files in 4 days (137 commits).
- **Tech stack:** SvelteKit 2, Svelte 5 (fully runes-idiomatic on every layout, including the post-v2.6 root + candidate-protected pair), Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Supabase, Postgres, Yarn 4.13, Turborepo 2.8, Changesets
- **Backend:** Supabase with 17-table schema, 269 pgTAP tests, 79 RLS policies, 3 Edge Functions (identity-callback, invite-candidate, send-email); supabase adapter now reverse-fills nomination parent → children id arrays in-memory before returning to the data model
- **Auth:** Provider abstraction layer supporting Signicat (PKCE + client_secret) and Idura (JAR + private_key_jwt) via env config
- **Build system:** Turborepo with content-based caching, tsup for publishable packages, @tailwindcss/vite
- **Testing:** Playwright E2E (post-v2.6 baseline regenerated at HEAD `2c7ad2dea`; PARITY GATE: PASS), Vitest unit tests (60-case `mergeSettings` + filterContext + EntityListWithControls coverage added in v2.6), pgTAP database tests, bank-auth E2E (opt-in); `@openvaa/dev-seed` powers all data via templates (default + e2e + variant overlays)
- **CI:** GitHub Actions with pgTAP, E2E via supabase CLI, skill-drift-check, Turborepo remote caching
- **Publishing:** 4 packages (@openvaa/core, data, matching, filters) ready for npm with ESM output; trusted publishing (OIDC) deferred until after initial manual publish
- **Deno validated:** Runtime works (SvelteKit, auth, E2E), evaluation deferred — research in archived `.planning/milestones/sb-v3.0-ROADMAP.md` and v2.2 records
- **Known issues:** Local imgproxy Docker container crashes intermittently (502 on image upload — fix with `supabase stop && supabase start`, not a code issue); 165 pre-existing intra-package circular deps in `@openvaa/data` / `matching` / `filters` (the `internal.ts` barrel pattern) — explicitly out of v2.6 scope, deferred to a dedicated structural refactor milestone

## Constraints

- **Tech stack**: SvelteKit 2, Svelte 5, Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Supabase, Postgres, Yarn 4.13, Turborepo 2.8
- **Publishing**: @openvaa/core, data, matching, filters publishable to npm
- **Testing**: Playwright 1.58.2 for E2E, Vitest for unit tests, pgTAP for Supabase database
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Strapi removed**: Backend is Supabase-only as of v2.0

## Milestones

Each major initiative is a separate milestone, executed in order:

1. ~~**E2E Testing Framework**~~ — Shipped v1.0 (2026-03-12)
2. ~~**Monorepo Refresh**~~ — Shipped v1.1 (2026-03-15)
3. ~~**Svelte 5 Migration (Infrastructure)**~~ — Shipped v1.2 (2026-03-18)
4. ~~**Svelte 5 Migration (Content — Voter App)**~~ — Shipped v1.3 (2026-03-20)
5. ~~**Svelte 5 Migration (Content — Candidate App)**~~ — Shipped v1.4 (2026-03-22)
6. ~~**Branch Integration**~~ — Shipped v2.0 (2026-03-22)
7. ~~**E2E Test Stabilization**~~ — Shipped v2.1 (2026-03-26)
8. ~~**Deno Feasibility Study**~~ — Paused v2.2 (2026-03-27, feasibility validated, evaluation deferred)
9. ~~**Idura FTN Auth**~~ — Shipped v2.3 (2026-03-27)
10. ~~**Full Svelte 5 Rewrite**~~ — Shipped v2.4 (2026-03-28)
11. ~~**Dev Data Seeding Toolkit**~~ — Shipped v2.5 (2026-04-24)
12. ~~**Svelte 5 Migration Cleanup**~~ — Shipped v2.6 (2026-04-28). Runes migration for root + candidate-protected layouts; protected-layout hydration bug fixed via `$derived.by` discriminated-union pattern; `EntityListControls` infinite-loop resolved via `$state` version-counter bridge; voter-app question/results surfaces fully reactive; `PopupRenderer` removed; e2e template ships `app_settings.fixed[]`
13. ~~**Svelte 5 Polish + Supabase-Adapter Loose Ends**~~ — Shipped v2.7 (2026-05-08). 4 phases (65-68), 9 plans, 28 tasks. SVELTE5 audit sweeps (92 `bind:*` annotations, `{#key}` justifications, context-destructuring rule); ADAPTER-01 type cleanup (zero `as unknown as` casts, `InternalFlatNomination` intermediate); SEED-01 default-seed alliances exercising the v2.6 P64 reverse-fill (PASS-WITH-CONCERNS — alliance card render deferred); DEVTOOLS trio (autoreload via Turborepo `--watch` + Vite HMR + `vite-plugin-restart` + `concurrently`-composed `yarn dev`; ESLint gains `unused-imports` + `$lib`-preference; Deno IDE scope corrected to doubled `apps/supabase/supabase/functions`). 95 pre-existing frontend lint errors deferred per user-approved Option C
14. ~~**Alliance Card + Frontend Hygiene Sweep**~~ — Shipped v2.8 (2026-05-10). 4 phases (69-72), 13 plans, ~37 tasks across 3 days. Phase 69 ALLIANCE-01 (alliance card Lane A — EntityCard subentities widening + cardContents `'organizations'` token + drawer info+orgs tabs); Phase 70 WARN-01 + BIND-01 (Svelte 5 / SSR / a11y warning sweep — 9 Cat A + 1 Cat B + 1 Cat C sites cleared; 92 `bind:*` rationale comments stripped; svelte-check 0 warnings); Phase 71 TYPING-01 (95 pre-existing ESLint errors resolved via real types or `unknown` + runtime narrow + D-04 `// reason:` anchors; frontend lint baseline 0 errors / 98 warnings); Phase 72 SHARED-01/02 + LINT-01 (`@openvaa/app-shared` canonical-paradigm normalisation + `mergeSettings` shim retire + `supabase:lint` → `supabase:lint:sql` disambiguation). Bundled parity gate PASS.
15. **E2E Coverage + Suite Determinism** (v2.9 — current) — Determinism baseline (clear `test.skip(true, …)` + resolve 19 data-loading race failures + sweep 98 `playwright/*` warnings); high-leverage coverage (translation surface, browse-without-match, election/constituency matrix, voter answer in entity details, skip/delete/back, locale switching); question-rendering specs (Boolean + categorical); profile + a11y (validation rejection paths + reload-persistence + `@axe-core/playwright` WCAG 2.1 AA smoke); `appSettings`/`appCustomization` toggle matrix; cleanup hygiene phase (`dev:* → db:*` rename + voter-not-located redirect + post-71 carry-forward trio + `tighten-i18n-wrapper`). Anchored on `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md`.
16. **Sharable URLs + Multi-tenant** (v2.10 candidate) — Shorter IDs / multi-election URL schema (`results-url-refactor-followups`) + per-instance project scoping in frontend data provider (`frontend-project-id-scoping`). Pair as one milestone — multi-tenant prep wants typing cleanup landing first (now done in v2.8 P71).
17. **Luxembourg + Danish VAA Reconciliation** (future) — Inventory deltas between downstream forks and upstream OpenVAA, classify each delta, and merge or reject explicitly. Source: `.planning/todos/pending/2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md`.
18. **Claude Skills (remaining)** — Architect, components, LLM skills
19. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App
20. **Security Scanning** — Automated security, secrets scanning, and testing
21. **Settings & Configuration Reorg** — Rationalize the split between StaticSettings, DynamicSettings, env vars, and the `app_settings` / `app_customization` tables; unify the customization paradigm across voter, candidate, and admin apps
22. **Parties in Candidate App** — Generalize the candidate-app preregistration and profile flows so party organizations (not just individual candidates) can onboard, manage members, and maintain their public-facing data

## Key Decisions

| Decision                          | Rationale                                                                    | Outcome     |
| --------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| Separate milestones per H2        | Each initiative is independent enough to plan and complete separately         | ✓ Good      |
| E2E first                         | Need test coverage before making breaking changes in migrations              | ✓ Good      |
| Playwright-driven data management | Direct API calls to Admin Tools (not UI automation)                          | ✓ Good      |
| Test IDs over text selectors      | More resilient to content/i18n changes, 53+ testIds across voter/candidate   | ✓ Good      |
| User stories as test basis        | Mine existing tests and docs for comprehensive coverage                      | ✓ Good      |
| Infrastructure before coverage    | Phase 1 foundations before any spec files written                            | ✓ Good      |
| Base+overlay dataset composition  | Shared default dataset with variant overlays for multi-config testing        | ✓ Good      |
| Env-gated visual/perf tests       | PLAYWRIGHT_VISUAL and PLAYWRIGHT_PERF flags to exclude from default runs     | ✓ Good      |
| Turborepo over alternatives       | Layers on Yarn 4 without replacement; Deno impact evaluated and acceptable   | ✓ Good      |
| apps/ + packages/ restructure     | Industry convention, cleaner boundaries, required for Turborepo conventions  | ✓ Good      |
| Changesets over semantic-release   | Explicit intent vs commit-message parsing; better monorepo support           | ✓ Good      |
| tsup for publishable packages     | Replaces tsc + tsc-esm-fix; clean ESM+CJS output, simpler config            | ✓ Good      |
| Independent versioning            | Each package versions independently via Changesets (not fixed/locked)        | ✓ Good      |
| Defer changeset-bot               | User chose to skip; can install later via GitHub App                         | — Pending   |
| Defer trusted publishing          | Requires initial manual npm publish before OIDC can be configured            | — Pending   |
| Yarn catalogs for deps            | Single source of truth for shared dependency versions across workspaces      | ✓ Good      |

| Fresh Svelte 5 scaffold in-place  | Clean install over in-place upgrade — leverage recommended Svelte 5 infra    | ✓ Good      |
| Svelte 5 infra before content     | Validate scaffold + deps before migrating components and routes              | ✓ Good      |
| Paraglide JS over sveltekit-i18n  | Compile-time type safety, active maintenance, runtime override wrapper for backend translations | ✓ Good |
| DaisyUI 5 via @plugin directive   | CSS-first config, auto-registered colors, eliminated manual @theme color block | ✓ Good     |
| Node 22 monorepo-wide             | Consistent engine across CI, Docker, dev; aligns with LTS schedule           | ✓ Good      |
| Defer oxlint migration            | Svelte template linting not supported — dealbreaker for monorepo with .svelte files | ✓ Good |
| Yarn catalog expansion (30 entries) | Single source of truth for shared deps across workspaces                    | ✓ Good      |
| Voter app first for content migration | Scope v1.3 to voter app + shared components; candidate app deferred to v1.4 | ✓ Good      |
| Zero legacy patterns bar             | No `$:`, `on:event`, `<slot>` — fully idiomatic Svelte 5 after migration    | ✓ Good      |
| All E2E tests as regression gate      | Migration isn't done until voter-app E2E suite passes (26 tests)            | ✓ Good      |

| Leaf components migrated first    | 98 leaf files before containers — validates runes patterns at scale          | ✓ Good      |
| bind:this for exported functions  | `bind:functionName` incompatible with runes mode — use `bind:this` refs      | ✓ Good      |
| HTMLAttributes for Select restProps | `SvelteHTMLElements['select']` too narrow when spread onto div/input        | ✓ Good      |
| $derived.by() for multi-branch logic | Complex nextAction/submitRouting computations in candidate routes           | ✓ Good      |
| $state() for bind: variables      | Variables used with bind: in runes mode require $state() for reactivity     | ✓ Good      |
| API-based ToU workaround in E2E   | Vite dev-mode streaming bug blocks client-side ToU acceptance; use admin API | ✓ Good      |
| Cookie domain transfer in E2E     | SvelteKit use:enhance redirects to localhost; Playwright uses 127.0.0.1     | ✓ Good      |
| Auth cookie caching in E2E        | Strapi rate limiter (~7/min) exhausted by serial test logins                | ✓ Good      |

| JSONB answer storage over relational | 2-10x faster reads at all scales; simpler schema; concurrent writes adequate | ✓ Good (sb-v2.0) |
| JSONB localization with get_localized() | 3-tier fallback (requested→default→first key); avoids translation table joins | ✓ Good (sb-v2.0) |
| Custom Access Token Hook for JWT roles | Roles injected at auth time; no per-query role lookups | ✓ Good (sb-v2.0) |
| 79 per-operation RLS policies | Granular control; pgTAP-testable; clear security boundaries | ✓ Good (sb-v2.0) |
| Remove question_templates table | Admin tooling will handle templates at project creation; avoids runtime merge complexity | ✓ Good (sb-v2.0) |
| external_id for bulk import/export | Enables idempotent data sync without exposing internal UUIDs | ✓ Good (sb-v2.0) |
| Edge Functions for auth flows | Candidate invite + Signicat bank auth run server-side in Deno | ✓ Good (sb-v2.0) |
| Inline skills over subagent skills | Domain knowledge loaded in context, not forked; lower latency, better for reference | ✓ Good (sb-v5.0) |
| Defer architect/components/LLM skills | Frontend architecture will change with Svelte 5; skills would be immediately outdated | ✓ Good (sb-v5.0) |
| Skill drift CI check | Automated detection of stale skills when source targets change | — Pending (sb-v5.0) |
| Supabase adapter mixin pattern | Shared typed client across DataProvider/DataWriter/AdminWriter; init({ fetch }) for SSR | ✓ Good (sb-v3.0) |
| Cookie-based sessions over JWT tokens | Supabase PKCE flow with httpOnly cookies; no client-side token management | ✓ Good (sb-v3.0) |
| Keep jose and qs packages | Verified used outside Strapi adapter (identity provider, route utils) | ✓ Good (sb-v3.0) |
| Docker Compose as production test tool | Rewritten from 4-service dev stack to single-service frontend build verifier | ✓ Good (sb-v3.0) |
| Single layoutState enum over separate $state vars | Svelte 5 hydration bug: multiple $state writes in .then() from $effect don't trigger re-renders | ✓ Good (v2.1) |
| PopupRenderer runes-mode wrapper | Svelte 5 legacy-mode root layout can't detect store changes from async callbacks | ✓ Good (v2.1) |
| Invite flow redirects to login page | Session from verifyOtp doesn't reliably persist through client-side navigation | ✓ Good (v2.1) |
| Session-based password reset (no code param) | Auth callback verifyOtp establishes session; code param was Strapi-era legacy | ✓ Good (v2.1) |
| Deno as runtime only (not toolchain replacement) | Yarn 4 workspaces, Turborepo, ESLint unsupported on Deno; adapter-node works | ✓ Good (v2.2) |
| Pause v2.2 after feasibility validation | No forcing function (CI/production) to maintain Deno configs; avoid drift | ✓ Good (v2.2) |
| Roll back Deno code, preserve research | Code changes would rot without enforcement; research artifacts have lasting value | ✓ Good (v2.2) |
| --unstable-bare-node-builtins for Paraglide JS | async_hooks import without node: prefix; Deno plans to stabilize this flag | — Pending (v2.2) |
| Provider abstraction over direct replacement | IdentityProvider interface lets deployments switch providers via env var | ✓ Good (v2.3) |
| Configurable claim mapping (identityMatchProp) | Provider-agnostic identity matching — no code changes needed for new providers | ✓ Good (v2.3) |
| /api/oidc/* route grouping | Callback, token, authorize all under /api/oidc/ — clean API boundary | ✓ Good (v2.3) |
| Rename signicat-callback → identity-callback | Single provider-agnostic Edge Function vs parallel functions | ✓ Good (v2.3) |
| No existing user migration on provider switch | Clean break — simpler than dual-lookup, no code maintaining legacy paths | ✓ Good (v2.3) |
| Unit tests only for OIDC flow (no mock server) | jose generates synthetic tokens; real provider testing is manual | ✓ Good (v2.3) |

| D-24 admin-client split (base in @openvaa/dev-seed, subclass shell in tests/) | Dev-seed owns bulk data + storage write surface; tests/ owns auth/email helpers that pull Playwright types | ✓ Good (v2.5) |
| Latent-factor answer model with 6 swappable sub-steps | Each sub-step (dimensions, centroids, spread, positions, loadings, projection) is a standalone hook — consumers replace one step without forking the pipeline | ✓ Good (v2.5) |
| Audit-driven e2e template (not mechanical JSON port) | 58-E2E-AUDIT.md catalogued every runtime external_id ref in specs; template ships only audit-proven rows, no dead fixture content | ✓ Good (v2.5) |
| Deterministic baseline capture with --workers=1 | Serializes Playwright execution so the 10 data-race flakes don't destabilize the parity comparison | ✓ Good (v2.5) |
| Parity delta rule (not identity rule) | Pass-set locked, cascade-set may flip to pass, data-race pool may shift within itself but may not grow — accommodates pre-existing flakiness | ✓ Good (v2.5) |
| Fix-forward over rollback on parity FAIL | Debug the actual failure rather than reverting the swap; preserves forward progress when regressions are small and fixable | ✓ Good (v2.5) |
| Relaxed teardown assertion for dual-teardown setups | `toBeGreaterThanOrEqual(0)` matches pre-swap idempotent behavior; prefix-mismatch regressions surface elsewhere | ✓ Good (v2.5) |
| Zero-new-tool dep-graph verification | Use `yarn build` (Turborepo cycle detection) as primary dep-check + npx madge as supplement — no new repo dependency | ✓ Good (v2.5) |

| `$derived.by` discriminated-union for loader-data validity | Avoids intermediate `$state` flags that introduce microtask races during SSR hydration (root + protected layouts) | ✓ Good (v2.6) |
| Dedicated `$effect` for batched store mutations beside `$derived` validity | Replaces `$effect + Promise.all().then() + await tick()` pattern that left layouts stuck at `<Loading />` post-hydration | ✓ Good (v2.6) |
| `get(store)` + `untrack(...)` for store mutation inside `$effect` | New runes-mode pitfall: `$storeName.update()` inside `$effect` triggers `effect_update_depth_exceeded` (auto-subscription + version++ `$state` cycle); same for fromStore-bridged mutations | ✓ Good (v2.6) |
| SSR guards in client-only utilities | `typeof window`/`typeof navigator` checks in any util called from a component that might render server-side after reactivity-timing changes (e.g., `getEmailUrl`) | ✓ Good (v2.6) |
| `filterContext` Symbol-keyed module + `$state` version counter | Bridges imperative `FilterGroup.onChange` to `$derived` consumers without re-introducing the circular `$effect` chain; scoped per `(electionId, entityTypePlural)` tuple for cross-tab isolation | ✓ Good (v2.6) |
| 4-segment optional-param `/results` route + typed param matchers | Single shape covers all four valid URL variants (list-only, list-with-plural-tab, list+matching-drawer, list+cross-type-drawer); coupling-guard `+page.ts` 307-redirects malformed singular-without-id URLs | ✓ Good (v2.6) |
| Drawer-first paint via DOM source order + `content-visibility: auto` | Cold deeplinks to entity detail render the drawer before the list body, improving perceived performance without a separate route component | ✓ Good (v2.6) |
| Content-equality (`sameRefs`) before `$state` reassignment | Breaks reactivity cascades through `selectedElections` / `selectedConstituencies` / `appSettingsValue` when SvelteKit `parseParams(page)` returns fresh arrays per call but content is unchanged | ✓ Good (v2.6) |
| `noScroll: true` on drawer-close `goto()` | Round-trip drawer open/close preserves scroll position — Svelte 4 stores absorbed no-op writes via `safe_not_equal`; raw `$state =` doesn't, so cascades had to be cut explicitly | ✓ Good (v2.6) |
| Adapter-side reverse-fill of nomination parent → children id arrays | DB stores `parent_nomination_id` (flat); `OrganizationNomination` constructor only auto-populates `candidateNominationIds` from inline nested data, so adapter must derive children before returning | ✓ Good (v2.6) |
| `expect.poll(...).toBeGreaterThan(0)` over `test.skip(true)` | Replaces 6 silent skips with race-tolerant locator hard assertions; surfaces upstream defects (missing parent_nomination chains, missing `parentNominationType`) instead of masking them | ✓ Good (v2.6) |
| Phase 62-bis (Phase 64) pattern over rollback | When a milestone-anchor parity gate FAILs but the regressions are orthogonal, scope a sibling phase to absorb the deferred work rather than blocking close — preserves forward progress while keeping the gate honest | ✓ Good (v2.6) |
| Push-based `$state + $effect` mirror over pull-chain `$derived.by` helper-store | Reactivity propagates through context getters — pull-chain helper-store derived through destructured context capture broke reactive tracking across child-layout consumer boundaries | ✓ Good (v2.6) |
| Hoist `mergeSettings` from frontend `utils/merge.ts` to `@openvaa/app-shared` | Single source of truth — both `@openvaa/dev-seed` (e2e template overlays) and frontend share the same deep-merge contract; vitest 6-case coverage in package | ✓ Good (v2.6) |
| Densify default seed mid-milestone when smoke surfaces dead UI | Parties tab + categorical filter axes need ≥2 parties × ≥3 candidates per axis to be realistically exercisable in dev; densified to 5 constituencies × 8 parties × 327 candidates | ✓ Good (v2.6) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-13 after Phase 79 close + Phase 83 added to v2.10. Phase 79 (DETERM-04 + DETERM-05) shipped passed-with-deferral; v2.10 anchor locked at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE). Scope expanded from 3-item to 5-item: Phase 83 (DETERM-06 image-upload cascade + DETERM-07 voter-app flakes) absorbs the 2 follow-up todos surfaced by Phase 79's DETERM-04 fix, as in-milestone gap closure rather than re-deferring to v2.11+. 4 phases remaining (80, 81, 82, 83). Stale Svelte 5 todos (Expander + results-layout) cleared pending → done — both already resolved in v2.8 Phase 70 via accept-with-rationale._
