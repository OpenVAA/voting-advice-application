<!--
@component
Used to show an entity's details, possibly including their answers to `info` questions, `opinion` questions and their child nominations. You can supply either a naked entity or a ranking containing an entity.

If the provided entity is a (possibly matched) nomination, the questions to include will be those applicable to the election and constiuency of the nomination.

If `AppContext.$appType` is `voter`, the voter’s possible answers will included in the `opinions` tab.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- Any valid attributes of an `<article>` element.

### Tracking events

- `entityDetails_changeTab`: Fired when the user changes the active tab. Has a `section` property with the name of the tab.

### Usage

```tsx
<EntityDetails 
  entity={matchedCandidate}/>
<EntityDetails 
  entity={matchedOrganization}
  tabs={$appSettings.entityDetails.contents.organization}/>
```
-->

<script lang="ts">
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { Tabs, type Tab } from '$lib/components/tabs';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { concatClass } from '$lib/utils/components';
  import { EntityInfo, EntityOpinions, EntityChildren } from './';
  import type { EntityDetailsProps } from './EntityDetails.type';
  import { getAppContext } from '$lib/contexts/app';
  import type { EntityDetailsContent, OrganizationDetailsContent } from '@openvaa/app-shared';
  import { unwrapEntity } from '$lib/utils/entities';
  import { ENTITY_TYPE, OrganizationNomination, type AnyQuestionVariant } from '@openvaa/data';
  import type { AnswerStore } from '$lib/contexts/voter';
  import { getVoterContext } from '$lib/contexts/voter';
  import { findCandidateNominations } from '$lib/utils/matches';
  import type { MatchTree } from '$lib/contexts/voter/matchStore';
  import type { Readable } from 'svelte/store';

  type $$Props = EntityDetailsProps;

  export let entity: $$Props['entity'];

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appType, startEvent, t } = getAppContext();
  let answers: AnswerStore | undefined;
  let matches: Readable<MatchTree> | undefined;
  if ($appType === 'voter') {
    const context = getVoterContext();
    answers = context.answers;
    matches = context.matches;
  }

  ////////////////////////////////////////////////////////////////////
  // Define tab contents
  ////////////////////////////////////////////////////////////////////

  /** For use with the `Tabs` component */
  type ContentTab = { content: EntityDetailsContent | OrganizationDetailsContent; label: string };

  /** The currently active tab */
  let activeIndex = 0;
  /** The tab content types */
  let contentTabs: Array<ContentTab>;
  // The properties to pass to the different tabs
  let children: Array<MaybeWrappedEntityVariant>;
  let infoQuestions: Array<AnyQuestionVariant>;
  let opinionQuestions: Array<AnyQuestionVariant>;
  
  $: {
    const { entity: nakedEntity, nomination } = unwrapEntity(entity);

    // Possibly use defaults based on entity type
    const tabs: Array<EntityDetailsContent | OrganizationDetailsContent> = nakedEntity.type === 'organization' ? ['info', 'opinions', 'candidates'] : ['info', 'opinions'];
    contentTabs = tabs.map((tab) => ({
      content: tab, label: $t(assertTranslationKey(`entityDetails.tabs.${tab}`))
    }));

    // Collect questions
    if (tabs.includes('info') || tabs.includes('opinions')) {
      // If we're showing a nominated entity, we show the questions applicable to the election and constituency, otherwise default to all questions the entity has answered
      const questions = nomination
        ? nomination.applicableQuestions
        : nakedEntity.answeredQuestions;
      infoQuestions = questions.filter((q) => q.category.type !== 'opinion');
      opinionQuestions = questions.filter((q) => q.category.type === 'opinion');
    } else {
      infoQuestions = [];
      opinionQuestions = [];
    }

    // Collect child nominations if applicable
    if (tabs.includes('candidates') && nomination && nomination instanceof OrganizationNomination)
      children = findCandidateNominations({ matches: matches ? $matches : undefined, nomination });
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  function handleContentTabChange({ tab }: { tab: Tab }): void {
    startEvent('entityDetails_changeTab', { section: (tab as ContentTab).content });
  }
</script>

<article {...concatClass($$restProps, 'flex flex-col grow')}>

  <!-- Add a border if there's not need for a Tabs component which separates the contents visually from the header -->
  <header class:bottomBorder={contentTabs.length === 1}>
    <EntityCard {entity} variant="details" class="!p-lg" />
  </header>

  {#if contentTabs.length > 1}
    <Tabs
      tabs={contentTabs}
      bind:activeIndex={activeIndex}
      onChange={handleContentTabChange}
      class="px-10" />
  {/if}

  {#if contentTabs[activeIndex]?.content === 'info'}
    <EntityInfo {entity} questions={infoQuestions} />
  {:else if contentTabs[activeIndex]?.content === 'opinions'}
    <EntityOpinions {entity} questions={opinionQuestions} {answers} />
  {:else if contentTabs[activeIndex]?.content === 'candidates'}
    <EntityChildren entities={children} entityType={ENTITY_TYPE.Candidate} />
  {/if}
</article>

<style lang="postcss">
  .bottomBorder {
    /* after: is a valid prefix */
    @apply relative after:absolute after:bottom-0 after:left-lg after:right-lg after:border-b-md after:border-b-[var(--line-color)] after:content-[''];
  }
</style>
