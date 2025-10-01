<!--@component
# Progress Bar Component

Reusable progress bar component for displaying task progress
-->

<script lang="ts">
  export let progress: number; // Value between 0 and 1
  export let label: string = 'Progress';
  export let showPercentage: boolean = true;
  export let color: 'primary' | 'secondary' | 'accent' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';

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
