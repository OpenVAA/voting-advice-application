<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TabsProps } from './Tabs.type';
  import { concatClass } from '$lib/utils/components';
  import { ucFirst } from '$lib/utils/text/ucFirst';

  type $$Props = TabsProps;

  export let tabs: $$Props['tabs'] = [];
  export let activeIndex: $$Props['activeIndex'] = 0;

  const dispatch = createEventDispatcher<{ change: { index: number } }>();

  function activate(index: number) {
    activeIndex = index;
    dispatch('change', { index });
  }
</script>

<!--@component
Show a tab title bar that can be used to switch between different tabs.

### Properties

- `tabs`: The titles of the tabs.
- `activeIndex`: The index of the active tab. Bind to this to change or read the active tab. @default 0
- Any valid attributes of a `<ul>` element

### Events

- `change`: Emitted when the active tab changes. The event `details` contains the active tab index as `index`. Note, it's preferable to just bind to the `activeIndex` property instead.

### Accessibility

- The tab can be activated by pressing `Enter` or `Space`.
- TODO: Add support for keyboard navigation with the arrow keys.

### Usage

```tsx
<Tabs bind:activeIndex tabs={['Basic Info', 'Opinions']}/>
```
-->

<ul {...concatClass($$restProps, 'flex items-center justify-center bg-base-300 px-lg py-8')}>
  {#each tabs as tab, i}
    <li
      class="btn btn-outline m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow truncate rounded-sm px-12 text-md hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary"
      class:text-primary={i === activeIndex}
      class:font-bold={i === activeIndex}
      class:bg-base-100={i === activeIndex}
      tabindex="0"
      role="tab"
      on:click={() => activate(i)}
      on:keyup={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') activate(i);
      }}>
      {ucFirst(tab)}
    </li>
  {/each}
</ul>
