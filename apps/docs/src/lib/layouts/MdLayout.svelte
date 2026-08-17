<script lang="ts">
  import type { Snippet } from 'svelte';
  import PeerNavigation from '$lib/components/PeerNavigation.svelte';
  import TableOfContents from '$lib/components/TableOfContents.svelte';
  import './prism-vs.css';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="col-start-1 col-end-3 grid-cols-subgrid md:grid">
  <aside class="toc-sidebar col-start-2 row-span-full hidden p-lg ps-0 md:p-xl lg:block">
    <TableOfContents contentId="prose-content" maxLevel={3} />
  </aside>
  <article
    id="prose-content"
    class="col-span-full col-start-1 max-w-[60rem] overflow-x-auto p-lg md:p-xl lg:col-span-1">
    {@render children()}
  </article>
  <div class="col-span-full p-lg md:p-xl lg:col-span-1">
    <PeerNavigation />
  </div>
</div>

<style>
  .toc-sidebar {
    position: relative;
  }
</style>
