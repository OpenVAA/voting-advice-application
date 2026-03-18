<!--
@component
Reusable component for displaying warning and error messages with scrolling.

### Properties

- `warnings`: Array of warning messages to display. Default: `[]`
- `errors`: Array of error messages to display. Default: `[]`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<WarningMessages warnings={warningMessages} errors={errorMessages} />
```
-->

<script lang="ts">
  import { DEFAULT_MAX_MESSAGES, DEFAULT_MESSAGES_HEIGHT } from '$lib/admin/components/jobs/shared';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { WarningMessagesProps } from './WarningMessages.type';

  type $$Props = WarningMessagesProps;

  export let warnings: $$Props['warnings'] = [];
  export let errors: $$Props['errors'] = [];

  const { t } = getAdminContext();

  // Combine warnings and errors for display, limiting to maxMessages, and reverse order (latest first)
  $: allMessages = [...(warnings ?? []), ...(errors ?? [])].slice(-DEFAULT_MAX_MESSAGES).reverse();
</script>

<div class="bg-base-200 rounded-lg p-3 {DEFAULT_MESSAGES_HEIGHT} overflow-y-auto">
  <h3 class="text-warning mb-2 text-sm font-semibold">{t('adminApp.jobs.warningsAndErrors')}</h3>

  {#if allMessages.length === 0}
    <div class="text-neutral py-4 text-center text-xs">{t('adminApp.jobs.noWarningsOrErrors')}</div>
  {:else}
    <div class="space-y-1 text-xs">
      {#each allMessages as message}
        <div class="bg-base-100 flex items-start gap-2 rounded p-2">
          <span class="text-neutral text-xs whitespace-nowrap">
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
