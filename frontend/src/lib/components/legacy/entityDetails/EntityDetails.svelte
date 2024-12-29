<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { EntityCard } from '../entityCard';
  import { Tabs } from '../tabs';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { concatClass } from '$lib/utils/components';
  import { getEntityType, parseMaybeRanked } from '$lib/utils/legacy-entities';
  import { EntityInfo, EntityOpinions } from './';
  import type { EntityDetailsProps } from './EntityDetails.type';

  type $$Props = EntityDetailsProps;

  export let content: $$Props['content'];
  export let infoQuestions: $$Props['infoQuestions'];
  export let opinionQuestions: $$Props['opinionQuestions'];

  let entity: LegacyEntityProps;
  let entityType: LegacyEntityType | undefined;
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
    function inclQuestion(q: LegacyQuestionProps) {
      return !q.entityType || q.entityType === entityType || q.entityType === 'all';
    }
    filteredInfoQuestions = infoQuestions.filter(inclQuestion);
    filteredOpinionQuestions = opinionQuestions.filter(inclQuestion);
    tabContents = ['info', 'opinions'];
    tabs = tabContents.map((c) => $t(assertTranslationKey(`entityDetails.tabs.${c}`)));
  }
</script>

<article {...concatClass($$restProps, 'flex flex-col grow')}>
  <!-- Add a border if there's not need for a Tabs component which separates the contents visually from the header -->
  <header class:bottomBorder={tabContents.length === 1}>
    <EntityCard {content} context="details" class="!p-lg" />
  </header>
  {#if tabContents.length > 1}
    <Tabs
      {tabs}
      bind:activeIndex />
    {#if activeIndex === tabContents.indexOf('info')}
      <EntityInfo {entity} questions={filteredInfoQuestions} />
    {:else if activeIndex === tabContents.indexOf('opinions')}
      <EntityOpinions {entity} questions={filteredOpinionQuestions} />
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
