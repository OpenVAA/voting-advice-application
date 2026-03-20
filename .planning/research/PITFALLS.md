# Domain Pitfalls: Svelte 5 Content Migration (Voter App)

**Domain:** Migrating SvelteKit 2 frontend content from Svelte 4 patterns to Svelte 5 runes
**Researched:** 2026-03-18
**Confidence:** HIGH (verified against official Svelte 5 docs, codebase analysis, community migration reports)

## Critical Pitfalls

Mistakes that cause rewrites, broken reactivity, or cascading failures across components.

### Pitfall 1: $$slots and $$restProps Break Immediately in Runes Mode

**What goes wrong:** The moment a component file uses any rune (`$state`, `$props`, `$derived`, `$effect`), it enters runes mode. In runes mode, `$$slots`, `$$restProps`, and `$$props` are undefined -- they simply do not exist. A component cannot mix legacy globals with runes.

**Why it happens:** Runes mode and legacy mode are mutually exclusive per-file. The compiler uses the presence of any rune to determine the mode. Developers migrating incrementally may convert `export let` to `$props()` but forget to also replace `$$slots` and `$$restProps` in the same file.

**This project's exposure:** Very high. The codebase has 186 occurrences of `$$restProps`/`$$slots`/`$$Props` across 40+ components. `Button.svelte` alone uses `$$restProps` for class concatenation via `concatClass()`, `$$slots.badge` for conditional rendering, and `type $$Props` for typing. `Modal.svelte` uses both `$$restProps` and `$$slots.actions`. `EntityCard.svelte` uses `$$restProps` for the article element.

**Consequences:** Runtime crash -- `$$slots is not defined` or `$$restProps is not defined`. The component renders nothing or throws. Since `Button` is used everywhere, one broken `Button` can cascade to crash entire pages.

**Prevention:**
- When converting a component to runes, convert ALL legacy patterns in the same commit: `export let` to `$props()`, `$$restProps` to rest spreading (`let { ...rest } = $props()`), `$$slots` to checking if snippet props are defined, `type $$Props` to `interface Props` used with `$props<Props>()`.
- Use `npx svelte-check` after each file to catch undefined references.
- Migrate leaf components first (those with no child components using legacy patterns), then work up the component tree.

**Detection:** `svelte-check` will flag `$$slots`, `$$restProps` usage in runes mode. Runtime errors are immediate and obvious.

### Pitfall 2: Event Forwarding Removal Silently Breaks Parent-Child Communication

**What goes wrong:** Svelte 4's `on:click` directive on elements does two things: handles events and forwards them. Component-level event forwarding (`<Button on:click>`) automatically bubbles events to parent components. In Svelte 5, event forwarding is removed. Components must explicitly accept and pass through event handler callback props.

**Why it happens:** Svelte 5 replaces `on:event` directives with standard DOM event attributes (`onclick`). But the forwarding behavior -- where `<Button on:click>` without a handler bubbles the event up -- has no Svelte 5 equivalent except explicitly accepting an `onclick` prop and passing it through.

**This project's exposure:** Critical. The codebase has 66 occurrences of `on:click`/`on:change`/`on:submit`/`on:keydown`/`on:input` across 30 files. `Button.svelte` uses `on:click` forwarding (`<svelte:element ... on:click>`), and every usage site relies on this forwarding: `<Button on:click={handleSubcardsToggle}>`, `<Button on:click={closeAlert}>`, `<button on:click={closeModal}>`. The `Alert.svelte` component uses `createEventDispatcher` for `open` and `close` events, which is deprecated in Svelte 5.

**Consequences:** Click handlers silently stop working. No error is thrown -- the user clicks a button and nothing happens. This is especially dangerous because E2E tests may pass if they only check for element visibility, not handler execution.

**Prevention:**
- `Button.svelte` must accept an `onclick` callback prop: `let { onclick, ...rest } = $props()` and pass it to the element.
- Every call site must change from `<Button on:click={handler}>` to `<Button onclick={handler}>`.
- Replace `createEventDispatcher` with callback props (the `Alert.svelte` already has an `onClose` prop -- extend this pattern to `onOpen`).
- Migrate `Button` component first since it is the most widely-used component in the codebase, and update all call sites as a single atomic change.

**Detection:** Manual testing of every interactive element. E2E tests that click buttons and verify side effects will catch this.

### Pitfall 3: Store-to-Runes Migration in Context Providers Causes Cascading Breakage

**What goes wrong:** The context system uses Svelte stores (`Writable`, `Readable`, `derived`) throughout. The `VoterContext` alone exposes 15+ store properties. Converting these contexts to use `$state`/`$derived` runes changes the consumer API -- components currently use `$storeName` auto-subscription syntax. If the context returns a rune-based value instead of a store, every consumer using `$` prefix will break.

**Why it happens:** Stores and runes are different reactivity systems. A `Readable<T>` store accessed via `$myStore` uses Svelte's auto-subscription. A `$state` value does not support this syntax -- it is accessed directly. During migration, if a context property changes from store to rune but consumers still use `$`, the component will either error or read a stale value.

**This project's exposure:** Extreme. The context hierarchy is `I18nContext -> ComponentContext -> DataContext -> AppContext -> VoterContext`, with each level adding store-based properties. `VoterContext` has `selectedElections`, `opinionQuestions`, `matches`, `answers`, `entityFilters` -- all `Readable<T>` stores accessed via `$` in dozens of route files and components. Changing the return type of any context property breaks every consumer.

**Consequences:** If a context property changes from `Readable<T>` to a raw reactive value, all `$propName` usages become either errors (if the value has no `.subscribe` method) or read stale data (if they happen to be primitives that look similar). The 92 E2E tests will catch many of these, but subtle reactivity losses may not trigger test failures.

**Prevention:**
- **Strategy A (recommended for v1.3):** Keep contexts returning stores. Convert component-level code to runes but leave context providers using `svelte/store`. Stores and runes can coexist within the same app -- Svelte 5 still fully supports `svelte/store`. This minimizes blast radius.
- **Strategy B (risky, defer):** Convert contexts to runes but wrap returned values in stores for backward compatibility, then migrate consumers. Only do this in a dedicated phase after all component migrations are stable.
- Regardless of strategy, never change a context's API surface and its consumers in different commits. The context interface and all its consumers must be migrated atomically.

**Detection:** TypeScript errors when `$` is used on a non-store value. E2E tests will catch functional regressions.

### Pitfall 4: DataRoot Mutable Object + $state Proxy Conflict

**What goes wrong:** The `DataRoot` object from `@openvaa/data` is a class instance that is mutated in-place (via `.provideElectionData()`, `.provideConstituencyData()`, etc.) and signals changes via an imperative `.subscribe()` callback. Wrapping it in `$state()` creates a Proxy, but Svelte 5's `$state` proxy does not work correctly with class instances -- class methods, private properties, and prototype chains can break.

**Why it happens:** Svelte 5's `$state` creates deep reactive proxies for plain objects and arrays, but class instances are handled differently. The DataRoot already has its own `alwaysNotifyStore` workaround (created in v1.2) specifically because Svelte 5's built-in `writable` uses `Object.is()` equality checks that skip notifications for same-reference objects. Converting this to `$state` would layer a proxy on top of a class that already has its own notification mechanism.

**This project's exposure:** High. The `dataContext.ts` contains an explicit `TODO[Svelte 5]: Replace with Svelte 5 native reactivity ($state / $derived)` comment. The `alwaysNotifyStore` is a custom store implementation that exists solely to bridge the DataRoot's imperative mutation pattern with Svelte's store-based reactivity.

**Consequences:** If `$state(dataRoot)` is attempted: (1) DataRoot methods may not be accessible through the proxy, (2) mutations via `.provideElectionData()` may not trigger Svelte re-renders because they modify internal state without going through the proxy setter, (3) `$state.snapshot()` loses class prototypes, breaking `instanceof` checks that `@openvaa/data` relies on.

**Prevention:**
- Keep the `alwaysNotifyStore` pattern for v1.3. It works correctly and the comment acknowledges this is a future concern.
- If converting: use `$state.raw()` (Svelte 5.15+) which creates reactive state without deep proxying, or keep the store wrapper.
- Never wrap class instances in `$state()` -- it creates a deep proxy that conflicts with class semantics.
- The proper fix requires refactoring `@openvaa/data`'s DataRoot to use immutable update patterns, which is out of scope for v1.3.

**Detection:** Runtime errors (`TypeError: method is not a function`), broken page rendering when data loads, `instanceof` checks returning false.

### Pitfall 5: $: Reactive Statement Conversion Gets the Rune Wrong

**What goes wrong:** The `sv migrate` tool and manual migration must decide whether each `$:` reactive statement should become `$derived`, `$derived.by()`, or `$effect()`. Getting this wrong causes either (a) SSR failures if `$effect` is used for what should be `$derived`, (b) infinite loops if `$derived` mutations are attempted, or (c) stale values if dependency tracking is lost.

**Why it happens:** Svelte 4's `$:` conflates two distinct concerns: derived values (pure computations) and side effects (imperative actions). The `sv migrate` tool often cannot distinguish them and falls back to `run()` from `svelte/legacy`, which is a deprecated stopgap.

**This project's exposure:** High. The codebase has 49 `$:` reactive statements across 30 files. Key examples:
- `Button.svelte`: `$: { classes = ...; labelClass = ...; }` -- this computes CSS classes reactively. Should be `$derived.by()`.
- `EntityCard.svelte`: `$: { ({ entity: nakedEntity, match, nomination } = unwrapEntity(entity)); ... }` -- this destructures and computes derived state with multiple assignments. Complex `$derived.by()`.
- `+layout.svelte`: `$: { error = undefined; ready = false; ... Promise.all([...]).then(...) }` -- this mixes state resets with async side effects. Requires `$effect()` but the async pattern needs careful handling.
- `+layout.svelte`: `$: if (error) logDebugError(error.message)` -- this is a side effect. Should be `$effect()`.

**Consequences:** Using `$effect()` where `$derived` is needed causes SSR mismatches (effects do not run on the server). Using `$derived` with mutations causes infinite reactive loops. Using `run()` from `svelte/legacy` works but is deprecated and will break in Svelte 6.

**Prevention:**
- Decision rule: if a `$:` block returns/computes a value, use `$derived` or `$derived.by()`. If it performs a side effect (logging, navigation, DOM manipulation, async calls), use `$effect()`.
- For the root `+layout.svelte`'s data loading pattern: use `$effect()` since it involves async operations and state mutations, but verify SSR behavior -- data loading happens server-side via `+layout.ts`, so the effect only needs to run client-side.
- Never use `run()` from `svelte/legacy` -- it is a migration crutch, not a solution. Always choose between `$derived` and `$effect`.
- Review every `$:` statement individually; batch conversion via `sv migrate` should be followed by manual review.

**Detection:** `svelte-check` catches some type errors. SSR mismatch warnings in browser console. Visual flicker on page load indicates a `$derived` was incorrectly converted to `$effect`.

## Moderate Pitfalls

### Pitfall 6: Slot-to-Snippet Migration Breaks Consumer Components

**What goes wrong:** Svelte 5 deprecates `<slot>` in favor of snippets (`{@render children()}`). Components with named slots need their consumers to change syntax from `<div slot="name">` to passing snippet props. During migration, a component using `{@render actions?.()}` will not render content from a consumer still using `<div slot="actions">`.

**This project's exposure:** 55 `<slot>` usages across 40 files. Key components with named slots include `Button` (badge slot), `Modal` (actions slot), `Alert` (actions slot), `HeadingGroup`, `ModalContainer`, `EntityCard`. Each has multiple consumers.

**Prevention:**
- Svelte 5 has backward compatibility: snippets can be passed to components that still use `<slot>`. However, the reverse is not true -- a component using `{@render}` cannot receive old-style slot content.
- Migrate consumers before or simultaneously with the component. Never convert a component's `<slot>` to `{@render}` without also converting all its consumers.
- For components with many consumers (Button, Modal), consider migrating the component and all consumers in a single commit.

**Detection:** Missing content where slots used to render. Visual regression tests catch this.

### Pitfall 7: bind: Exports Require $bindable() Annotation

**What goes wrong:** In Svelte 4, all `export let` props are bindable by default. In Svelte 5 runes mode, props must be explicitly marked with `$bindable()` to support `bind:`. Forgetting `$bindable()` causes a runtime error when the parent tries to bind.

**This project's exposure:** 92 `bind:` occurrences across 40 files. Key patterns include `bind:openModal`/`bind:closeModal` in `Modal.svelte`, `bind:openFeedback` in `FeedbackModal`, `bind:isOpen` in `Alert.svelte`, `bind:value` in form components, `bind:trackEvent` in analytics. Also, `Modal.svelte` exports functions (`openModal`, `closeModal`) via `export function` which are bound using `bind:openModal` -- these are exported values that need `$bindable` or a different pattern in runes mode.

**Prevention:**
- Audit every `bind:` usage. For each bound prop, add `$bindable()` in the `$props()` destructuring: `let { isOpen = $bindable(false) } = $props()`.
- For exported functions (`export function openModal`), the Svelte 5 pattern is to use `bind:this` on the component and access the function via the component reference, or refactor to use callback props instead.
- Consider whether binding is actually needed -- many `bind:` usages could be replaced with callback props, which is more explicit.

**Detection:** Runtime error: "Cannot bind to a property that is not marked as $bindable". `svelte-check` catches this at type level.

### Pitfall 8: Event Modifiers (on:click|once, on:submit|preventDefault) Have No Direct Equivalent

**What goes wrong:** Svelte 5's `onclick` attribute does not support modifiers like `|once`, `|capture`, `|preventDefault`. The old syntax `on:click|once={handler}` must be manually replaced with wrapper code.

**This project's exposure:** 11 occurrences of event modifiers across 2 files. `Video.svelte` uses `on:click|once={tryUnmute}` (7 times) and `on:click|capture={() => screenJump(...)}` (3 times). The candidate `forgot-password/+page.svelte` uses `on:submit|preventDefault={handleSubmit}`.

**Prevention:**
- For `|preventDefault`: wrap handler in `(e) => { e.preventDefault(); handler(e); }`.
- For `|once`: implement once-logic in the handler itself (e.g., a boolean guard, or `{ once: true }` via `addEventListener`).
- For `|capture`: use `oncapture:click` (Svelte 5 syntax) or add event listeners in `onMount`.
- Note: `svelte/legacy` exports modifier functions (`once()`, `preventDefault()`) as migration helpers, but prefer native solutions.

**Detection:** E2E tests for the video component and form submissions. Manual testing of specific modifier behavior.

### Pitfall 9: $app/stores Deprecation and $page Dependency Chain

**What goes wrong:** `$app/stores` is deprecated in SvelteKit 2.12+ in favor of `$app/state`. The project has 21 imports of `page` from `$app/stores`, including in critical infrastructure: `paramStore.ts`, `pageDatumStore.ts`, `getRoute.ts`, `authContext.ts`. These are utility modules that derive stores from the `page` store, creating a dependency chain. Migrating `$app/stores` to `$app/state` changes the API from a store (with `.subscribe`) to a rune-based reactive object.

**This project's exposure:** High. `paramStore` derives route parameters from `page`, `pageDatumStore` derives data loading states from `page.data`, and `getRoute` derives navigation functions. All of these use `parsimoniusDerived()` which wraps Svelte's `derived()` store -- which expects a `Readable` input. The `$app/state`'s `page` is not a store and cannot be passed to `derived()`.

**Prevention:**
- For v1.3, keep `$app/stores` imports. They are deprecated but fully functional and will only be removed in SvelteKit 3. This avoids having to rewrite the entire `parsimoniusDerived` chain.
- If migrating: `paramStore`, `pageDatumStore`, and `getRoute` must all be rewritten to use `$derived` runes directly instead of store-based `derived()`. This is a significant refactor that should be a dedicated phase.
- Do not partially migrate -- either keep all `$app/stores` usage or convert the entire `page`-dependent utility chain at once.

**Detection:** TypeScript errors when passing `$app/state`'s page to `derived()`. Runtime errors in paramStore-dependent components.

### Pitfall 10: concatClass/concatProps Utility Must Be Adapted for Rest Props

**What goes wrong:** The `concatClass()` utility is designed to work with `$$restProps` -- it takes an object (typically `$$restProps`) and prepends CSS classes. In Svelte 5, `$$restProps` becomes a destructured rest variable (`let { ..., ...rest } = $props()`). The utility itself works fine, but every call site changes from `concatClass($$restProps, classes)` to `concatClass(rest, classes)`.

**This project's exposure:** `concatClass` and `concatProps` are used in virtually every component that accepts arbitrary HTML attributes -- Button, Alert, Modal, EntityCard, NavItem, and many more. Missing even one call site silently drops user-provided classes and attributes.

**Prevention:**
- Search-and-replace `$$restProps` with the chosen rest variable name (e.g., `rest`) across all migrated components.
- Use a consistent rest variable name across the codebase (recommend `rest` or `restProps`).
- The utility function itself does not need changes -- only the call sites do.

**Detection:** Visual regression -- components missing custom classes. TypeScript errors if `$$restProps` is used in runes mode.

### Pitfall 11: Mixed Svelte 4/5 Components During Incremental Migration

**What goes wrong:** During migration, the app will contain a mix of legacy-mode and runes-mode components. This is explicitly supported by Svelte 5, but subtle issues arise at boundaries: (a) a runes-mode parent passing snippets to a legacy-mode child that still uses `<slot>` works, but (b) a legacy-mode parent passing `<div slot="name">` to a runes-mode child using `{@render}` does NOT work.

**This project's exposure:** Guaranteed during migration. The voter app routes will be migrated incrementally, meaning some routes will use runes while shared components may still use legacy syntax (or vice versa).

**Prevention:**
- Migrate bottom-up: leaf components first (Button, Icon, Loading, etc.), then composite components (Alert, Modal, EntityCard), then route layouts and pages.
- Components can remain in legacy mode indefinitely -- only convert when you are ready to convert all usage patterns.
- Test each converted component in both runes-mode and legacy-mode parent contexts to ensure interoperability.

**Detection:** E2E tests passing after each component migration. Components rendering empty where content should appear.

## Minor Pitfalls

### Pitfall 12: createEventDispatcher Deprecation

**What goes wrong:** `createEventDispatcher` is deprecated in Svelte 5 runes mode. Components using it must switch to callback props.

**This project's exposure:** 6 components use `createEventDispatcher`: `Alert.svelte`, `Expander.svelte`, `Navigation.svelte`, `SurveyButton.svelte`, `Feedback.svelte`, `DataConsent.svelte`. All of these already partially use callback props (e.g., Alert has `onClose` prop alongside dispatched events).

**Prevention:** Replace dispatcher calls with callback props. For Alert.svelte, remove the dispatcher and use `onClose?.()` and `onOpen?.()` callback props (the `onClose` pattern is already in place).

**Detection:** `svelte-check` deprecation warnings. Events stop firing at consumer level.

### Pitfall 13: svelte:component Deprecation in Dynamic Component Usage

**What goes wrong:** `<svelte:component this={Component}>` is deprecated in runes mode because components are dynamic by default. It still works but produces deprecation warnings.

**This project's exposure:** 7 occurrences across 3 files: `+layout.svelte` (popup service, analytics loading), `AppLogo.svelte`, `EntityFilters.svelte`.

**Prevention:** Replace `<svelte:component this={Comp} ...props>` with `<Comp ...props>` directly. This is a straightforward find-and-replace.

**Detection:** Deprecation warnings in the console. `svelte-check` warnings.

### Pitfall 14: svelte:self Requires Import of Own Component

**What goes wrong:** `<svelte:self>` is deprecated in Svelte 5 runes mode. Components must import themselves explicitly to create recursive structures.

**This project's exposure:** 2 occurrences: `EntityCard.svelte` uses `<svelte:self variant="subcard" ...>` for nested cards, and `EntityTag.svelte` uses it for recursive entity rendering.

**Prevention:** Import the component from its own file: `import EntityCard from './EntityCard.svelte'` and use `<EntityCard>` instead of `<svelte:self>`. This works correctly in Svelte 5 because components are now dynamic by default.

**Detection:** Deprecation warnings. Visual -- recursive components not rendering.

### Pitfall 15: Type System Changes ($$Props Interface Pattern)

**What goes wrong:** The `type $$Props = SomeType` pattern used for component typing in Svelte 4 does not work in runes mode. Props must be typed via the `$props<Type>()` generic parameter or explicit TypeScript annotation on the destructured variable.

**This project's exposure:** 40+ components use `type $$Props = SomeType` followed by `export let prop: $$Props['prop']`. Every one of these must be converted. The separate `.type.ts` files (ButtonProps, AlertProps, EntityCardProps, etc.) can still be used but the import pattern changes.

**Prevention:** Convert from:
```typescript
type $$Props = ButtonProps;
export let text: $$Props['text'];
```
To:
```typescript
let { text, icon = null, ...rest }: ButtonProps = $props();
```
The existing `.type.ts` files are reusable, just import and use them directly with `$props<ButtonProps>()`.

**Detection:** TypeScript errors. `svelte-check` catches these.

### Pitfall 16: parsimoniusDerived Utility is a Store Pattern That May Not Need Runes Conversion

**What goes wrong:** The custom `parsimoniusDerived` utility wraps Svelte's `derived` store to add caching, equality checking, and SSR-safe behavior. Developers may feel compelled to rewrite this using `$derived` runes during migration, but this utility is used extensively in context initialization files (not in component script tags), where runes may not be appropriate.

**This project's exposure:** `parsimoniusDerived` is used 15+ times in `voterContext.ts`, `appContext.ts`, and various utility stores. It drives core reactivity chains: elections, constituencies, questions, matches, filters.

**Prevention:** Keep `parsimoniusDerived` as-is for v1.3. It works correctly with Svelte 5's store system. Converting it to runes would require rewriting every context that depends on it and every consumer that auto-subscribes with `$`. This is a v1.5+ concern.

**Detection:** N/A -- leave it alone.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Shared leaf components (Button, Icon, Loading) | $$restProps + $$slots removal crash | Convert ALL legacy patterns in single commit per component; test immediately |
| Event handler migration | Silent event forwarding loss | Migrate Button's on:click forwarding first; update all 30+ call sites atomically |
| Context providers | Store-to-rune API surface change breaks consumers | Keep store-based contexts for v1.3; only convert component-level code to runes |
| Composite components (Modal, Alert, EntityCard) | Named slot consumers lag behind snippet conversion | Migrate component + ALL consumers in same commit |
| Route files with $: statements | Wrong rune choice (derived vs effect) | Apply decision rule: pure computation = $derived, side effect = $effect |
| $page-dependent utilities | $app/stores deprecation cascade | Keep $app/stores for v1.3; defer $app/state migration |
| E2E test regression | Tests pass despite broken handlers | Verify E2E tests exercise click handlers, not just element presence |
| DataRoot integration | $state proxy breaks class instance | Keep alwaysNotifyStore wrapper; do not wrap DataRoot in $state |
| bind: patterns | Missing $bindable() annotations | Audit all 92 bind: occurrences; add $bindable() to each bound prop |
| Event modifiers | |once, |preventDefault, |capture removal | Replace with inline JavaScript; Video.svelte needs significant rework |
| Recursive components | svelte:self deprecation | Import component from own file; trivial fix |
| Type system | $$Props pattern incompatible with runes | Convert to $props<Type>() generic; existing .type.ts files still usable |

## Sources

- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- Official comprehensive migration reference (HIGH confidence)
- [Svelte 5 $props documentation](https://svelte.dev/docs/svelte/$props) -- Replaces export let and $$restProps (HIGH confidence)
- [Svelte 5 $state documentation](https://svelte.dev/docs/svelte/$state) -- Proxy behavior, class instance limitations, $state.snapshot issues (HIGH confidence)
- [Svelte 5 $derived documentation](https://svelte.dev/docs/svelte/$derived) -- Runtime dependency tracking, destructuring issues (HIGH confidence)
- [Svelte 5 legacy-$$slots documentation](https://svelte.dev/docs/svelte/legacy-$$slots) -- Confirms $$slots only works in legacy mode (HIGH confidence)
- [$app/stores deprecation](https://svelte.dev/docs/kit/$app-stores) -- Deprecated in SvelteKit 2.12, replaced by $app/state (HIGH confidence)
- [$$slots undefined in runes mode](https://github.com/sveltejs/svelte/issues/9683) -- Confirms $$slots breaks with any rune usage (HIGH confidence)
- [sv migrate tool](https://svelte.dev/docs/cli/sv-migrate) -- Automated migration capabilities and limitations (HIGH confidence)
- [Experiences and Caveats of Svelte 5 Migration](https://github.com/sveltejs/svelte/discussions/14131) -- Community-reported real migration problems (MEDIUM confidence)
- [Loopwerk: Refactoring Svelte stores to $state runes](https://www.loopwerk.io/articles/2025/svelte-5-stores/) -- Practical store-to-runes patterns (MEDIUM confidence)
- [Mainmatter: Runes and Global state](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- Context + state patterns (MEDIUM confidence)
- [Svelte 5 $bindable documentation](https://svelte.dev/docs/svelte/$bindable) -- Breaking change: props not bindable by default (HIGH confidence)
- [svelte:component deprecation issue](https://github.com/sveltejs/svelte/issues/12668) -- Components are dynamic by default in runes mode (HIGH confidence)
- Codebase analysis of `voterContext.ts`, `appContext.ts`, `dataContext.ts`, `parsimoniusDerived.ts`, `paramStore.ts`, `pageDatumStore.ts`, `storageStore.ts`, `Button.svelte`, `Alert.svelte`, `Modal.svelte`, `EntityCard.svelte`, `+layout.svelte`
