# Lens: Accessibility · ID prefix `A11Y`

**Applies when** the diff changes anything a user sees or operates: markup, a component, a route, focus handling, an animation, a colour, or copy that labels a control. The app must meet WCAG 2.1 AA and be fully usable with a keyboard and a screen reader.

## List

Each changed interactive or announced element: _element_ → _route_ → _accessible name_ → _keyboard path_ → _announcement_ (live region, focus move) → _reached by the axe E2E scan?_.

## Evaluate (criterion slugs)

- `a11y-semantics`: native elements over a `div` with a handler (`button`, `a`, `input`, `fieldset`/`legend`); headings in order; landmarks present; list content in lists.
- `a11y-names`: every control has an accessible name; form fields are labelled; icon-only buttons carry an `aria-label` that goes through `t()` like any other copy.
- `a11y-keyboard`: reachable, operable and with a visible focus indicator by keyboard alone; no focus trap outside a modal; a modal or drawer traps focus while open and restores it on close.
- `a11y-live`: dynamic results, errors and loading states are announced (`aria-live`, `role="status"` / `role="alert"`), without double announcements alongside the route announcer.
- `a11y-contrast`: the theme colours and every state (disabled, hover, the selected answer, focus) meet 4.5:1 for text and 3:1 for UI components, in both the light and dark themes.
- `a11y-motion`: animations and View Transitions respect `prefers-reduced-motion`.
- `a11y-lang`: a fragment in a language other than the page's — a localized name, a quoted answer — carries `lang`.
- `a11y-scan-reach`: is the changed surface actually visited by the axe scan? Check the specs under `tests/tests/specs/a11y/` and `yarn assert:a11y-scan-wiring`. When the surface is not reached, the finding names the route and state to add to the scan; never cite the scan as coverage for a route it does not visit.

Route focus management is owned by the routes lens (`rte-focus-announce`).

## Where to look

`tests/tests/specs/a11y/`, `scripts/assert-a11y-scan-wiring.mjs`, `apps/frontend/src/lib/utils/aria/`, `apps/frontend/src/lib/utils/motion.ts`, `apps/frontend/src/lib/components/modal/`, `.claude/skills/components/SKILL.md` (the WCAG section).

## Promote to

`.claude/skills/components/SKILL.md`; `.agents/code-review-checklist.md` (the WCAG and keyboard items).
