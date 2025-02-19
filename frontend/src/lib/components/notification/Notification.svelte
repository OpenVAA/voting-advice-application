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
  import { type IconName, ICONS } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { NotificationProps } from './Notification.type';

  type $$Props = NotificationProps;

  export let data: $$Props['data'];

  const { t, translate } = getComponentContext();

  let title: string;
  let content: string;
  let icon: IconName;
  let closeAlert: () => void;

  $: {
    title = translate(data.title);
    content = translate(data.content);
    icon = (data.icon && data.icon in ICONS ? data.icon : 'important') as IconName;
  }
</script>

<Alert bind:closeAlert {title} {icon} {...$$restProps}>
  <div class="grid grid-flow-row gap-md">
    <h3>{title}</h3>
    {@html sanitizeHtml(content)}
  </div>
  <Button slot="actions" variant="main" text={$t('common.close')} on:click={closeAlert} />
</Alert>
