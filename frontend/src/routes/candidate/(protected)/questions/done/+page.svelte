<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateAppRoute} from '$lib/utils/routes';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import Button from '$lib/components/button/Button.svelte';
</script>

<BasicPage title={$_('candidateApp.allDataFilled.title')}>
  <div class="text-center">
    <p>{$_('candidateApp.allDataFilled.description')}</p>
    <p>{$_('candidateApp.allDataFilled.tip')}</p>
  </div>

  <svelte:fragment slot="primaryActions">
    <LogoutButton variantIcon={false} />
    <Button
      text={$_('candidateApp.allDataFilled.previewYourProfile')}
      href={`${candidateAppRoute}/preview`} />
    <Button
      text={$_('candidateApp.allDataFilled.editYourOpinions')}
      href={`${candidateAppRoute}/questions/summary`} />
  </svelte:fragment>
</BasicPage>
