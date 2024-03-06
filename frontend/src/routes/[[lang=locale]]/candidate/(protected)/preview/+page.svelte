<script lang="ts">
  import {t} from '$lib/i18n';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import SingleCardPage from '$lib/templates/singleCardPage/SingleCardPage.svelte';
  import {getContext} from 'svelte';
  import type {AuthContext} from '$lib/utils/authenticationStore';
  import LogoutButton from '$lib/candidate/components/logoutButton/LogoutButton.svelte';

  export let data: {
    infoQuestions: QuestionProps[];
    opinionQuestions: QuestionProps[];
    candidates: CandidateProps[];
  };

  const {opinionQuestions, infoQuestions, candidates} = data;
  const {user} = getContext<AuthContext>('auth');
  const candidate = candidates.find(
    (c: CandidateProps) => c.id === $user?.candidate?.id.toString()
  );
</script>

{#if !candidate}
  <span>{$t('candidateApp.preview.notFound')}</span>
{:else}
  <SingleCardPage title={$t('candidateApp.preview.title')}>
    <LogoutButton slot="banner" />
    <CandidateDetailsCard {candidate} {opinionQuestions} {infoQuestions} />
  </SingleCardPage>
{/if}
