<!--@component

# Info (about the elections) page

Displays information about the elections in the VAA.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  const { dataRoot, getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext();
  topBarSettings.use({
    actions: {
      return: 'show',
      returnButtonLabel: t('common.returnHome')
    }
  });
</script>

<MainContent title={t('info.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.info.heroEmoji')} />
    </figure>
  {/snippet}

  <div data-testid="voter-info-content">
    {@html sanitizeHtml(t('dynamic.info.content'))}
  </div>

  {#if dataRoot.current.elections}
    <div class="items-stretch">
      {#each dataRoot.current.elections ?? [] as { name, date, info }}
        {#if dataRoot.current.elections.length > 1}
          <h2 class="mb-md mt-lg">{name}</h2>
        {/if}
        <p>{info}</p>
        {#if date}
          <p>{t('dynamic.info.dateInfo', { electionDate: date })}</p>
        {/if}
      {/each}
    </div>
  {/if}

  {#snippet primaryActions()}
    <Button variant="main" href={getRoute.current('Home')} text={t('common.returnHome')} data-testid="voter-info-return" />
  {/snippet}
</MainContent>
