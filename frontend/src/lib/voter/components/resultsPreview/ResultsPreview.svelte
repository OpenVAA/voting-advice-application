<!--@component
A dynamic component for showing a preview of the current best matches.

### Properties

- `entity`: A possibly ranked nakedEntity, e.g. candidate or a party.
- `numResults`: The number of results to display. Defaults to 5.
- `hideLabel`: Whether to hide the label. Defaults to false.
- Any valid attributes of an `<article>` element.

### Dynamic component

- Accesses `VoterContext` for matches.

### Tracking events

- `resultsPreview_updated`: Fired when the matches in the preview are updated. Payload includes a stringified array of arrays of matched entity `shortNames` and their scores (-1 if not available).

### Usage

```tsx
<ResultsPreview entityType="candidate" numResults={6}/>
```
-->

<script lang="ts">
  import type { ResultsPreviewProps } from './ResultsPreview.type';
  import { EntityChip } from '$lib/components/entityChip';
  import { getVoterContext } from '$lib/contexts/voter';
  import { concatClass } from '$lib/utils/components';
  import { flip } from 'svelte/animate';
  import { crossfade, fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { unwrapEntity } from '$lib/utils/entities';
  import { DELAY } from '$lib/utils/timing';

  type $$Props = ResultsPreviewProps;

  export let entityType: $$Props['entityType'];
  export let numResults: $$Props['numResults'] = undefined;
  export let hideLabel: $$Props['hideLabel'] = undefined;

  $: numResults ??= 5;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { matches, selectedElections, startEvent, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Matches
  ////////////////////////////////////////////////////////////////////

  $: selectedMatches = $matches[$selectedElections[0].id]?.[entityType];

  ////////////////////////////////////////////////////////////////////
  // Transitions
  ////////////////////////////////////////////////////////////////////

  function getMatchKey(match: MaybeWrappedEntityVariant): string {
    const { entity } = unwrapEntity(match);
    return entity.id;
  }

  const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 100),
    fallback: (node) => fly(node, { x: '100dvw', opacity: 0, easing: cubicInOut })
  });

  ////////////////////////////////////////////////////////////////////
  // Tracking events
  ////////////////////////////////////////////////////////////////////

  let lastMatches: string | undefined;
  $: if (selectedMatches) {
    const currentMatches = JSON.stringify(
      selectedMatches.map((m) => {
        const { entity, match } = unwrapEntity(m);
        return [entity.shortName, match?.score ?? -1];
      })
    );
    if (currentMatches !== lastMatches) {
      lastMatches = currentMatches;
      startEvent('resultsPreview_updated', { matches: currentMatches });
    }
  }
</script>

{#if selectedMatches?.length}
  <div {...concatClass($$restProps, 'relative grid auto-cols-auto grid-flow-col gap-xs')}>
    {#if !hideLabel}
      <!-- Match height to Avatar.size=sm: h-[2.75rem] -->
      <div
        class="small-label absolute start-0 top-0 flex h-[2.75rem] w-min -translate-x-[100%] items-center pe-sm pt-sm text-center">
        {$t('components.resultsPreview.label', { count: numResults })}
      </div>
    {/if}
    {#each selectedMatches.slice(0, numResults) as match (getMatchKey(match))}
      {@const key = getMatchKey(match)}
      <div in:receive={{ key }} out:send={{ key }} animate:flip={{ duration: DELAY.md }}>
        <EntityChip entity={match} />
      </div>
    {/each}
  </div>
{/if}
