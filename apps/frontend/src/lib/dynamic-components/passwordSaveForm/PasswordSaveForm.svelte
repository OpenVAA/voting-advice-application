<!--
@component The view in which a signed-in user saves a new password: the address of the account, the password form, a failure alert, a button for saving and one other action beside it. What follows a save, and the heading and the other action, are the caller's.

- It asks for no current password.
- The address of the account is shown as text and handed to the password form, where a password manager reads it beside the new password.
- A saved password runs `afterSave`. A failed save is reported as an alert, and the form stays with what was typed.

### Dynamic component

Accesses the component context for its translations, and nothing of any app's context: the app's functions and the address come in as props.

### Properties

- `title`: The page's title, and its first-level heading unless `heading` is given.
- `heading`: Optional content for the title block.
- `children`: Optional content shown above the address of the account.
- `email`: The address of the signed-in account. When it is empty or absent, the label and the address are left out together.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `afterSave`: Run once a password has been saved, and awaited. A rejection is logged.
- `onShadedBg`: Whether the page behind the form is shaded. @default false
- `testId`: The test id of the view's root.
- `emailTestId`: The test id of the shown address.
- `errorTestId`: The test id of the alert shown when a save fails.
- `secondaryAction`: The action beside the main button.
- `status`: Bindable: where a save stands, `'idle'`, `'saving'` or `'failed'`. @default 'idle'
- Any valid properties of a `MainContent` component, such as a `data-` attribute on the root.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with the label.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until `afterSave` settles. A press with a password the form does not accept saves nothing, and the field says why.
- A failed save is announced as an alert, and focus stays on the control that had it.

### Usage

```tsx
<PasswordSaveForm
  title={t('contestantApp.setPassword.title')}
  {email}
  {setPassword}
  afterSave={invalidateAll}
  testId="contestant-set-password-gate"
  emailTestId="set-password-email"
  errorTestId="set-password-error"
  bind:status
  data-set-password-state={status}>
  {#snippet secondaryAction()}
    <LogoutButton {logout} icon={undefined} />
  {/snippet}
</PasswordSaveForm>
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { MainContent } from '$layouts/main';
  import { AccountAddress } from '$lib/components/accountAddress';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { PasswordSetter } from '$lib/components/passwordSetter';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { PasswordSaveFormProps } from './PasswordSaveForm.type';

  let {
    title,
    heading,
    children,
    email,
    setPassword,
    afterSave,
    onShadedBg = false,
    testId,
    emailTestId,
    errorTestId,
    secondaryAction,
    status = $bindable('idle'),
    ...restProps
  }: PasswordSaveFormProps = $props();

  const { t } = getComponentContext();

  const formId = getUUID();

  let setter: PasswordSetter | undefined = $state();
  let password = $state('');
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (status === 'saving') return;
    status = 'idle';
    if (!setter?.validate()) return;
    // The main button is natively disabled while the save runs, and a browser may drop the focus of a button that becomes disabled.
    const focused = document.activeElement;
    status = 'saving';
    try {
      const result = await setPassword({ password });
      if (result?.type !== 'success') throw new Error('The password was not saved.');
    } catch (error) {
      log.error('Failed to save the password', { err: error });
      status = 'failed';
      await tick();
      if (focused instanceof HTMLElement && document.activeElement === document.body) focused.focus();
      return;
    }
    // Awaited so that the main button keeps its saving state until what follows the save has settled.
    try {
      await afterSave();
    } catch (error) {
      log.error('Failed to complete the step after the password was saved', { err: error });
    }
    status = 'idle';
  }
</script>

<MainContent {title} {heading} data-testid={testId} {...restProps}>
  {@render children?.()}

  {#if email}
    <AccountAddress label={t('contestantApp.nothingToEdit.signedInAs')} address={email} data-testid={emailTestId} />
  {/if}

  <PasswordSetter id={formId} username={email} bind:password bind:this={setter} {onShadedBg} onsubmit={handleSubmit} />

  {#if status === 'failed'}
    <ErrorMessage
      inline
      role="alert"
      class="my-md"
      message={t('contestantApp.setPassword.error')}
      data-testid={errorTestId} />
  {/if}

  {#snippet primaryActions()}
    <Button
      type="submit"
      form={formId}
      variant="main"
      text={t('contestantApp.setPassword.setPassword')}
      disabled={!mounted}
      loading={status === 'saving'}
      loadingText={t('common.saving')}
      data-testid="set-password-submit" />
    {@render secondaryAction()}
  {/snippet}
</MainContent>
