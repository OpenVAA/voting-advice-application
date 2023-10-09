<script lang="ts">
  import {_} from 'svelte-i18n';
  import {Card} from '$lib/shared/card/index';
  import {getUUID} from '$lib/utils/components';
  import type {EntityCardProps} from './EntityCard.type';

  type $$Props = EntityCardProps;
  export let id: $$Props['id'] = undefined;
  export let title: $$Props['title'];
  export let electionSymbol: $$Props['electionSymbol'] = '';
  export let listText: $$Props['listText'] = '';
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
      {#if imgSrc}
        <img class="rounded-sm" src={imgSrc} alt={imgAlt} width={imgWidth} height={imgHeight} />
      {:else}
        <div class="placeholder avatar">
          <div class="w-[3.125rem] rounded-full bg-base-300">
            <span class="text-2xl">{title.charAt(0)}</span>
          </div>
        </div>
      {/if}
    </svelte:fragment>
    <h3 slot="body-title" id={labelId}>{title}</h3>
    <div class="flex flex-row items-center gap-md" slot="body-content">
      {#if listText}
        <!-- TODO: Convert to <PartyTag> component -->
        <div class="flex flex-row gap-sm">
          <!-- svelte-ignore a11y-missing-attribute -->
          <img src="/icons/list.svg" role="presentation" />
          <span class="font-bold">
            {listText}
          </span>
        </div>
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
          <span class="text-xs text-secondary">{$_('components.card.matchLabel')}</span>
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
      {$_('components.card.errorDisplaying')}
    </h2>
  </Card>
{/if}
