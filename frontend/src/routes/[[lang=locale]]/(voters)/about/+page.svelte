<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {election} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
</script>

<BasicPage title={$t('about.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('about.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1>{$t('about.title')}</h1>
  </HeadingGroup>

  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    href={$getRoute(Route.Home)}
    text={$t('about.returnButton')} />

  <div>
    {@html sanitizeHtml(
      $t('about.content', {
        electionDate: new Date($election?.electionDate ?? '')
      })
    )}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('about.returnButton')} />
  </svelte:fragment>
</BasicPage>
