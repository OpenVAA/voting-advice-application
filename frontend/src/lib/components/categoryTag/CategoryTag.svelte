<!--
@component
Used to display a question category tag with the category's color.

### Properties

- `category`: The `QuestionCategory` object.
- `variant`: Whether to use an abbreviation or the full name. @default `'full'`
- `suffix`: An optional suffix to add after the category name, e.g. '1/3'. @default undefined
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- Any valid attributes of a `<span>` element.

### Usage

```tsx
<CategoryTag category={question.category}/>
```
-->

<script lang="ts">
  import { concatProps } from '$lib/utils/components';
  import type { CategoryTagProps } from './CategoryTag.type';

  type $$Props = CategoryTagProps;

  export let category: $$Props['category'];
  export let variant: $$Props['variant'] = 'full';
  export let suffix: $$Props['suffix'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;

  // Create styles
  let classes: string;
  let styles: string;
  $: {
    classes = `tag ${onShadedBg ? 'bg-base-100' : 'bg-base-200'}`;
    styles = '';
    if (category.color?.normal) {
      styles += ` --tag-color: ${category.color.normal};`;
      classes += ' text-[var(--tag-color)]';
    }
    if (category.color?.dark) {
      styles += ` --tag-color-dark: ${category.color.dark};`;
      classes += ' dark:text-[var(--tag-color-dark)]';
    }
  }
</script>

<span
  {...concatProps($$restProps, {
    class: classes,
    style: styles
  })}>
  {variant === 'full' ? category.name : category.shortName}
  {#if suffix}
    <span>{suffix}</span>
  {/if}
</span>
