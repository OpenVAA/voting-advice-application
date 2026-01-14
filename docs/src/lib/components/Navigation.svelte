<script lang="ts">
  import { page } from '$app/stores';
  import { findActiveSection, hasChildren, isActive } from '../utils/navigation';

  $: activeSection = findActiveSection($page.url);
</script>

{#if activeSection}
  <nav
    class="flex max-w-[20rem] min-w-[20rem] flex-col gap-md overflow-y-auto border-r border-base-300 bg-base-100 p-lg">
    <h3 class="font-bold">{activeSection.title}</h3>

    <ul class="menu-compact menu m-0 -ms-12 p-0">
      {#each activeSection.children as item}
        {#if hasChildren(item)}
          {@const itemActive =
            isActive(item.route, $page.url) || item.children.some((child) => isActive(child.route, $page.url))}
          <li>
            <details open={itemActive}>
              <summary>
                {item.title}
              </summary>
              <ul>
                {#each item.children as child}
                  {@const childActive = isActive(child.route, $page.url)}
                  <li>
                    <a href={child.route} class:menu-active={childActive}>
                      {child.title}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
        {:else}
          {@const itemActive = isActive(item.route, $page.url)}
          <li>
            <a href={item.route} class:menu-active={itemActive} class:secondary={item.isSecondary}>
              {item.title}
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>
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
