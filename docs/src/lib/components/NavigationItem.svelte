<script lang="ts">
  import { hasChildren, isActive } from '../utils/navigation';
  import type { NavigationItem as NavigationItemType, NavigationSection } from '$lib/navigation.type';
  import Self from './NavigationItem.svelte';

  interface Props {
    item: NavigationItemType | NavigationSection;
    url: URL;
    onLinkClick?: () => unknown;
  }

  const { item, url, onLinkClick = () => void 0 }: Props = $props();

  const itemActive = $derived(
    isActive(item.route, url) || (hasChildren(item) && item.children.some((child) => isActive(child.route, url)))
  );
</script>

{#if hasChildren(item)}
  <li>
    <details open={itemActive}>
      <summary>
        {item.title}
      </summary>
      <ul>
        {#each item.children as child}
          <Self item={child} {url} {onLinkClick} />
        {/each}
      </ul>
    </details>
  </li>
{:else}
  <li>
    <a href={item.route} class:menu-active={itemActive} class:secondary={item.isSecondary} onclick={onLinkClick}>
      {item.title}
    </a>
  </li>
{/if}

<style>
  .menu-active {
    background-color: var(--color-base-300);
    color: var(--color-neutral);
  }
  details > summary {
    cursor: pointer;
  }
</style>
