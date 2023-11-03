<script lang="ts">
  export let fields: any[] = ['default'];
  export let customStyle: string | undefined = undefined;
</script>

<div class="flex w-full flex-col gap-4 overflow-hidden rounded-lg">
  {#each fields as field}
    <div class="bg-base-300" style={customStyle}>
      <slot {field} />
    </div>
  {/each}
  <slot name="footer" field={undefined} />
</div>
