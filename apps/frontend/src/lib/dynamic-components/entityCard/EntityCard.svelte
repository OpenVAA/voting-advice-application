<!--@component
A card for displaying a possibly wrapped `Entity`, i.e. a candidate or a party, nomination thereof, or a match, in a list or as part of an `Entity`'s details, possibly including a matching score, sub-matches, nested `EntityCard`s and answers to specified questions.

In nested cards, the layout and rendering of contents varies from that of a parent card to make the layout more compact.
- Some elements are smaller and the title is rendered as `<h4>` instead of `<h3>`.
- The election symbol is shown next to the title.
- Nested nakedEntity cards are not rendered.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `action`: Custom action to take when the card is clicked, defaults to a link to the entity's `ResultEntity` route. If the card has subentites, the action will only be triggered by clicking the content above them.
- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `variant`: The context-dependend layout variant. Usually set automatically. Default: `'list'`
  - `'list'`: In a list of entities.
  - `'details'`: As part of the header of `EntityDetails`.
  - `'subcard'`: In a list of nested entity cards, e.g., the candidates for a party.
- `maxSubcards`: The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. Default: `3`
- `showElection`: Whether to show the possible nomination's election and constituency. Default: `false`
- Any valid attributes of an `<article>` element.

### Tracking events

- `entityCard_expandSubcards`: Fired when the list of sub-entities is expanded.

### Accessibility

- Currently, keyboard navigation is non-hierarchical even when subcards are present. In the future, this should be expanded into a more elaborate system where arrow keys or such can be used to navigate within a card with subcards.

### Usage

```tsx
<EntityCard action={$getRoute({route: 'ResultsCandidate', entityId: candidate.id})} 
  content={candidate}>
<EntityCard content={party} variant="details">
```
-->

<svelte:options runes />

<script lang="ts">
  import { ENTITY_TYPE, isObjectType, OBJECT_TYPE } from '@openvaa/data';
  import { Avatar } from '$lib/components/avatar';
  import { Button } from '$lib/components/button';
  import { ElectionSymbol } from '$lib/components/electionSymbol';
  import { EntityTag } from '$lib/components/entityTag';
  import { InfoAnswer } from '$lib/components/infoAnswer';
  import { MatchScore } from '$lib/components/matchScore';
  import { SubMatches } from '$lib/components/subMatches';
  import { getAppContext } from '$lib/contexts/app';
  import { getVoterContext } from '$lib/contexts/voter';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { getCardQuestions } from '$lib/utils/entityCards';
  import { findCandidateNominations } from '$lib/utils/matches';
  import EntityCard from './EntityCard.svelte';
  import EntityCardAction from './EntityCardAction.svelte';
  import type { AnyEntityVariant, AnyNominationVariant, AnyQuestionVariant } from '@openvaa/data';
  import type { InfoAnswerProps } from '$lib/components/infoAnswer';
  import type { EntityCardProps } from './EntityCard.type';

  let {
    action,
    entity,
    variant = 'list',
    maxSubcards = 3,
    showElection,
    children,
    ...restProps
  }: EntityCardProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, dataRoot, getRoute, startEvent, t } = getAppContext();
  const matches = $appType === 'voter' ? getVoterContext().matches : undefined;

  ////////////////////////////////////////////////////////////////////
  // Parse components, actions, subcards and questions
  ////////////////////////////////////////////////////////////////////

  type CardQuestions = Array<{
    question: AnyQuestionVariant;
    hideLabel?: boolean;
    format?: InfoAnswerProps['format'];
  }>;

  const baseId = getUUID();

  const parsed = $derived.by(() => {
    const unwrapped = unwrapEntity(entity);
    const { type, id } = unwrapped.entity;

    const elSym = unwrapped.nomination?.electionSymbol;

    // The default action is a link to the entity's ResultEntity route.
    const effectiveAction = action ?? $getRoute({
      route: 'ResultEntity',
      entityType: type,
      entityId: id,
      nominationId: unwrapped.nomination?.id
    });

    // The questions and possible submatches to display in the card
    // TODO: Add support for all entity types by expanding the setting type to cover all of them
    let qs: CardQuestions | undefined;
    let showSM = false;
    if (type === ENTITY_TYPE.Candidate || type === ENTITY_TYPE.Organization) {
      showSM = $appSettings.results.cardContents[type]?.includes('submatches') ?? false;
      if (variant !== 'details') {
        qs = getCardQuestions({
          type,
          appSettings: $appSettings,
          dataRoot: $dataRoot
        });
      }
    }

    // The possible subentities to display in the card, shown only in the list variant
    let scs: Array<EntityCardProps> | undefined;
    if (
      variant === 'list' &&
      unwrapped.nomination &&
      isObjectType(unwrapped.nomination, OBJECT_TYPE.OrganizationNomination) &&
      $appSettings.results.cardContents.organization?.includes('candidates')
    ) {
      scs = findCandidateNominations({ matches: matches ? $matches : undefined, nomination: unwrapped.nomination }).map((e) => ({
        entity: e
      }));
    }

    return {
      nakedEntity: unwrapped.entity,
      match: unwrapped.match as EntityVariantMatch | undefined,
      nomination: unwrapped.nomination,
      electionSymbol: elSym,
      action: effectiveAction,
      questions: qs,
      showSubMatches: showSM,
      subcards: scs
    };
  });

  ////////////////////////////////////////////////////////////////////
  // Event handlers
  ////////////////////////////////////////////////////////////////////

  /** Used to toggle expansion of the subcards list */
  let showAllSubcards = $state(false);

  function handleSubcardsToggle(): void {
    showAllSubcards = !showAllSubcards;
    if (showAllSubcards) startEvent('entityCard_expandSubcards', { length: parsed.subcards?.length ?? 0 });
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const gridClasses = 'grid gap-md';
  const classes = $derived.by(() => {
    let c = `vaa-card relative ${gridClasses}`;
    if (variant !== 'subcard') {
      c += ' rounded-md bg-base-100 px-md py-16';
      if (parsed.action) c += ' text-neutral transition-shadow ease-in-out hover:shadow-xl';
    }
    return c;
  });
</script>

<!-- If there are no subcards, we make the whole card clickable... -->
<EntityCardAction
  action={variant === 'details' || parsed.subcards?.length ? false : parsed.action}
  shadeOnHover={variant === 'subcard'}>
  <article
    aria-labelledby="{baseId}_title {parsed.match ? `${baseId}_callout` : ''}"
    aria-describedby="{baseId}_subtitle"
    data-testid="entity-card"
    {...concatClass(restProps, classes)}>
    <!-- Card header -->
    <!-- ...but if subcards are present, only the card header is clickable -->
    <EntityCardAction
      action={variant !== 'details' && parsed.subcards?.length ? parsed.action : false}
      shadeOnHover
      class={gridClasses}>
      <header
        class="gap-x-md gap-y-xs grid items-center justify-items-start"
        style="
          grid-template-columns: auto 1fr auto;
          grid-template-rows: 1fr auto;
          grid-template-areas:
            'avatar title    callout'
            'avatar subtitle callout';
          ">
        <!-- Avatar -->
        <Avatar
          entity={parsed.nakedEntity}
          linkFullImage={variant === 'details'}
          size={variant === 'subcard' ? 'sm' : undefined}
          style="grid-area: avatar" />

        <!-- Title -->
        <div class="gap-sm grid grid-flow-col items-center" style="grid-area: title">
          <svelte:element this={variant === 'subcard' ? 'h4' : 'h3'} id="{baseId}_title">
            {parsed.nakedEntity.name}
          </svelte:element>
          {#if variant === 'subcard' && parsed.electionSymbol}
            <ElectionSymbol text={parsed.electionSymbol} />
          {/if}
        </div>

        <!-- Subtitle -->
        <div id="{baseId}_subtitle" class="gap-sm grid grid-flow-col items-center" style="grid-area: subtitle">
          {#if variant !== 'subcard'}
            {#if parsed.nomination?.parentNomination}
              <EntityTag entity={parsed.nomination.parentNomination} variant="short" />
            {/if}
            {#if parsed.electionSymbol}
              <ElectionSymbol text={parsed.electionSymbol} />
            {/if}
            {#if showElection && parsed.nomination?.election && parsed.nomination?.constituency}
              <span>
                {parsed.nomination.election.shortName}
                {t('common.multipleAnswerSeparator')}
                {parsed.nomination.constituency.name}
              </span>
            {/if}
          {/if}
        </div>

        <!-- Callout (Match) -->
        {#if parsed.match}
          <MatchScore
            id="{baseId}_callout"
            score={parsed.match.score}
            showLabel={variant !== 'subcard'}
            style="grid-area: callout" />
        {/if}
      </header>

      <!-- Submatches -->
      {#if variant !== 'subcard' && parsed.match?.subMatches?.length && parsed.showSubMatches}
        <SubMatches matches={parsed.match.subMatches} variant={variant === 'details' ? 'loose' : undefined} class="mt-6" />
      {/if}

      <!-- Featured questions and answers -->
      {#if parsed.questions?.length}
        <div class="gap-md grid items-start" style="grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));">
          {#each parsed.questions as { question, hideLabel, format }}
            {@const answer = parsed.nakedEntity.getAnswer(question)}
            <!-- If `hideLabel` is true and we don't have an answer, we don't want to show anything -->
            {#if !hideLabel || answer != null}
              <div class="gap-xs grid">
                {#if !hideLabel}
                  <div class="small-label text-left">
                    {question.shortName}
                  </div>
                {/if}
                <div>
                  <InfoAnswer {answer} {question} {format} />
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </EntityCardAction>

    <!-- Subentities -->
    {#if parsed.subcards?.length}
      <div class="mt-md gap-lg grid empty:mt-0">
        {#each parsed.subcards.slice(0, showAllSubcards ? undefined : maxSubcards) as ecProps}
          <EntityCard variant="subcard" {...concatClass(ecProps, 'offset-border')} />
        {/each}
        {#if parsed.subcards.length > maxSubcards}
          <div class="offset-border -my-md relative after:!top-0">
            <Button
              onclick={handleSubcardsToggle}
              variant="secondary"
              color="secondary"
              class="max-w-none"
              text={showAllSubcards
                ? t('entityCard.hideAllCandidates')
                : t('entityCard.showAllCandidates', {
                    numCandidates: parsed.subcards.length
                  })} />
          </div>
        {/if}
      </div>
    {/if}

    {@render children?.()}
  </article>
</EntityCardAction>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .offset-border {
    /* after: is a valid prefix */
    @apply after:border-t-md after:border-base-300 after:absolute after:top-[calc(-10rem/16)] after:right-0 after:left-0 after:content-[''];
  }
</style>
