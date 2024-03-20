<script lang="ts">
  import {getContext} from 'svelte';
  import LogoutButton from '$lib/candidate/components/logoutButton/LogoutButton.svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {PageData} from './$types';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import {t} from '$lib/i18n';
  import {Icon} from '$lib/components/icon';

  export let data: PageData;

  const {user} = getContext<CandidateContext>('candidate');

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
    <CandidateDetailsCard {candidate} {opinionQuestions} {infoQuestions} />
  </SingleCardPage>
{/if}
