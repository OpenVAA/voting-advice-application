<!--@component

# Intro page

Shown after the front page in the voter app. Displays a list of the steps the voter will need to take. The list is constructed based on the data and settings.

### Settings

- `elections.disallowSelection`: Affects whether the select elections step is shown.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';

  const { constituenciesSelectable, electionsSelectable, getRoute, t } = getVoterContext();
</script>

<MainContent title={$t('dynamic.intro.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.intro.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t('dynamic.intro.ingress')}
  </p>
  <ol class="list-circled w-fit">
    {#if $electionsSelectable}
      <li>{$t('dynamic.intro.list.elections')}</li>
    {/if}
    {#if $constituenciesSelectable}
      <li>{$t('dynamic.intro.list.constituencies')}</li>
    {/if}
    <li>{$t('dynamic.intro.list.opinions')}</li>
    <li>{$t('dynamic.intro.list.results')}</li>
    <li>{$t('dynamic.intro.list.details')}</li>
  </ol>

  <Button
    slot="primaryActions"
    href={$getRoute('Elections')}
    variant="main"
    icon="next"
    text={$t('dynamic.intro.continue')} />
</MainContent>
