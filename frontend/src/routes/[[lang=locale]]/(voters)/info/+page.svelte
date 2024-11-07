<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { election } from '$lib/stores';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import Layout from '../../Layout.svelte';

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<svelte:head>
  <title>{$t('info.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('info.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.info.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$election?.name ?? ''}</PreHeading>
    <h1>{$t('info.title')}</h1>
  </HeadingGroup>

  <div>
    {@html sanitizeHtml(
      $t('dynamic.info.content', {
        electionDate: new Date($election?.electionDate ?? '')
      })
    )}
  </div>

  <Button slot="primaryActions" variant="main" href={$getRoute(ROUTE.Home)} text={$t('common.returnHome')} />
</Layout>
