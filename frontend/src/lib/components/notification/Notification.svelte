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
  import { getComponentContext } from '$lib/contexts/component';
  import type { IconName } from '../icon';
  import type { NotificationProps } from './Notification.type';
  import { ICONS } from '../icon/icons';
  import { Button } from '$lib/components/button';
  import { sanitizeHtml } from '$lib/utils/sanitize';

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
    icon = (data.icon && data.icon in ICONS) ? data.icon : 'important';
  }
</script>

<Alert bind:closeAlert {title} {icon} {...$$restProps}>
  <div class="grid grid-flow-row sm:grid-flow-col">
    <h3>{title}</h3>
    {@html sanitizeHtml(content)}
  </div>
  <Button 
    slot="actions"
    variant="main"
    text={$t('common.close')} 
    on:click={closeAlert} />
</Alert>
