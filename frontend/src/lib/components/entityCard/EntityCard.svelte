<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {concatClass, getUUID} from '$lib/utils/components';
  import {isCandidate, isParty, parseMaybeRanked} from '$lib/utils/entities';
  import {Avatar, type AvatarProps} from '$lib/components/avatar';
  import {Button} from '$lib/components/button';
  import {ElectionSymbol} from '$lib/components/electionSymbol';
  import {MatchScore} from '$lib/components/matchScore';
  import {PartyTag} from '$lib/components/partyTag';
  import {SubMatches} from '$lib/components/subMatches';
  import EntityCardAction from './EntityCardAction.svelte';
  import type {EntityCardProps} from './EntityCard.type';

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
  let entity: EntityProps;
  let name: string;
  let nominatingParty: PartyProps | undefined;
  let ranking: RankingProps | undefined;
  /** Used to toggle expansion of the subcards list */
  let showAllSubcards = false;

  $: {
    ({entity, ranking} = parseMaybeRanked(content));
    name = entity.name;
    avatarProps = {
      name,
      image: entity.photo,
      linkFullImage: context === 'details'
    };
    if (isCandidate(entity)) {
      electionSymbol = entity.electionSymbol;
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
  let classes = 'vaa-card relative grid gap-md';
  if (context !== 'subcard') {
    classes += ' rounded-md bg-base-100 px-md py-16';
    if (action) classes += ' text-neutral transition-shadow ease-in-out hover:shadow-xl';
  }
</script>

<!--@component
A card for displaying an entity, i.e. a candidate or a party, in a list or as part of entity's details, possibly including a matching score, sub-matches and nested entity cards. You can supply either a naked entity or a ranking containing an entity.

### Properties

- `content`: A possibly ranked entity, e.g. candidate or a party.
- `context`: The context in which the card is used, affects layout. @default `'list'`
- Any valid attributes of a `<Card>` component.

### Accessibility

- Currently, keyboard navigation is non-hierarchical even when subcards are present. In the future, this should be expanded into a more elaborate system where arrow keys or such can be used to navigate within a card with subcards.
  
### Usage

```tsx
<a href="/results/{id}">
  <EntityCard content={candidateMatch}>
</a>
<EntityCard content={party} context="details">
```
-->

<!-- If there are no subcards, we make the whole card clickable... -->
<EntityCardAction
  action={subcards?.length ? undefined : action}
  shadeOnHover={context === 'subcard'}>
  <article
    aria-labelledby="{baseId}_title {ranking ? `${baseId}_callout` : ''}"
    aria-describedby="{baseId}_subtitle"
    {...concatClass($$restProps, classes)}>
    <!-- Card header -->
    <!-- ...but if subcards are present, only the card header is clickable -->
    <EntityCardAction action={subcards?.length ? action : undefined} shadeOnHover>
      <header
        class="grid items-center justify-items-start gap-x-md gap-y-xs"
        style="
          grid-template-columns: auto 1fr auto;
          grid-template-rows: 1fr auto;
          grid-template-areas:
            'avatar title    callout'
            'avatar subtitle callout';
          ">
        <Avatar {...avatarProps} style="grid-area: avatar" />
        <div class="grid grid-flow-col items-center gap-sm" style="grid-area: title">
          <svelte:element this={context === 'subcard' ? 'h4' : 'h3'} id="{baseId}_title">
            {name}
          </svelte:element>
          {#if context === 'subcard' && electionSymbol}
            <ElectionSymbol text={electionSymbol} />
          {/if}
        </div>
        <div
          id="{baseId}_subtitle"
          class="grid grid-flow-col items-center gap-sm"
          style="grid-area: subtitle">
          {#if context !== 'subcard'}
            {#if isCandidate(entity)}
              {#if nominatingParty}
                <PartyTag party={nominatingParty} variant="short" />
              {:else}
                {$t('common.unaffiliated')}
              {/if}
            {/if}
            {#if electionSymbol}
              <ElectionSymbol text={electionSymbol} />
            {/if}
          {/if}
        </div>
        {#if ranking}
          <MatchScore
            id="{baseId}_callout"
            score={ranking.score}
            showLabel={context !== 'subcard'}
            style="grid-area: callout" />
        {/if}
      </header>
    </EntityCardAction>

    <!-- Card body -->
    {#if context !== 'subcard' && ranking?.subMatches?.length}
      <SubMatches
        matches={ranking.subMatches}
        variant={context === 'details' ? 'loose' : undefined}
        class="mt-6" />
    {/if}
    {#if subcards}
      <div class="mt-md grid gap-lg">
        {#each subcards.slice(0, showAllSubcards ? undefined : maxSubcards) as ecProps}
          <svelte:self context="subcard" {...concatClass(ecProps, 'offset-border')} />
        {/each}
        {#if subcards.length > maxSubcards}
          <div class="offset-border relative -my-md after:!top-0">
            <Button
              on:click={() => (showAllSubcards = !showAllSubcards)}
              variant="secondary"
              color="secondary"
              class="max-w-none"
              text={showAllSubcards
                ? $t('components.entityCard.hideAllCandidates')
                : $t('components.entityCard.showAllCandidates', {
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
    /** After: is a valid prefix */
    @apply after:absolute after:left-0 after:right-0 after:top-[calc(-10rem/16)] after:border-t-md after:border-base-300 after:content-[''];
  }
</style>
