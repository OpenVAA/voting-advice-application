<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {startEvent} from '$lib/utils/analytics/track';
  import {t} from '$lib/i18n';
  import {candidateFilters} from '$lib/utils/filters';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {
    allQuestions,
    answeredQuestions,
    candidateRankings,
    infoQuestions,
    openFeedbackModal,
    opinionQuestions,
    partyRankings,
    resultsAvailable,
    settings
  } from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import type {EntityCardProps} from '$lib/components/entityCard';
  import {EntityList} from '$lib/components/entityList';
  import {EntityListControls} from '$lib/components/entityListControls';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Loading} from '$lib/components/loading';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {Tabs} from '$lib/components/tabs';
  import {BasicPage} from '$lib/templates/basicPage';
  import {activeTab} from './page-stores';

  // Which entity sections to show
  const sections = $settings.results.sections as EntityType[];
  if (!sections?.length) error(500, 'No sections to show');

  // These will hold the filtered entities returned by EntityListControls
  let filteredCandidates: WrappedEntity<CandidateProps>[] = [];
  let filteredParties: WrappedEntity<PartyProps>[] = [];

  let resultsAvailableSync = false;
  $resultsAvailable.then((v) => {
    resultsAvailableSync = v;
    startEvent(v ? 'results_ranked' : 'results_browse', {
      section: sections[$activeTab],
      numAnswers: Object.keys($answeredQuestions).length
    });
  });

  /**
   * The possible additional card props to add to cards on EntityLists. Currenltly, this only includes possible extra questions.
   */
  let additionalEcProps: Record<string, Partial<EntityCardProps>> = {candidate: {}, party: {}};

  $: updateAdditionalEcProps($allQuestions, $settings);

  async function updateAdditionalEcProps(
    currentAllQuestions: Promise<Record<string, QuestionProps>>,
    currentSettings: AppSettings
  ) {
    const allQuestionsSync = await currentAllQuestions;
    for (const type in additionalEcProps) {
      const questionSettings = currentSettings.results.cardContents[
        type as keyof AppSettings['results']['cardContents']
      ].filter((c) => typeof c === 'object' && c.question != null) as AppSettingsQuestionRef[];
      if (questionSettings.length) {
        const questions: EntityCardProps['questions'] = [];
        for (const qs of questionSettings) {
          const {question, ...rest} = qs;
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
    allCandidates?: WrappedEntity<CandidateProps>[],
    maxSubcards = 3
  ): EntityCardProps {
    return {
      content: party,
      action: $getRoute({route: Route.ResultParty, id: party.entity.id}),
      subcards: allCandidates?.length
        ? allCandidates.filter((c) => c.entity.party?.id === party.entity.id).map(parseCandidate)
        : undefined,
      maxSubcards,
      ...additionalEcProps.party
    };
  }

  /** Shorthand for building a candidate link route */
  function candidateRoute(candidate: WrappedEntity<CandidateProps>) {
    return $getRoute({route: Route.ResultCandidate, id: candidate.entity.id});
  }
</script>

<BasicPage title={resultsAvailableSync ? $t('results.title.results') : $t('results.title.browse')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('results.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('navigation.sendFeedback')} />
    {/if}
    {#if $settings.header.showHelp}
      <Button
        href={$getRoute(Route.Help)}
        variant="icon"
        icon="help"
        text={$t('actionLabels.help')} />
    {/if}
    <Button
      on:click={() => console.info('Show favourites')}
      variant="icon"
      icon="list"
      text={$t('actionLabels.yourList')} />
  </svelte:fragment>

  <p class="text-center">
    {resultsAvailableSync ? $t('results.ingress.results') : $t('results.ingress.browse')}
  </p>

  <StretchBackground padding="medium" bgColor="base-300" toBottom class="min-h-[75vh]">
    <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

    {#if sections.length > 1}
      <Tabs
        tabs={sections.map((entityType) => $t(`common.${entityType}.plural`))}
        bind:activeIndex={$activeTab}
        on:change={({detail}) => startEvent('results_changeTab', {section: sections[detail.index]})}
        class="mx-10" />
    {/if}

    <!-- Candidates -->
    {#if sections[$activeTab] === 'candidate'}
      {#await Promise.all( [$candidateRankings, $candidateFilters, $opinionQuestions, $infoQuestions] )}
        <Loading showLabel class="mt-lg" />
      {:then [allCandidates, candidateFilters]}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.candidatesShown', {numShown: filteredCandidates.length})}
          {#if filteredCandidates.length !== allCandidates.length}
            <span class="font-normal text-secondary"
              >{$t('results.candidatesTotal', {numTotal: allCandidates.length})}</span>
          {/if}
        </h2>
        {#if candidateFilters}
          <EntityListControls
            contents={allCandidates}
            filterGroup={candidateFilters}
            bind:output={filteredCandidates}
            class="mx-10 mb-md" />
        {/if}
        <EntityList cards={filteredCandidates.map(parseCandidate)} class="mb-lg" />
      {/await}

      <!-- Parties -->
    {:else if sections[$activeTab] === 'party'}
      <!-- Instead of candidateRankings we just create a Promise that resolves to undefined if subcards are not to be shown. In that case allCandidates will be undefined, and parseParty will not add subcards. -->
      {#await Promise.all( [$partyRankings, $settings.results.cardContents.party.includes('candidates') ? $candidateRankings : Promise.resolve(undefined), $opinionQuestions, $infoQuestions] )}
        <Loading showLabel class="mt-lg" />
      {:then [allParties, allCandidatesOrUndef]}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.partiesShown', {numShown: filteredParties.length})}
          {#if filteredParties.length !== allParties.length}
            <span class="font-normal text-secondary"
              >{$t('results.partiesTotal', {numTotal: allParties.length})}</span>
          {/if}
        </h2>
        <EntityListControls
          contents={allParties}
          bind:output={filteredParties}
          class="mx-10 mb-md" />
        <EntityList
          cards={filteredParties.map((p) => parseParty(p, allCandidatesOrUndef))}
          class="mb-lg" />
      {/await}
    {/if}
  </StretchBackground>
</BasicPage>
