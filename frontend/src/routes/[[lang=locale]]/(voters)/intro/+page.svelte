<!--@component

# Intro page

Shown after the front page in the voter app. Displays a list of the steps the voter will need to take. The list is constructed based on the data and settings.

### Settings

- `elections.disallowSelection`: Affects whether the select elections step is shown.
- `elections.startFromConstituencyGroup`: Affects the order of the steps shown and the continue button’s behavior.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { logDebugError } from '$lib/utils/logger';
  import introVideos from './introVideos.json';
  import MainContent from '../../MainContent.svelte';
  import type { CustomVideoProps } from '@openvaa/app-shared';

  const { appSettings, getRoute, locale, t } = getVoterContext();
  const { pageStyles, video } = getLayoutContext(onDestroy);
  const { hasContent, player } = video;

  pageStyles.push({
    drawer: {
      background: 'bg-base-300'
    }
  });

  // Variables related to video content
  let currentIndex = 0;
  let backButtonText = '';
  let loadingNext = false;
  let nextButtonText = '';

  // Load the first video
  $hasContent = true;
  onMount(() => {
    if ($player) $player.onEnded = onEnded;
    loadVideo();
  });
  onDestroy(() => {
    if ($player) $player.onEnded = undefined;
  });

  // Update page on locale change
  locale.subscribe(() => loadVideo());

  /**
   * Jump between videos
   */
  function jump(steps: number) {
    currentIndex += steps;
    if (currentIndex < 0) return goto($getRoute('Home'));
    if (currentIndex >= introVideos.length)
      return goto(
        $appSettings.elections?.startFromConstituencyGroup ? $getRoute('Constituencies') : $getRoute('Elections')
      );
    loadVideo();
  }

  function loadVideo() {
    const videoProps = introVideos[currentIndex]?.[$locale as keyof LocalizedIntroVideoProps];
    if (videoProps == null) {
      logDebugError(`Intro video not found for locale ${$locale} and index ${currentIndex}`);
      return;
    }
    // Get button texts
    if (currentIndex > 0) {
      backButtonText = introVideos[currentIndex - 1]?.[$locale as keyof LocalizedIntroVideoProps].title;
    } else {
      backButtonText = $t('common.back');
    }
    if (currentIndex < introVideos.length - 1) {
      nextButtonText = introVideos[currentIndex + 1]?.[$locale as keyof LocalizedIntroVideoProps].title;
    } else {
      nextButtonText = $t('dynamic.intro.list.constituencies');
    }
    // Reload the video, unless this was the initial load event
    video.load(videoProps);
  }

  /** The ended event is sometimes fired multiple times, so we'll use this quick and dirty trick to disregard such multiple firings */
  function onEnded() {
    if (loadingNext) return;
    loadingNext = true;
    jump(1);
    setTimeout(() => (loadingNext = false), 1000);
  }

  interface LocalizedIntroVideoProps {
    fi: IntroVideoProps;
    sv: IntroVideoProps;
    en: IntroVideoProps;
  }
  interface IntroVideoProps {
    video: CustomVideoProps;
  }
</script>

<MainContent title={$t('dynamic.intro.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.intro.heroEmoji')} />
  </figure>

  <!-- <p class="text-center">
    {$t('dynamic.intro.ingress')}
  </p>
  <ol class="list-circled w-fit">
    {#if $electionsSelectable && !$appSettings.elections?.startFromConstituencyGroup}
      <li>{$t('dynamic.intro.list.elections')}</li>
    {/if}
    {#if $constituenciesSelectable}
      <li>{$t('dynamic.intro.list.constituencies')}</li>
    {/if}
    {#if $electionsSelectable && $appSettings.elections?.startFromConstituencyGroup}
      <li>{$t('dynamic.intro.list.elections')}</li>
    {/if}
    <li>{$t('dynamic.intro.list.opinions')}</li>
    <li>{$t('dynamic.intro.list.results')}</li>
    <li>{$t('dynamic.intro.list.details')}</li>
  </ol> -->

  <svelte:fragment slot="primaryActions">
    <Button on:click={() => jump(+1)} variant="main" icon="next" text={nextButtonText} />

    <div class="grid w-full grid-cols-2 items-stretch gap-md">
      <Button
        icon="previous"
        iconPos="left"
        color="secondary"
        variant="secondary"
        on:click={() => jump(-1)}
        text={backButtonText} />
      <Button
        icon="next"
        iconPos="right"
        color="secondary"
        variant="secondary"
        href={$appSettings.elections?.startFromConstituencyGroup ? $getRoute('Constituencies') : $getRoute('Elections')}
        text={$t('questions.skip')} />
    </div>
  </svelte:fragment>
</MainContent>
