<!--@component

# Info (about the elections) page

Displays information about the elections in the VAA, along with the info video from the intro route’s videos.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { logDebugError } from '$lib/utils/logger';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';
  import introVideos from '../intro/introVideos.json';
  import type { VideoContent } from '@openvaa/app-shared';

  /** The index of the info video in the intro route’s video list */
  const INFO_VIDEO_INDEX = 1;

  const { dataRoot, getRoute, locale, t } = getVoterContext();

  const { pageStyles, topBarSettings, video } = getLayoutContext(onDestroy);
  const { hasContent } = video;

  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });

  pageStyles.push({
    drawer: {
      background: 'bg-base-300'
    }
  });

  // Load the video
  $hasContent = true;
  onMount(() => loadVideo());

  // Update page on locale change
  locale.subscribe(() => loadVideo());

  function loadVideo() {
    const videoProps = introVideos[INFO_VIDEO_INDEX]?.[$locale as keyof LocalizedIntroVideoProps];
    if (videoProps == null) {
      logDebugError(`Info video not found for locale ${$locale}`);
      return;
    }
    video.load({ maxHeight: '60vh', ...videoProps });
  }

  interface LocalizedIntroVideoProps {
    sv: IntroVideoProps;
    en: IntroVideoProps;
    so: IntroVideoProps;
    ar: IntroVideoProps;
  }
  type IntroVideoProps = VideoContent;
</script>

<MainContent title={$t('info.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.info.heroEmoji')} />
  </figure>

  <div>
    {@html sanitizeHtml($t('dynamic.info.content'))}
  </div>

  {#if $dataRoot.elections}
    <div class="items-stretch">
      {#each $dataRoot.elections ?? [] as { name, date, info }}
        {#if $dataRoot.elections.length > 1}
          <h2 class="mb-md mt-lg">{name}</h2>
        {/if}
        <p>{info}</p>
        {#if date}
          <p>{$t('dynamic.info.dateInfo', { electionDate: date })}</p>
        {/if}
      {/each}
    </div>
  {/if}

  <Button slot="primaryActions" variant="main" href={$getRoute('Home')} text={$t('common.returnHome')} />
</MainContent>
