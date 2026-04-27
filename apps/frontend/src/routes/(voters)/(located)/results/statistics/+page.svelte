<!--@component

# Answer statistics - WIP!

Display answer statistics for the candidates of each party.

Usually accessed by direct link only and not meant for the wide public.
-->

<script lang="ts">
  import { isSingleChoiceQuestion } from '@openvaa/data';
  import { Expander } from '$lib/components/expander';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import QuestionChoices from '$lib/components/questions/QuestionChoices.svelte';
  import { getVoterContext } from '$lib/contexts/voter';
  import { unwrapEntity } from '$lib/utils/entities';
  import { removeDuplicates } from '$lib/utils/removeDuplicates';
  import MainContent from '../../../../MainContent.svelte';
  import type { Id, MaybeWrappedEntity } from '@openvaa/core';
  import type {
    Candidate,
    CandidateNomination,
    Organization,
    SingleChoiceCategoricalQuestion,
    SingleChoiceOrdinalQuestion
  } from '@openvaa/data';
  import type { MatchTree } from '$lib/contexts/voter/matchStore.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Phase 61-03 voter-side parallel fix: matches + opinionQuestions are
  // reactive context getters, accessed via voterCtx to avoid stale snapshots.
  const voterCtx = getVoterContext();
  const { answers, t } = voterCtx;

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Get the answer distribution for a given question and organization, if defined, and all candidates if not.
   */
  function getAnswerDistribution(
    question: SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion,
    organization?: MaybeWrappedEntity<Organization>
  ): AnswerDistribution {
    const distribution: AnswerDistribution = {};
    let candidates: Array<CandidateNomination>;
    if (organization) {
      const { nomination } = unwrapEntity(organization);
      if (!nomination) return distribution;
      candidates = nomination.candidateNominations;
    } else {
      candidates = getCandidates(voterCtx.matches)
        .map((m) => unwrapEntity(m).nomination)
        .filter((n) => n != null);
    }
    candidates.forEach((c) => {
      const answer = c.entity.getAnswer(question)?.value;
      if (answer != null) {
        distribution[answer] ??= { percentage: 0, count: 0 };
        distribution[answer].count += 1;
      }
    });
    const total = Object.values(distribution).reduce((sum, { count }) => sum + count, 0);
    if (total === 0) return distribution;
    for (const d of Object.values(distribution)) {
      d.percentage = (d.count / total) * 100;
    }
    return distribution;
  }

  type AnswerDistribution = Record<
    Id,
    {
      percentage: number;
      count: number;
    }
  >;

  function getCandidates(matches: MatchTree): Array<MaybeWrappedEntity<Candidate>> {
    return removeDuplicates(
      Object.values(matches)
        .flatMap((e) => e.candidate)
        .filter((o) => o != null)
    ) as Array<MaybeWrappedEntity<Candidate>>;
  }

  function getOrganizations(matches: MatchTree): Array<MaybeWrappedEntity<Organization>> {
    return removeDuplicates(
      Object.values(matches)
        .flatMap((e) => e.organization)
        .filter((o) => o != null)
    ) as Array<MaybeWrappedEntity<Organization>>;
  }
</script>

<MainContent title={t('statistics.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.statistics.heroEmoji')} />
    </figure>
  {/snippet}

  <div class="gap-lg grid" data-testid="voter-statistics-container">
    {#each voterCtx.opinionQuestions.filter((q) => isSingleChoiceQuestion(q)) as question}
      {@const { id, text, choices } = question}
      {@const voterAnswer = answers ? `${answers.answers?.[id]?.value}` : undefined}
      {@const distAll = getAnswerDistribution(question)}

      <Expander title={text} variant="question">
        {#if voterAnswer == null}
          <div class="small-label mb-16 text-center">
            {t('questions.answers.youHaventAnswered')}
          </div>
        {/if}

        <QuestionChoices {question} selectedId={voterAnswer} disabled />

        <div class="mt-xl gap-xl grid">
          <!-- All candidates -->
          <div>
            <h4>{t('statistics.allCandidates')}</h4>
            <div
              class="after:border-t-md relative grid w-full gap-0 fill-[var(--color)]
                    after:absolute after:top-[3rem] after:right-0 after:left-0 after:h-[1px] after:content-[''] dark:fill-[var(--colorDark)]"
              style:--numCols={choices.length}
              style:grid-template-columns="repeat(var(--numCols), 1fr)">
              {#each choices as { id }}
                {@const pct = distAll[id]?.percentage ?? 0}
                <div class="gap-md grid justify-items-center">
                  <svg class="h-[3rem] w-[1rem]">
                    <rect x="0" y="{100 - pct}%" width="100%" height="{pct}%" />
                  </svg>
                  <div class="text-center">
                    {pct.toFixed(0)} %<br />
                    <span class="small-label">{distAll[id]?.count ?? 0}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Each party -->
          {#each getOrganizations(voterCtx.matches) as organization}
            {@const { entity } = unwrapEntity(organization)}
            {@const dist = getAnswerDistribution(question, organization)}
            <div>
              <h4>{entity.shortName}</h4>
              <div
                class="after:border-t-md relative grid w-full gap-0 fill-[var(--color)]
                      after:absolute after:top-[3rem] after:right-0 after:left-0 after:h-[1px] after:content-[''] dark:fill-[var(--colorDark)]"
                style:--numCols={choices.length}
                style:grid-template-columns="repeat(var(--numCols), 1fr)"
                style:--color={entity.color?.normal ?? 'var(--color-neutral)'}
                style:--colorDark={entity?.color?.dark ?? 'var(--color-neutral)'}>
                {#each choices as { id }}
                  {@const pct = dist[id]?.percentage ?? 0}
                  <div class="gap-md grid justify-items-center">
                    <svg class="h-[3rem] w-[1rem]">
                      <rect x="0" y="{100 - pct}%" width="100%" height="{pct}%" />
                    </svg>
                    <div class="text-center">
                      {pct.toFixed(0)} %<br />
                      <span class="small-label">{dist[id]?.count ?? 0}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </Expander>
    {/each}
  </div>
</MainContent>
