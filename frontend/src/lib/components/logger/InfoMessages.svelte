<!--@component
# Info Messages Component

Reusable component for displaying informational messages with scrolling
-->

<script lang="ts">
  export let messages: Array<string> = [];
  export let maxMessages: number = 10;
  export let title: string = 'Info Messages';
  export let height: string = 'max-h-32';
  export let showTimestamp: boolean = false;

  // Get the most recent messages and reverse order (latest first)
  $: displayMessages = messages.slice(-maxMessages).reverse();
</script>

<div class="p-3 rounded-lg bg-base-200 {height} overflow-y-auto">
  <h3 class="font-semibold mb-2 text-sm text-info">{title}</h3>

  {#if displayMessages.length === 0}
    <div class="py-4 text-center text-xs text-neutral">No info messages</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each displayMessages as message}
        <div class="flex items-start gap-2 rounded bg-base-100 p-2">
          {#if showTimestamp}
            <span class="whitespace-nowrap text-xs text-neutral">
              {new Date().toLocaleTimeString()}
            </span>
          {/if}
          <span class="flex-1">{message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
