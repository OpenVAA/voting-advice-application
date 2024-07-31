<script lang="ts">
  import {t} from '$lib/i18n';
  import {surveyLink} from '$lib/utils/analytics/survey';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {
    answeredQuestions,
    openFeedbackModal,
    resetVoterAnswers,
    resultsAvailable,
    settings
  } from '$lib/stores';
  import {Navigation, NavGroup, NavItem} from '$lib/components/navigation';
  import LanguageSelection from './LanguageSelection.svelte';

  let resultsAvailableSync = false;
  $: $resultsAvailable.then((v) => (resultsAvailableSync = v));
</script>

<!--
@component
A template part that outputs the navigation menu for the Voter App for use in the 
`Page` template.

### Slots

- default: Any elements to insert at the beginning of the navigation menu, in most
  cases the close button for the navigation menu. Use `NavItem` for this with an 
  `on:click` handler for that.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<VoterNav>
  <NavItem href={$getRoute(Route.Home)} icon="home" text={$t('actionLabels.home')} />
</VoterNav>
```
-->

<Navigation slot="nav" on:keyboardFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href={$getRoute(Route.Home)} icon="home" text={$t('actionLabels.home')} />
    <NavItem href={$getRoute(Route.Questions)} icon="opinion" text={$t('actionLabels.opinions')} />
    <NavItem
      disabled={!$answeredQuestions || Object.values($answeredQuestions).length === 0}
      on:click={() => resetVoterAnswers()}
      icon="close"
      text={$t('navigation.resetAnswers')} />
    <NavItem
      href={$getRoute(Route.Results)}
      icon="results"
      text={resultsAvailableSync ? $t('navigation.results') : $t('navigation.browseEntities')} />
  </NavGroup>
  <NavGroup>
    <NavItem href={$getRoute(Route.Info)} icon="election" text={$t('actionLabels.electionInfo')} />
    <NavItem href={$getRoute(Route.About)} icon="info" text={$t('actionLabels.howItWorks')} />
    <NavItem href={$getRoute(Route.Privacy)} icon="privacy" text={$t('privacy.title')} />
  </NavGroup>
  {#if $settings.analytics.survey?.showIn?.includes('navigation') || $openFeedbackModal}
    <NavGroup>
      {#if $settings.analytics.survey?.showIn?.includes('navigation')}
        <NavItem href={$surveyLink} target="_blank" icon="research" text={$t('survey.button')} />
      {/if}
      {#if $openFeedbackModal}
        <NavItem
          on:click={$openFeedbackModal}
          icon="feedback"
          text={$t('navigation.sendFeedback')} />
      {/if}
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
