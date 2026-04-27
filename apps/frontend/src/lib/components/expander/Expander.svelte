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
- `question-help`: used to display questions and answers in the style of the help page.

### Properties

- `title`: Title is seen as the text in the expander's visible part, and it is mandatory. Title will also be used as a 'aria-label' for a checkbow on which the expander operates on.
- `iconColor`: The color of the next-icon that is used in the expander. Default: `'primary'`
- `iconPos`: The position of the next-icon that is used in the expander. Default: `'text'`
- `titleClass`: Variable with which to configure the expanders title if no variants are in use.
- `contentClass`: Variable with which to configure the expanders content if no variants are in use.
- `defaultExpanded`: Variable used to define if the expander is expanded or not by default.
- `variant`: Variable used to define a variant for the expander.
- Any valid attributes of a `<div>` element.

You should not try to use a variant and customize at the same time.

### Events

- `expand`: Fired when the expander is expanded.
- `collapse`: Fired when the expander is collapsed.

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

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { ExpanderProps } from './Expander.type';

  let {
    title,
    variant = 'read-more',
    iconColor = 'secondary',
    iconPos = 'text',
    titleClass: customTitleClass = '',
    contentClass: customContentClass = '',
    defaultExpanded = false,
    onExpand = undefined,
    onCollapse = undefined,
    children,
    ...restProps
  }: ExpanderProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Handle expansion/collapse
  ////////////////////////////////////////////////////////////////////

  let expanded = $state(defaultExpanded);

  function toggleExpanded() {
    expanded = !expanded;
    if (expanded) {
      onExpand?.();
    } else {
      onCollapse?.();
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // Build classes (Svelte 5: derive reactively from props instead of
  // mutating top-level locals at init).
  // 1. Base classes for all collapse components
  const collapseClasses = 'collapse rounded-none min-h-touch min-w-touch h-auto w-full';

  // 2. Variant + iconPos resolution. The original code mutated `iconPos`
  // when variant === 'category'; we replicate that with an effective
  // iconPos derived from variant.
  const effectiveIconPos = $derived(variant === 'category' ? 'left' : iconPos);

  const titleClasses = $derived.by(() => {
    let cls = 'collapse-title text-center px-md';
    switch (variant) {
      case 'read-more':
        cls += ' !px-0 text-primary';
        break;
      case 'category':
        cls += ' !px-md text-xl bg-base-300 font-bold';
        break;
      case 'question':
        cls += ' !px-0 text-lg font-bold';
        break;
      case 'question-help':
        cls += ' text-lg font-bold flex flex-row justify-between !text-left';
        break;
    }
    if (effectiveIconPos === 'left') {
      cls += ' flex items-center justify-center';
    }
    if (customTitleClass) {
      cls += ` ${customTitleClass}`;
    }
    return cls;
  });

  const contentClasses = $derived.by(() => {
    let cls = 'collapse-content p-md';
    switch (variant) {
      case 'read-more':
        cls += ' !px-0';
        break;
      case 'category':
        cls += ' pt-lg';
        break;
      case 'question':
        cls += ' !px-0';
        break;
      case 'question-help':
        cls += ' !text-left';
        break;
    }
    if (customContentClass) {
      cls += ` ${customContentClass}`;
    }
    return cls;
  });

  const iconClass = $derived(effectiveIconPos === 'text' ? 'inline-block whitespace-nowrap' : '');
</script>

<div {...concatClass(restProps, collapseClasses)}>
  <input type="checkbox" aria-label={t('common.expandOrCollapse')} onclick={toggleExpanded} checked={expanded} />
  <div class={titleClasses}>
    {title}
    <div class="not-rotated-icon {expanded ? 'rotated-icon' : ''} ml-md {iconClass}">
      <Icon name="next" size="sm" color={iconColor} />
    </div>
  </div>
  {#if expanded}
    <div class={contentClasses}>
      {@render children?.()}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .not-rotated-icon {
    --tw-rotate: 90deg;
    transition: transform 0.2s linear;
    transform: rotate(90deg);
  }

  .rotated-icon {
    transform: rotate(270deg);
  }

  /* This is needed to add padding to collapse content only when collapse is open */
  .collapse:not(.collapse-close) > input[type='checkbox']:checked ~ .collapse-content {
    @apply py-md transition-[padding];
  }

  /* This is needed to remove the excisting
  min-height definition from daisyui collapse class.
  Only defining min-height in .collapse-title does not work.*/
  .collapse-title,
  :where(.collapse > input[type='checkbox']) {
    min-height: 0rem;
  }
</style>
