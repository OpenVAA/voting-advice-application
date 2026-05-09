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
  import { getAllianceSummary } from '$lib/utils/getAllianceSummary';
  import { findCandidateNominations, findOrganizationNominations } from '$lib/utils/matches';
  import { sortQuestions } from '$lib/utils/sorting';
  import { EntityChildren, EntityInfo, EntityOpinions } from './';
  import type { CustomData, EntityDetailsContent, ParentEntityDetailsContent } from '@openvaa/app-shared';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { Tab } from '$lib/components/tabs';
  import type { AnswerStore } from '$lib/contexts/voter';
  import type { VoterContext } from '$lib/contexts/voter/voterContext.type';
  import type { EntityDetailsProps } from './EntityDetails.type';

  let { entity, ...restProps }: EntityDetailsProps = $props();

  const { appSettings, appType, startEvent, t } = getAppContext();
  // appType is determined at app boot and does not change at runtime; we
  // read it once at init to decide whether voter context is available.
  // `answers` is consumed in the template so it must be in the reactive
  // graph — declare with $state.
  let voterContext: VoterContext | undefined;
  let answers: AnswerStore | undefined = $state(undefined);
  if ($appType === 'voter') {
    voterContext = getVoterContext();
    answers = voterContext.answers;
  }

  type ContentTab = { content: EntityDetailsContent | ParentEntityDetailsContent; label: string };

  let activeIndex = $state(0);

  let contentTabs: Array<ContentTab> = $derived.by(() => {
    const { entity: nakedEntity } = unwrapEntity(entity);
    let tabs: Array<EntityDetailsContent | ParentEntityDetailsContent> =
      $appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
    if (!tabs?.length)
      tabs =
        nakedEntity.type === 'alliance'
          ? ['info', 'children']
          : nakedEntity.type === 'organization'
            ? ['info', 'opinions', 'children']
            : ['info', 'opinions'];
    return tabs.map((tab) => ({ content: tab, label: t(`entityDetails.tabs.${tab}`) }));
  });

  let children: Array<MaybeWrappedEntityVariant> = $derived.by(() => {
    const { nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.content);
    if (tabs.includes('children')) {
      if (isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
        return findCandidateNominations({ matches: voterContext?.matches, nomination });
      if (isObjectType(nomination, OBJECT_TYPE.AllianceNomination))
        return findOrganizationNominations({ matches: voterContext?.matches, nomination });
    }
    return [];
  });

  // Phase 69 D-04: alliance drawer-header "X candidates across N parties" summary
  let allianceSummary: { numCandidates: number; numParties: number } | undefined = $derived.by(() => {
    const { nomination } = unwrapEntity(entity);
    if (isObjectType(nomination, OBJECT_TYPE.AllianceNomination)) {
      return getAllianceSummary(nomination);
    }
    return undefined;
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
    {#if allianceSummary}
      <p class="text-sm text-secondary mx-md mt-sm">
        {t('results.alliance.summary', {
          numCandidates: allianceSummary.numCandidates,
          numParties: allianceSummary.numParties
        })}
      </p>
    {/if}
  </header>
  {#if contentTabs.length > 1}
    <!-- bind: keep — Pattern 2: Tabs.activeIndex is $bindable(0) -->
    <Tabs tabs={contentTabs} bind:activeIndex onChange={handleContentTabChange} class="px-10" />
  {/if}
  {#if contentTabs[activeIndex]?.content === 'info'}
    <div data-testid="voter-entity-detail-info"><EntityInfo {entity} questions={infoQuestions} /></div>
  {:else if contentTabs[activeIndex]?.content === 'opinions'}
    <div data-testid="voter-entity-detail-opinions">
      <EntityOpinions {entity} questions={opinionQuestions} {answers} />
    </div>
  {:else if contentTabs[activeIndex]?.content === 'children'}
    <div data-testid="voter-entity-detail-children">
      <EntityChildren
        entities={children}
        entityType={isObjectType(unwrapEntity(entity).nomination, OBJECT_TYPE.AllianceNomination)
          ? ENTITY_TYPE.Organization
          : ENTITY_TYPE.Candidate} />
    </div>
  {/if}
</article>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .bottomBorder {
    @apply after:left-lg after:right-lg after:border-b-md relative after:absolute after:bottom-0 after:border-b-[var(--line-color)] after:content-[''];
  }
</style>
