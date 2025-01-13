<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { checkRegistrationKey } from '$lib/legacy-api/candidate';
  import { customization } from '$lib/legacy-stores';
  import { darkMode } from '$lib/utils/legacy-darkMode';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  let username = '';
  let email = '';
  let validRegistrationCode = false;
  let loading = false;

  $: registrationCode = $page.url.searchParams.get('registrationCode');

  $: if (registrationCode) {
    loading = true;
    checkRegistrationKey(registrationCode)
      .then(async (response) => {
        if (response.ok) {
          validRegistrationCode = true;
          const data = await response.json();
          username = data.candidate.firstName;
          email = data.candidate.email;
          await goto(
            $getRoute({
              route: ROUTE.CandAppSetPassword,
              params: {
                registrationCode,
                username,
                email
              }
            })
          );
        } else {
          validRegistrationCode = false;
          username = '';
          email = '';
        }
      })
      .finally(async () => {
        loading = false;
      });
  }

  const { user } = getContext<CandidateContext>('candidate');

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($customization.candPoster?.urlDark ?? $customization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($customization.candPoster?.url ?? '/images/hero-candidate.png')
  });

  $: registrationCodeInput = registrationCode;

  async function onRegistration() {
    if (registrationCodeInput) {
      await goto($getRoute({ route: ROUTE.CandAppRegister, params: { registrationCode: registrationCodeInput } }));
    }
  }
</script>

<Layout title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onRegistration}>
    <p class="max-w-md text-center">
      {$t('candidateApp.register.enterCode')}
    </p>
    {#if $user}
      <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton buttonVariant="main" stayOnPage={true} />
      </div>
    {/if}
    <input
      type="text"
      name="registration-code"
      id="registration-code"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.register.codePlaceholder')}
      bind:value={registrationCodeInput}
      aria-label={$t('candidateApp.register.code')}
      required />
    {#if registrationCode && !loading && !validRegistrationCode}
      <p class="text-center text-error">
        {$t('candidateApp.register.wrongRegistrationCode')}
      </p>
    {/if}
    <Button type="submit" text={$t('candidateApp.register.register')} variant="main" />
    <Button href={$getRoute(ROUTE.CandAppHelp)} text={$t('candidateApp.common.contactSupport')} />
    <Button href={$getRoute(ROUTE.Home)} text={$t('candidateApp.common.voterApp')} />
  </form>
</Layout>
