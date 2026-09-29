<!--@component
Show a tab title bar that can be used to switch between different tabs.

### Properties

- `tabs`: The tabs, each `{ label, id? }`.
- `activeTab`: The `id ?? label` of the active tab. Bind to this to change or read the active tab. When it is unset or matches no tab, the first tab is active. @default the first tab
- `transitionOnChange`: Cross-fade a local tab switch in a View Transition. @default false
- Any valid attributes of a `<ul>` element

### Callbacks

- `onChange`: Callback for when the user activates a tab, called with that tab. Note, it's preferable to just bind to the `activeTab` property instead.

### Accessibility

- The tab can be activated by pressing `Enter` or `Space`.
- TODO[a11y]: Add support for keyboard navigation with the arrow keys.

### Usage

```tsx
<Tabs bind:activeTab tabs={[{ id: 'info', label: 'Basic Info' }, { id: 'opinions', label: 'Opinions' }]}/>
```
-->

<script lang="ts" generics="TTab extends Tab = Tab">
  import { concatClass } from '$lib/utils/components';
  import { shouldAnimate, startViewTransition } from '$lib/utils/viewTransition';
  import { tabKey } from './tabKey';
  import type { Tab, TabsProps } from './Tabs.type';

  let {
    tabs = [],
    activeTab = $bindable(),
    onChange,
    transitionOnChange = false,
    ...restProps
  }: TabsProps<TTab> = $props();

  const activeKey = $derived(
    tabs.some((tab) => tabKey(tab) === activeTab) ? activeTab : tabs[0] ? tabKey(tabs[0]) : undefined
  );

  function activate(tab: TTab): void {
    const key = tabKey(tab);
    // A local tab switch has no navigation target, so `shouldAnimate` gets no URL: its SSR, feature-detect and reduced-motion gates still apply.
    if (transitionOnChange && shouldAnimate(undefined)) {
      startViewTransition(() => {
        activeTab = key;
      });
    } else {
      activeTab = key;
    }
    onChange?.(tab);
  }
</script>

<!-- reason: role="tablist" — required so <li role="tab"> children satisfy
     aria-required-parent (WAI-ARIA APG tabs pattern). Without it the axe
     aria-required-parent and list rules both flag this list. -->
<ul role="tablist" {...concatClass(restProps, 'flex items-center justify-start bg-base-300 px-0 py-8 overflow-auto')}>
  {#each tabs as tab, index}
    {@const active = tabKey(tab) === activeKey}
    <li
      class="btn btn-outline text-md hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow
       truncate rounded-sm px-12 font-bold"
      class:text-primary={!active}
      class:bg-base-100={active}
      tabindex="0"
      role="tab"
      data-testid="tab-{index}"
      onclick={() => activate(tab)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          // Prevent scrolling
          e.preventDefault();
        }
      }}
      onkeyup={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          activate(tab);
        }
      }}>
      <span class="uc-first">{tab.label}</span>
    </li>
  {/each}
</ul>
