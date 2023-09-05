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
        <img src={imgSrc} alt={imgAlt} width={imgWidth} height={imgHeight} />
      {:else}
        <div class="placeholder avatar">
          <div class="w-16 rounded-full bg-neutral-focus text-neutral-content">
            <span class="text-2xl">{title.charAt(0)}</span>
          </div>
        </div>
      {/if}
    </svelte:fragment>
    <h2 slot="body-title" class="text-2xl" id={labelId}>{title}</h2>
    <div class="flex flex-row items-center justify-normal gap-x-2" slot="body-content">
      {#if listText}
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src="/icons/election-list.png" role="presentation" />
        <span class="text-m text-center font-extrabold">
          {listText}
        </span>
      {/if}
      {#if electionSymbol}
        <span class="border-3 text-m ml-6 border px-3 py-1 font-bold">{electionSymbol}</span>
      {/if}
    </div>
    <svelte:fragment slot="body-match">
      {#if summaryMatch}
        <div class="flex flex-col">
          <span class="text-h3">{summaryMatch}</span>
          <span>{$_('components.card.matchLabel')}</span>
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
    <h2 slot="body-title" class="text-2xl text-error" id={labelId}>
      {$_('components.card.errorDisplaying')}
    </h2>
  </Card>
{/if}
