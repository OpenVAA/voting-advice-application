<!--
@component
A component for buttons that mostly contain text and an icon. Use the `variant` prop to specify the button type. When using an `icon`, use `iconPos` to set the position of the icon relative to the text.

- `main`: A large, prominent button that is used for the main action of the page. In general, there should only be one of these on a page.
- `prominent`: A large, quite prominent button.
- `floating-icon`: A button with a large icon and no text. This is usually used for a floating action button.
- `icon`: A button containing only an icon. Note that you still need to provide the `text` property, which will be used as the `aria-label` and `title` of the button.
- `responsive-icon`: A button rendered as icon only on small screens but which exposes the text label on large screens. Set the `iconPos` to `left` or `right` to control its location in the expanded view.
- `secondary`: A button with a smaller (uppercase) text and possibly an icon.
- `normal`: The default button type, which usually consists of an icon and text.

Only `main` buttons have a backround color. The other variants use DaisyUI's `btn-ghost` class, i.e. they do not have a background color.

The button is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `onclick` event handler or other way of making the item interactive.

### Properties

- `text`: The required text of the button. If `variant` is `icon`, the text will be used as the `aria-label` and `title` for the button. You can override both by providing them as attributes, e.g. `aria-label="Another text"`.
- `icon`: The name of the icon to use in the button or `null` if no icon should be used. Default: `'next'` if `variant='main'`, otherwise `null`
- `color`: The color of the button or text. Default: `'primary'`
- `disabled`: Whether the button is disabled. This can also be used with buttons rendered as `<a>` elements.
- `variant`: Type of the button, which defines it's appearance. Default: `'normal'`
- `iconPos`: Position of the icon in the button. Only relevant if `icon` is not `null` and `variant` is not `icon` or `floating-icon`. Note that `top` and `bottom` are not supported if `variant='main'`. Default: `'right'` if `variant='main'`, otherwise `'left'`
- `loading`: Set to `true` to show a loading spinner instead of the possible icon and disable the button. Default: `false`
- `loadingText`: The text shown when `loading` is `true`. Default: `t('common.loading')`
- `href`: The URL to navigate to. If this is not supplied be sure to provide an `onclick` event handler or other way of making the item interactive.
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Snippet Props

- `badge`: A snippet for adding a badge to the button.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<Button onclick={next} variant="main" icon="next"
text="Continue"/>
<Button onclick={skip} icon="skip" iconPos="top" color="secondary"
text="Skip this question"/>
<Button onclick={addToList} variant="icon" icon="addToList"
text="Add to list">
 {#snippet badge()}<InfoBadge text="5" />{/snippet}
</Button>
```
-->

<svelte:options runes />

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { Loading } from '../loading';
  import type { ButtonProps } from './Button.type';

  let {
    text,
    variant = 'normal',
    icon = null,
    iconPos = 'right',
    color = 'primary',
    href = undefined,
    disabled = undefined,
    loading = undefined,
    loadingText = undefined,
    badge,
    ...restProps
  }: ButtonProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Handle loading state
  ////////////////////////////////////////////////////////////////////

  let effectiveText = $derived(loading ? loadingText || t('common.loading') : text);

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // Check iconPos
  if (
    (variant === 'main' || variant === 'prominent' || variant === 'responsive-icon') &&
    (iconPos === 'top' || iconPos === 'bottom')
  ) {
    iconPos = 'right';
  }

  // Build classes reactively so that we can incorporate any changes to `icon` and `color` properties
  let classes = $derived.by(() => {
    // 1. Base classes
    let c = 'btn relative flex flex-nowrap min-h-touch min-w-touch h-auto items-center gap-y-6 gap-x-6';

    // 2. Variant-defined classes
    switch (variant) {
      case 'icon':
      case 'responsive-icon':
        c += ' btn-ghost justify-start';
        break;
      case 'floating-icon':
        c += ' justify-center rounded-full m-16';
        break;
      case 'main':
      case 'prominent':
        c += ' w-full justify-center';
        break;
      default:
        c += ` btn-ghost w-full ${icon ? 'justify-start' : 'justify-center'}`;
    }

    // 3. Icon position
    switch (iconPos) {
      case 'top':
        c += ' flex-col';
        break;
      case 'bottom':
        c += ' flex-col-reverse';
        break;
      case 'left':
        c += ' flex-row';
        break;
      case 'right':
        c += ' flex-row-reverse';
    }

    // 4. Set color
    if (color) {
      // For the main button type we can use the btn-primary etc. classes, for the others, we just set the text color
      c += ` ${variant === 'main' || variant === 'floating-icon' ? 'btn' : 'text'}-${color}`;
    }

    // 5. Apply default btn color for the `prominent` variant
    if (variant === 'prominent') c += ' btn-base-300';

    // 6. Apply bg color for the `floating-icon` variants
    if (variant === 'floating-icon') c += ' bg-primary';

    return c;
  });

  let labelClass = $derived.by(() => {
    let lc = 'vaa-button-label first-letter:uppercase';

    // 7. Finally, define the class for the text label
    switch (variant) {
      case 'main':
      case 'prominent':
        lc += ' flex-grow text-center';
        if (icon) {
          // If an icon is used, add left or right margin so that the text is  nicely centered: ml/r is calculated so that it is the sum of the gap (4) and icon widths (24) = 28/16 rem
          lc += iconPos === 'right' ? ' ml-[1.75rem]' : ' mr-[1.75rem]';
        }
        break;
      case 'responsive-icon':
        lc += ` sr-only sm:not-sr-only small-label text-${color}`;
        break;
      case 'secondary':
        lc += ` small-label text-${color}`;
        break;
    }

    return lc;
  });
</script>

<!-- Note that `disabled` is converted to `undefined` is `false` because DaisyUI's `[disabled]` selector will otherwise match it. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' ? effectiveText : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? effectiveText : undefined}
  disabled={disabled || loading || undefined}
  {...concatClass(restProps, classes)}>
  {#if loading || icon}
    <div class="relative">
      {#if loading}
        <Loading inline size="sm" class="pe-2" />
      {:else if icon}
        <Icon name={icon} />
      {/if}
      {#if variant !== 'main'}
        <div class="absolute -end-6 -top-8">
          {@render badge?.()}
        </div>
      {/if}
    </div>
  {/if}
  {#if variant !== 'icon' && variant !== 'floating-icon'}
    <div class={labelClass}>
      <span class="uc-first relative">
        {effectiveText}
        {#if !icon && variant !== 'main'}
          <div class="absolute -end-20 -top-8">
            {@render badge?.()}
          </div>
        {/if}
      </span>
    </div>
  {/if}
  {#if variant === 'main'}
    <div class="absolute -end-6 -top-12">
      {@render badge?.()}
    </div>
  {/if}
</svelte:element>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  [disabled] .vaa-button-label,
  .disabled .vaa-button-label {
    @apply text-neutral/20;
  }
</style>
