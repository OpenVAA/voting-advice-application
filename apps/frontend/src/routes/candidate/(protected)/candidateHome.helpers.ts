/**
 * Pure helpers used inside the candidate welcome page's `$derived.by` and its two badge snippets, at `apps/frontend/src/routes/candidate/(protected)/+page.svelte`.
 *
 * `computeNextAction` returns the seven props the page renders for the candidate's next action: every prop takes its default exactly once and each case specifies only its overrides, so a reader learns which props are optional from the defaults object rather than by diffing three object literals. `computeBadges` returns the badge set as data, so the template reads a precomputed value instead of recomputing a context array's length inline.
 *
 * Both functions are pure and return fresh objects, which is what makes them safe to call from inside a Svelte 5 `$derived` scope.
 *
 * CALLER CONTRACT, and it is load-bearing: the caller passes ALREADY-READ scalars. The candidate context's reactive accessors must be read INSIDE the calling tracking scope and their values handed over here. Passing the context object itself would move those getter reads out of the tracking scope and freeze the page on its initial empty snapshot.
 *
 * The parameter types are STRUCTURAL on purpose. This module imports nothing at all, so a spec that exercises it loads exactly the test runner plus this file, never the page component, the candidate context or the data model.
 *
 * Tested in `candidateHome.helpers.test.ts`.
 */

/** The message keys this module asks its caller's translation function to resolve. Declared as a literal union so the module needs no import: the caller's own translation function accepts a wider key type, which makes it assignable here. */
export type CandidateHomeMessageKey =
  | 'candidateApp.common.greeting'
  | 'candidateApp.home.basicInfo.edit'
  | 'candidateApp.home.basicInfo.enter'
  | 'candidateApp.home.basicInfo.view'
  | 'candidateApp.home.ingress.notDone'
  | 'candidateApp.home.ingress.ready'
  | 'candidateApp.home.preview'
  | 'candidateApp.home.previewTip'
  | 'candidateApp.home.questions.edit'
  | 'candidateApp.home.questions.enter'
  | 'candidateApp.home.questions.view'
  | 'candidateApp.home.ready';

/** The route names this module asks its caller's route resolver to build. Structural for the same reason as the message keys above. */
export type CandidateHomeRouteName = 'CandAppPreview' | 'CandAppProfile' | 'CandAppQuestions';

/** Structural shape of the translation function the caller supplies. */
export type CandidateHomeTranslate = (key: CandidateHomeMessageKey, params?: Record<string, unknown>) => string;

/** Structural shape of the route resolver the caller supplies. */
export type CandidateHomeResolveRoute = (route: CandidateHomeRouteName) => string;

/** The seven props the welcome page renders for the candidate's next action. `tip` is the only optional one. */
export type CandidateHomeNextAction = {
  title: string;
  explanation: string;
  tip: string | undefined;
  buttonTextBasicInfo: string;
  buttonTextQuestion: string;
  buttonTextPrimaryActions: string;
  href: string;
};

export type CandidateHomeNextActionInput = {
  /** Whether the candidate's profile is complete. Selects the first case. */
  profileComplete: boolean;
  /** Whether answers are locked. Three of the seven props branch on it. */
  answersLocked: boolean;
  /**
   * The length of the unanswered required-info question array, or `undefined` when that array is absent.
   *
   * NOT collapsed to zero. An absent array and an empty array select DIFFERENT cases below, exactly as the pre-rewrite branch chain did, and collapsing here would quietly change which case an absent array lands in.
   */
  missingInfoCount: number | undefined;
  /** The length of the unanswered opinion question array, or `undefined` when that array is absent. Not collapsed to zero, for the reason given above. */
  missingOpinionCount: number | undefined;
  /** The candidate's first name, already defaulted by the caller. */
  username: string;
  t: CandidateHomeTranslate;
  resolveRoute: CandidateHomeResolveRoute;
};

/**
 * Compute the seven next-action props for the candidate welcome page.
 *
 * The three cases are evaluated in order and the first match wins: profile complete, then required info done with opinion questions outstanding, then the fallback. The defaults object IS the fallback case, so the fallback returns it unchanged.
 */
export function computeNextAction({
  profileComplete,
  answersLocked,
  missingInfoCount,
  missingOpinionCount,
  username,
  t,
  resolveRoute
}: CandidateHomeNextActionInput): CandidateHomeNextAction {
  const defaults: CandidateHomeNextAction = {
    title: t('candidateApp.common.greeting', { username }),
    explanation: t('candidateApp.home.ingress.notDone'),
    tip: undefined,
    buttonTextBasicInfo: answersLocked ? t('candidateApp.home.basicInfo.view') : t('candidateApp.home.basicInfo.enter'),
    buttonTextQuestion: answersLocked ? t('candidateApp.home.questions.view') : t('candidateApp.home.questions.enter'),
    buttonTextPrimaryActions: answersLocked
      ? t('candidateApp.home.basicInfo.view')
      : t('candidateApp.home.basicInfo.enter'),
    href: resolveRoute('CandAppProfile')
  };

  if (profileComplete) {
    return {
      ...defaults,
      title: t('candidateApp.home.ready'),
      explanation: t('candidateApp.home.ingress.ready'),
      tip: t('candidateApp.home.previewTip'),
      buttonTextBasicInfo: answersLocked
        ? t('candidateApp.home.basicInfo.view')
        : t('candidateApp.home.basicInfo.edit'),
      buttonTextQuestion: answersLocked ? t('candidateApp.home.questions.view') : t('candidateApp.home.questions.edit'),
      buttonTextPrimaryActions: t('candidateApp.home.preview'),
      href: resolveRoute('CandAppPreview')
    };
  }

  if (missingInfoCount === 0 && missingOpinionCount !== 0) {
    return {
      ...defaults,
      // This case shares the profile-complete case's EDIT wording for the basic-info button, while the fallback below uses ENTER. The defaults are the fallback, so the override back to EDIT is what keeps this case's label unchanged. No end-to-end spec asserts this button's text, which is why it is pinned by the colocated table instead.
      buttonTextBasicInfo: answersLocked
        ? t('candidateApp.home.basicInfo.view')
        : t('candidateApp.home.basicInfo.edit'),
      buttonTextPrimaryActions: defaults.buttonTextQuestion,
      href: resolveRoute('CandAppQuestions')
    };
  }

  return defaults;
}

/** One badge: the text to display and whether it renders greyed out. */
export type CandidateHomeBadge = {
  text: string;
  disabled: boolean;
};

/** The badge set the welcome page renders. An entry is `undefined` when that badge is not rendered at all. */
export type CandidateHomeBadgeSet = {
  profile: CandidateHomeBadge | undefined;
  questions: CandidateHomeBadge | undefined;
};

export type CandidateHomeBadgeInput = {
  /** The unanswered required-info question array read off the context, or `undefined` when absent. */
  requiredInfoQuestions: ReadonlyArray<unknown> | undefined;
  /** The unanswered opinion question array read off the context, or `undefined` when absent. */
  opinionQuestions: ReadonlyArray<unknown> | undefined;
};

/**
 * Compute the welcome page's badge set from the two context arrays.
 *
 * An absent array and an empty array both count as zero and therefore render no badge, which is what the two guards this replaces did. The count is rendered as a STRING for both badges: the two guards disagreed, one wrapping the length in a string conversion and the other passing the number, and the badge component accepts either, so the string form is adopted for both.
 *
 * The questions badge greys out while required info is still outstanding, and an ABSENT required-info array counts as outstanding. That is why the array is inspected here rather than a pre-collapsed count.
 */
export function computeBadges({
  requiredInfoQuestions,
  opinionQuestions
}: CandidateHomeBadgeInput): CandidateHomeBadgeSet {
  const missingInfoCount = requiredInfoQuestions?.length ?? 0;
  const missingOpinionCount = opinionQuestions?.length ?? 0;
  const infoOutstanding = requiredInfoQuestions?.length !== 0;
  return {
    profile: missingInfoCount > 0 ? { text: String(missingInfoCount), disabled: false } : undefined,
    questions: missingOpinionCount > 0 ? { text: String(missingOpinionCount), disabled: infoOutstanding } : undefined
  };
}
