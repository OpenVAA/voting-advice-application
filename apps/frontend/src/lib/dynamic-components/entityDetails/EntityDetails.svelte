<!--
@component Used to show an entity's details, possibly including their answers to `info` questions, `opinion` questions and their child nominations. You can supply either a naked entity or a ranking containing an entity.

If the provided entity is a (possibly matched) nomination, the questions to include will be those applicable to the election and constituency of the nomination.

If `AppContext.appType` is `voter`, the voter's possible answers are included in the `opinions` tab.

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
<EntityDetails entity={matchedOrganization}/>
```
-->

<script lang="ts">
  import { ENTITY_TYPE, isObjectType, OBJECT_TYPE } from '@openvaa/data';
  import { Tabs } from '$lib/components/tabs';
  import { getAppContext } from '$lib/contexts/app';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { cn, concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { getAllianceSummary } from '$lib/utils/getAllianceSummary';
  import { findCandidateNominations, findOrganizationNominations } from '$lib/utils/matches';
  import { sortQuestions } from '$lib/utils/sorting';
  import { EntityChildren, EntityInfo, EntityOpinions } from './';
  import type { CustomData, EntityDetailsContent, ParentEntityDetailsContent } from '@openvaa/app-shared';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { AnswerState } from '$lib/contexts/voter';
  import type { VoterContext } from '$lib/contexts/voter/voterContext.type';
  import type { EntityDetailsProps } from './EntityDetails.type';

  let { entity, ...restProps }: EntityDetailsProps = $props();

  const ctx = getAppContext();
  const { appType, startEvent, t } = ctx;
  // appSettings is a reactive accessor — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
  // appType is determined at app boot and does not change at runtime; we read it once at init to decide whether voter context is available.
  // `answers` is consumed in the template so it must be in the reactive graph — declare with $state.
  let voterContext: VoterContext | undefined;
  let answers: AnswerState | undefined = $state(undefined);
  if (appType.current === 'voter') {
    voterContext = getVoterContext();
    answers = voterContext.answers;
  }

  type ContentTab = { id: EntityDetailsContent | ParentEntityDetailsContent; label: string };

  let activeTab = $state<string>();

  let contentTabs: Array<ContentTab> = $derived.by(() => {
    const { entity: nakedEntity } = unwrapEntity(entity);
    // cardContents.alliance / entityDetails.contents.alliance are typed as optional in @openvaa/app-shared, so the indexed access can yield `undefined` when the alliance entry is missing from the active settings.
    // The `!tabs?.length` guard already handles undefined at runtime.
    let tabs: Array<EntityDetailsContent | ParentEntityDetailsContent> | undefined =
      appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
    if (!tabs?.length)
      tabs =
        nakedEntity.type === 'alliance'
          ? ['info', 'children']
          : nakedEntity.type === 'organization'
            ? ['info', 'opinions', 'children']
            : ['info', 'opinions'];
    return tabs.map((tab) => ({ id: tab, label: t(`entityDetails.tabs.${tab}`) }));
  });

  // `Tabs` shows the first tab when `activeTab` matches none, e.g. after the drawer swaps to an entity without that tab.
  const activeContent = $derived(contentTabs.find((tab) => tab.id === activeTab)?.id ?? contentTabs[0]?.id);

  let children: Array<MaybeWrappedEntityVariant> = $derived.by(() => {
    const { nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.id);
    if (tabs.includes('children')) {
      if (isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
        return findCandidateNominations({ matches: voterContext?.matches, nomination });
      if (isObjectType(nomination, OBJECT_TYPE.AllianceNomination))
        return findOrganizationNominations({ matches: voterContext?.matches, nomination });
    }
    return [];
  });

  // Alliance drawer-header "X candidates across N parties" summary
  let allianceSummary: { numCandidates: number; numParties: number } | undefined = $derived.by(() => {
    const { nomination } = unwrapEntity(entity);
    if (isObjectType(nomination, OBJECT_TYPE.AllianceNomination)) {
      return getAllianceSummary(nomination);
    }
    return undefined;
  });

  let infoQuestions: Array<AnyQuestionVariant> = $derived.by(() => {
    const { entity: nakedEntity, nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.id);
    if (tabs.includes('info') || tabs.includes('opinions')) {
      let questions = nomination ? nomination.applicableQuestions : nakedEntity.answeredQuestions;
      questions = questions.filter((q) => !(q.customData as CustomData['Question'])?.hidden);
      return sortQuestions(questions.filter((q) => q.category.type !== 'opinion'));
    }
    return [];
  });

  let opinionQuestions: Array<AnyQuestionVariant> = $derived.by(() => {
    const { entity: nakedEntity, nomination } = unwrapEntity(entity);
    const tabs = contentTabs.map((ct) => ct.id);
    if (tabs.includes('info') || tabs.includes('opinions')) {
      let questions = nomination ? nomination.applicableQuestions : nakedEntity.answeredQuestions;
      questions = questions.filter((q) => !(q.customData as CustomData['Question'])?.hidden);
      return sortQuestions(questions.filter((q) => q.category.type === 'opinion'));
    }
    return [];
  });

  function handleContentTabChange(tab: ContentTab): void {
    startEvent('entityDetails_changeTab', { section: tab.id });
  }
</script>

<article data-testid="entity-details" {...concatClass(restProps, 'flex flex-col grow')}>
  <header
    class={cn(
      contentTabs.length === 1 &&
        "after:right-lg after:left-lg after:border-b-md relative after:absolute after:bottom-0 after:border-b-[var(--line-color)] after:content-['']"
    )}>
    <EntityCard {entity} variant="details" class="!p-lg" />
    {#if allianceSummary}
      <p class="text-secondary mx-md mt-sm text-sm">
        {t('results.alliance.summary.template', {
          candidates: t('results.alliance.summary.candidates', { numCandidates: allianceSummary.numCandidates }),
          parties: t('results.alliance.summary.parties', { numParties: allianceSummary.numParties })
        })}
      </p>
    {/if}
  </header>
  {#if contentTabs.length > 1}
    <!-- bind: keep — Tabs.activeTab is $bindable -->
    <!-- transitionOnChange: the drawer tabs switch by local state, not by navigation, so the root layout's onNavigate view-transition hook never fires for them; the local startViewTransition wrapper cross-fades the tab content under the same shouldAnimate gate. -->
    <Tabs
      tabs={contentTabs}
      bind:activeTab
      onChange={handleContentTabChange}
      transitionOnChange
      class="px-10"
      style="view-transition-name: entity-detail-tabs" />
  {/if}
  {#if activeContent === 'info'}
    <div data-testid="voter-entity-detail-info"><EntityInfo {entity} questions={infoQuestions} /></div>
  {:else if activeContent === 'opinions'}
    <div data-testid="voter-entity-detail-opinions">
      <EntityOpinions {entity} questions={opinionQuestions} {answers} />
    </div>
  {:else if activeContent === 'children'}
    <div data-testid="voter-entity-detail-children">
      <EntityChildren
        entities={children}
        entityType={isObjectType(unwrapEntity(entity).nomination, OBJECT_TYPE.AllianceNomination)
          ? ENTITY_TYPE.Organization
          : ENTITY_TYPE.Candidate} />
    </div>
  {/if}
</article>
