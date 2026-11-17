<!--
@component Outputs a navigation item for use inside a `<NavGroup>` which in turn is used within a `<Navigation>` component.

The item is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `onclick` handler or other way of making the item interactive.

A disabled item given a `disabledReason` stays operable instead: it is rendered as a `<button>` announced as unavailable, and a click on it shows the reason under it and a second click hides it. The click neither navigates, calls `onclick` nor closes the menu. The reason is shown in a polite live region the button names in `aria-controls`, so it is announced when it is shown.

### Dynamic component

Accesses `LayoutContext`.

### Properties

- `icon`: The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
- `text`: The text to display in the navigation item.
- `disabled`: Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
- `disabledReason`: The sentence a click on the disabled item shows under it. With it, the disabled item stays operable.
- `disabledReasonProps`: Any valid attributes of the `<p>` element that holds the shown reason.
- `autoCloseNav`: Whether the menu available from the page context should be closed when the item is clicked. Default: `true`
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Usage

```tsx
<NavItem href={getRoute.current(ROUTE.Info)} icon="info" text="Show info"/>
<NavItem onclick={(e) => foo(e)} text="Do foo"/>
<NavItem href={getRoute.current(ROUTE.Preview)} text="Preview" disabled disabledReason="Answer the questions first."/>
```
-->

<script lang="ts">
  import { getContext } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { cn, concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavItemProps } from './NavItem.type';

  let {
    autoCloseNav = true,
    disabled,
    disabledReason,
    disabledReasonProps,
    href,
    onclick,
    icon,
    text,
    children,
    ...restProps
  }: NavItemProps = $props();

  const { navigation } = getLayoutContext();

  // reason: Top-level getContext read — NOT inside an element attribute (Svelte issue #7549). Static structural detection: NavItem's containment in a NavGroup is fixed at component creation.
  const inNavGroup = getContext(NAV_GROUP_CONTEXT_KEY) === true;

  const uid = $props.id();
  /** The id of the region that shows the reason. */
  const reasonRegionId = `${uid}-reason`;

  /** Whether the item is closed with a reason it shows when clicked. */
  const closedWithReason = $derived(!!disabled && !!disabledReason);

  /** Whether the reason is shown. It is collapsed whenever the item becomes, or stops being, closed with a reason, and a click toggles it. */
  let reasonShown = $derived.by(() => {
    void closedWithReason;
    return false;
  });

  const classes = $derived(
    cn(
      'flex items-center gap-md px-10 py-md min-h-touch min-w-touch w-full !text-neutral hover:bg-base-200 active:bg-base-200',
      // The width of an icon (24/16 rem) plus the gap between the icon and the text (md = 10/16 rem)
      !icon && 'pl-[2.75rem]',
      disabled && !closedWithReason && 'pointer-events-none hover:bg-transparent'
    )
  );

  /**
   * Handle a click: an item closed with a reason shows or hides it; any other item calls `onclick` and closes the menu when `autoCloseNav` is set.
   * @param event - The click.
   */
  function handleClick(event: MouseEvent): void {
    if (closedWithReason) {
      reasonShown = !reasonShown;
      return;
    }
    if (onclick) onclick(event);
    if (autoCloseNav && navigation.close) navigation.close();
  }
</script>

{#snippet content()}
  {#if closedWithReason}
    <!-- Not natively disabled, so that it stays a tab stop and can be clicked: `aria-disabled` announces it as unavailable. -->
    <button
      type="button"
      onclick={handleClick}
      aria-disabled="true"
      aria-expanded={reasonShown}
      aria-controls={reasonRegionId}
      data-testid="nav-menu-item"
      {...concatClass(restProps as Record<string, unknown>, classes)}>
      {#if icon}
        <Icon name={icon} />
      {/if}
      <span class="uc-first">{text}</span>
      {@render children?.()}
    </button>
    <!-- Rendered while the item is closed, so that the reason is announced when it is put in. -->
    <div id={reasonRegionId} role="status">
      {#if reasonShown}
        <p {...concatClass(disabledReasonProps ?? {}, 'small-info py-sm ps-touch pe-md')}>{disabledReason}</p>
      {/if}
    </div>
  {:else}
    <!--
      `disabled` is non-standard on `<a>`. On the `<a>` branch we set `aria-disabled="true"` and drop `href` so the link is observably disabled (WCAG 2.1 AA + Playwright `toBeDisabled()`-compatible). On the `<button>` branch we keep native `disabled`.
    -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <svelte:element
      this={href == null ? 'button' : 'a'}
      href={disabled ? undefined : href}
      onclick={handleClick}
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
  {/if}
{/snippet}

<!-- The wrapping <div role="listitem"> is rendered ONLY when this NavItem is a child of a NavGroup (auto-detected via getContext). Orphan NavItems (e.g., VoterNav/ContestantNav/AdminNav close-buttons) render bare to avoid the axe aria-required-parent violation. -->
{#if inNavGroup}
  <div role="listitem">
    {@render content()}
  </div>
{:else}
  {@render content()}
{/if}
