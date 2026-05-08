# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — E2E Testing Framework

**Shipped:** 2026-03-12
**Phases:** 7 | **Plans:** 31 | **Commits:** 147

### What Was Built
- Complete Playwright E2E infrastructure: project dependencies, API data management, 53+ testIds, fixture layer, ESLint enforcement
- Full candidate app coverage: auth, registration, profile, questions, settings, app modes (15 CAND requirements)
- Full voter app coverage: landing through results, matching verification, entity details, settings, popups, static pages (19 VOTE requirements)
- Configuration variant testing via base+overlay dataset composition (8 CONF requirements)
- CI pipeline with GitHub Actions, HTML reports, smoke/voter/candidate/variant tagging (3 CI requirements)
- Visual regression and performance benchmarks as opt-in capabilities (2 INFRA requirements)

### What Worked
- Infrastructure-first approach: Phase 1 foundations (testIds, data management, fixtures) enabled all subsequent phases to move fast
- API-based data management instead of UI automation: StrapiAdminClient with `/import-data` and `/delete-data` was faster and more reliable
- Base+overlay dataset pattern: shared default dataset with thin overlays for variants avoided dataset duplication
- Gap closure plans: inserting additional plans (01-09 through 01-11, 04-04, 04-05) to fix verification gaps kept quality high
- Parallel phase execution where dependencies allowed (Phases 4+5 after Phase 3)

### What Was Inefficient
- Phases 3 and 4 had the longest individual plan executions (up to 47 min) due to debugging flaky voter journey interactions
- ROADMAP.md plan checkboxes got out of sync with disk state — some phases showed `[ ]` for completed plans
- Phase 3 VERIFICATION initially marked gaps_found, but those gaps were deliberately deferred to Phases 4/5 — could have been documented clearer upfront
- 32 hardcoded testId strings in candidate spec files could have been centralized in testIds.ts from the start

### Patterns Established
- Kebab-case testId naming with page-prefix pattern (e.g., `login-submit`, `register-code`)
- Data lifecycle: delete-by-prefix then import-fresh for clean state isolation
- Complete sibling settings in every `updateAppSettings` call (overwrite, not merge)
- Env-gated test projects (PLAYWRIGHT_VISUAL, PLAYWRIGHT_PERF) for opt-in capabilities
- Sequential variant dependency chain for multi-config test execution
- Tags on `test.describe()` blocks for inheritance to contained tests

### Key Lessons
1. Infrastructure investments pay off exponentially — the 11-plan Phase 1 enabled 20 subsequent plans to execute in 1-5 minutes each
2. API-based data management is strictly better than UI automation for test setup/teardown
3. Gap closure plans are a natural and valuable workflow pattern — don't fight them, embrace them
4. Voter app tests are inherently more complex than candidate tests due to multi-step journeys and settings permutations
5. Tier-based ranking comparison (grouping by equal distance) is essential for matching verification — exact ordering is too fragile

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 147 commits over 11 days
- Most plans completed in 2-5 minutes; outliers were debugging-heavy voter journey specs

---

## Milestone: v1.1 — Monorepo Refresh

**Shipped:** 2026-03-15
**Phases:** 6 | **Plans:** 15 | **Commits:** 87

### What Was Built
- Turborepo integration with cached parallel builds and dependency-aware task orchestration
- Monorepo restructured to apps/ + packages/ convention with full Docker/CI/E2E path updates
- Changesets for automated versioning, changelogs, and GitHub Actions release PRs
- npm publishing readiness — tsup builds, metadata, LICENSE files, verified fresh install for 4 packages
- Yarn 4.13 with dependency catalogs and Vercel remote caching in CI
- Per-workspace lint/typecheck pipelines via Turborepo
- Tech debt cleanup — 9 audit items resolved across pre-commit hooks, version strings, docs

### What Worked
- Research-first approach: thorough ecosystem research (Turborepo vs alternatives, Changesets vs semantic-release) led to confident decisions with no backtracking
- Milestone audit + gap closure: auditing before completion found 9 tech debt items and 2 integration gaps; Phase 13 closed all tech debt cleanly
- Phase ordering was optimal: build orchestration → directory restructure → versioning → publishing → polish → cleanup followed natural dependency order
- tsup migration was clean: replaced complex tsc + tsc-esm-fix with simpler config, verified with fresh install tests
- Big-bang atomic moves (Phase 9) avoided broken intermediate states in directory restructure

### What Was Inefficient
- Phase 9 (Directory Restructure) took 46min — longest phase by far — due to cascading path updates across Docker, CI, TypeScript, and E2E tests
- Some ROADMAP progress table columns got misaligned during updates (missing milestone column values)
- Phase 14 (Trusted Publishing) had to be postponed because it requires initial manual publish first — could have been identified earlier in research
- NODE_AUTH_TOKEN integration gap in release.yml wasn't caught until milestone audit — would have been caught by running the release workflow

### Patterns Established
- Yarn catalogs for centralized dependency versions (single source of truth)
- tsup as standard build tool for publishable packages (replaces tsc pipeline)
- Turborepo turbo.json as task orchestration config (build, lint, typecheck, test)
- Per-workspace scripts pattern: each workspace has its own lint/typecheck scripts, Turborepo orchestrates
- Content-based caching (Turborepo hashes file content, not mtime)

### Key Lessons
1. Directory restructure is high-effort but high-value — touch once, benefit forever (apps/ convention, cleaner Docker/CI)
2. Milestone audits before completion catch real issues — Phase 13 closed 9 tech debt items that would have accumulated
3. Publishing readiness requires end-to-end verification — "pack + install + import" test caught issues that build-only checks missed
4. Dependency catalogs reduce cross-workspace version drift — single source of truth prevents silent inconsistencies
5. Deferred items (VER-04, Phase 14) are fine when consciously chosen — document the "why" for future context

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 87 commits over 4 days (faster velocity than v1.0)
- Average plan execution: 7 minutes (vs ~15min for v1.0)
- Phase 9 was the outlier at 46min; most phases completed in under 15min total

---

## Milestone: v1.2 — Svelte 5 Migration (Infrastructure)

**Shipped:** 2026-03-18
**Phases:** 7 | **Plans:** 14 | **Commits:** 96

### What Was Built
- Fresh SvelteKit 2 + Svelte 5 scaffold with native TypeScript support and @tailwindcss/vite replacing PostCSS
- Tailwind 4 CSS-first configuration with DaisyUI 5 and full theme token migration from JS to CSS directives
- Migrated i18n from unmaintained sveltekit-i18n to Paraglide JS — 740 call sites, compile-time type safety, runtime override wrapper
- Full monorepo dependency bump with Yarn catalog expansion (13 → 30 entries), Node 22 migration
- Docker, CI, and 92 E2E tests validated end-to-end after migration
- OXC toolchain evaluated and consciously deferred (Svelte template linting not supported)
- Migration cleanup: dead code removal and 7 TypeScript error fixes

### What Worked
- In-place scaffold replacement: fresh Svelte 5 config files over existing code preserved all component files while modernizing build tooling
- DaisyUI 5 @plugin directive: auto-registered colors eliminated manual @theme color block, simplifying CSS architecture
- Paraglide JS with runtime override wrapper: kept backend translationOverrides working while gaining compile-time type safety
- Phased validation: dedicating Phase 19 entirely to integration validation caught real issues (alwaysNotifyStore, nomination settle detection)
- Milestone audit → gap closure: Phase 21 was added after audit found dead code and TS errors, closing integration gaps before shipping
- OXC evaluation as separate phase: quick 4-min evaluation with clear recommendation avoided wasting time on premature migration

### What Was Inefficient
- Phase 19-02 (Docker/E2E/CI validation) took 55 minutes — longest plan in the milestone — due to debugging Svelte 5 store equality changes and DaisyUI 5 class renames in E2E tests
- Nyquist validation was incomplete across phases — draft or missing VALIDATION.md files for most phases
- Some v1.2 decisions accumulated in STATE.md Decisions section (38 entries) — too granular for operational state; better suited for PROJECT.md Key Decisions table only
- 740 i18n call site migration was mechanical but time-consuming — future migrations of this scale should consider codemods

### Patterns Established
- CSS-first Tailwind 4 with @theme directives (no JS config files)
- DaisyUI 5 @plugin directive for color auto-registration
- Paraglide JS with runtime override wrapper for backend translation overrides
- alwaysNotifyStore pattern for bypassing Svelte 5 Object.is() equality on mutable stores
- Subscription-based settle detection for async data (replaces tick+timeout)
- Double assertion via `unknown` for type-incompatible casts (safer than @ts-ignore)

### Key Lessons
1. Fresh scaffold over in-place upgrade is strictly better for major framework upgrades — clean config, no legacy remnants
2. CSS-first config (Tailwind 4) eliminates entire categories of config complexity — JS config, PostCSS plugins, safelist
3. i18n library migration at scale (740 call sites) is feasible with wrapper functions — Paraglide compile-time safety was worth the effort
4. Svelte 5 store equality change (Object.is()) can break stores that hold mutable objects — alwaysNotifyStore pattern is needed until runes migration
5. Dedicated evaluation phases (Phase 20) are cheap and prevent premature migration — 4 minutes to avoid weeks of regret
6. Gap closure after milestone audit is now a validated 3-milestone pattern — always audit before shipping

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 96 commits over 3 days (fastest milestone yet)
- Average plan execution: ~10 minutes; Phase 19-02 was the outlier at 55min
- 861 files modified — largest codebase impact of any milestone (+29.5k/-6.3k lines)

---

## Milestone: v1.3 — Svelte 5 Migration (Content)

**Shipped:** 2026-03-20
**Phases:** 5 | **Plans:** 19 | **Commits:** 99

### What Was Built
- 98 shared and voter-app components migrated to Svelte 5 runes mode ($props, $derived, $effect, $bindable)
- All container components converted from named slots to {#snippet}/{@render} props with 39+ route consumer updates
- All voter route pages and layouts migrated from $: reactive statements to $derived/$effect runes
- createEventDispatcher removed from all 6 dispatching components, replaced with callback props
- All v1.3-scoped TODO[Svelte 5] markers resolved; candidate app call sites updated for API changes
- Full validation gate: zero legacy patterns, zero TypeScript errors, 26/26 voter-app E2E tests passing

### What Worked
- Leaf-first migration order: migrating 98 leaf components first validated runes patterns at scale before tackling containers and routes
- Atomic consumer updates: updating all call sites in the same plan as the component change prevented broken intermediate states
- bind:this pattern for exported functions: cleaner than $bindable callback alternatives, worked well across consumer boundaries
- Validation gate as separate phase: dedicated Phase 26 caught 11 TypeScript errors and E2E regressions that would have shipped silently
- Gap closure plans (22-07, 26-03): again validated as natural workflow — 3 plans were added mid-milestone to close verification gaps
- Milestone audit before completion: caught scope ambiguities (E2E test count, TODO marker classification) before archival

### What Was Inefficient
- Phase 22 had 7 plans (largest phase) due to high component count — could have been split into 2 smaller phases
- Some plans required deviation handling mid-execution (23-02 Button badge slot change triggered 24 route file on:click→onclick fixes)
- E2E test count discrepancy (requirement said "92 tests", actual voter-app scope was 26) — should have been caught during requirements definition
- Nyquist validation incomplete for phases 23-26 — VALIDATION.md files were partial or missing
- Results page required multiple $effect/$derived iterations due to Svelte 5 reactivity edge cases (untrack, $derived.by)

### Patterns Established
- $props() with explicit type interfaces (not inline) for complex components
- $bindable() for all props consumed via bind: (92 occurrences across 40 files)
- bind:this for component exported functions (replacing bind:functionName)
- Callback props for events (onclick, onexpand, oncollapse) replacing createEventDispatcher
- {#snippet children()}/{@render children?.()} for slot replacement
- $derived.by() for multi-statement derivations, $derived() for single-expression
- $effect() with synchronous .then() chains (async $effect callbacks discouraged in Svelte 5)
- untrack() for $state writes inside $effect to break circular dependencies
- Non-null assertions inside Svelte {#if} template guards for $state variables

### Key Lessons
1. Component migration order matters: leaf → container → route follows natural dependency flow and validates patterns before scale
2. Consumer updates must be atomic with component changes — splitting creates broken intermediate states that are hard to debug
3. Svelte 5 reactivity has edge cases: snippet block re-rendering, $effect circular dependencies, $state mutations in event handlers — plan for debugging time
4. Validation gate as a separate phase is now a validated 4-milestone pattern — always verify before shipping
5. E2E tests are the ultimate regression gate — they caught regressions that TypeScript and svelte-check missed
6. Scope precision in requirements prevents confusion at completion — "92 tests" vs "26 voter-app tests" caused unnecessary audit friction

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning/audit agents
- 99 commits over 3 days (consistent with v1.2 velocity)
- 334 files modified (+18.2k/-4.3k lines)
- Phase 22 was the longest (7 plans, 98 components) but each plan was mechanical and fast
- Phase 26 required the most debugging due to Svelte 5 reactivity edge cases

---

## Milestone: v1.4 — Svelte 5 Migration (Candidate App)

**Shipped:** 2026-03-22
**Phases:** 2 | **Plans:** 7 | **Commits:** 21

### What Was Built
- All 25 candidate app route files migrated to Svelte 5 runes ($derived, $effect, $state, snippet children, native events)
- Zero legacy Svelte 4 patterns confirmed across candidate app (no $:, on:event, `<slot>`, createEventDispatcher)
- Zero TypeScript errors (120 warnings, non-blocking)
- All 20 candidate-specific E2E tests passing (including registration flow fixes)
- Fixed E2E test infrastructure: API-based ToU workaround, cookie domain transfer, auth cookie caching, rate limit mitigation

### What Worked
- Patterns established in v1.3 applied directly: $derived.by(), $state for bind:, callback props, snippet children — zero new pattern discovery needed
- Small milestone scope (2 phases, 25 files) enabled single-day completion
- Validation gate phase caught real E2E failures that weren't visible from code analysis alone
- Gap closure plan (28-03) diagnosed 3 root causes (Vite streaming bug, cookie domain mismatch, rate limiter) that the original plan missed
- Complexity ordering within Phase 27: minimal → auth → moderate → complex provided natural learning curve

### What Was Inefficient
- Phase 28 Plan 02 initially misdiagnosed root cause as SES email infrastructure; actual cause was Vite dev-mode streaming bug — wasted one plan on wrong diagnosis
- E2E test debugging required deep Playwright + SvelteKit + Docker networking knowledge — the gap closure plan took 81 minutes (longest plan in milestone)
- Phase 28 needed 3 plans for what was originally scoped as 1 validation plan — E2E test debugging expanded scope significantly

### Patterns Established
- $derived.by() for multi-branch routing logic (nextAction, submitRouting patterns)
- $state() required for any variable consumed by bind: in runes mode
- API-based workarounds in E2E tests for Vite dev-mode streaming bugs (admin API instead of UI interactions)
- Cookie domain transfer pattern for Playwright (localhost → 127.0.0.1) when Docker networking is involved
- Auth cookie caching in serial E2E test suites to avoid rate limiter exhaustion

### Key Lessons
1. Well-established patterns make subsequent milestones dramatically faster — v1.4 was 1 day vs v1.3's 3 days for similar work
2. E2E test debugging can dominate milestone time even when code changes are small — budget for it
3. Root cause diagnosis matters more than fast fixes — Plan 28-02's misdiagnosis cost an extra plan
4. Vite dev-mode and SvelteKit use:enhance have non-obvious interactions that only manifest under E2E test conditions
5. Validation gate phases continue to catch real issues — now validated across 5 milestones

### Cost Observations
- Model mix: opus for execution, sonnet for verification
- 21 commits over 1 day (fastest milestone — patterns fully established)
- 53 files modified (+3.1k/-0.4k lines) — smallest codebase impact, focused on route files
- Plan 28-03 (gap closure) was the outlier at 81min; code migration plans averaged ~10min

---

## Parallel Branch Retrospectives

*The following entries are from the parallel branch (feat-gsd-supabase-migration), which diverged at v1.0 phase 7 and independently shipped v2.0 (Supabase), v3.0 (Frontend Adapter), and v5.0 (Claude Skills). These entries use `sb-` milestone prefixes to distinguish from this branch's milestones. The parallel branch's v1.0 entry is omitted — this branch's v1.0 is the canonical version.*

## Milestone: sb-v2.0 — Supabase Migration

**Shipped:** 2026-03-15
**Phases:** 8 | **Plans:** 21 | **Timeline:** 4 days

### What Was Built
- 17-table multi-tenant PostgreSQL schema with JSONB localization and dual answer storage alternatives
- GoTrue authentication with 5 role types, 79 RLS policies, and JWT custom claims via Access Token Hook
- Load testing toolkit (pgbench + k6) at 1K/5K/10K scale — JSONB answer storage chosen with HIGH confidence
- Storage buckets with RLS, bulk import/delete RPCs with external_id relationship resolution
- 3 Edge Functions: candidate invite, Signicat bank auth with JWE, transactional email
- 204 pgTAP tests across 10 test files covering tenant isolation, access control, triggers, and column restrictions

### What Worked
- Schema-first approach: designing tables, RLS, and indexes before services kept integration clean
- Load testing before committing to answer storage saved a potential rework
- pgTAP tests caught real bugs (ON CONFLICT partial index, search_path in SECURITY DEFINER) before they reached production
- Gap closure phases (14, 15) efficiently caught and fixed issues from the milestone audit
- Removing question_templates was the right call — it simplified the schema and deferred complexity to admin tooling

### What Was Inefficient
- Phase 15 plan was created to restore QuestionTemplate code from git history, then immediately invalidated by the decision to remove it entirely — the research/plan cycle could have been avoided with earlier discussion
- Phase 8 VERIFICATION.md was written when seed.sql was still empty (resolved later but created a persistent gap_found status)
- Some Edge Functions (invite-candidate, send-email) were built without frontend callers — they work but are untestable end-to-end until v3+

### Patterns Established
- Schema-qualified function calls in SECURITY DEFINER contexts (`public.delete_storage_object`, not `delete_storage_object`)
- ON CONFLICT WHERE predicates must exactly match partial unique index definitions
- external_id pattern for idempotent bulk import/export without exposing internal UUIDs
- COLUMN_MAP/PROPERTY_MAP for snake_case DB to camelCase TypeScript conversion

### Key Lessons
1. Always run the milestone audit before gap closure planning — the audit identified 4 real bugs that were fixable in a single phase
2. Design decisions (like removing question_templates) should be surfaced early in discuss-phase, not discovered during planning
3. Edge Functions can be built and tested in isolation, but end-to-end verification requires the consuming frontend — accept this gap for backend-first milestones

### Cost Observations
- Model mix: ~60% opus (orchestration, execution), ~30% sonnet (verification, plan checking), ~10% haiku
- Notable: Single-plan phases (14, 15) executed very efficiently; multi-plan phases (9, 10) benefited from wave-based parallelization

---

## Milestone: sb-v3.0 — Frontend Adapter

**Shipped:** 2026-03-20
**Phases:** 9 | **Plans:** 28 | **Timeline:** 3 days

### What Was Built
- Supabase frontend adapter replacing Strapi across all read/write/admin operations (DataProvider, DataWriter, AdminWriter)
- Auth migration from Strapi JWT to Supabase cookie-based sessions with PKCE flow
- Edge Function integration: candidate invite, bank auth (Signicat OIDC), transactional email
- Full E2E test suite migrated from Strapi to Supabase (admin client, data seeding, auth setup)
- Complete Strapi removal: 285 files deleted, backend/vaa-strapi/ gone, adapter directory gone
- Dev environment rewired to `supabase start` + SvelteKit dev server, Docker Compose reduced to production-build test tool
- CI pipeline updated: backend-validation removed, pgTAP job added, E2E uses supabase CLI

### What Worked
- Dependency-ordered phases (schema -> foundation -> auth -> reads -> writes -> admin -> edge -> tests -> cleanup) prevented rework
- The adapter mixin pattern (supabaseAdapterMixin) provided clean shared infrastructure for all three adapter classes
- Wave-based parallelization in Phase 30 (plans 02+03 in parallel) was efficient for independent infrastructure changes
- Phase 29 (E2E migration) proving Supabase-only workflow before Phase 30 (Strapi removal) eliminated risk
- Research identified that jose and qs packages must be kept — prevented a broken build

### What Was Inefficient
- Phase 30 documentation task (30-04) was the slowest plan despite being "just docs" — 22 pages to update is significant work
- Some plan checkboxes in ROADMAP.md were not updated by executors (stayed as `[ ]` instead of `[x]`)
- SUMMARY.md one_liner fields were not consistently populated, making milestone accomplishment extraction manual

### Patterns Established
- supabaseAdapterMixin with init({ fetch }) for SSR compatibility across all adapter classes
- Cookie-based PKCE sessions with httpOnly cookies and safeGetSession (not getSession) for route guards
- Stub docs pattern: removed Strapi pages replaced with stubs pointing to equivalent Supabase documentation
- get_candidate_user_data RPC for deriving user context (role, election, constituency, nomination) from session

### Key Lessons
1. Removal phases are deceptively complex — Strapi had references in 243+ files across code, config, CI, docs, and Docker
2. Research phase is critical even for "just delete" work — the exhaustive grep caught edge cases (Dockerfile COPY, dead test files)
3. Keep jose/qs analysis is the kind of nuance that prevents broken builds — always verify package usage before removal
4. Documentation cleanup should be a separate plan (as it was) — mixing code deletion with doc updates creates overly large commits

### Cost Observations
- Model mix: ~70% opus (execution), ~20% sonnet (verification, plan checking), ~10% research
- Notable: 9 phases with 28 plans completed in 3 days — dependency-ordered execution minimized wait time
- Phase 30 (removal) was fastest conceptually but slowest in docs cleanup

---

## Milestone: v2.2 — Deno Feasibility Study (Paused)

**Paused:** 2026-03-27
**Phases:** 1 of 3 (Phase 42 complete, 43-44 paused) | **Plans:** 2 | **Commits:** 20

### What Was Built
- Deno 2.7.8 validated as runtime for the full OpenVAA monorepo (SvelteKit production build, Supabase PKCE auth, 54/67 E2E tests)
- Hybrid deno.json+package.json workspace coexisting with Turborepo/Changesets/tsup
- 17 @openvaa/core tests ported to deno test with vitest compatibility shim
- Reusable smoke test script for SvelteKit under Deno with documented permission set

### What Worked
- Research-first approach: thorough ecosystem research identified "Deno as runtime only" strategy before any code was written — prevented wasted effort on full toolchain replacement
- Fast PoC validation: Phase 42 completed in 38 minutes total (6min plan 01 + 32min plan 02) with all 8 requirements validated
- Early pause decision: recognized that maintaining Deno configs without CI enforcement or production deployment would create drift — better to roll back and preserve research
- Vitest compatibility shim: enabled existing tests to run on both runtimes without code duplication

### What Was Inefficient
- Phase 42 code was rolled back immediately after validation — the work produced research artifacts but no permanent code changes
- Could have scoped v2.2 as a single-phase "feasibility spike" rather than a 3-phase milestone with full requirements, since the pause decision was likely from the start
- The 6 EVAL/RPT requirements were defined but never addressed — overhead for requirements that may never be executed

### Patterns Established
- Hybrid deno.json+package.json workspace pattern for gradual Deno adoption
- `--unstable-bare-node-builtins` as standard flag for Paraglide JS compatibility on Deno
- ORIGIN env var required by SvelteKit adapter-node for CSRF protection (applies to both Node and Deno)
- "Validate then rollback" pattern for feasibility studies — preserve research, avoid maintenance burden

### Key Lessons
1. Feasibility studies should be scoped as spikes, not full milestones — a single phase with clear go/no-go criteria is sufficient
2. "Validate then rollback" is a valid outcome — not all milestones need to ship code changes
3. Deno runtime compatibility is excellent for Node.js projects — zero code changes needed for SvelteKit serving
4. Toolchain replacement is a different (harder) problem than runtime replacement — Yarn, Turborepo, ESLint have no Deno equivalents
5. Research artifacts have lasting value even when code is rolled back — the findings will inform future Deno decisions

### Cost Observations
- Model mix: opus for execution, sonnet for research agents
- 20 commits over 1 day (including rollback)
- 18 files modified (+2,646/-1,406 lines), net zero after rollback
- Fastest execution: 38 minutes for 2 plans — research phase was the real time investment

---

## Milestone: v2.5 — Dev Data Seeding Toolkit

**Shipped:** 2026-04-24
**Phases:** 4 (56-59) | **Plans:** 34 | **Tasks:** 63

### What Was Built
- `@openvaa/dev-seed` private workspace with 14 per-entity generator classes emitting typed rows against `@openvaa/supabase-types`; D-24 admin-client split (base in package, subclass shell in tests/)
- Latent-factor answer model (6 swappable sub-steps: dimensions, centroids, spread, positions, loadings, projection+noise) producing party-clustered candidate answers with measurable correlation; verified intra/inter-party distance ratio 0.0713 and |r| 0.993
- Built-in `default` + `e2e` templates, filesystem variant templates, CLI trio (`dev:seed`, `dev:seed:teardown`, `dev:reset-with-data`), 4-locale fan-out, deterministic seed option
- E2E fixture migration: `tests/seed-test-data.ts` rewritten as 37-line thin wrapper; 8 module-level fixture consumers moved to typed barrel; 7 legacy files deleted; Playwright parity gate at baseline-matching 41/10/38 after D-59-12 fix-forward

### What Worked
- **Audit-driven e2e template (D-58-15)** — cataloguing every runtime external_id ref in Playwright specs before authoring the template meant the template shipped only audit-proven rows. Zero dead fixture content.
- **Explicit parity contract with committed baseline artifact** — the 181 KB `baseline/playwright-report.json` committed in Plan 01 gave future work a durable contract, not a 90-day CI retention window. The diff script codified D-59-04's rule as exit-code-checkable output (`PARITY GATE: PASS|FAIL`), making human-verify checkpoints trivial.
- **Fix-forward on parity FAIL (D-59-12)** — iteration 1 produced 22 regressions; the fix-forward executor correctly identified that the triage had mis-diagnosed Root cause #1 (externalIdPrefix refactor would have been 8 files for zero effect). The real cause was Plan 04's stricter teardown assertion tripping the second teardown's empty DB. One-line relaxation fixed it.
- **D-24 subclass pattern** — keeping auth/email helpers (tied to Playwright types) in the tests/ subclass while moving bulk-write surface into the package avoided a circular dep between dev-seed and Playwright.
- **Zero-new-tool dep-graph verification** — `yarn build` (Turborepo + TS project refs) fails on cycles by default. Capturing its output as `deps-check.txt` satisfied E2E-04 without adding madge or dependency-cruiser to the catalog (madge shipped as supplement only).

### What Was Inefficient
- **CONTEXT.md's 15/19/55 baseline estimate was 6 months stale** — the actual distribution at phase-start was 41/10/25/13. Plan 03's diff script + Plan 05's diff.md had to be parameterized on the ACTUAL test names from the baseline JSON rather than the counts in CONTEXT.md. Caught early, but CONTEXT.md estimates based on historical numbers should be flagged as "re-measure during Plan 01" up front.
- **Test-title camelCase/snake_case drift** — Plan 59-02's snake_case property migration also renamed test title strings, which collided with the baseline JSON (frozen with camelCase titles). The diff script flagged it as "new test appeared post-swap" and a title-only revert was needed. Property access and test title are different concerns; the rename rule should have stopped at property access.
- **Triage accuracy on parity FAIL** — the initial post-swap diff.md cited 4 root causes; deep investigation showed 2 of them were the same issue (the teardown assertion, not externalIdPrefix). Triage-under-pressure produced plausible-but-wrong hypotheses. Root-cause analysis should have waited for the fix-forward executor's code read before assuming.

### Patterns Established
- **Baseline-as-contract** — commit a Playwright JSON report as the parity contract; frozen artifact beats CI retention. Pair with a diff script that consumes actual test names, not counts, and emits a grep-able verdict literal.
- **Typed fixture barrel over scattered JSON imports** — migrate module-level JSON consumers to a typed constants module (`tests/tests/utils/e2eFixtureRefs.ts`) before doing the swap; prevents "scope hazard" of post-swap compile failures.
- **Template-level `externalIdPrefix` contract** — pipeline pre-pends prefix to fixed[] literals; authoring convention is unprefixed literals for top-level `external_id`, prefixed form for refs. Default template demonstrates; e2e template intentionally keeps `externalIdPrefix: ''` because all its fixed[] IDs already start with `test-`.
- **Teardown idempotency via `toBeGreaterThanOrEqual(0)`** — when multiple teardowns share a prefix, the later ones correctly delete zero rows. The assertion should match pre-swap behavior; prefix-mismatch regressions surface elsewhere (seed step, spec failures).

### Key Lessons
1. **Baseline measurements have a shelf life.** CONTEXT.md estimates based on prior-milestone numbers need a "re-measure as Plan 01" directive; don't assume they hold.
2. **Separate the rename axes.** When migrating property names across a codebase, test titles are descriptive strings — don't rename them unless the description itself is wrong. The test title references a concept (e.g. "termsOfUseAccepted" the property), not the property's spelling.
3. **Fix-forward executors can catch triage errors.** The pattern of "diff reports root cause X → fix-forward executor investigates → discovers X is wrong and Y is the real cause" is a natural second-opinion check. Don't auto-apply the triage's recommended fix; let the fixer investigate first.
4. **Human checkpoints map cleanly to destructive/environmental boundaries.** Plan 01 (dev stack bootstrap), Plan 05 (parity verdict), Plan 06 (PASS gate before destructive delete) all correctly paused for user action. These were the right inflection points.
5. **Context-window inheritance matters for plan quality.** The 1M-context planner for Phase 59 digested the 3 prior phases' CONTEXT.md + 59-CONTEXT.md + 59-PATTERNS.md cleanly; the resulting plan captured the 8-consumer scope hazard, teardown prefix issue, and zero-new-tool dep-graph option in one pass.

### Cost Observations
- Model mix: predominantly opus for executor + planner agents; sonnet for plan-checker and verifier (follows milestone default profile)
- 25 new commits on feat-gsd-roadmap across Plans 01-07 + 3 fix-forward commits + cosmetic reverts; all committed with `git -c core.hooksPath=/dev/null` to work around a workstation-level misconfig
- Wall-clock: Phase 59 executed over ~2 hours of real time (including 2× 3-minute Playwright runs for parity); agent CPU time substantially lower
- Open artifact audit flagged 2 historical Phase 58 tracker labels (UAT / VERIFICATION never flipped from informal sign-off) — zero functional gaps; resolved in `chore(v2.5)` at close time

---

## Milestone: v2.6 — Svelte 5 Migration Cleanup

**Shipped:** 2026-04-28
**Phases:** 5 (60-64) | **Plans:** 18 | **Tasks:** 48 | **Commits:** 137 | **Wall-clock:** 4 days (2026-04-24 → 2026-04-28)

### What Was Built
- Runes-mode migration of the last two legacy layouts (root `+layout.svelte` + candidate `(protected)/+layout.svelte`) — `Promise.all().then() + await tick()` pattern replaced with `$derived.by` discriminated-union validity + dedicated `$effect` for batched store mutations. Protected-layout stuck-at-`<Loading />` gone; SSR microtask race eliminated.
- `PopupRenderer` workaround deleted atomically — inline popup rendering via `{@const Component = item.component}` + `<Component ...>` works under Svelte 5 runes; D-09 `voter-popup-hydration.spec.ts` E2E proves it.
- Voter-app question flow restored: `isBooleanQuestion` type guard + boolean answer/match-breakdown UI; category-selection migrated to pure `$state` with default-all-checked seeding; candidate-questions reactivity restored via push-based `$state + $effect` mirror replacing the broken pull-chain `$derived.by` helper-store chain.
- Results page consolidated: `EntityListWithControls` compound merges list + controls; `filterContext` Symbol-keyed module bridges `FilterGroup.onChange → $derived` via a `$state` version counter; single 4-segment optional-param `/results` route with typed American-spelled matchers; coupling-guard 307-redirects malformed URLs; drawer-first DOM source order + `content-visibility: auto`.
- Phase 62-bis (Phase 64) closed the parity gate via 4-layer reactivity-cascade fix (content-equality guards on `$state` reassignment + `noScroll: true` on drawer-close `goto()` + adapter-side reverse-fill of nomination parent → children id arrays + `expect.poll` hard assertions replacing 6 silent `test.skip(true)` paths). 9-step manual smoke approved 9/9 with 7 in-flight production fixes diagnosed during the smoke session.
- E2E template extension: `mergeSettings` + `DeepPartial` hoisted from frontend `utils/merge.ts` to `@openvaa/app-shared`; e2e template ships `app_settings.fixed[]` + 3 variant overlays; 4 legacy `updateAppSettings(...)` calls retired.
- Default seed densified mid-milestone to 5 constituencies × 8 parties × 327 candidates so parties tab + categorical filter axes are realistically exercisable in dev.

### What Worked
- **Phase 62-bis (Phase 64) pattern over rollback** — Phase 60 SC-4 parity gate FAILed with 24 regressions, all Category A (orthogonal, surfaced-not-introduced). Rather than retroactively expanding Phase 60 or blocking close, scoping a sibling phase to absorb the voter-results work was the cleanest path. Phase 64 then absorbed Phase 62's deferred 9-step manual smoke + 5 voter-results E2E that Phase 63 had handed forward, AND closed the v2.6 anchor parity gate. Two sub-phases overlapping a single resolution.
- **Hard-assertion E2E surfacing latent defects** — replacing 6 silent `test.skip(true)` paths in voter-results.spec.ts with `expect.poll(...).toBeGreaterThan(0)` hard assertions surfaced two latent defects that had been masked: e2e seed missing `parent_nomination` chains (only 11/14 candidates linked to parties) AND supabase adapter not deriving `parentNominationType` from inline org payload. Both fixed in flight in Plan 64-01.
- **Mid-milestone seed densification when smoke surfaces dead UI** — Phase 64 manual smoke surfaced "no parties listed" + "categorical filter checkboxes all disabled". User flagged the parties-tab gap; densifying default seed to 5 constituencies × 8 parties × matrix-distributed candidates (327 total) made the tab and filters realistically exercisable AND gave Phase 64 manual smoke a usable surface to actually test the per-tuple FilterGroup scoping.
- **Independent Chrome walkthrough verifying user-reported smoke results** — when the user said "all 9 steps pass" and asked Claude to walk through it themselves via Chrome, the independent verification (using `mcp__claude-in-chrome__*` tools) reproduced the same 9/9 PASS, confirming parity gate close was real.
- **Atomic deletion path on the optimistic D-08 outcome** — D-08 reserved a "PopupRenderer retention with documented rationale" fallback in case inline rendering didn't work. Empirical D-09 gate passed first try; the rationale-retention branch was never invoked. Pre-committing to "delete atomically if D-09 PASS" worked.
- **Audit-driven todo capture during manual smoke** — items like `bind:*` audit, `{#key}` audit, and the `/results/[entType]/[nominationId]` route refactor were captured into existing/new todo files as they surfaced, not at end-of-session. Three durable follow-ups added to `.planning/todos/pending/` during smoke (svelte5-cleanup items 4 & 5 + results-url-refactor-followups item 4) — captured-when-discovered, not lost-by-end-of-session.

### What Was Inefficient
- **W-5 constant-count "DRIFT" was an arithmetic error** — Plan 60-01 reported a 22-test gap between baseline (89) and constants (67) and flagged it for Plan 60-05 inspection. Plan 60-05 found CASCADE_TESTS had been undercounted as 16 (actual 25); real gap was 89-76 = 13, which exactly matched the 13 SOURCE_SKIP tests. No drift, no re-embed needed. Cost was ~1 plan-step of unnecessary preflight noise.
- **Pull-chain `$derived.by` helper-store pattern hides destructured-context capture bugs** — Phase 61 candidate-questions reactivity required a full rewrite of the candidate context (push-based `$state + $effect` mirror) plus a non-destructured `ctx.X` access pattern at the consumer boundary. The pull-chain pattern looked fine in static code review and worked when accessed directly in the same component, but broke across child-layout consumer boundaries with destructuring. Costly to diagnose (full Plan 61-03 produced a permanent diagnosis record).
- **The cascade through SvelteKit `parseParams(page)` took 4 separate component-level guards to fully break** — Svelte 5 raw `$state =` doesn't have Svelte 4's `safe_not_equal` absorber. SvelteKit returns fresh `parseParams(page)` arrays per call → cascades through `selectedElections` → `selectedConstituencies` → `appSettingsValue` → `nominationAndQuestionStore` → `filterStore` → new FilterGroup. Required guards on `voterContext.selectedElections`/`selectedConstituencies` (sameRefs content-equality) AND `appContext.appSettingsValue`/`appCustomizationValue` (ref-equality) to fully break the cascade. Each guard was simple; finding all four was iterative.
- **Silent `test.skip(true)` had been masking 2 production defects for an unknown duration** — the 6 voter-results paths converted to hard assertions in Plan 64-01 surfaced the seed parent_nomination + adapter parentNominationType defects that had been latent through Phase 62 close. Lesson: silent skip is a debt accelerator; replace with deliberate `test.fixme` + tracked unblock work, never silent skip.
- **Phase 60 SC-4 `pending_review: true` flag was the right escape hatch but added verification debt** — flagging the gate FAIL as "alternative evidence + handoff to Phase 61" was correct, but the corresponding Phase 61 (and downstream Phase 64) re-verification work was implicit rather than explicit. A formal "handoff debt register" entry would make these obligations more visible.

### Patterns Established
- **`$derived.by` discriminated-union for SSR-safe loader-data validity** — pure, no intermediate `$state` flags, no microtask races. Pair with a dedicated `$effect` for batched store mutations. (Applied in root + candidate-protected layouts.)
- **`get(store)` + `untrack(...)` for store mutation inside `$effect`** — `$storeName.update()` (and fromStore-bridged equivalents) inside `$effect` triggers `effect_update_depth_exceeded` due to auto-subscription + version++ `$state` cycle. Mechanical workaround.
- **`filterContext` Symbol-keyed module + `$state` version counter** — bridges imperative `FilterGroup.onChange` callbacks to `$derived` consumers without re-introducing a circular `$effect` chain. Scope per `(electionId, entityTypePlural)` tuple for cross-tab isolation.
- **4-segment optional-param `/results` route + typed param matchers** — single shape covers all four valid URL variants; coupling-guard `+page.ts` 307-redirects malformed singular-without-id URLs.
- **Drawer-first paint via DOM source order + `content-visibility: auto`** — cold deeplinks render the drawer before the list body without a separate route component.
- **Content-equality (`sameRefs`) before `$state` reassignment** — required to break Svelte 5 reactivity cascades when upstream returns fresh arrays/objects with same content. Must be applied at the assignment site, not consumer side.
- **`noScroll: true` on goto for round-trip drawer close** — preserves scroll position when URL changes but document content is conceptually unchanged. Pair with `data-sveltekit-noscroll` on individual links if applicable.
- **`expect.poll(...).toBeGreaterThan(0)` over `test.skip(true)` for race-tolerant E2E** — race-tolerant locator hard assertion replaces silent skip while remaining deterministic.
- **Phase 62-bis (sibling-phase absorbs deferred milestone-anchor work)** — when parity gate FAILs but regressions are orthogonal, scope a sibling phase to close them rather than rolling back or retroactively expanding the originating phase.
- **Adapter-side reverse-fill of nomination parent → children id arrays** — DB stores flat `parent_nomination_id`; data-model constructors only auto-populate from inline nested payloads. Adapter must derive children before returning.

### Key Lessons
1. **Svelte 5 raw `$state =` doesn't have Svelte 4's `safe_not_equal` absorber.** Content-equal reassignments still cascade through `$derived` consumers unless guarded explicitly at the assignment site (`===` for objects/arrays, deep `sameRefs(...)` for collections). Multi-context cascades require guards at every layer; a single guard is rarely enough.
2. **`$storeName.update()` and fromStore-bridged mutations inside `$effect` are a runes-mode pitfall.** Symptom is `effect_update_depth_exceeded`; root cause is store auto-subscription + subscribe-notify + version++ `$state` cycle. Workaround is mechanical (`get(store)` + `untrack(...)`) but recognizing the symptom takes one bug.
3. **Silent `test.skip(true)` is a debt accelerator.** Each path in v2.6's voter-results suite had been masking an upstream production defect for an unknown duration. Forcing hard assertions surfaced both. Use `test.fixme` with a tracked unblock task instead — never silent skip.
4. **Manual smoke catches what E2E doesn't.** Phase 64's 9-step manual smoke surfaced 7 in-flight production fixes (badge persistence, scroll preservation, portrait reload flicker, parties tab empty, categorical filter checkboxes disabled) that no automated test was covering. UX-class bugs survive E2E because E2E checks state, not transitions and continuity. Keep manual checkpoints in the GSD verification protocol for reactivity-heavy phases.
5. **Phase 62-bis pattern: when a milestone-anchor parity gate FAILs but regressions are orthogonal, scope a sibling phase.** Faster than retroactively expanding the originating phase, cleaner than rollback, preserves verification ledger continuity. v2.6 used it twice (Phase 60 → Phase 61 candidate-questions handoff, then Phase 63 → Phase 64 voter-results handoff).
6. **Reactivity-heavy refactors need a "cascade map" before execution.** v2.6 reactivity bugs (Phase 64 cascade fix) required 4 separate guards because the cascade chain wasn't enumerated up front — each guard surfaced the next missing one. A pre-execution cascade map (every $state → $derived edge in voter-flow context system) would have surfaced all 4 in one pass.
7. **Densifying default seed mid-milestone is a positive signal, not scope creep.** When manual smoke surfaces dead UI in a feature that exists in code (parties tab, categorical filters), the seed gap is real production debt — densify and continue. v2.6 default-seed densification (5 constituencies × 8 parties × 327 candidates) made future debugging dramatically easier.

### Cost Observations
- **Sessions:** Multiple sessions across phases; Phase 64 alone produced 35 commits in 1 day (the largest single-phase commit count in the milestone, driven by manual smoke fix-as-you-go cadence).
- **Model mix:** Predominantly Claude Opus 4.7 (1M context) for executor + planner agents; Sonnet 4.6 for plan-checker and verifier (per milestone default profile).
- **Wall-clock vs CPU:** ~4 days wall-clock; agent CPU substantially lower. Phase 64 manual smoke session was the wall-clock-heavy segment due to live UAT cadence.
- **Notable efficiency:** the Phase 62-bis pattern saved an entire rollback cycle. If Phase 60's SC-4 parity FAIL had triggered a Phase 60 retroactive expansion, the milestone would have grown 2-3 plans without separating concerns; instead, two sibling phases (61 + 64) absorbed the work cleanly.
- **Notable inefficiency:** the W-5 arithmetic-error preflight noise (one plan-step of unnecessary signal); the 4-layer cascade discovery iteration (~3 commits to enumerate all 4 guard sites).
- **Open artifact audit at close:** 1 verification gap (Phase 62 `human_needed`, resolved by Phase 64 manual smoke) + 18 pending todos (4 partially-resolved-by-v2.6 with audit additions; 14 carry-forward to v2.7 backlog).

---

## Milestone: v2.7 — Svelte 5 Polish + Supabase-Adapter Loose Ends

**Shipped:** 2026-05-08
**Phases:** 4 (65-68) | **Plans:** 9 | **Tasks:** 28

### What Was Built
- **Phase 65 (SVELTE5-01/02/03):** 92 `bind:*` directives audited and justified; 2 `{#key}` annotations + 1 Pattern B keyed each; 6 reactive-accessor destructure rewrites; CLAUDE.md "Context Destructuring Rule (Svelte 5)" subsection codifies the v2.6 P61-03 hazard with a 22-name reactive-accessor catalog.
- **Phase 66 (ADAPTER-01):** Zero `as unknown as` casts in `supabaseDataProvider.ts` over the v2.6 P64 reverse-fill pass; `InternalFlatNomination` defined once in sibling `.types.ts`. svelte-check baseline preserved (160 err / 12 warn); v2.6 parity gate `67p/1f/34c` identical to anchor.
- **Phase 67 (SEED-01):** Default seed ships 2 alliances + 10 alliance-noms + 30/10 org-nom parent split; v2.6 P64 alliance reverse-fill empirically exercised; 3 cross-cutting bugs surfaced + fixed during smoke. PASS-WITH-CONCERNS — alliance card render path deferred (3 lanes captured).
- **Phase 68 (DEVTOOLS-01/02/03):** Frontend autoreload via Turborepo `--watch` + Vite HMR + `vite-plugin-restart` for `.env`; root `yarn dev` composed via `concurrently`. ESLint gains `eslint-plugin-unused-imports` + `no-restricted-imports` `$lib`-preference + paraglide `ignores` (new rules: 0 violations). Deno IDE scope corrected to `apps/supabase/supabase/functions` (doubled `supabase/`; CONTEXT.md D-03 path was wrong); `.gitignore` carve-out for team-durable fix.

### What Worked
- **Discuss-phase batching across 4 phases (`/gsd-discuss-phase 65 66 67 68 --chain`):** all CONTEXT.md captured in one autonomous session 2026-04-29; Phase 66 scope narrowed mid-discussion (DB-01 deferred) without restarting the chain. The user-stated preference to "always discuss multiple independent phases together" paid off.
- **Cross-phase coherence by design:** SVELTE5 (65) → ADAPTER-01 (66) → SEED-01 (67) clustered intentionally so the cluster's integration test cycle ran once. Phase 67 SEED-01 validated Phase 66's `InternalFlatNomination` reverse-fill empirically — exactly the design intent.
- **Plan-checker first-iteration pass on Phase 68:** zero BLOCKERs, 4 non-blocking warnings. Tight `<read_first>` + `<acceptance_criteria>` + concrete `<action>` blocks paid off; the executor produced complete work without rework.
- **Critical correction surfaced in research, propagated through patterns + plans:** Phase 68 RESEARCH caught the `apps/supabase/functions` → `apps/supabase/supabase/functions` path bug in CONTEXT.md D-03 before the planner wrote tasks. Documented in commit body of `36ed3f459` for PR-review traceability.
- **Option C / Option B checkpoint pattern:** when Plan 68-02 (95 pre-existing lint errors) and Plan 68-03 (`.gitignore` carve-out) hit Rule 4 architectural decisions, the executor checkpointed cleanly with 4 numbered options each. User decision in seconds; no rework.
- **Hygiene-fix-before-close pattern:** the audit surfaced 4 hygiene gaps (SUMMARY frontmatter, REQUIREMENTS.md checkboxes, nyquist_compliant flags, manual smoke). Cleaned inline (~2 commits) before milestone close → archives are bookkeeping-consistent.

### What Was Inefficient
- **Phase 67 PASS-WITH-CONCERNS deferral:** alliance card render path discovered late (after Plan 67-01 + 67-02 executed). Three remediation lanes captured in pending todo — but earlier discovery during discuss-phase would have either folded a lane into Phase 67 or split the UI work into a separate phase. The `cardContents.alliance: []` seed empty-array choice + EntityCard render path's missing alliance branch is exactly the kind of "frontend wiring contract" that the cross-cutting Phase 67 fix burst should have caught one round earlier.
- **Phase 68 SUMMARY frontmatter `requirements_completed` empty across all 3 plans:** the executor populated tags + provides + affects + tech_stack but missed `requirements_completed`. Hygiene fix at close was easy, but auto-population from frontmatter `requirements:` would prevent the gap entirely.
- **Husky pre-commit hook bypass burden:** every commit (~25 across the milestone) required `git -c core.hooksPath=/dev/null` per the project memory workaround. The underlying global config issue should be fixed; the per-commit ceremony is friction.
- **VALIDATION.md `nyquist_compliant: false` left as draft** in 3/4 phases despite all 4 phases passing verification. The flag is a planner-stage marker that should auto-flip on verification PASS. Manual retroflip at audit time is not the right loop.

### Patterns Established
- **Adapter dataflow + seed empirical-exercise contract:** any `@openvaa/data` variant whose supabase adapter populates ids on the reverse-fill path MUST have a dual-emission constructor (`organizationNominationIds: ids[]` accepted alongside nested data). `OrganizationNomination` had this; `AllianceNomination` missed it (Phase 67 fix `643eea880` retrofitted). Pattern enforced going forward.
- **Full-block app_settings seed authoring:** client-side `mergeAppSettings` is a shallow `Object.assign` — partial overrides for top-level keys (e.g., `results: { sections: [...] }`) REPLACE the entire block. Seed authors must write the FULL block for any key they touch (Phase 67 cross-cutting fix `586412370`).
- **Override-pair pattern for entity types:** `alliances` table override + `nominations` table override emit separately; bulk_import routes by override key. Used for alliances; transfers to any future entity-with-nomination type.
- **Phase 64 attempt-4 protocol applies to all v2.7+ parity gates:** `yarn supabase:reset` (NOT `yarn dev:reset-with-data`) before Playwright capture — mixed default+e2e seed produces a 20-test cascade-failure false-positive (40 voter questions). Anchored in Phase 67 SUMMARY.
- **Path-correction-via-research pattern:** when CONTEXT.md contains a path/identifier the discuss-phase author couldn't verify, the phase-researcher MUST verify on disk (Phase 68's `apps/supabase/functions` → doubled-supabase correction). The PATTERNS map then carries the correction with a CRITICAL callout.
- **Single-source-of-truth ESLint preserved:** rule additions go in `packages/shared-config/eslint.config.mjs` only. Workspace-level overrides forbidden — root `eslint.config.mjs` re-exports the shared one in 1 line. Pattern from prior milestones; reaffirmed by Phase 68.
- **`.gitignore` carve-out (`!path`) is the canonical form** for tracking a single file inside a directory-ignored tree (must use `dir/*` then `!dir/single-file`, NOT `dir/` directly). Phase 68 Plan 68-03's discovery; documented in commit body of `36ed3f459`.
- **`requirements_completed` SUMMARY frontmatter is mandatory** — the milestone audit's 3-source cross-reference requires it. Hygiene gap discovered at v2.7 close; will enforce at execute-phase time going forward.

### Key Lessons
- **The cluster-coherence claim must hold under deferral pressure.** Phase 66 scope narrow mid-discuss-phase (DB-01 deferred) cut 2 plans. The cluster (SVELTE5 → ADAPTER-01 → SEED-01) still held because the *adapter typing* + *seeded alliance exercise* axes were the load-bearing pair, not the schema migration. Lesson: the cohesion invariant is the integration test cycle (cluster touches one set of files), not the requirement count.
- **Pre-existing tech debt surfaces at the gate, not before.** DEVTOOLS-02's `yarn lint:check` gate revealed 95 pre-existing apps/frontend errors that the v2.6 parity gate (E2E + visual) didn't catch. The pattern: when a milestone adds a NEW gate, accept that the gate will surface accumulated debt — pre-write the deferral plan rather than treating as a blocker.
- **User-approved checkpoints with numbered options are dramatically faster than open-ended escalation.** Both Plan 68-02 (Option C) and Plan 68-03 (Option B) checkpointed with 4 concrete tradeoff-tabulated options. User decision in seconds; total checkpoint round-trip ~2 minutes each. The alternative (executor narrative + user free-form decision) burns 10x the time.
- **Audit-as-gate works retroactively.** v2.7's milestone audit (`tech_debt` verdict) surfaced 4 hygiene gaps that the per-phase verifications had missed. The audit is a 3rd-line check, not redundant with phase verifications — it catches drift between SUMMARY/REQUIREMENTS/VERIFICATION cross-references.
- **Critical path corrections from RESEARCH outweigh CONTEXT.md authority.** Phase 68's `apps/supabase/functions` → doubled-supabase fix is the second time research has caught a CONTEXT.md path/identifier bug (first time: v2.6 Phase 62 had a similar route-naming correction). Lesson: discuss-phase captures intent; research-phase verifies on disk. The two stages are non-redundant by design.

### Cost Observations
- Model mix: ~70% opus (planner, researcher, executor), ~25% sonnet (plan-checker, integration-checker, verifier), ~5% haiku.
- Total commits across v2.7: 30 (per `git log` v2.6-tag → HEAD).
- Phase 65 timing: 90min P01 + 25min P02 (3 tasks each).
- Phase 66 timing: 60min single plan (4 tasks).
- Phase 67 timing: 25min P01 + 90min P02 (Plan P02 included 4 cross-cutting fix commits during manual smoke).
- Phase 68 timing: 137s P01 + ~21min P02 (with checkpoint) + ~3min P03 (with checkpoint).
- Notable efficiency: the autonomous chain (`/gsd-plan-phase 68 --chain`) ran research → plan → check → execute → verify in a single session (~25min total) once the user's two checkpoint decisions landed.
- Notable inefficiency: husky bypass `git -c core.hooksPath=/dev/null` ceremony on every commit — adds ~5s per commit × ~30 commits = ~2.5min of friction.

---

## Cross-Milestone Trends

*Note: Parallel branch milestones (sb-v2.0, sb-v3.0) are documented above but not included in cumulative quality metrics — those milestones will be re-executed on this branch during v2.0 integration.*

### Process Evolution

| Milestone | Commits | Phases | Plans | Avg/Plan | Key Change |
|-----------|---------|--------|-------|----------|------------|
| v1.0      | 147     | 7      | 31    | ~15min   | First milestone — established GSD workflow patterns |
| v1.1      | 87      | 6      | 15    | 7min     | Faster velocity — research-first, smaller phases |
| v1.2      | 96      | 7      | 14    | ~10min   | Largest codebase impact (861 files) — framework upgrade patterns |
| v1.3      | 99      | 5      | 19    | ~8min    | Content migration at scale (98 components) — runes patterns validated |
| v1.4      | 21      | 2      | 7     | ~10min   | Fastest milestone — established patterns, focused scope |
| v2.2      | 20      | 1/3    | 2     | ~19min   | First paused milestone — feasibility spike with rollback |
| v2.5      | 28      | 4      | 34    | ~3min    | Toolkit milestone — generators + parity-gate baseline-as-contract |
| v2.6      | 137     | 5      | 18    | ~32min   | Largest plan size to date — reactivity cascades + manual-smoke fix-as-you-go cadence |
| v2.7      | 30      | 4      | 9     | ~25min   | Cluster-coherence milestone — SVELTE5 → ADAPTER → SEED clustered for one integration cycle; first audit-as-gate close (`tech_debt`) |

### Cumulative Quality

| Milestone | Requirements | Coverage | Plans | Deferred |
|-----------|-------------|----------|-------|----------|
| v1.0      | 56/56       | 100%     | 31    | 0        |
| v1.1      | 23/24       | 96%      | 15    | 1 (VER-04, user choice) |
| v1.2      | 31/31       | 100%     | 14    | 0 (tech debt tracked, all reqs met) |
| v1.3      | 20/20       | 100%     | 19    | 0 (14 tech debt items, all non-blocking) |
| v1.4      | 10/10       | 100%     | 7     | 0 |
| v2.2      | 8/14        | 57%      | 2     | 6 (EVAL/RPT — milestone paused) |
| v2.5      | 16/16       | 100%     | 34    | 18 (carry-forward backlog at close) |
| v2.6      | 12/12       | 100%     | 18    | 18 (carry-forward + 3 new audit todos surfaced during smoke) |
| v2.7      | 8/8         | 100%     | 9     | 3 (alliance card render UI; 95 pre-existing frontend lint errors per Option C; @openvaa/supabase lint-script bug) |

### Top Lessons (Verified Across Milestones)

1. Infrastructure before features — invest in foundations first (v1.0 Phase 1, v1.1 Phase 8, v1.2 scaffold-first)
2. Research-first approach prevents backtracking — thorough upfront evaluation leads to confident decisions (v1.1, v1.2 OXC eval, v2.2 Deno)
3. Milestone audits catch real issues — gap closure is a validated 5-milestone pattern (v1.0, v1.1, v1.2, v1.3, v1.4)
4. End-to-end verification reveals what unit checks miss — fresh install tests (v1.1), E2E tests (v1.0, v1.3, v1.4), integration validation phase (v1.2)
5. Document deferred items with "why" — conscious deferral is fine, silent gaps accumulate
6. Fresh scaffold over in-place upgrade for major framework migrations — clean config, no legacy remnants (v1.2)
7. Dedicated evaluation phases are cheap insurance — 4 minutes to avoid premature migration (v1.2 OXC)
8. Migration order follows dependency flow — leaf → container → route prevents broken intermediate states (v1.3)
9. Validation gate as dedicated phase catches regressions other tools miss — now validated across 5 milestones
10. Established patterns compound — each subsequent milestone is faster than the last (v1.4 completed in 1 day vs v1.0's 11 days)
11. Feasibility studies should be scoped as spikes — validate fast, rollback if no forcing function, preserve research (v2.2)
12. Baseline-as-contract beats CI-retention parity gates (v2.5, v2.6) — commit Playwright JSON + diff script with grep-able verdict literal
13. Hard-assertion E2E surfaces latent defects that silent skips mask (v2.6) — replace `test.skip(true)` with `expect.poll(...).toBeGreaterThan(0)` to force the upstream to fix or fail visibly
14. Phase 62-bis pattern: when a milestone-anchor parity gate FAILs but regressions are orthogonal, scope a sibling phase (v2.6) — preserves verification ledger continuity, avoids retroactive expansion or rollback
15. Manual smoke catches what E2E doesn't (v2.6) — UX-class bugs (scroll preservation, badge persistence, portrait reload flicker) survive automated coverage; keep manual checkpoints for reactivity-heavy phases
16. Cluster phases by integration test cycle, not requirement count (v2.7) — SVELTE5 → ADAPTER → SEED clustered around the supabase-adapter dataflow so one round of integration testing covers the cluster; mid-discuss-phase scope narrow (DB-01 deferred) preserved cluster cohesion when 2 plans were cut from Phase 66
17. Numbered-options checkpoints save 10x time vs open-ended escalation (v2.7) — Plan 68-02 Option C and Plan 68-03 Option B each presented 4 concrete tradeoff-tabulated options; user decision in seconds; total round-trip ~2 minutes
18. New gates surface accumulated tech debt — pre-write the deferral plan, don't treat as a blocker (v2.7) — DEVTOOLS-02's `yarn lint:check` gate revealed 95 pre-existing apps/frontend errors that the v2.6 parity gate (E2E + visual) didn't catch; user-approved Option C deferral kept the milestone on track
19. Audit-as-gate is non-redundant with phase verifications (v2.7) — the 3-source cross-reference (REQUIREMENTS + VERIFICATION + SUMMARY frontmatter) catches drift between bookkeeping artifacts that per-phase checks miss; v2.7 audit surfaced 4 hygiene gaps fixed inline before close
