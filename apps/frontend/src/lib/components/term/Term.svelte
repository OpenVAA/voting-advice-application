<!--
@component
Show a definition popup when hovering over a term.

### Properties

- `definition`: The text to show in the definition popup.
- `position`: Position of the tooltip relative to the term. Default: `'bottom'`
- `showUnderline`: Whether to show the underline styling. Default: `true`
- `forceShow`: Whether to force show the tooltip. Default: `false`
- Any valid attributes of a `span` element.

### Accessibility

Uses the `term` and `definition` roles.

### Usage

```tsx
<Term definition="Hovering is an act of levitation">
  Hover over me
</Term>
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { TermProps } from './Term.type';

  type $$Props = TermProps;

  export let definition: $$Props['definition'];
  export let position: $$Props['position'] = 'bottom';
  export let showUnderline: $$Props['showUnderline'] = true;
  export let forceShow: $$Props['forceShow'] = false;

  const VERTICAL_PADDING = 20;
  const definitionId = getUUID();

  let triggerElement: HTMLSpanElement;
  let definitionDiv: HTMLDivElement;
  let leftPadding = 0;
  let rightPadding = 0;

  onMount(calculatePosition);

  /**
   * Calculates the horizontal paddings that keep the tooltip within the view.
   */
  function calculatePosition() {
    if (!triggerElement || !definitionDiv) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const definitionRect = definitionDiv.getBoundingClientRect();

    const tooltipLeft = triggerRect.left + triggerRect.width / 2 - definitionRect.width / 2;
    const tooltipRight = tooltipLeft + definitionRect.width;

    leftPadding = definitionRect ? Math.max(0, -(tooltipLeft - VERTICAL_PADDING)) : 0;
    rightPadding = definitionRect ? Math.max(0, tooltipRight - window.innerWidth + VERTICAL_PADDING) : 0;
  }
</script>

<svelte:window on:resize={() => calculatePosition()} />

<span class="group relative" bind:this={triggerElement} role="term">
  <span
    {...concatClass(
      $$restProps,
      showUnderline ? 'underline underline-offset-[0.2em] decoration-primary decoration-dotted' : ''
    )}
    aria-details={definitionId}><slot /></span>
  <div
    bind:this={definitionDiv}
    id={definitionId}
    class="duration-200 pointer-events-none absolute bottom-auto left-1/2 right-auto z-10 w-max rounded-md bg-base-200 p-10 text-md font-normal text-neutral opacity-0 shadow-md transition-opacity ease-in-out {forceShow
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100'}"
    style={`transform: translateX(calc(-50% ${leftPadding ? `+ ${leftPadding.toFixed()}px` : `- ${rightPadding.toFixed()}px`})); max-width: min(20rem, calc(100vw - 2rem)); ${
      position === 'top' ? 'bottom: calc(100% + 0.625rem);' : 'top: calc(100% + 0.625rem);'
    }`}
    role="definition">
    {definition}
  </div>
</span>
