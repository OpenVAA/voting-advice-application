<script lang="ts">
  interface Props {
    references: string[];
  }

  let { references }: Props = $props();
</script>

{#if references.length}
  <section class="text-secondary">
    <h5 class="mb-0 font-bold">References</h5>
    <ul class="p-0 text-sm">
      {#each references as reference}
        <li class="list-none ps-lg -indent-lg">{reference}</li>
      {/each}
    </ul>
  </section>
{/if}
