---
phase: 260525-adl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/frontend/src/lib/components/button/Button.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
  - apps/frontend/src/routes/Banner.svelte
  - tests/tests/specs/candidate/candidate-required-info.spec.ts
  - tests/tests/specs/voter/voter-settings.spec.ts
autonomous: true
---

# Quick task: aria-disabled on link elements

## Problem

`Button.svelte` and `NavItem.svelte` render either `<button>` or `<a>` via
`<svelte:element>` and apply `disabled` to both branches. The `disabled`
attribute is non-standard on `<a>` — browsers do not enforce anything from it
and Playwright's `toBeDisabled()` matcher rejects it (it accepts only native
form-element `disabled` or `aria-disabled="true"`). Tests in
`voter-mega-journey.spec.ts:783` use `toBeDisabled()` on the results banner
link and fail; tests in `voter-settings.spec.ts` + `candidate-required-info.spec.ts`
work around the gap with `toHaveAttribute('disabled', 'true')` + `tabindex="-1"`
chains.

## Fix

Switch the `<a>` branch in both components to use `aria-disabled="true"` and
drop `href` when disabled. Keep native `disabled` on the `<button>` branch.

Why aria-disabled (vs swapping to `<button>`): preserves the `<a>` semantics
callers rely on (link-shaped Banner action, link-shaped NavItem), matches the
canonical WCAG 2.1 AA pattern (DaisyUI/shadcn/MDN), and Playwright's
`toBeDisabled()` recognizes `aria-disabled="true"` natively → tests get
simpler, not more complex.

## Files

1. `Button.svelte` — `<a>` branch: `aria-disabled={disabled || loading || undefined}` (drop `disabled` attr); CSS selector `[disabled]` → `[disabled], [aria-disabled="true"]`.
2. `NavItem.svelte` — same shape; CSS selector update.
3. `Banner.svelte` — `:not([disabled])` global selectors gain `:not([aria-disabled="true"])`.
4. Test updates:
   - `voter-settings.spec.ts:499, 513`: `toHaveAttribute('disabled', 'true')` → `toBeDisabled()`.
   - `candidate-required-info.spec.ts:131,144,158`: same; remove now-redundant `tabindex="-1"` chains (tabindex=-1 still set by Button but no longer load-bearing for the assertion).

`voter-mega-journey.spec.ts:783` already uses `toBeDisabled()` — that's the
test the user reported failing; it will pass after the fix with no edit.

## Verification

- `yarn lint:check` clean
- `yarn workspace @openvaa/frontend test:unit` clean (no unit tests cover this
  surface; lint + tsc is the available gate)
- Manual: e2e tests `voter-mega-journey`, `voter-settings`, `candidate-required-info`
  not run locally (operator runs e2e batches themselves per session conventions).
