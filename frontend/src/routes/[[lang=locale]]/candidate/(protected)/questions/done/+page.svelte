<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import Button from '$lib/components/button/Button.svelte';
</script>

<BasicPage title={$t('candidateApp.allDataFilled.title')}>
  <div class="text-center">
    <p>{$t('candidateApp.allDataFilled.description')}</p>
    <p>{$t('candidateApp.allDataFilled.tip')}</p>
  </div>

  <svelte:fragment slot="primaryActions">
    <LogoutButton variantIcon={false} />
    <Button
      text={$t('candidateApp.allDataFilled.previewYourProfile')}
      href={getRoute(Route.CandAppPreview)} />
    <Button
      text={$t('candidateApp.allDataFilled.editYourOpinions')}
      href={getRoute(Route.CandAppSummary)} />
  </svelte:fragment>
</BasicPage>
