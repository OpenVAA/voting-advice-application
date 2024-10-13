<script lang="ts">
  import {t} from '$lib/i18n';
  import {openFeedbackModal, resultsAvailable} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {goto} from '$app/navigation';
  import {onDestroy} from 'svelte';
  import {getLayoutContext} from '$lib/contexts/layout';

  /** Synced version so that we don't have to await for this explicitly */
  let resultsAvailableSync = false;
  $: $resultsAvailable.then((d) => (resultsAvailableSync = d));

  // TODO: When the Banner component is shared bring logout button back
  // const userStore = getContext<CandidateContext>('candidate')?.user;
  // We are in the candidate application and the user has logged in
  // TODO: Figure out a way to define this LogoutButton part only within the
  // candidate route. This can be done with the new, slot-less templates
  // const showLogoutButton = $appType === 'candidate' && userStore;
  const {topBarSettings} = getLayoutContext(onDestroy);
</script>

<!-- style:--headerIcon-color={hasVideo && screenWidth < Breakpoints.sm
  ? 'white'
  : 'oklch(var(--p))' -->
<div class="vaa-basicPage-actions flex gap-0" style:--headerIcon-color="oklch(var(--p))">
  <!-- {#if showLogoutButton}
    <LogoutButton variant="icon" />
  {/if} -->

  {#if $topBarSettings.actions.feedback == 'show'}
    <Button
      on:click={$openFeedbackModal}
      variant="icon"
      icon="feedback"
      text={$t('feedback.send')} />
  {/if}

  {#if $topBarSettings.actions.help == 'show'}
    <Button href={$getRoute(Route.Help)} variant="icon" icon="help" text={$t('help.title')} />
  {/if}

  {#if $topBarSettings.actions.results == 'show'}
    <Button
      href={$getRoute(Route.Results)}
      disabled={resultsAvailableSync ? null : true}
      variant="responsive-icon"
      icon="results"
      text={$t('results.title.results')} />
  {/if}

  <!--
  {#if videoProps}
    <Button
      on:click={() => toggleTranscript()}
      variant="responsive-icon"
      icon={mode === 'video' ? 'videoOn' : 'videoOff'}
      text={mode === 'video'
        ? $t('components.video.showTranscript')
        : $t('components.video.showVideo')} />
  {/if}
  -->

  {#if $topBarSettings.actions.return == 'show'}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      text={$topBarSettings.actions.returnButtonLabel}
      on:click={$topBarSettings.actions.returnButtonCallback ||
        (() => goto($getRoute(Route.Home)))} />
  {/if}
</div>

<style lang="postcss">
  :global(.vaa-basicPage-actions > a:not([disabled])),
  :global(.vaa-basicPage-actions > * > a:not([disabled])),
  :global(.vaa-basicPage-actions > button:not([disabled])),
  :global(.vaa-basicPage-actions > * > button:not([disabled])) {
    /* !text is valid class prefix */
    @apply !text-[var(--headerIcon-color)];
  }
</style>
