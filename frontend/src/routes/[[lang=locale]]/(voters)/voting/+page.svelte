<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  const { getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<MainContent title={$t('dynamic.howToVote.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.elections.heroEmoji')} />
  </figure>

  {@html sanitizeHtml($t('dynamic.howToVote.content'))}

  <Button slot="primaryActions" variant="main" href={$getRoute('Home')} text={$t('common.returnHome')} />
</MainContent>
