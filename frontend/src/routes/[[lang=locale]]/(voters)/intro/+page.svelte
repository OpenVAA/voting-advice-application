<!--@component

# Intro page

Shown after the front page in the voter app. Displays a list of the steps the voter will need to take. The list is constructed based on the data and settings.

### Settings

- `elections.disallowSelection`: Affects whether the select elections step is shown.
- `elections.startFromConstituencyGroup`: Affects the order of the steps shown and the continue button’s behavior.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import introVideo from './introVideo.json';
  import MainContent from '../../MainContent.svelte';
  import type { LocalizedVideoContent } from '@openvaa/app-shared';
  import { getLayoutContext } from '$lib/contexts/layout';

  const { appSettings, getRoute, locale, t } = getVoterContext();
  const { video } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Video
  ////////////////////////////////////////////////////////////////////

  const videoProps = (introVideo as LocalizedVideoContent)[$locale];
  if (videoProps) video.load(videoProps);
</script>

<MainContent title={$t('dynamic.intro.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.intro.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t('dynamic.intro.ingress')}
  </p>
  <!-- <ol class="list-circled w-fit">
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

  <Button
    slot="primaryActions"
    href={$appSettings.elections?.startFromConstituencyGroup ? $getRoute('Constituencies') : $getRoute('Elections')}
    variant="main"
    icon="next"
    text={$t('dynamic.intro.continue')} />
</MainContent>
