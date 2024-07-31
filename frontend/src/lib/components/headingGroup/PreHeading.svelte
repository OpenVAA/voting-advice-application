<script lang="ts">
  import {t} from '$lib/i18n';
</script>

<!--
@component
Used for a pre-title, or kicker, above the main title of a page within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` element representing the pre-title. @default $t('aria.preHeading')
- Any valid attributes of a `<p>` element.

### Slots

- default: the contents of pre-title

### Usage

```tsx
<PreHeading class="text-accent">{$t('categories.environment')}</PreHeading>
```
-->

<p aria-roledescription={$t('aria.preHeading')} {...$$restProps}>
  <slot />
</p>
