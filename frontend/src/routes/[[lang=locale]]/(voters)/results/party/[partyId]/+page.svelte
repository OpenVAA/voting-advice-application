<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, referredByUs, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  // import {EntityDetails} from '$lib/components/entityDetails';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageData} from './$types';

  export let data: PageData;

  let partyId: string;
  let title: string;
  $: {
    partyId = data.partyId;
    title = `Not implemented yet • PartyId: ${partyId}`;
  }

  // let ranking: RankingProps<PartyId> | undefined;

  // onMount(() => {
  //   // First, check if we have a ranking for the candidate,
  //   // which contains the Candidate object
  //   if ($candidateRankings.length > 0)
  //     ranking = $candidateRankings.find(r => r.entity.id == candidateId);
  //   // If not, switch to the candidates route
  //   if (!ranking)
  //     goto(getRoute({route: Route.Candidate, id: candidateId}));
  // });
</script>

<SingleCardPage {title}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    on:click={() => (referredByUs() ? history.back() : goto($getRoute(Route.Results)))}
    text={$t('header.back')} />
  <h1>{title}</h1>
  <!-- <EntityDetails {ranking} opinionQuestions={questions} {infoQuestions} /> -->
</SingleCardPage>
