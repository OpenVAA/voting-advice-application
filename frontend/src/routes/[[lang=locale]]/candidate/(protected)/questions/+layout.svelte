<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateContext';
  import {getContext} from 'svelte';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {HeroEmoji} from '$lib/components/heroEmoji';

  const {opinionQuestions, unansweredRequiredInfoQuestions} =
    getContext<CandidateContext>('candidate');

  $: if ($unansweredRequiredInfoQuestions?.length) {
    goto($getRoute(Route.CandAppProfile));
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
      href={$getRoute(Route.CandAppHome)}
      text={$t('common.return')}
      variant="main"
      icon="previous"
      iconPos="left"
      slot="primaryActions" />
  </BasicPage>
{:else}
  <slot />
{/if}
