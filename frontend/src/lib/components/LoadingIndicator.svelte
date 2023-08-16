<script lang="ts">
  export let message = '';
</script>

<div class="center flex flex-col">
  <span class="loading-spinner loading-md loading" />
  {#if message}
    <span class="text-secondary">{{message}}</span>
  {/if}
</div>
