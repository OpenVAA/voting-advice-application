<!--
@component
Show a notification popup to the user.

### Properties

- `data`: The data for the notification to show.
- Any valid properties of an `<Alert>` component.

### Usage

```tsx
<Notification data={$appSettings.notifications.voterApp}/>
```
-->

<script lang="ts">
  import { Alert } from '$lib/components/alert';
  import { Button } from '$lib/components/button';
  import { ICONS } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { IconName } from '$lib/components/icon';
  import type { NotificationProps } from './Notification.type';

  let { data, ...restProps }: NotificationProps = $props();

  const { t, translate } = getComponentContext();

  let alertRef: Alert;

  let title = $derived(translate(data.title));
  let content = $derived(translate(data.content));
  let icon: IconName = $derived((data.icon && data.icon in ICONS ? data.icon : 'important') as IconName);
</script>

<Alert bind:this={alertRef} {title} {icon} {...restProps}>
  <div class="gap-md grid grid-flow-row">
    <h3>{title}</h3>
    {@html sanitizeHtml(content)}
  </div>
  {#snippet actions()}
    <Button variant="main" text={t('common.close')} onclick={() => alertRef?.closeAlert()} />
  {/snippet}
</Alert>
