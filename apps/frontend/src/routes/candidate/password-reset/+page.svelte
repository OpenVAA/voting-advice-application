<!--@component

# Candidate app reset password page

Shows a form with which to set a new password when it has been reset.

## Query params

- `code`: The reset code
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // isAuthenticated is reactive; access via candCtx.X.
  // (This page evaluates isSessionFlow once at component init, so the original destructure was effectively safe — but switching to candCtx.X future-proofs any later code that re-reads isSessionFlow inside an effect/derived.)
  const candCtx = getCandidateContext();
  const { getRoute, resetPassword, setPassword, t } = candCtx;
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Handle form
  ////////////////////////////////////////////////////////////////////

  const code = page.url.searchParams.get('code');
  // Session-based flow: user arrived via auth callback with verifyOtp (recovery type)
  const isSessionFlow = candCtx.isAuthenticated && !code;

  // Redirect to login only if neither code nor session is available
  if (!code && !isSessionFlow) goto(getRoute.current('CandAppLogin'));

  let isPasswordValid = $state(false);
  let password = $state('');
  let status = $state<ActionStatus>('idle');
  let validationError = $state<string | undefined>(undefined);

  let canSubmit = $derived(status !== 'loading' && isPasswordValid);
  let submitLabel = $derived(validationError || t('candidateApp.setPassword.setPassword'));

  async function handleSubmit() {
    if (!canSubmit) {
      log.debug('HandleSubmit called when canSubmit is false');
      return undefined;
    }

    status = 'loading';

    if (isSessionFlow) {
      // Session-based flow: user already has a session from verifyOtp, just set the password
      const result = await setPassword({ password }).catch((e) => {
        log.error(`Error with setPassword: ${e?.message}`);
        return undefined;
      });

      if (result?.type !== 'success') {
        status = 'error';
        return;
      }

      status = 'success';
      // User is already authenticated — navigate to candidate home via full page load to ensure session cookies are sent to the server-side loader.
      window.location.href = getRoute.current('CandAppHome');
    } else {
      // Code-based flow: use resetPassword with the code
      const result = await resetPassword({ code: code!, password }).catch((e) => {
        log.error(`Error with resetPassword: ${e?.message}`);
        return undefined;
      });

      if (result?.type !== 'success') {
        status = 'error';
        return;
      }

      status = 'success';
      await goto(getRoute.current('CandAppLogin'));
    }
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={t('candidateApp.resetPassword.createNewPassword')}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{t('dynamic.candidateAppName')}</PreHeading>
      <h1>{t('candidateApp.resetPassword.createNewPassword')}</h1>
    </HeadingGroup>
  {/snippet}
  <div class="flex-nowarp flex flex-col items-center">
    <!-- bind: keep — PasswordSetter.password is $bindable(''). Validity and the error message are derived inside the component and arrive through onValidityChange, so neither is bindable. -->
    <PasswordSetter
      bind:password
      onValidityChange={({ valid, errorMessage }) => {
        isPasswordValid = valid;
        validationError = errorMessage;
      }} />
    {#if status === 'error'}
      <ErrorMessage
        inline
        message={t('candidateApp.resetPassword.failed')}
        class="mb-lg mt-md"
        data-testid="password-reset-error" />
    {/if}
    <Button
      onclick={handleSubmit}
      disabled={!canSubmit}
      variant="main"
      text={submitLabel}
      data-testid="set-password-submit" />
    <Button
      href={getRoute.current('CandAppHelp')}
      text={t('candidateApp.common.contactSupport')}
      data-testid="password-reset-help-link" />
  </div>
</MainContent>
