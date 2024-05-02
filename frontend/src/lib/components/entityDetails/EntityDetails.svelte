<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {getEntityType, parseMaybeRanked} from '$lib/utils/entities';
  import {settings} from '$lib/utils/stores';
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
  let tabContents: AppSettingsEntityDetailsContent[];
  /** The tab labels */
  let tabs: string[];
  /** The currently active tab */
  let activeIndex = 0;
  let entityType: EntityType | undefined;

  $: {
    ({entity} = parseMaybeRanked(content));
    entityType = getEntityType(entity);
    if (!entityType) error(500, 'Unknown entity type');
    tabContents = $settings.entityDetails.contents[entityType];
    tabs = tabContents.map((c) => $t(`components.entityDetails.tabs.${c}`));
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
  {#if tabContents.length > 1}
    <Tabs {tabs} bind:activeIndex />
    {#if activeIndex === tabContents.indexOf('info')}
      <EntityInfo {entity} questions={infoQuestions} />
    {:else if activeIndex === tabContents.indexOf('opinions')}
      <EntityOpinions {entity} questions={opinionQuestions} />
    {/if}
  {:else if tabContents[0] === 'info'}
    <EntityInfo {entity} questions={infoQuestions} />
  {:else if tabContents[0] === 'opinions'}
    <EntityInfo {entity} questions={infoQuestions} />
  {:else}
    {error(500, `Unknown tab content: ${tabContents[0]}`)}
  {/if}
</article>
