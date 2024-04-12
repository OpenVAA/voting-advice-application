<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {getUUID} from '$lib/utils/components';
  import {isCandidate, isParty, parseMaybeRanked} from '$lib/utils/entities';
  import {Avatar} from '$lib/components/avatar';
  import {Card} from '$lib/components/shared/card/index';
  import {ElectionSymbol} from '$lib/components/electionSymbol';
  import {MatchScore} from '$lib/components/matchScore';
  import {PartyTag} from '$lib/components/partyTag';
  import {SubMatches} from '$lib/components/subMatches';
  import type {EntityCardProps} from './EntityCard.type';

  type $$Props = EntityCardProps;

  export let content: $$Props['content'];
  export let context: $$Props['context'] = 'list';

  const baseId = getUUID();

  let electionSymbol: string | undefined;
  let entity: EntityProps;
  let image: ImageProps | undefined;
  let name: string;
  let nominatingParty: PartyProps | undefined;
  let ranking: RankingProps | undefined;

  $: {
    ({entity, ranking} = parseMaybeRanked(content));
    if (isCandidate(entity)) {
      name = entity.name;
      image = entity.photo;
      electionSymbol = entity.electionSymbol;
      nominatingParty = entity.party;
    } else if (isParty(entity)) {
      name = entity.name;
      image = entity.photo;
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
  <Avatar slot="image" {image} {name} linkFullImage={context === 'details'} />
  <h3 slot="title" id="{baseId}_title">{name}</h3>
  <div class="flex flex-row items-center gap-md" slot="subtitle" id="{baseId}_subtitle">
    {#if nominatingParty}
      <PartyTag party={nominatingParty} variant="short" />
    {/if}
    {#if electionSymbol}
      <ElectionSymbol text={electionSymbol} />
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
