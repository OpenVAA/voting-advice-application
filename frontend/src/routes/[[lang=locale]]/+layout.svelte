<script lang="ts">
  import {t, locale} from '$lib/i18n';
  import '../../app.css';
</script>

<svelte:head>
  <title>{$t('viewTexts.appTitle')}</title>
</svelte:head>

<!-- The $locale key is necessary for locale changes to be reflected to updates in localised content (although any content using the $t will be updated automatically) -->
{#key $locale}
  <slot />
{/key}
