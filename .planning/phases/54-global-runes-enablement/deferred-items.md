# Phase 54: Deferred Items

## Pre-existing Build Warnings (Out of Scope)

### a11y Directive Naming (Svelte 5 uses underscores, not hyphens)

These `svelte-ignore` comments use the old hyphenated naming convention. Svelte 5 uses underscores.

1. `src/routes/Layout.svelte:68` - `a11y-positive-tabindex` -> `a11y_positive_tabindex`
2. `src/lib/components/questions/QuestionChoices.svelte:253` - `a11y-no-noninteractive-element-interactions` -> `a11y_no_noninteractive_element_interactions`
3. `src/lib/components/button/Button.svelte:175` - `a11y-no-static-element-interactions` -> `a11y_no_static_element_interactions`
4. `src/lib/components/input/Input.svelte:354,374,398,500,503` - Multiple `a11y-label-has-associated-control` and `a11y-no-noninteractive-tabindex` -> underscore equivalents
5. `src/lib/components/select/Select.svelte:292` - `a11y-click-events-have-key-events` -> `a11y_click_events_have_key_events`

### svelte:component Deprecation

6. `src/lib/components/popupRenderer/PopupRenderer.svelte:36` - `<svelte:component>` is deprecated in runes mode (components are dynamic by default)
