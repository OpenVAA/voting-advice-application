<!--
@component
Reusable progress bar component for displaying task progress.

### Properties

- `progress`: Progress value between 0 and 1.
- `label`: Label for the progress bar. Default: `t('adminApp.jobs.progress')`
- `showPercentage`: Whether to show the percentage. Default: `true`
- `color`: Color theme for the progress bar. Default: `'primary'`
- `size`: Size of the progress bar. Default: `'md'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<ProgressBar progress={0.75} label="Processing" />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import type { ProgressBarProps } from './ProgressBar.type';

  type $$Props = ProgressBarProps;

  export let progress: $$Props['progress'];
  export let label: $$Props['label'] = undefined;
  export let showPercentage: $$Props['showPercentage'] = true;
  export let color: $$Props['color'] = undefined;
  export let size: $$Props['size'] = undefined;

  const { t } = getComponentContext();

  // Set defaults
  $: size ||= 'md';
  $: color ||= 'primary';
  $: label ||= $t('adminApp.jobs.progress');

  // Normalize progress value
  let normalizedProgress: number;
  let percentage: number;

  // Ensure progress is between 0 and 1
  $: normalizedProgress = Math.max(0, Math.min(1, progress));
  $: percentage = Math.round(normalizedProgress * 100);

  // Size classes
  $: sizeClasses = {
    sm: 'h-1 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-3 text-base'
  };

  // Color classes
  $: colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent'
  };
</script>

<div class="w-full">
  <div class="mb-2 flex justify-between text-sm">
    <span>{label}</span>
    {#if showPercentage}
      <span>{percentage}%</span>
    {/if}
  </div>

  <div class="w-full rounded-full bg-base-300 {sizeClasses[size]}">
    <div
      class="{colorClasses[color]} duration-300 h-full rounded-full transition-all ease-out"
      style="width: {percentage}%">
    </div>
  </div>
</div>
