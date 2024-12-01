<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { LoadingSpinner } from '$candidate/components/loadingSpinner';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { opinionQuestions, unansweredRequiredInfoQuestions } = getContext<CandidateContext>('candidate');

  $: if ($unansweredRequiredInfoQuestions?.length) {
    goto($getRoute(ROUTE.CandAppProfile));
  }
</script>

<svelte:head>
  <title>{$t('questions.title')}</title>
</svelte:head>

{#if $unansweredRequiredInfoQuestions?.length}
  <LoadingSpinner />
{:else if !$opinionQuestions || !Object.values($opinionQuestions).length}
  <BasicPage title={$t('error.noQuestions')}>
    <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} slot="hero" />
    <Button
      href={$getRoute(ROUTE.CandAppHome)}
      text={$t('common.return')}
      variant="main"
      icon="previous"
      iconPos="left"
      slot="primaryActions" />
  </BasicPage>
{:else}
  <slot />
{/if}
