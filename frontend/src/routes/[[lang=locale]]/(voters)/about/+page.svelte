<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {Feedback} from '$lib/components/feedback';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
</script>

<BasicPage title={$t('about.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('about.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1>{$t('about.title')}</h1>
  </HeadingGroup>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback}
      <Button
        href="#feedback-form"
        variant="icon"
        icon="feedback"
        text={$t('navigation.sendFeedback')} />
    {/if}
    <Button
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Home)}
      text={$t('about.returnButton')} />
  </svelte:fragment>

  {@html sanitizeHtml($t('about.content'))}

  {#if $settings.matching.partyMatching !== 'none'}
    <h2 class="mb-md mt-xl">{$t('about.partyMatchingTitle')}</h2>
    {@html sanitizeHtml(
      $t('about.partyMatchingContent', {partyMatchingMethod: $settings.matching.partyMatching})
    )}
  {/if}

  <h2 id="feedback-form" class="mb-md mt-lg">{$t('about.feedbackTitle')}</h2>
  <Feedback />

  {#if $settings.appVersion.source}
    <h2 class="mb-md mt-lg">{$t('about.sourceTitle')}</h2>
    <p>
      {$t('about.sourceContent')}
      <a
        href={$settings.appVersion.source}
        target="_blank"
        class="small-label me-md inline-block rounded-[1rem] bg-base-300 px-md py-sm"
        >{$t('about.sourceSitename')}</a>
    </p>
  {/if}

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('about.returnButton')} />
  </svelte:fragment>
</BasicPage>
