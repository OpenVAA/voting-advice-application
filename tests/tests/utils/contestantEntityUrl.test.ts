/**
 * Unit tests for the tests-side statement of what a contestant entity URL looks like.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts contestantEntityUrl
 */
import { SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import {
  buildEntityLessRoute,
  contestantAppRootUrlRe,
  contestantHomeUrlRe,
  contestantUrlOutsideRe,
  contestantUrlRe,
  dropEntitySegments,
  ENTITY_SEGMENT_SOURCE,
  isContestantAppRootPath,
  isContestantHomePath
} from './contestantEntityUrl';

const UUID = '3f2a8c1e-0b4d-4e6f-9a7b-1c2d3e4f5a6b';
const ORIGIN = 'http://localhost:5273';

/** The app's root, which carries no entity. */
const APP_ROOT = '/contestant';
/** The app's root with each entity segment a pattern accepts: one per served type. */
const ENTITY_ROOTS = SERVED_ENTITY_TYPES.map((type) => `${APP_ROOT}/${type}/${UUID}`);
/** What may stand before the app's root: nothing, a locale, an origin, both. */
const PREFIXES = ['', '/en', ORIGIN, `${ORIGIN}/fi`];
/** What may stand after a page's path. */
const SUFFIXES = ['', '?a=1', '#top', '?a=1#top'];

/** Every spelling of one page under each of `roots`: each prefix and suffix around `subPath`. */
function spellingsUnder(roots: ReadonlyArray<string>, subPath: string): Array<string> {
  return roots.flatMap((root) =>
    PREFIXES.flatMap((prefix) => SUFFIXES.map((suffix) => `${prefix}${root}${subPath}${suffix}`))
  );
}

/** Every spelling of one page of an entity, for each served type. */
function spellings(subPath: string): Array<string> {
  return spellingsUnder(ENTITY_ROOTS, subPath);
}

/** Every spelling of the same path without an entity segment. */
function entityLessSpellings(subPath: string): Array<string> {
  return spellingsUnder([APP_ROOT], subPath);
}

/** The app's root with an entity segment no pattern accepts. */
const BAD_ROOTS = [
  `/contestant/alliance/${UUID}`,
  `/contestant/${SERVED_ENTITY_TYPES[0]}/123`,
  `/contestant/${SERVED_ENTITY_TYPES[0]}/${UUID}0`,
  `/contestant/${SERVED_ENTITY_TYPES[0]}/${UUID.replace('3f2a', 'zzzz')}`,
  `/contestant/${SERVED_ENTITY_TYPES[0]}`,
  `/contestant/${UUID}`
];

function matchesAll(re: RegExp, urls: Array<string>): Array<string> {
  return urls.filter((url) => !re.test(url));
}

function matchesNone(re: RegExp, urls: Array<string>): Array<string> {
  return urls.filter((url) => re.test(url));
}

describe('ENTITY_SEGMENT_SOURCE', () => {
  it('is required: nothing does not match', () => {
    expect(new RegExp(`^${ENTITY_SEGMENT_SOURCE}$`).test('')).toBe(false);
  });

  it('accepts every served entity type and no other', () => {
    const re = new RegExp(`^${ENTITY_SEGMENT_SOURCE}$`);
    for (const type of SERVED_ENTITY_TYPES) expect(re.test(`/${type}/${UUID}`)).toBe(true);
    expect(re.test(`/${SERVED_ENTITY_TYPES[0]}/${UUID.toUpperCase()}`)).toBe(true);
    expect(re.test(`/alliance/${UUID}`)).toBe(false);
    expect(re.test(`/faction/${UUID}`)).toBe(false);
  });
});

describe('contestantUrlRe, exact', () => {
  const profile = contestantUrlRe('/profile');
  const questions = contestantUrlRe('/questions');

  it('accepts the page under each served type, with a locale, a query and a fragment', () => {
    expect(matchesAll(profile, spellings('/profile'))).toEqual([]);
    expect(matchesAll(profile, spellings('/profile/'))).toEqual([]);
    expect(matchesAll(questions, spellings('/questions'))).toEqual([]);
    for (const type of SERVED_ENTITY_TYPES)
      expect(profile.test(`/contestant/${type}/${UUID}/profile`), type).toBe(true);
  });

  it('rejects the page without an entity segment', () => {
    expect(profile.test('/contestant/profile')).toBe(false);
    expect(questions.test('/contestant/questions')).toBe(false);
    expect(matchesNone(profile, entityLessSpellings('/profile'))).toEqual([]);
    expect(matchesNone(profile, entityLessSpellings('/profile/'))).toEqual([]);
    expect(matchesNone(questions, entityLessSpellings('/questions'))).toEqual([]);
  });

  it('rejects every other page', () => {
    const others = [
      ...spellings('/questions'),
      ...spellings('/login'),
      ...spellings(''),
      ...spellings('/profile/extra'),
      ...spellings('/profiles'),
      ...spellings('/preview'),
      ...entityLessSpellings('/login'),
      ...entityLessSpellings(''),
      `${ORIGIN}/en/elections`
    ];
    expect(matchesNone(profile, others)).toEqual([]);
  });

  it('rejects a question page for the questions overview', () => {
    expect(matchesNone(questions, spellings(`/questions/${UUID}`))).toEqual([]);
    expect(matchesNone(questions, spellings('/profile'))).toEqual([]);
    expect(matchesNone(questions, spellings(''))).toEqual([]);
  });

  it('rejects an unserved type and a malformed uuid in the entity segment', () => {
    for (const root of BAD_ROOTS) {
      expect(profile.test(`${root}/profile`), root).toBe(false);
      expect(questions.test(`${ORIGIN}/en${root}/questions`), root).toBe(false);
    }
  });

  it('refuses a sub-path that is not one', () => {
    expect(() => contestantUrlRe('profile')).toThrow(/"profile"/);
    expect(() => contestantUrlRe('')).toThrow();
    expect(() => contestantUrlRe('/')).toThrow();
    expect(() => contestantUrlRe('/profile/')).toThrow();
    expect(() => contestantUrlRe('/profile?a=1')).toThrow();
  });

  it('reads a regular-expression character in the sub-path as text', () => {
    expect(contestantUrlRe('/a.b').test(`${ENTITY_ROOTS[0]}/a.b`)).toBe(true);
    expect(contestantUrlRe('/a.b').test(`${ENTITY_ROOTS[0]}/aXb`)).toBe(false);
  });
});

describe('contestantUrlRe, child', () => {
  const question = contestantUrlRe('/questions', 'child');

  it('accepts the page with one further segment', () => {
    expect(matchesAll(question, spellings(`/questions/${UUID}`))).toEqual([]);
    expect(matchesAll(question, spellings('/questions/q-1/'))).toEqual([]);
  });

  it('rejects the same path without an entity segment', () => {
    expect(question.test('/contestant/questions/q-1')).toBe(false);
    expect(matchesNone(question, entityLessSpellings(`/questions/${UUID}`))).toEqual([]);
  });

  it('rejects the page itself, a deeper path and another page', () => {
    const others = [
      ...spellings('/questions'),
      ...spellings('/questions/'),
      ...spellings('/questions/q-1/extra'),
      ...spellings('/profile/q-1'),
      ...spellings('/login'),
      ...spellings('')
    ];
    expect(matchesNone(question, others)).toEqual([]);
  });

  it('rejects an unserved type and a malformed uuid in the entity segment', () => {
    for (const root of BAD_ROOTS) expect(question.test(`${root}/questions/q-1`), root).toBe(false);
  });
});

describe('contestantUrlRe, any', () => {
  const questionsOrBelow = contestantUrlRe('/questions', 'any');

  it('accepts the page and any path below it', () => {
    expect(matchesAll(questionsOrBelow, spellings('/questions'))).toEqual([]);
    expect(matchesAll(questionsOrBelow, spellings('/questions/'))).toEqual([]);
    expect(matchesAll(questionsOrBelow, spellings(`/questions/${UUID}`))).toEqual([]);
  });

  it('rejects the same paths without an entity segment', () => {
    expect(matchesNone(questionsOrBelow, entityLessSpellings('/questions'))).toEqual([]);
    expect(matchesNone(questionsOrBelow, entityLessSpellings(`/questions/${UUID}`))).toEqual([]);
  });

  it('rejects another page and a longer first segment', () => {
    const others = [...spellings('/profile'), ...spellings('/questionsx'), ...spellings('/login'), ...spellings('')];
    expect(matchesNone(questionsOrBelow, others)).toEqual([]);
  });

  it('rejects an unserved type and a malformed uuid in the entity segment', () => {
    for (const root of BAD_ROOTS) expect(questionsOrBelow.test(`${root}/questions`), root).toBe(false);
  });
});

describe('contestantUrlOutsideRe', () => {
  const leftProfile = contestantUrlOutsideRe('/profile');

  it('accepts every other page of the app, under an entity and without one', () => {
    const others = [
      ...spellings(''),
      ...spellings('/'),
      ...spellings('/questions'),
      ...entityLessSpellings(''),
      ...entityLessSpellings('/'),
      ...entityLessSpellings('/questions'),
      ...entityLessSpellings('/login')
    ];
    expect(matchesAll(leftProfile, others)).toEqual([]);
    expect(leftProfile.test('/contestant/login')).toBe(true);
  });

  it('rejects the page, with and without an entity segment, and any path below it', () => {
    for (const each of [spellings, entityLessSpellings]) {
      expect(matchesNone(leftProfile, each('/profile'))).toEqual([]);
      expect(matchesNone(leftProfile, each('/profile/'))).toEqual([]);
      expect(matchesNone(leftProfile, each('/profile/extra'))).toEqual([]);
    }
  });

  it('rejects a URL outside the app', () => {
    expect(matchesNone(leftProfile, [`${ORIGIN}/en/elections`, `${ORIGIN}/en/contestants`, `${ORIGIN}/`])).toEqual([]);
  });
});

describe('contestantHomeUrlRe', () => {
  const home = contestantHomeUrlRe();

  it('accepts the home page of each served type, with a trailing slash, a locale, a query and a fragment', () => {
    expect(matchesAll(home, spellings(''))).toEqual([]);
    expect(matchesAll(home, spellings('/'))).toEqual([]);
  });

  it('rejects the app root, which carries no entity', () => {
    expect(home.test('/contestant')).toBe(false);
    expect(matchesNone(home, entityLessSpellings(''))).toEqual([]);
    expect(matchesNone(home, entityLessSpellings('/'))).toEqual([]);
  });

  it('rejects every sub-page and a URL outside the app', () => {
    const others = [
      ...spellings('/profile'),
      ...spellings('/questions'),
      ...spellings(`/questions/${UUID}`),
      ...spellings('/preview'),
      ...spellings('/settings'),
      ...entityLessSpellings('/profile'),
      ...entityLessSpellings('/login'),
      `${ORIGIN}/en/elections`,
      `${ORIGIN}/en/contestants`
    ];
    expect(matchesNone(home, others)).toEqual([]);
  });

  it('rejects an unserved type and a malformed uuid in the entity segment', () => {
    for (const root of BAD_ROOTS) expect(home.test(`${ORIGIN}/en${root}`), root).toBe(false);
  });
});

describe('isContestantHomePath', () => {
  it('accepts the home path of each served type', () => {
    for (const root of ENTITY_ROOTS) {
      expect(isContestantHomePath(root), root).toBe(true);
      expect(isContestantHomePath(`${root}/`), root).toBe(true);
    }
  });

  it('rejects the app root, a sub-page, a path that keeps its locale prefix and a malformed entity segment', () => {
    expect(isContestantHomePath(APP_ROOT)).toBe(false);
    expect(isContestantHomePath(`${APP_ROOT}/`)).toBe(false);
    for (const root of ENTITY_ROOTS) {
      expect(isContestantHomePath(`${root}/profile`), root).toBe(false);
      expect(isContestantHomePath(`/en${root}`), root).toBe(false);
    }
    expect(isContestantHomePath('/contestant/login')).toBe(false);
    expect(isContestantHomePath('/contestant/profile')).toBe(false);
    expect(isContestantHomePath('/contestants')).toBe(false);
    expect(isContestantHomePath('')).toBe(false);
    for (const root of BAD_ROOTS) expect(isContestantHomePath(root), root).toBe(false);
  });
});

describe('contestantAppRootUrlRe', () => {
  const root = contestantAppRootUrlRe();

  it('accepts the app root with a trailing slash, a locale, a query and a fragment', () => {
    expect(matchesAll(root, entityLessSpellings(''))).toEqual([]);
    expect(matchesAll(root, entityLessSpellings('/'))).toEqual([]);
  });

  it('rejects an entity home, every sub-page and a URL outside the app', () => {
    const others = [
      ...spellings(''),
      ...spellings('/'),
      ...spellings('/profile'),
      ...entityLessSpellings('/profile'),
      ...entityLessSpellings('/login'),
      `${ORIGIN}/en/elections`,
      `${ORIGIN}/en/contestants`
    ];
    expect(matchesNone(root, others)).toEqual([]);
  });
});

describe('isContestantAppRootPath', () => {
  it('accepts the app root with and without a trailing slash', () => {
    expect(isContestantAppRootPath(APP_ROOT)).toBe(true);
    expect(isContestantAppRootPath(`${APP_ROOT}/`)).toBe(true);
  });

  it('rejects an entity home, a sub-page, a path that keeps its locale prefix and a longer first segment', () => {
    for (const root of ENTITY_ROOTS) expect(isContestantAppRootPath(root), root).toBe(false);
    expect(isContestantAppRootPath('/contestant/login')).toBe(false);
    expect(isContestantAppRootPath('/contestant/profile')).toBe(false);
    expect(isContestantAppRootPath('/en/contestant')).toBe(false);
    expect(isContestantAppRootPath('/contestants')).toBe(false);
    expect(isContestantAppRootPath('')).toBe(false);
  });
});

describe('dropEntitySegments', () => {
  it('removes the two entity params in each of their forms and nothing else', () => {
    expect(
      dropEntitySegments('/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile')
    ).toBe('/contestant/(protected)/(nominated)/profile');
    expect(dropEntitySegments('/contestant/[entityType]/[entityId]/questions/[questionId]')).toBe(
      '/contestant/questions/[questionId]'
    );
    expect(dropEntitySegments('/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]')).toBe(
      '/contestant/(protected)'
    );
    expect(dropEntitySegments('/(voters)/(located)/results/[[electionTab]]/[[entity=etSg]]/[[id]]')).toBe(
      '/(voters)/(located)/results/[[electionTab]]/[[entity=etSg]]/[[id]]'
    );
  });
});

describe('buildEntityLessRoute', () => {
  it('builds the path of an entity page without an entity', () => {
    expect(buildEntityLessRoute({ route: 'ContestantAppProfile', locale: 'en' })).toBe('/contestant/profile');
    expect(buildEntityLessRoute({ route: 'ContestantAppQuestions', locale: 'en' })).toBe('/contestant/questions');
    expect(buildEntityLessRoute({ route: 'ContestantAppPreview', locale: 'en' })).toBe('/contestant/preview');
    expect(buildEntityLessRoute({ route: 'ContestantAppSettings', locale: 'en' })).toBe('/contestant/settings');
    expect(buildEntityLessRoute({ route: 'ContestantAppHome', locale: 'en' })).toBe('/contestant');
  });

  it('fills any other param and refuses it unfilled', () => {
    expect(buildEntityLessRoute({ route: 'ContestantAppQuestion', locale: 'en', params: { questionId: 'q-1' } })).toBe(
      '/contestant/questions/q-1'
    );
    expect(() => buildEntityLessRoute({ route: 'ContestantAppQuestion', locale: 'en' })).toThrow(/"questionId"/);
  });

  it('builds a path no entity pattern accepts, and the app root for either home key', () => {
    expect(
      contestantUrlRe('/profile').test(buildEntityLessRoute({ route: 'ContestantAppProfile', locale: 'en' }))
    ).toBe(false);
    expect(isContestantAppRootPath(buildEntityLessRoute({ route: 'ContestantAppHome', locale: 'en' }))).toBe(true);
    expect(isContestantAppRootPath(buildEntityLessRoute({ route: 'ContestantAppEntityHome', locale: 'en' }))).toBe(
      true
    );
  });
});
