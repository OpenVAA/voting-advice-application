<script lang="ts">
  import Icon from '$lib/components/icon/Icon.svelte';

  const inputContainerClass = 'flex w-full pr-6 justify-end';
  const iconClass = 'text-secondary my-auto flex-shrink-0';

  export let locked: boolean = false;
</script>

<div class={inputContainerClass}>
  <slot />
  {#if locked}
    <Icon name="locked" class={iconClass} />
  {/if}
</div>
