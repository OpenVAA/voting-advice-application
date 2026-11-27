# Lens: Components · ID prefix `CMP`

**Applies when** the PR adds or changes a `.svelte` component or a context consumer under `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components/`, `apps/frontend/src/lib/contestant/components/`, `apps/frontend/src/lib/admin/components/`, `apps/frontend/src/lib/layouts/` or a route. It also applies, for `cmp-screenshots` alone, to any PR whose diff changes what a user sees on screen.

## List

- **New components**: _name_ → _path_ → _what it renders, in one line_ → _base component it builds on_ (or "de novo").
- **Changed components**: _name_ → _what was added or changed_ (new props, variants, internal branches) → _which callers motivated it_.
- **Context reads**: every `get*Context()` call the diff adds, with what it reads.
- **Limited space**: for each new or reworked view, dialog or drawer → _how it behaves at 360 px wide and on desktop_.
- **Screenshots**: the PR's `## UI screenshots` comment, linked → which visible changes it covers.

## Evaluate (criterion slugs)

- `cmp-paradigm`: Svelte 5 runes throughout — props destructured from `$props()` and typed in a co-located `Foo.type.ts`; snippets and `{@render}`, with no `export let` and no `<slot>`; classes merged with `concatClass` and rest props spread onto the root element; no wrapper elements that add nothing. Placement: presentational components in `apps/frontend/src/lib/components/`, data-aware ones in `apps/frontend/src/lib/dynamic-components/`, app-specific ones in `apps/frontend/src/lib/contestant/components/` or `apps/frontend/src/lib/admin/components/`.
- `cmp-context-destructure`: **invariant** (CLAUDE.md § Context Destructuring Rule). Destructuring a reactive accessor (`appSettings`, `dataRoot`, `locale`, `selectedElections`, `opinionQuestions`, `matches`, and the rest listed in `.claude/skills/components/context-reactivity.md`) freezes its initial value; binding `dataRoot` to a `$derived` read alias goes stale on cold entry. Both are `critical`. Grep the diff for `const {` after a `get…Context()` call and for `$derived(ctx.dataRoot)`-shaped aliases.
- `cmp-untrack`: a write after a read inside `$effect` without `untrack()`, and an `$effect` that only computes a value (it should be `$derived`).
- `cmp-replace-by-existing`: the new component could be replaced by an existing one, as is or with a small generalisation. Walk the reuse ladder: (a) reuse with `class` / props, or add a prop to the base; (b) wrap an existing one; (c) forgo the tweak. Be strictest for `button`, `modal` (and its drawer), `input`, `select`, `tabs`, `expander`, `icon`, `alert` and the entity and question components.
- `cmp-extend-not-fork`: the new component re-implements a base it should extend or wrap. Show the base, and what the wrapper would add.
- `cmp-replace-old`: the new component supersedes an older one. Name it and count its callers.
- `cmp-patchwork-change`: a change to an existing component that serves one caller — a boolean prop toggling an alternate render path, a prop only one caller will pass, a variant that is really another component. Recommend a new component extending the old one, or a general snippet prop.
- `cmp-prop-ignored`: a prop that type-checks at the call site but never reaches the element.
- `cmp-limited-space`: voters are mostly on phones. At 360×640 primary actions, sticky footers and the last rows of a list stay reachable, dialogs and drawers scroll their body, and nothing needs horizontal scrolling. Long translations — Finnish and Estonian compounds, French expansion — must wrap rather than truncate into nonsense. A component that lives inside a drawer or modal should not switch layout on viewport breakpoints that do not describe its own width.
- `cmp-screenshots`: the PR carries the screenshots `openvaa-pr` posts. Read the PR's comments (`gh api repos/<REPO>/issues/<N>/comments --paginate`; skip this in a dry run with no PR), find the one headed `## UI screenshots`, and check there is one captioned image per visible change at mobile (390×844) and desktop (1440×900) width, plus a dark-theme shot where colours changed. Look at each image: a spinner, an error page or the wrong screen counts as missing. Report what is missing by name. A PR with no visible change needs none.

## Where to look

`apps/frontend/src/lib/components/README.md`, `.claude/skills/components/SKILL.md`, `.claude/skills/components/context-reactivity.md`, `apps/frontend/src/lib/utils/components.ts` (`concatClass`).

## Promote to

`.claude/skills/components/SKILL.md`; CLAUDE.md § Context Destructuring Rule; `.agents/code-review-checklist.md` (the Svelte component item).

<!-- skill-link-allow: Foo.type.ts -->
