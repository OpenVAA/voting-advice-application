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
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { TermProps } from './Term.type';

  let {
    definition,
    position = 'bottom',
    showUnderline = true,
    forceShow = false,
    children,
    ...restProps
  }: TermProps = $props();

  const VERTICAL_PADDING = 20;
  const definitionId = getUUID();

  let triggerElement: HTMLSpanElement;
  // $state so `bind:this` clears to undefined on unmount and the position
  // $effect re-runs when the popup mounts.
  let definitionDiv = $state<HTMLDivElement | undefined>();
  let leftPadding = $state(0);
  let rightPadding = $state(0);

  // The definition popup is only mounted while the term is hovered or focused
  // (or `forceShow`). Keeping it out of the DOM otherwise is the a11y fix: as a
  // permanent (opacity-0) child it polluted the host heading's text content and
  // accessible name with the full definition. W3C APG tooltip pattern: reveal on
  // hover + keyboard focus, associate via `aria-describedby` while shown.
  let hovered = $state(false);
  let focused = $state(false);
  const visible = $derived(forceShow || hovered || focused);

  // Position the popup once it is in the DOM (it cannot be measured at mount
  // because it is conditionally rendered).
  $effect(() => {
    if (visible && definitionDiv) calculatePosition();
  });

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

<svelte:window
  onresize={() => {
    if (visible) calculatePosition();
  }} />

<!-- bind: keep — triggerElement is plain let; read in calculatePosition. tabindex makes the
     definition reachable by keyboard (W3C APG tooltip); aria-describedby links it while shown.
     Markup is whitespace-FLUSH (the `><span … </span\n  >{#if` trick, mirroring
     QuestionHeading): a stray text-node space anywhere between the trigger text and the
     conditional popup would leak into the host heading's text (e.g. "Likert  7"). -->
<span
  class="group relative"
  bind:this={triggerElement}
  role="term"
  tabindex="0"
  aria-describedby={visible ? definitionId : undefined}
  data-testid="voter-questions-term-trigger"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
  onfocusin={() => (focused = true)}
  onfocusout={() => (focused = false)}
  ><span
    {...concatClass(
      restProps,
      showUnderline ? 'underline underline-offset-[0.2em] decoration-primary decoration-dotted' : ''
    )}>{@render children?.()}</span
  >{#if visible}<!-- bind: keep — definitionDiv is $state; read in calculatePosition ($effect + onresize) -->
    <div
      bind:this={definitionDiv}
      id={definitionId}
      data-testid="voter-questions-term-popup"
      class="bg-base-200 text-md text-neutral pointer-events-none absolute right-auto bottom-auto left-1/2 z-10 w-max rounded-md p-10 font-normal opacity-100 shadow-md"
      style={`transform: translateX(calc(-50% ${leftPadding ? `+ ${leftPadding.toFixed()}px` : `- ${rightPadding.toFixed()}px`})); max-width: min(20rem, calc(100vw - 2rem)); ${
        position === 'top' ? 'bottom: calc(100% + 0.625rem);' : 'top: calc(100% + 0.625rem);'
      }`}
      role="tooltip">
      {definition}
    </div>{/if}</span>
