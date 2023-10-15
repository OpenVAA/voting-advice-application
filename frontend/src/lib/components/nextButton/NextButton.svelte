<script lang="ts">
  import {Button} from '$lib/components/shared/button';
  import {NextIcon} from '$lib/components/icons';
  import type {NextButtonProps} from './NextButton.type';

  type $$Props = NextButtonProps;

  // Merge classes into $$restProps
  $$restProps.class = `btn-primary btn flex w-full max-w-md ${$$restProps.class ?? ''}`;
</script>

<!--
@component
Use for the primary action button at the bottom of a basic page.

The content of the component is the button text. You can also supply an icon
with the `icon` slot. The icon defaults to an arrow.

You can also pass any valid attributes to a `button` or `a` element. (More
precisely, any properties of a `Button` shared component.)

### Properties

- `href` optional url string, if this is passed, an `a` element will be used 
  instead of a `button`. If you don't pass a `href`, use a `on:click` 
  handler.
- Any valid attributes of a `button` and `a` element.

### Slots

- default: button text
- `icon`: button icon, @default `<NextIcon/>`

### Usage

```tsx
  <NextButton class="mt-xl" on:click={foo}>
    Continue
  </NextButton>
```
-->

<Button {...$$restProps} on:click>
  <span class="ml-12 flex-grow text-center"><slot /></span>
  <slot name="icon"><NextIcon /></slot>
</Button>
