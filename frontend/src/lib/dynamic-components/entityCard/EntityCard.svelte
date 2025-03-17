<!--@component
A card for displaying a possibly wrapped `Entity`, i.e. a candidate or a party, nomination thereof, or a match, in a list or as part of an `Entity`'s details, possibly including a matching score, sub-matches, nested `EntityCard`s and answers to specified questions.

In nested cards, the layout and rendering of contents varies from that of a parent card to make the layout more compact.
- Some elements are smaller and the title is rendered as `<h4>` instead of `<h3>`.
- The election symbol is shown next to the title.
- Nested nakedEntity cards are not rendered.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `action`: Custom action to take when the card is clicked, defaults to a link to the entity’s `ResultEntity` route. If the card has subentites, the action will only be triggered by clicking the content above them.
- `entity`: A possibly ranked nakedEntity, e.g. candidate or a party.
- `variant`: The variant-dependend layout variant. Usually set automatically.
  - `'list'`: In a list of entities. The default.
  - `'details'`: As part of the header of `EntityDetails`.
  - `'subcard'`; In a list of nested nakedEntity cards, e.g., the candidates for a party.
- `maxSubcards`: The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. @default `3`
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

<script lang="ts">
  import {
    type AnyEntityVariant,
    type AnyNominationVariant,
    type AnyQuestionVariant,
    ENTITY_TYPE,
    OrganizationNomination
  } from '@openvaa/data';
  import { Avatar } from '$lib/components/avatar';
  import { Button } from '$lib/components/button';
  import { ElectionSymbol } from '$lib/components/electionSymbol';
  import { EntityTag } from '$lib/components/entityTag';
  import { InfoAnswer, type InfoAnswerProps } from '$lib/components/infoAnswer';
  import { MatchScore } from '$lib/components/matchScore';
  import { SubMatches } from '$lib/components/subMatches';
  import { getAppContext } from '$lib/contexts/app';
  import { getVoterContext } from '$lib/contexts/voter';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { getCardQuestions } from '$lib/utils/entityCards';
  import { findCandidateNominations } from '$lib/utils/matches';
  import EntityCardAction from './EntityCardAction.svelte';
  import type { EntityCardProps } from './EntityCard.type';

  type $$Props = EntityCardProps;

  export let action: $$Props['action'] = undefined;
  export let entity: $$Props['entity'];
  export let variant: $$Props['variant'] = 'list';
  export let maxSubcards: $$Props['maxSubcards'] = undefined;

  // We have to set the default value like this, otherwise the value is treated later as possibly undefined
  maxSubcards ??= 3;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, dataRoot, getRoute, startEvent, t } = getAppContext();
  const matches = $appType === 'voter' ? getVoterContext().matches : undefined;

  ////////////////////////////////////////////////////////////////////
  // Parse components, actions, subcards and questions
  ////////////////////////////////////////////////////////////////////

  const baseId = getUUID();

  let electionSymbol: string | undefined;
  let nakedEntity: AnyEntityVariant;
  let match: EntityVariantMatch | undefined;
  let nomination: AnyNominationVariant | undefined;
  let questions:
    | Array<{
        question: AnyQuestionVariant;
        hideLabel?: boolean;
        format?: InfoAnswerProps['format'];
      }>
    | undefined;
  let showSubMatches: boolean;
  let subcards: Array<$$Props> | undefined;

  $: {
    ({ entity: nakedEntity, match, nomination } = unwrapEntity(entity));
    const { type, id } = nakedEntity;

    electionSymbol = nomination?.electionSymbol;

    // The default action is a link to the entity's ResultEntity route.
    action ??= $getRoute({
      route: 'ResultEntity',
      entityType: type,
      entityId: id,
      nominationId: nomination?.id
    });

    // The questions and possible submatches to display in the card
    // TODO: Add support for all entity types by expanding the setting type to cover all of them
    if (type === ENTITY_TYPE.Candidate || type === ENTITY_TYPE.Organization) {
      showSubMatches = $appSettings.results.cardContents[type].includes('submatches');
      if (variant !== 'details') {
        questions = getCardQuestions({
          type,
          appSettings: $appSettings,
          dataRoot: $dataRoot
        });
      }
    }

    // The possible subentities to display in the card, shown only in the list variant
    if (
      variant === 'list' &&
      nomination &&
      nomination instanceof OrganizationNomination &&
      $appSettings.results.cardContents.organization.includes('candidates')
    ) {
      subcards = findCandidateNominations({ matches: matches ? $matches : undefined, nomination }).map((e) => ({
        entity: e
      }));
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Event handlers
  ////////////////////////////////////////////////////////////////////

  /** Used to toggle expansion of the subcards list */
  let showAllSubcards = false;

  function handleSubcardsToggle(): void {
    showAllSubcards = !showAllSubcards;
    if (showAllSubcards) startEvent('entityCard_expandSubcards', { length: subcards?.length ?? 0 });
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const gridClasses = 'grid gap-md';
  let classes = `vaa-card relative ${gridClasses}`;
  if (variant !== 'subcard') {
    classes += ' rounded-md bg-base-100 px-md py-16';
    if (action) classes += ' text-neutral transition-shadow ease-in-out hover:shadow-xl';
  }
</script>

<!-- If there are no subcards, we make the whole card clickable... -->
<EntityCardAction
  action={variant === 'details' || subcards?.length ? false : action}
  shadeOnHover={variant === 'subcard'}>
  <article
    aria-labelledby="{baseId}_title {match ? `${baseId}_callout` : ''}"
    aria-describedby="{baseId}_subtitle"
    {...concatClass($$restProps, classes)}>
    <!-- Card header -->
    <!-- ...but if subcards are present, only the card header is clickable -->
    <EntityCardAction
      action={variant !== 'details' && subcards?.length ? action : false}
      shadeOnHover
      class={gridClasses}>
      <header
        class="grid items-center justify-items-start gap-x-md gap-y-xs"
        style="
          grid-template-columns: auto 1fr auto;
          grid-template-rows: 1fr auto;
          grid-template-areas:
            'avatar title    callout'
            'avatar subtitle callout';
          ">
        <!-- Avatar -->
        <Avatar
          entity={nakedEntity}
          linkFullImage={variant === 'details'}
          size={variant === 'subcard' ? 'sm' : undefined}
          style="grid-area: avatar" />

        <!-- Title -->
        <div class="grid grid-flow-col items-center gap-sm" style="grid-area: title">
          <svelte:element this={variant === 'subcard' ? 'h4' : 'h3'} id="{baseId}_title">
            {nakedEntity.name}
          </svelte:element>
          {#if variant === 'subcard' && electionSymbol}
            <ElectionSymbol text={electionSymbol} />
          {/if}
        </div>

        <!-- Subtitle -->
        <div id="{baseId}_subtitle" class="grid grid-flow-col items-center gap-sm" style="grid-area: subtitle">
          {#if variant !== 'subcard'}
            {#if nomination?.parentNomination}
              <EntityTag entity={nomination.parentNomination} variant="short" />
            {/if}
            {#if electionSymbol}
              <ElectionSymbol text={electionSymbol} />
            {/if}
          {/if}
        </div>

        <!-- Callout (Match) -->
        {#if match}
          <MatchScore
            id="{baseId}_callout"
            score={match.score}
            showLabel={variant !== 'subcard'}
            style="grid-area: callout" />
        {/if}
      </header>

      <!-- Submatches -->
      {#if variant !== 'subcard' && match?.subMatches?.length && showSubMatches}
        <SubMatches matches={match.subMatches} variant={variant === 'details' ? 'loose' : undefined} class="mt-6" />
      {/if}

      <!-- Featured questions and answers -->
      {#if questions?.length}
        <div class="grid items-start gap-md" style="grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));">
          {#each questions as { question, hideLabel, format }}
            {@const answer = nakedEntity.getAnswer(question)}
            <!-- If `hideLabel` is true and we don't have an answer, we don't want to show anything -->
            {#if !hideLabel || answer != null}
              <div class="grid gap-xs">
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
    {#if subcards?.length}
      <!-- TODO[Svelte 5]: this currently leaves an unseemly empty gap even if there's no content, because the tag will still contain whitespace. With Svelte 5, this is supposed to be automatically fixed. -->
      <div class="mt-md grid gap-lg empty:mt-0">
        {#each subcards.slice(0, showAllSubcards ? undefined : maxSubcards) as ecProps}
          <svelte:self variant="subcard" {...concatClass(ecProps, 'offset-border')} />
        {/each}
        {#if subcards.length > maxSubcards}
          <div class="offset-border relative -my-md after:!top-0">
            <Button
              on:click={handleSubcardsToggle}
              variant="secondary"
              color="secondary"
              class="max-w-none"
              text={showAllSubcards
                ? $t('entityCard.hideAllCandidates')
                : $t('entityCard.showAllCandidates', {
                    numCandidates: subcards.length
                  })} />
          </div>
        {/if}
      </div>
    {/if}

    <slot />
  </article>
</EntityCardAction>

<style lang="postcss">
  .offset-border {
    /* after: is a valid prefix */
    @apply after:absolute after:left-0 after:right-0 after:top-[calc(-10rem/16)] after:border-t-md after:border-base-300 after:content-[''];
  }
</style>
