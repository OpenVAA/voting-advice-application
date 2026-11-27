# Lens: Design · ID prefix `DSN`

**Applies when** the PR introduces novel styling: Tailwind or DaisyUI classes not seen in sibling components, arbitrary values (`[…]`), inline `style`, new CSS, colour choices, or typography sizes.

## List

Novel styling only (not every class), as _where_ → _what_ → _likely intent_. Group identical usages.

## Evaluate (criterion slugs)

- `dsn-theme-tokens`: colours come from DaisyUI's semantic classes (`primary`, `secondary`, `accent`, `neutral`, `base-100`…`base-300`, `info`, `success`, `warning`, `error` and their `-content` pairs), whose values the theme in `packages/app-shared/src/settings/staticSettings.ts` sets. A raw Tailwind palette colour (`text-blue-600`) or a `#hex` needs a stated reason, because a deployment's theme cannot reach it.
- `dsn-dark-mode`: it reads in the dark theme. Semantic classes pass automatically; raw colours, white or black literals, opacity-over-background tricks and shadows need checking.
- `dsn-raw-style`: an inline `style` or arbitrary value whose static part belongs in a class or a CSS variable. Dynamic values are fine; the static part is not.
- `dsn-small-text`: text smaller than `text-sm` must be strictly non-essential — decorative, redundant, or a hint available elsewhere. Say what the text conveys and whether a user needs it.
- `dsn-precedent`: the class choices match how siblings style the same thing; named spacing and sizes over arbitrary values. Check two sibling components before claiming no precedent exists.
- `dsn-logical-props`: prefer logical properties (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`) over physical ones (`ml-`/`mr-`, `left-`/`right-`, `text-left`) so right-to-left locales lay out correctly. Until right-to-left locales ship, raise it only where the PR adds new physical properties.

## Where to look

`packages/app-shared/src/settings/staticSettings.ts` (theme colours), sibling components in `apps/frontend/src/lib/components/`, the frontend's Tailwind and app CSS.

## Promote to

`.agents/code-review-checklist.md`; `.claude/skills/components/SKILL.md` (styling section).
