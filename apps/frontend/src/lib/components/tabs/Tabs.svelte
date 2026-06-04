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
  import { shouldAnimate, startViewTransition } from '$lib/utils/viewTransition';
  import type { TabsProps } from './Tabs.type';

  let {
    tabs = [],
    activeIndex = $bindable(0),
    onChange,
    transitionOnChange = false,
    ...restProps
  }: TabsProps = $props();

  function activate(index: number): void {
    // For LOCAL-state tab switches (not navigation-driven), optionally cross-fade
    // the activeIndex mutation. Pass `undefined` as the destination URL — there is
    // no navigation target for a local tab switch, so the `?notr=1` check is
    // naturally skipped while the SSR / feature-detect / reduced-motion gates still
    // apply. Falls through to a plain assignment when animation is disabled or
    // unsupported (graceful degradation lives in viewTransition.ts).
    if (transitionOnChange && shouldAnimate(undefined)) {
      startViewTransition(() => {
        activeIndex = index;
      });
    } else {
      activeIndex = index;
    }
    onChange?.({ index, tab: tabs[index] });
  }
</script>

<!-- reason: role="tablist" — required so <li role="tab"> children satisfy
     aria-required-parent (WAI-ARIA APG tabs pattern). Phase 80 cite-and-fix
     (axe rules: aria-required-parent + list); discovered mid-execution as
     a Rule 4 deviation when the locked NavGroup/NavItem decisions did not
     resolve the baselined violations. See 80-VERIFICATION.md §Latent Risk
     Surface Check + scout-misdiagnosis-correction note. -->
<ul role="tablist" {...concatClass(restProps, 'flex items-center justify-start bg-base-300 px-0 py-8 overflow-auto')}>
  {#each tabs as tab, index}
    <li
      class="btn btn-outline text-md hover:bg-base-100 hover:text-primary focus:bg-base-100 focus:text-primary m-0 h-[2.2rem] min-h-[2.2rem] w-auto flex-grow
       truncate rounded-sm px-12 font-bold"
      class:text-primary={index !== activeIndex}
      class:bg-base-100={index === activeIndex}
      tabindex="0"
      role="tab"
      data-testid="tab-{index}"
      onclick={() => activate(index)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          // Prevent scrolling
          e.preventDefault();
        }
      }}
      onkeyup={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          activate(index);
        }
      }}>
      <span class="uc-first">{tab.label}</span>
    </li>
  {/each}
</ul>
