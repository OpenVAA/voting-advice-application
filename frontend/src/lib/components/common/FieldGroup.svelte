<script lang="ts">
  export let fields: any[] = [];
</script>

<div class="flex w-full flex-col gap-4 overflow-hidden rounded-lg">
  {#each fields as field}
    <div class="bg-base-300">
      <slot {field} />
    </div>
  {/each}
  <slot name="footer" field={undefined} />
</div>
