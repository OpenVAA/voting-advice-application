<script lang="ts">
  import {Button} from '$lib/components/shared/button';
  import type {IconButtonProps} from './IconButton.type';

  type $$Props = IconButtonProps;

  export let type: $$Props['type'] = 'primary';

  // Merge classes into $$restProps
  let classes = 'btn btn-ghost flex flex-col items-center h-auto gap-6';
  classes += $$props.label ? ' justify-start' : ' justify-center px-10';
  if (type === 'secondary') classes += ' text-secondary';
  $$restProps.class = `${classes} ${$$restProps.class ?? ''}`;
</script>

<!--
@component
Use for buttons that have an icon and an optional small label, such as those
in the right half of the header (without a label) or below the answering 
options for a question (with label and type 'secondary').

The content of the component is the icon. You can also supply a visible 
label with the `label` slot. If you do not do this, supply an `aria-label`
to make the button accessible.

You can also pass any valid attributes to a `button` or `a` element. (More
precisely, any properties of a `Button` shared component.)

### Properties

- `href` optional url string, if this is passed, an `a` element will be used 
  instead of a `button`. If you don't pass a `href`, use a `on:click` 
  handler.
- Any valid attributes of a `button` and `a` element.

### Slots

- default: button icon
- `label`: optional label. If not provided, supply an `aria-label`.

### Usage

```tsx
  <IconButton class="mt-xl" on:click={skip}>
    Skip
    <SkipIcon slot="icon"/>
  </IconButton>
```
-->

<Button {...$$restProps} on:click>
  <slot />
  {#if $$slots.label}
    <div class="small-label"><slot name="label" /></div>
  {/if}
</Button>
