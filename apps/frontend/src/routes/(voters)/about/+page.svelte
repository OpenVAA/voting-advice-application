<svelte:options runes />

<!--@component

# About (the app) page

Displays information about the application.

### Settings

- `matching.organizationMatching`: Affects the information displayed.
- `appVersion.source`: Shown as a link to the source code.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  const { appSettings, getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: t('common.returnHome')
    }
  });
</script>

<MainContent title={t('about.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.about.heroEmoji')} />
    </figure>
  {/snippet}

  {#snippet heading()}
    <HeadingGroup>
      <PreHeading class="text-primary">{t('dynamic.appName')}</PreHeading>
      <h1>{t('about.title')}</h1>
    </HeadingGroup>
  {/snippet}

  <div data-testid="voter-about-content">
    {@html sanitizeHtml(t('about.content'))}
  </div>

  {#if $appSettings.matching.organizationMatching !== 'none'}
    <h2 class="mb-md mt-xl">{t('about.organizationMatching.title')}</h2>
    {@html sanitizeHtml(
      t('about.organizationMatching.content', { partyMatchingMethod: $appSettings.matching.organizationMatching })
    )}
  {/if}

  {#if $appSettings.appVersion.source}
    <h2 class="mb-md mt-lg">{t('about.source.title')}</h2>
    <p>
      {t('about.source.content')}
      <a
        href={$appSettings.appVersion.source}
        target="_blank"
        class="small-label me-md bg-base-300 px-md py-sm inline-block rounded-[1rem]"
        data-testid="voter-about-source-link">{t('about.source.sitename')}</a>
    </p>
  {/if}

  {#snippet primaryActions()}
    <Button
      variant="main"
      href={$getRoute('Home')}
      text={t('common.returnHome')}
      data-testid="voter-about-return" />
  {/snippet}
</MainContent>
