<script lang="ts">
  import { page } from '$app/stores';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from './MainContent.svelte';

  const description = $page.error?.description || $t('error.content');
  const emoji = $page.error?.emoji || $t('dynamic.error.heroEmoji');

  let title: string;
  $: {
    if ($page.error) {
      title = $page.error.message;
    } else {
      const key = assertTranslationKey(`error.${$page.status}`);
      title = $t(key);
      // This means, there was no error message defined for this status code.
      if (title === key) title = $t('error.default');
    }
  }
</script>

<main class="flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg">
  <MainContent {title}>
    <figure role="presentation" slot="hero">
      <HeroEmoji {emoji} />
    </figure>

    <div class="text-center">{@html sanitizeHtml(description)}</div>
  </MainContent>
</main>
