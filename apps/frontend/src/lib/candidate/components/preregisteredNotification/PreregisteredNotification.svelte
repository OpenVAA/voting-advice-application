<!--
@component Show a notification prompting the user to login instead of preregistering again.

### Properties

- Any valid properties of an `Alert` component

### Usage

```tsx
popupQueue.push({
  component: PreregisteredNotification,
});
```
-->

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

  // RESOLVE THE URL BEFORE CLOSING, then navigate. The order is the fix, not a style preference.
  //
  // `closeAlert()` calls the `onClose` the root layout passes in, and that handler is `popupQueue.shift()` -- which drops this item from the queue and so UNMOUNTS this component, synchronously, from inside its own click handler. The previous body read `getRoute.current(route)` AFTER that call, i.e. it read a context accessor on a component Svelte had already destroyed, and then called `goto` from it. The URL changed while the page behind it did not re-render.
  //
  // Reading the href first means the navigation target is a plain string owned by this closure by the time anything unmounts, so neither the read nor the `goto` depends on this component still being alive.
  function handleClick(route: Route): void {
    alertRef?.closeAlert();
    goto(getRoute.current(route));
  }
</script>

<!-- bind: keep — single ref alertRef read in handleClick (Svelte 5 discussion #15979) -->
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
