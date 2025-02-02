<!--@component
Show a tab title bar that can be used to switch between different tabs.

### Properties

- `tabs`: The titles of the tabs.
- `activeIndex`: The index of the active tab. Bind to this to change or read the active tab. @default 0
- Any valid attributes of a `<ul>` element

### Callbacks

- `onChange`: Callback for when the active tab changes. The event `details` contains the active tab as `tab` as well as its `index`. Note, it's preferable to just bind to the `activeTab` property instead.

### Accessibility

- The tab can be activated by pressing `Enter` or `Space`.
- TODO[a11y]: Add support for keyboard navigation with the arrow keys.

### Usage

```tsx
<Tabs bind:activeIndex tabs={['Basic Info', 'Opinions']}/>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import type { TabsProps } from './Tabs.type';

  type $$Props = TabsProps;

  export let tabs: $$Props['tabs'] = [];
  export let activeIndex: $$Props['activeIndex'] = 0;
  export let onChange: $$Props['onChange'] = undefined;

  function activate(index: number) {
    activeIndex = index;
    onChange?.({ index, tab: tabs[index] });
  }
</script>

<ul {...concatClass($$restProps, 'flex items-center justify-start bg-base-300 px-0 py-8 overflow-auto')}>
  {#each tabs as tab, index}
    <li
      class="btn btn-outline m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow truncate rounded-sm px-12 text-md font-bold hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary"
      class:text-primary={index !== activeIndex}
      class:bg-base-100={index === activeIndex}
      tabindex="0"
      role="tab"
      on:click={() => activate(index)}
      on:keyup={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') activate(index);
      }}>
      {ucFirst(tab.label)}
    </li>
  {/each}
</ul>
