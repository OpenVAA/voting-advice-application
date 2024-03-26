<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {candidateRankings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageData} from './$types';

  export let data: PageData;

  let candidateId: string;
  let questions: QuestionProps[];
  let infoQuestions: QuestionProps[];
  let ranking: RankingProps<CandidateProps> | undefined;

  $: {
    candidateId = data.candidateId;
    questions = data.questions;
    infoQuestions = data.infoQuestions;
    ranking = $candidateRankings.find((r) => r.entity.id == candidateId);
  }
</script>

{#if ranking}
  <SingleCardPage title={ranking.entity.name}>
    <Button
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Results)}
      text={$t('header.back')} />
    <EntityDetails {ranking} opinionQuestions={questions} {infoQuestions} />
  </SingleCardPage>
{/if}
