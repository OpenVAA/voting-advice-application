<script lang="ts">
  import { getContext } from 'svelte';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { NavGroup, Navigation, NavItem } from '$lib/components/navigation';
  import { t } from '$lib/i18n';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import LanguageSelection from './LanguageSelection.svelte';
  import type { CandidateContext } from '$lib/utils/candidateContext';

  const { unansweredRequiredInfoQuestions, unansweredOpinionQuestions } =
    getContext<CandidateContext>('candidate') ?? {};
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
      href={$getRoute(ROUTE.CandAppHome)}
      icon="home"
      text={$t('candidateApp.navbar.start')} />
    <NavItem
      href={$getRoute(ROUTE.CandAppProfile)}
      icon="profile"
      text={$t('candidateApp.navbar.basicInfo')} />
    <NavItem
      href={$getRoute(ROUTE.CandAppQuestions)}
      icon="opinion"
      text={$t('candidateApp.navbar.yourOpinions')}
      disabled={$unansweredRequiredInfoQuestions?.length !== 0}>
      {#if $unansweredRequiredInfoQuestions && $unansweredOpinionQuestions && $unansweredOpinionQuestions.length > 0}
        <InfoBadge
          text={String($unansweredOpinionQuestions.length)}
          disabled={$unansweredRequiredInfoQuestions.length !== 0}
          classes="-left-8 -top-4" />
      {/if}
    </NavItem>
    <NavItem
      href={$getRoute(ROUTE.CandAppSettings)}
      icon="settings"
      text={$t('candidateApp.navbar.settings')} />
    <NavItem
      href={$getRoute(ROUTE.CandAppPreview)}
      icon="previewProfile"
      text={$t('candidateApp.navbar.preview')} />
    <NavItem
      href={$getRoute(ROUTE.CandAppHelp)}
      icon="help"
      text={$t('candidateApp.navbar.help')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={$getRoute(ROUTE.CandAppInfo)}
      icon="info"
      disabled
      text={$t('candidateApp.navbar.electionInformation')} />
    <NavItem
      href={$getRoute(ROUTE.CandAppFAQ)}
      icon="info"
      disabled
      text={$t('candidateApp.navbar.useInformation')} />
  </NavGroup>
  <NavGroup>
    <NavItem
      href={$getRoute(ROUTE.CandAppFeedback)}
      icon="feedback"
      disabled
      text={$t('candidateApp.navbar.feedback')} />
  </NavGroup>
  <LanguageSelection />
</Navigation>
