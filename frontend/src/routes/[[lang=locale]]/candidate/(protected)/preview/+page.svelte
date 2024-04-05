<script lang="ts">
  import {getContext} from 'svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import {locale, t} from '$lib/i18n';
  import {Icon} from '$lib/components/icon';
  import {getInfoQuestions, getOpinionQuestions, getNominatedCandidates} from '$lib/api/getData';

  const {userStore} = getContext<CandidateContext>('candidate');

  let infoQuestions: QuestionProps[];
  getInfoQuestions({locale: $locale}).then((res) => (infoQuestions = res));

  let opinionQuestions: QuestionProps[];
  getOpinionQuestions({locale: $locale}).then((res) => (opinionQuestions = res));

  let candidate: CandidateProps | undefined;
  getNominatedCandidates({
    loadAnswers: true,
    locale: $locale,
    id: $userStore?.candidate?.id.toString()
  }).then((res) => (candidate = res[0]));
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
