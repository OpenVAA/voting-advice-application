# Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 13 modified files (0 new) + 1 directory deletion
**Analogs found:** 11 / 13 (2 a11y fixes are design decisions, not copy-from-analog)

> **Nature of this phase:** fix-map, not new construction. Every change is a type-truth
> correction, a mechanical single-line edit, a dead-code/dir deletion, or an honest a11y
> markup fix — all against verified in-repo runtime signatures. The authoritative per-error
> fix map lives in `128-RESEARCH.md` §"Per-Error Fix Map"; this document adds the concrete
> in-repo **analogs to copy from** for each cluster. No source files are created.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `routes/candidate/(protected)/+layout.server.ts` | route (SSR load) | request-response | `.../dataProvider/supabaseDataProvider.test.ts` init call (already-correct serverClient init) | role+flow |
| `.../supabase/dataProvider/supabaseDataProvider.test.ts` | test | CRUD (mock) | its own working init at line ~130 (self-analog) | exact |
| `.../supabase/dataWriter/supabaseDataWriter.test.ts` | test | CRUD (mock) | supabaseDataProvider.test.ts typed mocks | exact |
| `.../supabase/adminWriter/supabaseAdminWriter.test.ts` | test | CRUD (mock) | supabaseDataProvider.test.ts typed init | exact |
| `contexts/auth/authContext.type.ts` + `authContext.svelte.ts` | context/provider | request-response | `universalDataWriter.ts:147` real signature | exact (mirror source-of-truth type) |
| `routes/candidate/(protected)/settings/+page.svelte` | route (component) | request-response | `PasswordSetter.svelte:80` hardcoded testid | exact |
| `lib/utils/viewTransition.ts` | utility | transform | TS 5.9.3 `lib.dom.d.ts` built-in `Document.startViewTransition` | authoritative-lib |
| `dynamic-components/entityDetails/EntityInfo.svelte` | component | transform | `entityTypes.ts:16` ENTITY_TYPE narrowing (dead-branch) | exact |
| `routes/(voters)/(located)/questions/+layout.svelte` | route (component) | request-response | `Button.svelte:185` numeric `tabindex={…}` | exact |
| `routes/candidate/(protected)/questions/[questionId]/+page.svelte` | route (component) | request-response | `Button.svelte:185` numeric `tabindex={…}` | exact |
| `dynamic-components/feedback/popup/FeedbackPopup.svelte` | component | event-driven | `Feedback.type.ts:37` SendingStatus union | exact |
| `lib/components/term/Term.svelte` | component (shared) | event-driven (a11y) | no direct analog — design decision (see below) | none |
| `apps/docs/src/routes/+page.svelte` | route (SSR page) | event-driven (a11y) | no direct analog — design decision (see below) | none |
| `contexts/_spikes-020-class-conversion/` (4 files) | test scaffolding | — | Phase 125 D-03 deletion of spikes 017–019 | exact precedent |
| `tests/tests/utils/testIds.ts` | test config | — | live `passwordSetter.*` entries (lines 138–140) | exact |

## Pattern Assignments

### Cluster A — serverClient seam: prod + test sites (13 errors, one root cause)

**The already-correct in-repo pattern (self-analog).** The prod call sites ALREADY pass
`serverClient` at runtime — the type at the call site is what lies. Copy the concrete-typing
shape from the test file's working init.

**Prod call sites** — `routes/candidate/(protected)/+layout.server.ts` (errors 27:28, 67:30):
```typescript
// Current (imports resolve to the concrete Supabase instance already):
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider'; // → adapters/supabase/dataProvider
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';       // → adapters/supabase/dataWriter

const dataWriter = await dataWriterPromise;
dataWriter.init({ fetch, serverClient: locals.supabase });   // 27 — errors: serverClient not in AdapterConfig
const dataProvider = await dataProviderPromise;
dataProvider.init({ fetch, serverClient: locals.supabase }); // 67 — same
```
`$lib/api/dataWriter` re-exports `dataWriter` from `./adapters/supabase/dataWriter`, so the
resolved instance IS the concrete `SupabaseDataWriter`/`SupabaseDataProvider` — the promise's
declared type is the base. **Fix (D-01, smallest honest diff):** annotate the awaited handle
to the concrete Supabase type (local annotation at the `await` site) so `.init()` accepts
`SupabaseAdapterConfig`. Do NOT widen `universalAdapter.type.ts`.

**Test call sites** — the working analog is IN the same test file:
```typescript
// supabaseDataProvider.test.ts ~line 130 — this init ALREADY typechecks (provider is concrete):
provider = new SupabaseDataProvider();
provider.init({
  fetch: vi.fn(),
  serverClient: asSupabaseMock(mockSupabase),  // ← use the asSupabaseMock helper
  locale: 'en',
  defaultLocale: 'en'
});
```
The 9 erroring `.init()` sites (134/181/230/…) plus the dataWriter/adminWriter test sites
should mirror this exact shape (concrete instance + `serverClient: asSupabaseMock(...)`).

**Pattern to preserve (Pitfall 2):** `prepareDataWriter.ts:14` calls `dataWriter.init({ fetch })`
on a `UniversalDataWriter` param — stays valid (`SupabaseDataWriter IS-A UniversalDataWriter`,
`{ fetch }` is a valid `SupabaseAdapterConfig`). Retype LOCALLY at call sites; do NOT narrow
the shared `prepareDataWriter` param.

---

### Cluster B — Password APIs (5 errors)

**Type source-of-truth analog:** `universalDataWriter.ts:147` — `setPassword(opts: WithAuth &
{ currentPassword: string; password: string })`. Widen the wrapper type to mirror it.

`settings/+page.svelte` (error 52:40) — call already passes the right shape:
```typescript
const { getRoute, setPassword, t, userData } = getCandidateContext();  // line 28
let currentPassword = $state('');                                       // line 35
const result = await setPassword({ currentPassword, password })...      // line 52 — errors
```
**Fix:** widen `AuthContext.setPassword` in `authContext.type.ts:41` from `(opts: { password })`
to `(opts: { currentPassword: string; password: string })`; update impl `authContext.svelte.ts:99–101`.
**Pitfall 1 (flag in SUMMARY):** Supabase `_setPassword` (`supabaseDataWriter.ts:83`) ignores
`currentPassword` — type widening is behavior-neutral; the settings-page currentPassword field
is UI-collected but backend-unverified (pre-existing, out of scope, file if not filed).

**Dead-prop analog (D-03)** — `PasswordSetter.svelte:80` hardcodes the testid:
```svelte
<!-- component already owns the id — no prop needed -->
data-testid="password-setter-confirmation"
```
`settings/+page.svelte:121` passes a dead `confirmPasswordTestId="settings-confirm-password"`
that fell into `restProps` and never rendered. **Fix:** delete line 121; reconcile
`testIds.ts:71` (remove dead `settings.confirmPassword`) — live ids are `passwordSetter.*`
(testIds.ts:138–140). Grep specs for `settings.confirmPassword` + `settings-confirm-password`
before removal.

**Register-signature analog** — `universalDataWriter.ts:43`: `register({ registrationKey, password })`.
`supabaseDataWriter.test.ts:353/363` pass `{ password }` only → add `registrationKey: '<fixture>'`.

---

### Cluster C — Scattered singles (6 errors)

**#20/#21 numeric tabindex** — analog `Button.svelte:185`:
```svelte
tabindex={isDisabled ? -1 : 0}   <!-- component prop typed number → numeric expression -->
```
`<QuestionHeading tabindex="-1">` passes string `"-1"`; `QuestionHeadingProps` types it `number`.
**Fix:** `tabindex={-1}`. **Pitfall 3:** raw-`<span>` string tabindexes (e.g. Term.svelte:95)
are FINE — only the two `<QuestionHeading>` component-prop sites need `{-1}`.

**#19 EntityInfo dead branch** — analog `entityTypes.ts:16` (`ENTITY_TYPE.Organization === 'organization'`).
Line 76 `{#if ... entityType === ENTITY_TYPE.Organization}` narrows to `'organization'`, so the
ternary `entityType === 'candidate' ? ... : 'organizations'` (line 80) is always `'organizations'`.
**Fix:** replace the dead ternary with the literal `'organizations'`. `entity: parentNomination.entityType`
(line 81) stays valid. (Verify — flag if it masks a logic bug per Claude's discretion.)

**#22 FeedbackPopup 'idle'** — analog `Feedback.type.ts:37`:
`SendingStatus = 'default' | 'sending' | 'sent' | 'error'`. The idle member is `'default'`.
**Fix:** `let status = $state<SendingStatus>('default')`. Do NOT extend the union.

**#18 viewTransition.ts** — analog is the authoritative TS lib, NOT an in-repo interface.
TS 5.9.3 `lib.dom.d.ts` ships `ViewTransition` (with `types: ViewTransitionTypeSet`) and
`Document.startViewTransition`. **Fix:** delete hand-rolled `ViewTransition` +
`DocumentWithViewTransition` (lines 17–28), use built-in `Document.startViewTransition` with a
runtime feature-check. Behavior-neutral.

**#23 thenable mock** — analog IN the same file (`supabaseDataProvider.test.ts:59`):
```typescript
then: undefined as unknown as PromiseLike<unknown>['then']
chain.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {...}
```
**Fix:** type the mock `then` to the standard `PromiseLike<T>['then']` shape (optional
`onfulfilled?`/`onrejected?`) rather than the hand-written non-optional-resolve signature.
No `any` (D-04).

---

### Cluster D — Test scaffolding (D-04/D-05)

**#24 LocalizedAnswers** — `supabaseDataWriter.test.ts:290`: image-answer `info` must be
`LocalizedString` (locale-keyed object) not `string`. **Fix:** `info: { en: '...' }` per the
project's `LocalizedString` shape (read the actual type at fix time — Assumption A1). No `any`.

**Spike deletion (D-05)** — analog: Phase 125 D-03 deletion of spikes 017–019.
Importer grep re-verified clean at map time:
```
grep -rn "_spikes-020|020-class-core|021-class-localstorage|022-class-version-bridge|023-class-ssr-effect" \
  apps/frontend/src --include=*.ts --include=*.svelte | grep -v "_spikes-020-class-conversion/"
# → zero external importers
```
**Fix:** delete the whole `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` dir
(4 `.spike.svelte.test.ts` files). Re-run the grep as the pre-deletion gate (125 precedent);
`yarn test:unit` green after.

---

### Cluster E — a11y warnings (D-06) — DESIGN DECISIONS, no copy-from analog

**E1 `Term.svelte:91`** (`a11y_no_noninteractive_tabindex`) — current markup:
```svelte
<span
  class="group relative"
  bind:this={triggerElement}
  role="term"          <!-- noninteractive role + tabindex="0" trips the rule -->
  tabindex="0"
  aria-describedby={visible ? definitionId : undefined}
  data-testid="voter-questions-term-trigger"   <!-- PRESERVE (E2E selector) -->
  onmouseenter=... onfocusin=... >              <!-- tooltip opens on focusin -->
```
Must stay keyboard-focusable + preserve testid + whitespace-FLUSH markup (comment lines 86–90).
Smallest honest fix that keeps focusability + tooltip UX wins (reconsider `role="term"` vs a
role the lint accepts with tabindex). **Flag chosen approach in SUMMARY** (Assumption A3).
This is the ONE production-DOM change with app-wide surface — E2E + visual sanity is the net.

**E2 `apps/docs/src/routes/+page.svelte:91`** (`a11y_no_static_element_interactions`) — current:
```svelte
<section
  ...
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}>            <!-- static element with handlers, no role -->
  <button ... onclick={() => scrollManually('prev')}>...   <!-- accessible nav ALREADY exists -->
  {#each screenshots as screenshot}
    <button ... onclick={() => toggleSelectedScreenshot(screenshot)}>...
```
Touch handlers are progressive enhancement; buttons already own accessible interaction.
**Fix:** add an appropriate ARIA role to the `<section>` (`role="group"`/`role="region"` +
descriptive label matching the carousel). Confirm `cd apps/docs && yarn check` → 0 warnings.

## Shared Patterns

### Concrete-adapter typing at the seam (D-01)
**Source of truth:** `supabaseAdapter.type.ts:9` (`SupabaseAdapterConfig`), consumed at
`supabaseAdapter.ts:28–54`.
**Apply to:** all 4 seam call sites (1 prod file + 3 test files) — type the handle concretely
where `serverClient` is passed; NEVER widen `universalAdapter.type.ts`; NEVER narrow
`prepareDataWriter`'s `UniversalDataWriter` param.

### Type-truth mirroring (D-02/D-04)
**Source of truth:** `universalDataWriter.ts` real signatures (`setPassword` :147, `register` :43).
**Apply to:** the context wrapper, settings page, and register test args — mirror the writer's
declared param shape; no `any`-casting to silence (D-04).

### Atomic per-cluster commits (workstream convention 123–127)
**Apply to:** commit boundaries — serverClient seam / password APIs / singles / spike deletion /
a11y warnings — so regressions bisect cleanly. Per-cluster gate: `cd apps/frontend && yarn check`
(confirm exact count drop, no net-new).

### Source-fix over acceptance comment (D-06)
**Convention:** `svelte-warning: accepted` is last resort. WCAG 2.1 AA is a project requirement —
fix a11y warnings at the markup source (both E1/E2).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/components/term/Term.svelte` | component | a11y | Bespoke tooltip-trigger role decision; no in-repo `role="term"`+tooltip precedent — small design decision (A3), flag choice in SUMMARY |
| `apps/docs/src/routes/+page.svelte` | SSR page | a11y | Touch-swipe carousel is docs-specific; role choice is a judgment call, not a copy-from |

## Metadata

**Analog search scope:** `apps/frontend/src` (routes, lib/api/adapters/supabase, lib/components,
lib/dynamic-components, lib/contexts, lib/utils), `apps/docs/src/routes`, `tests/tests`.
**Files scanned:** ~15 (targeted — every error site pre-read in RESEARCH.md).
**Pattern extraction date:** 2026-07-16
</content>
</invoke>
