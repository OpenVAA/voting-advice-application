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
  <NavItem href={$getRoute(Route.Home)} icon="home" text={$t('common.home')} />
</VoterNav>
```
-->

<Navigation slot="nav" on:keyboardFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href={$getRoute(Route.Home)} icon="home" text={$t('common.home')} />
    <NavItem href={$getRoute(Route.Questions)} icon="opinion" text={$t('questions.title')} />
    <NavItem
      disabled={!$answeredQuestions || Object.values($answeredQuestions).length === 0}
      on:click={() => resetVoterAnswers()}
      icon="close"
      text={$t('common.resetAnswers')} />
    <NavItem
      href={$getRoute(Route.Results)}
      icon="results"
      text={resultsAvailableSync ? $t('results.title.results') : $t('results.title.browse')} />
  </NavGroup>
  <NavGroup>
    <NavItem href={$getRoute(Route.Info)} icon="election" text={$t('info.title')} />
    <NavItem href={$getRoute(Route.About)} icon="info" text={$t('about.title')} />
    <NavItem href={$getRoute(Route.Privacy)} icon="privacy" text={$t('privacy.title')} />
  </NavGroup>
  {#if $settings.analytics.survey?.showIn?.includes('navigation') || $openFeedbackModal}
    <NavGroup>
      {#if $settings.analytics.survey?.showIn?.includes('navigation')}
        <NavItem
          href={$surveyLink}
          target="_blank"
          icon="research"
          text={$t('dynamic.survey.button')} />
      {/if}
      {#if $openFeedbackModal}
        <NavItem on:click={$openFeedbackModal} icon="feedback" text={$t('feedback.send')} />
      {/if}
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
