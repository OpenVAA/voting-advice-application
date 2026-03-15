<script lang="ts">
  import { navigation } from '$lib/navigation.config';
  import { getFirstChild } from '$lib/utils/navigation';
  import GithubIcon from '$lib/components/GithubIcon.svelte';
  import { OpenVAALogo } from '$lib/components/openVAALogo';
</script>

<footer class="my-lg text-center text-secondary">
  <ul class="flex flex-col items-center justify-center gap-x-lg gap-y-md md:flex-row">
    <li><a href="/"><OpenVAALogo color="secondary" size="sm" /></a></li>
    {#each navigation as section}
      {@const firstChild = getFirstChild(section)}
      {#if firstChild}
        <li>
          <a href={firstChild}>
            {section.title}
          </a>
        </li>
      {/if}
    {/each}
    <li><GithubIcon /></li>
  </ul>
</footer>
