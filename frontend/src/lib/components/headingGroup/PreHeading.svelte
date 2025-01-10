<!--
@component
Used for a pre-title, or kicker, above the main title of a page within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` element representing the pre-title. @default $t('components.preHeading.roleDescription')
- Any valid attributes of a `<p>` element.

### Slots

- default: the contents of pre-title

### Usage

```tsx
<PreHeading class="text-accent">{$t('categories.environment')}</PreHeading>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  const { t } = getComponentContext();
</script>

<p aria-roledescription={$t('components.preHeading.roleDescription')} {...$$restProps}>
  <slot />
</p>
