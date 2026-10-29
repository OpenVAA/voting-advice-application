/**
 * The server's answer to "is this entity's preview open", driven with plain rows in the data provider's own shapes: every case hands the helper an entity with its saved answers and nominations, the question data of its elections, and a reader of election and constituency data. Nothing is mocked but the reader and the log, so the data root, the rollup, the filters and the predicate are the real ones.
 *
 * What this file holds:
 *
 * 1. **The rule.** Closed while a required info question or an opinion question is unanswered, open once both are filled; a saved `false` or `0` is an answer; an entity that is asked no opinion question is open on its required info alone.
 * 2. **What is not counted.** A question addressed to the other entity type, a question of another election and a locked required question.
 * 3. **No nomination.** Closed, and nothing is read.
 * 4. **No answer.** Question data that is an error, a nomination whose election the election data does not hold, and a failed read each give `undefined`, logged once, and nothing is thrown.
 * 5. **Nothing of one call reaches the next.** Two calls, one after the other, for two entities of two elections that share no question, in both orders.
 */

import { log } from '@openvaa/app-shared';
import { QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPreviewOpen } from './previewGate';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type { PreviewGateEntity, PreviewGateReader } from './previewGate';

type QuestionData = DPDataType['questions'];
type QuestionRow = QuestionData['questions'][number];
type CategoryRow = QuestionData['categories'][number];
type Answers = NonNullable<PreviewGateEntity['entity']['answers']>;

const ELECTIONS: DPDataType['elections'] = [
  { id: 'election-a', name: 'Election A', constituencyGroupIds: ['group-a'] },
  { id: 'election-b', name: 'Election B', constituencyGroupIds: ['group-b'] }
];

const CONSTITUENCIES: DPDataType['constituencies'] = {
  groups: [
    { id: 'group-a', constituencyIds: ['constituency-a'] },
    { id: 'group-b', constituencyIds: ['constituency-b'] }
  ],
  constituencies: [
    { id: 'constituency-a', name: 'Constituency A' },
    { id: 'constituency-b', name: 'Constituency B' }
  ]
};

const NOMINATION_A = { electionId: 'election-a', constituencyId: 'constituency-a' };
const NOMINATION_B = { electionId: 'election-b', constituencyId: 'constituency-b' };

const CHOICES = [
  { id: 'choice-1', label: 'Disagree', normalizableValue: 1 },
  { id: 'choice-2', label: 'Agree', normalizableValue: 2 }
];

/** An info category and an opinion category that state no election, constituency or entity type. */
const CATEGORIES: Array<CategoryRow> = [
  { id: 'info', name: 'Info', type: QUESTION_CATEGORY_TYPE.Info },
  { id: 'opinion', name: 'Opinions', type: QUESTION_CATEGORY_TYPE.Opinion }
];

/** A text question of the info category. */
function infoQuestion(id: string, extra: Partial<QuestionRow> = {}): QuestionRow {
  return { id, type: 'text', name: id, categoryId: 'info', ...extra } as QuestionRow;
}

/** A choice question of the opinion category. */
function opinionQuestion(id: string, extra: Partial<QuestionRow> = {}): QuestionRow {
  return {
    id,
    type: 'singleChoiceOrdinal',
    name: id,
    categoryId: 'opinion',
    choices: CHOICES,
    ...extra
  } as QuestionRow;
}

/** Question data that holds the two categories and the given questions. Every call builds its own rows. */
function questionDataOf(questions: Array<QuestionRow>): QuestionData {
  return { categories: structuredClone(CATEGORIES), questions };
}

/** One required info question, one that is not required, and two opinion questions. */
function standardQuestions(): Array<QuestionRow> {
  return [
    infoQuestion('info-required', { required: true }),
    infoQuestion('info-optional', { required: false }),
    opinionQuestion('opinion-1'),
    opinionQuestion('opinion-2')
  ];
}

/** Every answer the standard questions' rule asks for. */
const STANDARD_ANSWERS: Answers = {
  'info-required': { value: 'A text.' },
  'opinion-1': { value: 'choice-1' },
  'opinion-2': { value: 'choice-2' }
};

/** A reader that answers each read with its own copy of the election and constituency rows. */
function readerOf(): PreviewGateReader & {
  getElectionData: ReturnType<typeof vi.fn>;
  getConstituencyData: ReturnType<typeof vi.fn>;
} {
  return {
    getElectionData: vi.fn(async () => structuredClone(ELECTIONS)),
    getConstituencyData: vi.fn(async () => structuredClone(CONSTITUENCIES))
  };
}

/** A candidate with the given answers, nominated in election A unless told otherwise. */
function candidateWith(
  answers: Answers | null | undefined,
  nominations: PreviewGateEntity['nominations'] = [NOMINATION_A]
): PreviewGateEntity {
  return { entity: { type: 'candidate', answers }, nominations };
}

/** The helper's answer for an entity and its question data, read through a fresh reader. */
function answerFor(userData: PreviewGateEntity, questionData: unknown): Promise<boolean | undefined> {
  return isPreviewOpen({ dataProvider: readerOf(), locale: 'en', userData, questionData });
}

let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('previewGate — the rule', () => {
  it('answers closed while a required info question is unanswered', async () => {
    const answers = { 'opinion-1': { value: 'choice-1' }, 'opinion-2': { value: 'choice-2' } };

    expect(await answerFor(candidateWith(answers), questionDataOf(standardQuestions()))).toBe(false);
  });

  it('answers closed while an opinion question is unanswered', async () => {
    const answers = { 'info-required': { value: 'A text.' }, 'opinion-1': { value: 'choice-1' } };

    expect(await answerFor(candidateWith(answers), questionDataOf(standardQuestions()))).toBe(false);
  });

  it('answers closed for an entity whose saved answers are missing or empty', async () => {
    for (const answers of [undefined, null, {}, { 'info-required': { value: '' }, 'opinion-1': null }]) {
      expect(await answerFor(candidateWith(answers), questionDataOf(standardQuestions()))).toBe(false);
    }
  });

  it('answers open once the required info and every opinion question are answered', async () => {
    expect(await answerFor(candidateWith(STANDARD_ANSWERS), questionDataOf(standardQuestions()))).toBe(true);
    expect(logError).not.toHaveBeenCalled();
  });

  it('counts a saved false and a saved 0 as answers', async () => {
    const questions = [
      infoQuestion('info-boolean', { type: 'boolean', required: true }),
      infoQuestion('info-number', { type: 'number', required: true }),
      opinionQuestion('opinion-1')
    ];
    const answers = {
      'info-boolean': { value: false },
      'info-number': { value: 0 },
      'opinion-1': { value: 'choice-1' }
    };

    expect(await answerFor(candidateWith(answers), questionDataOf(questions))).toBe(true);
  });

  it('answers open on the required info alone for an entity that is asked no opinion question', async () => {
    const questions = [
      infoQuestion('info-required', { required: true }),
      opinionQuestion('opinion-organization', { entityType: ['organization'] })
    ];

    expect(await answerFor(candidateWith({ 'info-required': { value: 'A text.' } }), questionDataOf(questions))).toBe(
      true
    );
    expect(await answerFor(candidateWith({}), questionDataOf(questions))).toBe(false);
  });

  it('answers open for an entity that is asked nothing it must answer', async () => {
    const questions = [infoQuestion('info-optional', { required: false })];

    expect(await answerFor(candidateWith({}), questionDataOf(questions))).toBe(true);
  });
});

describe('previewGate — what is not counted', () => {
  it('leaves out a question addressed to the other entity type, a question of another election and a locked required question', async () => {
    const questions = [
      ...standardQuestions(),
      infoQuestion('info-organization', { required: true, entityType: ['organization'] }),
      opinionQuestion('opinion-organization', { entityType: ['organization'] }),
      infoQuestion('info-election-b', { required: true, electionIds: ['election-b'] }),
      opinionQuestion('opinion-election-b', { electionIds: ['election-b'] }),
      infoQuestion('info-locked', { required: true, customData: { locked: true } })
    ];

    expect(await answerFor(candidateWith(STANDARD_ANSWERS), questionDataOf(questions))).toBe(true);
  });

  it('counts each of them for the entity it is addressed to', async () => {
    const questions = [
      ...standardQuestions(),
      opinionQuestion('opinion-organization', { entityType: ['organization'] }),
      opinionQuestion('opinion-election-b', { electionIds: ['election-b'] })
    ];
    const organization: PreviewGateEntity = {
      entity: { type: 'organization', answers: STANDARD_ANSWERS },
      nominations: [NOMINATION_A]
    };
    const candidateInBoth = candidateWith(STANDARD_ANSWERS, [NOMINATION_A, NOMINATION_B]);

    expect(await answerFor(organization, questionDataOf(questions))).toBe(false);
    expect(await answerFor(candidateInBoth, questionDataOf(questions))).toBe(false);
  });
});

describe('previewGate — an entity with no nomination', () => {
  it('answers closed and reads nothing', async () => {
    const reader = readerOf();

    for (const nominations of [[], null, undefined]) {
      const open = await isPreviewOpen({
        dataProvider: reader,
        locale: 'en',
        userData: { entity: { type: 'candidate', answers: STANDARD_ANSWERS }, nominations },
        questionData: questionDataOf(standardQuestions())
      });

      expect(open).toBe(false);
    }
    expect(reader.getElectionData).not.toHaveBeenCalled();
    expect(reader.getConstituencyData).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
});

describe('previewGate — no answer', () => {
  it('gives no answer and throws nothing when the question data is an error', async () => {
    const open = await answerFor(candidateWith(STANDARD_ANSWERS), new Error('the question read failed'));

    expect(open).toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('gives no answer and throws nothing when the question data has another shape', async () => {
    for (const questionData of [undefined, null, {}, { categories: [] }]) {
      expect(await answerFor(candidateWith(STANDARD_ANSWERS), questionData)).toBeUndefined();
    }
  });

  it('gives no answer and throws nothing for a nomination whose election the election data does not hold', async () => {
    const userData = candidateWith(STANDARD_ANSWERS, [
      { electionId: 'election-unknown', constituencyId: 'constituency-a' }
    ]);

    expect(await answerFor(userData, questionDataOf(standardQuestions()))).toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('gives no answer and throws nothing when a read fails', async () => {
    const reader = readerOf();
    reader.getConstituencyData.mockRejectedValue(new Error('the constituency read failed'));

    const open = await isPreviewOpen({
      dataProvider: reader,
      locale: 'en',
      userData: candidateWith(STANDARD_ANSWERS),
      questionData: questionDataOf(standardQuestions())
    });

    expect(open).toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("reads the election and the constituency data in the request's locale", async () => {
    const reader = readerOf();

    await isPreviewOpen({
      dataProvider: reader,
      locale: 'fi',
      userData: candidateWith(STANDARD_ANSWERS),
      questionData: questionDataOf(standardQuestions())
    });

    expect(reader.getElectionData).toHaveBeenCalledExactlyOnceWith({ locale: 'fi' });
    expect(reader.getConstituencyData).toHaveBeenCalledExactlyOnceWith({ locale: 'fi' });
  });
});

describe('previewGate — two calls for two entities', () => {
  /** The question data of each election as its own read returns it: no question of the other election is in it. */
  const QUESTIONS_OF = {
    a: () => [infoQuestion('a-info-required', { required: true }), opinionQuestion('a-opinion')],
    b: () => [infoQuestion('b-info-required', { required: true }), opinionQuestion('b-opinion')]
  };
  /** Every answer to the questions of each election, and none to the other's. */
  const ANSWERS_OF: Record<'a' | 'b', Answers> = {
    a: { 'a-info-required': { value: 'A text.' }, 'a-opinion': { value: 'choice-1' } },
    b: { 'b-info-required': { value: 'A text.' }, 'b-opinion': { value: 'choice-2' } }
  };
  const NOMINATION_OF = { a: NOMINATION_A, b: NOMINATION_B };

  it.each([
    ['a', 'b'],
    ['b', 'a']
  ] as const)(
    'answers a second entity from its own rows and nothing of the first (%s, then %s)',
    async (first, second) => {
      // The first entity has answered everything of its own election.
      const firstOpen = await answerFor(
        candidateWith(ANSWERS_OF[first], [NOMINATION_OF[first]]),
        questionDataOf(QUESTIONS_OF[first]())
      );
      // The second has answered everything of its own and nothing of the first's: its preview is open by its own rows alone.
      const secondOpen = await answerFor(
        candidateWith(ANSWERS_OF[second], [NOMINATION_OF[second]]),
        questionDataOf(QUESTIONS_OF[second]())
      );
      // A third entity holds the first's answers and none to its own election's questions: its preview is closed by its own rows alone.
      const thirdOpen = await answerFor(
        candidateWith(ANSWERS_OF[first], [NOMINATION_OF[second]]),
        questionDataOf(QUESTIONS_OF[second]())
      );

      expect(firstOpen).toBe(true);
      expect(secondOpen).toBe(true);
      expect(thirdOpen).toBe(false);
      expect(logError).not.toHaveBeenCalled();
    }
  );
});
