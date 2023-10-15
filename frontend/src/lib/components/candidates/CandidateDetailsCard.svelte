<script lang="ts">
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import Tabs from '$lib/components/shared/Tabs.svelte';
  import {ScoreGauge} from '$lib/components/scoreGauge/index';
  import CandidateBasicInfo from './CandidateBasicInfo.svelte';
  import CandidateOpinions from './CandidateOpinions.svelte';

  export let candidate: CandidateProps;
  export let questions: QuestionProps[] = [];
  export let ranking: RankingProps | undefined = undefined;

  // Tabs
  let tabs = [$_('candidate.tabs.basicInfo'), $_('candidate.tabs.opinions')];
  let activeItem = tabs[0];
  const handleChangeTab = (e: CustomEvent) => {
    activeItem = e.detail;
  };

  // TODO: Change
  // Candidate props
  const title = GetFullNameInOrder(candidate.firstName, candidate.lastName),
    imgSrc = '/images/candidate-photo.png',
    imgAlt = 'Candidate photo',
    listText = candidate.party?.shortName ?? '',
    electionSymbol = candidate.electionSymbol,
    summaryMatch = ranking?.toString();
</script>

<article>
  <!-- TODO: replace the following div tag with the EntityCard component -->
  <header class="flex flex-col gap-md p-lg">
    <div class="flex justify-stretch gap-md">
      <figure>
        {#if imgSrc}
          <img class="rounded-sm" src={imgSrc} alt={imgAlt} />
        {:else}
          <div class="placeholder avatar">
            <div class="w-[3.125rem] rounded-full bg-base-300">
              <span class="text-xl"
                >{title
                  .split(/\s+/)
                  .map((s) => s.charAt(0))
                  .join('')}</span>
            </div>
          </div>
        {/if}
      </figure>
      <div class="flex w-full flex-row items-center justify-between">
        <div class="flex flex-col items-start gap-6">
          <h1 class="text-xl">{title}</h1>
          <div class="flex flex-row items-center gap-md">
            {#if listText}
              <!-- TODO: Convert to <PartyTag> component -->
              <div class="flex flex-row gap-sm">
                <!-- svelte-ignore a11y-missing-attribute -->
                <img src="/icons/list.svg" role="presentation" />
                <span class="font-bold">
                  {listText}
                </span>
              </div>
            {/if}
            {#if electionSymbol}
              <!-- TODO: Convert to <ElectionSymbol> component -->
              <span
                class="border-sm border-color-[var(--line-color)] rounded-sm border px-8 py-4 font-bold"
                >{electionSymbol}</span>
            {/if}
          </div>
        </div>
        <div class="flex flex-row">
          {#if summaryMatch}
            <!-- TODO: Convert to <MatchScore> component -->
            <div class="flex min-w-[3.125rem] flex-col items-center">
              <span class="text-lg font-bold">{summaryMatch}</span>
              <span class="text-xs text-secondary">{$_('components.card.matchLabel')}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
    {#if ranking?.subMatches && ranking.subMatches.length > 0}
      <div class="grid grid-flow-row grid-cols-3 gap-x-lg gap-y-14 lg:grid-cols-4">
        {#each ranking.subMatches as subMatch}
          <!-- TODO: replace the progressBarColor color with the color of the party -->
          <ScoreGauge
            score={subMatch.score}
            label={subMatch.questionGroup.label ?? ''}
            shape="linear" />
        {/each}
      </div>
    {/if}
  </header>
  <!-- {#} -->
  <!-- TODO Convert Tabs to a component that handles switching and accepts tab components
    in slots -->
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeItem} />
  {#if tabs[0] === activeItem}
    <CandidateBasicInfo {candidate} />
  {:else if tabs[1] === activeItem}
    <CandidateOpinions {candidate} {questions} />
  {/if}
</article>
