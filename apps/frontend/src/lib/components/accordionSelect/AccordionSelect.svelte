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

  // Pending collapse from `activate`; every write to `expanded` goes through `setExpanded`, which cancels it.
  let collapseTimer: ReturnType<typeof setTimeout> | undefined;

  // True while `expanded` is being corrected rather than toggled by the user; a correction plays no slide.
  let correcting = $state(false);

  function setExpanded(value: boolean, correction = false): void {
    clearTimeout(collapseTimer);
    collapseTimer = undefined;
    correcting = correction;
    expanded = value;
  }

  $effect(() => () => clearTimeout(collapseTimer));

  let hadSelection = activeIndex != null && activeIndex >= 0;

  // Collapse once whenever `activeIndex` goes from no selection to a selection. Edge-triggered so a user can re-expand, and collapse-only so a momentary -1 never flashes it open.
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
