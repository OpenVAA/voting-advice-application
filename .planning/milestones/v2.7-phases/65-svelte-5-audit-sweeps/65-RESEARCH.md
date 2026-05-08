# Phase 65: Svelte 5 Audit Sweeps - Research

**Researched:** 2026-04-29
**Domain:** Svelte 5 reactivity hygiene — `bind:*` warnings, `{#key}` semantics, context-destructure hazard
**Confidence:** HIGH (codebase grep verified; Svelte 5 docs cited; in-tree fix patterns from Phases 61 and 64 are reference models)

## Summary

Phase 65 sweeps three Svelte 5 idiom hazards left over from the v2.6 migration: 93 `bind:*` sites under `apps/frontend/src/lib/**`, 2 `{#key …}` sites under `apps/frontend/src/`, and an unbounded set of context-destructure consumers (`const { X } = ctx`) which Phase 61 Plan 03 diagnosed as a class of silent non-reactivity. Scout-verified counts hold (93 binds; 2 keys). The bind sites concentrate in the candidate app (PasswordSetter / PasswordValidator / TermsOfUseForm / LogoutButton / Modal) and reusable components (Video, Select, Input, Modal, Tabs); 38/93 are `bind:this` (the dominant category). Both `{#key}` sites are deliberate remounts (URL-context reset; question id change) — they need inline justification, not removal. The destructure rule has a working in-tree exemplar (`candidateContext.svelte.ts:106-123` 18-line code comment) that should anchor the CLAUDE.md guideline.

The fix patterns are already in tree from Phase 64 (`QuestionChoices.svelte:122-124` — convert `bind:this` target object to `$state({})`) and Phase 61 (rewrite reactive destructure to direct `ctx.X` access). No new libraries, no architectural decisions to make. The work is mechanical sweep + classify + annotate, gated by manual smoke (zero `binding_property_non_reactive` warnings) and the v2.6 parity gate at HEAD `2c7ad2dea`.

**Primary recommendation:** Plan 65-01 walks the 93 sites in canonical grep order, classifying each as `keep + reason` (most), `migrate to $state` (rare bind:this on lifecycle-managed refs), or `remove` (defensive bindings with no reader). Plan 65-02 bundles the small audits (2 keys + destructure sweep + CLAUDE.md text). Plan 65-03 verifies via voter 9-step + candidate 4-step manual smoke + parity gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| `bind:*` audit + inline justification | Browser (Svelte component runtime) | — | All `bind:*` lives in `.svelte` markup; runtime is the warning emitter |
| `bind:this` reactive contract | Browser | — | DOM ref or component-instance binding; SSR-irrelevant (refs only resolve client-side) |
| `bind:value` / `bind:group` / `bind:checked` | Browser | — | Two-way DOM input bindings; component-prop variants require `$bindable()` on the prop tier |
| `{#key}` remount control | Browser | — | Component lifecycle; affects state/transition reset on the consumer side |
| Context-destructure rule documentation | Documentation (CLAUDE.md) | App code (`apps/frontend`) | Rule is app-side; `@openvaa/*` packages are framework-agnostic and hold no Svelte contexts |
| Manual smoke verification | E2E surface (manual) | Browser dev console | Warnings emit at component init / interaction; only browser-runtime captures them |
| v2.6 parity gate re-run | E2E (Playwright) | — | Existing automation at `tests/playwright.config.ts` |

**Tier note:** Phase 65 touches only the app tier (`apps/frontend/src`). It does NOT modify any `@openvaa/*` package. UI-framework agnosticism (Phase 64 D-01, carried forward) is preserved by construction since no `bind:*` or `$state` lives in `packages/`.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Inline-only justifications.** Each retained `bind:*` site gets a Svelte comment (`<!-- bind: keep — reason -->`) or an adjacent `// Phase 65: $bindable annotation` line. No separate `65-AUDIT.md` table. Rationale: 93 sites is too many to keep in sync across two surfaces; reviewers read code at the site, not in a separate doc; single source of truth.
- **D-02: CLAUDE.md guideline, not a lint rule.** Documented as: *"Use direct property access (`ctx.X`) for reactive reads inside `$derived` / `$effect`. Destructuring (`const { X } = ctx`) is acceptable for one-shot setup reads (e.g., `getRoute`, `t` translation function) where reactive tracking isn't needed."* Lint enforcement deferred — Phase 65 doesn't ship an ESLint rule.
- **D-03: 9-step voter smoke + light candidate-app smoke.** Reuse the v2.6 9-step voter checklist (Phase 60-04 / Phase 64 D-10 manual checkpoint). Add a 3-4 step candidate-app sanity pass: (1) candidate login, (2) view a question, (3) save an answer, (4) logout.
- **D-04: Audit existing 2 sites + each-block conversion residue sweep.** Inline-justify both `{#key}` sites; sweep `{#each ... as item}` blocks under `apps/frontend/src/` for `{#key item}`-inside-`{#each}` residue and missing-`(item.id)` keying that's idiomatic. Missing-`{#key}` bug sweep is OUT of scope.
- **D-05: 3 plans.** Plan 65-01: `bind:*` audit + inline justifications. Plan 65-02: `{#key}` audit + context-destructure audit + CLAUDE.md rule. Plan 65-03: Verification + smoke. Sequential.

### Claude's Discretion

- Specific wording of the CLAUDE.md context-destructure guideline (D-02) — anchor on the Phase 61 Plan 03 example as the canonical broken case.
- Inline comment phrasing for the 93 `bind:*` sites — use a consistent short prefix (e.g., `bind:` or `Phase 65 audit:`) but the wording per category is the planner's call.
- Whether to bundle the candidate-app smoke into a separate plan or fold it into 65-03 — folded by default (D-05); split if 65-03 grows unwieldy.
- Specific bind:* migration targets if the audit reveals deep two-way bindings (3+ component layers per todo item 1) — surface as deferred ideas, not in-scope rewrites.

### Deferred Ideas (OUT OF SCOPE)

- **ESLint rule for context-destructure ban** — Phase 65 ships a guideline; if violations recur, a future phase can add a custom svelte-eslint rule.
- **Missing-`{#key}` bug sweep** — looking for places where positional reuse causes silent bugs.
- **`bind:*` migration to `$bindable()`-flow patterns for two-way bindings 3+ layers deep** — defer unless audit surfaces a specific hazard.
- **Wider Svelte 5 idiom audit** (`$effect.pre`, `$state.raw`, `$state.snapshot`) — explicitly OoS in REQUIREMENTS.md.
- **Centralized `bind:*` migration playbook** — could be extracted post-Phase-65; not in scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SVELTE5-01 | `bind:*` audit complete; zero `binding_property_non_reactive` warnings; inline justification per retained site | §Standard Stack (warning catalog), §Pattern 1 (bind:this fix), §Pattern 2 (bind:value w/ $bindable), §Code Example 1, §Code Example 2 |
| SVELTE5-02 | `{#key}` audit complete; retained blocks carry inline justification or test gate; defensive `{#key item}`-in-`{#each}` removed | §Pattern 3 (key semantics), §Pattern 4 (keyed each), §Code Example 4 |
| SVELTE5-03 | Context-destructure rule documented; codebase audit complete; broken-but-working sites rewritten or flagged | §Pattern 5 (destructure rule), §Code Example 5, §CLAUDE.md text recommendation |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | 5.x (in tree) | Reactive component framework | Existing dependency; Phase 65 is hygiene over current install |
| svelte-check | catalog (workspace) | Type + diagnostic check | `yarn workspace @openvaa/frontend check` is the type gate |
| Vitest | catalog (workspace) | Unit test runner | `yarn test:unit` gate; existing test harnesses extend if needed |
| Playwright | catalog (workspace) | E2E runner — used by parity gate | `tests/playwright.config.ts` invocation already canonical |

`[VERIFIED: codebase grep — apps/frontend/package.json scripts list `check`, `test:unit`; root yarn.lock pins Svelte 5; tests/playwright.config.ts present]`

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `svelte/store` `fromStore` | bundled | Bridge legacy stores into rune-friendly `.current` reads | Already used at 3 sites in tree (`appContext`, `candidateContext`, `EntityListWithControls`); pattern reference for stable-store destructure exception |

**No new libraries.** Phase 65 is pure-hygiene; nothing to install.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `<!-- … -->` justification | Separate `65-AUDIT.md` table | Locked OUT (D-01) — single source of truth at the site |
| CLAUDE.md guideline (D-02) | ESLint custom rule | Deferred (DEFERRED-LIST) — guideline first, lint if violations recur |
| Per-site classification (D-01) | Mass migration to `$bindable()` flow | Deferred (DEFERRED-LIST) — only triggered if audit surfaces a specific hazard |

## Architecture Patterns

### System Architecture Diagram

```
                    Phase 65 Audit Pipeline
                    ────────────────────────

    [grep -rn "bind:" lib/]      [grep -rn "{#key" src/]    [grep -rn "= getXContext()" src/]
              │                            │                            │
              ▼                            ▼                            ▼
       93 raw sites                   2 raw sites                 ~100 destructure sites
              │                            │                            │
              │                            │                            │
    ┌─────────┴─────────┐                  │                  ┌─────────┴─────────┐
    │                   │                  │                  │                   │
    ▼                   ▼                  ▼                  ▼                   ▼
[bind:this  38]    [bind:value/      [classify each as:    [reactive ctx     [stable ctx prop:
[bind:selected 11]  group/checked     keep + justify        prop: rewrite     keep destructure
[bind:value 10]     other 31]         OR remove]            to ctx.X]         (one-shot)]
    │                   │                  │                  │                   │
    ▼                   ▼                  ▼                  ▼                   ▼
classify per:     classify per:     2 inline         e.g. answersLocked,     e.g. t, getRoute,
- target type     - $bindable on   justifications    unansweredOpinion-       appSettings,
  ($state vs       prop?           — both keep       Questions, userData     dataRoot,
   const)         - reactive        (URL reset;                              startEvent
- write site       chain depth      question id                              (stable refs)
                                    change)
    │                   │
    ▼                   ▼
[Plan 65-01: per-site Edit + inline comment]    [Plan 65-02: 2 inline comments + N rewrites + CLAUDE.md text]
                                │                              │
                                └──────────────┬───────────────┘
                                               │
                                               ▼
                        [Plan 65-03: voter 9-step smoke + candidate 4-step smoke
                                     + v2.6 parity gate at HEAD 2c7ad2dea
                                     + zero binding_property_non_reactive warnings]
                                               │
                                               ▼
                                        Phase 65 closes
```

The pipeline is linear: each plan reads from the prior plan's edits in HEAD; no parallelism opportunities (per CONTEXT.md D-05). The grep invocations are stable contracts — they're how the success criteria are measured.

### Recommended Project Structure

No new files. Edits land at:

```
apps/frontend/src/
├── lib/
│   ├── candidate/components/         # heavy bind:* — 13 sites
│   ├── components/                    # general bind:* — 50+ sites
│   └── dynamic-components/            # bind:* + 1 destructure-rewrite candidate
├── routes/
│   ├── candidate/(protected)/questions/[questionId]/+page.svelte  # destructure rewrite candidate (line 47)
│   └── (voters)/(located)/results/+layout.svelte                   # 1 of 2 {#key} sites (line 372)
└── routes/candidate/(protected)/questions/[questionId]/+page.svelte # 2 of 2 {#key} sites (line 243)

CLAUDE.md                              # add destructure-rule subsection
```

### Pattern 1: `bind:this` on lifecycle-managed refs (Phase 64 fix model)

**What:** When `bind:this={obj.key}` writes to a *property* of a containing object, that container must be `$state(...)` so the property write triggers reactive notification. Plain `const obj = {}` triggers `binding_property_non_reactive` because the binding mutates a property on a non-reactive value.

**When to use:** Any `bind:this={inputs[id]}` / `bind:this={obj.field}` pattern. NOT needed for direct `bind:this={localVar}` where `localVar` is a plain `let`.

**Example (in tree at `QuestionChoices.svelte:122-124`):**
```ts
// Source: apps/frontend/src/lib/components/questions/QuestionChoices.svelte:120-124 (Phase 64 fix)
/** Holds the currently selected value and is initialized with the value of `selectedId` */
let selected: Id | null | undefined = $state(undefined);
// `inputs` must be $state in Svelte 5 because `bind:this={inputs[id]}` mutates
// a property on it. A plain `const` triggers `binding_property_non_reactive`.
const inputs: Record<string, HTMLInputElement> = $state({});
```
`[VERIFIED: codebase grep at exact lines]`

**Other affected sites in tree** (likely candidates for the same fix during the audit):
- `Input.svelte:401, 422, 460` — `bind:this={mainInputs[i]}` and `bind:this={mainInputs[0]}` (mainInputs is currently…?) — verify during walkthrough
- `Input.svelte:545` — `bind:this={fileInput}` (single ref, may already be safe)

`[VERIFIED: grep for bind:this returns 38 sites; lifecycle-managed-property pattern is one subset]`

### Pattern 2: `bind:value` / `bind:group` / `bind:checked` on component props (`$bindable()` contract)

**What:** When `<Child bind:foo={localState}>` flows the child's mutation back to parent, the child's prop declaration must use `$bindable(...)`. This is correctly applied across the candidate-app components in tree (Video, Select, Tabs, Toggle, Modal, PasswordField, PasswordSetter, etc.) — see grep result of `$bindable` (~30 sites).

**When to use:** Any `bind:X` on a component (not a DOM element). Confirm child uses `$bindable()` for the prop named `X`. If child does NOT, EITHER add `$bindable()` to child OR convert the parent-side binding to `value={x}` + `onChange` callback (one-way + event).

**Pitfall:** Two-way bindings flowing 3+ component layers (todo item 1, deferred per CONTEXT.md) need explicit reasoning per layer. Audit notes the depth but does NOT migrate; deferred unless a hazard surfaces.

**Example (in tree at `PasswordSetter.svelte:34-42`):**
```ts
// Source: apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:34-42
let {
  password = $bindable(''),
  autocomplete = 'new-password',
  errorMessage = $bindable(undefined),
  valid = $bindable(false),
  passwordTestId = undefined,
  confirmPasswordTestId = undefined,
  ...restProps
}: PasswordSetterProps = $props();
```
`[VERIFIED: codebase grep]`

### Pattern 3: `{#key expr}` semantics — when to keep, when to remove

**What:** A `{#key expr}` block destroys and recreates its contents whenever `expr`'s value changes. Three legitimate uses:
1. **Reset child component state on a key change** — e.g., remount a question form when `questionId` changes so the in-progress draft state is dropped.
2. **Replay transitions/animations** — when state changes should re-trigger CSS transitions.
3. **Force-remount across context-scope changes** — e.g., when activeElectionId or activeEntityType changes, remount filter UI so per-scope state resets.

**Anti-pattern:** `{#key item}` *inside* `{#each items as item}` — this is positional-reuse defense. Replace with keyed each `{#each items as item (item.id)}` if the template is positional and the items have stable IDs; remove if items are intrinsically positional and reuse is correct.

**The 2 sites in tree (both keep, per D-04):**

`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:243`
```svelte
{#key question.id}
  <PreventNavigation … />
  <MainContent title={text}>
    …
    <OpinionQuestionInput … />
  </MainContent>
{/key}
```
`[VERIFIED: grep + read]` — Justification: legitimate state-reset on question change. Without it, in-progress answer state from question N would leak into question N+1's form on URL navigation. Keep + inline comment.

**Caveat:** This `{#key}` may also be papering over the destructured-context bug at line 47 (`const { answersLocked, unansweredOpinionQuestions, userData } = getCandidateContext();`). Plan 65-02's destructure audit should test whether removing the `{#key}` (or rewriting the destructure to `ctx.X`) keeps the form behavior correct. If the form still works without the `{#key}` after the destructure rewrite, that confirms the `{#key}` was defensive, not observable. Flag for the planner.

`apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:372`
```svelte
{#key `${activeElectionId}:${activeEntityType}`}
  <h3>… {activeMatches.length} …</h3>
  <EntityListWithControls entities={activeMatches} … />
{/key}
```
`[VERIFIED: grep + read]` — Justification: scope-tuple change (Phase 62 D-14); remount discards per-scope filter UI state. Keep + inline comment.

### Pattern 4: Keyed `{#each}` vs unkeyed `{#each}`

**What:** `{#each items as item (item.id)}` tells Svelte to track items by ID — when the array reorders or items are inserted/removed, Svelte preserves the matching DOM node + component state. Unkeyed `{#each items as item}` reuses DOM positionally — whatever was at index 3 stays at index 3, even if the underlying item identity changed.

**When unkeyed is correct:** Items are intrinsically positional (rendering numbered slots, e.g., a tab strip indexed by index). Items don't carry meaningful per-item state to preserve (pure-presentational rendering of an immutable mapping).

**When keyed is required:** Items have stable IDs AND per-item state (form inputs, transitions, internal `$state`). Unkeyed reuse causes "the form input I was filling on item B now contains item A's value because the array shrank from 5 to 4 items".

**In-tree state (audit residue check, per D-04):**
- 1 keyed each in `apps/frontend/src/lib/**`: `FeatureJobs.svelte:132` — `{#each pastJobs as job (job.id)}`. Already correct.
- ~30 unkeyed each blocks. Most are positional (option lists, tab strips, info sections, validation rule rows). The audit walks each to confirm "positional reuse is correct here".
- Phase 64 already removed a `{#key item}`-inside-`{#each}` pattern from `EntityList.svelte`. Verify no residue.

`[VERIFIED: grep -rn "{#each.*as.*(.*)" returns only FeatureJobs.svelte:132; grep -rn "{#each" returns ~30 unkeyed sites]`

### Pattern 5: Context-destructure rule (the v2.7 SVELTE5-03 contract)

**What:** Svelte 5 reactivity tracks reads via getter invocation within a tracking scope (`$effect`, `$derived`, template). A plain `const { X } = ctx` invokes the getter ONCE at destructure time, captures the returned value (e.g., the initial empty `$state` array), and binds it to a local var. Subsequent reads of the local var are reads of a static binding — not getter calls — and do not propagate dependency invalidation.

**The two-class distinction:**

| Property type | Destructure safe? | Reason |
|---------------|-------------------|--------|
| **Stable reference** (function `t`, `getRoute` Readable, store-like Writable, plain object frozen at init) | ✅ YES | The captured value is the same identity for the component lifetime; subsequent reads via the local var are equivalent to reads via `ctx.X`. |
| **Reactive accessor** (getter returning `$state`/`$derived`-backed values that change over time) | ❌ NO | The captured value is the snapshot at init time; subsequent reads see the stale snapshot. |

**Stable references in the OpenVAA codebase** (destructure-safe):
- `t`, `translate` — translation functions (plain JS function values, identity-stable)
- `getRoute` — Readable store of `RouteBuilder`; consumers use `$getRoute(...)` auto-subscribe pattern
- `appSettings`, `dataRoot`, `darkMode`, `locale`, `locales` — Writable/Readable stores; consumers use `$appSettings.X` auto-subscribe pattern
- `userData` — context-managed object whose internal `$state` is read via `userData.current`/`userData.X` getters (the property `userData` is stable; the methods/getters on it provide reactive reads)
- `startEvent`, `startFeedbackPopupCountdown`, `startSurveyPopupCountdown` — function references
- `setDataConsent`, `logout`, `register`, `preregister` — function references

**Reactive accessors in the OpenVAA codebase** (destructure UNSAFE — must use `ctx.X`):
- `selectedElections`, `selectedConstituencies` — `$state` arrays (Phase 61 fix sites)
- `opinionQuestions`, `infoQuestions`, `infoQuestionCategories`, `opinionQuestionCategories`, `questionBlocks` — `$state` arrays/objects updated by an `$effect`
- `unansweredRequiredInfoQuestions`, `unansweredOpinionQuestions`, `requiredInfoQuestions` — `$derived` arrays
- `answersLocked`, `profileComplete`, `electionsSelectable`, `constituenciesSelectable` — `$derived` booleans
- `matches`, `nominationsAvailable`, `resultsAvailable` (voter context) — Phase 61-03 voter-side parallel fix; reactive
- `idTokenClaims`, `preregistrationElections`, `preregistrationNominations`, `newUserEmail` — getters returning `$derived` values

`[VERIFIED: read of candidateContext.svelte.ts shows 374-459 setContext block with explicit `get X() { return _backing; }` patterns for all reactive properties; stable refs are passed as-is]`

**Working in-tree exemplar — voter results layout** (`apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-77`):
```ts
// Phase 61-03 voter-side parallel fix: reactive context getters
// (constituenciesSelectable, matches, nominationsAvailable, resultsAvailable,
// selectedConstituencies, selectedElections) are read via voterCtx.X.
// Stable stores/functions/objects (appSettings, dataRoot, getRoute, t,
// answers, startEvent, *Countdown) remain destructured.
const voterCtx = getVoterContext();
const {
  answers,
  appSettings,
  dataRoot,
  getRoute,
  startEvent,
  startFeedbackPopupCountdown,
  startSurveyPopupCountdown,
  t
} = voterCtx;
// Re-named local aliases preserved for template readability:
const elections = $derived(voterCtx.selectedElections);
const constituencies = $derived(voterCtx.selectedConstituencies);
```
This is the canonical reference style. `[VERIFIED: read at exact lines]`

**Broken-but-working candidates uncovered during scout** (planner verifies during audit):
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:47` — `const { answersLocked, appSettings, dataRoot, getRoute, questionBlocks, unansweredOpinionQuestions, t, userData } = getCandidateContext();` — `answersLocked`, `questionBlocks`, `unansweredOpinionQuestions` are reactive accessors; `appSettings`, `dataRoot`, `getRoute`, `t`, `userData` are stable. The reactive accessors should be split out and read via `ctx.X`. The site likely "works" today because of the `{#key question.id}` remount that re-runs the component setup on every question change — papering over the destructure staleness. The destructure rewrite may make the `{#key}` removable (test during plan).
- Several `+page.svelte` files in `apps/frontend/src/routes/candidate/` destructure `getCandidateContext()` similarly. Walk all and split reactive vs stable.
- `voterContext` consumer surfaces — fewer; `+layout.svelte:67-79` is already correctly split (the exemplar above). Verify `+page.svelte` consumers don't have the same issue.

### Anti-Patterns to Avoid

- **Hand-rolled `effect_update_depth_exceeded` workarounds.** If a `bind:*` fix triggers depth-exceeded, use the in-tree `untrack(() => store.update(...))` idiom (Phase 60 RESEARCH §Common Pitfalls) — don't invent new patterns. Six in-tree sites already use `untrack` correctly.
- **Mass `bind:*` removal without smoke testing.** A `bind:` that "looks unused" may be the only place the parent reads child state. Pre-fix: identify the reader. Don't remove; convert to one-way + callback if removing is desired.
- **Adding `$state` to elements that don't need it.** Per [Svelte 5 discussion #15979](https://github.com/sveltejs/svelte/discussions/15979): `$state()` on a `bind:this` target is OPTIONAL when the element ref is read only inside `onMount()` or `$effect`, AND not in a reactive `{#each}` / `{#if}` block. Don't preemptively add `$state` everywhere; only at sites the warning emits.
- **Migrating to `$bindable()`-flow patterns prospectively.** Per CONTEXT.md deferred items, deep two-way bindings (3+ layers) only get migrated if the audit surfaces a specific hazard. Annotate, don't rewrite.
- **Editing `@openvaa/*` packages.** Phase 65 is purely app-side hygiene. Touching `packages/` would violate UI-framework agnosticism (Phase 64 D-01 carry-forward).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filtering 93 bind sites by category | Custom audit script (`scripts/audit-bind.ts`) | `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'` + manual classify in editor | 93 is a tractable manual count; tooling overhead exceeds benefit; Edit tool covers per-site annotation cleanly |
| Detecting `binding_property_non_reactive` warnings | Custom Vite plugin to scrape stderr | Manual smoke + browser dev console | Warnings emit at component init/interaction; only voter+candidate manual smoke catches the lifecycle correctly; CI-time scrape would need an HMR-cold dev server which isn't always green-field |
| Lint enforcement of context-destructure rule | Custom svelte-eslint rule | CLAUDE.md guideline (D-02 LOCKED) | User explicitly chose guideline over lint rule; lint rule deferred (DEFERRED-LIST) |
| Re-running v2.6 parity gate | New parity script | `tests/playwright.config.ts` + existing `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | Existing tooling regenerated by Phase 64 D-08; reuse without modification |

**Key insight:** Phase 65 is hygiene over an existing system. The instinct to "add a tool to make this easier" is wrong here — every tool adds maintenance surface, and 93 sites is small enough for a focused walkthrough. The discipline is *"read the warning the dev server emits, edit the site, verify the warning is gone, move on."*

## Runtime State Inventory

> Phase 65 is a code-hygiene phase. No data migrations, no service config changes, no OS-level state. The runtime state inventory is intentionally short.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB schema changes; no data semantics change | None |
| Live service config | None — no Supabase project config, no n8n / external service config in scope | None |
| OS-registered state | None — no scheduled tasks, no pm2 process names | None |
| Secrets/env vars | None — no env var renames; no SOPS keys touched | None |
| Build artifacts | None — no `pyproject.toml` / `package.json` rename; no compiled binaries | None |

**Nothing found in any category.** Verified by reading CONTEXT.md scope section (`In scope` is purely `apps/frontend/src/**` source edits + `CLAUDE.md` documentation).

## Common Pitfalls

### Pitfall 1: Removing a `bind:` that papers over consumer-side bugs

**What goes wrong:** Audit marks `bind:foo` as "unused" because no `console.log(foo)` reads it after binding. But the consumer reads `foo` via a downstream component prop chain or via mutation observation; removing the bind silently breaks behavior.

**Why it happens:** `bind:` is bidirectional. A "write-only-from-child" usage IS the contract for some bindings (e.g., `bind:itemsShown` on `EntityList` — child computes how many items are shown, parent reads to display "X of Y candidates"). Removing the bind compiles fine; the parent's display goes stale.

**How to avoid:** Before classifying any bind as "remove", grep for the local var both BEFORE and AFTER the bind site. Confirm the var is read elsewhere. If only the bind writes it, it's truly unused. If anything reads it (template, `$derived`, `$effect`), the bind is the contract.

**Warning signs:** Tests pass post-removal but a stale UI value appears in manual smoke. Always run the candidate-app smoke (D-03) — `bind:` distribution skews candidate-heavy.

### Pitfall 2: `bind:this` on a `$state` whose mutation triggers `effect_update_depth_exceeded`

**What goes wrong:** Converting `let target = ?` to `let target = $state(?)` for a `bind:this` fix; `target` is then read inside an `$effect` that also writes to it, triggering Svelte's depth-exceeded guard.

**Why it happens:** `$state` writes notify ALL readers, including the writing `$effect` itself. If the effect re-runs because of its own write, Svelte aborts after a few cycles.

**How to avoid:** Wrap the write in `untrack(() => { … })` so the effect's own write doesn't re-trigger it. In-tree pattern: `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte:51-58`:
```ts
// Auto-select when only one option exists. Wrap the write in `untrack` so
// the effect doesn't re-fire on its own write — Svelte 5 effect_update_depth_exceeded
// guard fires otherwise on subsequent option-list changes that yield a
// different identity but the same length.
$effect(() => {
  if (options.length === 1) untrack(() => activate(0));
});
```

**Warning signs:** "Maximum update depth exceeded" console warnings; tab/list/option UI freezes after a brief flash.

### Pitfall 3: Destructure rewrite that breaks reactivity in a non-obvious way

**What goes wrong:** Rewriting `const { foo } = ctx` to `ctx.foo` everywhere is straightforward in templates but tricky in `$effect` / `$derived` where local-var aliasing was the original write contract. Specifically, `let foo = $state(...)` followed by `bind:foo` is NOT equivalent to `ctx.foo` (which is a read-only getter).

**Why it happens:** Some destructured props are bound (`<Child bind:value={foo}>`). Direct `ctx.X` access doesn't support `bind:` because `ctx.X` is a getter — there's no setter to write through. The fix requires identifying the binding consumer and reshaping the contract (e.g., `value={ctx.X}` + `onChange={(v) => ctx.setX(v)}` if the context exposes a setter).

**How to avoid:** Per-site triage during the destructure audit:
1. Is the destructured property used only in reads (template, `$effect`, `$derived`)? → Rewrite to `ctx.X`. Done.
2. Is the destructured property used in `bind:`? → Check whether the context exposes a setter. If yes, reshape to value+onChange. If no, leave as-is and add inline justification (likely the property was already non-reactive by design — e.g., `newUserEmail` on `candidateContext` has both `get` and `set` accessors).
3. Is the destructured property mutated locally (e.g., `foo = newValue`)? → It's a `$state` shadow, not a context property. Audit out of scope unless the broader pattern is broken.

**Warning signs:** TypeScript error "cannot assign to ... because it is a read-only property" at the rewrite site. Treat as a signal to re-triage, not to bypass via type assertion.

### Pitfall 4: `{#key}` removal that exposes a missing reactivity edge

**What goes wrong:** Removing a `{#key expr}` because "the inside doesn't depend on `expr`"; turns out an internal `$derived` chain WAS reactive only because the `{#key}` re-instantiated the entire subtree on every change. Removal means the `$derived` no longer re-runs.

**Why it happens:** `{#key}`-driven remount is a heavy-handed reactivity hack. The proper fix is to ensure the `$derived` chain depends on the right inputs. If the chain is broken (e.g., a destructure-staleness bug), `{#key}` masks it.

**How to avoid:** Only remove `{#key}` if the destructure / reactivity inside has been validated independently. Per D-04, the audit is to JUSTIFY the 2 existing `{#key}` sites — not to remove them. Keep both; annotate inline; only consider removal if the related destructure rewrite (Plan 65-02) makes the remount provably non-observable. If in doubt, keep.

**Warning signs:** UI value freezes after expected change; `console.log` inside `$derived` shows expected re-runs but DOM doesn't update; transitions don't re-trigger.

### Pitfall 5: Shadowing the legacy auto-subscribe pattern (`$store`)

**What goes wrong:** `const { appSettings, getRoute } = ctx;` is destructure-safe because `appSettings` is a Readable store consumed via `$appSettings.X` auto-subscription, NOT a getter returning `$state`. Inadvertently rewriting to `ctx.appSettings` breaks auto-subscription consumers (`$ctx.appSettings` doesn't auto-subscribe — only top-level identifiers prefixed with `$` do).

**Why it happens:** The destructure-rule guidance ("read via ctx.X") applies to runes-era reactive properties. The legacy store pattern is a separate idiom. Conflating the two breaks template auto-subscription.

**How to avoid:** Before rewriting, check whether the property is consumed via `$X.Y` syntax in the same file. If yes, leave the destructure (the `$` prefix only auto-subscribes top-level identifiers). The CLAUDE.md text should call this out explicitly as the canonical exception alongside `t` / `getRoute`.

**Warning signs:** Template references to `$appSettings.X` produce TypeScript errors after rewrite ("`$appSettings` is not defined" if you removed the destructure binding).

## Code Examples

### Code Example 1: `bind:this` fix for property-write target (Pattern 1)

```ts
// Source: apps/frontend/src/lib/components/questions/QuestionChoices.svelte:120-124
// Phase 64 fix model — apply at any audit site that triggers binding_property_non_reactive

// BEFORE (warns):
const inputs: Record<string, HTMLInputElement> = {};
// → bind:this={inputs[id]} mutates a property on a non-reactive object → warning

// AFTER (clean):
const inputs: Record<string, HTMLInputElement> = $state({});
// → mutation through bind:this is now reactively notified
```

### Code Example 2: `bind:value` against a `$bindable()` prop (Pattern 2)

```ts
// Source: apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:34-42
// Reference shape — confirm during audit that every two-way binding flows through $bindable on the prop side

// Child (correct):
let {
  password = $bindable(''),
  errorMessage = $bindable(undefined),
  valid = $bindable(false),
} = $props();

// Parent:
<PasswordSetter bind:password bind:valid />
// → no warning; updates flow both directions
```

### Code Example 3: Inline justification syntaxes for retained binds (D-01)

Three syntaxes are idiomatic in `.svelte` files. The planner picks one for consistency; recommend **Option A (HTML comment above the directive)** because it's the most common in tree per Phase 64.

```svelte
<!-- Option A: HTML comment above the bind site (RECOMMENDED) -->
<!-- bind: keep — Modal exposes openModal/closeModal via $bindable component-instance ref -->
<Modal bind:this={modalRef} … />

<!-- Option B: Trailing JS-style comment in script block (when annotating the local var) -->
<script>
  // bind: keep — bind:this on plain const is safe per Svelte 5 discussion #15979 (single ref, read in onMount only)
  let alertRef: Alert;
</script>

<!-- Option C: Inline trailing HTML comment (least preferred — line-noise heavy) -->
<input bind:value={query} /> <!-- bind: keep — local search input -->
```

`[VERIFIED: codebase grep shows mostly Option A in tree (e.g., the candidateContext 18-line block comment); Option B used at QuestionChoices.svelte:122-123]`

### Code Example 4: `{#key}` inline justification (Pattern 3)

```svelte
<!-- Source: target shape for plan 65-02 inline justification -->
<!-- {#key}: keep — remount on question change drops in-progress draft state from the prior question -->
{#key question.id}
  <PreventNavigation … />
  <MainContent title={text}>
    <OpinionQuestionInput question={question} … />
  </MainContent>
{/key}

<!-- and the voter-results variant: -->
<!-- {#key}: keep — scope-tuple change discards per-scope filter UI state (Phase 62 D-14) -->
{#key `${activeElectionId}:${activeEntityType}`}
  <h3>… {activeMatches.length} …</h3>
  <EntityListWithControls entities={activeMatches} … />
{/key}
```

### Code Example 5: Destructure rule — the working canonical (Pattern 5)

```ts
// Source: apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79
// THIS is the CLAUDE.md anchor reference — the working pattern in tree.

const voterCtx = getVoterContext();

// Stable references (functions, stores, objects with internal getters): destructure-safe.
const {
  answers,                          // store — consumed via $answers in template
  appSettings,                      // Writable<AppSettings> — consumed via $appSettings
  dataRoot,                         // Writable<DataRoot> — consumed via $dataRoot
  getRoute,                         // Readable<RouteBuilder> — consumed via $getRoute
  startEvent,                       // (event: TrackingEvent) => void — function
  startFeedbackPopupCountdown,      // (delay?: number) => void — function
  startSurveyPopupCountdown,        // (delay?: number) => void — function
  t                                 // (key: string) => string — function
} = voterCtx;

// Reactive accessors ($state / $derived backed): MUST read via voterCtx.X.
// Re-aliasing through $derived gives template readability without losing reactivity.
const elections = $derived(voterCtx.selectedElections);
const constituencies = $derived(voterCtx.selectedConstituencies);
// Other reactive reads inline in template/effects:
//   {voterCtx.matches[…]}
//   {#if voterCtx.constituenciesSelectable}
//   {#if voterCtx.resultsAvailable}
```

### Code Example 6: Destructure rewrite shape (Pattern 5 fix)

```ts
// BEFORE (broken — captures initial empty arrays):
const { answersLocked, unansweredOpinionQuestions, userData } = getCandidateContext();
$effect(() => {
  console.log(unansweredOpinionQuestions.length);  // always 0, even after data load
});

// AFTER (correct):
const ctx = getCandidateContext();
$effect(() => {
  console.log(ctx.unansweredOpinionQuestions.length);  // re-runs on data load
});
// userData is stable (object with internal $state getters) — keep as a destructure if preferred
const { userData } = ctx;
```

### Code Example 7: Recommended CLAUDE.md text (D-02)

Anchor target — drop into CLAUDE.md under a new subsection in `## Important Implementation Notes` or a new `## Frontend Reactivity Guidelines` section after the `## Frontend (SvelteKit)` block:

```markdown
### Context Destructuring Rule (Svelte 5)

OpenVAA's Svelte 5 contexts (e.g., `getCandidateContext()`, `getVoterContext()`,
`getAppContext()`) expose two property classes:

1. **Stable references** — translation function `t`, route helper `getRoute`,
   stores like `appSettings`/`dataRoot`/`darkMode`, `userData`, lifecycle
   functions (`logout`, `startEvent`, `*Countdown`). These can be safely
   destructured: `const { t, getRoute } = getCandidateContext();`.

2. **Reactive accessors** — getters returning `$state`/`$derived`-backed
   values that change over time (e.g., `selectedElections`, `opinionQuestions`,
   `answersLocked`, `unansweredOpinionQuestions`, `matches`). These MUST
   be read via direct property access: `ctx.opinionQuestions`, NOT
   `const { opinionQuestions } = ctx`. Destructuring captures the getter's
   initial return value as a plain local binding; subsequent reads do
   not propagate dependency invalidation.

**Canonical pattern** (from `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte`):

```ts
const ctx = getVoterContext();
const { t, getRoute, appSettings, dataRoot } = ctx;  // stable — destructure ok
const elections = $derived(ctx.selectedElections);   // reactive — read via ctx.X
```

**Diagnostic origin:** v2.6 Phase 61 Plan 03
(`.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md`).
The candidateContext `$derived` chain captured initial empty arrays at component
init and never re-evaluated after the data layer populated — because consumers
destructured reactive properties out of the context object.

Lint enforcement is currently a guideline, not an automated rule.
```

`[CITED: existing in-tree comment at apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123 already documents the same hazard — re-use that wording for consistency]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `let target = ?` for `bind:this` on plain refs | Plain `let target = ?` STILL OK for single-element refs (per Svelte discussion #15979) | Svelte 5 release | Don't preemptively add `$state`; only at warned sites |
| `let obj = {}` for `bind:this={obj.key}` | `let obj = $state({})` REQUIRED | Svelte 5 release | Phase 64 fix model; apply at any audit site that warns |
| `bind:foo={x}` against any prop | `bind:foo={x}` against `foo = $bindable(...)` prop | Svelte 5 release | Already correct in tree (~30 `$bindable` usages) |
| `const { reactive } = ctx` then read | `ctx.reactive` direct access | Phase 61 P03 (in tree, 2026-04-24) | New rule in v2.7 CLAUDE.md |
| `{#key item}` defensive remount in `{#each}` | Keyed each `{#each items as item (item.id)}` | Svelte tutorial (long-standing) | Phase 64 removed one instance from EntityList; sweep for residue |

**Deprecated/outdated:**
- `bind:` on a regular prop (no `$bindable`) — emits `binding_property_non_reactive` in Svelte 5 even if it worked in Svelte 4.
- Pull-based `$derived.by(() => helperStore({ getter: () => ctx.X }).computed)` chains — unreliable cross-module reactivity in Svelte 5; replaced by push-based `$state` + `$effect` (Phase 61 fix shape).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `{#key question.id}` block at `[questionId]/+page.svelte:243` may be papering over a destructure-staleness bug at line 47 | §Pattern 3 | If wrong: removing `{#key}` after destructure rewrite breaks state-reset; mitigation: keep `{#key}` until smoke proves it's safe to remove (or just keep + annotate per D-04 — no removal required). |
| A2 | Inline HTML comments above bind sites is the most common in-tree justification syntax | §Code Example 3 | If wrong: planner picks Option B or C; the choice is Claude's discretion per CONTEXT.md; no functional impact. |
| A3 | The legacy auto-subscribe pattern (`$store`) only works on top-level identifiers, not on `$ctx.store` | §Pitfall 5 | If wrong: rewriting `const { appSettings } = ctx` → `ctx.appSettings` breaks template `$appSettings` auto-subscription. Cross-verified by Svelte 5 docs §stores: "the `$` prefix referencing a store can only be used on top-level identifiers". `[VERIFIED: Svelte docs convention; high confidence]` |
| A4 | `bind:itemsShown` on `EntityList` is a legitimate "child writes, parent reads" contract | §Pitfall 1 | If wrong: removal during audit is safe; mitigation: identify the reader before classifying as "remove". |
| A5 | Phase 65 plans run sequentially with no parallelism (per CONTEXT.md D-05) | §Architecture diagram | Locked decision; not an assumption. |

**A1 is the only HIGH-impact assumption** — flagged for the planner to test during Plan 65-02. A3 is verified by Svelte docs convention. A2/A4 are stylistic.

## Open Questions

1. **Should the destructure rewrite at `[questionId]/+page.svelte:47` happen in Plan 65-02 (the destructure plan) even though it's outside `apps/frontend/src/lib/**`?**
   - What we know: CONTEXT.md scope says "Codebase-wide audit for `const { … } = ctx` / `const { … } = getContext(...)` / `const { … } = use*Context()` destructure patterns" (in scope). Routes are in scope for the destructure audit.
   - What's unclear: The bind audit (D-01) excludes routes; the destructure audit (D-02) does not. Different scopes per concern.
   - Recommendation: Plan 65-02 does the destructure audit codebase-wide (lib + routes). Plan 65-01 does the bind audit lib-only.

2. **What's the threshold for "broken-by-destructure-but-working" classification — does it need a reproduction case, or is "destructured a reactive accessor" sufficient?**
   - What we know: D-02 contract is "broken-but-working sites are either rewritten or carry an inline justification".
   - What's unclear: Is the rewrite preventive (any reactive-destructure → rewrite) or symptom-driven (only rewrite if smoke shows a bug)?
   - Recommendation: Preventive. Cost is small; risk of leaving a class-bug latent is meaningful. Plan 65-02 rewrites all reactive destructures it finds; smoke verifies parity.

3. **Should plan 65-02 split into "destructure rewrite" and "key audit" sub-plans for executor parallelism?**
   - What we know: Locked at 3 plans (D-05); sequential.
   - What's unclear: Phase 65-02's internal task breakdown.
   - Recommendation: Single plan, multiple tasks. Tasks within a plan can interleave; the constraint is plan-level sequencing for dependency reasons.

4. **Is the "candidate-app smoke" (D-03) defined as a checklist file like `62-03-HUMAN-CHECKPOINT.md`, or inline in plan 65-03?**
   - What we know: Phase 62 used `62-03-HUMAN-CHECKPOINT.md`; Phase 64 D-10 rolled the 9-step into Phase 64 verification.
   - What's unclear: Plan 65-03's artifact convention.
   - Recommendation: Single inline checklist in Plan 65-03 (voter 9-step + candidate 4-step). Don't fork into a separate file unless the 4-step grows.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (workspace runtime) | Frontend dev server, vitest, Playwright | ✓ | (verify with `node --version` at smoke time) | — |
| Yarn 4 | Workspace commands | ✓ | (per `package.json#packageManager` if pinned) | — |
| Vite (via SvelteKit) | Dev server warning capture | ✓ | bundled with `apps/frontend` | — |
| Playwright browsers | Parity gate re-run | ✓/? | check `tests/playwright.config.ts` browser list | If missing: `yarn playwright install` |
| Supabase CLI (local) | Manual smoke (data layer) | ✓/? | check `supabase --version` | If missing: smoke runs against existing dev DB; deferred imgproxy known-flaky per CONTEXT.md |

**Missing dependencies with no fallback:** None expected — the v2.6 milestone shipped on this stack 1 day ago.

**Missing dependencies with fallback:** Playwright browsers may need re-install on a fresh checkout (`yarn playwright install`). Imgproxy 502 flake is known infrastructure debt (CONTEXT.md OoS); restart workaround stays informal.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E) + svelte-check (type) |
| Config files | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts`, `apps/frontend/tsconfig.json` |
| Quick run command | `yarn workspace @openvaa/frontend check` (type) ; `yarn test:unit` (unit) |
| Full suite command | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (parity gate) |

`[VERIFIED: read of vitest.config.ts; read of frontend package.json scripts]`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SVELTE5-01 | Zero `binding_property_non_reactive` warnings on voter-flow + candidate-app smoke | manual + console scrape | `yarn dev` → walk 9 voter steps + 4 candidate steps → assert no warning lines in browser dev console | manual checkpoint (defined in Plan 65-03) |
| SVELTE5-01 | All retained `bind:*` sites carry inline justification | static / grep | `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'` and verify each line has an adjacent `<!-- bind: …` or `// bind: …` comment within 3 lines | manual sweep checklist |
| SVELTE5-01 | Type checks pass after edits | static | `yarn workspace @openvaa/frontend check` | ✅ existing |
| SVELTE5-02 | Both retained `{#key}` blocks carry inline justification | static / grep | `grep -B2 "{#key" apps/frontend/src --include='*.svelte'` and verify adjacent comment | manual sweep checklist |
| SVELTE5-02 | No `{#key item}`-inside-`{#each}` residue | static / grep | `grep -B5 "{#each" apps/frontend/src --include='*.svelte' \| grep "{#key"` returns zero matches | grep contract |
| SVELTE5-03 | CLAUDE.md records the destructure rule | static / grep | `grep -A3 "Context Destructuring Rule" CLAUDE.md` returns the rule text | grep contract |
| SVELTE5-03 | Unit tests for affected contexts pass | unit | `yarn workspace @openvaa/frontend test:unit -- --run filter` (filter to context tests if needed) | ✅ existing — filterContext.svelte.test.ts; broader unit suite |
| SVELTE5-01,02,03 | v2.6 parity gate at HEAD `2c7ad2dea` continues to pass | regression / E2E | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` then `node .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | ✅ existing tooling |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend check` (fast type gate, ~30s)
- **Per plan merge:** `yarn test:unit` + `yarn workspace @openvaa/frontend check` (~2-3 min total)
- **Phase gate:** Full Playwright suite + parity diff + manual smoke (voter 9-step + candidate 4-step)

### Wave 0 Gaps

- **None.** All required test infrastructure exists at HEAD `2c7ad2dea`:
  - `tests/playwright.config.ts` (canonical Playwright invocation)
  - `apps/frontend/vitest.config.ts` (unit suite)
  - `apps/frontend/package.json` `check` script (svelte-check)
  - `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (parity diff)
  - `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` (v2.5 baseline preserved per Phase 64 D-15)
  - `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (v2.6 baseline regenerated per Phase 64 D-08)
- The only NEW artifact Phase 65 creates is the manual smoke checklist (Plan 65-03 inline), not a code-side test file.

## Project Constraints (from CLAUDE.md)

Phase 65-relevant directives extracted from `./CLAUDE.md` (the planner verifies compliance):

- **Use TypeScript strictly — avoid `any`, prefer explicit types.** Phase 65 doesn't introduce new types but rewrites involving `bind:` may surface implicit-any inferences; resolve with explicit annotations.
- **Test accessibility — WCAG 2.1 AA compliant.** Bind audit must not regress focus management or keyboard navigation (e.g., `bind:this` on form inputs is part of the focus contract for `QuestionChoices`).
- **Localization — all user-facing strings must support multiple locales.** Phase 65 rewrites preserve existing `t(...)` calls; no string changes.
- **Always check code against the Code Review Checklist** (`docs/code-review-checklist.md` per CLAUDE.md §Code Review). Plan 65-03 verification phase must reference this.
- **Module Resolution & Dependencies — `core` → `data`/`matching`/`filters` → `app-shared` → `frontend`/`supabase`.** Phase 65 only touches `frontend`; no package edits, no inter-package dep changes.
- **Build System — Turborepo with `dependency-aware builds`.** Phase 65 has no impact on build graph; no new packages, no script changes.
- **Frontend uses Svelte 5 + SvelteKit 2 + Tailwind + DaisyUI.** Phase 65 is hygiene over Svelte 5 — directly aligned.
- **`packages/app-shared` builds to both ESM and CommonJS.** Phase 65 doesn't touch `app-shared`; no impact.
- **Settings Architecture — `StaticSettings` hardcoded; `DynamicSettings` from backend.** Out of Phase 65 scope.

## Sources

### Primary (HIGH confidence)
- **OpenVAA codebase grep** (verified counts):
  - 93 `bind:*` sites under `apps/frontend/src/lib/` `[VERIFIED: grep at session]`
  - 2 `{#key …}` sites under `apps/frontend/src/` `[VERIFIED: grep at session]`
  - 38 `bind:this` (largest sub-category), 11 `bind:selected`, 10 `bind:value`, 4 `bind:group`, etc. `[VERIFIED: grep at session]`
- **In-tree fix exemplars:**
  - `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:122-124` (Phase 64 fix model — `bind:this` on `$state` object) `[VERIFIED: read]`
  - `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123` (in-tree destructure-rule documentation comment) `[VERIFIED: read]`
  - `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79` (working canonical destructure-split pattern) `[VERIFIED: read]`
  - `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte:51-58` (in-tree `untrack` idiom for effect_update_depth_exceeded) `[VERIFIED: read]`
- **Phase 61 Plan 03 diagnosis** — root cause analysis for the destructure hazard. `[VERIFIED: read of 61-03-DIAGNOSIS.md]`
- **Phase 64 CONTEXT.md** — `bind:*` warning origin at `QuestionChoices.svelte:271`; the broader sweep deferred. `[VERIFIED: read]`
- **CLAUDE.md** — current project rules. `[VERIFIED: read]`

### Secondary (MEDIUM confidence)
- [Svelte 5 Runtime Warnings](https://svelte.dev/docs/svelte/runtime-warnings) — names the `binding_property_non_reactive` warning but doesn't include code examples. `[CITED]`
- [Svelte 5 bind: directive docs](https://svelte.dev/docs/svelte/bind) — distinguishes `bind:this` (consumer-side `$state` optional) vs `bind:value`/`bind:group`/`bind:checked` (consumer + child must use `$state` and `$bindable()`). `[CITED]`
- [Svelte 5 {#key} block docs](https://svelte.dev/docs/svelte/key) — documents component reinit and transition replay use cases. `[CITED]`
- [Svelte discussion #15979](https://github.com/sveltejs/svelte/discussions/15979) — canonical guidance on when `bind:this` requires `$state` vs plain `let`: "So long you use el inside an effect or onMount(), and your logic doesn't destroy the bound element reactively (like inside an {#each} or {#if} block), you should be ok with a non-reactive variable." `[CITED]`

### Tertiary (LOW confidence)
- [Svelte issue #12721](https://github.com/sveltejs/svelte/issues/12721) — false-positive scenarios for `binding_property_non_reactive` in snippet-passing chains. Cited as awareness only; the audit doesn't expect to encounter snippet-passing false positives in OpenVAA's codebase. `[CITED — flagged for validation]`
- [Svelte issue #14295](https://github.com/sveltejs/svelte/issues/14295) — community discussion of warning ergonomics. Awareness only. `[CITED — not actionable]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; everything is in-tree.
- Architecture (3-plan split): HIGH — locked by CONTEXT.md D-05.
- Pitfalls: HIGH — drawn from in-tree fix patterns and verified Svelte docs.
- Destructure rule: HIGH — Phase 61 P03 diagnosis is the canonical reference; in-tree comment already documents the rule.
- Inline-justification syntax recommendation (Option A): MEDIUM — based on count of in-tree usage; planner discretion per CONTEXT.md.

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days; stable Svelte 5 + stable codebase; no fast-moving dependencies relevant to this hygiene work)

---

## RESEARCH COMPLETE

**Phase:** 65 - Svelte 5 Audit Sweeps
**Confidence:** HIGH

### Key Findings

- **Bind distribution verified:** 93 sites; 38 `bind:this` (dominant), 11 `bind:selected`, 10 `bind:value`, 4 `bind:group`, 4 `bind:password`, plus `$bindable()` is correctly applied at ~30 in-tree sites — meaning Pattern 2 violations are likely rare; Pattern 1 (`bind:this` on property-write target → needs `$state`) is the main fix shape.
- **Both `{#key}` sites are deliberate** (URL-context reset + question-id remount); no removals expected. `{#key question.id}` may be papering over a destructure-staleness bug at the same file's line 47 — flagged as Open Question 1.
- **Destructure rule has an in-tree exemplar** at `voters/results/+layout.svelte:61-79` and a 18-line documentation comment at `candidateContext.svelte.ts:106-123` — these are the anchor references for the CLAUDE.md text. Recommended text drafted in Code Example 7.
- **No new tooling needed.** 93 sites is tractable manually; existing Playwright + svelte-check + vitest cover the verification surface; v2.6 parity gate tooling at HEAD `2c7ad2dea` is reusable as-is.
- **Risk surface is narrow:** main hazards are (a) removing a `bind:` that's actually a child→parent contract (Pitfall 1), (b) `untrack` discipline if a `$state` conversion triggers depth-exceeded (Pitfall 2), (c) destructure rewrite breaking `bind:` consumers that need a setter (Pitfall 3), and (d) inadvertently breaking legacy `$store` auto-subscribe by rewriting through `ctx.X` (Pitfall 5).

### File Created
`.planning/phases/65-svelte-5-audit-sweeps/65-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new libs; in-tree dependencies; verified against codebase |
| Architecture (3-plan split) | HIGH | Locked by CONTEXT.md D-05 |
| Pitfalls | HIGH | In-tree fix patterns + verified Svelte 5 docs |
| Destructure rule wording | HIGH | Anchored on existing in-tree comment + working canonical |
| Inline syntax recommendation | MEDIUM | Stylistic; planner discretion |

### Open Questions
1. Should the destructure rewrite at `[questionId]/+page.svelte:47` happen even though that file is outside `apps/frontend/src/lib/**`? (Answer: yes — destructure audit is codebase-wide per D-02; only the bind audit is lib-only.)
2. Preventive vs symptom-driven destructure rewrite? (Recommend preventive.)
3. 65-02 internal task split? (Single plan; multiple tasks.)
4. Candidate-app smoke checklist artifact convention? (Inline in 65-03.)

### Ready for Planning

Research complete. Planner has:
- 5 patterns documented with code examples
- 5 pitfalls catalogued with mitigations
- A working in-tree CLAUDE.md text draft (Code Example 7)
- Validation Architecture mapping all 3 requirements to specific commands
- Risk surface and assumptions explicitly logged

3-plan decomposition is ready: Plan 65-01 (bind audit, lib-scope, ~93 site Edits + inline annotations); Plan 65-02 (key audit + destructure audit + CLAUDE.md text); Plan 65-03 (verification: voter 9-step smoke + candidate 4-step smoke + parity gate re-run).

Sources:
- [Svelte 5 Runtime Warnings](https://svelte.dev/docs/svelte/runtime-warnings)
- [Svelte 5 bind: directive](https://svelte.dev/docs/svelte/bind)
- [Svelte 5 {#key} block](https://svelte.dev/docs/svelte/key)
- [Svelte discussion #15979 — $state for bind:this](https://github.com/sveltejs/svelte/discussions/15979)
- [Svelte issue #12721 — binding_property_non_reactive false positive](https://github.com/sveltejs/svelte/issues/12721)
- [Svelte issue #14295 — warning ergonomics](https://github.com/sveltejs/svelte/issues/14295)
