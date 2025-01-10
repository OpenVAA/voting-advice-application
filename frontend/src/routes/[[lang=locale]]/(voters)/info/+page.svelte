<!--@component

# Info (about the elections) page

Displays information about the elections in the VAA.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import Layout from '../../../Layout.svelte';

  const { dataRoot, getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<Layout title={$t('info.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.info.heroEmoji')} />
  </figure>

  <div>
    {@html sanitizeHtml($t('dynamic.info.content'))}
  </div>

  {#if $dataRoot.elections}
    <div class="items-stretch">
      {#each $dataRoot.elections ?? [] as { name, date, info }}
        {#if $dataRoot.elections.length > 1}
          <h2 class="mb-md mt-lg">{name}</h2>
        {/if}
        <p>{info}</p>
        {#if date}
          <p>{$t('dynamic.info.dateInfo', { electionDate: date })}</p>
        {/if}
      {/each}
    </div>
  {/if}

  <Button slot="primaryActions" variant="main" href={$getRoute('Home')} text={$t('common.returnHome')} />
</Layout>
