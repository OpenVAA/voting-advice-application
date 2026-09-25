<script lang="ts">
  import Host from './Host.svelte';
  import Opener from './Opener.svelte';
  import PortalOpener from './PortalOpener.svelte';
  import Provider from './Provider.svelte';
  import TypedProvider from './TypedProvider.svelte';
  import { FILTER_KEY, ROOT_KEY, UNRELATED_KEY, VOTER_KEY } from './keys.svelte';
  let { mode, bridge, showOpener = true, count = 0 }: { mode: 'none' | 'all' | 'named' | 'typed' | 'portal'; bridge: boolean; showOpener?: boolean; count?: number } = $props();
</script>
<Provider entries={[[ROOT_KEY, { name: 'root' }]]}>
  <Host {bridge} />
  <Provider entries={[[VOTER_KEY, { name: 'voter' }], [FILTER_KEY, { name: 'filter' }], [UNRELATED_KEY, { name: 'e.g. a NavGroup/Tabs flag' }]]}>
    <TypedProvider>
      {#if showOpener}
        {#if mode === 'portal'}<PortalOpener {count} />{:else}<Opener {mode} />{/if}
      {/if}
    </TypedProvider>
  </Provider>
</Provider>
