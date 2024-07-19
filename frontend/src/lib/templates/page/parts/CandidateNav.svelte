<script lang="ts">
  import {Navigation, NavGroup, NavItem} from '$lib/components/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {t} from '$lib/i18n';
  import {InfoBadge} from '$lib/components/infoBadge';
  import {getContext} from 'svelte';
  import LanguageSelection from './LanguageSelection.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {unansweredRequiredInfoQuestions} = getContext<CandidateContext>('candidate') ?? {};
</script>

<!--
@component
A template part that outputs the navigation menu for the Candidate App for use in the 
`Page` template.

### Slots

- default: Any elements to insert at the beginning of the navigation menu, in most
  cases the close button for the navigation menu. Use `NavItem` for this with an 
  `on:click` handler for that.

### Usage

```tsx
<CandidateNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close"/>
</CandidateNav>
```
-->

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <slot />
  <NavGroup>
    <NavItem
      href={$getRoute(Route.CandAppHome)}
      icon="home"
      text={$t('candidateApp.navbar.start')} />
    <NavItem
      href={$getRoute(Route.CandAppProfile)}
      icon="profile"
      text={$t('candidateApp.navbar.basicInfo')} />
    <NavItem
      href={$getRoute(Route.CandAppQuestions)}
      icon="opinion"
      text={$t('candidateApp.navbar.yourOpinions')}
      disabled={$unansweredRequiredInfoQuestions?.length !== 0}>
      {#if $unansweredRequiredInfoQuestions && $unansweredRequiredInfoQuestions.length > 0}
        <InfoBadge
          text={String($unansweredRequiredInfoQuestions.length)}
          disabled={$unansweredRequiredInfoQuestions.length !== 0}
          classes="-left-8 -top-4" />
      {/if}
    </NavItem>
    <NavItem
      href={$getRoute(Route.CandAppSettings)}
      icon="settings"
      text={$t('candidateApp.navbar.settings')} />
    <NavItem
      href={$getRoute(Route.CandAppPreview)}
      icon="previewProfile"
      text={$t('candidateApp.navbar.preview')} />
    <NavItem
      href={$getRoute(Route.CandAppHelp)}
      icon="help"
      text={$t('candidateApp.navbar.help')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={$getRoute(Route.CandAppInfo)}
      icon="info"
      disabled
      text={$t('candidateApp.navbar.electionInformation')} />
    <NavItem
      href={$getRoute(Route.CandAppFAQ)}
      icon="info"
      disabled
      text={$t('candidateApp.navbar.useInformation')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={$getRoute(Route.CandAppFeedback)}
      icon="feedback"
      disabled
      text={$t('candidateApp.navbar.feedback')} />
  </NavGroup>
  <LanguageSelection />
</Navigation>
