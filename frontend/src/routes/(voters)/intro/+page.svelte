<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {BasicPage} from '$lib/components/basicPage';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {CheckIcon} from '$lib/components/icons';
  import {NextButton} from '$lib/components/nextButton';

  const title = $_('intro.title');
</script>

<BasicPage {title}>
  <HeroEmoji slot="hero">🚀</HeroEmoji>

  <svelte:fragment slot="aside">
    <CheckIcon /> This is just a temporary <strong>example</strong>
  </svelte:fragment>

  <svelte:fragment slot="heading">
    <p class="text-accent">{$page.data.appLabels.appTitle}</p>
    <h1>{title}</h1>
  </svelte:fragment>

  <p class="text-center">
    {$_('intro.ingress')}
  </p>
  <ol class="list-circled w-fit">
    <li>{$_('intro.listItemOpinions')}</li>
    <li>{$_('intro.listItemResults')}</li>
    <li>{$_('intro.listItemDetails')}</li>
  </ol>

  <svelte:fragment slot="primaryActions">
    <NextButton href="/questions">{$_('intro.continue')}</NextButton>
  </svelte:fragment>
</BasicPage>

<style lang="postcss">
  .list-circled {
    counter-reset: steps;
    @apply relative list-none pl-[2rem];
  }
  .list-circled li {
    counter-increment: steps;
    /* The pseudoclass prefixes are legal even though they are flagged as errors.
     * There's currently no easy and safe way to disable the warning */
    @apply mt-12 first:mt-0;
  }
  .list-circled li::before {
    content: counter(steps);
    @apply absolute left-0 -mt-2 grid h-24 w-24 place-items-center rounded-full border-md border-[var(--line-color)];
  }
</style>
