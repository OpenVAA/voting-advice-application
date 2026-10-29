<!--
@component The view shown in place of a page when the data of the signed-in user could not be read: the error message, a sentence saying that the user is still signed in, a button that tries again, the support block and logout. Trying again reruns every load of the page, and the user stays signed in throughout.

The view shows nothing of the failure itself: the load that met it logs it. It builds no route into the pages of an entity, so it can be rendered on a page whose URL names none.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `title`: The error message the view is headed with. Default: `t('error.default')`
- Any valid attributes of a `<div>` element.

### Accessibility

- While the loads rerun, the Try again button shows that it is loading and cannot be pressed again. When the rerun ends with the view still shown, focus is given back to the button if it was lost.

### Usage

```tsx
<ReadFailure />
<ReadFailure class="bg-base-300" />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { LogoutButton } from '$contestant/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { concatClass } from '$lib/utils/components';
  import type { ReadFailureProps } from './ReadFailure.type';

  let { title, ...restProps }: ReadFailureProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Only the stable `t` is read from the context; the support block and logout read the reactive accessors themselves.
  const { t } = getContestantContext();

  ////////////////////////////////////////////////////////////////////
  // Try again
  ////////////////////////////////////////////////////////////////////

  /** Whether a rerun of the loads is in flight. */
  let retrying = $state(false);

  /** Rerun every load of the page. A rerun that fails is logged, and the view stays usable. */
  async function tryAgain(): Promise<void> {
    if (retrying) return;
    const focused = document.activeElement;
    retrying = true;
    try {
      await invalidateAll();
    } catch (error) {
      log.error('Failed to rerun the loads after a read failure', { err: error });
    } finally {
      retrying = false;
    }
    await tick();
    if (focused instanceof HTMLElement && focused.isConnected && document.activeElement === document.body)
      focused.focus();
  }
</script>

<div
  data-testid="contestant-read-failure"
  {...concatClass(restProps, 'gap-lg pb-safelgb pl-safelgl pr-safelgr flex h-full w-full flex-col items-center')}>
  <ErrorMessage message={title} class="h-auto" />
  <p class="text-center">{t('contestantApp.error.readFailed.content')}</p>
  <Button
    onclick={tryAgain}
    loading={retrying}
    variant="main"
    icon={null}
    text={t('contestantApp.error.readFailed.tryAgain')}
    data-testid="contestant-read-failure-try-again" />
  <ContactSupport variant="normal" />
  <LogoutButton data-testid="contestant-read-failure-logout" />
</div>
