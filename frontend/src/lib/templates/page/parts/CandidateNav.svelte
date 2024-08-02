<script lang="ts">
  import {Navigation, NavGroup, NavItem} from '$lib/components/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {t} from '$lib/i18n';
  import {InfoBadge} from '$lib/components/infoBadge';
  import {getContext} from 'svelte';
  import LanguageSelection from './LanguageSelection.svelte';
  import type {CandidateContext} from '$lib/utils/candidateContext';

  const {unansweredRequiredInfoQuestions, unansweredOpinionQuestions} =
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
      href={$getRoute(Route.CandAppHome)}
      icon="home"
      text={$t('candidateApp.common.home')} />
    <NavItem
      href={$getRoute(Route.CandAppProfile)}
      icon="profile"
      text={$t('candidateApp.basicInfo.title')} />
    <NavItem
      href={$getRoute(Route.CandAppQuestions)}
      icon="opinion"
      text={$t('candidateApp.questions.title')}
      disabled={$unansweredRequiredInfoQuestions?.length !== 0}>
      {#if $unansweredRequiredInfoQuestions && $unansweredOpinionQuestions && $unansweredOpinionQuestions.length > 0}
        <InfoBadge
          text={String($unansweredOpinionQuestions.length)}
          disabled={$unansweredRequiredInfoQuestions.length !== 0}
          classes="-left-8 -top-4" />
      {/if}
    </NavItem>
    <NavItem
      href={$getRoute(Route.CandAppSettings)}
      icon="settings"
      text={$t('candidateApp.settings.title')} />
    <NavItem
      href={$getRoute(Route.CandAppPreview)}
      icon="previewProfile"
      text={$t('candidateApp.preview.title')} />
    <NavItem href={$getRoute(Route.CandAppHelp)} icon="help" text={$t('candidateApp.help.title')} />
  </NavGroup>
  <!-- 
  <NavGroup>
    <NavItem href={$getRoute(Route.CandAppInfo)} icon="info" disabled text={$t('info.title')} />
    <NavItem
      href={$getRoute(Route.CandAppFAQ)}
      icon="info"
      disabled
      text={$t('candidateApp.info.title')} />
  </NavGroup> 
  -->
  <NavGroup>
    <NavItem
      href={$getRoute(Route.CandAppFeedback)}
      icon="feedback"
      disabled
      text={$t('feedback.send')} />
  </NavGroup>
  <LanguageSelection />
</Navigation>
