<script lang="ts">
  import type {ButtonProps} from './Button.type';

  type $$Props = ButtonProps;

  export let href: $$Props['href'] = undefined;
</script>

<!--
@component
An abstract template for creating button components.

The content of the component are the button contents.

You can also pass any valid attributes to a `button` or `a` element.

### Properties

- `href` optional url string, if this is passed, an `a` element will be used 
  instead of a `button`. If you don't pass a `href`, use a `on:click` 
  handler.
- Any valid attributes of a `button` and `a` element.

### Slots

- default: button contents

### Usage

```tsx
  <Button class="mt-xl" on:click={foo}>
    Continue
  </Button>
```
-->

<svelte:element this={href == null ? 'button' : 'a'} {href} {...$$restProps} on:click>
  <slot />
</svelte:element>
