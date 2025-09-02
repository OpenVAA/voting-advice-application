<!--@component
# Info Messages Component

Reusable component for displaying informational messages with scrolling
-->

<script lang="ts">
  import type { JobMessage } from '$lib/server/admin/jobs/jobStore.type';
  import { getAdminContext } from '$lib/contexts/admin';

  const { t } = getAdminContext();

  export let messages: Array<JobMessage> = [];
  export let maxMessages: number = 10;
  export let messagesHeight: string = 'max-h-32';

  // Get the most recent messages and reverse order (latest first)
  $: displayMessages = messages.slice(-maxMessages).reverse();
</script>

<div class="p-3 rounded-lg bg-base-200 {messagesHeight} overflow-y-auto">
  <h3 class="font-semibold mb-2 text-sm text-info">{$t('adminApp.jobs.infoMessages')}</h3>

  {#if displayMessages.length === 0}
    <div class="py-4 text-center text-xs text-neutral">{$t('adminApp.jobs.noInfoMessages')}</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each displayMessages as message}
        <div class="flex items-start gap-2 rounded bg-base-100 p-2">
          <span class="whitespace-nowrap text-xs text-neutral">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <span class="flex-1">{message.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
