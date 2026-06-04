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
  import { getContext } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavItemProps } from './NavItem.type';

  let { autoCloseNav = true, disabled, href, onclick, icon, text, children, ...restProps }: NavItemProps = $props();

  const { navigation } = getLayoutContext();

  // reason: Top-level getContext read — NOT inside an element attribute
  // (Svelte issue #7549; RESEARCH §Pitfall 2). Static structural detection:
  // NavItem's containment in a NavGroup is fixed at component creation.
  const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;

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

{#snippet content()}
  <!--
    `disabled` is non-standard on `<a>`. On the `<a>` branch we set
    `aria-disabled="true"` and drop `href` so the link is observably
    disabled (WCAG 2.1 AA + Playwright `toBeDisabled()`-compatible). On
    the `<button>` branch we keep native `disabled`. CSS targets both via
    `[disabled]` and `[aria-disabled="true"]`.
  -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svelte:element
    this={href == null ? 'button' : 'a'}
    href={disabled ? undefined : href}
    onclick={(e: MouseEvent) => {
      if (onclick) onclick(e);
      if (autoCloseNav && navigation.close) navigation.close();
    }}
    disabled={href == null && disabled ? true : undefined}
    aria-disabled={href != null && disabled ? 'true' : undefined}
    data-testid="nav-menu-item"
    {...concatClass(restProps, classes)}>
    {#if icon}
      <Icon name={icon} />
    {/if}
    <span class="uc-first">{text}</span>
    {@render children?.()}
  </svelte:element>
{/snippet}

<!-- The wrapping <div role="listitem"> is rendered ONLY when this NavItem is a child of a NavGroup (auto-detected via getContext per Phase 80 D-03). Orphan NavItems (e.g., VoterNav/CandidateNav/AdminNav close-buttons) render bare to avoid the axe aria-required-parent violation. -->
{#if inNavGroup}
  <div role="listitem">
    {@render content()}
  </div>
{:else}
  {@render content()}
{/if}

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  /* The class prefixes are valid even though linter flags them */
  .nav-item[disabled],
  .nav-item:disabled,
  .nav-item[aria-disabled='true'],
  .nav-item.disabled {
    @apply !text-secondary pointer-events-none hover:bg-transparent;
  }
</style>
