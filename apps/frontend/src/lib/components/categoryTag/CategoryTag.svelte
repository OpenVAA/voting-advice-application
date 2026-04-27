<!--
@component
Used to display a question category tag with the category's color.

### Properties

- `category`: The `QuestionCategory` object.
- `variant`: Whether to use an abbreviation or the full name. Default: `'full'`
- `suffix`: An optional suffix to add after the category name, e.g. '1/3'.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- Any valid attributes of a `<span>` element

### Usage

```tsx
<CategoryTag category={question.category}/>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { CategoryTagProps } from './CategoryTag.type';

  let { category, variant = 'full', suffix, onShadedBg, ...restProps }: CategoryTagProps = $props();

  // Create styles
  let tagStyles = $derived.by(() => {
    let classes = `tag ${onShadedBg ? 'bg-base-100' : 'bg-base-200'}`;
    let styles = '';
    if (category.color?.normal) {
      styles += ` --tag-color: ${category.color.normal};`;
      classes += ' text-[var(--tag-color)]';
    }
    if (category.color?.dark) {
      styles += ` --tag-color-dark: ${category.color.dark};`;
      classes += ' dark:text-[var(--tag-color-dark)]';
    }
    return { classes, styles };
  });
</script>

<span {...concatClass(restProps, tagStyles.classes)} style={tagStyles.styles}>
  {variant === 'full' ? category.name : category.shortName}
  {#if suffix}
    <span>{suffix}</span>
  {/if}
</span>
