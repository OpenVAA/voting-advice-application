<script lang="ts">
  import {goto} from '$app/navigation';
  import {appLabels} from '$lib/stores/stores';
</script>

<h1>
  {$appLabels?.appTitle ?? 'Title Not Found'}
</h1>

<button on:click={() => goto('/elections')} class="btn">Select Elections</button>
