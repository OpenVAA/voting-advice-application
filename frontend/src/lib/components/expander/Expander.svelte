<script lang="ts">
  import {Icon} from '$lib/components/icon';
  import type {ExpanderProps} from './Expander.type';

  type $$Props = ExpanderProps;

  export let title: $$Props['title'];
  export let variant: $$Props['variant'] = 'read-more';
  export let iconColor: $$Props['iconColor'] = 'secondary';
  export let iconPos: $$Props['iconPos'] = 'text';
  export let titleClass: $$Props['titleClass'] = '';
  export let contentClass: $$Props['contentClass'] = '';
  export let defaultExpanded: $$Props['defaultExpanded'] = false;

  let expanded = defaultExpanded;

  function toggleExpanded() {
    expanded = !expanded;
  }

  // Build classes
  // 1. Base classes for all collapse components
  let collapseClasses = 'collapse rounded-none min-h-touch min-w-touch h-auto w-full';
  let titleClasses = 'collapse-title text-center';
  let contentClasses = 'collapse-content';
  let iconClass = '';

  // 2. Variant-defined classes
  switch (variant) {
    case 'read-more':
      titleClasses += ' text-primary';
      contentClasses += ' text-center';
      break;
    case 'category':
      titleClasses += ' text-xl bg-base-300 font-bold';
      contentClasses += ' pt-lg';
      iconPos = 'left';
      break;
    case 'question':
      titleClasses += ' text-lg font-bold';
      break;
  }

  // 3. Icon position
  switch (iconPos) {
    case 'left':
      titleClasses += ' flex items-center justify-center';
      break;
    case 'text':
      iconClass = 'inline-block whitespace-nowrap';
      break;
  }

  // 4. Set colors for all custom color variables execpt icon, which is defined later
  if (contentClass) {
    contentClasses += ` ${contentClass}`;
  }
  if (titleClass) {
    titleClasses += ` ${titleClass}`;
  }
</script>

<!-- 
@component
A component for expanders that contain a title and some content. Use the
`variant` prop to specify the expander type.

- `read-more`: the default style of the expander. Used, for example, for getting
  more information about a question.
- `question`: a more prominent style of the expander. Used in question listings
  to display a question that can be expanded to reveal further information.
- `category`: the most prominent style of the expander. Used for collapsible
  categories of items, such as questions.

### Properties

- `title`: Title used for the expander. This is also used as the aria-label for 
  the checkbox on which the expander operates on.
- `variant`: The type for the expander.
- `iconColor`: The color for the icon. Default color is primary.
- `iconPos`: The position for the icon. Default is text, which means the icon will
    be where the text ends.
- `titleClass`: Custom class string to add to the `<div>` containing the title.
- `contentClass`: Custom class string to add to the `<div>` containing the main content.

You should not try to use a variant and customize at the same time.

### Usage

```tsx
<Expander title="Example title">
  <p>Example content<p/>
</Expander>

<Expander title="Example title" variant="category"  iconColor="primary" 
  titleClass="bg-base-100 text-primary" contentClass="bg-base-300 text-info font-bold">
  <p>Example content<p/>
</Expander>
```
-->

<div class={collapseClasses}>
  <input type="checkbox" aria-label="open ${title}" on:click={toggleExpanded} checked={expanded} />
  <div class={titleClasses}>
    {title}
    <div class="not-rotated-icon {expanded ? 'rotated-icon' : ''} ml-[0.4rem] {iconClass}">
      <Icon name="next" size="sm" color={iconColor} />
    </div>
  </div>
  <div class={contentClasses}>
    <slot />
  </div>
</div>

<style>
  .not-rotated-icon {
    --tw-rotate: 90deg;
    transition: transform 0.2s linear;
    transform: rotate(90deg);
  }

  .rotated-icon {
    transform: rotate(270deg);
  }

  .collapse-title {
    padding: 0.7rem;
    align-items: center;
    text-align: center;
  }

  .collapse-content {
    text-align: center;
    padding-right: 1.25rem;
    padding-left: 1.25rem;
    padding-top: 0;
    padding-bottom: 0;
  }

  /* This is needed to add padding to collapse content only when collapse is open */
  .collapse:not(.collapse-close) > input[type='checkbox']:checked ~ .collapse-content {
    padding-right: 1.25rem;
    padding-left: 1.25rem;
  }

  /* This is needed to remove the excisting
  min-height definition from daisyui collapse class.
  Only defining min-height in .collapse-title does not work.*/
  .collapse-title,
  :where(.collapse > input[type='checkbox']) {
    min-height: 0rem;
  }
</style>
