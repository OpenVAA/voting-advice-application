<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getContext } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { customization, settings } from '$lib/legacy-stores';
  import { Footer } from '$lib/templates/parts/footer';
  import { darkMode } from '$lib/utils/legacy-darkMode';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  let loading = false;

  const redirectTo = $page.url.searchParams.get('redirectTo');

  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($customization.candPoster?.urlDark ?? $customization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($customization.candPoster?.url ?? '/images/hero-candidate.png')
  });

  const { newUserEmail } = getContext<CandidateContext>('candidate');

  let email = '';
  let wrongCredentials = false;
  let showPasswordSetMessage = false;

  if ($newUserEmail != null) {
    email = $newUserEmail;
    showPasswordSetMessage = true;
    $newUserEmail = null;
  }
</script>

<Layout title={$t('candidateApp.login.title')}>
  <HeadingGroup slot="heading">
    <h1>{$t('dynamic.appName')}</h1>
  </HeadingGroup>

  <form
    class="flex flex-col flex-nowrap items-center"
    method="POST"
    action="login"
    use:enhance={() => {
      loading = true;
      return async ({ update, result }) => {
        await update;
        loading = false;
        if (result.type === 'failure') {
          wrongCredentials = true;
        } else {
          await applyAction(result);
        }
      };
    }}>
    {#if showPasswordSetMessage}
      <p class="max-w-md text-center text-2xl font-bold">
        {$t('candidateApp.setPassword.passwordSetSuccesfully')}
      </p>
    {/if}
    <p class="max-w-md text-center">
      {$t('candidateApp.login.enterEmailAndPassword')}
    </p>
    <label for="email" class="hidden">{$t('candidateApp.common.email')}</label>
    <input hidden name="redirectTo" value={redirectTo} />
    <input
      type="email"
      name="email"
      id="email"
      bind:value={email}
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField autocomplete="current-password" id="password" />
    </div>
    {#if wrongCredentials}
      <p class="text-center text-error">{$t('candidateApp.login.wrongEmailOrPassword')}</p>
    {/if}
    <!-- TODO: Adapt a button with a loading indicator once the form is submitted -->
    <Button type="submit" disabled={loading} text={$t('common.login')} variant="main" />
    <Button href={$getRoute(ROUTE.CandAppForgotPassword)} text={$t('candidateApp.login.forgotPassword')} />
    <Button href="mailto:{$settings.admin.email}" text={$t('candidateApp.common.contactSupport')} />
    <Button href={$getRoute(ROUTE.Home)} text={$t('candidateApp.common.voterApp')} />
  </form>

  <Footer />
</Layout>
