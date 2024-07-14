<script lang="ts">
  import { page } from '$app/stores';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage/';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  let title: string;
  $: {
    const key = `error.${$page.status}`;
    title = $t(key);
    // This means, there was no error message defined for this status code.
    if (title === key) title = $t('error.default');
  }
</script>

<BasicPage {title} titleClass="text-warning">
  <HeroEmoji slot="hero" emoji={$t('error.heroEmoji')} />
  <div class="text-center">{@html sanitizeHtml($t('error.content'))}</div>
</BasicPage>
