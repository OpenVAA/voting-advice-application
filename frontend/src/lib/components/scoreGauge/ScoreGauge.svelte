<script lang="ts">
  import type {ScoreGaugeProps} from './ScoreGauge.type';
  import {getUUID} from '$lib/utils/components';
  import {_} from 'svelte-i18n';

  type $$Props = ScoreGaugeProps;

  export let score: $$Props['score'];
  export let showUnit: $$Props['showUnit'] = true;
  export let unit: $$Props['unit'] = '%';
  export let shape: $$Props['shape'] = 'linear';
  export let label: $$Props['label'] = '';
  export let labelColor: $$Props['labelColor'] = 'hsl(var(--s))';
  export let meterColor: $$Props['meterColor'] = 'hsl(var(--n))';

  const labelId = getUUID();

  $: cssVarStyles = `--progress-color:${meterColor};` + `--progress-label-color:${labelColor}`;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="grid gap-4"
  class:grid-cols-1={shape === 'linear'}
  class:justify-items-center={shape === 'linear'}
  class:grid-col-2-fit={shape === 'radial'}
  class:items-center={shape === 'radial'}
  style={cssVarStyles}>
  {#if shape === 'radial'}
    <div
      tabindex="0"
      role="meter"
      aria-valuemax={100}
      aria-valuenow={score}
      aria-labelledby={labelId}
      class="radial-progress self-center"
      style={`--value:${score};`}>
      {#if showUnit}
        <span class="text-sm text-secondary" aria-hidden="true">{score}{unit}</span>
      {/if}
    </div>
  {:else if shape === 'linear'}
    {#if showUnit}
      <div class="text-sm text-secondary" aria-hidden="true">
        {score}{unit}
      </div>
    {/if}
    <progress
      tabindex="0"
      aria-labelledby={labelId}
      class="progress-color progress"
      aria-valuenow={score}
      value={score}
      max="100" />
  {/if}
  {#if label}
    <label class="truncate text-sm text-secondary" id={labelId} aria-hidden="true">{label}</label>
  {/if}
</div>

<style>
  /* For Firefox */
  progress::-moz-progress-bar {
    background: var(--progress-color);
  }
  /* For Firefox */

  /* For Chrome or Safari */
  progress::-webkit-progress-value {
    background: var(--progress-color);
  }
  /* For Chrome or Safari */

  /* For IE10 */
  progress {
    color: var(--progress-color);
  }

  /* TODO: Find a way to use Tailwind utility classes here */

  .radial-progress {
    color: var(--progress-color);
    --size: 2.5rem;
  }

  @media (min-width: 1024px) {
    .radial-progress {
      --size: 3.5rem;
    }
  }

  .grid-col-2-fit {
    grid-template-columns: fit-content(100%) minmax(0, 1fr);
  }
</style>
