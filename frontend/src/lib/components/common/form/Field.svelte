<script lang="ts">
  export let customStyle: string | undefined = undefined;
</script>

<div class="flex h-full items-center justify-between bg-base-100 pr-4" style={customStyle}>
  <slot />
</div>
