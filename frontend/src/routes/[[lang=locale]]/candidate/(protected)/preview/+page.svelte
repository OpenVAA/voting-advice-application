<script lang="ts">
  import {t} from '$lib/i18n';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import SingleCardPage from '$lib/templates/singleCardPage/SingleCardPage.svelte';
  import {getContext} from 'svelte';
  import type {AuthContext} from '$lib/utils/authenticationStore';

  export let data: {
    infoQuestions: QuestionProps[];
    opinionQuestions: QuestionProps[];
    candidates: CandidateProps[];
  };

  const {opinionQuestions, infoQuestions, candidates} = data;
  const {user}: AuthContext = getContext('auth');
  const candidate = candidates.find(
    (c: CandidateProps) => c.id === $user?.candidate?.id.toString()
  );
</script>

{#if !candidate}
  <span>{$t('candidateApp.preview.notFound')}</span>
{:else}
  <SingleCardPage title={$t('candidateApp.preview.title')}>
    <CandidateDetailsCard {candidate} {opinionQuestions} {infoQuestions} />
  </SingleCardPage>
{/if}
