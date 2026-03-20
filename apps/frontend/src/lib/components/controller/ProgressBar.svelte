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

<svelte:options runes />

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import type { ProgressBarProps } from './ProgressBar.type';

  let {
    progress,
    label = undefined,
    showPercentage = true,
    color = undefined,
    size = undefined,
    ...restProps
  }: ProgressBarProps = $props();

  const { t } = getComponentContext();

  // Set defaults via derived
  let effectiveSize = $derived(size || 'md');
  let effectiveColor = $derived(color || 'primary');
  let effectiveLabel = $derived(label || t('adminApp.jobs.progress'));

  // Normalize progress value
  let normalizedProgress = $derived(Math.max(0, Math.min(1, progress)));
  let percentage = $derived(Math.round(normalizedProgress * 100));

  // Size classes
  const sizeClasses: Record<string, string> = {
    sm: 'h-1 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-3 text-base'
  };

  // Color classes
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent'
  };
</script>

<div class="w-full">
  <div class="mb-2 flex justify-between text-sm">
    <span>{effectiveLabel}</span>
    {#if showPercentage}
      <span>{percentage}%</span>
    {/if}
  </div>

  <div class="bg-base-300 w-full rounded-full {sizeClasses[effectiveSize]}">
    <div
      class="{colorClasses[effectiveColor]} h-full rounded-full transition-all duration-300 ease-out"
      style="width: {percentage}%">
    </div>
  </div>
</div>
