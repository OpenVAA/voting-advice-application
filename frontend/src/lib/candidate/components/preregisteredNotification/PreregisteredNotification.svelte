<!--
@component
Show a notification prompting the user to login instead of preregistering again.

### Props

- Any valid props for the `Alert` component.

### Usage

```tsx
popupQueue.push({ 
  component: PreregisteredNotification, 
});
```
-->

<script lang="ts">
  import { Alert, type AlertProps } from '$lib/components/alert';
  import { Button } from '$lib/components/button';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { getAppContext } from '$lib/contexts/app';
  import type { Route } from '$lib/utils/route';
  import { goto } from '$app/navigation';
  
  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = Partial<AlertProps>;
  
  const { getRoute, t } = getAppContext();

  let closeAlert: () => void;

  const title = $t('candidateApp.preregister.isPreregisteredNotification.title');
  const content = $t('candidateApp.preregister.isPreregisteredNotification.content');
  
  function handleClick(route: Route): void {
    closeAlert();
    goto($getRoute(route));
  }
</script>

<Alert bind:closeAlert {title} icon="login" {...$$restProps}>
  <div class="grid grid-flow-row gap-md">
    <h3>{title}</h3>
    {@html sanitizeHtml(content)}
  </div>
  <svelte:fragment slot="actions">
    <Button 
      on:click={() => handleClick('CandAppLogin')}
      text={$t('common.login')} 
      variant="main" 
      class="mb-md" />
    <Button 
      on:click={() => handleClick('CandAppForgotPassword')}
      text={$t('candidateApp.login.forgotPassword')} />
  </svelte:fragment>
</Alert>
