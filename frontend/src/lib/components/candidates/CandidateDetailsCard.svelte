<script lang="ts">
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import Tabs from '$lib/components/shared/Tabs.svelte';
  import {ScoreGauge} from '$lib/components/scoreGauge/index';
  import CandidateBasicInfo from './CandidateBasicInfo.svelte';
  import CandidateOpinions from './CandidateOpinions.svelte';
  import CandidatePhoto from '$lib/components/candidates/CandidatePhoto.svelte';

  /** The Candidate object */
  export let candidate: CandidateProps;
  /** The list of Question objects to use for showing for on the basic (non-opinion) information tab */
  export let infoQuestions: QuestionProps[];
  /** The list of Question objects to use for showing for on the opinions tab */
  export let opinionQuestions: QuestionProps[];
  /** An optional Ranking object used for showing the Candidate's match with the Voter */
  export let ranking: RankingProps | undefined = undefined;
  /** An optional props to define wether component is used on the candidate or voter's side*/
  export let candidateView: CandidateDetailsCardProps['candidateView'] = false;

  // Tabs
  let tabs: string[];
  let activeItem: string;
  $: {
    tabs = [$t('candidate.tabs.basicInfo'), $t('candidate.tabs.opinions')];
    activeItem = tabs[0];
  }
  const handleChangeTab = (e: CustomEvent) => {
    activeItem = e.detail;
  };
</script>

<!--
@component
Used to show a Candidate's details.

TODO: This component is still a work in progress and does not follow the property passing conventions of mature components.

### Properties

- `candidate`: The Candidate object
- `infoQuestions`: The list of Question objects to use for showing for on the basic (non-opinion) information tab
- `opinionQuestions`: The list of Question objects to use for showing for on the opinions tab
- `ranking`: An optional Ranking object used for showing the Candidate's match with the Voter

### Usage

```tsx
<CandidateDetailsCard 
  candidate={candidateProps}
  opinionQuestions={questions} 
  infoQuestions={infoQuestions} 
  ranking={candidateRanking}/>
```
-->

<article>
  <!-- TODO: replace the following div tag with the EntityCard component -->
  <header class="p-lg">
    <div class="flex items-center justify-center">
      <CandidatePhoto
        photoURL={candidate.photoURL}
        title={GetFullNameInOrder(candidate.firstName, candidate.lastName)}
        imgWidth={128} />
      <div class="flex-auto">
        <h1>
          {GetFullNameInOrder(candidate.firstName, candidate.lastName)}
        </h1>
        <p class="text-center">
          <span class="p-1 badge-md rounded-sm bg-secondary text-white"
            >{candidate.party.shortName}</span>
          {#if ranking}<span class="px-3 text-lg">{ranking}</span>{/if}
        </p>
      </div>
    </div>
    {#if ranking?.subMatches && ranking.subMatches.length > 0}
      <div class="mt-md grid grid-flow-row grid-cols-3 gap-x-lg gap-y-14 py-sm lg:grid-cols-4">
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
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeItem} />
  {#if tabs[0] === activeItem}
    <CandidateBasicInfo {candidate} questions={infoQuestions} />
  {:else if tabs[1] === activeItem}
    <CandidateOpinions {candidate} questions={opinionQuestions} {candidateView} />
  {/if}
</article>
