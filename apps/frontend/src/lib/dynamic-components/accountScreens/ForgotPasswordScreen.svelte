<!--
@component The forgot-password screen both apps render: it takes an email address and asks for a mail with which to set a new password.

- A press of the main button with an address that cannot be used sends nothing: the field says what to enter and takes focus.
- With a usable address the screen asks for a password-recovery link with the trimmed address, and opens the app's "email sent" page when the request has settled, whatever it settled as. Nothing about the address is looked up, and nothing of the request's answer is read: the screen shows the same to every visitor, whether or not the address has an account.
- The one exception is a request the function refused because the caller has made more requests than its limit admits: the screen then stays, and the field shows a sentence naming the wait, in whole minutes rounded up, and takes focus. The refusal comes before the address is read, so it says nothing about the address.
- The form is declared as a post although no server action answers it, so that a submit the screen's script did not catch could not write an address into the address bar. The main button needs the script, so it is natively disabled until the screen has mounted.
- The page's `email` search parameter fills the field once, when the screen is created, as the login screens' links pass the address typed there. Nothing is asked for until the main button is pressed.

### Properties

- `appName`: The name of the app, shown above the heading.
- `sendEntryLink`: The app's own way to ask for a mailed link, as its context's entry flow holds it.
- `emailSentHref`: The address of the app's "email sent" page.
- `returnHref`: The address of the screen's way back.
- `testId`: The test id of the screen's root.

### Usage

```tsx
<ForgotPasswordScreen
  appName={contestantAppName}
  {sendEntryLink}
  emailSentHref={getRoute.current('ContestantAppEmailSent')}
  returnHref={getRoute.current('ContestantAppLoginEmail')}
  testId="contestant-forgot-password" />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { EmailField } from '$lib/components/emailField';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { ForgotPasswordScreenProps } from './ForgotPasswordScreen.type';

  let { appName, sendEntryLink, emailSentHref, returnHref, testId }: ForgotPasswordScreenProps = $props();

  const { t } = getComponentContext();

  const formId = getUUID();

  let emailField: EmailField | undefined = $state();
  let email = $state(page.url.searchParams.get('email') ?? '');
  let emailError = $state<string>();
  let mounted = $state(false);
  let requesting = $state(false);

  onMount(() => {
    mounted = true;
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting) return;
    const address = email.trim();
    // Emptiness is asked first: the control reports an empty field as invalid too, and the two have different messages.
    if (!address || !emailField?.checkValidity()) {
      emailError = address ? t('components.input.error.invalidEmail') : t('common.account.emailRequired');
      emailField?.focus();
      return;
    }
    requesting = true;
    const retryAfterSeconds = (await sendEntryLink({ origin: 'forgotPassword', email: address }))?.retryAfterSeconds;
    if (retryAfterSeconds !== undefined) {
      requesting = false;
      emailError = t('common.account.tooManyAttempts', { minutes: Math.ceil(retryAfterSeconds / 60) });
      // The main button was natively disabled during the request, so focus is placed once the field is editable again.
      await tick();
      emailField?.focus();
      return;
    }
    try {
      await goto(emailSentHref);
    } catch (error) {
      log.error('Failed to open the "email sent" page after the request', { err: error });
    } finally {
      requesting = false;
    }
  }
</script>

<MainContent title={t('common.account.resetPassword.title')} data-testid={testId}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{appName}</PreHeading>
      <h1 tabindex="-1">{t('common.account.resetPassword.title')}</h1>
    </HeadingGroup>
  {/snippet}

  <p class="text-center">{t('common.account.resetPassword.ingress')}</p>

  <form id={formId} method="POST" novalidate onsubmit={handleSubmit} class="gap-md flex w-full flex-col">
    <EmailField
      bind:this={emailField}
      bind:value={email}
      bind:error={emailError}
      name="email"
      autocomplete="email"
      data-testid="forgot-password-email"
      errorTestId="forgot-password-email-error" />
  </form>

  {#snippet primaryActions()}
    <Button
      type="submit"
      form={formId}
      variant="main"
      text={t('common.account.resetPassword.sendLink')}
      disabled={!mounted}
      loading={requesting}
      data-testid="forgot-password-submit" />
    <Button href={returnHref} text={t('common.return')} data-testid="forgot-password-return" />
  {/snippet}
</MainContent>
