<!--@component

# Banner component

Contains the secondary action buttons in the header.

### TODO

Allow layouts to insert arbitrary content in the header and make this a static component [Svelte 5].

### Dynamic component

Accesses `AppContext` and optionally `VoterContext`.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton as CandidateLogoutButton } from '$candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { videoPreferences } from '$lib/components/video/component-stores';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { LogoutButton as AdminLogoutButton } from '$lib/dynamic-components/logoutButton';
  import { ShareButton } from '$lib/dynamic-components/shareButton';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appType, getRoute, openFeedbackModal, t } = getAppContext();
  const resultsAvailable = $appType === 'voter' ? getVoterContext().resultsAvailable : undefined;
  const {
    topBarSettings,
    video: { mode: videoMode, hasContent: hasVideo, hasTranscript, player, show: showVideo }
  } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Video button
  ////////////////////////////////////////////////////////////////////

  /**
   * Whether the video itself is currently visible, i.e. the player is shown and not displaying the transcript.
   */
  let videoShown: boolean;
  $: videoShown = $showVideo && (!$hasTranscript || $videoMode === 'video');

  /**
   * The video button switches between the video and the transcript, but if the video has no transcript, it hides and shows the whole player instead. The choice to hide the player is stored in `videoPreferences` so that it persists across loads.
   */
  function toggleVideo(): void {
    // The player may have been hidden when watching a video without a transcript, in which case we always show it first
    if (!$showVideo) return setPlayerHidden(false);
    if ($hasTranscript) return $player?.toggleTranscript();
    setPlayerHidden(true);
  }

  function setPlayerHidden(hidden: boolean): void {
    $showVideo = !hidden;
    $videoPreferences = { ...$videoPreferences, videoHidden: hidden };
    // Pause the video when hiding it so that it doesn't keep playing out of sight and resume when showing it again. This mirrors what `toggleTranscript` does.
    $player?.togglePlay(!hidden && !$player.atEnd ? 'play' : 'pause');
  }
</script>

<!-- The header background is hard-coded to the primary colour, so the icons are always shown in `primary-content`. -->
<div class="vaa-basicPage-actions flex gap-0 justify-self-end" style:--headerIcon-color="oklch(var(--pc))">
  {#if $hasVideo}
    <Button
      on:click={toggleVideo}
      variant="responsive-icon"
      icon={videoShown ? 'videoOn' : 'videoOff'}
      text={videoShown
        ? $t($hasTranscript ? 'components.video.showTranscript' : 'components.video.hideVideo')
        : $t('components.video.showVideo')} />
  {/if}

  <!-- Shown in every app's header by default, since it always shares the app's root url rather than the current one. Routes that need it hidden set `actions.share` to `'hide'` in their `topBarSettings`. -->
  {#if $topBarSettings.actions.share === 'show'}
    <ShareButton />
  {/if}

  {#if $topBarSettings.actions.logout == 'show' && $page.data.token}
    {#if $appType === 'candidate'}
      <CandidateLogoutButton variant="icon" />
    {:else if $appType === 'admin'}
      <AdminLogoutButton variant="icon" redirectTo="AdminAppLogin" />
    {/if}
  {/if}

  {#if $topBarSettings.actions.feedback === 'show'}
    <Button on:click={$openFeedbackModal} variant="icon" icon="feedback" text={$t('feedback.send')} />
  {/if}

  {#if $topBarSettings.actions.help === 'show'}
    <Button href={$getRoute('Help')} variant="icon" icon="help" text={$t('help.title')} />
  {/if}

  {#if $topBarSettings.actions.results === 'show'}
    <Button
      href={$getRoute('Results')}
      disabled={resultsAvailable == null ? true : !$resultsAvailable}
      variant="responsive-icon"
      icon="results"
      text={$t('results.title.results')} />
  {/if}

  {#if $topBarSettings.actions.return === 'show'}
    <Button
      class="!text-primary-content"
      variant="icon"
      icon="close"
      text={$topBarSettings.actions.returnButtonLabel || $t('common.return')}
      on:click={$topBarSettings.actions.returnButtonCallback ||
        (() => goto($appType === 'voter' ? $getRoute('Home') : $getRoute('CandAppHome')))} />
  {/if}

  {#if $topBarSettings.actions.cancel === 'show' && $topBarSettings.actions.cancelButtonCallback}
    <Button
      class="!text-warning"
      variant="icon"
      icon="close"
      text={$topBarSettings.actions.cancelButtonLabel || $t('common.cancel')}
      on:click={$topBarSettings.actions.cancelButtonCallback} />
  {/if}
</div>

<style lang="postcss">
  :global(.vaa-basicPage-actions > a:not([disabled])),
  :global(.vaa-basicPage-actions > * > a:not([disabled])),
  :global(.vaa-basicPage-actions > button:not([disabled])),
  :global(.vaa-basicPage-actions > * > button:not([disabled])) {
    /* !text is valid class prefix */
    @apply text-[var(--headerIcon-color)];
  }

  /* The `responsive-icon` and `secondary` variants of `Button` set the color of their labels separately, so we need to override those as well. */
  :global(.vaa-basicPage-actions :not([disabled]) > .vaa-button-label) {
    @apply text-[var(--headerIcon-color)];
  }
</style>
