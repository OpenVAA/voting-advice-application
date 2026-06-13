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

  const ctx = getAppContext();
  const { getRoute, t } = ctx;
  // dataRoot is identity-stable (#version-bridge): NEVER bind it to an intermediate $derived alias and read through
  // the alias — the alias yields the same DataRoot ref on each #version bump, so Svelte 5 skips downstream
  // notification and the cold/direct-URL election region stays empty. Read `ctx.dataRoot.<prop>` directly inside each
  // consuming tracking scope. See CLAUDE.md §Context Destructuring Rule + .planning/spikes/CONVENTIONS.md §9
  // (Spike-024 anti-pattern entry). Phase 117 COLD-01.

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

  {#if ctx.dataRoot.elections}
    <div class="items-stretch" data-testid="voter-info-election-list">
      {#each ctx.dataRoot.elections ?? [] as { name, date, info }}
        {#if ctx.dataRoot.elections.length > 1}
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
    <Button
      variant="main"
      href={getRoute.current('Home')}
      text={t('common.returnHome')}
      data-testid="voter-info-return" />
  {/snippet}
</MainContent>
