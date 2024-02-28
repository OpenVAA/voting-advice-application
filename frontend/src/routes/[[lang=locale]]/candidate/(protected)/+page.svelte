<script lang="ts">
  import {t} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {get} from 'svelte/store';
  import {authContext} from '$lib/utils/authenticationStore';
  let userName = get(authContext.user)?.candidate?.firstName;
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
    href={getRoute(Route.Questions)} />
</BasicPage>
