---
name: components
description: 'Frontend Svelte component work in apps/frontend -- the base, dynamic and candidate-app component libraries, plus the Svelte 5 context-reactivity rules that govern how those components read data. Understands the runes-era component API ($props destructured from a co-located .type.ts, $state / $derived, snippets and {@render} -- there is no export-let prop and no slot left in the tree), Tailwind/DaisyUI styling through concatClass, WCAG 2.1 AA patterns and the axe scan that enforces them, and above all the context destructure trap (destructuring a reactive accessor such as opinionQuestions captures an empty array for the life of the component) and the dataRoot #version-bridge carve-out (a $derived read alias over dataRoot goes stale on cold / direct-URL entry). Use this skill rather than data, matching, filters or database whenever the file is a .svelte component or a context consumer under apps/frontend/src/lib: those skills own the package-internal models and the backend, this one owns how a component reads and renders them. Activate when creating, modifying or reviewing a Svelte component, when calling getVoterContext(), getCandidateContext() or getAppContext(), or when debugging a context value that renders empty or goes stale after navigation.'
targets:
  - apps/frontend/src/lib/components
  - apps/frontend/src/lib/dynamic-components
  - apps/frontend/src/lib/candidate/components
---

# OpenVAA Component Library Expert

## Library Purpose

Three component libraries, all Svelte 5 with `runes: true` forced in
`apps/frontend/svelte.config.js` for everything outside `node_modules`:

- `apps/frontend/src/lib/components` — base components. Presentational, data-model-agnostic, no
  context reads beyond the component context. Imported as `$lib/components/<dir>`.
- `apps/frontend/src/lib/dynamic-components` — data-aware components. These read `@openvaa/data`
  objects and the voter/candidate contexts. Imported as `$lib/dynamic-components/<dir>`.
- `apps/frontend/src/lib/candidate/components` — candidate-app-only components. Imported as
  `$candidate/components/<dir>`.

The split is a dependency rule, not a filing convention: a base component that reaches for a
`DataRoot` belongs in `dynamic-components`.

## Conventions

1. **Runes only. NEVER `export let`, NEVER `$$Props`, NEVER `<slot>`.** Props are a single
   destructuring of `$props()` typed by a co-located type file (`Button.type.ts` beside
   `Button.svelte`); children and named regions are `Snippet` props rendered with `{@render …}`.
   Measured on the three target directories
   2026-09-13: `export let` 0 files, `$$Props` 0 files, `<slot` 0 files, against 103 files calling
   `$props()` and 103 co-located `*.type.ts` files. The tree has no pre-runes component left, so a
   new one written in the old dialect is a lone regression rather than a local convention.

2. **The prop type lives beside the component, not inline.** `Button.svelte` imports
   `ButtonProps` from `apps/frontend/src/lib/components/button/Button.type.ts`; the type extends the
   host element attributes (`HTMLAttributes`, or the `<a>` / `<button>` union) so callers can pass
   arbitrary valid attributes through `...restProps`. Each property carries a JSDoc comment with a
   `@default` where one exists — those comments are what the `@component` docstring restates.

3. **Forward `class` with `concatClass`, NEVER by overwriting it.** Spread the rest props through
   `concatClass(restProps, classes)` from `apps/frontend/src/lib/utils/components.ts` so a caller's
   `class` is combined with the component's own Tailwind/DaisyUI classes instead of replacing them.
   60 files in the three directories above depend on this, and 66 across all of
   `apps/frontend/src` (re-derived 2026-09-13); a component that writes `class={classes}` directly silently
   drops every caller-supplied utility class.

   **It MERGES, it no longer merely concatenates (changed 2026-09-22).** `concatClass` is implemented
   over `cn` — `clsx` composition followed by a `tailwind-merge` instance configured for this repo's
   theme — so where the component's classes and the caller's CONFLICT, exactly one survives and the
   **caller wins** (its classes are passed last). `concatClass(restProps, 'h-16')` called with
   `class="h-32"` yields `h-32` alone, not both. Classes targeting different CSS properties are all
   kept, so `border-md border-neutral` keeps its width and its colour. Two consequences worth holding
   on to: a caller override now actually takes effect instead of depending on Tailwind's source order,
   and a class CAN now be dropped — if you need two utilities in the same group to coexist, they
   cannot be passed through one `concatClass` call. The merge configuration mirrors the custom scales
   in `apps/frontend/src/app.css`'s `@theme` block (word-named spacing, t-shirt-sized border widths)
   and must be updated alongside it; it lives in one commented place in `components.ts`.

4. **Every component directory exports through an `index.ts` barrel.** Import
   `$lib/components/button`, never `$lib/components/button/Button.svelte`. Intra-directory imports
   use relative paths (`../loading`).

5. **Every component carries an `@component` docstring, and it is load-bearing.** The block is
   `<!--` then `@component` on its own line then prose; the documentation generator matches it with
   the multiline pattern `/<!--\s*@component\s*([\s\S]*?)-->/i`
   (`apps/docs/scripts/generate-component-docs.ts`). A component without one is absent from the
   generated listing entirely. **A line-oriented grep for the marker undercounts by an order of
   magnitude** — the marker sits on its own line inside a multi-line comment — so any count you take
   must be multiline-aware.

6. **Accessibility is a gate, not an aspiration.** WCAG 2.1 AA is the standard, and the axe scan
   family in the Playwright suite enforces it; `scripts/assert-a11y-scan-wiring.mjs` (link 6 of
   `yarn lint:check`) statically asserts that the scan projects and their dependency edges still
   exist, because dropping a scan project makes the suite report fewer tests and still zero
   failures — a green that means nothing. Icon-only controls take their `aria-label` and `title`
   from the required `text` prop; do not add an icon-only variant without that path.

7. **Accepted Svelte compiler warnings are annotated, never silently tolerated.** Use
   `// svelte-warning: accepted — <one-sentence-rationale>` immediately above the offending line.
   The preferred outcome is still to fix the warning at source.

## Context reactivity — read this before wiring any data into a component

This is the one rule in this skill an agent cannot recover by reading the code, because the failing
behaviour is a Svelte 5 referential-equality property that is invisible at the call site. Compressed
statement — the full treatment, with its mechanism, its canonical patterns and its four
external references, is in `.claude/skills/components/context-reactivity.md`:

- **Two property classes.** Contexts expose *stable references* (`t`, `getRoute`, `darkMode`,
  `answers`, `userData`, the lifecycle functions), which are safe to destructure, and *reactive
  accessors* (`appSettings`, `dataRoot`, `locale`, `selectedElections`, `opinionQuestions`,
  `matches`, and ~20 more), which are not.
- **NEVER destructure a reactive accessor.** Destructuring invokes the getter once at
  component-init and binds the captured value — usually the initial empty array — as a static local.
  Read `ctx.X` instead, so the getter is re-invoked inside the tracking scope on every read.
- **NEVER bind `dataRoot` to an intermediate read alias.** `dataRoot` is identity-stable behind a
  private `#version` counter, so `const dataRoot = $derived(ctx.dataRoot)` recomputes but yields the
  same reference, Svelte 5 skips downstream notification, and the consumer keeps its pre-mount
  snapshot on cold / direct-URL entry. Read `ctx.dataRoot.<prop>` directly inside the consuming
  tracking scope.

Both defects have been shipped and diagnosed in this codebase — the destructure trap in v2.6
Phase 61, the alias-indirection hole in v2.13 Phase 117.

For the full rule, read `.claude/skills/components/context-reactivity.md`.

## The component listing — linked, never copied

The enumeration of every component lives in exactly one place, and it is generated:
`apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`. Its own
header states what it is — *"This documentation is automatically generated from the `@component`
docstrings in Svelte files."* — and its footer carries the total.

It is **linked here rather than copied** deliberately. A second hand-maintained copy would have no
guard and would drift; the generated one already drifted once, standing at 98 entries against 104
live when this skill was written. Regenerate it with
`yarn workspace @openvaa/docs generate:docs`, which runs
`apps/docs/scripts/generate-all-docs-and-validate.ts` — the one working entry point. Several sibling
`generate:*` scripts in `apps/docs/package.json` name files that do not exist; they are filed as a
todo, not repaired here. The directories it scans are configured in
`apps/docs/scripts/docs-scripts.config.ts` and are the same three this skill declares as `targets:`.

## Re-check This Skill After Changing a Component

After adding, removing, renaming or moving a component, verify:

1. The component has an `@component` docstring and a co-located `*.type.ts`, and is exported from its
   directory `index.ts` barrel.
2. `yarn workspace @openvaa/docs generate:docs` has been re-run, so the generated listing this skill
   links to still enumerates the live tree — then read its diff rather than committing it unread.
3. `yarn workspace @openvaa/docs validate:links` exits 0.
4. **Re-check this skill itself** — `.claude/skills/components/SKILL.md` and
   `.claude/skills/components/context-reactivity.md` — and update whatever the change invalidated, in
   the same commit. Both carry claims no build step keeps true: the measured counts in convention 1,
   the directory split above, and every path and line citation in the context-reactivity file.
5. The two mechanisms are complements, not substitutes. `.claude/scripts/audit-skill-drift.sh` reads
   this skill's `targets:` and reports the source commits that landed since this skill was last
   touched — it will flag your component change. But the guard only *flags*; step 4 is what makes a
   human act on it. `bash .claude/scripts/audit-skill-links.sh components` must exit 0 afterwards.
