# Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs - Research

**Researched:** 2026-07-16
**Domain:** TypeScript/Svelte type-error clearing (svelte-check), a11y warning remediation, test/spike scaffolding cleanup
**Confidence:** HIGH — every error site was read in-session; the fixes are mechanical type-truth corrections against verified runtime signatures.

## Summary

This is the fourth and final clearing phase of the svelte-check → 0 workstream. It is **not a research-heavy phase**: there are no new libraries, no external packages, and no architectural decisions. The value of this research is a **per-error fix map** — I read every one of the 24 frontend errors, the 1 frontend warning, and the 1 docs warning at its source and confirmed the runtime ground truth each type is (mis)describing.

The 24 errors decompose exactly as CONTEXT.md states: **13 collapse at the serverClient/AdapterConfig seam** (one root cause — call sites hold the writer/provider as the base `AdapterConfig`-typed init, which rejects the legitimate `serverClient` member that `SupabaseAdapterConfig` declares and the mixin consumes), **5 are password-API type mismatches**, and **6 are scattered singles**. The 2 a11y warnings are honest markup fixes (D-06). I verified the runtime behind each type lie so the planner can be certain the fixes are behavior-neutral — with **one flagged nuance** (the `setPassword` `currentPassword` is a runtime no-op in the Supabase adapter; see Pitfall 1).

**Primary recommendation:** Retype the 4 seam call sites to the concrete `SupabaseDataWriter`/`SupabaseDataProvider` (D-01, dissolves 13 errors with zero universal-layer change), widen `AuthContext.setPassword` to the writer's real param shape (D-02), drop the dead `confirmPasswordTestId` prop + reconcile the catalogue (D-03), apply 6 mechanical single-line fixes, delete `_spikes-020-class-conversion/` (verified zero external importers), and fix the two a11y warnings at source. Commit atomically per cluster (D-07 workstream convention) so regressions bisect cleanly.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| serverClient seam typing | API / Backend adapter layer | Frontend Server (SSR `+layout.server.ts`) | The Supabase server client is injected server-side from `hooks.server.ts`; the concrete adapter type belongs at the adapter boundary, not the universal layer |
| Password-API type shape | API / Backend adapter layer | Frontend (candidate context wrapper) | The writer owns the real signature; the context wrapper and settings page must match it |
| a11y markup (`Term.svelte`) | Browser / Client (shared component) | — | Interactive tooltip trigger; DOM/keyboard semantics |
| a11y markup (docs carousel) | Browser / Client (docs SSR page) | — | Touch-swipe progressive enhancement over existing buttons |
| Test/spike type correctness | Test infrastructure | — | Vitest specs + spike scaffolding; no product runtime |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Concrete typing at the seam.** Expose/consume the writer/provider as the concrete Supabase type where Supabase-specific config (`serverClient`) is passed — `routes/candidate/(protected)/+layout.server.ts` and the 3 adapter test files — so `init(config: SupabaseAdapterConfig)` typechecks naturally. Do NOT widen the universal `AdapterConfig` (would leak `SupabaseClient<Database>` into the adapter-agnostic layer) and do NOT introduce a generic `TConfig` param on the base hierarchy. Zero change to the universal layer. `prepareDataWriter`'s Phase-127 sync-`UniversalDataWriter` seam must keep compiling.
- **D-02 — Type-truth only; flows untouched.** Widen the context/wrapper type so the settings page's `setPassword({ currentPassword, password })` call matches the writer's real signature; fix the tests to pass what `register()` requires. The two Strapi-era flow-investigation todos stay backlog — no auth-flow branches deleted or redesigned.
- **D-03 — Kill the dead `confirmPasswordTestId` prop; rely on the hardcoded testid.** Do NOT add a prop. Drop the dead prop pass from `settings/+page.svelte:121`, keep the hardcoded component testids, and reconcile the testIds catalogue (remove or repoint the dead `settings.confirmPassword` entry at `tests/tests/utils/testIds.ts:71`).
- **D-04 — Fix test errors honestly.** Thenable mock, `LocalizedAnswers` image-answer shape, register-signature args — fixed by typing mocks/args to the real signatures. No `any`-casting to silence.
- **D-05 — Delete `_spikes-020-class-conversion/` entirely** (all 4 spike test files). Verify zero importers before deletion (same grep check as 125).
- **D-06 — Fix both a11y warnings at source.** Real markup fixes, not `svelte-warning: accepted` comments. `Term.svelte` 91:1 (`a11y_no_noninteractive_tabindex`); `apps/docs/src/routes/+page.svelte` 91:1 (`a11y_no_static_element_interactions`).
- **D-07 — Full workstream gate extended to docs.** Success = build + unit tests + frontend svelte-check **0 errors / 0 warnings** (24 → 0 exact) + `apps/docs` svelte-check **0 errors / 0 warnings** + one full green E2E run. Fresh dev server on :5173 (no Playwright webServer), `yarn db:reset` first; watch for the storage/imgproxy 502-wedge and orphaned Supabase stacks (127-03 precedent). Capture before/after counts.

### Claude's Discretion
- Exact mechanism for D-01's concrete typing (retype the export, local narrowing at the call sites, or typed accessor) — smallest honest diff wins; `prepareDataWriter` must keep compiling.
- Per-error fixes for the 6 scattered singles — mechanical type-truth fixes; for `viewTransition.ts` prefer adopting/aligning with TS's built-in View Transition types over maintaining a parallel interface.
- `EntityInfo.svelte` no-overlap comparison and the two `string`→`number` errors: determine which side lies and fix the lying side; flag in the SUMMARY if any masks a real logic bug.
- `FeedbackPopup` `'idle'`: extend `SendingStatus` or map the state — whichever reflects the actual state machine.
- Commit granularity — atomic per-cluster commits (serverClient seam / password APIs / singles / spike deletion / a11y warnings).
- Fallout rule (125 D-01): fix in-phase follow-on errors caused by this phase's changes; file genuinely pre-existing out-of-scope issues.

### Deferred Ideas (OUT OF SCOPE)
- Strapi-era auth-flow investigations (`password-reset-code-method.md`, `register-page-registrationkey-method.md`) — type the flows as-is; validity investigation stays backlog.
- RPC RETURNS-TABLE nullability audit (`2026-07-16-rpc-returns-table-nullability-audit.md`) — design task, backlog.
- View-transition flicker in results section (`2026-06-15-...`) — UI behavior work, only coincidentally adjacent to the `viewTransition.ts` type fix (which must stay behavior-neutral).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-07 | Resolve the long-tail scattered 1-per-file route/util/component type mismatches | The 6 scattered singles + the 2 prod seam sites in `+layout.server.ts` — all mapped below with concrete fixes |
| TYPE-08 | Resolve `.test.ts` / `.spike` type errors (fix or remove dead scaffolding) | 11 test-file seam errors + thenable mock + LocalizedAnswers + register args → typed honestly; `_spikes-020` deleted (zero importers verified) |
| TYPE-09 | Resolve the `apps/docs` a11y warning so monorepo svelte-check shows 0 warnings | `apps/docs/src/routes/+page.svelte:91` fix mapped below; frontend `Term.svelte:91` warning folded in under D-06 |

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule** — failing OR "did-not-run" E2E blocks completion; run the *whole* suite (`yarn test:e2e`) as the trust signal. No flaky exemptions.
- **TypeScript strict** — avoid `any`; prefer explicit types. (D-04 explicitly forbids `any`-casting to silence.)
- **WCAG 2.1 AA** — a11y is a project requirement; source-fix is convention-preferred over acceptance comments (drives D-06).
- **`svelte-warning: accepted` idiom** — last resort only; D-06 chooses source fixes.
- **Context Destructuring Rule (Svelte 5)** — reactive accessors (`ctx.dataRoot`, `appSettings`, etc.) must be read via direct property access; relevant if any single fix touches a Svelte reactive read (it does not, but stay alert if a fix moves a reactive read).
- **Localization** — user-facing strings must support locales (no new strings introduced by these fixes; `LocalizedString` is the type behind the `LocalizedAnswers` test error).
- **Code review checklist** — `.agents/code-review-checklist.md` mandatory.

## Per-Error Fix Map (the substance of this phase)

### Cluster A — serverClient / AdapterConfig seam (13 errors, ONE root cause) [VERIFIED: source read]

**Root cause:** `AdapterConfig` (`universalAdapter.type.ts:4`) is `{ fetch: Fetch | undefined }`. `SupabaseAdapterConfig` (`supabaseAdapter.type.ts:9`) extends it with `locale?/defaultLocale?/serverClient?: SupabaseClient<Database>`. The mixin `init()` (`supabaseAdapter.ts:28–54`) legitimately consumes `serverClient` at runtime. But the call sites hold the writer/provider typed such that `init()` accepts only the base `AdapterConfig`, so passing `{ fetch, serverClient }` errors with *"'serverClient' does not exist in type 'AdapterConfig'"*. **Runtime is already correct; only the static type at the call sites lies.**

**Fix (D-01):** give each call site the concrete Supabase type so `init(config: SupabaseAdapterConfig)` typechecks. Smallest honest diff (Claude's discretion): a local cast/annotation to the concrete `SupabaseDataWriter` / `SupabaseDataProvider` / `SupabaseAdminWriter` at each site, OR retype the imported handle. Do **not** touch `universalAdapter.type.ts`.

| # | File:line | Note |
|---|-----------|------|
| 1 | `routes/candidate/(protected)/+layout.server.ts` **27:28** | prod — `dataWriter.init({ fetch, serverClient: locals.supabase })` |
| 2 | `routes/candidate/(protected)/+layout.server.ts` **67:30** | prod — `dataProvider.init({ fetch, serverClient: locals.supabase })` |
| 3 | `adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` **60:7** | test |
| 4–12 | `adapters/supabase/dataProvider/supabaseDataProvider.test.ts` **134/181/230/276/307/479/900/1054/1124** | 9 test sites |
| 13 | `adapters/supabase/dataWriter/supabaseDataWriter.test.ts` **59:7** | test |

**Constraint to preserve:** `prepareDataWriter.ts:14` calls `dataWriter.init({ fetch })` on a `UniversalDataWriter` param — this stays valid because `SupabaseDataWriter IS-A UniversalDataWriter` and `{ fetch }` is a valid `SupabaseAdapterConfig`. Retyping the call sites to the concrete type must **not** narrow the `prepareDataWriter` param (Phase-127 seam). Verify `apps/frontend yarn check` still shows the 127 seam compiling after the retype.

> **Note on `+layout.server.ts`:** the two prod sites obtain the writer/provider via `await dataWriterPromise` / `await dataProviderPromise` (imports from `$lib/api/dataWriter` and `$lib/api/dataProvider`). Check what those promises resolve to — if already the concrete Supabase instance, a local annotation at the `await` site is the minimal fix; if typed as the universal base, cast at the `.init()` call.

### Cluster B — Password APIs (5 errors) [VERIFIED: source read]

**Real writer signatures** (`universalDataWriter.ts`):
- `setPassword(opts: WithAuth & { currentPassword: string; password: string })` (line 147)
- `register(opts: { registrationKey: string; password: string })` (line 43)

| # | File:line | Error | Fix (D-02/D-03) |
|---|-----------|-------|-----------------|
| 14 | `routes/candidate/(protected)/settings/+page.svelte` **52:40** | `currentPassword` not in `{ password: string }` | Widen `AuthContext.setPassword` type (`authContext.type.ts:41`) from `(opts: { password: string })` to `(opts: { currentPassword: string; password: string })`; update the impl (`authContext.svelte.ts:99–101`) param to match. See Pitfall 1. |
| 15 | `routes/candidate/(protected)/settings/+page.svelte` **121:11** | `confirmPasswordTestId` not a `PasswordSetter` prop | **D-03:** delete the `confirmPasswordTestId="settings-confirm-password"` line. Component already hardcodes `data-testid="password-setter-confirmation"` (`PasswordSetter.svelte:80`). |
| 16 | `adapters/supabase/dataWriter/supabaseDataWriter.test.ts` **353:44** | `{ password }` missing `registrationKey` | Pass `{ registrationKey: '<fixture>', password }` to `register()`. |
| 17 | `adapters/supabase/dataWriter/supabaseDataWriter.test.ts` **363:36** | same | same |
| — | `tests/tests/utils/testIds.ts` **71** | (no svelte-check error; catalogue reconciliation per D-03) | Remove the dead `confirmPassword: 'settings-confirm-password'` entry under `candidate.settings` (lines 68–73). Live ids are `candidate.passwordSetter.{password,confirm}` (lines 138–140). **Planner: grep specs for `settings.confirmPassword` and the raw string `settings-confirm-password` before removal** — the full E2E run doubles as proof nothing consumed it (D-03). |

### Cluster C — Scattered singles (6 errors) [VERIFIED: source read]

| # | File:line | Error | Fix |
|---|-----------|-------|-----|
| 18 | `lib/utils/viewTransition.ts` **26:11** | Local `DocumentWithViewTransition extends Document` conflicts — built-in `ViewTransition` now requires `types` | **TS 5.9.3's `lib.dom.d.ts` already ships `ViewTransition` (with `types: ViewTransitionTypeSet`) and `Document.startViewTransition`** (verified present in node_modules). Delete the hand-rolled `ViewTransition` + `DocumentWithViewTransition` interfaces (lines 17–28) and use the built-in `Document.startViewTransition` directly with a runtime feature-check. Behavior-neutral. Prefer this over adding `types` to the parallel interface (Claude's discretion — aligning with built-in was the stated preference). |
| 19 | `dynamic-components/entityDetails/EntityInfo.svelte` **80:28** | `'organization'` vs `'candidate'` no overlap | **Dead branch, NOT a logic bug.** Line 76's enclosing `{#if ... parentNomination.entityType === ENTITY_TYPE.Organization}` narrows `entityType` to `'organization'` (`ENTITY_TYPE.Organization === 'organization'`, verified). The ternary `parentNomination.entityType === 'candidate' ? 'candidates' : 'organizations'` (line 80) is always `'organizations'`. Fix: replace the dead ternary with the literal `'organizations'`. `entity: parentNomination.entityType` (line 81) stays valid (`'organization'`). |
| 20 | `routes/(voters)/(located)/questions/+layout.svelte` **232:11** | `string` → `number` | `<QuestionHeading ... tabindex="-1">` passes the **string** `"-1"`; `QuestionHeadingProps` extends `HeadingGroupProps` (HTML attrs) where `tabindex` is typed `number`. Fix: `tabindex={-1}` (numeric expression). |
| 21 | `routes/candidate/(protected)/questions/[questionId]/+page.svelte` **282:11** | `string` → `number` | Same `tabindex="-1"` on `<QuestionHeading>`. Fix: `tabindex={-1}`. |
| 22 | `dynamic-components/feedback/popup/FeedbackPopup.svelte` **35:38** | `'idle'` not in `SendingStatus` | `SendingStatus = 'default' \| 'sending' \| 'sent' \| 'error'` (`Feedback.type.ts:37`) — the initial/idle member is **`'default'`** (documented `@default 'default'` on `FeedbackProps.status`). `status` is initialized and passed down but never compared to `'idle'` elsewhere in the component. Fix: `let status = $state<SendingStatus>('default')`. (Do NOT extend the type — `'default'` already models the idle state; contrast the settings page's separate `ActionStatus` which legitimately has `'idle'`.) |
| 23 | `adapters/supabase/dataProvider/supabaseDataProvider.test.ts` **59:5** | thenable-mock `then` signature incompatible | The mock's `then` uses `(resolve, reject?) => ...` with a non-optional `resolve` and `unknown`-returning callbacks; the `PromiseLike.then` overload requires `onfulfilled?` optional and the generic `TResult` shape. Fix: type the mock's `then` to match `PromiseLike<T>['then']` (optional `onfulfilled?`/`onrejected?` params) rather than a hand-written signature. D-04: type honestly, no `any`. |

### Cluster D — Test scaffolding (D-04/D-05) [VERIFIED: source read]

| # | File:line | Error | Fix |
|---|-----------|-------|-----|
| 24 | `adapters/supabase/dataWriter/supabaseDataWriter.test.ts` **290:9** | image-answer `{ value: File; info: string }` not assignable to `LocalizedAnswer` — `info` must be `LocalizedString` not `string` | Wrap the `info` value as a `LocalizedString` (localized object, e.g. `{ en: '...' }` per the project's `LocalizedString` shape) so the mock matches `LocalizedAnswers`. D-04: no `any`-cast. |
| — | `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` (4 files) | currently error-free | **D-05: delete the entire directory.** Verified **zero external importers** (grep for `_spikes-020` + each filename basename outside the dir returned nothing). Findings preserved in `.planning/spikes/` + `spike-findings-voting-advice-application-gsd` skill. Planner should re-run the importer grep at execution time as the pre-deletion gate (125 precedent). |

### Cluster E — a11y warnings (D-06) [VERIFIED: source read]

**E1 — `apps/frontend/src/lib/components/term/Term.svelte:91` — `a11y_no_noninteractive_tabindex`**
- The `<span role="term" tabindex="0">` is a tooltip trigger (shows a definition popup on hover/focus; `aria-describedby` links it while visible; W3C APG tooltip pattern per the existing comment). `role="term"` is noninteractive, so a `tabindex="0"` on it trips the rule.
- The element genuinely needs to be keyboard-focusable (the tooltip opens on `focusin`). Options for the planner (judged against actual focus behavior):
  - **(a)** Change to an interactive role that carries a legitimate focusable semantic — but `role="button"` misrepresents a term, and the APG tooltip trigger is usually a `<button>`; converting to `<button>` risks layout/inline-flow and the whitespace-FLUSH constraint the comment guards.
  - **(b)** Keep `tabindex="0"` and satisfy the rule by giving the element a matching interactive intent — the lint accepts the pairing when the role is interactive; the cleanest honest fix that preserves the tooltip UX and inline `<span>` is to reconsider the role (e.g. drop `role="term"` and rely on `aria-describedby` + focusability, or use `role="button"` with `aria-label`).
  - Preserve the `data-testid="voter-questions-term-trigger"` (E2E selector) and the whitespace-FLUSH markup (comment lines 86–90) whatever the choice. This is the one production-DOM change with app-wide surface (shared voter/candidate component) — E2E + a quick visual sanity check are the net.
- **Recommendation to plan:** treat as a small design decision requiring a look at the tooltip's keyboard behavior; the smallest honest fix that keeps focusability + tooltip semantics wins. Flag the chosen approach in the SUMMARY.

**E2 — `apps/docs/src/routes/+page.svelte:91` — `a11y_no_static_element_interactions`**
- A `<section>` carries `ontouchstart`/`ontouchend` (swipe handlers for a screenshot carousel). The carousel **already has accessible prev/next `<button>`s** (lines 100–101) and per-screenshot `<button>`s (lines 106–109), so the touch handlers are **progressive enhancement**, not the sole interaction path.
- Fix: give the `<section>` an appropriate ARIA role so a static element with handlers is semantically declared. Since keyboard/button access already exists, a role annotation (e.g. `role="group"` / `role="region"` with a label, matching the carousel semantics) is the minimal honest fix; restructuring into an interactive element is unnecessary because the buttons already own the accessible interaction. Planner should pick the role that best describes the carousel region and confirm `apps/docs yarn check` → `0 WARNINGS`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| View Transition typing (`viewTransition.ts`) | A parallel `ViewTransition`/`DocumentWithViewTransition` interface | TS 5.9.3 `lib.dom.d.ts` built-in `Document.startViewTransition` + `ViewTransition` | The hand-rolled interface is now the *cause* of the error; the lib types exist and are authoritative (they added the `types` member) |
| PromiseLike thenable typing (dataProvider test 59:5) | A bespoke `then` signature | `PromiseLike<T>['then']` shape | Matching the standard-lib signature is the honest fix and avoids the overload mismatch |
| Confirm-password testid plumbing | A `confirmPasswordTestId` prop | The component's hardcoded `data-testid="password-setter-confirmation"` | D-03 — the prop never rendered (fell into form `restProps`); hardcoded id is the live E2E contract |

**Key insight:** every fix here is *removing* a hand-rolled lie or aligning to an already-authoritative type/runtime — not adding abstraction. The phase diff is dominated by test-file edits.

## Common Pitfalls

### Pitfall 1: `setPassword` `currentPassword` is a runtime no-op — widen the type but know it changes nothing at runtime [VERIFIED: source read]
**What could go wrong:** Widening `AuthContext.setPassword` to accept `{ currentPassword, password }` might imply the old password is now verified. It is not.
**Ground truth:** The Supabase `_setPassword` (`supabaseDataWriter.ts:83`) destructures **only** `{ password }` — `currentPassword` and `authToken` are ignored. The existing wrapper (`authContext.svelte.ts:99–101`) already hardcodes `currentPassword: ''` and forwards. The settings page collects a `currentPassword` input the backend never checks (Supabase session-based password change needs no old password — see the wrapper comment "old password requirement dropped per user decision").
**How to handle:** Widen the type + forward `opts.currentPassword` (behavior-neutral either way). Do NOT try to "fix" the flow — that's the deferred Strapi-era auth investigation. **Flag in SUMMARY:** the settings-page `currentPassword` field is a UI collection with no backend verification (pre-existing product concern, out of scope; file if not already filed).

### Pitfall 2: Concrete-typing the seam must not narrow the Phase-127 `prepareDataWriter` param
**What goes wrong:** Retyping the shared writer handle to `SupabaseDataWriter` at the module level could ripple into `prepareDataWriter(dataWriter: UniversalDataWriter)` and other universal consumers.
**How to avoid:** Prefer **local** narrowing/annotation at the 4 seam call sites over changing a shared exported type. Re-run `apps/frontend yarn check` and confirm the 127 seam still compiles (it should — `SupabaseDataWriter IS-A UniversalDataWriter`).

### Pitfall 3: The `tabindex` string→number fix is per-component-prop, not per-element
**What goes wrong:** `Term.svelte:95` uses `tabindex="0"` (string) on a raw `<span>` with NO error, but `QuestionHeading tabindex="-1"` errors. Don't "fix" the raw-element string tabindexes.
**Why:** Raw HTML elements accept string `tabindex`; **component props** typed `number` (via `HeadingGroupProps`) reject strings. Only the two `<QuestionHeading tabindex="-1">` sites need `tabindex={-1}`.

### Pitfall 4: E2E gate environment (D-07 / 127-03 precedent)
**What goes wrong:** Stale dev server steals :5173; storage/imgproxy 502-wedge; orphaned Supabase stacks squat ports 54321–54327.
**How to avoid:** Fresh single dev server on :5173 (no Playwright webServer), `yarn db:reset` first. If storage 502s: `supabase stop && supabase start`; check for orphaned stacks. "Did-not-run" counts as failure. See MEMORY `project_e2e_execution_devserver_prereq` + `project_phase124_e2e_blocker`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled `ViewTransition` DOM augmentation (repo's comment: "SvelteKit ships no View-Transition type as of this repo") | TS `lib.dom.d.ts` now ships `ViewTransition` (+ `types: ViewTransitionTypeSet`) and `Document.startViewTransition` | TS ≥ ~5.6; present in the repo's **5.9.3** | The custom interface is now *incompatible* with the built-in and must be deleted, not maintained |

## Package Legitimacy Audit

**N/A — this phase installs no external packages.** All changes are type annotations, markup fixes, file deletion, and test-mock corrections against existing in-repo signatures. No `npm install`, no new dependencies.

## Runtime State Inventory

This is a type/a11y/test phase, not a rename/migration. Only in-repo state changes:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore keys/collections touched | none |
| Live service config | None — no external service config | none |
| OS-registered state | None | none |
| Secrets/env vars | None referenced by the fixes | none |
| Build artifacts | `_spikes-020-class-conversion/` (4 `.spike.svelte.test.ts` files) removed from the unit sweep; testIds catalogue entry removed | Deletion + catalogue edit only — no reinstall needed. Re-run `yarn test:unit` to confirm the sweep is green post-deletion. |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Type gate | `svelte-check` via `yarn check` (run inside `apps/frontend` AND `apps/docs`) |
| Unit | `vitest` — `yarn test:unit` |
| E2E | `playwright` — `yarn test:e2e` (full suite is the trust signal) |
| Quick run | `apps/frontend && yarn check` (per-cluster type re-check) |
| Full suite | `yarn build && yarn test:unit && yarn test:e2e` + both `yarn check`s |

### Phase Requirements → Gate Map
| Req | Behavior | Check | Command |
|-----|----------|-------|---------|
| TYPE-07 | scattered singles + prod seam resolved | svelte-check delta | `cd apps/frontend && yarn check` (watch the 6 single + 2 prod sites clear) |
| TYPE-08 | test/spike errors resolved | svelte-check + unit | `yarn check` + `yarn test:unit` (confirm spike deletion leaves green sweep) |
| TYPE-09 | docs a11y warning resolved | docs svelte-check | `cd apps/docs && yarn check` → `0 ERRORS 0 WARNINGS` |
| all | no runtime regression | full E2E | `yarn test:e2e` (cardinal — last green 125/0/0 at Phase 127 close) |

### Sampling Rate
- **Per cluster commit:** `cd apps/frontend && yarn check` (frontend) / `cd apps/docs && yarn check` (docs cluster). Confirm the exact error count drops by the expected amount (13 / 5 / 6 / etc.), no net-new.
- **Phase gate:** frontend `24 → 0 errors / 1 → 0 warnings` (exact), docs `0 errors / 1 → 0 warnings`, `yarn build` green, `yarn test:unit` green, one full green `yarn test:e2e`.

### Wave 0 Gaps
None — svelte-check, vitest, and Playwright infrastructure all exist and are green at Phase 127 close (baseline saved at `svelte-check-128-baseline.txt`). No new test files needed; the fixes are verified by the existing gates.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript | svelte-check | ✓ | 5.9.3 (catalog) | — |
| svelte-check / `yarn check` | TYPE-07/08/09 gate | ✓ | repo-pinned | — |
| Node/yarn 4 | build + tests | ✓ | repo-pinned | — |
| Local Supabase + dev server | E2E gate (D-07) | ✓ (per MEMORY `project_gsd_repo_e2e_runs_clean`) | local CLI | none — E2E is cardinal, must run |

**Missing dependencies:** none. The -gsd repo runs E2E clean via host Vite + local Supabase (95/0 baseline; 125/0/0 at Phase 127 close) — no Docker/LocalStack blocker here.

## Security Domain

**Not applicable in the enforcement sense** — this phase changes no auth logic, adds no attack surface, and introduces no input-handling. The password-API changes (Cluster B) are **type widening only**; the runtime password flow (Supabase session-based `updateUser`) is untouched (D-02). One security-adjacent observation for the record (not a change in this phase): the settings page collects a `currentPassword` the Supabase backend does not verify (Pitfall 1) — pre-existing, deferred to the Strapi-era auth-flow backlog investigation. No ASVS category is materially affected by the fixes.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `LocalizedString` shape for the dataWriter test 290 fix is a locale-keyed object (e.g. `{ en: '...' }`) | Cluster D #24 | Low — planner/executor reads the actual `LocalizedString` type at fix time; the error message already pins the required shape |
| A2 | The two prod `+layout.server.ts` seam sites are best fixed by local annotation at the `.init()`/`await` site (vs. retyping `dataWriterPromise`) | Cluster A | Low — either works; "smallest honest diff" is Claude's discretion (D-01). The constraint (don't narrow `prepareDataWriter`) is verified, not assumed |
| A3 | `Term.svelte` a11y fix keeps focusability via a role/markup adjustment rather than a full `<button>` conversion | Cluster E1 | Medium — the right fix depends on a close read of the tooltip's keyboard behavior at plan time; flagged for a small design decision + SUMMARY note |

**All other claims are `[VERIFIED: source read]`** — every error site, type definition, and runtime signature was read in-session.

## Open Questions

1. **`Term.svelte` role choice (E1)**
   - What we know: element must stay keyboard-focusable (tooltip opens on `focusin`); `role="term"` + `tabindex="0"` trips the lint; testid + whitespace-FLUSH markup must survive.
   - What's unclear: whether the team prefers dropping `role="term"`, switching to `role="button"`/`<button>`, or another interactive semantic.
   - Recommendation: plan a minimal role/markup change that preserves focusability + tooltip UX + testid; verify with E2E + visual sanity; document the choice in SUMMARY.

2. **docs carousel role choice (E2)**
   - What we know: buttons already provide accessible navigation; touch handlers are enhancement; a role annotation satisfies `a11y_no_static_element_interactions`.
   - Recommendation: `role="group"`/`role="region"` with a descriptive label matching the carousel; confirm `apps/docs yarn check` → 0 warnings.

## Sources

### Primary (HIGH confidence — in-session source reads)
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` — the 2 prod seam sites
- `apps/frontend/src/lib/api/base/universalAdapter.type.ts` + `adapters/supabase/supabaseAdapter.type.ts` — base vs concrete config types
- `apps/frontend/src/lib/api/base/universalDataWriter.ts` — real `setPassword`/`register`/`resetPassword` signatures
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:83` — `_setPassword` ignores `currentPassword` (Pitfall 1 ground truth)
- `apps/frontend/src/lib/contexts/auth/authContext.type.ts` + `authContext.svelte.ts:99–101` — the setPassword wrapper to widen
- `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts` — the Phase-127 seam to preserve
- `apps/frontend/src/lib/utils/viewTransition.ts` — hand-rolled interface to delete
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:75–81` + `packages/data/src/objects/entities/base/entityTypes.ts:16` — dead-branch narrowing
- `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.type.ts` + the two `+layout.svelte`/`+page.svelte` tabindex sites
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts:37` + `FeedbackPopup.svelte:35` — SendingStatus members
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` + `.type.ts` + `settings/+page.svelte` — D-03 dead prop
- `tests/tests/utils/testIds.ts:68–73,138–140` — catalogue reconciliation
- `apps/frontend/src/lib/components/term/Term.svelte:81–107` + `apps/docs/src/routes/+page.svelte:91–113` — a11y sites
- `node_modules/typescript/lib/lib.dom.d.ts` — confirmed built-in `ViewTransition`/`Document.startViewTransition` (TS 5.9.3)
- `svelte-check-128-baseline.txt` — the 24/1 + 0/1 verified baseline

### Secondary
- CONTEXT.md (D-01…D-07 + verified decomposition) — the authoritative scope

## Metadata

**Confidence breakdown:**
- Per-error fix map: HIGH — every site read; runtime signatures verified
- serverClient seam (13 errors): HIGH — root cause + preserve-constraint verified
- Password APIs + Pitfall 1: HIGH — writer impl confirmed to ignore `currentPassword`
- a11y fixes: MEDIUM — the *warning cause* is verified; the *chosen fix* is a small design decision (A3, Open Questions)
- Spike deletion: HIGH — zero external importers verified

**Research date:** 2026-07-16
**Valid until:** ~2026-08-16 (stable; the only external dependency is the TS lib.dom types, already pinned at 5.9.3)
