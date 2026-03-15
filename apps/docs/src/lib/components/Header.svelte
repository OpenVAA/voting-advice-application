<script lang="ts">
  import { page } from '$app/state';
  import { navigation } from '$lib/navigation.config';
  import type { NavigationSection } from '$lib/navigation.type';
  import { getFirstChild } from '$lib/utils/navigation';
  import GithubIcon from '$lib/components/GithubIcon.svelte';
  import { OpenVAALogo } from '$lib/components/openVAALogo';
  import { DRAWER_ID } from '../consts';

  function isActiveSection(section: NavigationSection): boolean {
    return page.url.pathname.startsWith(section.route);
  }
</script>

<header class="h-(--spacing-headerHeight) max-h-(--spacing-headerHeight) bg-base-300">
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

    <!-- Mobile menu -->
    <div class="navbar-end gap-md md:hidden">
      <GithubIcon />
      <div class="flex-none lg:hidden">
        <label for={DRAWER_ID} aria-label="open sidebar" class="btn btn-circle btn-ghost">
          <svg class="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
      </div>
    </div>
  </div>
</header>

<style>
  [data-active] {
    color: oklch(var(--p));
    font-weight: 700;
  }
</style>
