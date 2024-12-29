<!--
@component
Used to group the page's main headings, such as a pre-heading (kicker)
and the main title.

### Properties

- `aria-roledescription`: The Aria role description of the `<hgroup>` element representing the pre-title. @default $t('components.headingGroup.roleDescription')
- `role`: The Aria role of the `<hgroup>` element. @default 'group'
- Any valid attributes of a `<hgroup>` element.

### Slots

- default: the contents of the heading group.

### Usage

```tsx
<HeadingGroup>
  <PreHeading class="text-accent">{$t('categories.environment')}</PreHeading>
  <h1>{$t('titles.environment')}</h1>
</HeadingGroup>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  const { t } = getComponentContext();
</script>

<hgroup aria-roledescription={$t('components.headingGroup.roleDescription')} role="group" {...$$restProps}>
  <slot />
</hgroup>
