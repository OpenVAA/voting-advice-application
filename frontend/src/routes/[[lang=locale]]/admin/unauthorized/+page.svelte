<!--@component

# Admin app unauthorized page

- Shows when a user is authenticated but doesn't have admin permissions

-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../MainContent.svelte';

  const { t, getRoute } = getAppContext();
</script>

<MainContent title={$t('adminApp.login.errors.unauthorized')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji="🔒" />
  </figure>

  <div class="flex flex-col items-center gap-8 py-8 text-center">
    <h2 class="font-semibold text-xl">{$t('adminApp.error.unauthorized')}</h2>
    <div class="max-w-md space-y-4">
      <p>{$t('adminApp.error.unauthorizedDescription')}</p>
      <p>{$t('adminApp.error.unauthorizedContact')}</p>
    </div>

    <div class="mt-8 flex flex-col gap-4">
      <Button href={$getRoute('AdminHome')} text={$t('adminApp.common.home')} variant="main" />
      <Button href={$getRoute('AdminLogin')} text={$t('adminApp.login.button')} variant="normal" />
    </div>
  </div>
</MainContent>
