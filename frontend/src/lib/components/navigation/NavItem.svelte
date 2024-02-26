<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import {Icon} from '$lib/components/icon';
  import type {NavItemProps} from './NavItem.type';

  type $$Props = NavItemProps;

  export let href: $$Props['href'] = undefined;
  export let icon: $$Props['icon'] = undefined;
  export let text: $$Props['text'];

  // Create classes
  let classes: string;
  $: {
    classes =
      'flex items-center gap-md px-10 py-md min-h-touch min-w-touch w-full !text-neutral hover:bg-base-200 active:bg-base-200';
    if (!icon) {
      // This corresponds to the width of an icon (24/16 rem) and the gap between the icon and the text (md = 10/16 rem)
      classes += ' pl-[3.125rem]';
    }
  }
</script>

<!--
@component
Outputs a navigation item for use inside a `<NavGroup>` which in turn is used within a `<Navigation>` component.

The item is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provde an `on:click` event  handler or other way of making the item interactive.

### Properties

- `href`: The URL to navigate to. If this is not supplied be sure to provide an `on:click` event handler or other way of making the item interactive.
- `icon`: An optional `IconName` of the icon to use. @default `undefined`
- `text`: A required text to display.
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Usage

```tsx
<NavItem href={getRoute(Route.Info)} icon="info" text="Show info"/>
<NavItem on:click={(e) => foo(e)} text="Do foo"/>
```
-->

<!-- We use a div with an Aria role instead of a `<li>` because we don't place the items within a valid parent for a `<li>`. We need the wrapper because we can't change the role of `<ActionItem>`, which renders as an `<a>` or `<button>` and thus already has a defined Aria role. -->
<div role="listitem">
  <svelte:element
    this={href == null ? 'button' : 'a'}
    {href}
    on:click
    {...concatClass($$restProps, classes)}>
    {#if icon}
      <Icon name={icon} />
    {/if}
    <span class="first-letter:uppercase">{text}</span>
  </svelte:element>
</div>
