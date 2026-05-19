<script lang="ts">
  import { page } from '$app/state';
  import { findActiveSection } from '../utils/navigation';
  import { navigation } from '../navigation.config';
  import NavigationItem from './NavigationItem.svelte';

  type Props = {
    full?: boolean;
    onLinkClick?: () => unknown;
    class?: string;
  };

  const { full = false, onLinkClick = () => void 0, class: className = '' }: Props = $props();

  const url = $derived(page.url);
  const activeSection = $derived(findActiveSection(url));
</script>

<nav class="flex flex-col gap-md overflow-y-auto {className}">
  {#if full && navigation.length > 0}
    <ul class="menu-compact menu m-0 -ms-12 p-0">
      {#each navigation as section}
        <NavigationItem item={section} {url} {onLinkClick} />
      {/each}
    </ul>
  {:else if !full && activeSection}
    <h3 class="font-bold">{activeSection.title}</h3>
    <ul class="menu-compact menu m-0 -ms-12 p-0">
      {#each activeSection.children as item}
        <NavigationItem {item} {url} {onLinkClick} />
      {/each}
    </ul>
  {/if}
</nav>
