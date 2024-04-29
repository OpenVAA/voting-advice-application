<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {getUUID} from '$lib/utils/components';
  import {isCandidate, isParty, parseMaybeRanked} from '$lib/utils/entities';
  import {Avatar, type AvatarProps} from '$lib/components/avatar';
  import {Card} from '$lib/components/shared/card/index';
  import {ElectionSymbol} from '$lib/components/electionSymbol';
  import {MatchScore} from '$lib/components/matchScore';
  import {PartyTag} from '$lib/components/partyTag';
  import {SubMatches} from '$lib/components/subMatches';
  import type {EntityCardProps} from './EntityCard.type';
  import {t} from '$lib/i18n';

  type $$Props = EntityCardProps;

  export let content: $$Props['content'];
  export let context: $$Props['context'] = 'list';

  const baseId = getUUID();

  let avatarProps: AvatarProps;
  let electionSymbol: string | undefined;
  let entity: EntityProps;
  let name: string;
  let nominatingParty: PartyProps | undefined;
  let ranking: RankingProps | undefined;

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
</script>

<!--@component
A card for displaying an entity, i.e. a candidate or a party, in a list or as part of entity's details, possibly including a matching score and sub-matches. You can supply either a naked entity or a ranking containing an entity.

### Properties

- `content`: A possibly ranked entity, e.g. candidate or a party.
- `context`: The context in which the card is used, affects layout. @default `'list'`
- Any valid attributes of a `<Card>` component.

### Usage

```tsx
<a href="/results/{id}">
  <EntityCard content={candidateMatch}>
</a>
<EntityCard content={party} context="details">
```
-->

<Card
  on:click
  on:keypress
  aria-labelledby="{baseId}_title {ranking ? `${baseId}_callout` : ''}"
  aria-describedby="{baseId}_subtitle"
  {...$$restProps}>
  <Avatar slot="image" {...avatarProps} />
  <h3 slot="title" id="{baseId}_title">{name}</h3>
  <div class="flex flex-row items-center gap-md" slot="subtitle" id="{baseId}_subtitle">
    {#if isCandidate(entity)}
      {#if nominatingParty}
        <PartyTag party={nominatingParty} variant="short" />
      {:else}
        {$t('common.unaffiliated')}
      {/if}
      {#if electionSymbol}
        <ElectionSymbol text={electionSymbol} />
      {/if}
    {/if}
  </div>
  <svelte:fragment slot="callout">
    {#if ranking}
      <MatchScore score={ranking.score} id="{baseId}_callout" />
    {/if}
  </svelte:fragment>
  {#if ranking?.subMatches?.length}
    <SubMatches
      matches={ranking.subMatches}
      variant={context === 'details' ? 'loose' : undefined}
      class="mt-6" />
  {/if}
  <slot />
</Card>
