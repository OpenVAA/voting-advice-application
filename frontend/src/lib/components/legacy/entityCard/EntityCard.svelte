<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { Button } from '$lib/components/button';
  import { ElectionSymbol } from '$lib/components/electionSymbol';
  import { MatchScore } from '$lib/components/matchScore';
  import { t } from '$lib/i18n';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { startEvent } from '$lib/utils/legacy-analytics/track';
  import { isCandidate, isParty, parseMaybeRanked } from '$lib/utils/legacy-entities';
  import EntityCardAction from './EntityCardAction.svelte';
  import { Avatar, type AvatarProps } from '../avatar';
  import { PartyTag } from '../partyTag';
  import type { EntityCardProps } from './EntityCard.type';

  type $$Props = EntityCardProps;

  export let action: $$Props['action'] = undefined;
  export let content: $$Props['content'];
  export let context: $$Props['context'] = 'list';
  export let subcards: $$Props['subcards'] = undefined;
  export let maxSubcards: $$Props['maxSubcards'] = undefined;
  // We have to set the default value like this, otherwise the value is treated later as possibly undefined
  maxSubcards ??= 3;

  const baseId = getUUID();

  let avatarProps: AvatarProps;
  let electionSymbol: string | undefined;
  let entity: LegacyEntityProps;
  let name: string;
  let nominatingParty: LegacyPartyProps | undefined;
  let ranking: LegacyRankingProps | undefined;
  /** Used to toggle expansion of the subcards list */
  let showAllSubcards = false;

  $: {
    ({ entity, ranking } = parseMaybeRanked(content));
    name = entity.name;
    avatarProps = {
      name,
      image: entity.photo,
      linkFullImage: context === 'details',
      size: context === 'subcard' ? 'sm' : undefined
    };
    if (isCandidate(entity)) {
      electionSymbol = entity.electionSymbol;
      // TODO: This becomes incorrect with `@openvaa/data` that supports party membership as distinct from nominating party
      nominatingParty = entity.party;
    } else if (isParty(entity)) {
      // Instead of auto-generating the initials from the name, we use the party's abbreviation
      if (entity.shortName) avatarProps.initials = entity.shortName;
      // If the party has a color defined, use it for the avatar background. We expect these to be dark, so the light text is used
      if (entity.color) {
        avatarProps.customColor = entity.color;
        avatarProps.textColor = 'primary-content';
        if (entity.colorDark) avatarProps.customColorDark = entity.colorDark;
      }
      electionSymbol = entity.electionSymbol;
    } else {
      error(500, 'Entity must be either a candidate or a party.');
    }
  }

  // Card styling
  const gridClasses = 'grid gap-md';
  let classes = `vaa-card relative ${gridClasses}`;
  if (context !== 'subcard') {
    classes += ' rounded-md bg-base-100 px-md py-16';
    if (action) classes += ' text-neutral transition-shadow ease-in-out hover:shadow-xl';
  }
</script>

<!--@component
A card for displaying an entity, i.e. a candidate or a party, in a list or as part of entity's details, possibly including a matching score, sub-matches, nested entity cards and answers to specified questions. You can supply either a naked entity or a ranking containing an entity.

In nested cards, the layout and rendering of contents varies from that of a parent card to make the layout more compact.
- Some elements are smaller and the title is rendered as `<h4>` instead of `<h3>`.
- The election symbol is shown next to the title.
- Nested entity cards are not rendered.

### Properties

- `action`: The action to take when the card is clicked. If the card has subentites, the action will only be triggered by clicking the content above them.
- `content`: A possibly ranked entity, e.g. candidate or a party.
- `context`: The context in which the card is used, affects layout. @default `'list'`
- `questions`: Possible question whose answers should be shown in the card, along with possibly options for their display.
- `subcards`: Possible sub-entities of the entity to show in the card, e.g. candidates for a party.
- `maxSubcards`: The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. @default `3`
- Any valid attributes of an `<article>` element.

### Accessibility

- Currently, keyboard navigation is non-hierarchical even when subcards are present. In the future, this should be expanded into a more elaborate system where arrow keys or such can be used to navigate within a card with subcards.

### Tracking events

- `entityCard_expandSubcards`: Triggered when the list of subcards is expanded. Contains a `length` property with the total number of subcards.

### Usage

```tsx
<a href="/results/{id}">
  <EntityCard content={candidateMatch}>
</a>
<EntityCard content={party} context="details">
```
-->

<!-- If there are no subcards, we make the whole card clickable... -->
<EntityCardAction action={subcards?.length ? undefined : action} shadeOnHover={context === 'subcard'}>
  <article
    aria-labelledby="{baseId}_title {ranking ? `${baseId}_callout` : ''}"
    aria-describedby="{baseId}_subtitle"
    {...concatClass($$restProps, classes)}>
    <!-- Card header -->
    <!-- ...but if subcards are present, only the card header is clickable -->
    <EntityCardAction action={subcards?.length ? action : undefined} shadeOnHover class={gridClasses}>
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
        <Avatar {...avatarProps} style="grid-area: avatar" />

        <!-- Title -->
        <div class="grid grid-flow-col items-center gap-sm" style="grid-area: title">
          <svelte:element this={context === 'subcard' ? 'h4' : 'h3'} id="{baseId}_title">
            {name}
          </svelte:element>
          {#if context === 'subcard' && electionSymbol}
            <ElectionSymbol text={electionSymbol} />
          {/if}
        </div>

        <!-- Subtitle -->
        <div id="{baseId}_subtitle" class="grid grid-flow-col items-center gap-sm" style="grid-area: subtitle">
          {#if context !== 'subcard'}
            {#if isCandidate(entity)}
              {#if nominatingParty}
                <PartyTag party={nominatingParty} variant="short" />
              {/if}
            {/if}
            {#if electionSymbol}
              <ElectionSymbol text={electionSymbol} />
            {/if}
          {/if}
        </div>

        <!-- Callout (Match) -->
        {#if ranking}
          <MatchScore
            id="{baseId}_callout"
            score={ranking.score}
            showLabel={context !== 'subcard'}
            style="grid-area: callout" />
        {/if}
      </header>
    </EntityCardAction>

    <!-- Subentities -->
    {#if subcards}
      <!-- TODO: Svelte 5: this currently leaves an unseemly empty gap even if there's no content, because the tag will still contain whitespace. With Svelte 5, this is supposed to be automatically fixed. -->
      <div class="mt-md grid gap-lg empty:mt-0">
        {#each subcards.slice(0, showAllSubcards ? undefined : maxSubcards) as ecProps}
          <svelte:self context="subcard" {...concatClass(ecProps, 'offset-border')} />
        {/each}
        {#if subcards.length > maxSubcards}
          <div class="offset-border relative -my-md after:!top-0">
            <Button
              on:click={() => (showAllSubcards = !showAllSubcards)}
              on:click={() => startEvent('entityCard_expandSubcards', { length: subcards.length })}
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
