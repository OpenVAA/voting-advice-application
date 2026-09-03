import { describe, expect, it } from 'vitest';
import { computeBadges, computeNextAction } from './candidateHome.helpers';
import type { CandidateHomeNextAction, CandidateHomeNextActionInput } from './candidateHome.helpers';

/**
 * The unit-level contract for the two pure helpers exported by `candidateHome.helpers.ts`. This file verifies those two functions and nothing else: its module graph is exactly `vitest` plus `./candidateHome.helpers`, and that helper declares no imports at all, so the candidate welcome page component, the candidate context and the data model are never loaded here.
 *
 * WHY THIS FILE EXISTS, and why it was written BEFORE the component was touched: the page's next action used to be a three-arm branch chain in which every arm re-listed all seven props. Rewriting that as one defaults object plus per-case overrides is a mechanical change with one non-mechanical trap. The defaults are modelled on the FALLBACK case, but the middle case shares the FIRST case's EDIT wording for the basic-info button rather than the fallback's ENTER wording, so a rewrite that forgets to override it back silently flips that label. No end-to-end spec asserts that button's text, because the suite selects it by test id, so the suite cannot see the flip. The expected values in the table below were read off the pre-rewrite arms, not off the rewrite, which is what makes them a characterisation of the old behaviour rather than a restatement of the new one.
 *
 * The contract asserted below, in full:
 *
 * - `computeNextAction` returns the same seven prop values the pre-rewrite branch chain returned, for all three states, with the answers-locked flag both set and clear.
 * - The optional `tip` prop is present in the profile-complete case only, so the template conditional that hides the tip paragraph still hides it in the other two cases.
 * - The middle case's basic-info button wording is EDIT and the fallback case's is ENTER, and the two are asserted to differ so that making them equal reddens this file.
 * - The three cases are evaluated in the pre-rewrite order and the first match wins, so a profile-complete candidate who also satisfies the middle case's condition still gets the profile-complete result.
 * - An override whose value happens to equal the default produces the same object as the default, not a divergent one.
 * - `computeBadges` renders no badge for a count of zero, and an absent array and an empty array both count as zero.
 * - The questions badge is greyed out exactly when required info is still outstanding, and an ABSENT required-info array counts as outstanding.
 */

/** Stub translation function. Returns the key, with any interpolation parameters appended, so an expected value names the message key it came from. */
function t(key: string, params?: Record<string, unknown>): string {
  if (!params) return key;
  const rendered = Object.entries(params)
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(',');
  return `${key}(${rendered})`;
}

/** Stub route resolver. Returns a recognisable path per route name. */
function resolveRoute(route: string): string {
  return `/route/${route}`;
}

const USERNAME = 'Tiina';
const GREETING = `candidateApp.common.greeting(username=${USERNAME})`;

/** Build a helper input, defaulting the parts a case does not care about. */
function input(overrides: Partial<CandidateHomeNextActionInput>): CandidateHomeNextActionInput {
  return {
    profileComplete: false,
    answersLocked: false,
    missingInfoCount: 2,
    missingOpinionCount: 5,
    username: USERNAME,
    t,
    resolveRoute,
    ...overrides
  };
}

type NextActionCase = {
  title: string;
  input: CandidateHomeNextActionInput;
  expected: CandidateHomeNextAction;
};

const NEXT_ACTION_CASES: Array<NextActionCase> = [
  {
    title: 'state 1, profile complete, answers unlocked',
    input: input({ profileComplete: true, answersLocked: false, missingInfoCount: 0, missingOpinionCount: 0 }),
    expected: {
      title: 'candidateApp.home.ready',
      explanation: 'candidateApp.home.ingress.ready',
      tip: 'candidateApp.home.previewTip',
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.edit',
      buttonTextQuestion: 'candidateApp.home.questions.edit',
      buttonTextPrimaryActions: 'candidateApp.home.preview',
      href: '/route/CandAppPreview'
    }
  },
  {
    title: 'state 1, profile complete, answers locked',
    input: input({ profileComplete: true, answersLocked: true, missingInfoCount: 0, missingOpinionCount: 0 }),
    expected: {
      title: 'candidateApp.home.ready',
      explanation: 'candidateApp.home.ingress.ready',
      tip: 'candidateApp.home.previewTip',
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.view',
      buttonTextQuestion: 'candidateApp.home.questions.view',
      buttonTextPrimaryActions: 'candidateApp.home.preview',
      href: '/route/CandAppPreview'
    }
  },
  {
    title: 'state 2, required info done and opinion questions outstanding, answers unlocked',
    input: input({ profileComplete: false, answersLocked: false, missingInfoCount: 0, missingOpinionCount: 3 }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.edit',
      buttonTextQuestion: 'candidateApp.home.questions.enter',
      buttonTextPrimaryActions: 'candidateApp.home.questions.enter',
      href: '/route/CandAppQuestions'
    }
  },
  {
    title: 'state 2, required info done and opinion questions outstanding, answers locked',
    input: input({ profileComplete: false, answersLocked: true, missingInfoCount: 0, missingOpinionCount: 3 }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.view',
      buttonTextQuestion: 'candidateApp.home.questions.view',
      buttonTextPrimaryActions: 'candidateApp.home.questions.view',
      href: '/route/CandAppQuestions'
    }
  },
  {
    title: 'state 3, the fallback, answers unlocked',
    input: input({ profileComplete: false, answersLocked: false, missingInfoCount: 2, missingOpinionCount: 5 }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.enter',
      buttonTextQuestion: 'candidateApp.home.questions.enter',
      buttonTextPrimaryActions: 'candidateApp.home.basicInfo.enter',
      href: '/route/CandAppProfile'
    }
  },
  {
    title: 'state 3, the fallback, answers locked',
    input: input({ profileComplete: false, answersLocked: true, missingInfoCount: 2, missingOpinionCount: 5 }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.view',
      buttonTextQuestion: 'candidateApp.home.questions.view',
      buttonTextPrimaryActions: 'candidateApp.home.basicInfo.view',
      href: '/route/CandAppProfile'
    }
  },
  {
    title: 'state 3, the fallback, reached because the required-info array is absent rather than empty',
    input: input({ profileComplete: false, answersLocked: false, missingInfoCount: undefined, missingOpinionCount: 5 }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.enter',
      buttonTextQuestion: 'candidateApp.home.questions.enter',
      buttonTextPrimaryActions: 'candidateApp.home.basicInfo.enter',
      href: '/route/CandAppProfile'
    }
  },
  {
    title: 'state 2, reached because the opinion array is absent, which counts as outstanding',
    input: input({ profileComplete: false, answersLocked: false, missingInfoCount: 0, missingOpinionCount: undefined }),
    expected: {
      title: GREETING,
      explanation: 'candidateApp.home.ingress.notDone',
      tip: undefined,
      buttonTextBasicInfo: 'candidateApp.home.basicInfo.edit',
      buttonTextQuestion: 'candidateApp.home.questions.enter',
      buttonTextPrimaryActions: 'candidateApp.home.questions.enter',
      href: '/route/CandAppQuestions'
    }
  }
];

describe('computeNextAction (candidate welcome page pure helper)', () => {
  for (const [index, testCase] of NEXT_ACTION_CASES.entries()) {
    it(`Case ${index + 1}: ${testCase.title}`, () => {
      // Assert the WHOLE object, not field by field, so a missing override cannot slip through.
      expect(computeNextAction(testCase.input)).toEqual(testCase.expected);
    });
  }

  it('pins the middle case basic-info wording as EDIT and the fallback as ENTER, and fails if the two are made equal', () => {
    const middle = computeNextAction(input({ missingInfoCount: 0, missingOpinionCount: 3 }));
    const fallback = computeNextAction(input({ missingInfoCount: 2, missingOpinionCount: 5 }));
    const complete = computeNextAction(input({ profileComplete: true }));
    expect(middle.buttonTextBasicInfo).toBe('candidateApp.home.basicInfo.edit');
    expect(fallback.buttonTextBasicInfo).toBe('candidateApp.home.basicInfo.enter');
    expect(middle.buttonTextBasicInfo).not.toBe(fallback.buttonTextBasicInfo);
    // The middle case shares the profile-complete case's wording, which is the fact a defaults-plus-overrides rewrite is most likely to lose.
    expect(middle.buttonTextBasicInfo).toBe(complete.buttonTextBasicInfo);
  });

  it('carries the tip in the profile-complete case only, so the tip paragraph stays hidden in the other two', () => {
    expect(computeNextAction(input({ profileComplete: true })).tip).toBe('candidateApp.home.previewTip');
    expect(computeNextAction(input({ missingInfoCount: 0, missingOpinionCount: 3 })).tip).toBeUndefined();
    expect(computeNextAction(input({ missingInfoCount: 2, missingOpinionCount: 5 })).tip).toBeUndefined();
  });

  it('evaluates the cases in order, so profile completeness wins over the middle case condition', () => {
    const both = computeNextAction(input({ profileComplete: true, missingInfoCount: 0, missingOpinionCount: 3 }));
    expect(both.href).toBe('/route/CandAppPreview');
    expect(both.buttonTextPrimaryActions).toBe('candidateApp.home.preview');
  });

  it('produces an object identical to the fallback when an override happens to equal the default', () => {
    // With answers locked, the middle case's basic-info override resolves to the SAME string the defaults carry, so the only differences must be the two props the case genuinely changes.
    const middle = computeNextAction(input({ answersLocked: true, missingInfoCount: 0, missingOpinionCount: 3 }));
    const fallback = computeNextAction(input({ answersLocked: true, missingInfoCount: 2, missingOpinionCount: 5 }));
    expect(middle.buttonTextBasicInfo).toBe(fallback.buttonTextBasicInfo);
    expect(middle.buttonTextQuestion).toBe(fallback.buttonTextQuestion);
    expect(middle.title).toBe(fallback.title);
    expect(middle.explanation).toBe(fallback.explanation);
    expect(middle.tip).toBe(fallback.tip);
  });

  it('returns a fresh object on every call', () => {
    const first = computeNextAction(input({}));
    const second = computeNextAction(input({}));
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe('computeBadges (candidate welcome page pure helper)', () => {
  it('Badge case 1: zero on both counts renders no badge at all', () => {
    expect(computeBadges({ requiredInfoQuestions: [], opinionQuestions: [] })).toEqual({
      profile: undefined,
      questions: undefined
    });
  });

  it('Badge case 2: non-zero counts render badges whose text is the count', () => {
    expect(computeBadges({ requiredInfoQuestions: ['a', 'b'], opinionQuestions: ['c', 'd', 'e'] })).toEqual({
      profile: { text: '2', disabled: false },
      questions: { text: '3', disabled: true }
    });
  });

  it('Badge case 3: absent arrays count as zero and render no badge', () => {
    expect(computeBadges({ requiredInfoQuestions: undefined, opinionQuestions: undefined })).toEqual({
      profile: undefined,
      questions: undefined
    });
  });

  it('Badge case 4: an empty array counts as zero on each side independently', () => {
    expect(computeBadges({ requiredInfoQuestions: [], opinionQuestions: ['c'] })).toEqual({
      profile: undefined,
      questions: { text: '1', disabled: false }
    });
    expect(computeBadges({ requiredInfoQuestions: ['a'], opinionQuestions: [] })).toEqual({
      profile: { text: '1', disabled: false },
      questions: undefined
    });
  });

  it('greys the questions badge exactly when required info is outstanding, counting an absent array as outstanding', () => {
    expect(computeBadges({ requiredInfoQuestions: [], opinionQuestions: ['c'] }).questions?.disabled).toBe(false);
    expect(computeBadges({ requiredInfoQuestions: ['a'], opinionQuestions: ['c'] }).questions?.disabled).toBe(true);
    expect(computeBadges({ requiredInfoQuestions: undefined, opinionQuestions: ['c'] }).questions?.disabled).toBe(true);
  });

  it('never marks the profile badge disabled, matching the guard it replaces', () => {
    expect(computeBadges({ requiredInfoQuestions: ['a', 'b'], opinionQuestions: [] }).profile?.disabled).toBe(false);
  });
});
