<!--
@component Used for a pre-title, or kicker, above the main title of a page within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` element representing the pre-title. Default: `t('components.preHeading.roleDescription')`
- Any valid attributes of a `<p>` element.

### Snippet Props

- `children`: the contents of the pre-title.

### Usage

```tsx
<PreHeading class="text-accent">{t('categories.environment')}</PreHeading>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import type { PreHeadingProps } from './PreHeading.type';

  let { children, ...restProps }: PreHeadingProps = $props();

  const { t } = getComponentContext();
</script>

<p aria-roledescription={t('components.preHeading.roleDescription')} {...restProps}>
  {@render children?.()}
</p>
