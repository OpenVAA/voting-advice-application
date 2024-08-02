<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import type { ButtonProps } from './Button.type';

  type $$Props = ButtonProps;

  export let text: $$Props['text'];
  export let variant: $$Props['variant'] = 'normal';
  export let icon: $$Props['icon'] = null;
  export let iconPos: $$Props['iconPos'] = 'right';
  export let color: $$Props['color'] = 'primary';
  export let href: $$Props['href'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;

  // Check iconPos
  if (
    (variant === 'main' || variant === 'responsive-icon') &&
    (iconPos === 'top' || iconPos === 'bottom')
  ) {
    iconPos = 'right';
  }

  // Build classes reactively so that we can incorporate any changes to `icon` and `color` properties
  let classes: string;
  let labelClass: string;

  $: {
    // 1. Base classes
    classes =
      'btn relative flex flex-nowrap min-h-touch min-w-touch h-auto flex items-center gap-y-6 gap-x-6';
    labelClass = 'vaa-button-label first-letter:uppercase';

    // 2. Variant-defined classes
    switch (variant) {
      case 'icon':
      case 'responsive-icon':
        classes += ' btn-ghost justify-start';
        break;
      case 'main':
        classes += ' w-full max-w-md justify-center';
        break;
      default:
        classes += ` btn-ghost w-full max-w-md ${icon ? 'justify-start' : 'justify-center'}`;
    }

    // 3. Icon position
    switch (iconPos) {
      case 'top':
        classes += ' flex-col';
        break;
      case 'bottom':
        classes += ' flex-col-reverse';
        break;
      case 'left':
        classes += ' flex-row';
        break;
      case 'right':
        classes += ' flex-row-reverse';
    }

    // 4. Set color
    if (color) {
      // For the main button type we can use the btn-primary etc. classes, for the others, we just set the text color
      classes += ` ${variant === 'main' ? 'btn' : 'text'}-${color}`;
    }

    // 5. Finally, define the class for the text label
    switch (variant) {
      case 'main':
        labelClass += ' flex-grow text-center';
        if (icon) {
          // If an icon is used, add left or right margin so that the text is  nicely centered: ml/r is calculated so that it is the sum of the gap (4) and icon widths (24) = 28/16 rem
          labelClass += iconPos === 'right' ? ' ml-[1.75rem]' : ' mr-[1.75rem]';
        }
        break;
      case 'responsive-icon':
        labelClass += ` sr-only sm:not-sr-only small-label text-${color}`;
        break;
      case 'secondary':
        labelClass += ` small-label text-${color}`;
        break;
    }
  }
</script>

<!--
@component
A component for buttons that mostly contain text and an icon. Use the `variant` prop to specify the button type. When using an `icon`, use `iconPos` to set the position of the icon relative to the text.

- `main`: A large, prominent button that is used for the main action of the page. In general, there should only be one of these on a page.
- `icon`: A button containing only an icon. Note that you still need to provide the `text` property, which will be used as the `aria-label` and `title` of the button.
- `responsive-icon`: A button rendered as icon only on small screens but which exposes the text label on large screens. Set the `iconPos` to `left` or `right` to control its location in the expanded view.
- `secondary`: A button with a smaller (uppercase) text and possibly an icon.
- `normal`: The default button type, which usually consists of an icon and text.

Only `main` buttons have a backround color. The other variants use DaisyUI's `btn-ghost` class, i.e. they do not have a background color.

The button is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `on:click` event handler or other way of making the item interactive.

### Properties

- `href`: The URL to navigate to. If this is not supplied be sure to provide an `on:click` event handler or other way of making the item interactive.
- `text`: The required text of the button. If `variant` is `icon`, the text will be used as the `aria-label` and `title` for the button. You can override both by providing them as attributes, e.g. `aria-label="Another text"`.
- `variant`: The type of the button.
- `icon`: The name of the icon to display.
- `color`: The color of the icon.
- `iconPos`: The position of the icon relative to the text.
- `disabled`: Whether the button is disabled. This can also be used with buttons rendered as `<a>` elements.
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Slots

- `badge`: A slot for adding a badge to the button.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
  <Button on:click={next} variant="main" icon="next"
   text="Continue"/>
  <Button on:click={skip} icon="skip" iconPos="top" color="secondary"
   text="Skip this question"/>
  <Button on:click={addToList} variant="icon" icon="addToList" 
   text="Add to list">
    <InfoBadge text="5" slot="badge"/>
  </Button>
```
-->

<!-- Note that `disabled` is converted to `undefined` is `false` because DaisyUI's `[disabled]` selector will otherwise match it. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  on:click
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' ? text : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? text : undefined}
  disabled={disabled || undefined}
  {...concatClass($$restProps, classes)}>
  {#if icon}
    <div class="relative">
      <Icon name={icon} />
      {#if $$slots.badge && variant !== 'main'}
        <div class="absolute -end-6 -top-8">
          <slot name="badge" />
        </div>
      {/if}
    </div>
  {/if}
  {#if variant !== 'icon'}
    <div class={labelClass}>
      <span class="relative">
        {text.charAt(0).toUpperCase() + text.slice(1)}
        {#if $$slots.badge && !icon && variant !== 'main'}
          <div class="absolute -end-20 -top-8">
            <slot name="badge" />
          </div>
        {/if}
      </span>
    </div>
  {/if}
  {#if $$slots.badge && variant === 'main'}
    <div class="absolute -end-6 -top-12">
      <slot name="badge" />
    </div>
  {/if}
</svelte:element>

<style lang="postcss">
  [disabled] .vaa-button-label,
  .disabled .vaa-button-label {
    @apply text-neutral text-opacity-20;
  }
</style>
