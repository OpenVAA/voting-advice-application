<!--
@component
Show a notification prompting the user to login instead of preregistering again.

### Properties

- Any valid properties of an `Alert` component

### Usage

```tsx
popupQueue.push({
  component: PreregisteredNotification,
});
```
-->

<svelte:options runes />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Alert } from '$lib/components/alert';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { Route } from '$lib/utils/route';
  import type { PreregisteredNotificationProps } from './PreregisteredNotification.type';

  let { ...restProps }: PreregisteredNotificationProps = $props();

  const { getRoute, t } = getAppContext();

  let alertRef: Alert;

  const title = t('candidateApp.preregister.isPreregisteredNotification.title');
  const content = t('candidateApp.preregister.isPreregisteredNotification.content');

  function handleClick(route: Route): void {
    alertRef?.closeAlert();
    goto($getRoute(route));
  }
</script>

<Alert bind:this={alertRef} {title} icon="login" {...restProps}>
  <div class="gap-md grid grid-flow-row">
    <h3>{title}</h3>
    {@html sanitizeHtml(content)}
  </div>
  {#snippet actions()}
    <Button onclick={() => handleClick('CandAppLogin')} text={t('common.login')} variant="main" class="mb-md" />
    <Button onclick={() => handleClick('CandAppForgotPassword')} text={t('candidateApp.login.forgotPassword')} />
  {/snippet}
</Alert>
