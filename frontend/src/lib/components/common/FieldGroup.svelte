<script lang="ts">
  //TODO: add type
  //eslint-disable-next-line
  export let fields: any[] = ['default'];
  export let customStyle: string | undefined = undefined;
</script>

<div class="w-full">
  <slot name="header" field={undefined} />
  <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
    {#each fields as field}
      <div class="bg-base-100" style={customStyle}>
        <slot {field} />
      </div>
    {/each}
  </div>
  <slot name="footer" field={undefined} />
</div>
