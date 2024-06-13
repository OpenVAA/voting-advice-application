<script lang="ts">
  import {createPageContext} from './parts/page.context';

  const {containerClass} = createPageContext();
</script>

<div id="container" class={$containerClass}>
  <div id="header-bg" />
  <header id="logo">Logo</header>
  <slot />
</div>

<style lang="postcss">
  #container {
    @apply grid min-h-screen w-full items-center justify-items-center;
    grid-template-columns: [cols-start] auto auto [cols-end];
    grid-template-rows: [rows-start] 5rem auto auto auto [rows-end];
    grid-template-areas:
      'logo header-actions'
      'notification notification'
      'content content'
      'actions actions';
  }

  #logo {
    @apply justify-self-start;
    grid-area: logo;
  }

  #header-bg {
    @apply self-stretch justify-self-stretch bg-base-300;
    grid-area: 1 / cols-start / 2 / cols-end;
  }
</style>
