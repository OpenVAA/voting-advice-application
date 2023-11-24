<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PreHeadingProps} from './PreHeading.type';

  type $$Props = PreHeadingProps;

  $$restProps['aria-roledescription'] ??= $_('aria.preHeading');
</script>

<!--
@component
Used for a pre-title, or kicker, above the main title of a page
within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` 
  element representing the pre-title.
  @default $_('aria.PreHeading')
- Any valid attributes of a `<p>` element.

### Slots

- default: the contents of pre-title

### Usage

```tsx
<PreHeading class="text-accent">{$_('categories.environment')}</PreHeading>
```
-->

<p {...$$restProps}>
  <slot />
</p>
