<script lang="ts">
  export let fields: string[] = ['default'];
  export let customStyle: string | undefined = undefined;
</script>

<div class="w-full">
  <slot name="header" field={undefined} />
  <div class="my-6 flex w-full flex-col gap-4 overflow-hidden rounded-lg">
    {#each fields as field}
      <div class="bg-base-300" style={customStyle}>
        <slot {field} />
      </div>
    {/each}
  </div>
  <slot name="footer" field={undefined} />
</div>
