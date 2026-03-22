<!--
@component
A template part that outputs the navigation menu for the Candidate App for use in `Layout`.

### Dynamic component

- Accesses the `CandidateContext`.

### Properties

- Any valid properties of a `Navigation` component

### Usage

```tsx
<CandidateNav>
  <NavItem onclick={closeMenu} icon="close" text="Close"/>
</CandidateNav>
```
-->

<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';
  import type { CandidateNavProps } from './CandidateNav.type';

  let { onKeyboardFocusOut, ...restProps }: CandidateNavProps = $props();

  const { navigation } = getLayoutContext(onDestroy);
  const {
    answersLocked,
    appSettings,
    isAuthenticated,
    getRoute,
    openFeedbackModal,
    t,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions
  } = getCandidateContext();
</script>

<Navigation {onKeyboardFocusOut} {...restProps}>
  <NavItem onclick={navigation.close} icon="close" text={t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
  {#if $isAuthenticated}
    <NavGroup>
      <NavItem
        href={$getRoute('CandAppHome')}
        icon="home"
        text={t('candidateApp.common.home')}
        data-testid="candidate-nav-home" />
      <NavItem
        href={$getRoute('CandAppProfile')}
        icon="profile"
        text={t('candidateApp.basicInfo.title')}
        data-testid="candidate-nav-profile" />
      <NavItem
        href={$getRoute('CandAppQuestions')}
        icon="opinion"
        text={t('candidateApp.questions.title')}
        disabled={$unansweredRequiredInfoQuestions?.length !== 0}
        data-testid="candidate-nav-questions">
        {#if $unansweredRequiredInfoQuestions && $unansweredOpinionQuestions && $unansweredOpinionQuestions.length > 0}
          <InfoBadge
            text={String($unansweredOpinionQuestions.length)}
            disabled={$unansweredRequiredInfoQuestions.length !== 0}
            classes="-left-8 -top-4" />
        {/if}
      </NavItem>
      <NavItem
        href={$getRoute('CandAppPreview')}
        icon="previewProfile"
        text={t('candidateApp.preview.title')}
        data-testid="candidate-nav-preview" />
      <NavItem
        href={$getRoute('CandAppSettings')}
        icon="settings"
        text={t('candidateApp.settings.title')}
        data-testid="candidate-nav-settings" />
    </NavGroup>
    <NavGroup>
      <NavItem href={$getRoute('CandAppHelp')} icon="help" text={t('candidateApp.help.title')} />
      <NavItem href={$getRoute('CandAppPrivacy')} icon="privacy" text={t('candidateApp.privacy.shortTitle')} />
    </NavGroup>
  {:else}
    <NavGroup>
      <NavItem href={$getRoute('CandAppLogin')} icon="login" text={t('common.login')} />
      {#if !$answersLocked}
        {#if $appSettings.preRegistration?.enabled}
          <NavItem
            href={$getRoute('CandAppPreregister')}
            icon="create"
            text={t('candidateApp.preregister.identification.start.title')} />
        {/if}
        <NavItem
          href={$getRoute('CandAppRegister')}
          icon="check"
          text={$appSettings.preRegistration?.enabled
            ? t('candidateApp.register.titleWithPreregistration')
            : t('candidateApp.register.title')} />
      {/if}
    </NavGroup>
    <NavGroup>
      <NavItem href={$getRoute('CandAppForgotPassword')} icon="help" text={t('candidateApp.login.forgotPassword')} />
      <NavItem href={$getRoute('CandAppHelp')} icon="help" text={t('candidateApp.help.title')} />
      <NavItem href={$getRoute('CandAppPrivacy')} icon="privacy" text={t('candidateApp.privacy.shortTitle')} />
    </NavGroup>
  {/if}
  {#if $openFeedbackModal}
    <NavGroup>
      <NavItem onclick={$openFeedbackModal} icon="feedback" text={t('feedback.send')} />
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
