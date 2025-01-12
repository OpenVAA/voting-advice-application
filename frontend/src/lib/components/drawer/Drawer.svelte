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

- `title`: Title used for the expander. This is also used as the aria-label for 
  the checkbox on which the expander operates on.
- `variant`: The type for the expander.
- `iconColor`: The color for the icon. Default color is primary.
- `iconPos`: The position for the icon. Default is text, which means the icon will
    be where the text ends.
- `titleClass`: Custom class string to add to the `<div>` containing the title.
- `contentClass`: Custom class string to add to the `<div>` containing the main content.
- `defaultExpanded`: Variable used to define if the expander is expanded or not by default.

You should not try to use a variant and customize at the same time.

### Events

- `expand`: Fired when the expander is expanded.
- `collapse`: Fired when the expander is collapsed.

### Usage

```tsx
<Drawer title="Example title">
  <p>Example content<p/>
</Drawer>

<Drawer title="Example title" variant="category"  iconColor="primary" 
  titleClass="bg-base-100 text-primary" contentClass="bg-base-300 text-info font-bold">
  <p>Example content<p/>
</Drawer>
```
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import { createEventDispatcher } from 'svelte';
  import type { ExpanderProps } from './Drawer.type';
  import Button from '../button/Button.svelte';

  type $$Props = ExpanderProps;

  export let title: $$Props['title'];
  export let variant: $$Props['variant'] = 'read-more';
  export let iconColor: $$Props['iconColor'] = 'secondary';
  export let iconPos: $$Props['iconPos'] = 'text';
  export let titleClass: $$Props['titleClass'] = '';
  export let contentClass: $$Props['contentClass'] = '';
  export let defaultExpanded: $$Props['defaultExpanded'] = false;

  const dispatch = createEventDispatcher<{ expand: null; collapse: null }>();

  let expanded = defaultExpanded;

  function toggleExpanded() {
    expanded = !expanded;
    dispatch(expanded ? 'expand' : 'collapse');
  }

  $: console.log('expanded', expanded);
</script>

<div class="">
  <!-- Page content here -->
  <Button text={title} on:click={toggleExpanded} icon="info" iconPos="left"></Button>
  <div class="inset-0 {expanded ? 'fixed z-10' : 'hidden'} flex flex-col bg-base-200">
    <div class="flex items-center justify-between p-4">
      <div>
        <slot name="title" />
      </div>
      <div>
        <Button text="" variant="icon" icon="close" on:click={toggleExpanded}></Button>
      </div>
    </div>
    <slot />
  </div>
</div>

<!-- <div {...concatClass($$restProps, collapseClasses)}>
  <input type="checkbox" aria-label="open ${title}" on:click={toggleExpanded} checked={expanded} />
  <div class={titleClasses}>
    {title}
    <div class="not-rotated-icon {expanded ? 'rotated-icon' : ''} ml-[0.4rem] {iconClass}">
      <Icon name="next" size="sm" color={iconColor} />
    </div>
  </div>
  {#if expanded}
    <div class={contentClasses}>
      <slot />
    </div>
  {/if}
</div> -->
