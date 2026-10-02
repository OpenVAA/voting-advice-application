<!--
@component Show a select widget which is expanded when no selection is made and collapsed when an option is selected.

If there's only one option, it is automatically selected and no interactions are allowed.

### Properties

- `options`: The titles and other data related to the options.
- `activeIndex`: The index of the active option. Bind to this to change or read the active option.
- `labelGetter`: A callback used to get the label for each option. Default: `String`
- `onChange`: Callback for when the active option changes. The event `details` contains the active option as `option` as well as its `index`.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<AccordionSelect bind:activeIndex options={['Basic Info', 'Opinions']}/>
```
-->

<script lang="ts">
  import { untrack } from 'svelte';
  import { scale, slide } from 'svelte/transition';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { AccordionSelectProps } from './AccordionSelect.type';

  let {
    options = [],
    activeIndex = $bindable(),
    onChange,
    labelGetter = String,
    ...restProps
  }: AccordionSelectProps<unknown> = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Expanding and selecting
  ////////////////////////////////////////////////////////////////////

  let expanded = $state(activeIndex == null || activeIndex < 0);

  // The handle of `activate`'s pending `DELAY.lg` collapse, so that a LATER change of mind can cancel it. Without the handle the timer is fire-and-forget and owns `expanded` unconditionally for 450 ms after a selection: re-expand the accordion inside that window — which is exactly what clicking the selected option does — and the orphaned timer slams it shut again a moment later, detaching the option the user was reaching for mid-transition. Measured on this branch as `element is not stable` / `element was detached from the DOM` against an `inert` (outroing) option, in `tests/e2e-runs/accordion-timerrace-01`. Every write to `expanded` therefore goes through `setExpanded`, which cancels first, so the most recent intent always wins.
  let collapseTimer: ReturnType<typeof setTimeout> | undefined;

  // Whether the CURRENT change to `expanded` is a correction rather than something the user asked for. A correction plays no slide, because an animation is the wrong presentation for "this was never meant to be open": the widget has to end up looking as though it had been CONSTRUCTED collapsed, which is literally what the remount used to deliver. It also has to end up there promptly — a 225 ms outro keeps the de-selected option in the DOM, `inert` and mid-flight but still matching `role=option`, long enough for an observer to read the pre-correction option count and act on it. Read only inside the transition's own parameter expression, which Svelte evaluates once when the transition starts, so a later change never disturbs a running one.
  let correcting = $state(false);

  function setExpanded(value: boolean, correction = false): void {
    clearTimeout(collapseTimer);
    collapseTimer = undefined;
    correcting = correction;
    expanded = value;
  }

  // Cleanup-only effect: it reads nothing, so it runs once and its teardown runs on destroy, cancelling a collapse that would otherwise fire into a destroyed component.
  $effect(() => () => clearTimeout(collapseTimer));

  // Whether `activeIndex` pointed at a real option the last time the reconciliation below ran. A plain `let` rather than `$state` on purpose: it is only ever read and written inside `untrack`, so making it reactive would add a dependency edge that buys nothing and can only create loops.
  let hadSelection = activeIndex != null && activeIndex >= 0;

  // Reconcile `expanded` when `activeIndex` goes from "nothing selected" to a real selection. What this defends against, and why it was not needed before: the initialiser above derives the same thing, but it runs ONCE, at construction. Until v2.16 Phase 165 every results navigation reran the `(located)` load and blanked the subtree, so this component was REMOUNTED on each selection and that initialiser re-ran by accident — which is the only reason a once-only initialisation ever looked sufficient. Phase 165 removed that teardown deliberately (decision D-03: the results subtree now persists across navigation, which is the whole point of the phase), so an instance that mounts while the parent's lookup is still unresolved (`activeIndex === -1`, the multi-election results landing with no election in the URL) stays expanded, and the ONLY thing that later collapses it is `activate`'s `DELAY.lg` timer. That leaves a ~450 ms window in which the widget is expanded while a selection is already active, and a click arriving just after the window closes lands on `activate`'s toggle branch and re-opens the accordion permanently, with nothing left to collapse it. Measured: 6 red of 16 `voter-journey` runs on the phase branch against 0 of 22 on base — see `.planning/phases/165-results-navigation-redraw/165-BASE-FLAKE-MEASUREMENT.md`.
  //
  // Two properties are deliberate and must survive any later simplification. EDGE-triggered, not level-triggered: clicking the already-active option to re-expand goes through `activate`'s toggle branch and leaves `activeIndex` untouched, so a level rule ("collapse whenever something is selected") would slam the widget shut the instant a user opened it. COLLAPSE-only, never expand: a parent whose lookup momentarily returns `-1` mid-navigation would otherwise flash the accordion open, so nothing here may ever set `expanded = true`.
  //
  // Switching from one option to another is untouched and still collapses on `activate`'s `DELAY.lg` timer. Do NOT fold this back into the initialiser on the grounds that the initialiser computes the same predicate: an initialiser cannot observe a LATER transition, and that is the entire defect.
  $effect(() => {
    const hasSelection = activeIndex != null && activeIndex >= 0;
    untrack(() => {
      if (hasSelection && !hadSelection) setExpanded(false, true);
      hadSelection = hasSelection;
    });
  });

  // Auto-select when only one option exists. Wrap the write in `untrack` so that the `activeIndex` / `expanded` / `onChange` writes inside `activate` don't retrigger this effect when the parent re-derives `options` with different identity (Svelte 5 `effect_update_depth_exceeded` guard — mirrors the pattern used elsewhere in the codebase, e.g.
  // protected-layout $effect).
  $effect(() => {
    if (options.length === 1) untrack(() => activate(0));
  });

  function activate(index: number): void {
    if (activeIndex === index) {
      setExpanded(!expanded);
      return;
    }
    activeIndex = index;
    collapseTimer = setTimeout(() => setExpanded(false), DELAY.lg);
    onChange?.({ index, option: options[index] });
  }

  function handleSelect(index: number): void {
    if (options.length < 2) return;
    activate(index);
  }
</script>

<!-- role=listbox: the children carry role=option, which axe's aria-required-parent
  rule (WCAG 2.1 AA, critical) requires to be contained by a listbox/group — most visibly in the collapsed state where only the selected option button is in the DOM with no wrapping role. aria-label gives the listbox an accessible name;
  callers may override it via restProps. -->
<div
  role="listbox"
  aria-label={restProps['aria-label'] ?? t('components.accordionSelect.listboxAriaLabel')}
  {...concatClass(restProps, 'grid pl-0 gap-xs min-w-xs !max-w-full items-stretch join join-vertical')}>
  {#each options as option, index}
    {#if expanded || activeIndex === index}
      <button
        class="join-item h-touch bg-base-200 hover:bg-base-300 focus:text-primary relative
          grid w-auto place-items-center px-[3rem]
          transition-all"
        class:bg-base-300={index === activeIndex}
        class:font-bold={index === activeIndex}
        class:pointer-events-none={options.length === 1}
        aria-selected={index === activeIndex}
        role="option"
        tabindex="0"
        transition:slide={{ duration: correcting ? 0 : DELAY.sm }}
        onclick={() => handleSelect(index)}>
        {#if index === activeIndex}
          <div transition:scale class="left-md absolute">
            <Icon name="check" />
          </div>
        {/if}
        <span class="uc-first">
          {labelGetter?.(option)}
          {#if !expanded}
            <span class="sr-only">{t('components.accordionSelect.collapsedAriaInfo')}</span>
          {/if}
        </span>
        {#if !expanded && options.length > 1 && index === activeIndex}
          <div transition:scale class="right-md absolute">
            <Icon name="expand" />
          </div>
        {/if}
      </button>
    {/if}
  {/each}
</div>
