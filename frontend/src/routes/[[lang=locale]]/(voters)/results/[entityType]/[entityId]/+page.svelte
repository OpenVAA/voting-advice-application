<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, referredByUs, Route} from '$lib/utils/navigation';
  import {candidateRankings, partyRankings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Loading} from '$lib/components/loading';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {Readable} from 'svelte/store';

  export let data;

  let id: string;
  let entity: Promise<WrappedEntity | undefined>;
  let questions: QuestionProps[];
  let infoQuestions: QuestionProps[];
  let title = '';
  let entities: Readable<Promise<WrappedEntity[]>>;

  $: {
    id = data.entityId;
    questions = data.questions;
    infoQuestions = data.infoQuestions;
    switch (data.entityType) {
      case 'candidate':
        entities = candidateRankings;
        break;
      case 'party':
        entities = partyRankings;
        break;
      default:
        error(404, `Unknown entity type ${data.entityType}`);
    }
    entity = $entities.then((d) => {
      const res = d.find((r) => r.entity.id == id);
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
  {#await entity}
    <Loading showLabel />
  {:then content}
    {#if content}
      <EntityDetails {content} opinionQuestions={questions} {infoQuestions} />
    {:else}
      {error(404, `Entity ${data.entityType}:${data.entityId} not found`)}
    {/if}
  {/await}
</SingleCardPage>
