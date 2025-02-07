<!--
@component
A template part that outputs the navigation menu for the Voter App for use in the 
`Page` template.

### Dynamic component

This is a dynamic component because it accesse the `VoterContext`.

### Import

### Slots

- default: Any elements to insert at the beginning of the navigation menu, in most
  cases the close button for the navigation menu. Use `NavItem` for this with an 
  `on:click` handler for that.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<VoterNav>
  <NavItem href={$getRoute('Home')} icon="home" text={$t('common.home')} />
</VoterNav>
```
-->

<script lang="ts">
  import { getVoterContext } from '$lib/contexts/voter';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { openFeedbackModal } from '$lib/legacy-stores';
  import { surveyLink } from '$lib/utils/legacy-analytics/survey';
  import LanguageSelection from './LanguageSelection.svelte';

  const {
    answers,
    appSettings,
    constituenciesSelectable,
    electionsSelectable,
    getRoute,
    resultsAvailable,
    selectedElections: elections,
    selectedConstituencies: constituencies,
    selectedQuestionBlocks,
    t
  } = getVoterContext();
</script>

<Navigation on:keyboardFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem href={$getRoute('Home')} icon="home" text={$t('common.home')} />
    {#if $electionsSelectable}
      <NavItem href={$getRoute('Elections')} icon="election" text={$t('elections.title')} />
    {/if}
    {#if $constituenciesSelectable}
      <NavItem
        disabled={!$elections.length}
        href={$getRoute('Constituencies')}
        icon="constituency"
        text={$t('constituencies.title')} />
    {/if}
    <NavItem
      disabled={!($elections.length && $constituencies.length)}
      href={$getRoute('Questions')}
      icon="opinion"
      text={$t('questions.title')} />
    <NavItem
      disabled={!($elections.length && $constituencies.length)}
      href={$getRoute('Results')}
      icon="results"
      text={$resultsAvailable ? $t('results.title.results') : $t('results.title.browse')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      disabled={Object.values($answers).length === 0}
      on:click={() => answers.reset()}
      icon="close"
      text={$t('common.resetAnswers')} />
    <NavItem
      disabled={$selectedQuestionBlocks.shownQuestionIds.length === 0}
      on:click={() => $selectedQuestionBlocks.resetShownQuestionIds()}
      icon="close"
      text={'reset shown questions'} />
  </NavGroup>
  <NavGroup>
    <NavItem href={$getRoute('Info')} icon="election" text={$t('info.title')} />
    <NavItem href={$getRoute('About')} icon="info" text={$t('about.title')} />
    <NavItem href={$getRoute('Privacy')} icon="privacy" text={$t('privacy.title')} />
  </NavGroup>
  {#if $appSettings.survey?.showIn?.includes('navigation') || $openFeedbackModal}
    <NavGroup>
      {#if $appSettings.survey?.showIn?.includes('navigation')}
        <NavItem href={$surveyLink} target="_blank" icon="research" text={$t('dynamic.survey.button')} />
      {/if}
      {#if $openFeedbackModal}
        <NavItem on:click={$openFeedbackModal} icon="feedback" text={$t('feedback.send')} />
      {/if}
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
