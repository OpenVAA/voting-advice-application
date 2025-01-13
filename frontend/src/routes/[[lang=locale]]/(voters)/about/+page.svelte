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
  import Layout from '../../Layout.svelte';

  const { appSettings, getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<Layout title={$t('about.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.about.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1>{$t('about.title')}</h1>
  </HeadingGroup>

  {@html sanitizeHtml($t('about.content'))}

  {#if $appSettings.matching.organizationMatching !== 'none'}
    <h2 class="mb-md mt-xl">{$t('about.organizationMatching.title')}</h2>
    {@html sanitizeHtml(
      $t('about.organizationMatching.content', { partyMatchingMethod: $appSettings.matching.organizationMatching })
    )}
  {/if}

  {#if $appSettings.appVersion.source}
    <h2 class="mb-md mt-lg">{$t('about.source.title')}</h2>
    <p>
      {$t('about.source.content')}
      <a
        href={$appSettings.appVersion.source}
        target="_blank"
        class="small-label me-md inline-block rounded-[1rem] bg-base-300 px-md py-sm">{$t('about.source.sitename')}</a>
    </p>
  {/if}

  <Button slot="primaryActions" variant="main" href={$getRoute('Home')} text={$t('common.returnHome')} />
</Layout>
