<!--@component
# Warning Messages Component

Reusable component for displaying warning and error messages with scrolling
-->

<script lang="ts">
  export let warnings: Array<string> = [];
  export let errors: Array<string> = [];
  export let title: string = 'Warnings & Errors';
  export let height: string = 'max-h-32';
  export let showTimestamp: boolean = false;
  export let showClearButton: boolean = false;
  export let maxMessages: number = 1000; // Default to 1000 for warnings

  // Combine warnings and errors for display, limiting to maxMessages, and reverse order (latest first)
  $: allMessages = [
    ...warnings.map((msg) => ({ type: 'warning', message: msg })),
    ...errors.map((msg) => ({ type: 'error', message: msg }))
  ]
    .slice(-maxMessages)
    .reverse(); // Show only the most recent messages, latest first

  function clearMessages() {
    warnings = [];
    errors = [];
  }
</script>

<div class="p-3 rounded-lg bg-base-200 {height} overflow-y-auto">
  <div class="mb-2 flex items-center justify-between">
    <h3 class="font-semibold text-sm text-warning">{title}</h3>
    {#if showClearButton && allMessages.length > 0}
      <button class="btn btn-ghost btn-xs text-xs" on:click={clearMessages}> Clear </button>
    {/if}
  </div>

  {#if allMessages.length === 0}
    <div class="py-4 text-center text-xs text-neutral">No warnings or errors</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each allMessages as { type, message }}
        <div class="flex items-start gap-2 rounded bg-base-100 p-2">
          {#if showTimestamp}
            <span class="whitespace-nowrap text-xs text-neutral">
              {new Date().toLocaleTimeString()}
            </span>
          {/if}
          <span class="flex-1 {type === 'error' ? 'text-error' : 'text-warning'}">
            {message}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
