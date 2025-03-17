<!--@component

# Game mode intro page

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Avatar } from '$lib/components/avatar';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getGameContext } from '$lib/contexts/game/gameContext';
  import { unwrapEntity } from '$lib/utils/entities';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../MainContent.svelte';
  import type { EntityType } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    appSettings,
    getRoute,
    matches,
    opinionQuestionCategories,
    t,
    matchTarget: { targetNomination, targetNominationId, targetNominationType, reset }
  } = getGameContext();

  ////////////////////////////////////////////////////////////////////
  // Init target entity
  ////////////////////////////////////////////////////////////////////

  let error: string | undefined;

  onMount(() => {
    initTargetEntity();
  });

  function initTargetEntity(rerandomize = false): void {
    if (!rerandomize && $targetNomination) return;
    const tree = $matches;
    const election = Object.values(tree)[0];
    for (const [type, matches] of Object.entries(election)) {
      if (matches.length < 2) continue;
      $targetNominationType = type as EntityType;
      const target = matches[Math.floor(Math.random() * matches.length)];
      const { nomination } = unwrapEntity(target);
      if (!nomination) continue;
      $targetNominationId = nomination.id;
      break;
    }
    if (!$targetNomination) {
      reset();
      error = $t('gameMode.error.noTargetFound');
      return;
    }
    error = undefined;
  }
</script>

<MainContent title={$t('gameMode.intro.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('gameMode.intro.heroEmoji')} />
  </figure>

  <p class="text-center">
    {@html sanitizeHtml(
      $t('gameMode.intro.ingress', {
        numCategories: $opinionQuestionCategories.length,
        minQuestions: $appSettings.matching.minimumAnswers
      })
    )}
  </p>

  {#if error}
    <ErrorMessage message={error} inline class="m-auto my-lg" />
  {:else if $targetNomination}
    <div class="mt-md flex flex-row items-center gap-md">
      <Avatar entity={$targetNomination} />
      <div class="font-bold">{$targetNomination.name}</div>
    </div>
  {:else}
    <Loading inline class="m-auto my-lg" />
  {/if}

  <div class="mt-lg grid gap-lg">
    {@html sanitizeHtml(
      $t('gameMode.intro.content', {
        numCategories: $opinionQuestionCategories.length,
        minQuestions: $appSettings.matching.minimumAnswers
      })
    )}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button icon="next" variant="main" href={$getRoute('Questions')} text={$t('common.continue')} />
    <Button on:click={() => initTargetEntity(true)} text={$t('gameMode.intro.rerandomize')} />
  </svelte:fragment>
</MainContent>
