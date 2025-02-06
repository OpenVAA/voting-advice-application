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
  import { LogoutButton } from '$candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appType, getRoute, openFeedbackModal, t } = getAppContext();
  const resultsAvailable = $appType === 'voter' ? getVoterContext().resultsAvailable : undefined;
  const { topBarSettings } = getLayoutContext(onDestroy);
</script>

<!-- style:--headerIcon-color={hasVideo && screenWidth < Breakpoints.sm
  ? 'white'
  : 'oklch(var(--p))' -->
<div class="vaa-basicPage-actions flex gap-0" style:--headerIcon-color="oklch(var(--p))">
  {#if $topBarSettings.actions.logout == 'show' && $appType === 'candidate' && $page.data.token}
    <LogoutButton variant="icon" />
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

  {#if $topBarSettings.actions.return === 'show'}
    <Button
      class="!text-neutral"
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
</style>
