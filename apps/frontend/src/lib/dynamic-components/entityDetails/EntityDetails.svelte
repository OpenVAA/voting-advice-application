<!--
@component
Used to show an entity's details, possibly including their answers to `info` questions, `opinion` questions and their child nominations. You can supply either a naked entity or a ranking containing an entity.

If the provided entity is a (possibly matched) nomination, the questions to include will be those applicable to the election and constiuency of the nomination.

If `AppContext.$appType` is `voter`, the voter's possible answers will included in the `opinions` tab.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- Any valid attributes of an `<article>` element.

### Tracking events

- `entityDetails_changeTab`: Fired when the user changes the active tab. Has a `section` property with the name of the tab.

### Usage

```tsx
<EntityDetails entity={matchedCandidate}/>
<EntityDetails entity={matchedOrganization} tabs={$appSettings.entityDetails.contents.organization}/>
```
-->

<script lang="ts">
  import { ENTITY_TYPE, isObjectType, OBJECT_TYPE } from '@openvaa/data';
  import { Tabs } from '$lib/components/tabs';
  import { getAppContext } from '$lib/contexts/app';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { findCandidateNominations } from '$lib/utils/matches';
  import { sortQuestions } from '$lib/utils/sorting';
  import { EntityChildren, EntityInfo, EntityOpinions } from './';
  import type { CustomData, EntityDetailsContent, OrganizationDetailsContent } from '@openvaa/app-shared';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { Tab } from '$lib/components/tabs';
  import type { AnswerStore } from '$lib/contexts/voter';
  import type { MatchTree } from '$lib/contexts/voter/matchStore.svelte';
  import type { VoterContext } from '$lib/contexts/voter/voterContext.type';
  import type { EntityDetailsProps } from './EntityDetails.type';

  let { entity, ...restProps }: EntityDetailsProps = $props();

  const { appSettings, appType, startEvent, t } = getAppContext();
  let voterContext: VoterContext | undefined;
  let answers: AnswerStore | undefined;
  if ($appType === 'voter') {
    voterContext = getVoterContext();
    answers = voterContext.answers;
  }

  type ContentTab = { content: EntityDetailsContent | OrganizationDetailsContent; label: string };

  let activeIndex = $state(0);

  let contentTabs: Array<ContentTab> = $derived.by(() => {
    const { entity: nakedEntity } = unwrapEntity(entity);
    let tabs: Array<EntityDetailsContent | OrganizationDetailsContent> =
      $appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
    if (!tabs?.length)
      tabs = nakedEntity.type === 'organization' ? ['info', 'opinions', 'candidates'] : ['info', 'opinions'];
    return tabs.map((tab) => ({ content: tab, label: t(`entityDetails.tabs.${tab}`) }));
  });

  let children: Array<MaybeWrappedEntityVariant> = $derived.by(() => {
    const { nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.content);
    if (tabs.includes('candidates') && isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
      return findCandidateNominations({ matches: voterContext?.matches, nomination });
    return [];
  });

  let infoQuestions: Array<AnyQuestionVariant> = $derived.by(() => {
    const { entity: nakedEntity, nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.content);
    if (tabs.includes('info') || tabs.includes('opinions')) {
      let questions = nomination ? nomination.applicableQuestions : nakedEntity.answeredQuestions;
      questions = questions.filter((q) => !(q.customData as CustomData['Question'])?.hidden);
      return sortQuestions(questions.filter((q) => q.category.type !== 'opinion'));
    }
    return [];
  });

  let opinionQuestions: Array<AnyQuestionVariant> = $derived.by(() => {
    const { entity: nakedEntity, nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.content);
    if (tabs.includes('info') || tabs.includes('opinions')) {
      let questions = nomination ? nomination.applicableQuestions : nakedEntity.answeredQuestions;
      questions = questions.filter((q) => !(q.customData as CustomData['Question'])?.hidden);
      return sortQuestions(questions.filter((q) => q.category.type === 'opinion'));
    }
    return [];
  });

  function handleContentTabChange({ tab }: { tab: Tab }): void {
    startEvent('entityDetails_changeTab', { section: (tab as ContentTab).content });
  }
</script>

<article data-testid="entity-details" {...concatClass(restProps, 'flex flex-col grow')}>
  <header class:bottomBorder={contentTabs.length === 1}>
    <EntityCard {entity} variant="details" class="!p-lg" />
  </header>
  {#if contentTabs.length > 1}
    <Tabs tabs={contentTabs} bind:activeIndex onChange={handleContentTabChange} class="px-10" />
  {/if}
  {#if contentTabs[activeIndex]?.content === 'info'}
    <div data-testid="voter-entity-detail-info"><EntityInfo {entity} questions={infoQuestions} /></div>
  {:else if contentTabs[activeIndex]?.content === 'opinions'}
    <div data-testid="voter-entity-detail-opinions">
      <EntityOpinions {entity} questions={opinionQuestions} {answers} />
    </div>
  {:else if contentTabs[activeIndex]?.content === 'candidates'}
    <div data-testid="voter-entity-detail-submatches">
      <EntityChildren entities={children} entityType={ENTITY_TYPE.Candidate} />
    </div>
  {/if}
</article>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .bottomBorder {
    @apply after:left-lg after:right-lg after:border-b-md relative after:absolute after:bottom-0 after:border-b-[var(--line-color)] after:content-[''];
  }
</style>
