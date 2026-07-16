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

The trigger is a focusable `button` (W3C APG tooltip pattern) whose accessible
name is the term text; the definition popup uses the `tooltip` role and is linked
via `aria-describedby` while shown.

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
  // `dismissed` overrides the hover/focus reveal so the popup can be closed in
  // place (Escape key or clicking the trigger) without moving the pointer or
  // focus — WCAG 2.1 AA SC 1.4.13 (Content on Hover or Focus) dismissibility.
  let dismissed = $state(false);
  const visible = $derived(!dismissed && (forceShow || hovered || focused));

  // Clear the dismissal once the trigger is no longer hovered or focused so a
  // subsequent hover/focus reveals the definition again.
  $effect(() => {
    if (!hovered && !focused) dismissed = false;
  });

  /**
   * Toggle the definition popup. Gives the trigger `button` real activation
   * behaviour (click / Enter / Space) so its announced role matches what it
   * does — WCAG 2.1 AA SC 4.1.2 (Name, Role, Value).
   */
  function toggle(): void {
    dismissed = visible;
  }

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
  }}
  onkeydown={(e) => {
    // WCAG 2.1 AA SC 1.4.13: content shown on hover/focus must be dismissible
    // without moving the pointer or focus. Escape hides the popup in place.
    if (e.key === 'Escape' && visible) dismissed = true;
  }} />

<!-- bind: keep — triggerElement is plain let; read in calculatePosition. The trigger is a real
     <button> (W3C APG toggletip): it owns keyboard focus + Enter/Space/click activation, so the
     announced "button" role matches real behaviour (WCAG 4.1.2) and no misleading role-on-a-span +
     tabindex is needed. aria-describedby links the definition while shown; aria-expanded reflects
     the popup state. The button is unstyled/inline (Tailwind preflight already resets its bg,
     border, padding, margin and inherits font + colour) so the term renders as plain inline text.
     Markup is whitespace-FLUSH (the `></button\n  >{#if` trick, mirroring QuestionHeading): a stray
     text-node space anywhere between the trigger text and the conditional popup would leak into the
     host heading's text (e.g. "Likert  7"). -->
<span class="group relative" bind:this={triggerElement}
  ><button
    type="button"
    class="inline appearance-none"
    aria-describedby={visible ? definitionId : undefined}
    aria-expanded={visible}
    data-testid="voter-questions-term-trigger"
    onclick={toggle}
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    onfocusin={() => (focused = true)}
    onfocusout={() => (focused = false)}
    ><span
      {...concatClass(
        restProps,
        showUnderline ? 'underline underline-offset-[0.2em] decoration-primary decoration-dotted' : ''
      )}>{@render children?.()}</span
  ></button
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
