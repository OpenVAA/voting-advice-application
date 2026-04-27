<script lang="ts">
  import { SCREENSHOTS, SCREENSHOT_BASE_PATH } from '$lib/screenshots';
  import type { Screenshot } from '$lib/screenshots';
  import { OPENVAA_REPO_URL } from '$lib/consts';

  let content: HTMLDivElement;
  let firstItem = $state(0);
  let numItems = $state(getNumItems());
  let autoScroll = $state(true);
  let selectedScreenshot = $state<string | null>(null);
  let touchStartX = $state(0);
  let touchEndX = $state(0);

  /**
   * Screenshots padded on both ends to allow infinite scrolling effect.
   */
  let screenshots = $derived.by(() => {
    const partialPageLength = SCREENSHOTS.length % numItems;
    const prefix = SCREENSHOTS.slice(-numItems);
    const suffix = SCREENSHOTS.slice(0, partialPageLength + numItems);
    return [...prefix, ...SCREENSHOTS, ...suffix];
  });

  /**
   * Total number of scrollable items without the padding (except that to fill the last page)
   */
  let numScrollable = $derived(screenshots.length - 2 * numItems);

  // Update numItems based on screen width
  $effect(() => {
    const updateNumItems = () => (numItems = getNumItems());
    updateNumItems();
    window.addEventListener('resize', updateNumItems);
    return () => window.removeEventListener('resize', updateNumItems);
  });

  // Auto scroll screenshots
  $effect(() => {
    const interval = setInterval(() => {
      if (autoScroll) scrollItems('next');
    }, 4000);
    return () => clearInterval(interval);
  });

  function getNumItems(): number {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 500) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    if (width < 1280) return 4;
    if (width < 1480) return 5;
    return 6;
  }

  function scrollManually(direction: 'prev' | 'next') {
    autoScroll = false;
    scrollItems(direction);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      scrollManually(swipeDistance > 0 ? 'next' : 'prev');
    }
  }

  function scrollItems(direction: 'prev' | 'next') {
    firstItem = (firstItem + (direction === 'prev' ? -numItems : numItems)) % numScrollable;
    if (firstItem < 0) {
      firstItem += numScrollable;
    }
  }

  function toggleSelectedScreenshot(screenshot: Screenshot) {
    autoScroll = false;
    if (selectedScreenshot === screenshot.filename) {
      selectedScreenshot = null;
    } else {
      selectedScreenshot = screenshot.filename;
    }
  }
</script>

<section
  class="relative flex w-full flex-col items-center overflow-hidden bg-base-300"
  style:--firstItem={firstItem}
  style:--numItems={numItems}
  style:--itemWidth="calc((100vw - (var(--numItems) - 1) * var(--itemGap) - 2 * var(--sideGap)) / var(--numItems))"
  style:--sideGap="4rem"
  style:--itemGap="2rem"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}>
  <button class="absolute top-0 bottom-0 left-0 z-10 h-full w-(--sideGap)" onclick={() => scrollManually('prev')}
    ><span class="sr-only">Show previous</span></button>
  <div
    class="flex w-max translate-x-[calc(-1*(var(--firstItem)+var(--numItems))*var(--itemWidth)-(var(--firstItem)+var(--numItems))*var(--itemGap))] gap-(--itemGap) place-self-start px-(--sideGap)
    pb-[calc(2*var(--spacing-xl))] transition-transform md:pt-xl">
    {#each screenshots as screenshot}
      <button
        class="group relative aspect-[0.4884488449] w-(--itemWidth) overflow-hidden rounded-md shadow-2xl transition-all
               odd:translate-y-xl hover:scale-[1.025]"
        onclick={() => toggleSelectedScreenshot(screenshot)}>
        <img
          src="{SCREENSHOT_BASE_PATH}{screenshot.filename}"
          alt="{screenshot.caption} • VAA: {screenshot.vaa}"
          class="h-full w-full object-cover" />
        <div
          class="absolute right-0 bottom-0 left-0 translate-y-full bg-base-200 p-md text-center
          text-sm text-base-content group-hover:translate-y-0 {selectedScreenshot === screenshot.filename
            ? 'translate-y-0!'
            : ''} transition-transform">
          {screenshot.caption} <span class="text-secondary">• VAA: {screenshot.vaa}</span>
        </div>
      </button>
    {/each}
  </div>
  <button class="absolute top-0 right-0 bottom-0 z-10 h-full w-(--sideGap)" onclick={() => scrollManually('next')}
    ><span class="sr-only">Show next</span></button>

  <button
    class="btn mx-auto mb-lg rounded-lg bg-primary px-xl py-md text-center text-lg text-primary-content"
    onclick={() => content.scrollIntoView({ behavior: 'smooth' })}>Version <code>0.1 Shiba</code> out now!</button>
  <img
    src="/images/shiba-inu-sitting.png"
    alt="A Shiba inu dog, the mascot of the OpenVAA 0.1 release"
    class="pointer-events-none absolute right-xl bottom-0 h-[20rem] max-h-[min(30dvh,50dvw)] translate-x-[calc(50%+var(--spacing-xl))] select-none lg:translate-x-0" />
</section>

<div class="mx-auto flex max-w-[50rem] flex-col gap-lg px-lg py-xl text-lg leading-[1.6] md:px-xl" bind:this={content}>
  <p>
    OpenVAA is a comprehensive open-source framework for building configurable <a
      class="link"
      href="/publishers-guide/what-are-vaas/intro">Voting Advice Applications</a> (VAAs). It’s designed to work in any election
    context and is fully localisable, accessible, modular and free to use.
  </p>
  <p>
    OpenVAA was built for two reasons: to offer a transparent alternative for proprietary VAAs, and to kickstart
    development of more and better VAAs. OpenVAA is built by developers and researchers and maintained by a <a
      class="link"
      href="/about/association">Finnish non-profit</a> of the same name.
  </p>

  <div class="flex flex-col-reverse items-end gap-md rounded-lg bg-base-300 p-lg md:flex-row">
    <img
      src="/images/shiba-inu-facing-front.png"
      alt="A Shiba inu dog, the mascot of the OpenVAA 0.1 release"
      class="-mb-lg max-w-[5rem] md:max-w-[7rem]" />
    <div>
      <h4 class="mb-md font-bold">Version <code>0.1 Shiba</code> is out now!</h4>
      <ul class="arrow-list text-primary">
        <li><a href="/developers-guide/quick-start" class="link">Quick start for developers</a></li>
        <li>
          <a href="/publishers-guide/intro" class="link">Guide for publishers of VAAs</a>
        </li>
        <li><a href={OPENVAA_REPO_URL} class="link">View source on GitHub</a></li>
      </ul>
    </div>
  </div>

  <h2 class="mt-lg text-xl font-bold">Main Features</h2>

  <div class="grid gap-md sm:grid-cols-3">
    <span>🔎 Transparent</span>
    <span>💸 Free to use</span>
    <span>🌍 Fully localisable</span>
    <span>🗳 Use in any elections</span>
    <span>🤲 Accessible</span>
    <span>🎓 Research-friendly</span>
    <span>🧩 Modular and fully editable</span>
    <span>🧮 Configurable and extensible matching algorithm</span>
    <span>🧑‍💼 Includes an app for candidates</span>
    <ul class="arrow-list col-span-full place-self-end">
      <li><a href="/about/features" class="link text-primary">See expanded list of features</a></li>
    </ul>
  </div>

  <h2 class="mt-lg text-xl font-bold">See OpenVAA in Action</h2>

  <p>
    The following VAAs are currently online. Note that you may experience slow loading and related issues because the
    instances are hosted on low-cost tiers.
  </p>

  <div class="grid gap-lg sm:grid-cols-3">
    {#snippet vaaExample({ filename, href, name }: { filename: string; href: string; name: string })}
      <div class="text-md text-center">
        <a {href} class="group flex flex-col items-center gap-sm">
          <img
            src="{SCREENSHOT_BASE_PATH}{filename}"
            alt="Screenshot of {name}"
            class="m-md aspect-auto max-h-[60dvh] w-auto rounded-md shadow-lg transition-transform group-hover:scale-[1.025]" />
          <span class="link text-base">{name}</span></a>
      </div>
    {/snippet}
    {@render vaaExample({
      filename: 'nuorisoala-finnish-local-elections-2025-vaa-3.png',
      href: 'https://nuortenvaalikone.openvaa.org/',
      name: 'Election Compass for Young Voters, 2025 Finnish local elections'
    })}
    {@render vaaExample({
      filename: 'nuorisoala-finnish-local-elections-2025-vaa-educational-mode-1.png',
      href: 'https://voting-advice-application-qu5v.onrender.com',
      name: 'Educational ‘Game’ Mode VAA, 2025 Finnish local elections'
    })}
    {@render vaaExample({
      filename: 'eu-elections-2024-vaa-screenshot-1.png',
      href: 'https://vaalikone.openvaa.org/',
      name: 'OpenVAA Election Compass, 2024 European elections, Finland'
    })}
  </div>
</div>
