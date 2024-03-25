<script lang="ts">
  export let customStyle: string | undefined = undefined;
  export let bgColor: string = 'bg-base-100';
</script>

<div class="flex h-full items-center justify-between {bgColor}" style={customStyle}>
  <slot />
</div>
