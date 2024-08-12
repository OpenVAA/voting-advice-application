<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, ROUTE} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import Layout from '../../Layout.svelte';
</script>

<svelte:head>
  <title>{$t('dynamic.intro.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('dynamic.intro.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.intro.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <!-- <PreHeading class="text-primary">{$t('dynamic.appName')}</PreHeading> -->
    <h1>{$t('dynamic.intro.title')}</h1>
  </HeadingGroup>

  <p class="text-center">
    {$t('dynamic.intro.ingress')}
  </p>
  <ol class="list-circled w-fit">
    <!-- TODO: Make this list dynamic so that it only displays the actual steps this app version has. Constituency selection is an example that may or may not be used. -->
    <li>{$t('dynamic.intro.list.opinions')}</li>
    <li>{$t('dynamic.intro.list.results')}</li>
    <li>{$t('dynamic.intro.list.details')}</li>
  </ol>

  <Button
    slot="primaryActions"
    href={$getRoute(ROUTE.Questions)}
    variant="main"
    icon="next"
    text={$t('dynamic.intro.continue')} />
</Layout>

<style lang="postcss">
  .list-circled {
    counter-reset: steps;
    @apply relative list-none pl-[2rem];
  }
  .list-circled li {
    counter-increment: steps;
    /* The pseudoclass prefixes are legal even though they are flagged as errors. There's currently no easy and safe way to disable the warning */
    @apply mt-12 first:mt-0;
  }
  .list-circled li::before {
    content: counter(steps);
    @apply absolute left-0 -mt-2 grid h-24 w-24 place-items-center rounded-full border-md border-[var(--line-color)];
  }
</style>
