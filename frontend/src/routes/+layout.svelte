<script lang="ts">
  import {page} from '$app/stores';
  import '../app.css';
</script>

<svelte:head>
  <title>{$page.data.appLabels.appTitle}</title>
</svelte:head>

<slot />
