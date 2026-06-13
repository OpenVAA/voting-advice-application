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

<script lang="ts">
  import { InfoBadge } from '$lib/components/infoBadge';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';
  import type { CandidateNavProps } from './CandidateNav.type';

  let { onKeyboardFocusOut, ...restProps }: CandidateNavProps = $props();

  const { navigation } = getLayoutContext();
  // Phase 61-03 follow-up: read reactive context getters via candCtx.X.
  const candCtx = getCandidateContext();
  const { getRoute, openFeedbackModal, t } = candCtx;
  // appSettings is a reactive accessor (Phase 113 flatten) — read via candCtx.X, never destructure.
  const appSettings = $derived(candCtx.appSettings);
</script>

<Navigation {onKeyboardFocusOut} {...restProps}>
  <NavItem onclick={navigation.close} icon="close" text={t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
  {#if candCtx.isAuthenticated}
    <NavGroup>
      <NavItem
        href={getRoute.current('CandAppHome')}
        icon="home"
        text={t('candidateApp.common.home')}
        data-testid="candidate-nav-home" />
      <NavItem
        href={getRoute.current('CandAppProfile')}
        icon="profile"
        text={t('candidateApp.basicInfo.title')}
        data-testid="candidate-nav-profile" />
      <NavItem
        href={getRoute.current('CandAppQuestions')}
        icon="opinion"
        text={t('candidateApp.questions.title')}
        disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}
        data-testid="candidate-nav-questions">
        {#if candCtx.unansweredRequiredInfoQuestions && candCtx.unansweredOpinionQuestions && candCtx.unansweredOpinionQuestions.length > 0}
          <InfoBadge
            text={String(candCtx.unansweredOpinionQuestions.length)}
            disabled={candCtx.unansweredRequiredInfoQuestions.length !== 0}
            classes="-left-8 -top-4" />
        {/if}
      </NavItem>
      <NavItem
        href={getRoute.current('CandAppPreview')}
        icon="previewProfile"
        text={t('candidateApp.preview.title')}
        data-testid="candidate-nav-preview" />
      <NavItem
        href={getRoute.current('CandAppSettings')}
        icon="settings"
        text={t('candidateApp.settings.title')}
        data-testid="candidate-nav-settings" />
    </NavGroup>
    <NavGroup>
      <NavItem href={getRoute.current('CandAppHelp')} icon="help" text={t('candidateApp.help.title')} />
      <NavItem href={getRoute.current('CandAppPrivacy')} icon="privacy" text={t('candidateApp.privacy.shortTitle')} />
    </NavGroup>
  {:else}
    <NavGroup>
      <NavItem href={getRoute.current('CandAppLogin')} icon="login" text={t('common.login')} />
      {#if !candCtx.answersLocked}
        {#if appSettings.current.preRegistration?.enabled}
          <NavItem
            href={getRoute.current('CandAppPreregister')}
            icon="create"
            text={t('candidateApp.preregister.identification.start.title')} />
        {/if}
        <NavItem
          href={getRoute.current('CandAppRegister')}
          icon="check"
          text={appSettings.current.preRegistration?.enabled
            ? t('candidateApp.register.titleWithPreregistration')
            : t('candidateApp.register.title')} />
      {/if}
    </NavGroup>
    <NavGroup>
      <NavItem href={getRoute.current('CandAppForgotPassword')} icon="help" text={t('candidateApp.login.forgotPassword')} />
      <NavItem href={getRoute.current('CandAppHelp')} icon="help" text={t('candidateApp.help.title')} />
      <NavItem href={getRoute.current('CandAppPrivacy')} icon="privacy" text={t('candidateApp.privacy.shortTitle')} />
    </NavGroup>
  {/if}
  {#if openFeedbackModal.current}
    <NavGroup>
      <NavItem onclick={openFeedbackModal.current} icon="feedback" text={t('feedback.send')} />
    </NavGroup>
  {/if}
  <LanguageSelection />
</Navigation>
