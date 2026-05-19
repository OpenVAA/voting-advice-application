# Phase 27: Candidate Route Migration - Research

**Researched:** 2026-03-21
**Domain:** Svelte 5 runes migration for SvelteKit candidate route files (pages + layouts)
**Confidence:** HIGH

## Summary

Phase 27 migrates 25 candidate route files (6 `+layout.svelte`, 19 `+page.svelte` under `candidate/`) from Svelte 4 reactive patterns to Svelte 5 runes. The migration scope covers 30 active `$:` reactive statements across 15 files, 1 active `on:event` directive (`on:submit|preventDefault` in forgot-password), 6 `<slot />` usages in layout files, 1 `export let data` declaration, 7 files using `$page` from `$app/stores`, and adding `<svelte:options runes />` to all 25 files. Additionally, 3 standalone `onMount` calls (candidate root layout, login, preregister) must be converted to `$effect`, while 13 `getLayoutContext(onDestroy)` calls remain unchanged per D-01.

This phase is a direct extension of Phase 24 (voter route migration), applying identical patterns to candidate routes. The project runs Svelte 5.53.12 and SvelteKit 2.55.0. All patterns were validated in Phase 24 and are well-established across 100+ components and 19 voter routes already migrated. The most complex migration is `(protected)/+layout.svelte` with its async data-loading pattern (mirrors Phase 24's `(located)/+layout.svelte` exactly) and `(protected)/questions/[questionId]/+page.svelte` with 4 `$:` statements requiring derivation/effect splitting.

**Primary recommendation:** Batch by route group -- auth routes (simplest) first, then preregister routes, then protected routes with the two most complex files (`(protected)/+layout.svelte` and `[questionId]/+page.svelte`) last.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: `getLayoutContext(onDestroy)` calls (13 files) are kept as-is -- the `onDestroy` import stays for these files. Converting would require changing the context API signature, which is deferred scope.
- D-02: Standalone `onMount` (6 files -- login focus, OIDC redirect, popup queue) converted to `$effect`. These are simple init-once effects not tied to the context system.
- D-03: Standalone `onDestroy` calls (not `getLayoutContext`) converted to `$effect` with cleanup return. Only `getLayoutContext(onDestroy)` calls keep the `onDestroy` import.
- D-04: Single-expression derivations -> `$derived()` (e.g., `canSubmit`, `cancelLabel`, `nominations`, `allRequiredFilled`)
- D-05: Multi-statement if/else chains that derive multiple values -> `$derived.by(() => { ... return { submitRoute, submitLabel } })` (e.g., profile and [questionId] submit routing blocks)
- D-06: `$:` blocks with side effects (async calls, navigation, state mutation) -> `$effect`
- D-07: The [questionId]/+page.svelte big `$:` block (line 73) is split: question/customData/nextQuestionId extraction -> `$derived.by()`, video.load() and status mutation -> separate `$effect` watching the derived values. Clean derivation/effect separation.
- D-08: OIDC callback `$:` block (authorizationCode extraction + exchangeCodeForIdToken/goto) -> single `$effect`. The whole block is a side effect watching URL params.
- D-09: Register page `$:` block watching registrationKey to set changedAfterCheck -> `$effect`. Side effect of input changes.
- D-10: (protected)/+layout.svelte async Promise.all data-loading block -> `$effect` (NOT `$derived`), with `$state()` for ready/error. Same pattern as Phase 24's (located)/+layout.svelte. Infinite-loop guard function stays.
- D-11: `on:click` -> `onclick`, `on:submit|preventDefault` -> `onsubmit` with `e.preventDefault()` in handler. Only 1 active instance remains (forgot-password).
- D-12: Every migrated candidate route file gets `<svelte:options runes />`
- D-13: `export let data` -> `let { data } = $props()` in all route files
- D-14: `$page` store -> `page` from `$app/state`
- D-15: `$store` shorthand kept for all context stores (getCandidateContext(), etc.)
- D-16: `<slot />` -> `{@render children?.()}` in layout files

### Claude's Discretion
- Migration ordering and plan batching across the 25 candidate route files
- Exact cleanup of redundant imports after migration
- How to handle edge cases in `$effect` cleanup/teardown
- Whether to batch by route group (auth, protected, preregister) or by complexity

### Deferred Ideas (OUT OF SCOPE)
- Context system rewrite -- Replacing `getLayoutContext(onDestroy)` with native Svelte 5 reactivity (separate milestone, CTX-01/02/03)
- Store-to-runes migration -- Replacing context store `$store` shorthand with `$derived`/`$state` (separate milestone)
- Layout -> +layout conversion -- Converting Layout.svelte, MainContent.svelte into proper `+layout` files (carried from Phase 24)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | All candidate auth routes (login, register, password) use $derived/$effect instead of $: | 10 `$:` statements catalogued across 5 auth route files with rune classification. All are simple derivations or side effects. |
| ROUTE-02 | All candidate protected routes (profile, questions, settings, preview) use $derived/$effect instead of $: | 16 `$:` statements catalogued across 7 protected route files. Includes the two most complex migrations (D-07, D-10). |
| ROUTE-03 | All candidate preregister routes use $derived/$effect instead of $: | 3 `$:` statements catalogued across 2 preregister files. Simple patterns. |
| ROUTE-04 | All candidate layouts use $derived/$effect instead of $: | 1 `$:` statement in questions/+layout.svelte (redirect + progress). Other layouts have no `$:` but need `<slot />` and `<svelte:options runes />`. |
| EVNT-01 | All on:event directives replaced with native event attributes | 1 active instance: `on:submit\|preventDefault` in forgot-password. 1 commented-out instance in settings (stashed code, not compiled). |
| EVNT-02 | All event modifiers replaced with explicit handler calls | 1 instance: `\|preventDefault` on forgot-password form. Convert to `onsubmit` with `e.preventDefault()` in handler. |
| LIFE-01 | All onMount/onDestroy converted to $effect where appropriate | 3 standalone `onMount` calls (root layout, login, preregister) -> `$effect`. 13 `getLayoutContext(onDestroy)` calls kept as-is (D-01). No standalone `onDestroy` calls found. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Component framework | Project dependency, current (verified from yarn.lock) |
| @sveltejs/kit | 2.55.0 | Application framework | Project dependency, current (from Phase 24 verification) |

### Key Imports for Migration
| Import | From | Purpose |
|--------|------|---------|
| `page` | `$app/state` | Replaces `$page` from `$app/stores` -- reactive object, not store |
| `$props()` | svelte (rune) | Replaces `export let` for component/route props |
| `$derived()` | svelte (rune) | Replaces single-expression `$:` reactive declarations |
| `$derived.by()` | svelte (rune) | Replaces multi-statement `$:` blocks (pure computations) |
| `$effect()` | svelte (rune) | Replaces `$:` blocks with side effects, replaces `onMount` |
| `$state()` | svelte (rune) | Replaces `let` vars that need explicit reactivity in runes mode |
| `{@render}` | svelte (template) | Replaces `<slot />` |
| `Snippet` | svelte (type) | Type for `children` prop in layouts |

No new packages need to be installed.

## Architecture Patterns

### Complete File Inventory

**25 candidate route files** organized by migration complexity and recommended batch grouping:

#### Batch A: Minimal Migration (no `$:`, no `onMount`) -- 10 files
These files need only `<svelte:options runes />` and possibly `<slot />` -> `{@render}` or `$page` -> `page`:

1. `candidate/help/+page.svelte` -- No `$:`, no lifecycle, no `$page`
2. `candidate/privacy/+page.svelte` -- No `$:`, no lifecycle, no `$page`
3. `candidate/preregister/(authenticated)/constituencies/+page.svelte` -- No `$:`, no lifecycle
4. `candidate/preregister/(authenticated)/elections/+page.svelte` -- No `$:`, no lifecycle
5. `candidate/preregister/(authenticated)/email/+page.svelte` -- No `$:`, no lifecycle
6. `candidate/preregister/(authenticated)/+layout.svelte` -- `<slot />`, `getLayoutContext(onDestroy)` (kept)
7. `candidate/preregister/+layout.svelte` -- `<slot />`, `getLayoutContext(onDestroy)` (kept)
8. `candidate/register/+layout.svelte` -- `<slot />`, `getLayoutContext(onDestroy)` (kept)
9. `candidate/forgot-password/+page.svelte` -- `on:submit|preventDefault` (EVNT-01/02), `getLayoutContext(onDestroy)` (kept)
10. `candidate/(protected)/questions/+page.svelte` -- 1x `$:` derivation (simple)

#### Batch B: Simple `$:` + `$page` Migrations -- 7 files
11. `candidate/password-reset/+page.svelte` -- 2x `$:` derivation, `$page` store
12. `candidate/register/password/+page.svelte` -- 2x `$:` derivation, `$page` store
13. `candidate/(protected)/settings/+page.svelte` -- 2x `$:` derivation, `getLayoutContext(onDestroy)` (kept)
14. `candidate/preregister/status/+page.svelte` -- 1x `$:` derivation, `$page` store
15. `candidate/preregister/signicat/oidc/callback/+page.svelte` -- 2x `$:` (D-08), `$page` store
16. `candidate/register/+page.svelte` -- 2x `$:` (D-09), `$page` store
17. `candidate/preregister/+page.svelte` -- `onMount` -> `$effect`, `getLayoutContext(onDestroy)` (kept)

#### Batch C: Moderate Complexity -- 4 files
18. `candidate/login/+page.svelte` -- 2x `$:`, `onMount` -> `$effect`, `$page` store, `getLayoutContext(onDestroy)` (kept)
19. `candidate/+layout.svelte` -- `onMount` -> `$effect`, `<slot />`, `getLayoutContext(onDestroy)` (kept)
20. `candidate/(protected)/+page.svelte` -- 1x large `$:` block -> `$derived.by()`, no lifecycle
21. `candidate/(protected)/preview/+page.svelte` -- 1x `$:` block (async side effect) -> `$effect`, `getLayoutContext(onDestroy)` (kept)

#### Batch D: High Complexity -- 4 files
22. `candidate/(protected)/profile/+page.svelte` -- 4x `$:` (D-04, D-05), `getLayoutContext(onDestroy)` (kept)
23. `candidate/(protected)/questions/+layout.svelte` -- 3x `$:` (redirect + progress), `<slot />`, `getLayoutContext(onDestroy)` (kept)
24. `candidate/(protected)/questions/[questionId]/+page.svelte` -- 4x `$:` (D-07), `$page` store, `getLayoutContext(onDestroy)` (kept)
25. `candidate/(protected)/+layout.svelte` -- 2x `$:` (D-10), `export let data`, `<slot />`, async data-loading

### Pattern 1: `$page` to `page` Migration
**What:** Replace `import { page } from '$app/stores'` with `import { page } from '$app/state'` and remove `$` prefix from all `$page` usages.
**When to use:** 7 candidate route files that import from `$app/stores`.
**Critical detail:** `page` from `$app/state` is a reactive object, not a store. Access `page.url`, `page.params` directly. Do NOT use `$page.url`.

```typescript
// Before:
import { page } from '$app/stores';
$: authorizationCode = $page.url.searchParams.get('code');

// After:
import { page } from '$app/state';
let authorizationCode = $derived(page.url.searchParams.get('code'));
```

### Pattern 2: Simple `$:` Derivation to `$derived()`
**What:** Single-expression reactive declarations become `$derived()`.
**When to use:** `canSubmit`, `cancelLabel`, `submitLabel`, `allRequiredFilled`, `nominations`, `completion`, simple derivations.

```typescript
// Before:
$: canSubmit = status !== 'loading' && isPasswordValid;
$: submitLabel = validationError || t('candidateApp.setPassword.setPassword');

// After:
let canSubmit = $derived(status !== 'loading' && isPasswordValid);
let submitLabel = $derived(validationError || t('candidateApp.setPassword.setPassword'));
```

**Note:** `status` must be `$state()` for these derivations to re-evaluate when `status` changes.

### Pattern 3: Submit Routing Block to `$derived.by()` (D-05)
**What:** Multi-statement if/else chains that derive multiple values.
**When to use:** Profile and [questionId] submit routing blocks.

```typescript
// Before (profile/+page.svelte):
$: if (allRequiredFilled && $unansweredOpinionQuestions.length && !$answersLocked) {
    submitLabel = $hasUnsaved ? t('common.saveAndContinue') : t('common.continue');
    submitRoute = $getRoute('CandAppQuestions');
} else {
    submitRoute = $getRoute('CandAppHome');
    submitLabel = $answersLocked || !$hasUnsaved ? t('common.return') : t('common.saveAndReturn');
}

// After:
let submitInfo = $derived.by(() => {
    if (allRequiredFilled && $unansweredOpinionQuestions.length && !$answersLocked) {
        return {
            label: $hasUnsaved ? t('common.saveAndContinue') : t('common.continue'),
            route: $getRoute('CandAppQuestions')
        };
    }
    return {
        route: $getRoute('CandAppHome'),
        label: $answersLocked || !$hasUnsaved ? t('common.return') : t('common.saveAndReturn')
    };
});
// Then use submitInfo.label and submitInfo.route in template
```

**Alternative:** Keep separate `submitLabel` and `submitRoute` derivations if template usage is extensive (less refactoring of template references):

```typescript
let submitRouting = $derived.by(() => {
    if (allRequiredFilled && $unansweredOpinionQuestions.length && !$answersLocked) {
        return {
            submitRoute: $getRoute('CandAppQuestions'),
            submitLabel: $hasUnsaved ? t('common.saveAndContinue') : t('common.continue')
        };
    }
    return {
        submitRoute: $getRoute('CandAppHome'),
        submitLabel: $answersLocked || !$hasUnsaved ? t('common.return') : t('common.saveAndReturn')
    };
});
// Use submitRouting.submitRoute and submitRouting.submitLabel
```

### Pattern 4: [questionId] Block Split (D-07)
**What:** The big `$:` block at line 73 of `[questionId]/+page.svelte` combines derivation (get question, customData, nextQuestionId) and side effects (video.load(), status mutation).
**How to split:**

```typescript
// Before:
$: {
    const questionId = parseParams($page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
        question = $dataRoot.getQuestion(questionId);
        customData = getCustomData(question);
        nextQuestionId = getNextQuestionId(question);
        status = 'idle';
        if (!$appSettings.candidateApp.questions.hideVideo && customData?.video) {
            video.load(customData.video);
        }
    } catch {
        error(404, `Question with id ${questionId} not found.`);
    }
    isLastUnanswered = getIsLastUnanswered();
}

// After: Split into derivation + effect
let questionData = $derived.by(() => {
    const questionId = parseParams(page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
        const q = $dataRoot.getQuestion(questionId);
        const cd = getCustomData(q);
        const nextId = getNextQuestionId(q);
        const lastUnanswered = getIsLastUnanswered();
        return { question: q, customData: cd, nextQuestionId: nextId, isLastUnanswered: lastUnanswered };
    } catch {
        error(404, `Question with id ${questionId} not found.`);
    }
});

// Destructure for template use
let question = $derived(questionData!.question);
let customData = $derived(questionData!.customData);
let nextQuestionId = $derived(questionData!.nextQuestionId);
let isLastUnanswered = $derived(questionData!.isLastUnanswered);

// Side effects in separate $effect
$effect(() => {
    // Reset status when question changes
    status = 'idle';
    // Load video content if enabled and available
    const cd = questionData!.customData;
    if (!$appSettings.candidateApp.questions.hideVideo && cd?.video) {
        video.load(cd.video);
    }
});
```

**Note:** `status` must become `$state<ActionStatus>('loading')` since it drives template rendering.

### Pattern 5: Async Data-Loading `$effect` (D-10)
**What:** The `(protected)/+layout.svelte` `$:` block watching `data` for async Promise resolution.
**Mirrors:** Phase 24's `(located)/+layout.svelte` pattern exactly.

```typescript
// Before:
export let data;
let error: Error | undefined;
let ready: boolean;
$: {
    error = undefined;
    ready = false;
    Promise.all([data.questionData, data.candidateUserData]).then((data) => {
        error = update(data);
    });
}
$: if (error) logDebugError(error.message);

// After:
let { data, children }: { data: any; children: Snippet } = $props();

let error = $state<Error | undefined>(undefined);
let ready = $state(false);

$effect(() => {
    // Read data synchronously to register as dependency
    const questionData = data.questionData;
    const candidateUserData = data.candidateUserData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([questionData, candidateUserData]).then((resolved) => {
        error = update(resolved);
    });
});

// Error logging as separate effect
$effect(() => {
    if (error) logDebugError(error.message);
});
```

### Pattern 6: OIDC Callback (D-08)
**What:** The callback page extracts authorization code from URL and exchanges it.

```typescript
// Before:
$: authorizationCode = $page.url.searchParams.get('code');
$: if (authorizationCode) {
    exchangeCodeForIdToken({ ... });
} else {
    goto($getRoute('CandAppPreregister'));
}

// After:
import { page } from '$app/state';

$effect(() => {
    const authorizationCode = page.url.searchParams.get('code');
    if (authorizationCode) {
        exchangeCodeForIdToken({
            authorizationCode,
            codeVerifier: localStorage.getItem('code_verifier') ?? '',
            redirectUri: `${window.location.origin}${window.location.pathname}`
        });
    } else {
        goto($getRoute('CandAppPreregister'));
    }
});
```

### Pattern 7: `onMount` to `$effect` (D-02)
**What:** Standalone `onMount` calls for init-once operations.

```typescript
// Before (candidate/+layout.svelte):
import { onDestroy, onMount } from 'svelte';
onMount(() => {
    if (!$appSettings.access.candidateApp || !$appSettings.dataAdapter.supportsCandidateApp) return;
    if ($appSettings.notifications.candidateApp?.show)
        popupQueue.push({ component: Notification, props: { data: $appSettings.notifications.candidateApp } });
});

// After:
import { onDestroy } from 'svelte';  // kept for getLayoutContext
$effect(() => {
    if (!$appSettings.access.candidateApp || !$appSettings.dataAdapter.supportsCandidateApp) return;
    if ($appSettings.notifications.candidateApp?.show)
        popupQueue.push({ component: Notification, props: { data: $appSettings.notifications.candidateApp } });
});
```

**Note:** `$effect` does not run during SSR (same as `onMount`), so the behavior is identical. However, `$effect` re-runs when dependencies change -- for these init-once patterns, all dependencies are effectively constant (settings loaded once), so re-runs are not a concern. If strict one-time execution is needed, use `$effect` with an early-return guard.

### Pattern 8: `<slot />` to `{@render children?.()}`
**What:** 6 layout files use `<slot />` for child route content.

```svelte
<!-- Before: -->
<slot />

<!-- After (in script): -->
import type { Snippet } from 'svelte';
let { children }: { children: Snippet } = $props();

<!-- After (in template): -->
{@render children?.()}
```

**Files with `<slot />`:** candidate/+layout.svelte, (protected)/+layout.svelte, (protected)/questions/+layout.svelte, preregister/+layout.svelte, preregister/(authenticated)/+layout.svelte, register/+layout.svelte.

### Pattern 9: Register Page changedAfterCheck (D-09)
**What:** The register page has a `$:` block that watches `registrationKey` to set `changedAfterCheck`.

```typescript
// Before:
$: canSubmit = status !== 'loading' && registrationKey !== '' && (status !== 'error' || changedAfterCheck);
$: {
    changedAfterCheck = true;
    registrationKey; // eslint-disable-next-line
}

// After:
let canSubmit = $derived(status !== 'loading' && registrationKey !== '' && (status !== 'error' || changedAfterCheck));

$effect(() => {
    // Track registrationKey changes to re-enable submit after error
    registrationKey; // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    changedAfterCheck = true;
});
```

**Note:** `changedAfterCheck`, `status`, and `registrationKey` must be `$state()`.

### Anti-Patterns to Avoid

- **Reading reactive state after `await` in `$effect`:** Values read asynchronously are NOT tracked. Access all dependencies synchronously first.
- **Using `$page` with `$app/state`:** The `page` object from `$app/state` is NOT a store. Do not use `$page.something` -- use `page.something` directly.
- **Converting `getLayoutContext(onDestroy)` calls:** These MUST stay as-is. The `onDestroy` import is required for the stacked settings cleanup mechanism.
- **Tracking `$dataRoot` inside the data-loading `$effect`:** This was explicitly avoided in the original code (isolated in `update()` function) to prevent infinite loops. Preserve this pattern.
- **Making `$effect` callback async:** Svelte does not support async effect functions. Call `.then()` on promises instead.
- **Forgetting `$state()` for mutated variables:** In runes mode, only `$state()` variables trigger re-renders when mutated. Variables like `status`, `ready`, `error`, `showTermsOfUse`, `termsAccepted`, `changedAfterCheck` need `$state()`.

## Detailed `$:` Statement Classification

| File | Line | `$:` Statement | Classification | Target Rune | Decision |
|------|------|---------------|---------------|-------------|----------|
| (protected)/+layout.svelte | 61 | Block: async data loading | Side effect | `$effect` | D-10 |
| (protected)/+layout.svelte | 69 | `if (error) logDebugError(...)` | Side effect | `$effect` | D-06 |
| (protected)/+page.svelte | 51 | Block: compute nextAction | Pure computation | `$derived.by()` | D-05 |
| (protected)/preview/+page.svelte | 40 | Block: loadCandidate() + locale | Side effect (async) | `$effect` | D-06 |
| (protected)/profile/+page.svelte | 68 | `nominations = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/profile/+page.svelte | 107 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/profile/+page.svelte | 109 | `allRequiredFilled = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/profile/+page.svelte | 111 | if/else submitLabel/submitRoute | Pure multi-value | `$derived.by()` | D-05 |
| (protected)/questions/+layout.svelte | 31 | `if (...) goto(...)` | Side effect | `$effect` | D-06 |
| (protected)/questions/+layout.svelte | 43 | `progress.max.set(...)` | Side effect | `$effect` | D-06 |
| (protected)/questions/+layout.svelte | 44 | `progress.current.set(...)` | Side effect | `$effect` | D-06 |
| (protected)/questions/+page.svelte | 52 | `completion = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/questions/[questionId] | 73 | Block: get question + video.load | Mixed | `$derived.by()` + `$effect` | D-07 |
| (protected)/questions/[questionId] | 113 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/questions/[questionId] | 115 | if/else submitRoute/submitLabel | Pure multi-value | `$derived.by()` | D-05 |
| (protected)/questions/[questionId] | 127 | `cancelLabel = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/settings/+page.svelte | 45 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| (protected)/settings/+page.svelte | 46 | `submitLabel = ...` | Pure derivation | `$derived` | D-04 |
| login/+page.svelte | 75 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| login/+page.svelte | 87 | `isLoginShown = ...` | Pure derivation | `$derived` | D-04 |
| password-reset/+page.svelte | 47 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| password-reset/+page.svelte | 48 | `submitLabel = ...` | Pure derivation | `$derived` | D-04 |
| preregister/status/+page.svelte | 16 | `code = $page.url...` | Pure derivation | `$derived` | D-04 |
| preregister/signicat/oidc/callback | 18 | `authorizationCode = ...` | Pure derivation | `$derived` | Part of D-08 |
| preregister/signicat/oidc/callback | 20 | `if (authorizationCode) {...}` | Side effect | `$effect` | D-08 |
| register/+page.svelte | 42 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| register/+page.svelte | 43 | Block: changedAfterCheck | Side effect | `$effect` | D-09 |
| register/password/+page.svelte | 58 | `canSubmit = ...` | Pure derivation | `$derived` | D-04 |
| register/password/+page.svelte | 59 | `submitLabel = ...` | Pure derivation | `$derived` | D-04 |

**Total active `$:` statements: 29** (not 34 as estimated in CONTEXT.md -- the 5 stashed/commented `on:change` in settings doesn't count, and one `$:` is part of the same effect in the callback page)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page state reactivity | Custom store subscriptions | `page` from `$app/state` | Built-in reactive object, fine-grained updates |
| Reactive declarations | Manual subscriptions | `$derived` / `$derived.by()` | Compiler-optimized, automatic dependency tracking |
| Side effect tracking | Manual dependency arrays | `$effect` | Automatic tracking of synchronously-read values |
| Init-once logic | `onMount` with `if (!initialized)` | `$effect` | Runs in browser only (same as onMount), simpler API |

## Variables Requiring `$state()` Conversion

In runes mode, variables that are mutated AND drive template rendering or derived computations must use `$state()`. Identified across all candidate route files:

| File | Variables | Current Pattern | Why `$state()` |
|------|-----------|-----------------|----------------|
| (protected)/+layout.svelte | `error`, `ready`, `showTermsOfUse`, `status`, `termsAccepted` | `let` | Drive conditional rendering (`{#if error}`, `{#if !ready}`, `{#if showTermsOfUse}`) |
| (protected)/+page.svelte | `nextAction` | `let` | Drives template text rendering |
| (protected)/preview/+page.svelte | `status`, `entity` | `let` | Drive conditional rendering |
| (protected)/profile/+page.svelte | `bypassPreventNavigation`, `status` | `let` | Drive conditional rendering and handler logic |
| (protected)/questions/[questionId] | `bypassPreventNavigation`, `status`, `errorMessage` | `let` | Drive conditional rendering |
| (protected)/settings/+page.svelte | `canSubmit` (wait -- this becomes `$derived`)... `currentPassword`, `isNewPasswordValid`, `password`, `status`, `validationError` | `let` | Drive template and bind: |
| login/+page.svelte | `email`, `password`, `status`, `showLogin`, `showPasswordSetMessage`, `errorMessage` | `let` | Drive conditional rendering, bind:value |
| register/+page.svelte | `registrationKey`, `changedAfterCheck`, `status` | `let` | Drive template rendering |
| register/password/+page.svelte | `isPasswordValid`, `password`, `status`, `validationError` | `let` | Drive template rendering |
| preregister/+page.svelte | (none beyond stores) | -- | -- |
| preregister/status/+page.svelte | (none) | -- | -- |
| password-reset/+page.svelte | `isPasswordValid`, `password`, `status`, `validationError` | `let` | Drive template rendering |
| forgot-password/+page.svelte | `email`, `status` | `let` | Drive template rendering |

**Key insight:** Variables used with `bind:value` or `bind:this` in templates already work in runes mode without `$state()` because Svelte 5's `bind:` directive creates implicit state. However, variables used in `$derived` or driving `{#if}` blocks must be `$state()`. The safe approach: convert all mutated variables that affect rendering to `$state()`.

**Variables used with `bind:` that ALSO need `$state()`:** Variables like `email`, `password`, `registrationKey` are bound via `bind:value` but also participate in derived computations (`canSubmit`). These need `$state()` so both the binding and the derived computation work reactively.

## Common Pitfalls

### Pitfall 1: Infinite Loop in Data-Loading Effect (D-10)
**What goes wrong:** Reading `$dataRoot` inside the `$effect` that calls `$dataRoot.provideQuestionData()` creates a read-write cycle.
**Why it happens:** `$effect` tracks all reactive reads. If you read `$dataRoot` and then mutate it, the effect re-triggers infinitely.
**How to avoid:** The existing code already isolates `$dataRoot` access inside the `update()` function. Preserve this -- do NOT destructure or read `$dataRoot` at the top of the `$effect`.
**Warning signs:** Browser tab freezes, "Maximum update depth exceeded" console errors.

### Pitfall 2: Untracked Async Dependencies
**What goes wrong:** Reactive values read after `await` or inside `.then()` are not tracked by `$effect`.
**Why it happens:** Svelte only tracks synchronous reads during the effect's initial execution.
**How to avoid:** Capture all reactive dependencies into local `const` variables BEFORE any `await` or `.then()`.
**Warning signs:** Effect doesn't re-run when expected data changes.

### Pitfall 3: `$page` vs `page` Inconsistency
**What goes wrong:** After changing the import to `$app/state`, forgetting to remove `$` prefix from some `$page` usages (script or template).
**Why it happens:** grep/find-replace misses, especially in template expressions.
**How to avoid:** Search for ALL `$page` occurrences in each file. In `$app/state` mode, zero `$page` references should remain.
**Warning signs:** "page is not defined" or "$page is not defined" compiler errors.

### Pitfall 4: Forgetting `$state()` for Bound + Derived Variables
**What goes wrong:** A `bind:value` variable like `registrationKey` works for the input but `$derived(... && registrationKey !== '')` doesn't update.
**Why it happens:** In runes mode, `bind:` creates a two-way binding but doesn't make the variable's mutations trigger `$derived` re-evaluation unless it's `$state()`.
**How to avoid:** Any variable that participates in BOTH `bind:` AND `$derived`/`$effect` must be declared with `$state()`.
**Warning signs:** Derived values not updating when user types in input.

### Pitfall 5: Store `$` Shorthand in Runes Mode
**What goes wrong:** Developers might try to convert `$store` syntax (e.g., `$userData`, `$dataRoot`, `$answersLocked`).
**Why it happens:** Confusion between store `$` prefix and Svelte 4 `$:` reactive syntax.
**How to avoid:** `$store` shorthand works correctly in Svelte 5 runes mode. Leave all store access unchanged. Only `$:` reactive declarations and `$page` store need conversion.

### Pitfall 6: `onMount` to `$effect` Re-run Behavior
**What goes wrong:** `$effect` re-runs when dependencies change, while `onMount` runs once.
**Why it happens:** `$effect` automatically tracks reactive reads. If the effect body reads a store that changes, it re-runs.
**How to avoid:** For the candidate routes' `onMount` patterns (popup queue push, focus), the dependencies are effectively constant (settings are loaded once). No guard needed. But if unsure, use `$effect(() => { untrack(() => { ... }); })` or a boolean guard.
**Warning signs:** Popup shown multiple times, focus called repeatedly.

### Pitfall 7: SSR and `$effect`
**What goes wrong:** `$effect` does not run during SSR. If initial state depends on effect execution, SSR renders the pre-effect state.
**Why it happens:** Effects are browser-only by design.
**How to avoid:** This is the desired behavior for data-loading layouts (show `<Loading />`). Verify initial `$state` values produce correct SSR output.

## Code Examples

### Complete Migration: forgot-password/+page.svelte (EVNT-01/02)
```svelte
<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';

  const { getRoute, requestForgotPasswordEmail, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  let email = $state('');
  let status = $state<ActionStatus>('idle');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    status = 'loading';
    const result = await requestForgotPasswordEmail({ email }).catch((e) => {
      logDebugError(`Error requesting password reset email: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    status = 'success';
    email = '';
  }

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<!-- Template: on:submit|preventDefault becomes onsubmit -->
<form onsubmit={handleSubmit} class="flex flex-col items-center">
  <!-- ... rest unchanged ... -->
</form>
```

### Complete Migration: (protected)/+layout.svelte (D-10)
```svelte
<svelte:options runes />

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { CandidateUserData } from '$lib/api/base/dataWriter.type';

  let { data, children }: { data: any; children: Snippet } = $props();

  const { dataRoot, logout, t, userData } = getCandidateContext();

  let showTermsOfUse = $state(false);
  let status = $state<ActionStatus>('idle');
  let termsAccepted = $state<boolean | undefined>(undefined);
  let error = $state<Error | undefined>(undefined);
  let ready = $state(false);

  // ... handlers unchanged ...

  $effect(() => {
    const questionData = data.questionData;
    const candidateUserData = data.candidateUserData;
    error = undefined;
    ready = false;
    Promise.all([questionData, candidateUserData]).then((resolved) => {
      error = update(resolved);
    });
  });

  $effect(() => {
    if (error) logDebugError(error.message);
  });

  // update() function remains unchanged (infinite-loop guard)
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else if showTermsOfUse}
  <!-- ... unchanged ... -->
{:else}
  {@render children?.()}
{/if}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$:` reactive declarations | `$derived` / `$derived.by()` | Svelte 5 (Oct 2024) | Explicit dependency tracking, better performance |
| `$:` side effect blocks | `$effect()` | Svelte 5 (Oct 2024) | Cleanup functions, no SSR execution |
| `export let` | `$props()` | Svelte 5 (Oct 2024) | Type-safe, destructurable |
| `<slot />` | `{@render children?.()}` | Svelte 5 (Oct 2024) | Snippet-based, composable |
| `import { page } from '$app/stores'` | `import { page } from '$app/state'` | SvelteKit 2.12 (2024) | Fine-grained reactivity, no store overhead |
| `onMount(() => {...})` | `$effect(() => {...})` | Svelte 5 (Oct 2024) | Unified lifecycle API, auto-cleanup |
| `on:submit\|preventDefault` | `onsubmit` + `e.preventDefault()` | Svelte 5 (Oct 2024) | Native event attributes, no special syntax |

**Deprecated:**
- `$app/stores`: Deprecated in SvelteKit 2.12, will be removed in SvelteKit 3. Still functional but should be migrated.
- `$:` syntax: Still supported in Svelte 5 legacy mode, but incompatible with `<svelte:options runes />`.
- `on:event` directives: Still supported in legacy mode, but `<svelte:options runes />` requires native attributes.

## Open Questions

1. **`onMount` to `$effect` for popup queue**
   - What we know: `candidate/+layout.svelte` pushes to popupQueue in `onMount`. With `$effect`, this runs on mount AND whenever tracked dependencies change.
   - What's unclear: Whether `$appSettings.notifications.candidateApp?.show` ever changes after initial load (it shouldn't, since settings are loaded once).
   - Recommendation: Convert directly to `$effect`. If double-push is observed, wrap body in `untrack()`. LOW risk since settings are effectively constant.

2. **`bind:value` + `$state()` interaction with `registrationKey`**
   - What we know: `registrationKey` is initialized from `$page.url.searchParams.get('registrationKey')` and also bound to an input via `bind:value`.
   - What's unclear: After converting `$page` to `page`, whether the initial value assignment from `page.url.searchParams.get(...)` works correctly outside of `$state()`.
   - Recommendation: Use `let registrationKey = $state(page.url.searchParams.get('registrationKey'))` -- the `$state()` is needed for both the binding and the derived computation.

## Verification Strategy

### E2E Test Coverage
5 candidate E2E spec files available for regression testing:
- `tests/tests/specs/candidate/candidate-auth.spec.ts` -- Login/logout flows
- `tests/tests/specs/candidate/candidate-profile.spec.ts` -- Profile editing
- `tests/tests/specs/candidate/candidate-questions.spec.ts` -- Question answering
- `tests/tests/specs/candidate/candidate-registration.spec.ts` -- Registration flow
- `tests/tests/specs/candidate/candidate-settings.spec.ts` -- Settings/password

### Grep Verification Commands
After migration, verify zero legacy patterns remain:

```bash
# No $: reactive statements in candidate routes
grep -rn '^\s*\$:' apps/frontend/src/routes/candidate/

# No on:event directives (excluding comments)
grep -rn 'on:' apps/frontend/src/routes/candidate/ --include="*.svelte" | grep -v '<!--' | grep -v 'on:' | grep 'on:[a-z]'

# No $app/stores imports
grep -rn "from '\$app/stores'" apps/frontend/src/routes/candidate/

# No <slot /> usage
grep -rn '<slot' apps/frontend/src/routes/candidate/

# No export let (except in commented code)
grep -rn 'export let' apps/frontend/src/routes/candidate/

# All files have <svelte:options runes />
# Count should equal 25
grep -rl '<svelte:options runes />' apps/frontend/src/routes/candidate/ | wc -l
```

## Sources

### Primary (HIGH confidence)
- Direct inspection of all 25 candidate route files in the project codebase
- Phase 24 RESEARCH.md and completed voter route migrations (verified patterns)
- Phase 24 CONTEXT.md (established decisions)
- `apps/frontend/src/lib/contexts/layout/layoutContext.ts` -- `getLayoutContext(onDestroy)` API confirmed

### Secondary (MEDIUM confidence)
- [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect) -- dependency tracking, async limitations
- [SvelteKit $app/state docs](https://svelte.dev/docs/kit/$app-state) -- page reactive object API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified from yarn.lock, same as Phase 24
- Architecture: HIGH -- all 25 files read and analyzed, patterns carried directly from Phase 24
- Pitfalls: HIGH -- identical to Phase 24 patterns, all validated in production voter routes
- Statement classification: HIGH -- every `$:` statement manually inspected and classified

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable -- Svelte 5 runes API is finalized, patterns validated in Phase 24)
