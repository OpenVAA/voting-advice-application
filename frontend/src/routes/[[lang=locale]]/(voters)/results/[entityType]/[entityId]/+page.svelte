<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {afterNavigate, goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {candidateRankings, partyRankings, settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Loading} from '$lib/components/loading';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {Readable} from 'svelte/store';

  export let data;

  let entityType: EntityType;
  let id: string;
  /** A party's candidates for displaying on a separate tab in EntityDetails or undefined if not applicable */
  let candidatesOrUndef: Promise<WrappedEntity[] | undefined>;
  let entity: Promise<WrappedEntity | undefined>;
  let questions: QuestionProps[];
  let infoQuestions: QuestionProps[];
  let title = '';
  let entities: Readable<Promise<WrappedEntity[]>>;

  $: {
    id = data.entityId;
    entityType = data.entityType as EntityType;
    ({questions, infoQuestions} = data);
    switch (entityType) {
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
    if ($settings.entityDetails.contents[entityType].includes('candidates')) {
      if (entityType !== 'party')
        error(500, `Entity type ${entityType} can not have 'candidates' in EntityDetails`);
      candidatesOrUndef = $candidateRankings.then((d) => {
        const res = d.filter((c) => c.entity.party?.id == id);
        return res.length ? res : undefined;
      });
    } else {
      candidatesOrUndef = Promise.resolve(undefined);
    }
  }

  /**
   * We use this to determine if we arrived via an external link or from within the app.
   */
  let externalReferrer = true;
  afterNavigate((n) => (externalReferrer = n.from?.route == null));
</script>

<SingleCardPage {title}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    on:click={() => (externalReferrer ? goto($getRoute(Route.Results)) : history.back())}
    text={$t('header.back')} />
  {#await Promise.all([entity, candidatesOrUndef])}
    <Loading showLabel />
  {:then [content, subentities]}
    {#if content}
      <EntityDetails {content} {subentities} opinionQuestions={questions} {infoQuestions} />
    {:else}
      {error(404, `Entity ${entityType}:${id} not found`)}
    {/if}
  {/await}
</SingleCardPage>
