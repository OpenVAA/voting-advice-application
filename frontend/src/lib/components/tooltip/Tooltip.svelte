<!--
@component
Show a tooltip when hovering over text.
### Properties
- `title`: The title of the tooltip (Optional).
- `tip`: The text to show in the tooltip.
### Usage
```tsx
<Tooltip tip="Tip">
    Hover over me
  </Tooltip>
  ```
  -->
  
  <script lang="ts">
    import type { TooltipProps } from './Tooltip.type';
    type $$Props = TooltipProps;
    export let title: $$Props['title'] = '';
    export let tip: $$Props['tip'] = '';
    const VERTICAL_PADDING = 20;
    const tooltipId = Math.random().toString(36).substring(2);
    // Allows displaying the tooltip when trigger is focused, for example. APG tooltip pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
    let forceOpen = false;
    let triggerDiv: HTMLButtonElement;
    let tooltipDiv: HTMLDivElement;
    let leftPadding = 0;
    let rightPadding = 0;
    $: content = title ? `${title}: ${tip}` : tip;
    $: {
      // Required for touch controls
      if (forceOpen) {
        calculatePosition();
      }
    }
    /**
     * Calculates the horizontal paddings that keep the tooltip within the view.
     */
    function calculatePosition() {
      if (!triggerDiv || !tooltipDiv) {
        return;
      }
      const triggerRect = triggerDiv.getBoundingClientRect();
      const tooltipRect = tooltipDiv.getBoundingClientRect();
      // Calculate using the trigger to avoid flickering when resizing
      const tooltipLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      const tooltipRight = tooltipLeft + tooltipRect.width;
      leftPadding = tooltipRect ? Math.max(0, -(tooltipLeft - VERTICAL_PADDING)) : 0;
      rightPadding = tooltipRect ? Math.max(0, tooltipRight - window.innerWidth + VERTICAL_PADDING) : 0;
    }
  </script>
  
  <svelte:window on:resize={() => calculatePosition()} />
  
  <button
    bind:this={triggerDiv}
    class="group relative underline decoration-primary decoration-dotted"
    on:mouseover={() => calculatePosition()}
    on:focus={() => (forceOpen = true)}
    on:blur={() => (forceOpen = false)}
    on:keydown={(e) => {
      if (e.key === 'Escape') {
        forceOpen = false;
      }
    }}
    aria-describedby={tooltipId}
    aria-label={content}>
    <slot />
    <div
      class="absolute left-1/2 top-20 z-10 h-10 w-10 -translate-x-1/2 transform border-[10px] border-b-base-200 border-l-transparent border-r-transparent border-t-transparent opacity-0 transition-opacity ease-in-out group-hover:opacity-100"
      class:opacity-100={forceOpen}>
    </div>
    <div
      bind:this={tooltipDiv}
      id={tooltipId}
      class="duration-200 pointer-events-none absolute bottom-auto left-1/2 right-auto z-10 w-max rounded-md bg-base-200 p-10 text-md font-normal text-neutral opacity-0 shadow-md transition-opacity ease-in-out group-hover:opacity-100"
      style={`transform: translateX(calc(-50% ${leftPadding ? `+ ${leftPadding.toFixed()}px` : `- ${rightPadding.toFixed()}px`})); max-width: min(20rem, calc(100vw - 2rem)); top: calc(100% + 1px + 0.625rem);`}
      class:opacity-100={forceOpen}
      role="tooltip">
      {content}
    </div>
  </button>