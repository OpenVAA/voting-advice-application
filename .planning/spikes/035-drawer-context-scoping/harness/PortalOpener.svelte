<script lang="ts">
  import Consumer from './Consumer.svelte';
  import Portal from './Portal.svelte';
  let { count }: { count: number } = $props();
</script>
<Portal target={() => document.getElementById('host-slot')!}><Consumer label="portaled" /><span data-testid="count">{count}</span></Portal>
