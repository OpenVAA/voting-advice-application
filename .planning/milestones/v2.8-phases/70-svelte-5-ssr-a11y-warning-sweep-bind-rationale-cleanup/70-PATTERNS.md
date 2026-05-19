# Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup — Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 8 files modified (5 Cat A + 1 Cat B + 1 Cat C + 1 Cat D + 27 sites for BIND)
**Analogs found:** 8 / 8 (every file has a clear in-tree pattern to copy)

**Note (hygiene phase):** All files modified are EXISTING files. Each "analog" below is the closest already-fixed file showing the canonical Svelte 5 / SSR / a11y / runes pattern, NOT a structurally-similar new-file template.

---

## File Classification

| File Modified | Plan | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/components/expander/Expander.svelte` | 70-01 (Cat A) | component | request-response (UI prop) | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56` | exact |
| `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` | 70-01 (Cat A) | component | request-response (UI filter) | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56` | exact |
| `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` | 70-01 (Cat A) | component | request-response (UI filter) | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56` | exact |
| `apps/frontend/src/routes/admin/login/+page.svelte` | 70-01 (Cat A) | route page | request-response (form init) | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56` | exact |
| `apps/frontend/src/routes/candidate/register/+page.svelte` | 70-01 (Cat A) | route page | request-response (form init) | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56` | exact |
| `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 70-02 (Cat B) | component (slot wrapper) | event-driven (polling shell) | `apps/frontend/src/routes/admin/+layout.svelte:17-19,58` | exact |
| `apps/frontend/src/lib/components/input/Input.svelte` | 70-03 (Cat C) | component (form control) | request-response (file input) | (in-tree `<button>` patterns + `// svelte-warning: accepted —` D-05 fallback) | partial |
| `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 70-04 (Cat D) | component (polling shell) | event-driven (SSR-gated fetch) | `apps/frontend/src/lib/components/video/Video.svelte:220` (`onMount(() => …)` init) | exact |
| 27 sites across `apps/frontend/src/lib/**/*.svelte` | 70-05 (BIND) | (comment-only) | (n/a) | regex strip — not a code analog (see §Plan-70-05) | n/a |

---

## Pattern Assignments

### Plan-70-01 — Category A `state_referenced_locally` (5 files, 9 sites)

#### Site A1: `apps/frontend/src/lib/components/expander/Expander.svelte:76` (`defaultExpanded`)

**Analog:** `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56`

**Pattern summary:** Init-only seed of a `$state` from a parent prop where the contract is "render-time-only — parent does not toggle post-mount". Use `// svelte-ignore state_referenced_locally` immediately above the line, with a one-line comment documenting the init-only intent (the existing prose pattern: "Reading the prop inside the initializer is intentional: we want the initial seed, not a reactive dependency.").

**Code excerpt — analog (LogoutButton.svelte:50-56):**
```svelte
// reference to TimedModal
let timedModalRef: TimedModal | undefined = $state();
// `timeLeft` is bound by TimedModal (countdown ticks); seed from the
// prop's initial value. Reading the prop inside the initializer is
// intentional: we want the initial seed, not a reactive dependency.
// svelte-ignore state_referenced_locally
let timeLeft = $state(logoutModalTimer);
```

**Apply to Expander.svelte:76 — current code:**
```svelte
// BEFORE
let expanded = $state(defaultExpanded);
```

**Target shape:**
```svelte
// AFTER (Option A — init-only intent, audit-confirmed in Plan-70-01 Task 2)
// `defaultExpanded` is a render-time-only prop; consumers do not
// toggle it after mount. Seed once, then own state locally.
// svelte-ignore state_referenced_locally
let expanded = $state(defaultExpanded);
```

**Pitfall callout:** RESEARCH.md §Pitfall 1 — if the audit finds a parent that DOES toggle `defaultExpanded` post-mount, switch to Option B (`let expanded = $state(false); $effect(() => { expanded = defaultExpanded; });`). Default to Option A per RESEARCH.md §Confirmed Warning Sites verdict.

---

#### Sites A2–A4: `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte:41,45` (`filter`, `targets`)

**Analog:** Same as A1 — `LogoutButton.svelte:50-56`.

**Pattern summary:** `const range = filter.parseValues(targets)` reads two props at module-eval time. Per the assumed-stable contract (`filter` and `targets` do not change post-mount; sister `EntityList.svelte` remounts via `{#key}` on filter-scope change), use `// svelte-ignore state_referenced_locally` with a single justification comment covering both reads.

**Apply to NumericEntityFilter.svelte:41 — current code:**
```svelte
// BEFORE (line 41)
// Initialize values and possibly saved filter state
const range = filter.parseValues(targets);
updateValues();

// Update selection when filter values change
filter.onChange(updateValues);
```

**Target shape:**
```svelte
// AFTER
// `filter` and `targets` are stable per parent contract:
// EntityList remounts via {#key} on filter-scope change, so the
// init-time read here matches the component lifecycle. No reactive
// re-derivation needed.
// svelte-ignore state_referenced_locally
const range = filter.parseValues(targets);
updateValues();

filter.onChange(updateValues);
```

**Note:** RESEARCH.md flags A4 (`filter` 2nd ref at line 45 inside `filter.onChange(updateValues)`). The single `// svelte-ignore` directly above the `parseValues` line silences the parseValues read; the `filter.onChange` read on line 45 is a separate warning that needs its own ignore comment (or one ignore + reordering so a single sentinel covers both). Plan-70-01 Task 2 verifies the warning-line precision with `yarn workspace @openvaa/frontend check` after each edit.

---

#### Sites A5–A7: `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:48,65` (`filter`, `targets`)

**Analog:** Same as A1 — `LogoutButton.svelte:50-56`.

**Pattern summary:** Same shape as NumericEntityFilter. The `const values = filter.parseValues(targets)` at line 48 is the primary read; the line 65 `filter.onChange` reads `filter` again.

**Apply to EnumeratedEntityFilter.svelte:48 — current code:**
```svelte
// BEFORE (line 48)
// Initialize values and possibly saved filter state
const values = filter.parseValues(targets);
let selected: Array<MaybeMissing<string>> = $state([]);
```

**Target shape:**
```svelte
// AFTER
// `filter` and `targets` are stable per parent contract (sister
// component NumericEntityFilter follows the same pattern).
// svelte-ignore state_referenced_locally
const values = filter.parseValues(targets);
let selected: Array<MaybeMissing<string>> = $state([]);
```

---

#### Site A8: `apps/frontend/src/routes/admin/login/+page.svelte:60` (`errorMessage`)

**Analog:** `LogoutButton.svelte:50-56` — same init-only seed pattern.

**Pattern summary:** `if (errorMessage) status = 'error';` is genuinely init-once code (translates `errorParam` → `errorMessage` once at mount, then sets `status` once). Wrap with `// svelte-ignore state_referenced_locally` plus a one-line "init-only" justification.

**Apply to admin/login/+page.svelte:60 — current code:**
```svelte
// BEFORE (line 60)
if (errorParam) {
  const errorKey = getErrorTranslationKey(errorParam);
  if (errorKey) errorMessage = t(errorKey);
}
if (errorMessage) status = 'error';
```

**Target shape:**
```svelte
// AFTER
if (errorParam) {
  const errorKey = getErrorTranslationKey(errorParam);
  if (errorKey) errorMessage = t(errorKey);
}
// One-shot init-only translation of URL ?error= → status; subsequent
// errorMessage updates flow through form-action handlers.
// svelte-ignore state_referenced_locally
if (errorMessage) status = 'error';
```

---

#### Site A9: `apps/frontend/src/routes/candidate/register/+page.svelte:39` (`registrationKey`)

**Analog:** `LogoutButton.svelte:50-56`.

**Pattern summary:** `if (registrationKey) checkKeyAndContinue(registrationKey);` reads `registrationKey` (`$state` initialised from URL search-param) twice at component-init. Genuine init-only invocation.

**Apply to candidate/register/+page.svelte:39 — current code:**
```svelte
// BEFORE (line 39)
// Get key from search params
let registrationKey = $state(page.url.searchParams.get('registrationKey') ?? '');
if (registrationKey) checkKeyAndContinue(registrationKey);
```

**Target shape:**
```svelte
// AFTER
let registrationKey = $state(page.url.searchParams.get('registrationKey') ?? '');
// One-shot init-only kickoff: validate the key from URL on mount.
// Subsequent registrationKey changes are tracked by the $effect at
// line 43-48 (the changedAfterCheck flag).
// svelte-ignore state_referenced_locally
if (registrationKey) checkKeyAndContinue(registrationKey);
```

---

### Plan-70-02 — Category B `<slot />` → `{@render children()}` (1 file)

#### Site B1: `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:28`

**Analog:** `apps/frontend/src/routes/admin/+layout.svelte:17-19,58`

**Pattern summary:** Canonical Svelte 5 children-snippet rendering. Three things to bring together: (1) `import type { Snippet } from 'svelte'` in the imports block; (2) `let { children }: { children: Snippet } = $props();` early in the script; (3) replace `<slot />` with `{@render children?.()}` in the template.

**Code excerpt — analog (admin/+layout.svelte:17-19, 58):**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  // ... other imports ...
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  // ... rest of script ...
</script>

<!-- ... markup ... -->
{@render children?.()}
```

**Apply to WithPolling.svelte — current code (full file is ~28 lines):**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();
  onDestroy(() => stopPolling());
</script>

<slot />
```

**Target shape (BEFORE Plan-70-04 applies — Plan-70-04 will then move startPolling into onMount):**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();
  onDestroy(() => stopPolling());
</script>

{@render children?.()}
```

**Pitfall callout:** RESEARCH.md §Pitfall 2 — forgetting the `Snippet` import or the `$props()` declaration causes svelte-check failures. Both must land in the same patch.

**Sequencing note:** Plan-70-04 also touches WithPolling.svelte (the SSR fetch fix). Per RESEARCH.md §Plan-70-02 wave assignment, Plan-70-04 should land AFTER Plan-70-02 to avoid script-block merge friction.

---

### Plan-70-03 — Category C `a11y_no_noninteractive_element_interactions` (1 file)

#### Site C1: `apps/frontend/src/lib/components/input/Input.svelte:521`

**Analog:** No exact in-tree analog for the specific `<label>` → `<button>` swap. Plan-70-03 Task 1 picks one of two paths per RESEARCH.md §Pattern 3:

**Pattern summary (Option A — preferred):** Promote the custom-styled `<label>` to a `<button type="button">` with the same classes, since the `<label>` is semantically functioning as a button (has `tabindex="0"`, `onclick`, and `onkeydown` already). The `<input type="file">` keeps its own `<label for="{id}">` association via the existing `aria-labelledby` chain.

**Pattern summary (Option B — fallback if Option A breaks DaisyUI styling):** Add `role="button"` to the `<label>` and use the D-05 inline justification format `// svelte-warning: accepted — <reason>` immediately before the markup. Keep the existing `// svelte-ignore a11y_no_noninteractive_element_interactions` pragma.

**Code excerpt — current (Input.svelte:520-545):**
```svelte
<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_label_has_associated_control -->
<label
  id="{id}-image-label"
  tabindex="0"
  class="text-primary flex h-60 justify-stretch"
  class:cursor-pointer={!isDisabled}
  onclick={() => fileInput?.click()}
  onkeydown={handleFileInputLabelKeydown}>
  {#if isLoading}
    <Loading inline />
  {:else if url}
    <!-- ... -->
  {/if}
</label>
```

**Target shape (Option A — `<button>` promotion):**
```svelte
<button
  type="button"
  id="{id}-image-label"
  class="text-primary flex h-60 justify-stretch"
  class:cursor-pointer={!isDisabled}
  disabled={isDisabled}
  onclick={() => fileInput?.click()}
  onkeydown={handleFileInputLabelKeydown}>
  {#if isLoading}
    <Loading inline />
  {:else if url}
    <!-- ... -->
  {/if}
</button>
```

**Target shape (Option B — accepted-warning fallback):**
```svelte
<!-- svelte-warning: accepted — custom <label> trigger preserves the
     <input type="file"> aria-labelledby association used by screen
     readers; promoting to <button> would remove the form-control
     semantics that DaisyUI .label classes depend on. Keyboard +
     mouse parity provided by tabindex="0" + onkeydown handler. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_label_has_associated_control -->
<label
  id="{id}-image-label"
  role="button"
  tabindex="0"
  ...>
```

**Pitfall callout:** RESEARCH.md §Pitfall 3 — `<button>` swap may break DaisyUI `.label` styling. Plan-70-03 Task 1 includes a manual visual smoke (candidate-app image upload zone). If smoke fails, switch to Option B.

---

### Plan-70-04 — Category D SSR `fetch`-eagerness (1+ files, capture-driven)

#### Primary Site D1: `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:24` (`startPolling()`)

**Analog:** `apps/frontend/src/lib/components/video/Video.svelte:220`

**Pattern summary:** Wrap a side-effecting init call in `onMount(() => …)` so it runs only on the client, not during SSR. The closure can also return its own cleanup, OR a separate `onDestroy` can keep the `stopPolling()` symmetry.

**Code excerpt — analog (Video.svelte:220):**
```svelte
onMount(() => setShouldPlay(!!autoPlay));
```

**Apply to WithPolling.svelte (post-Plan-70-02 baseline) — current shape after Cat B fix:**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();        // ← fires fetch synchronously at SSR module-eval. BAD.
  onDestroy(() => stopPolling());
</script>
```

**Target shape (Option A — preferred, single onMount with cleanup):**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  onMount(() => {
    startPolling();
    return () => stopPolling();
  });
</script>
```

**Target shape (Option B — `if (browser)` guard, only if onMount return-cleanup is not idiomatic for this site):**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  if (browser) startPolling();
  onDestroy(() => browser && stopPolling());
</script>
```

**Pitfall callout:** RESEARCH.md §Pitfall 6 — moving `fetch` to `onMount` is correct ONLY IF the data is browser-only (admin polling matches this — the page paints without polling-data). For sites whose fetched data is rendered during SSR for the initial paint, the fix is `+page.ts` / `+layout.ts` `load({ fetch })` instead. The `WithPolling.svelte` site is admin-only and `onMount` is correct.

#### Additional Sites (capture-driven, pending Plan-70-04 Task 1)

Per RESEARCH.md §Confirmed Warning Sites Category D, the WithPolling.svelte hypothesis is the only static-analysis candidate. Other sites must be discovered via cold-start dev-server log capture. For each additional site Task 1 surfaces:

- **If the data is needed for SSR initial paint:** Move to the route's `+page.ts` / `+layout.ts` `load({ fetch })`. Analog: any existing `load()` function in `apps/frontend/src/routes/**/+page.ts` (e.g., `apps/frontend/src/routes/(voters)/+layout.ts` or similar load-using routes).
- **If the data is browser-only enrichment:** Apply the WithPolling Option A `onMount(() => …)` pattern above.

---

### Plan-70-05 — BIND-01 strip (27 sites, comment-only)

**This is NOT a code-pattern application — it's a regex strip.** No code analog. The "pattern" is a strip rule + a multi-line preservation rule.

#### Strip rule

**Target regex:** `// bind: (keep|ok|justified)` (matches the v2.7 Phase 65 audit-trail comment family).

**Per-file approach:** Use the `Edit` tool per file, NOT a mass `sed` over the tree. RESEARCH.md §Plan-70-05 Code Examples Codemod recipe explicitly recommends per-file Edit calls for diff reviewability (27 sites is small enough to be tractable).

**Verification commands (run pre + post strip):**
```bash
# Pre-strip count (current baseline)
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/   # expected: 26 hits

# Post-strip count (after applying strip)
git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/   # expected: 0 hits

# Sanity: bind:* directive count must be UNCHANGED pre vs post
grep -rE "(\<|^)bind:" apps/frontend/src/lib/ --include="*.svelte" | grep -v "^.*://" | wc -l
```

#### Multi-line continuation strip

For sites where the `// bind:` comment is multi-line (per RESEARCH.md, currently only `apps/frontend/src/lib/components/video/Video.svelte:117` 1-liner and `Video.svelte:164-165` 2-liner — but verify with `git grep -nE "// bind: (keep|ok|justified)" -A 3` per file before edit), the strip MUST also remove the consecutive `// ` continuation lines that flow from the matched sentinel.

**Example — multi-line strip (Video.svelte:164-165 shape):**
```ts
// BEFORE (2 lines)
  // bind: keep — single-ref `bind:this={video}`; the four below feed
  // two-way DOM `<video>` properties (bind:currentTime/duration/muted/paused).
  let video: HTMLVideoElement | undefined = $state();

// AFTER (0 lines of comment)
  let video: HTMLVideoElement | undefined = $state();
```

**Single-line strip (most common — 24 of 26 hits are inside `<!--@component -->` doc blocks as `// bind: keep — usage example in @component doc`):**
```ts
// BEFORE
{#each values as { value, object, count }}
  <label class="label gap-sm cursor-pointer !items-start !p-0">
    <!-- Disable the input if there is only one value -->
    <!-- bind: keep — two-way DOM checkbox group bind:group={selected}; selected is $state -->
    <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} disabled={values.length === 1} />

// AFTER
{#each values as { value, object, count }}
  <label class="label gap-sm cursor-pointer !items-start !p-0">
    <!-- Disable the input if there is only one value -->
    <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} disabled={values.length === 1} />
```

#### Critical preservation rule (DO NOT STRIP)

**MUST preserve:** `apps/frontend/src/lib/components/input/Input.svelte:214-217`. This is a multi-line `// bind: migrate —` comment that documents a permanent Svelte-5 migration record (the `mainInputs` array `$state` requirement after Phase 64), NOT an audit-time `// bind: keep —` justification.

**Exact preservation target — DO NOT TOUCH (Input.svelte:214-217):**
```ts
  // bind: migrate — `mainInputs` must be $state in Svelte 5 because
  // `bind:this={mainInputs[i]}` mutates a property on it. A plain array
  // triggers `binding_property_non_reactive`. Mirrors the Phase 64 fix
  // at QuestionChoices.svelte:122-124.
  const mainInputs: Array<HTMLElement> = $state([]);
```

The strip regex `// bind: (keep|ok|justified)` does NOT match `// bind: migrate —` by design. The `migrate` token is explicitly excluded from the strip regex. Verify with `git grep -n "// bind: migrate" apps/frontend/src/lib/` before AND after the strip — count should be unchanged (1 hit).

#### Verification of post-strip diff is COMMENT-ONLY

```bash
# No bind:* directive lines added or removed
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^+" | grep "bind:"           # expected: 0
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^-" | grep -E "^-\s*<.*bind:" # expected: 0

# All deletions are `// bind: ` comment lines or their continuations
git diff HEAD~1 HEAD -- apps/frontend/src/lib/ | grep "^-" | grep -vE "^-(\s*//.*bind:|\s*//\s)"  # expected: 0
```

#### Atomic commit

**Commit message** (per source todo `.planning/todos/pending/2026-05-08-cleanup-65-01-bind-rationale-comments.md`):
```
chore(70-05): strip Phase 65-01 // bind: (keep|ok|justified) rationale comments — audit complete

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Commit hook workaround:** Project memory `project_gsd_repo_hook_workaround.md` requires `git -c core.hooksPath=/dev/null commit ...` for this repo until global config is fixed.

---

## Shared Patterns

### Pattern S1: Cold-start verification protocol (D-04)

**Source:** RESEARCH.md §Code Examples + `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`

**Apply to:** Phase verification gate (after all 5 plans land), and per-plan smoke-check.

```bash
# Wipe Svelte/Vite cache
rm -rf apps/frontend/.svelte-kit node_modules/.vite/

# Cold dev-server start; capture warning surface
yarn workspace @openvaa/frontend dev 2>&1 | tee /tmp/70-cold-start.log &
DEV_PID=$!

# Navigate voter happy-path manually (or via Playwright); kill server
kill $DEV_PID

# Assert zero warnings across A/B/C/D categories
grep -E "(state_referenced_locally|slot_element_deprecated|a11y_no_noninteractive|fetch.*eagerly)" /tmp/70-cold-start.log
# expected: 0 lines (or only inline-justified accepted-warning sites)
```

### Pattern S2: Static check (covers Cat A/B/C; misses Cat D)

**Source:** RESEARCH.md §Pitfall 7

**Apply to:** Per-task commit gate during Plan-70-01, Plan-70-02, Plan-70-03 work. **NOT sufficient for Plan-70-04** — Cat D requires the cold-start dev-mode capture (Pattern S1).

```bash
yarn workspace @openvaa/frontend check 2>&1 | grep WARNING
# Pre-Phase-70 baseline: 12 warnings (verified 2026-05-09)
# Post-Phase-70 target: 0 warnings (or only accepted-warning sites)
```

### Pattern S3: Accepted-warning inline justification format (D-05)

**Source:** CONTEXT.md D-05 + RESEARCH.md §Pattern 3 Option B

**Apply to:** Any site within Plans 70-01 through 70-04 where Plan-N Task M concludes "fix-pattern is not appropriate; the warning is intentional".

**Format:** `// svelte-warning: accepted — <reason>` (single line, distinct from `// bind: keep —` so a future grep can find them).

**Constraint:** Use inside `<script>` blocks ONLY. Inside `<!--@component -->` doc blocks, switch to `// svelte-warning: accepted —` script-style (same nested-HTML-comment hazard documented in Phase 65 D-65-01-2 — see RESEARCH.md §Anti-Patterns).

### Pattern S4: Existing in-tree `// svelte-ignore state_referenced_locally` justification prose

**Source:** `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:50-56`

**Apply to:** All 9 Cat A sites in Plan-70-01.

The canonical prose pattern reads roughly: "`<symbol>` is `<bound-by-X>` (`<context>`); seed from the prop's initial value. Reading the prop inside the initializer is intentional: we want the initial seed, not a reactive dependency." Variations are fine; the key requirement is a one-line "init-only" justification immediately above the `// svelte-ignore` line, so the next reader understands why the silence is correct.

---

## No Analog Found

| File | Plan | Reason |
|------|------|--------|
| `apps/frontend/src/lib/components/input/Input.svelte:521` Option A target | 70-03 | No exact in-tree `<label>` → `<button>` swap precedent. Plan-70-03 Task 1 is a discovery + visual-smoke step. Both Option A (`<button>`) and Option B (`role="button"` + accepted-warning) are documented in Pattern 3 above. |
| Cat D capture-driven additional sites | 70-04 | Per RESEARCH.md §Confirmed Warning Sites Category D, the static-analysis candidate is WithPolling.svelte alone. Additional sites only emerge from Plan-70-04 Task 1 cold-start capture. For each, classify as "SSR-needed → `load()`" or "client-only → `onMount`" and apply the corresponding pattern from Plan-70-04 above. |

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/**/*.svelte` (component layer)
- `apps/frontend/src/routes/**/*.svelte` (route layer, especially `+layout.svelte`)
- `apps/frontend/src/lib/contexts/**/*.svelte.ts` (context layer; for Cat D static-analysis cross-check)

**Files scanned (representative):**
- `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte` — canonical Cat A `// svelte-ignore` exemplar
- `apps/frontend/src/routes/admin/+layout.svelte` — canonical `Snippet`-based `{@render children?.()}` exemplar
- `apps/frontend/src/lib/components/video/Video.svelte` — `onMount(() => …)` init exemplar
- `apps/frontend/src/lib/components/expander/Expander.svelte` — Cat A site
- `apps/frontend/src/lib/components/entityFilters/{numeric,enumerated}/*.svelte` — Cat A sites
- `apps/frontend/src/routes/admin/login/+page.svelte` — Cat A site
- `apps/frontend/src/routes/candidate/register/+page.svelte` — Cat A site
- `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` — Cat B + Cat D site
- `apps/frontend/src/lib/components/input/Input.svelte` — Cat C site + `// bind: migrate —` preservation target

**Pattern extraction date:** 2026-05-09

**Cross-references:**
- CONTEXT.md §D-01..D-05 — locked decisions
- RESEARCH.md §Per-Category Fix Patterns 1–5 — full pattern definitions
- RESEARCH.md §Confirmed Warning Sites — full enumeration of A1..A9, B1, C1, D candidate
- RESEARCH.md §Common Pitfalls 1–7 — risks and mitigations per pattern
- CLAUDE.md §"Context Destructuring Rule (Svelte 5)" — Cat A structural mitigation rule (permanent, replaces audit-trail `// bind: keep —` comments)
- CLAUDE.md §"Frontend (SvelteKit)" — Cat D `load()` canonical SSR data path
