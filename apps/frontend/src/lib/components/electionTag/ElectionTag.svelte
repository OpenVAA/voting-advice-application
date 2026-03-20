<!--
@component
Used to display an election tag with the election's color.

Used when the application has multiple elections and question may apply to only some of them.

### Properties

- `election`: The `Election` object.
- `variant`: Whether to use an abbreviation or the full name. Default: `'short'`
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- Any valid attributes of a `<span>` element.

### Usage

```tsx
<ElectionTag {election}/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { ElectionTagProps } from './ElectionTag.type';

  let { election, variant = 'short', onShadedBg, ...restProps }: ElectionTagProps = $props();

  // Create styles
  let tagStyles = $derived.by(() => {
    let classes = `tag ${onShadedBg ? 'bg-base-100' : 'bg-base-200'}`;
    let styles = '';
    if (election.color?.normal) {
      styles += ` --tag-color: ${election.color.normal};`;
      classes += ' text-[var(--tag-color)]';
    }
    if (election.color?.dark) {
      styles += ` --tag-color-dark: ${election.color.dark};`;
      classes += ' dark:text-[var(--tag-color-dark)]';
    }
    return { classes, styles };
  });
</script>

<span
  {...concatClass(restProps, tagStyles.classes)}
  style={tagStyles.styles}>
  {variant === 'full' ? election.name : election.shortName}
</span>
