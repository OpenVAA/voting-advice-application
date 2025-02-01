<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../../../Layout.svelte';

  const error = $t('candidateApp.questions.error.questionNotFound', { questionId: $page.params.questionId });
</script>

<Layout title={error}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} />
  </figure>

  <svelte:fragment slot="primaryActions">
    <Button
      href={$getRoute(ROUTE.CandAppHome)}
      text={$t('common.return')}
      variant="main"
      icon="previous"
      iconPos="left" />
  </svelte:fragment>
</Layout>
