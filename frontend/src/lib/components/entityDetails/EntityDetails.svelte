<script lang="ts">
  import {t} from '$lib/i18n';
  import {parseMaybeRanked} from '$lib/utils/entities';
  import {EntityCard} from '$lib/components/entityCard';
  import {Tabs} from '$lib/components/tabs';
  import EntityInfo from './EntityInfo.svelte';
  import EntityOpinions from './EntityOpinions.svelte';
  import type {EntityDetailsProps} from './EntityDetails.type';

  type $$Props = EntityDetailsProps;

  export let content: $$Props['content'];
  export let infoQuestions: $$Props['infoQuestions'];
  export let opinionQuestions: $$Props['opinionQuestions'];

  let entity: EntityProps;
  let tabs: string[];
  let activeIndex = 0;

  $: {
    ({entity} = parseMaybeRanked(content));
    tabs = [$t('entity.tabs.basicInfo'), $t('entity.tabs.opinions')];
  }
</script>

<!--
@component
Used to show an entity's details and possible ranking. You can supply either a naked entity or a ranking containing an entity.

### Properties

- `content`: A possibly ranked entity, e.g. candidate or a party.
- `infoQuestions`: The list of Question objects to use show in the basic (non-opinion) information tab
- `opinionQuestions`: The list of Question objects to show on the opinions tab
- Any valid attributes of an `<article>` element.

### Usage

```tsx
<EntityDetails 
  content={candidateRanking}
  opinionQuestions={questions} 
  infoQuestions={infoQuestions}/>
<EntityDetails 
  content={partyProps}
  opinionQuestions={questions} 
  infoQuestions={infoQuestions}/>
```
-->

<article {...$$restProps}>
  <header>
    <EntityCard {content} context="details" class="!p-lg" />
  </header>
  <Tabs {tabs} bind:activeIndex />
  {#if activeIndex === 0}
    <EntityInfo {entity} questions={infoQuestions} />
  {:else if activeIndex === 1}
    <EntityOpinions {entity} questions={opinionQuestions} />
  {/if}
</article>
