<!--@component

# Candidate app candidate welcome page

Shows a dynamic list of the actions the candidate should take to be included in the VAA.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { computeBadges, computeNextAction } from './candidateHome.helpers';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read the reactive context getters via candCtx.X.
  const candCtx = getCandidateContext();
  const { getRoute, t, userData } = candCtx;
  // appSettings is a reactive accessor — read via candCtx.X, never destructure.
  const appSettings = $derived(candCtx.appSettings);

  ////////////////////////////////////////////////////////////////////
  // Precomputed facts
  ////////////////////////////////////////////////////////////////////

  // Every conditional in the markup below reads one of these instead of recomputing a context value inline.
  const answersLocked = $derived(candCtx.answersLocked);
  const profileComplete = $derived(candCtx.profileComplete);
  const missingInfoCount = $derived(candCtx.unansweredRequiredInfoQuestions?.length);
  const missingOpinionCount = $derived(candCtx.unansweredOpinionQuestions?.length);
  // Required info counts as outstanding whenever the count is anything other than zero, an absent array included.
  const infoOutstanding = $derived(missingInfoCount !== 0);
  const hiddenForMissingAnswers = $derived(
    infoOutstanding || (Boolean(appSettings.entities?.hideIfMissingAnswers?.candidate) && missingOpinionCount !== 0)
  );

  ////////////////////////////////////////////////////////////////////
  // Create action list
  ////////////////////////////////////////////////////////////////////

  // React to changes in language and stores. The context's reactive accessors are read INSIDE this tracking scope and their VALUES are handed to the pure helper; the context object itself is never passed, since that would move the getter reads out of the scope and freeze the page on its initial empty snapshot.
  const nextAction = $derived.by(() =>
    computeNextAction({
      profileComplete,
      answersLocked,
      missingInfoCount,
      missingOpinionCount,
      username: userData.current?.candidate.firstName || '?',
      t,
      resolveRoute: getRoute.current
    })
  );

  // The badge set, defined up front as data rather than as two conditionals in the markup.
  const badges = $derived(
    computeBadges({
      requiredInfoQuestions: candCtx.unansweredRequiredInfoQuestions,
      opinionQuestions: candCtx.unansweredOpinionQuestions
    })
  );
</script>

<MainContent title={nextAction.title}>
  {#snippet note()}
    {#if answersLocked}
      <Warning data-testid="candidate-answers-locked-warning">
        {t('candidateApp.common.editingNotAllowed')}
        {#if hiddenForMissingAnswers}
          {t('candidateApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {/if}
  {/snippet}

  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={profileComplete ? t('dynamic.success.heroEmoji') : undefined} />
    </figure>
  {/snippet}

  <p class="text-center" data-testid="candidate-home-status">
    {nextAction.explanation}
  </p>

  {#if nextAction.tip}
    <p class="text-center" data-testid="candidate-home-tip">
      {nextAction.tip}
    </p>
  {/if}

  <div>
    <Button
      text={nextAction.buttonTextBasicInfo}
      icon="profile"
      iconPos="left"
      href={getRoute.current('CandAppProfile')}
      data-testid="candidate-home-profile">
      {#snippet badge()}
        {#if badges.profile}
          <InfoBadge text={badges.profile.text} disabled={badges.profile.disabled} />
        {/if}
      {/snippet}
    </Button>
    <Button
      text={nextAction.buttonTextQuestion}
      icon="opinion"
      iconPos="left"
      disabled={infoOutstanding}
      href={getRoute.current('CandAppQuestions')}
      data-testid="candidate-home-questions">
      {#snippet badge()}
        {#if badges.questions}
          <InfoBadge text={badges.questions.text} disabled={badges.questions.disabled} />
        {/if}
      {/snippet}
    </Button>
    <Button
      text={t('candidateApp.home.preview')}
      icon="previewProfile"
      iconPos="left"
      disabled={infoOutstanding}
      href={getRoute.current('CandAppPreview')}
      data-testid="candidate-home-preview" />
  </div>

  {#snippet primaryActions()}
    <div class="flex w-full flex-col items-center justify-center">
      <Button
        variant="main"
        text={nextAction.buttonTextPrimaryActions}
        icon="next"
        href={nextAction.href}
        data-testid="candidate-home-continue" />
      <LogoutButton variant="normal" icon={undefined} data-testid="candidate-home-logout" />
    </div>
  {/snippet}
</MainContent>
