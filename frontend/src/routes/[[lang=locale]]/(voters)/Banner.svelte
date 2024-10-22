<script lang="ts">
  import {t} from '$lib/i18n';
  import {openFeedbackModal, settings, resultsAvailable} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getTopBarActionsContext} from '../topBarActions.context';
  import {goto} from '$app/navigation';

  /** Synced version so that we don't have to await for this explicitly */
  let resultsAvailableSync = false;
  $: $resultsAvailable.then((d) => (resultsAvailableSync = d));

  // TODO: When the Banner component is shared bring logout button back
  // const userStore = getContext<CandidateContext>('candidate')?.user;
  // We are in the candidate application and the user has logged in
  // TODO: Figure out a way to define this LogoutButton part only within the
  // candidate route. This can be done with the new, slot-less templates
  // const showLogoutButton = $appType === 'candidate' && userStore;

  const topBarActions = getTopBarActionsContext();
</script>

<!-- style:--headerIcon-color={hasVideo && screenWidth < Breakpoints.sm
  ? 'white'
  : 'oklch(var(--p))' -->
<div class="vaa-basicPage-actions flex gap-0" style:--headerIcon-color="oklch(var(--p))">
  <!-- {#if showLogoutButton}
    <LogoutButton variant="icon" />
  {/if} -->

  {#if $topBarActions.feedback == 'show' && $settings.header.showFeedback}
    <Button
      on:click={$openFeedbackModal}
      variant="icon"
      icon="feedback"
      text={$t('feedback.send')} />
  {/if}

  {#if $topBarActions.help == 'show' && $settings.header.showHelp}
    <Button href={$getRoute(Route.Help)} variant="icon" icon="help" text={$t('help.title')} />
  {/if}

  {#if $topBarActions.results == 'show' && $settings.questions.showResultsLink}
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

  {#if $topBarActions.return == 'show'}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      text={$topBarActions.returnButtonLabel}
      on:click={$topBarActions.returnButtonCallback || (() => goto($getRoute(Route.Home)))} />
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
