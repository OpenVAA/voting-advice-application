<script lang="ts">
  import {t} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {type CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';

  const {userStore} = getContext<CandidateContext>('candidate');
  const user = get(userStore);
  const userName = user?.candidate?.firstName;
</script>

<!--Homepage for the user-->

<BasicPage title={$t('candidateApp.homePage.greeting', {userName})}>
  <p class="max-w-md text-center">
    {$t('candidateApp.homePage.explanation')}
  </p>
  <Button
    variant="main"
    slot="primaryActions"
    text={$t('candidateApp.homePage.buttonText')}
    icon="next"
    href={$getRoute(Route.CandAppProfile)} />
</BasicPage>
