<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type {ExpanderProps} from './Expander.type';

  type $$Props = ExpanderProps;

  export let title: $$Props['title'];
  export let variant: $$Props['variant'] = null;
  export let iconColor: $$Props['iconColor'] = 'primary';
  export let iconPos: $$Props['iconPos'] = 'text';
  export let customizeTitle: $$Props['customizeTitle'] = '';
  export let customizeContent: $$Props['customizeContent'] = '';

  let iconIsRotated = false;

  function rotateText() {
    iconIsRotated = !iconIsRotated;
  }

  // Build classes
  // 1. Base classes for all collapse components
  let collapseClasses = 'collapse rounded-none min-h-touch min-w-touch h-auto w-full';
  let titleClasses = 'collapse-title text-l font-medium';
  let contentClasses = 'collapse-content';
  let iconClass = '';

  // 2. Variant-defined classes
  switch (variant) {
    case 'read-more':
      collapseClasses += ' bg-base-200';
      titleClasses += ' bg-base-200 text-primary';
      contentClasses += ' bg-base-200 text-primary';
      break;
    case 'category':
      collapseClasses += ' bg-base-300';
      titleClasses += ' bg-base-300 font-bold';
      contentClasses += ' bg-base-100';
      iconColor = 'secondary';
      iconPos = 'left';
      break;
    case 'question':
      collapseClasses += ' bg-base-100';
      titleClasses += ' bg-base-100 font-bold';
      contentClasses += ' bg-base-100';
      iconColor = 'secondary';
      break;
    case 'unansweared-question':
      collapseClasses += ' bg-base-100';
      titleClasses += ' bg-base-100 text-warning font-bold';
      contentClasses += ' bg-base-100';
      iconColor = 'secondary';
      break;
  }

  // 3. Icon position
  switch (iconPos) {
    case 'left':
      titleClasses += ' display-flex';
      break;
    case 'text':
      iconClass = 'inline-block whitespace-nowrap';
      break;
  }

  // 4. Set colors for all custom color variables execpt icon, which is defined later
  if (customizeContent) {
    contentClasses += ` ${customizeContent}`;
  }
  if (customizeTitle) {
    titleClasses += ` ${customizeTitle}`;
  }
</script>

<!-- 
    @component
    A component for expanders that contain a title and some content. Use the
    `variant` prop to specify the expander type.render

    - 'read-more' expander with base-200 as its base color, and text-primary as the
     text color. Used to get more information about an issue when giving your opinion
     in the candidate opinions.

    - 'category' expander with base-300 as its base color for the title, and base-100
     for the content. Text is black and bolded. Used to open a summary about some
     area.

    - 'question' expander with base-100 as its base color. Text is black and bolded.render
     Used to get more info about an already answeared question.render

    - 'unansweared-question' expander with base-100 as its base color. Text is bolded and
     colored as text-warning. Used to get more info about nonansweared questions.

    ### Properties

    - 'title': Title used for the expander. This is also used as the aria-label for 
     the checkbox on which the expander operates on.
    - 'variant': The type for the expander.
    - 'iconColor': The color for the icon. Default color is primary.
    - 'iconPos': The position for the icon. Default is text, which means the icon will
        be where the text ends.
    - 'customizeTitle': Variable to customize title.
    - 'customizeContent': Variable to customize content.

    You should not try to use a variant and customize at the same time.

    ### Usage

    ```tsx
    <Expander variant="read-more" title="Example title">
    <p> Example content <p/>
    </Expander>

    <Expander title="Example title" iconColor="primary" customizeTitle=" bg-base-100 text-primary"
    customizeContent=" bg-base-300 text-info font-bold">
    <p> Example content <p/>
    </Expander>
    ```
   -->

<div class={collapseClasses}>
  <input type="checkbox" aria-label="open ${title}" on:click={rotateText} />
  <div class={titleClasses}>
    {title}
    <div class="not-rotated-icon {iconIsRotated ? 'rotated-icon' : ''} ml-[0.4rem] {iconClass}">
      <Icon name="next" size="sm" color={iconColor} aria-label="expander" />
    </div>
  </div>
  <div class={`${contentClasses} ${iconIsRotated ? 'visible' : ''}`}>
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

  .collapse {
    transition: none;
  }

  .collapse-title {
    padding: 0.7rem;
    align-items: center;
    text-align: center;
  }

  .display-flex {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .collapse-content {
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;
  }

  .collapse-content.visible {
    padding: 0.7rem;
  }

  /* This is needed to remove the excisting
  min-height definition from daisyui collapse class.
  Only defining min-height in .collapse-title does not work.*/
  .collapse-title,
  :where(.collapse > input[type='checkbox']) {
    min-height: 0rem;
  }
</style>
