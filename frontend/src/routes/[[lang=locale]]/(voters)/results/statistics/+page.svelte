<script lang="ts">
  import { Expander } from '$lib/components/expander';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { LikertResponseButtons } from '$lib/components/questions';
  import { t } from '$lib/i18n';
  import { answeredQuestions, candidateRankings, opinionQuestions, partyRankings } from '$lib/legacy-stores';
  import { getLikertAnswer } from '$lib/utils/answers';
  import Layout from '../../../../Layout.svelte';

  /** This is needed to ensure typing but will be no longer needed, when @openvaa/data model is implemented an Question object methods can be used to enforce typing. */
  function getVoterLikertAnswer(question: LegacyQuestionProps): number | undefined {
    const answer = $answeredQuestions[question.id]?.value;
    return typeof answer === 'number' ? answer : undefined;
  }

  function getAnswerDistribution(
    question: LegacyQuestionProps,
    allCandidates: Array<WrappedEntity<LegacyCandidateProps> | RankingProps<LegacyCandidateProps>>,
    party?: LegacyPartyProps
  ): AnswerDistribution {
    const distribution: AnswerDistribution = {};
    allCandidates
      .filter((c) => !party || c.entity.party?.id === party.id)
      .forEach((c) => {
        const answer = getLikertAnswer(c.entity, question)?.value;
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
    number,
    {
      percentage: number;
      count: number;
    }
  >;
</script>

<svelte:head>
  <title>{$t('statistics.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('statistics.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.statistics.heroEmoji')} />
  </figure>

  {#await Promise.all([$candidateRankings, $partyRankings, $opinionQuestions])}
    <Loading showLabel class="mt-lg" />
  {:then [allCandidates, allParties, questions]}
    <div class="grid gap-lg">
      {#each questions as question}
        {@const { id, text, type, values } = question}
        {@const voterAnswer = getVoterLikertAnswer(question)}

        <Expander title={text} variant="question">
          {#if type === 'singleChoiceOrdinal' && values}
            {#if voterAnswer == null}
              <div class="small-label mb-16 text-center">
                {$t('questions.answers.youHaventAnswered')}
              </div>
            {/if}

            <LikertResponseButtons aria-label={text} name={id} selectedKey={voterAnswer} disabled options={values} />

            <div class="mt-xl grid gap-xl">
              {#each [undefined, ...allParties] as group}
                {@const dist = getAnswerDistribution(question, allCandidates, group?.entity)}
                <div>
                  <h4>{group ? group.entity.shortName : $t('statistics.allCandidates')}</h4>
                  <div
                    class="relative grid w-full gap-0 fill-[var(--color)] after:absolute
                          after:left-0 after:right-0 after:top-[3rem] after:h-[1px] after:border-t-md after:content-[''] dark:fill-[var(--colorDark)]"
                    style:--numCols={values.length}
                    style:grid-template-columns="repeat(var(--numCols), 1fr)"
                    style:--color={group?.entity?.color ?? 'oklch(var(--n))'}
                    style:--colorDark={group?.entity?.colorDark ?? 'oklch(var(--n))'}>
                    {#each values as { key }}
                      {@const pct = dist[key]?.percentage ?? 0}
                      <div class="grid justify-items-center gap-md">
                        <svg class="h-[3rem] w-[1rem]">
                          <rect x="0" y="{100 - pct}%" width="100%" height="{pct}%" />
                        </svg>
                        <div class="text-center">
                          {pct.toFixed(0)} %<br />
                          <span class="small-label">{dist[key]?.count ?? 0}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            {$t('error.general')}
          {/if}
        </Expander>
      {/each}
    </div>
  {/await}
</Layout>
