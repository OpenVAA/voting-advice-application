<script lang="ts">
  import { page } from '$app/state';
  import { navigation } from '$lib/navigation.config';
  import type { NavigationSection } from '$lib/navigation.type';
  import { getFirstChild } from '$lib/utils/navigation';
  import GithubIcon from '$lib/components/GithubIcon.svelte';
  import { OpenVAALogo } from '$lib/components/openVAALogo';

  function isActiveSection(section: NavigationSection): boolean {
    return page.url.pathname.startsWith(section.route);
  }
</script>

<header class="fixed top-0 right-0 left-0 z-50 h-(--spacing-headerHeight) max-h-(--spacing-headerHeight) bg-base-300">
  <div class="navbar px-lg">
    <div class="navbar-start">
      <a href="/">
        <OpenVAALogo />
      </a>
    </div>
    <div class="navbar-center hidden md:block">
      <ul class="menu menu-horizontal">
        {#each navigation as section}
          {@const isActive = isActiveSection(section)}
          {@const firstChild = getFirstChild(section)}
          {#if firstChild}
            <li>
              <a href={firstChild} class="btn text-lg btn-ghost" data-active={isActive || undefined}>
                {section.title}
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
    <div class="navbar-end hidden justify-end md:flex"><GithubIcon /></div>

    <!-- Mobile menu button -->
    <div class="navbar-end md:hidden">
      <details class="dropdown dropdown-end">
        <summary class="btn btn-circle btn-ghost" aria-label="Open menu">
          <svg class="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        <ul
          class="dropdown-content menu mt-md flex w-max max-w-[80vw] flex-col gap-md rounded-md bg-base-100 p-2 py-lg text-lg shadow-lg">
          {#each navigation as section}
            {@const isActive = isActiveSection(section)}
            {@const firstChild = getFirstChild(section)}
            <li><a href={firstChild} class="flex justify-end">{section.title}</a></li>
          {/each}
          <li class="flex justify-end"><GithubIcon /></li>
        </ul>
      </details>
    </div>
  </div>
</header>

<style>
  [data-active] {
    color: oklch(var(--p));
    font-weight: 700;
  }
</style>
