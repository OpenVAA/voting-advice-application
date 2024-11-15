<script lang="ts">
  import { error, type Snapshot } from '@sveltejs/kit';
  import { EntityList } from '$lib/components/entityList';
  import { EntityListControls } from '$lib/components/entityListControls';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { StretchBackground } from '$lib/components/stretchBackground';
  import { Tabs } from '$lib/components/tabs';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import {
    allQuestions,
    answeredQuestions,
    candidateRankings,
    infoQuestions,
    opinionQuestions,
    partyRankings,
    resultsAvailable,
    settings,
    startFeedbackPopupCountdown,
    startSurveyPopupCountdown
  } from '$lib/legacy-stores';
  import { startEvent } from '$lib/utils/legacy-analytics/track';
  import { candidateFilters } from '$lib/utils/legacy-filters';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import Layout from '../../../Layout.svelte';
  import type { EntityCardProps } from '$lib/components/entityCard';

  /**
   * The currently active tab in the results. We want this to persist between opening entity details and returning to the results.
   */
  let activeTab = 0;
  export const snapshot: Snapshot<number> = {
    capture: () => activeTab,
    restore: (value) => (activeTab = value)
  };

  // Which entity sections to show
  const sections = $settings.results.sections as Array<EntityType>;
  if (!sections?.length) error(500, 'No sections to show');

  // These will hold the filtered entities returned by EntityListControls
  let filteredCandidates: Array<WrappedEntity<CandidateProps>> = [];
  let filteredParties: Array<WrappedEntity<PartyProps>> = [];

  /** A utility synced boolean indicating whether results are available, i.e. that we have enough answers to perform matching */
  let resultsAvailableSync = false;
  $resultsAvailable.then((v) => {
    resultsAvailableSync = v;
    startEvent(v ? 'results_ranked' : 'results_browse', {
      section: sections[activeTab],
      numAnswers: Object.keys($answeredQuestions).length
    });
    if ($settings.results.showFeedbackPopup != null) startFeedbackPopupCountdown($settings.results.showFeedbackPopup);
    if ($settings.survey?.showIn && $settings.survey.showIn.includes('resultsPopup'))
      startSurveyPopupCountdown($settings.results.showSurveyPopup);
  });

  /**
   * The possible additional card props to add to cards on EntityLists. Currenltly, this only includes possible extra questions.
   */
  let additionalEcProps: Record<string, Partial<EntityCardProps>> = { candidate: {}, party: {} };

  $: updateAdditionalEcProps($allQuestions, $settings);

  async function updateAdditionalEcProps(
    currentAllQuestions: Promise<Record<string, QuestionProps>>,
    currentSettings: AppSettings
  ) {
    const allQuestionsSync = await currentAllQuestions;
    for (const type in additionalEcProps) {
      const questionSettings = currentSettings.results.cardContents[
        type as keyof AppSettings['results']['cardContents']
      ].filter((c) => typeof c === 'object' && c.question != null) as Array<AppSettingsQuestionRef>;
      if (questionSettings.length) {
        const questions: EntityCardProps['questions'] = [];
        for (const qs of questionSettings) {
          const { question, ...rest } = qs;
          if (allQuestionsSync[question])
            questions.push({
              question: allQuestionsSync[question],
              ...rest
            });
        }
        additionalEcProps[type].questions = questions.length ? questions : undefined;
      }
    }
  }

  /**
   * Create `EntityCard` properties for a candidate.
   * @param candidate The wrapped candidate
   */
  function parseCandidate(candidate: WrappedEntity<CandidateProps>): EntityCardProps {
    return {
      content: candidate,
      action: candidateRoute(candidate),
      ...additionalEcProps.candidate
    };
  }

  /**
   * Create `EntityCard` properties for a party.
   * @param party The wrapped party
   * @param allCandidates All wrapped candidates. If these are supplied the parties members will be selected from the list and added as subcards to the party.
   * @param maxSubcards The maximum number of subcards to show if `allCandidates` are supplied.
   */
  function parseParty(
    party: WrappedEntity<PartyProps>,
    allCandidates?: Array<WrappedEntity<CandidateProps>>,
    maxSubcards = 3
  ): EntityCardProps {
    return {
      content: party,
      action: $getRoute({ route: ROUTE.ResultParty, id: party.entity.id }),
      subcards: allCandidates?.length
        ? allCandidates.filter((c) => c.entity.party?.id === party.entity.id).map(parseCandidate)
        : undefined,
      maxSubcards,
      ...additionalEcProps.party
    };
  }

  /** Shorthand for building a candidate link route */
  function candidateRoute(candidate: WrappedEntity<CandidateProps>) {
    return $getRoute({ route: ROUTE.ResultCandidate, id: candidate.entity.id });
  }

  let title;
  $: title = resultsAvailableSync ? $t('results.title.results') : $t('results.title.browse');
</script>

<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout {title}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.results.heroEmoji')} />
  </figure>

  <div class="mb-xl text-center">
    {#if resultsAvailableSync}
      {$t('dynamic.results.ingress.results')}
    {:else}
      {@html sanitizeHtml(
        $t('dynamic.results.ingress.browse', {
          questionsLink: `<a href="${$getRoute(ROUTE.Questions)}">${$t('results.ingress.questionsLinkText', {
            numQuestions: $settings.matching.minimumAnswers
          })}</a>`
        })
      )}
    {/if}
  </div>

  <StretchBackground padding="medium" bgColor="base-300" toBottom class="min-h-[75vh]">
    <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

    {#if sections.length > 1}
      <Tabs
        tabs={sections.map((entityType) => $t(assertTranslationKey(`common.${entityType}.plural`)))}
        bind:activeIndex={activeTab}
        on:change={({ detail }) => startEvent('results_changeTab', { section: sections[detail.index] })}
        class="mx-10" />
    {/if}

    <!-- Candidates -->
    {#if sections[activeTab] === 'candidate'}
      {#await Promise.all([$candidateRankings, $candidateFilters, $opinionQuestions, $infoQuestions])}
        <Loading showLabel class="mt-lg" />
      {:then [allCandidates, candidateFilters]}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.candidates.numShown', { numShown: filteredCandidates.length })}
          {#if filteredCandidates.length !== allCandidates.length}
            <span class="font-normal text-secondary"
              >{$t('results.candidates.total', { numTotal: allCandidates.length })}</span>
          {/if}
        </h2>
        <EntityListControls
          contents={allCandidates}
          filterGroup={candidateFilters}
          bind:output={filteredCandidates}
          class="mx-10 mb-md" />
        <EntityList cards={filteredCandidates.map(parseCandidate)} class="mb-lg" />
      {/await}

      <!-- Parties -->
    {:else if sections[activeTab] === 'party'}
      <!-- Instead of candidateRankings we just create a Promise that resolves to undefined if subcards are not to be shown. In that case allCandidates will be undefined, and parseParty will not add subcards. -->
      {#await Promise.all( [$partyRankings, $settings.results.cardContents.party.includes('candidates') ? $candidateRankings : Promise.resolve(undefined), $opinionQuestions, $infoQuestions] )}
        <Loading showLabel class="mt-lg" />
      {:then [allParties, allCandidatesOrUndef]}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.parties.numShown', { numShown: filteredParties.length })}
          {#if filteredParties.length !== allParties.length}
            <span class="font-normal text-secondary"
              >{$t('results.parties.total', { numTotal: allParties.length })}</span>
          {/if}
        </h2>
        <EntityListControls contents={allParties} bind:output={filteredParties} class="mx-10 mb-md" />
        <EntityList cards={filteredParties.map((p) => parseParty(p, allCandidatesOrUndef))} class="mb-lg" />
      {/await}
    {/if}
  </StretchBackground>
</Layout>
