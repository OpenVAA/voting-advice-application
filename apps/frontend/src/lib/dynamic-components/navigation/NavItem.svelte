<!--
@component
Outputs a navigation item for use inside a `<NavGroup>` which in turn is used within a `<Navigation>` component.

The item is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `onclick` handler or other way of making the item interactive.

### Dynamic component

Accesses `LayoutContext`.

### Properties

- `icon`: The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
- `text`: The text to display in the navigation item.
- `disabled`: Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
- `autoCloseNav`: Whether the menu available from the page context should be closed when the item is clicked. Default: `true`
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Usage

```tsx
<NavItem href={$getRoute(ROUTE.Info)} icon="info" text="Show info"/>
<NavItem onclick={(e) => foo(e)} text="Do foo"/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import type { NavItemProps } from './NavItem.type';

  let { autoCloseNav = true, disabled, href, icon, text, children, ...restProps }: NavItemProps = $props();

  const { navigation } = getLayoutContext(onDestroy);

  // Create classes
  const classes = $derived.by(() => {
    let c =
      'nav-item flex items-center gap-md px-10 py-md min-h-touch min-w-touch w-full !text-neutral hover:bg-base-200 active:bg-base-200';
    if (!icon) {
      // This corresponds to the width of an icon (24/16 rem) and the gap between the icon and the text (md = 10/16 rem)
      c += ' pl-[2.75rem]';
    }
    return c;
  });
</script>

<!-- We use a div with an Aria role instead of a `<li>` because we don't place the items within a valid parent for a `<li>`. We need the wrapper because we can't change the role of `<ActionItem>`, which renders as an `<a>` or `<button>` and thus already has a defined Aria role. -->
<div role="listitem">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svelte:element
    this={href == null ? 'button' : 'a'}
    {href}
    onclick={() => {
      if (autoCloseNav && navigation.close) navigation.close();
    }}
    disabled={disabled || undefined}
    data-testid="nav-menu-item"
    {...concatClass(restProps, classes)}>
    {#if icon}
      <Icon name={icon} />
    {/if}
    <span class="uc-first">{text}</span>
    {@render children?.()}
  </svelte:element>
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  /* The class prefixes are valid even though linter flags them */
  .nav-item[disabled],
  .nav-item:disabled,
  .nav-item.disabled {
    @apply !text-secondary pointer-events-none hover:bg-transparent;
  }
</style>
