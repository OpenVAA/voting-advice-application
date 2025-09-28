<!--@component
# Warning Messages Component

Reusable component for displaying warning and error messages with scrolling
-->

<script lang="ts">
  import { DEFAULT_MAX_MESSAGES, DEFAULT_MESSAGES_HEIGHT } from '$lib/admin/components/jobs/shared';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { JobMessage } from '$lib/server/admin/jobs/jobStore.type';

  const { t } = getAdminContext();

  export let warnings: Array<JobMessage> = [];
  export let errors: Array<JobMessage> = [];
  export let messagesHeight: string = 'max-h-32';
  export let maxMessages: number = 1000; // Default to 1000 for warnings

  // Combine warnings and errors for display, limiting to maxMessages, and reverse order (latest first)
  $: allMessages = [...warnings, ...errors].slice(-maxMessages).reverse(); // Show only the most recent messages, latest first
</script>

<div class="p-3 rounded-lg bg-base-200 {messagesHeight} overflow-y-auto">
  <h3 class="font-semibold mb-2 text-sm text-warning">{$t('adminApp.jobs.warningsAndErrors')}</h3>

  {#if allMessages.length === 0}
    <div class="py-4 text-center text-xs text-neutral">{$t('adminApp.jobs.noWarningsOrErrors')}</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each allMessages as message}
        <div class="flex items-start gap-2 rounded bg-base-100 p-2">
          <span class="whitespace-nowrap text-xs text-neutral">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <span class="flex-1 {message.type === 'error' ? 'text-error' : 'text-warning'}">
            {message.message}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
