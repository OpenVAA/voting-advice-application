<!--@component
Show a select widget which is expanded when no selection is made and collapsed when an option is selected.

If there’s only one option, it is automatically selected and no interactions are allowed.

### Properties

- `options`: The titles of the options.
- `activeIndex`: The index of the active option. Bind to this to change or read the active option. @default 0
- Any valid attributes of a `<div>` element

### Callbacks

- `onChange`: Callback for when the active option changes. The event `details` contains the active option as `option` as well as its `index`. Note, it's preferable to just bind to the `activeTab` property instead.

### Usage

```tsx
<AccordionSelect bind:activeIndex options={['Basic Info', 'Opinions']}/>
```
-->

<script lang="ts">
  import { scale, slide } from 'svelte/transition';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { AccordionSelectProps } from './AccordionSelect.type';

  type $$Props = AccordionSelectProps<unknown>;

  export let options: $$Props['options'] = [];
  export let activeIndex: $$Props['activeIndex'] = undefined;
  export let onChange: $$Props['onChange'] = undefined;
  export let labelGetter: $$Props['labelGetter'] = String;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Expanding and selecting
  ////////////////////////////////////////////////////////////////////

  let expanded = activeIndex == null || activeIndex < 0;

  $: if (options.length === 1) activate(0);

  function activate(index: number): void {
    if (activeIndex === index) {
      expanded = !expanded;
      return;
    }
    activeIndex = index;
    setTimeout(() => (expanded = false), DELAY.lg);
    onChange?.({ index, option: options[index] });
  }

  function handleSelect(index: number): void {
    if (options.length < 2) return;
    activate(index);
  }
</script>

<div {...concatClass($$restProps, 'grid pl-0 gap-xs min-w-xs !max-w-full items-stretch join join-vertical')}>
  {#each options as option, index}
    {#if expanded || activeIndex === index}
      <button
        class="join-item relative grid h-touch w-auto place-items-center
          bg-base-200 px-[3rem] transition-all hover:bg-base-300
          focus:text-primary"
        class:bg-base-300={index === activeIndex}
        class:font-bold={index === activeIndex}
        class:pointer-events-none={options.length === 1}
        aria-selected={index === activeIndex}
        role="option"
        tabindex="0"
        transition:slide={{ duration: DELAY.sm }}
        on:click={() => handleSelect(index)}>
        {#if index === activeIndex}
          <div transition:scale class="absolute left-md">
            <Icon name="check" />
          </div>
        {/if}
        <span class="uc-first">
          {labelGetter?.(option)}
          {#if !expanded}
            <span class="sr-only">{$t('components.accordionSelect.collapsedAriaInfo')}</span>
          {/if}
        </span>
        {#if !expanded && options.length > 1 && index === activeIndex}
          <div transition:scale class="absolute right-md">
            <Icon name="expand" />
          </div>
        {/if}
      </button>
    {/if}
  {/each}
</div>
