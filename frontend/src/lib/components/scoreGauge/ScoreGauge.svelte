<script lang="ts">
  import type { ScoreGaugeProps } from './ScoreGauge.type';
  import { concatProps, getUUID } from '$lib/utils/components';

  type $$Props = ScoreGaugeProps;

  export let score: $$Props['score'];
  export let label: $$Props['label'];
  export let max: $$Props['max'] = 100;
  export let showScore: $$Props['showScore'] = true;
  export let unit: $$Props['unit'] = '';
  export let variant: $$Props['variant'] = 'radial';
  export let color: $$Props['color'] = 'oklch(var(--n))';
  export let colorDark: $$Props['colorDark'] = 'oklch(var(--n))';

  const labelId = getUUID();

  // Create styles
  let classes: string;
  let styles: string | undefined;
  $: {
    classes = 'vaa-score-gauge grid gap-4';
    switch (variant) {
      case 'linear':
        classes += ' grid-rows-[fit-content(100%)_minmax(0,_1fr)] justify-items-start';
        break;
      default:
        classes += ' grid-cols-[fit-content(100%)_minmax(0,_1fr)] items-center';
    }
    styles = `--meter-color: ${color}; --meter-color-dark: ${colorDark};`;
    // Set the radial size based on the contents
    const radSize = (showScore ? Math.max(`${max}${unit}`.length, 3) : 3) * 0.7;
    styles += `--radial-size: ${radSize.toFixed(3)}rem; --radial-size-lg: ${(radSize * 1.25).toFixed(3)}rem;`;
  }
</script>

<!--@component
Show a radial or a linear score gauge for a sub-match.

### Properties

- `score`: The score of the gauge in the range from 0 to `max`, usually 100.
- `max`: The maximum value of the gauge. @default 100
- `label`: The text label for the gauge, e.g. the name of the category.
- `variant`: The format of the gauge. @default 'linear'
- `showScore`: Whether to also show the score as numbers. @default true
- `unit`: The string to add to the score if it's shown, e.g. '%'. @default ''
- `color`: The color of the gauge. @default 'oklch(var(--n))' i.e. the `neutral` color.
- `colorDark`: The color of the gauge in dark mode. @default 'oklch(var(--n))' i.e. the `neutral` color.

```tsx
<ScoreGauge score={23} label={category.name} 
  color={category.color} colorDark={category.colorDark}
  variant="radial"/>
<ScoreGauge score={23} label={category.name}/>
```
-->

<div
  {...concatProps($$restProps, {
    class: classes,
    style: styles
  })}>
  {#if variant === 'linear'}
    <progress
      role="meter"
      aria-labelledby={labelId}
      class="progress-color progress"
      aria-valuemax={max}
      aria-valuenow={score}
      value={score}
      {max} />
  {:else}
    <div
      role="meter"
      aria-valuemax={max}
      aria-valuenow={score}
      aria-labelledby={labelId}
      class="radial-progress flex-shrink-0 self-center"
      style="--value:{(score / (max ?? 100)) * 100};">
      {#if showScore}
        <span class="text-sm text-secondary" aria-hidden="true">{score}{unit}</span>
      {/if}
    </div>
  {/if}
  <div class="grid grid-cols-[minmax(0,_1fr)_fit-content(100%)] gap-sm justify-self-stretch">
    <label
      class="grow truncate text-sm text-secondary"
      for={labelId}
      id={labelId}
      aria-hidden="true">
      {label}
    </label>
    {#if variant === 'linear' && showScore}
      <div class="shrink-0 text-sm text-secondary" aria-hidden="true">
        {score}{unit}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  /* We need a media query to selectively set the --progress-color value we want to use. */
  .vaa-score-gauge {
    --progress-color: var(--meter-color);
  }

  @media (prefers-color-scheme: dark) {
    .vaa-score-gauge {
      --progress-color: var(--meter-color-dark);
    }
  }

  /* For Firefox */
  progress::-moz-progress-bar {
    background: var(--progress-color);
  }

  /* For Chrome or Safari */
  progress::-webkit-progress-value {
    background: var(--progress-color);
  }

  /* For IE10 */
  progress {
    color: var(--progress-color);
  }

  .radial-progress {
    color: var(--progress-color);
    --size: var(--radial-size);
    --thickness: calc(var(--radial-size) * 0.12);
  }

  /* This is the css rule copied from DaisyUI with the last line (oklch(var(--b3))) added to create the full circle background */
  .radial-progress:before {
    background:
      radial-gradient(farthest-side, currentColor 98%, #0000) top/var(--thickness) var(--thickness)
        no-repeat,
      conic-gradient(currentColor calc(var(--value) * 1%), #0000 0),
      oklch(var(--b3));
  }

  @media (min-width: 1024px) {
    .radial-progress {
      --size: var(--radial-size-lg);
      --thickness: calc(var(--radial-size-lg) * 0.12);
    }
  }
</style>
