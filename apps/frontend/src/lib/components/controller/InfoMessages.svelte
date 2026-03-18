<!--
@component
Reusable component for displaying informational messages with scrolling.

### Properties

- `messages`: Array of informational messages to display. Default: `[]`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<InfoMessages messages={jobMessages} />
```
-->

<script lang="ts">
  import { DEFAULT_MAX_MESSAGES, DEFAULT_MESSAGES_HEIGHT } from '$lib/admin/components/jobs/shared';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { InfoMessagesProps } from './InfoMessages.type';

  type $$Props = InfoMessagesProps;

  export let messages: $$Props['messages'] = undefined;

  const { t } = getAdminContext();

  // Get the most recent messages and reverse order (latest first)
  $: displayMessages = messages?.slice(-DEFAULT_MAX_MESSAGES).reverse() ?? [];
</script>

<div class="bg-base-200 rounded-lg p-3 {DEFAULT_MESSAGES_HEIGHT} overflow-y-auto">
  <h3 class="text-info mb-2 text-sm font-semibold">{t('adminApp.jobs.infoMessages')}</h3>

  {#if displayMessages.length === 0}
    <div class="text-neutral py-4 text-center text-xs">{t('adminApp.jobs.noInfoMessages')}</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each displayMessages as message}
        <div class="bg-base-100 flex items-start gap-2 rounded p-2">
          <span class="text-neutral text-xs whitespace-nowrap">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <span class="flex-1">{message.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
