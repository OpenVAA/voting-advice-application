<script lang="ts">
  import {t} from '$lib/i18n';
  import {Card} from '$lib/components/shared/card/index';
  import {PartyTag} from '$lib/components/partyTag';
  import {getUUID} from '$lib/utils/components';
  import type {EntityCardProps} from './EntityCard.type';
  import CandidatePhoto from '$lib/components/candidates/CandidatePhoto.svelte';

  type $$Props = EntityCardProps;
  export let id: $$Props['id'] = undefined;
  export let title: $$Props['title'];
  export let electionSymbol: $$Props['electionSymbol'] = '';
  export let party: $$Props['party'] = undefined;
  export let summaryMatch: $$Props['summaryMatch'] = '';
  export let imgSrc: $$Props['imgSrc'] = undefined;
  export let imgAlt: $$Props['imgAlt'] = undefined;
  export let imgWidth: $$Props['imgWidth'] = undefined;
  export let imgHeight: $$Props['imgHeight'] = undefined;
  // Accessibility props (optional)
  export let ariaDescribedby: $$Props['aria-describedby'] = undefined;
  export let ariaPosinset: $$Props['aria-posinset'] = undefined;
  export let ariaSetsize: $$Props['aria-setsize'] = undefined;
  export let tabindex: $$Props['tabindex'] = undefined;

  const labelId = getUUID();
</script>

{#if title}
  <Card
    on:click
    on:keypress
    {id}
    aria-labelledby={labelId}
    aria-describedby={ariaDescribedby}
    {tabindex}
    aria-posinset={ariaPosinset}
    aria-setsize={ariaSetsize}>
    <svelte:fragment slot="card-media">
      <CandidatePhoto photoURL={imgSrc} alt={imgAlt} width={imgWidth} height={imgHeight} {title} />
    </svelte:fragment>
    <h3 slot="body-title" id={labelId}>{title}</h3>
    <div class="flex flex-row items-center gap-md" slot="body-content">
      {#if party}
        <PartyTag {party} variant="short" />
      {/if}
      {#if electionSymbol}
        <!-- TODO: Convert to <ElectionSymbol> component -->
        <span
          class="border-sm border-color-[var(--line-color)] rounded-sm border px-8 py-4 font-bold"
          >{electionSymbol}</span>
      {/if}
    </div>
    <svelte:fragment slot="body-match">
      {#if summaryMatch}
        <!-- TODO: Convert to <MatchScore> component -->
        <div class="flex min-w-[3.125rem] flex-col items-center">
          <span class="text-lg font-bold">{summaryMatch}</span>
          <span class="text-center text-xs text-secondary">{$t('components.card.matchLabel')}</span>
        </div>
      {/if}
    </svelte:fragment>
    <slot name="card-footer" slot="card-footer" />
  </Card>
{:else}
  <Card
    on:click
    on:keypress
    {id}
    aria-labelledby={labelId}
    aria-describedby={ariaDescribedby}
    {tabindex}
    aria-posinset={ariaPosinset}
    aria-setsize={ariaSetsize}>
    <h2 slot="body-title" class="text-error" id={labelId}>
      {$t('components.card.errorDisplaying')}
    </h2>
  </Card>
{/if}
