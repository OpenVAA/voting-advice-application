<!--@component
Show a radial or a linear score gauge for a sub-match.

### Properties

- `score`: The score of the gauge in the range from 0 to `max`, usually 100.
- `max`: The maximum value of the gauge. @default 100
- `label`: The text label for the gauge, e.g. the name of the category.
- `variant`: The format of the gauge. @default 'radial'
- `showScore`: Whether to also show the score as numbers. @default true
- `unit`: The string to add to the score if it's shown, e.g. '%'. @default ''
- `color`: The color of the gauge, optionally with a separate dark-mode color. @default 'var(--color-neutral)' i.e. the `neutral` color.
- Any valid attributes of a `<div>` element

```tsx
<ScoreGauge score={23} label={category.name} color={category.color} />
<ScoreGauge score={23} label={category.name} variant="linear" />
```
-->

<script lang="ts">
  import { parseColors } from '$lib/utils/color/parseColors';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { ScoreGaugeProps } from './ScoreGauge.type';

  let {
    score,
    label,
    max = 100,
    showScore = true,
    unit = '',
    variant = 'radial',
    color,
    ...restProps
  }: ScoreGaugeProps = $props();

  const labelId = getUUID();

  // Create styles
  let gaugeStyles = $derived.by(() => {
    const { normal, dark } = parseColors(color, 'var(--color-neutral)');

    let classes = 'grid gap-4 [--progress-color:var(--meter-color)] dark:[--progress-color:var(--meter-color-dark)]';
    switch (variant) {
      case 'linear':
        classes += ' grid-rows-[fit-content(100%)_minmax(0,_1fr)] justify-items-start';
        break;
      default:
        classes += ' grid-cols-[fit-content(100%)_minmax(0,_1fr)] items-center';
    }
    let styles = `--meter-color: ${normal}; --meter-color-dark: ${dark ?? normal};`;
    // Set the radial size based on the contents
    const radSize = (showScore ? Math.max(`${max}${unit}`.length, 3) : 3) * 0.7;
    styles += `--radial-size: ${radSize.toFixed(3)}rem; --radial-size-lg: ${(radSize * 1.25).toFixed(3)}rem;`;

    return { classes, styles };
  });
</script>

<div {...concatClass(restProps, gaugeStyles.classes)} data-testid="score-gauge" style={gaugeStyles.styles}>
  {#if variant === 'linear'}
    <progress
      role="meter"
      aria-labelledby={labelId}
      class="progress text-(--progress-color)"
      aria-valuemax={max}
      aria-valuenow={score}
      value={score}
      {max}></progress>
  {:else}
    <div
      role="meter"
      aria-valuemax={max}
      aria-valuenow={score}
      aria-labelledby={labelId}
      class="radial-progress flex-shrink-0 self-center text-(--progress-color) [--size:var(--radial-size)] [--thickness:calc(var(--radial-size)*0.12)] lg:[--size:var(--radial-size-lg)] lg:[--thickness:calc(var(--radial-size-lg)*0.12)]"
      style="--value:{(score / (max ?? 100)) * 100};">
      {#if showScore}
        <span class="small-info" aria-hidden="true">{score}{unit}</span>
      {/if}
    </div>
  {/if}
  <div class="gap-sm grid grid-cols-[minmax(0,_1fr)_fit-content(100%)] justify-self-stretch">
    <label class="small-info grow truncate" for={labelId} id={labelId} aria-hidden="true">
      {label}
    </label>
    {#if variant === 'linear' && showScore}
      <div class="small-info shrink-0" aria-hidden="true">
        {score}{unit}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Firefox's progress-bar fill, a vendor pseudo-element with no utility form. */
  progress::-moz-progress-bar {
    background: var(--progress-color);
  }

  /* Chrome's and Safari's progress-bar fill, a vendor pseudo-element with no utility form. */
  progress::-webkit-progress-value {
    background: var(--progress-color);
  }

  /* DaisyUI's radial-progress gradient with a base-300 layer added, which draws the full circle behind the value. */
  .radial-progress:before {
    background:
      radial-gradient(farthest-side, currentColor 98%, #0000) top/var(--thickness) var(--thickness) no-repeat,
      conic-gradient(currentColor calc(var(--value) * 1%), #0000 0),
      var(--color-base-300);
  }
</style>
