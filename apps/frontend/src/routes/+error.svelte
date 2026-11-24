<script lang="ts">
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  const description = $derived(page.error?.description || t('error.content'));
  const emoji = $derived(page.error?.emoji || t('dynamic.error.heroEmoji'));

  // A load's own `error(status, message)` copy is shown as it is; the bare status string `handleError` returns is replaced by the status's translated message.
  const title = $derived.by(() => {
    const message = page.error?.message;
    if (message && message !== String(page.status)) return message;
    const key = assertTranslationKey(`error.${page.status}`);
    const translated = t(key);
    // A status with no message of its own in the catalogue.
    return translated === key ? t('error.default') : translated;
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
