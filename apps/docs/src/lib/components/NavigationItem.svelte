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
      <summary class="cursor-pointer">
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
    <a
      href={item.route}
      class={[itemActive && 'menu-active bg-base-300 text-neutral', item.isSecondary && 'secondary']}
      onclick={onLinkClick}>
      {item.title}
    </a>
  </li>
{/if}
