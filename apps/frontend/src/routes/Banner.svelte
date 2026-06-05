<!--@component

# Banner component

Contains the secondary action buttons in the header.

### TODO

Allow layouts to insert arbitrary content in the header and make this a static component [Svelte 5].

### Dynamic component

Accesses `AppContext` and optionally `VoterContext`.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { LogoutButton as CandidateLogoutButton } from '$candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { LogoutButton as AdminLogoutButton } from '$lib/dynamic-components/logoutButton';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `appType` / `getRoute` / `openFeedbackModal` are stable rune handles from
  // AppContext; read `.current` directly (no store bridge). `getRoute` was
  // already rune-native — `getRoute.current(...)` is unchanged.
  const { appType, getRoute, openFeedbackModal, t } = getAppContext();
  const voterCtx = appType.current === 'voter' ? getVoterContext() : undefined;
  const { topBarSettings, video } = getLayoutContext();
</script>

<!-- style:--headerIcon-color={hasVideo && screenWidth < Breakpoints.sm
  ? 'white'
  : 'var(--color-primary)' -->
<div class="vaa-basicPage-actions flex gap-0" style:--headerIcon-color="var(--color-primary)">
  {#if video.hasContent}
    <Button
      onclick={() => video.player?.toggleTranscript()}
      variant="responsive-icon"
      icon={video.mode === 'video' ? 'videoOn' : 'videoOff'}
      text={video.mode === 'video' ? t('components.video.showTranscript') : t('components.video.showVideo')} />
  {/if}

  {#if topBarSettings.current.actions.logout == 'show' && page.data.token}
    {#if appType.current === 'candidate'}
      <CandidateLogoutButton variant="icon" />
    {:else if appType.current === 'admin'}
      <AdminLogoutButton variant="icon" redirectTo="AdminAppLogin" />
    {/if}
  {/if}

  {#if topBarSettings.current.actions.feedback === 'show'}
    <Button
      onclick={openFeedbackModal.current}
      variant="icon"
      icon="feedback"
      text={t('feedback.send')}
      data-testid="header-feedback" />
  {/if}

  {#if topBarSettings.current.actions.help === 'show'}
    <Button
      href={getRoute.current('Help')}
      variant="icon"
      icon="help"
      text={t('help.title')}
      data-testid="header-help" />
  {/if}

  {#if topBarSettings.current.actions.results === 'show'}
    <Button
      href={getRoute.current('Results')}
      disabled={voterCtx == null ? true : !voterCtx.resultsAvailable}
      variant="responsive-icon"
      icon="results"
      text={t('results.title.results')}
      data-testid="voter-banner-results" />
  {/if}

  {#if topBarSettings.current.actions.return === 'show'}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      text={topBarSettings.current.actions.returnButtonLabel || t('common.return')}
      onclick={topBarSettings.current.actions.returnButtonCallback ||
        (() => goto(appType.current === 'voter' ? getRoute.current('Home') : getRoute.current('CandAppHome')))} />
  {/if}

  {#if topBarSettings.current.actions.cancel === 'show' && topBarSettings.current.actions.cancelButtonCallback}
    <Button
      class="!text-warning"
      variant="icon"
      icon="close"
      text={topBarSettings.current.actions.cancelButtonLabel || t('common.cancel')}
      onclick={topBarSettings.current.actions.cancelButtonCallback} />
  {/if}
</div>

<style lang="postcss">
  @reference "../tailwind-theme.css";
  /* `<a>` uses aria-disabled (non-standard `disabled` removed for WCAG / Playwright compat); `<button>` keeps native `disabled`. */
  :global(.vaa-basicPage-actions > a:not([aria-disabled='true'])),
  :global(.vaa-basicPage-actions > * > a:not([aria-disabled='true'])),
  :global(.vaa-basicPage-actions > button:not([disabled])),
  :global(.vaa-basicPage-actions > * > button:not([disabled])) {
    /* !text is valid class prefix */
    @apply text-[var(--headerIcon-color)];
  }
</style>
