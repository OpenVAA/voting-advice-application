<script lang="ts">
  import {opinionQuestions} from '$lib/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {HeroEmoji} from '$lib/components/heroEmoji';
</script>

<svelte:head>
  <title>{$t('questions.title')}</title>
</svelte:head>

{#await $opinionQuestions}
  <LoadingSpinner />
{:then questions}
  {#if !questions.length}
    <BasicPage title={$t('error.noQuestions')}>
      <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} slot="hero" />
      <svelte:fragment slot="primaryActions">
        <Button
          href={$getRoute(Route.Results)}
          text={$t('results.title.browse')}
          variant="main"
          icon="next" />
        <Button href={$getRoute(Route.Home)} text={$t('common.returnHome')} />
      </svelte:fragment>
    </BasicPage>
  {:else}
    <slot />
  {/if}
{/await}
