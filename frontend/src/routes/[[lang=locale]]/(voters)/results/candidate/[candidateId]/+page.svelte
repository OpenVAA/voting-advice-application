<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, referredByUs, Route} from '$lib/utils/navigation';
  import {candidateRankings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Loading} from '$lib/components/loading';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageData} from './$types';

  export let data: PageData;

  let candidateId: string;
  let questions: QuestionProps[];
  let infoQuestions: QuestionProps[];
  let candidate: Promise<WrappedEntity<CandidateProps> | undefined>;
  let title = '';

  $: {
    candidateId = data.candidateId;
    questions = data.questions;
    infoQuestions = data.infoQuestions;
    candidate = $candidateRankings.then((d) => {
      const res = d.find((r) => r.entity.id == candidateId);
      if (res) title = res.entity.name;
      return res;
    });
  }
</script>

<SingleCardPage {title}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    on:click={() => (referredByUs() ? history.back() : goto($getRoute(Route.Results)))}
    text={$t('header.back')} />
  {#await candidate}
    <Loading showLabel />
  {:then content}
    {#if content}
      <EntityDetails {content} opinionQuestions={questions} {infoQuestions} />
    {:else}
      {error(404, 'Candidate not found')}
    {/if}
  {/await}
</SingleCardPage>
