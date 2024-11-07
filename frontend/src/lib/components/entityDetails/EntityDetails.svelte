<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { EntityCard, type EntityCardProps } from '$lib/components/entityCard';
  import { Tabs } from '$lib/components/tabs';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { settings } from '$lib/stores';
  import { startEvent } from '$lib/utils/analytics/track';
  import { concatClass } from '$lib/utils/components';
  import { getEntityType, parseMaybeRanked } from '$lib/utils/entities';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import { EntityInfo, EntityOpinions, EntitySubentities } from './';
  import type { EntityDetailsProps } from './EntityDetails.type';

  type $$Props = EntityDetailsProps;

  export let content: $$Props['content'];
  export let infoQuestions: $$Props['infoQuestions'];
  export let opinionQuestions: $$Props['opinionQuestions'];
  export let subentities: $$Props['subentities'] = undefined;

  let entity: EntityProps;
  let entityType: EntityType | undefined;
  let subcards: Array<EntityCardProps> | undefined;
  /** The tab content types */
  let tabContents: Array<AppSettingsEntityDetailsContent>;
  /** The matching tab labels */
  let tabs: Array<string>;
  /** The currently active tab */
  let activeIndex = 0;
  /** Info questions filtered for the current entity type */
  let filteredInfoQuestions: $$Props['infoQuestions'];
  /** Opinion questions filtered for the current entity type */
  let filteredOpinionQuestions: $$Props['opinionQuestions'];

  $: {
    ({ entity } = parseMaybeRanked(content));
    entityType = getEntityType(entity);
    if (!entityType) error(500, 'Unknown entity type');
    function inclQuestion(q: QuestionProps) {
      return !q.entityType || q.entityType === entityType || q.entityType === 'all';
    }
    filteredInfoQuestions = infoQuestions.filter(inclQuestion);
    filteredOpinionQuestions = opinionQuestions.filter(inclQuestion);
    tabContents = [];
    for (const c of $settings.entityDetails.contents[entityType]) {
      switch (c) {
        case 'info':
          tabContents.push('info');
          break;
        case 'opinions':
          if (filteredOpinionQuestions.length) tabContents.push('opinions');
          break;
        case 'candidates':
          if (!subentities?.length) break;
          tabContents.push('candidates');
          subcards = subentities.map((e) => ({
            content: e,
            action: $getRoute({ route: ROUTE.ResultCandidate, id: parseMaybeRanked(e).entity.id })
          }));
          break;
        default:
          error(500, `Unknown tab content ${c}`);
      }
    }
    tabs = tabContents.map((c) => $t(assertTranslationKey(`entityDetails.tabs.${c}`)));
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

### Tracking events

- `entityDetails_changeTab`: Fired when the user changes the active tab. Has a `section` property with the name of the tab.

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

<article {...concatClass($$restProps, 'flex flex-col grow')}>
  <!-- Add a border if there's not need for a Tabs component which separates the contents visually from the header -->
  <header class:bottomBorder={tabContents.length === 1}>
    <EntityCard {content} context="details" class="!p-lg" />
  </header>
  {#if tabContents.length > 1}
    <Tabs
      {tabs}
      bind:activeIndex
      on:change={({ detail }) => startEvent('entityDetails_changeTab', { section: tabContents[detail.index] })} />
    {#if activeIndex === tabContents.indexOf('info')}
      <EntityInfo {entity} questions={filteredInfoQuestions} />
    {:else if activeIndex === tabContents.indexOf('opinions')}
      <EntityOpinions {entity} questions={filteredOpinionQuestions} />
    {:else if activeIndex === tabContents.indexOf('candidates') && subcards}
      <EntitySubentities {subcards} />
    {/if}
  {:else if tabContents[0] === 'info'}
    <EntityInfo {entity} questions={filteredInfoQuestions} />
  {:else if tabContents[0] === 'opinions'}
    <EntityOpinions {entity} questions={filteredOpinionQuestions} />
  {/if}
</article>

<style lang="postcss">
  .bottomBorder {
    /* after: is a valid prefix */
    @apply relative after:absolute after:bottom-0 after:left-lg after:right-lg after:border-b-md after:border-b-[var(--line-color)] after:content-[''];
  }
</style>
