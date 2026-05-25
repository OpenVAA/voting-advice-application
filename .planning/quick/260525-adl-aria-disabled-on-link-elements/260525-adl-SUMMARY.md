---
phase: 260525-adl
status: complete
commit: e3d191a10
date: 2026-05-25
---

# Summary

Switched the `<a>` branch of `Button.svelte` and `NavItem.svelte` from the
non-standard `disabled` attribute to `aria-disabled="true"` + omitted `href`.
The `<button>` branch keeps native `disabled`.

## Files

- `apps/frontend/src/lib/components/button/Button.svelte` — `<a>` branch uses
  `aria-disabled`; new `isDisabled` `$derived` consolidates `disabled || loading`.
  CSS selector `[disabled] .vaa-button-label` gains
  `[aria-disabled='true'] .vaa-button-label` sibling.
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` — same
  shape; CSS selector gains `.nav-item[aria-disabled='true']`.
- `apps/frontend/src/routes/Banner.svelte` — `<a>` global selectors switched
  from `:not([disabled])` to `:not([aria-disabled='true'])`.
- `tests/tests/specs/voter/voter-settings.spec.ts` — `toHaveAttribute('disabled','true')`
  → `toBeDisabled()` (and inverse → `toBeEnabled()`).
- `tests/tests/specs/candidate/candidate-required-info.spec.ts` — same
  collapse; removed now-redundant `tabindex` chains.

`voter-mega-journey.spec.ts:783` was already using `toBeDisabled()` on the
results banner link — that's the e2e failure the operator reported; it will
pass after this fix without any test edit. Same applies to `:715` (questions
start button) and `:739` (delete button) — all use `toBeDisabled()`, all
recognize `aria-disabled="true"` natively.

## Verification

- `yarn workspace @openvaa/frontend lint:check` — 0 errors in changed files
  (pre-existing errors in `routes/runes-test/` scratch dir, unrelated).
- `yarn workspace @openvaa/frontend run check` (svelte-check) — 0 errors in
  Button.svelte / NavItem.svelte / Banner.svelte. 159 pre-existing errors
  elsewhere (unrelated).
- `npx eslint tests/tests/specs/voter/voter-settings.spec.ts tests/tests/specs/candidate/candidate-required-info.spec.ts`
  — clean.
- E2E not run locally (operator runs e2e batches themselves per session
  convention, especially under v2.10 determinism gate).

## Notes

- WCAG 2.1 AA: `aria-disabled="true"` on a link keeps it in the tab order;
  screen readers announce it as disabled. That is the intended behavior for
  the "results not yet available" banner (the user might tab through and
  hear *why* the action is unavailable). If we ever want to also remove from
  tab order, add `tabindex="-1"` — Button.svelte already does this.
- The `<a>` branch with `href` omitted is no longer a navigable link, so
  no `onclick` guard is needed to prevent navigation while disabled.

## Backstory

Found while triaging the e2e failure at
`tests/tests/specs/voter/voter-mega-journey.spec.ts:783` — the spec asserts
`toBeDisabled()` on the results banner link, which Playwright's matcher
rejected because the link carried `disabled="true"` (non-standard on `<a>`)
rather than `aria-disabled="true"`. Prior code worked around it with
`toHaveAttribute('disabled','true')` chains; this commit fixes the root
cause and the workarounds collapse.
