<script lang="ts">
  //TODO: add type
  //eslint-disable-next-line
  export let fields: any[] = ['default'];
</script>

<div class="w-full">
  <slot name="header" field={undefined} />
  <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
    {#each fields as field}
      <slot {field} />
    {/each}
  </div>
  <slot name="footer" field={undefined} />
</div>
