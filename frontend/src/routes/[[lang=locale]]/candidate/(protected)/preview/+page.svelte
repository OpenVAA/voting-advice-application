<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {getContext} from 'svelte';
  import {afterNavigate, goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import type {AuthContext} from '$lib/utils/authenticationStore';
  import {Route, getRoute} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Icon} from '$lib/components/icon';
  import {Loading} from '$lib/components/loading';
  import SingleCardPage from '$lib/templates/singleCardPage/SingleCardPage.svelte';
  import LogoutButton from '$lib/candidate/components/logoutButton/LogoutButton.svelte';
  import type {PageData} from './$types';

  export let data: PageData;

  const {infoQuestions, opinionQuestions, candidates} = data;
  const {user} = getContext<AuthContext>('auth');

  let candidate: Promise<CandidateProps | undefined>;

  $: {
    const candidateId = $user?.candidate?.id;
    if (candidateId == null) error(500, 'No candidate id');
    candidate = candidates.then((d) => d.find((c) => c.id == `${candidateId}`));
  }

  /**
   * We use this to determine if we arrived via an external link or from within the app.
   */
  let externalReferrer = true;
  afterNavigate((n) => (externalReferrer = n.from?.route == null));
</script>

<SingleCardPage title={$t('candidateApp.preview.title')}>
  <svelte:fragment slot="note">
    <Icon name="info" />
    {$t('candidateApp.preview.tip')}
  </svelte:fragment>
  <svelte:fragment slot="banner">
    <LogoutButton />
    <Button
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      on:click={() => (externalReferrer ? goto($getRoute(Route.CandAppHome)) : history.back())}
      text={$t('header.back')} />
  </svelte:fragment>

  {#await candidate}
    <Loading showLabel />
  {:then content}
    {#if content}
      <EntityDetails {content} {opinionQuestions} {infoQuestions} />
    {:else}
      <div class="w-full text-center text-warning">{$t('candidateApp.preview.notFound')}</div>
    {/if}
  {/await}
</SingleCardPage>
