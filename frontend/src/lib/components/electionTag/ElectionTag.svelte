<!--
@component
Used to display an election tag with the election's color.

Used when the application has multiple elections and question may apply to only some of them.

### Properties

- `election`: The `Election` object.
- `variant`: Whether to use an abbreviation or the full name. @default `'short'`
- Any valid attributes of a `<span>` element.

### Usage

```tsx
<ElectionTag {election}/>
```
-->

<script lang="ts">
  import { concatProps } from '$lib/utils/components';
  import type { ElectionTagProps } from './ElectionTag.type';

  type $$Props = ElectionTagProps;

  export let election: $$Props['election'];
  export let variant: $$Props['variant'] = 'short';

  // Create styles
  let classes: string;
  let styles: string;
  $: {
    classes = 'tag bg-base-200';
    styles = '';
    if (election.color?.normal) {
      styles += ` --tag-color: ${election.color.normal};`;
      classes += ' text-[var(--tag-color)]';
    }
    if (election.color?.dark) {
      styles += ` --tag-color-dark: ${election.color.dark};`;
      classes += ' dark:text-[var(--tag-color-dark)]';
    }
  }
</script>

<span
  {...concatProps($$restProps, {
    class: classes,
    style: styles
  })}>
  {variant === 'full' ? election.name : election.shortName}
</span>
