<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {HeadingGroupProps} from './HeadingGroup.type';

  type $$Props = HeadingGroupProps;

  $$restProps['role'] ??= 'group';
  $$restProps['aria-roledescription'] ??= $_('aria.headingGroup');
</script>

<!--
@component
Used to group the page's main headings, such as a pre-heading (kicker)
and the main title.

### Properties

- `aria-roledescription`: The Aria role description of the `<hgroup>` 
  element representing the pre-title.
  @default $_('aria.headingGroup')
- `role`: The Aria role of the `<hgroup>` element.
  @default 'group'
- Any valid attributes of a `<hgroup>` element.

### Slots

- default: the contents of the heading group.

### Usage

```tsx
<HeadingGroup>
  <PreHeading class="text-accent">{$_('categories.environment')}</PreHeading>
  <h1>{$_('titles.environment')}</h1>
</HeadingGroup>
```
-->

<hgroup {...$$restProps}>
  <slot />
</hgroup>
