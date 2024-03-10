<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';

  const title = $t('intro.title');
</script>

<BasicPage {title}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('intro.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1>{title}</h1>
  </HeadingGroup>

  <svelte:fragment slot="banner">
    <Button href="/help" variant="icon" icon="help" text={$t('actionLabels.help')} />
  </svelte:fragment>

  <p class="text-center">
    {$t('intro.ingress')}
  </p>
  <ol class="list-circled w-fit">
    <!-- TODO: Make this list dynamic so that it only displays the actual steps this app version has. Constituency selection is an example that may or may not be used. -->
    <li>{$t('intro.listItemOpinions')}</li>
    <li>{$t('intro.listItemResults')}</li>
    <li>{$t('intro.listItemDetails')}</li>
  </ol>

  <svelte:fragment slot="primaryActions">
    <Button
      href={$getRoute(Route.Questions)}
      variant="main"
      icon="next"
      text={$t('intro.continue')} />
  </svelte:fragment>
</BasicPage>

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
