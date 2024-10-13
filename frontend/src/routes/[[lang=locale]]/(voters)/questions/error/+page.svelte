<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import Layout from '../../../Layout.svelte';
</script>

<svelte:head>
  <title>{$t('questions.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('questions.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} />
  </figure>
  <svelte:fragment slot="primaryActions">
    <Button
      href={$getRoute(Route.Results)}
      text={$t('results.title.browse')}
      variant="main"
      icon="next" />
    <Button href={$getRoute(Route.Home)} text={$t('common.returnHome')} />
  </svelte:fragment>
</Layout>
