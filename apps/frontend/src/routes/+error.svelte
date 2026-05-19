<script lang="ts">
  import { page } from '$app/state';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from './MainContent.svelte';

  const description = $derived(page.error?.description || t('error.content'));
  const emoji = $derived(page.error?.emoji || t('dynamic.error.heroEmoji'));

  let title = $derived.by(() => {
    if (page.error) {
      return page.error.message;
    } else {
      const key = assertTranslationKey(`error.${page.status}`);
      const translated = t(key);
      // This means, there was no error message defined for this status code.
      if (translated === key) return t('error.default');
      return translated;
    }
  });
</script>

<main class="gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg flex flex-grow flex-col items-center">
  <MainContent {title}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji {emoji} />
      </figure>
    {/snippet}

    <div class="text-center">{@html sanitizeHtml(description)}</div>
  </MainContent>
</main>
