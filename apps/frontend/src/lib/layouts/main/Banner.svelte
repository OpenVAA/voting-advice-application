<!--@component

# Banner component

Contains the secondary action buttons in the header. The logout action is shown to a signed-in user of the Contestant App or the Admin App, read from the session the app's outermost load provides.

### TODO

Allow layouts to insert arbitrary content in the header and make this a static component [Svelte 5].

### Dynamic component

Accesses `AppContext`, and `VoterContext`, `ContestantContext` or `AdminContext` in the app of that type. The Log out is the one shared `LogoutButton`, given the app's own sign-out: the Contestant App's with its warning of what is left undone, the Admin App's with its login to leave to.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { contestantLogoutWarning } from '$contestant/utils/logoutWarning';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getAppContext } from '$lib/contexts/app';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { LogoutButton } from '$lib/dynamic-components/logoutButton';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `appType`, `getRoute` and `openFeedbackModal` are stable rune handles from AppContext; read `.current` directly.
  const { appType, getRoute, openFeedbackModal, t } = getAppContext();
  const voterCtx = appType.current === 'voter' ? getVoterContext() : undefined;
  const contestantCtx = appType.current === 'contestant' ? getContestantContext() : undefined;
  const adminCtx = appType.current === 'admin' ? getAdminContext() : undefined;
  // Read inside the derived, so the warning follows the contestant context's accessors.
  const logoutWarning = $derived(contestantCtx ? contestantLogoutWarning(contestantCtx) : undefined);
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

  {#if topBarSettings.current.actions.logout == 'show' && page.data.session}
    {#if appType.current === 'contestant' && contestantCtx}
      <LogoutButton logout={contestantCtx.logout} warning={logoutWarning} variant="icon" data-testid="header-logout" />
    {:else if appType.current === 'admin' && adminCtx}
      <LogoutButton logout={adminCtx.logout} redirectTo="AdminAppLogin" variant="icon" data-testid="header-logout" />
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
        (() =>
          goto(
            appType.current === 'voter'
              ? getRoute.current('Home')
              : contestantCtx
                ? contestantCtx.homeRoute
                : getRoute.current('AdminAppHome')
          ))} />
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

<style>
  /* Colours the enabled links and buttons that other components render into the actions container; a disabled link carries `aria-disabled`, a disabled button `disabled`. */
  :global(.vaa-basicPage-actions > a:not([aria-disabled='true'])),
  :global(.vaa-basicPage-actions > * > a:not([aria-disabled='true'])),
  :global(.vaa-basicPage-actions > button:not([disabled])),
  :global(.vaa-basicPage-actions > * > button:not([disabled])) {
    color: var(--headerIcon-color);
  }
</style>
