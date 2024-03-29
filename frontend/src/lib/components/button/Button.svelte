<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import {Icon} from '$lib/components/icon';
  import type {ButtonProps} from './Button.type';

  type $$Props = ButtonProps;

  export let text: $$Props['text'];
  export let variant: $$Props['variant'] = 'normal';
  export let icon: $$Props['icon'] = null;
  export let iconPos: $$Props['iconPos'] = 'right';
  export let color: $$Props['color'] = 'primary';
  export let href: $$Props['href'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;

  // Check iconPos
  if (variant === 'main' && (iconPos === 'top' || iconPos === 'bottom')) {
    iconPos = 'right';
  }

  // Build classes reactively so that we can incorporate any changes to `icon` and `color` properties
  let classes: string;
  let labelClass: string;

  $: {
    // 1. Base classes
    classes = 'btn min-h-touch min-w-touch h-auto flex items-center justify-center gap-y-6 gap-x-4';
    labelClass = '';

    // 2. Variant-defined classes
    classes += variant === 'main' ? ' w-full max-w-md' : ' btn-ghost';

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
        break;
    }

    // 4. Set color
    if (color) {
      // For the main button type we can use the btn-primary etc. classes, for the others, we just set the text color
      classes += ` ${variant === 'main' ? 'btn' : 'text'}-${color}`;
    }

    // 5. Finally, define the class for the text label
    if (variant === 'main') {
      labelClass += ' flex-grow text-center';
      if (icon) {
        // If an icon is used, add left or right margin so that the text is  nicely centered: ml/r is calculated so that it is the sum of the gap (4) and icon widths (24) = 28/16 rem
        labelClass += iconPos === 'right' ? ' ml-[1.75rem]' : ' mr-[1.75rem]';
      }
    } else if (icon && (iconPos === 'top' || iconPos === 'bottom')) {
      // We use the small-label class only in vertical buttons with an icon. The color needs to be separately applied here, bc small-label sets the text color to secondary
      labelClass += ` small-label text-${color}`;
    }
  }
</script>

<!--
@component
A component for buttons that mostly contain text and an icon. Use the `variant` prop to specify the button type. When using an `icon`, use `iconPos` to set the position of the icon relative to the text.

- `main`: A large, prominent button that is used for the main action of the page. In general, there should only be one of these on a page.
- `icon`: A button containing only an icon. Note that you still need to provide the `text` property, which will be used as the `aria-label` and `title` of the button.
- `normal`: The default button type, which usually consists of an icon and text. The styling for these uses DaisyUI's `btn-ghost` class, i.e. the button does not have a background color.

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

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
  <Button on:click={next} variant="main" icon="next"
   text="Continue"/>
  <Button on:click={skip} icon="skip" iconPos="top" color="secondary"
   text="Skip this question"/>
  <Button on:click={addToList} variant="icon" icon="addToList" 
   text="Add to list"/>
```
-->

<!-- Note that `disabled` is converted to `undefined` is `false` because DaisyUI's `[disabled]` selector will otherwise match it. -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  on:click
  {href}
  aria-label={variant === 'icon' ? text : undefined}
  title={variant === 'icon' ? text : undefined}
  disabled={disabled || undefined}
  {...concatClass($$restProps, classes)}>
  {#if icon}
    <Icon name={icon} />
  {/if}
  {#if variant !== 'icon'}
    <div class={labelClass}>{text.charAt(0).toUpperCase() + text.slice(1)}</div>
  {/if}
</svelte:element>
