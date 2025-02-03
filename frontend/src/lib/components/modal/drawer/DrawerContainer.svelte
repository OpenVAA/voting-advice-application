<!--
@component
A drawer container elemet to be passed to a Modal

### Usage

Example of a modal with a drawer container:

```tsx
<Modal
  bind:closeModal
  bind:openModal
  bind:isOpen
  {title}
  container={DrawerContainer}>
  <slot name="actions" slot="actions" />
  <slot />
</Modal>
  ```
  -->

<script lang="ts">
  import { fly } from 'svelte/transition';
</script>

<div
  class="max-w-80 relative col-span-1 col-start-1 row-span-1 row-start-1 h-[calc(100vh-2rem)] translate-y-[1rem] rounded-t-[2rem] bg-black p-24 pt-40"
  in:fly={{ y: '100%', duration: 200 }}
  out:fly={{ y: '100%', duration: 200 }}>
  <slot />
</div>
