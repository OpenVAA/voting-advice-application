<script lang="ts">
  import {t} from '$lib/i18n';
  import '../../app.css';
</script>

<svelte:head>
  <title>{$t('viewTexts.appTitle')}</title>
</svelte:head>

<slot />
