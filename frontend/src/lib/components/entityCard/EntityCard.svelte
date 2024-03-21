<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {getUUID} from '$lib/utils/components';
  import {isCandidate, isParty} from '$lib/utils/entities';
  import {Avatar} from '$lib/components/avatar';
  import {Card} from '$lib/components/shared/card/index';
  import {ElectionSymbol} from '$lib/components/electionSymbol';
  import {formatName} from '$lib/utils/internationalisation';
  import {MatchScore} from '$lib/components/matchScore';
  import {PartyTag} from '$lib/components/partyTag';
  import {SubMatches} from '$lib/components/subMatches';
  import type {EntityCardProps} from './EntityCard.type';

  type $$Props = EntityCardProps;

  export let entity: $$Props['entity'] = undefined;
  export let ranking: $$Props['ranking'] = undefined;
  export let context: $$Props['context'] = 'list';

  const baseId = getUUID();

  let name: string;
  let image: ImageProps | undefined;
  let electionSymbol: string | undefined;
  let nominatingParty: PartyProps | undefined;

  $: {
    if (ranking) {
      entity = ranking.entity;
    } else if (!entity) {
      throw error(500, 'Supply either entity or ranking.');
    }

    if (isCandidate(entity)) {
      name = formatName(entity);
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
A card for displaying an entity, i.e. a candidate or a party, in a list or as part of entity's details, possibly including a matching score and sub-matches. You can supply either an unranked `entity` or a `ranking`, which contains the ranked entity.

### Properties

- `entity`: A candidate or a party if no rankings are available.
- `ranking`: A ranked entity, i.e. a candidate or a party.
- `context`: The context in which the card is used, affects layout. @default `'list'`
- Any valid attributes of a `<Card>` component.

### Usage

```tsx
<a href="/results/{id}">
  <EntityCard ranking={candidateMatch}>
</a>
<EntityCard entity={party} context="details">
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
