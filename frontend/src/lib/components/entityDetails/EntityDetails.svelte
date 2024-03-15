<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {EntityCard, type EntityCardProps} from '$lib/components/entityCard';
  import Tabs from '$lib/components/shared/Tabs.svelte';
  import EntityInfo from './EntityInfo.svelte';
  import EntityOpinions from './EntityOpinions.svelte';
  import type {EntityDetailsProps} from './EntityDetails.type';

  type $$Props = EntityDetailsProps;

  export let entity: $$Props['entity'] = undefined;
  export let ranking: $$Props['ranking'] = undefined;
  export let infoQuestions: $$Props['infoQuestions'];
  export let opinionQuestions: $$Props['opinionQuestions'];

  let tabs: string[];
  let activeIndex = 0;

  // We need these typed vars to ward off typing errors
  let sureEntity: EntityProps;
  let ecProps: EntityCardProps;

  $: {
    if (ranking) {
      entity = ranking.entity;
    } else if (!entity) {
      throw error(500, 'Supply either entity or ranking.');
    }
    sureEntity = entity as EntityProps;
    ecProps = ranking ? {ranking} : {entity: sureEntity};
    tabs = [$t('entity.tabs.basicInfo'), $t('entity.tabs.opinions')];
  }

  const handleChangeTab = (e: CustomEvent) => {
    activeIndex = e.detail;
  };
</script>

<!--
@component
Used to show an entity's details and possible ranking. You can supply either an unranked `entity` a `ranking`, which contains the entity.

### Properties

- `entity`: A candidate or a party if no rankings are available.
- `ranking`: A ranked entity, i.e. a candidate or a party.
- `infoQuestions`: The list of Question objects to use show in the basic (non-opinion) information tab
- `opinionQuestions`: The list of Question objects to show on the opinions tab
- `ranking`: An optional Ranking object used for showing the Candidate's match with the Voter

### Usage

```tsx
<EntityDetails 
  ranking={candidateRanking}
  opinionQuestions={questions} 
  infoQuestions={infoQuestions}/>
<EntityDetails 
  entity={partyProps}
  opinionQuestions={questions} 
  infoQuestions={infoQuestions}/>
```
-->

<article>
  <header>
    <EntityCard {...ecProps} context="details" class="!p-lg" />
  </header>
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeIndex} />
  {#if activeIndex === 0}
    <EntityInfo entity={sureEntity} questions={infoQuestions} />
  {:else if activeIndex === 1}
    <EntityOpinions entity={sureEntity} questions={opinionQuestions} />
  {/if}
</article>
