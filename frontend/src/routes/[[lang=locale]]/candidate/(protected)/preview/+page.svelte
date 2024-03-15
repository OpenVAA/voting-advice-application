<script lang="ts">
  import {getContext} from 'svelte';
  import {t} from '$lib/i18n';
  import type {AuthContext} from '$lib/utils/authenticationStore';
  import {Icon} from '$lib/components/icon';
  import {EntityDetails} from '$lib/components/entityDetails';
  import SingleCardPage from '$lib/templates/singleCardPage/SingleCardPage.svelte';
  import LogoutButton from '$lib/candidate/components/logoutButton/LogoutButton.svelte';
  import type {PageData} from './$types';

  export let data: PageData;

  const {user} = getContext<AuthContext>('auth');

  let infoQuestions: QuestionProps[];
  let opinionQuestions: QuestionProps[];
  let candidates: CandidateProps[];
  let candidate: CandidateProps | undefined;

  $: {
    infoQuestions = data.infoQuestions;
    opinionQuestions = data.opinionQuestions;
    candidates = data.candidates;
    candidate = candidates.find((c) => c.id === `${$user?.candidate?.id}`);
  }
</script>

{#if !candidate}
  <span>{$t('candidateApp.preview.notFound')}</span>
{:else}
  <SingleCardPage title={$t('candidateApp.preview.title')}>
    <svelte:fragment slot="note">
      <Icon name="info" />
      {$t('candidateApp.preview.tip')}
    </svelte:fragment>
    <LogoutButton slot="banner" />
    <EntityDetails entity={candidate} {opinionQuestions} {infoQuestions} />
  </SingleCardPage>
{/if}
