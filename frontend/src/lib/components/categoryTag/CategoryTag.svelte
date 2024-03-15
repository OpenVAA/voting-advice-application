<script lang="ts">
  import {concatProps} from '$lib/utils/components';
  import type {CategoryTagProps} from './CategoryTag.type';

  type $$Props = CategoryTagProps;

  export let category: $$Props['category'];
  export let variant: $$Props['variant'] = 'default';

  // Create styles
  let classes: string;
  let styles: string;
  $: {
    classes = 'inline-block';
    styles = '';
    if (category.color) {
      styles += ` --tag-color: ${category.color};`;
      classes += ' text-[var(--tag-color)]';
    }
    if (category.colorDark) {
      styles += ` --tag-color-dark: ${category.colorDark};`;
      classes += ' dark:text-[var(--tag-color-dark)]';
    }
  }
</script>

<!--
@component
Used to display a question category tag with the category's color.

### Properties

- `category`: The QuestionCategory object.
- `variant`: Whether to use an abbreviation or the full name. @default `'default'`
- Any valid attributes of a `<span>` element.

### Usage

```tsx
<CategoryTag category={question.category}/>
```
-->

<span
  {...concatProps($$restProps, {
    class: classes,
    style: styles
  })}>
  {variant === 'short' ? category.shortName : category.name}
</span>
