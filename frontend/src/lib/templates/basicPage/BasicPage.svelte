<script lang="ts">
  import {getContext} from 'svelte';
  import {t} from '$lib/i18n';
  import {appType} from '$lib/stores';
  import {Breakpoints} from '$lib/utils/breakpoints';
  import {concatProps} from '$lib/utils/components';
  import {darkMode} from '$lib/utils/darkMode';
  import {Page} from '../page';
  import type {BasicPageProps} from './BasicPage.type';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  type $$Props = BasicPageProps;

  export let title: $$Props['title'];
  export let noteClass: $$Props['noteClass'] = 'text-secondary text-center max-w-xl';
  export let noteRole: $$Props['noteRole'] = 'note';
  export let primaryActionsLabel: $$Props['primaryActionsLabel'] = undefined;
  export let titleClass: $$Props['titleClass'] = '';

  let screenWidth = 0;
  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  let videoHeight = 0;
  let videoWidth = 0;
  let hasVideo = false;
  $: hasVideo = videoWidth > 0 && videoHeight > 0;

  const userStore = getContext<CandidateContext>('candidate')?.user;

  // We are in the candidate application and the user has logged in
  // TODO: Figure out a way to define this LogoutButton part only within the
  // candidate route. This can be done with the new, slot-less templates
  const showLogoutButton = $appType === 'candidate' && userStore;
</script>

<!--
@component
The basic template for pages in both the Voter and Candidate Apps.

The content is provided in named slots with the default slot contents forming the main content.

Use the properties to add to the classes of the elements containing the slots, to define some ids, pass Aria labels and show an optional progress bar in the header. You can also pass any valid properties of the `<Page>` template this is based on.

NB! If you want to pass some slots conditionally, you cannot wrap the slots in an `#if` block due to a limitation of Svelte. This may be fixed by https://github.com/sveltejs/svelte/pull/8304 in the future, but until then the following code will not work:

```tsx
  {#if emoji !== ''}
    <HeroEmoji slot="hero" {emoji}/>
  {/if}
```

Instead, you have to use a wrapper. Note that this will also always result in the rendering of an empty `<figure>` element even if there's no content.

```tsx
  <svelte:fragment slot="hero">
    {#if emoji !== ''}
      <HeroEmoji {emoji}/>
    {/if}
  </svelte:fragment>
```

### Slots

- default: main content of the page
- `banner`: content for the secondary actions displayed on the right side of the `<header>`
- `note`: optional content for the complementary notification displayed at the top of the page, right below the `<header>`
- `video`: optional content for a video displayed at the top of the page, usually a `<Video>` component
- `hero`: an optional hero image
- `heading`: optional content for the main title block, defaults to a `<h1>` element containing the required `title` property
- `primaryActions`: optional content for the primary actions displayed at the bottom of the page

### Properties

- `title`: The required page `title`.
- `noteClass`: Optional class string to add to the `<div>` tag wrapping the `note` slot.
- `noteRole`: Aria role for the `note` slot. @default 'note'
- `primaryActionsLabel`: Optional `aria-label` for the section that contains the primary page actions. @default $t('aria.primaryActionsLabel')
- `titleClass`: Optional class string to add to the `<div>` tag wrapping the `title` slot.
- Any valid properties of the `Page` template.

### Usage

```tsx
  <BasicPage title="Let's start!">

    <svelte:fragment slot="banner">
      <Button on:click={showInfo} variant="icon" icon="info" text="Show info"/>
    </svelte:fragment>

    <HeroEmoji slot="hero" emoji="🚀"/>

    <svelte:fragment slot="note">
      <Icon name="check"/> Your constituency is <strong>Loremipsum</strong>
    </svelte:fragment>

    <HeadingGroup slot="heading">
      <PreHeading class="text-accent">Preheading</PreHeading>
      <h1>Let's Start!</h1>
    </HeadingGroup>

    <p class="text-center">
      This is the body text of the page.
    </p>
    
    <svelte:fragment slot="primaryActions">
      <Button href={$getRoute(Route.Foo)} variant="main" icon="next" text="Continue"/>
    </svelte:fragment>
    
  </BasicPage>
```
-->

<svelte:window bind:innerWidth={screenWidth} />

<!-- The complicated condition for invertLogo ensures that when video is present behind the header, the logo is always white. Invert would otherwise render the default logo in dark mode. -->
<Page
  {title}
  invertLogo={hasVideo && screenWidth < Breakpoints.sm && !$darkMode}
  {...concatProps($$restProps, {
    mainClass: 'gap-y-lg',
    headerClass: hasVideo ? '!absolute w-full bg-transparent z-10' : undefined
  })}>
  <!-- Header -->
  <svelte:fragment slot="banner">
    <div
      class="vaa-basicPage-actions flex gap-0"
      style:--headerIcon-color={hasVideo && screenWidth < Breakpoints.sm
        ? 'white'
        : 'oklch(var(--p))'}>
      {#if showLogoutButton}
        <LogoutButton variant="icon" />
      {/if}
      <slot name="banner" />
    </div>
  </svelte:fragment>

  <!-- Default slot for <Page> starts -->

  <!-- Note -->
  {#if $$slots.note}
    <div class={noteClass} role={noteRole}>
      <slot name="note" />
    </div>
  {/if}

  <!-- Main content -->
  <div class="flex w-full flex-grow flex-col items-stretch justify-center sm:items-center">
    <!-- Video -->
    {#if $$slots.video}
      <div
        bind:clientHeight={videoHeight}
        bind:clientWidth={videoWidth}
        class="-ml-safelgl -mr-safelgr -mt-lg flex w-screen justify-center sm:w-full {hasVideo
          ? 'grow'
          : ''} sm:mt-[1.75rem] sm:grow-0">
        <slot name="video" />
      </div>
    {/if}

    <!-- Hero image -->
    {#if $$slots.hero}
      <figure role="presentation">
        <slot name="hero" />
      </figure>
    {/if}

    <!-- Title block -->
    <div class="w-full max-w-xl py-lg text-center {titleClass}">
      <slot name="heading">
        <h1>{title}</h1>
      </slot>
    </div>

    <!-- Main content -->
    <div class="flex w-full max-w-xl flex-col items-center">
      <slot />
    </div>
  </div>

  <!-- Main actions -->
  {#if $$slots.primaryActions}
    <section
      class="flex w-full max-w-xl flex-col items-center justify-end"
      aria-label={primaryActionsLabel ?? $t('aria.primaryActionsLabel')}>
      <slot name="primaryActions" />
    </section>
  {/if}
</Page>

<style lang="postcss">
  :global(.vaa-basicPage-actions > a:not([disabled])),
  :global(.vaa-basicPage-actions > * > a:not([disabled])),
  :global(.vaa-basicPage-actions > button:not([disabled])),
  :global(.vaa-basicPage-actions > * > button:not([disabled])) {
    /* !text is valid class prefix */
    @apply !text-[var(--headerIcon-color)];
  }
</style>
