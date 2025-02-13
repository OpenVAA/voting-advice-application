<!--
@component
A template part that outputs the navigation menu for the Candidate App for use in use in `Layout`.

### Dynamic component

- Accesses the `CandidateContext`.

### Usage

```tsx
<CandidateNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close"/>
</CandidateNav>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';

  const { navigation } = getLayoutContext(onDestroy);
  const { authToken, getRoute, t, unansweredRequiredInfoQuestions, unansweredOpinionQuestions } = getCandidateContext();
</script>

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <NavItem
    on:click={navigation.close}
    icon="close"
    text={$t('common.closeMenu')}
    class="pt-16"
    id="drawerCloseButton" />
  {#if $authToken}
    <NavGroup>
      <NavItem href={$getRoute('CandAppHome')} icon="home" text={$t('candidateApp.common.home')} />
      <NavItem href={$getRoute('CandAppProfile')} icon="profile" text={$t('candidateApp.basicInfo.title')} />
      <NavItem
        href={$getRoute('CandAppQuestions')}
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
      <NavItem href={$getRoute('CandAppSettings')} icon="settings" text={$t('candidateApp.settings.title')} />
      <NavItem href={$getRoute('CandAppPreview')} icon="previewProfile" text={$t('candidateApp.preview.title')} />
      <NavItem href={$getRoute('CandAppHelp')} icon="help" text={$t('candidateApp.help.title')} />
    </NavGroup>
  {:else}
    <NavGroup>
      <NavItem href={$getRoute('CandAppLogin')} icon="home" text={$t('common.login')} />
    </NavGroup>
  {/if}
  <!-- 
  <NavGroup>
    <NavItem href={$getRoute('CandAppInfo)} icon="info" disabled text={$t('info.title'')} />
    <NavItem
      href={$getRoute('CandAppFAQ')}
      icon="info"
      disabled
      text={$t('candidateApp.info.title')} />
  </NavGroup> 
  -->
  <!-- 
  TODO: Uncomment when Candidate App is refactored to use contexts
  {#if $openFeedbackModal}
    <NavGroup>
      <NavItem on:click={$openFeedbackModal} icon="feedback" text={$t('feedback.send')} />
    </NavGroup>
  {/if} 
  -->
  <LanguageSelection />
</Navigation>
