/**
 * The closed event vocabulary: one valid sample per name, an unknown key rejected inside and beside `attributes` for every name, at least one rejected twin per name, the payloads that used to carry free text, the bounds on every string attribute, the stripped media URL and the sensitive set.
 */
import { describe, expect, it } from 'vitest';
import { MAX_EVENT_AGE_MS } from './constants';
import { SAMPLE_ID, SAMPLE_VISIT_ID, VALID_EVENTS } from './events.fixtures';
import { EVENT_NAMES, EventSchema, isSensitiveEvent, SENSITIVE_EVENTS } from './events.schema';
import type { EventName } from './events.schema';

/**
 * The places a parse rejects, as dotted paths; an unknown key is reported at the path of the key itself.
 *
 * @param input - Any value.
 * @returns An empty list when the value parses, and one path per issue otherwise.
 */
function rejectedAt(input: unknown): Array<string> {
  const result = EventSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.flatMap((issue) => {
    const base = issue.path.map(String);
    return issue.code === 'unrecognized_keys' ? issue.keys.map((key) => [...base, key].join('.')) : [base.join('.')];
  });
}

/**
 * A copy of the valid sample of `name` with members of its `attributes` replaced or added.
 *
 * @param name - The event name.
 * @param patch - The attribute members to set.
 * @returns A new wire-shaped object; the sample itself is not changed.
 */
function withAttributes(name: EventName, patch: Record<string, unknown>): Record<string, unknown> {
  const sample = structuredClone(VALID_EVENTS[name]) as Record<string, unknown>;
  return { ...sample, attributes: { ...(sample.attributes as Record<string, unknown>), ...patch } };
}

/**
 * A copy of the valid sample of `name` with one attribute removed.
 *
 * @param name - The event name.
 * @param key - The attribute to remove.
 * @returns A new wire-shaped object; the sample itself is not changed.
 */
function withoutAttribute(name: EventName, key: string): Record<string, unknown> {
  const sample = structuredClone(VALID_EVENTS[name]) as Record<string, unknown>;
  const attributes = { ...(sample.attributes as Record<string, unknown>) };
  delete attributes[key];
  return { ...sample, attributes };
}

/**
 * A copy of the valid sample of `name` with members beside `attributes` replaced or added.
 *
 * @param name - The event name.
 * @param patch - The members to set.
 * @returns A new wire-shaped object; the sample itself is not changed.
 */
function withMembers(name: EventName, patch: Record<string, unknown>): Record<string, unknown> {
  return { ...(structuredClone(VALID_EVENTS[name]) as Record<string, unknown>), ...patch };
}

/** A string one character longer than `max`, made of a character every bounded string attribute otherwise admits. */
function overLong(max: number): string {
  return '1'.repeat(max + 1);
}

/**
 * At least one rejected twin per name: a value of the right shape that breaks one bound of that event, with the path the rejection must name. The type makes a name without a twin a compile error.
 */
const REJECTED_TWINS: Record<EventName, Array<{ why: string; input: unknown; path: string }>> = {
  pageview: [
    { why: 'an id', input: withMembers('pageview', { id: SAMPLE_VISIT_ID }), path: 'id' },
    { why: 'a negative duration', input: withAttributes('pageview', { duration: -1 }), path: 'attributes.duration' },
    {
      why: 'a fractional duration',
      input: withAttributes('pageview', { duration: 1.5 }),
      path: 'attributes.duration'
    },
    {
      why: 'nine parameters',
      input: withAttributes('pageview', {
        params: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`p${i}`, 'x']))
      }),
      path: 'attributes.params'
    },
    {
      why: 'a parameter value of 65 characters',
      input: withAttributes('pageview', { params: { questionId: 'a'.repeat(65) } }),
      path: 'attributes.params.questionId'
    },
    {
      why: 'a parameter value with a space',
      input: withAttributes('pageview', { params: { questionId: 'two words' } }),
      path: 'attributes.params.questionId'
    },
    {
      why: 'a parameter name of 65 characters',
      input: withAttributes('pageview', { params: { ['a'.repeat(65)]: 'x' } }),
      path: 'attributes.params.' + 'a'.repeat(65)
    },
    {
      why: 'a path in place of the parameters',
      input: withAttributes('pageview', { params: '/results/candidates' }),
      path: 'attributes.params'
    }
  ],
  answer: [
    {
      why: 'a value with a space',
      input: withAttributes('answer', { value: 'I think so' }),
      path: 'attributes.value'
    },
    { why: 'an empty value', input: withAttributes('answer', { value: '' }), path: 'attributes.value' },
    {
      why: 'a value of 257 characters',
      input: withAttributes('answer', { value: overLong(256) }),
      path: 'attributes.value'
    },
    { why: 'a value that is a list', input: withAttributes('answer', { value: ['a', 'b'] }), path: 'attributes.value' },
    { why: 'an infinite value', input: withAttributes('answer', { value: Infinity }), path: 'attributes.value' },
    {
      why: 'a question id of 65 characters',
      input: withAttributes('answer', { questionId: overLong(64) }),
      path: 'attributes.questionId'
    },
    { why: 'no question id', input: withoutAttribute('answer', 'questionId'), path: 'attributes.questionId' }
  ],
  answer_delete: [
    {
      why: 'a question id of 65 characters',
      input: withAttributes('answer_delete', { questionId: overLong(64) }),
      path: 'attributes.questionId'
    },
    {
      why: 'a question id with a slash',
      input: withAttributes('answer_delete', { questionId: 'a/b' }),
      path: 'attributes.questionId'
    }
  ],
  answer_resetAll: [
    { why: 'an attribute', input: withAttributes('answer_resetAll', { count: 1 }), path: 'attributes.count' }
  ],
  dataConsent_granted: [
    {
      why: 'an attribute',
      input: withAttributes('dataConsent_granted', { consent: 'granted' }),
      path: 'attributes.consent'
    }
  ],
  entityCard_expandSubcards: [
    {
      why: 'a length above 1000',
      input: withAttributes('entityCard_expandSubcards', { length: 1001 }),
      path: 'attributes.length'
    },
    {
      why: 'a negative length',
      input: withAttributes('entityCard_expandSubcards', { length: -1 }),
      path: 'attributes.length'
    }
  ],
  entityDetails_changeTab: [
    {
      why: 'a section of 65 characters',
      input: withAttributes('entityDetails_changeTab', { section: overLong(64) }),
      path: 'attributes.section'
    },
    {
      why: 'a section with a space',
      input: withAttributes('entityDetails_changeTab', { section: 'my tab' }),
      path: 'attributes.section'
    }
  ],
  feedback_error: [
    {
      why: "the visitor's typed description",
      input: withAttributes('feedback_error', { description: 'The site is broken' }),
      path: 'attributes.description'
    },
    { why: 'a rating of 6', input: withAttributes('feedback_error', { rating: 6 }), path: 'attributes.rating' }
  ],
  feedback_sent: [
    {
      why: "the visitor's typed description",
      input: withAttributes('feedback_sent', { description: 'Great app' }),
      path: 'attributes.description'
    },
    { why: 'a rating of 0', input: withAttributes('feedback_sent', { rating: 0 }), path: 'attributes.rating' },
    { why: 'a fractional rating', input: withAttributes('feedback_sent', { rating: 2.5 }), path: 'attributes.rating' }
  ],
  filters_active: [
    {
      why: 'the localised filter names',
      input: withAttributes('filters_active', { activeFilters: 'Age,Party' }),
      path: 'attributes.activeFilters'
    },
    { why: 'a count of 0', input: withAttributes('filters_active', { count: 0 }), path: 'attributes.count' },
    { why: 'a count of 101', input: withAttributes('filters_active', { count: 101 }), path: 'attributes.count' }
  ],
  filters_reset: [
    { why: 'an attribute', input: withAttributes('filters_reset', { count: 1 }), path: 'attributes.count' }
  ],
  maintenance_shown: [
    {
      why: 'an attribute',
      input: withAttributes('maintenance_shown', { message: 'Back soon' }),
      path: 'attributes.message'
    }
  ],
  menu_open: [{ why: 'an attribute', input: withAttributes('menu_open', { item: 'about' }), path: 'attributes.item' }],
  question_next: [
    {
      why: 'a question index above 10000',
      input: withAttributes('question_next', { questionIndex: 10_001 }),
      path: 'attributes.questionIndex'
    }
  ],
  question_previous: [
    {
      why: 'a negative question index',
      input: withAttributes('question_previous', { questionIndex: -1 }),
      path: 'attributes.questionIndex'
    }
  ],
  question_skip: [
    {
      why: 'a question index given as a string',
      input: withAttributes('question_skip', { questionIndex: '4' }),
      path: 'attributes.questionIndex'
    }
  ],
  question_startFrom: [
    {
      why: 'a question id of 65 characters',
      input: withAttributes('question_startFrom', { questionId: overLong(64) }),
      path: 'attributes.questionId'
    }
  ],
  questionInfo_collapse: [
    {
      why: 'an attribute',
      input: withAttributes('questionInfo_collapse', { title: 'Background' }),
      path: 'attributes.title'
    }
  ],
  questionInfo_expand: [
    {
      why: 'an attribute',
      input: withAttributes('questionInfo_expand', { title: 'Background' }),
      path: 'attributes.title'
    }
  ],
  questionExtendedInfo_collapseSection: [
    {
      why: 'a section index',
      input: withAttributes('questionExtendedInfo_collapseSection', { sectionIndex: 1 }),
      path: 'attributes.sectionIndex'
    },
    {
      why: 'a title over 256 characters',
      input: withAttributes('questionExtendedInfo_collapseSection', { title: 'x'.repeat(257) }),
      path: 'attributes.title'
    }
  ],
  questionExtendedInfo_expandSection: [
    {
      why: 'no section title',
      input: withoutAttribute('questionExtendedInfo_expandSection', 'title'),
      path: 'attributes.title'
    },
    {
      why: 'an empty section title',
      input: withAttributes('questionExtendedInfo_expandSection', { title: '' }),
      path: 'attributes.title'
    }
  ],
  questionExtendedInfo_open: [
    {
      why: 'an attribute',
      input: withAttributes('questionExtendedInfo_open', { title: 'More' }),
      path: 'attributes.title'
    }
  ],
  results_browse: [
    {
      why: 'an election id of 65 characters',
      input: withAttributes('results_browse', { election: overLong(64) }),
      path: 'attributes.election'
    },
    {
      why: 'an entity type outside the four',
      input: withAttributes('results_browse', { entityType: 'party' }),
      path: 'attributes.entityType'
    },
    {
      why: 'an answer count above 10000',
      input: withAttributes('results_browse', { numAnswers: 10_001 }),
      path: 'attributes.numAnswers'
    }
  ],
  results_browse_entity: [
    {
      why: 'no entity type',
      input: withoutAttribute('results_browse_entity', 'entityType'),
      path: 'attributes.entityType'
    },
    {
      why: 'no entity id',
      input: withoutAttribute('results_browse_entity', 'entityId'),
      path: 'attributes.entityId'
    },
    {
      why: 'an entity id of 65 characters',
      input: withAttributes('results_browse_entity', { entityId: overLong(64) }),
      path: 'attributes.entityId'
    },
    {
      why: 'the entity id under its former name',
      input: withAttributes('results_browse_entity', { id: SAMPLE_ID }),
      path: 'attributes.id'
    },
    {
      why: 'a score',
      input: withAttributes('results_browse_entity', { score: 50 }),
      path: 'attributes.score'
    }
  ],
  results_changeElection: [
    {
      why: 'an election id of 65 characters',
      input: withAttributes('results_changeElection', { election: overLong(64) }),
      path: 'attributes.election'
    },
    { why: 'no election', input: withoutAttribute('results_changeElection', 'election'), path: 'attributes.election' }
  ],
  results_changeTab: [
    {
      why: 'a section outside the entity types',
      input: withAttributes('results_changeTab', { section: 'opinions' }),
      path: 'attributes.section'
    }
  ],
  results_ranked: [
    {
      why: 'an election id of 65 characters',
      input: withAttributes('results_ranked', { election: overLong(64) }),
      path: 'attributes.election'
    },
    {
      why: 'a negative answer count',
      input: withAttributes('results_ranked', { numAnswers: -1 }),
      path: 'attributes.numAnswers'
    }
  ],
  results_ranked_entity: [
    { why: 'no score', input: withoutAttribute('results_ranked_entity', 'score'), path: 'attributes.score' },
    {
      why: 'an infinite score',
      input: withAttributes('results_ranked_entity', { score: Infinity }),
      path: 'attributes.score'
    },
    {
      why: 'a score above 100',
      input: withAttributes('results_ranked_entity', { score: 101 }),
      path: 'attributes.score'
    },
    {
      why: 'an entity id of 65 characters',
      input: withAttributes('results_ranked_entity', { entityId: overLong(64) }),
      path: 'attributes.entityId'
    },
    {
      why: 'an entity type outside the four',
      input: withAttributes('results_ranked_entity', { entityType: 'party' }),
      path: 'attributes.entityType'
    }
  ],
  survey_opened: [
    {
      why: 'an attribute',
      input: withAttributes('survey_opened', { link: 'https://survey.example.org/?s=1' }),
      path: 'attributes.link'
    }
  ],
  video: [
    {
      why: 'a src of 2049 characters',
      input: withAttributes('video', { src: overLong(2048) }),
      path: 'attributes.src'
    },
    {
      why: 'a jump of 513 characters',
      input: withAttributes('video', { jump: '1,'.repeat(257) }),
      path: 'attributes.jump'
    },
    { why: 'a jump holding a letter', input: withAttributes('video', { jump: '1,a,' }), path: 'attributes.jump' },
    {
      why: 'a transcript toggle of 513 characters',
      input: withAttributes('video', { toggleTranscript: 'true,'.repeat(103) }),
      path: 'attributes.toggleTranscript'
    },
    {
      why: 'a transcript toggle holding another word',
      input: withAttributes('video', { toggleTranscript: 'true,maybe,' }),
      path: 'attributes.toggleTranscript'
    },
    { why: 'an end point above 1', input: withAttributes('video', { endAt: 1.5 }), path: 'attributes.endAt' },
    {
      why: 'an end point given as another word',
      input: withAttributes('video', { endAt: 'start' }),
      path: 'attributes.endAt'
    },
    { why: 'a negative duration', input: withAttributes('video', { duration: -1 }), path: 'attributes.duration' },
    { why: 'a flag given as a string', input: withAttributes('video', { ended: 'true' }), path: 'attributes.ended' }
  ]
};

describe('EventSchema', () => {
  it('declares the names once: EVENT_NAMES and the samples name the same set, and each sample sits under its own name', () => {
    expect(EVENT_NAMES.length).toBeGreaterThan(0);
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
    expect([...EVENT_NAMES].sort()).toEqual(Object.keys(VALID_EVENTS).sort());
    for (const name of EVENT_NAMES) expect(VALID_EVENTS[name].name).toBe(name);
  });

  it('holds the two fixed entity-view names and no name built from an entity type', () => {
    expect(EVENT_NAMES).toContain('results_browse_entity');
    expect(EVENT_NAMES).toContain('results_ranked_entity');
    for (const type of ['candidate', 'faction', 'organization', 'alliance']) {
      expect(EVENT_NAMES).not.toContain(`results_browse_${type}`);
      expect(EVENT_NAMES).not.toContain(`results_ranked_${type}`);
    }
  });

  it.each(EVENT_NAMES)('accepts the valid sample of %s', (name) => {
    const result = EventSchema.safeParse(VALID_EVENTS[name]);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('rejects a name outside the vocabulary, and a former template name', () => {
    expect(EventSchema.safeParse({ name: 'page_leave', ago: 0, attributes: {} }).success).toBe(false);
    expect(
      EventSchema.safeParse({ ...VALID_EVENTS.results_browse_entity, name: 'results_browse_candidate' }).success
    ).toBe(false);
    expect(EventSchema.safeParse({ ago: 0, attributes: {} }).success).toBe(false);
  });

  it.each(EVENT_NAMES)('rejects an unknown key inside the attributes of %s', (name) => {
    expect(rejectedAt(withAttributes(name, { extra: 1 }))).toContain('attributes.extra');
  });

  it.each(EVENT_NAMES)('rejects an unknown key beside the attributes of %s', (name) => {
    expect(rejectedAt(withMembers(name, { extra: 1 }))).toContain('extra');
  });

  it.each(EVENT_NAMES)('rejects %s without attributes', (name) => {
    const sample = structuredClone(VALID_EVENTS[name]) as Record<string, unknown>;
    delete sample.attributes;
    expect(rejectedAt(sample)).toContain('attributes');
  });

  describe.each(EVENT_NAMES)('rejected twins of %s', (name) => {
    it('has at least one', () => {
      expect(REJECTED_TWINS[name].length).toBeGreaterThan(0);
    });
    it.each(REJECTED_TWINS[name])('rejects $why at $path', ({ input, path }) => {
      expect(rejectedAt(input)).toContain(path);
    });
  });

  describe('the payloads that carried free text', () => {
    it.each(['feedback_sent', 'feedback_error'] as const)('%s keeps the rating and admits no description', (name) => {
      expect(rejectedAt(withAttributes(name, { description: 'Free text' }))).toContain('attributes.description');
      expect(EventSchema.safeParse(withoutAttribute(name, 'rating')).success).toBe(true);
    });

    it('filters_active sends a count, not the filter names', () => {
      expect(rejectedAt(withAttributes('filters_active', { activeFilters: 'Age' }))).toContain(
        'attributes.activeFilters'
      );
      expect(rejectedAt(withoutAttribute('filters_active', 'count'))).toContain('attributes.count');
    });

    it.each(['questionExtendedInfo_expandSection', 'questionExtendedInfo_collapseSection'] as const)(
      '%s sends the localised section title, not an index (operator ruling 2026-10-20)',
      (name) => {
        expect(rejectedAt(withAttributes(name, { title: 'Argumentit puolesta' }))).toEqual([]);
        expect(rejectedAt(withAttributes(name, { title: 'x'.repeat(256) }))).toEqual([]);
        expect(rejectedAt(withAttributes(name, { title: 'x'.repeat(257) }))).toContain('attributes.title');
        expect(rejectedAt(withAttributes(name, { sectionIndex: 0 }))).toContain('attributes.sectionIndex');
        expect(isSensitiveEvent(name)).toBe(false);
      }
    );
  });

  describe('the entity views', () => {
    it.each(['candidate', 'faction', 'organization', 'alliance'])('accepts the entity type %s', (entityType) => {
      expect(rejectedAt(withAttributes('results_browse_entity', { entityType }))).toEqual([]);
      expect(rejectedAt(withAttributes('results_ranked_entity', { entityType }))).toEqual([]);
    });
  });

  describe('the media URL', () => {
    it('drops the query string and the fragment of src', () => {
      const result = EventSchema.safeParse(
        withAttributes('video', { src: 'https://media.example.org/v/intro.mp4?token=secret&u=42#t=10' })
      );
      expect(result.success === false ? result.error.issues : result.success).toBe(true);
      const attributes = result.success && result.data.name === 'video' ? result.data.attributes : undefined;
      expect(attributes?.src).toBe('https://media.example.org/v/intro.mp4');
    });

    it('drops a fragment that comes before any question mark', () => {
      const result = EventSchema.safeParse(withAttributes('video', { src: 'https://m.example.org/a.mp4#x?y=1' }));
      const attributes = result.success && result.data.name === 'video' ? result.data.attributes : undefined;
      expect(attributes?.src).toBe('https://m.example.org/a.mp4');
    });

    it('accepts the end of the video as the word end', () => {
      expect(rejectedAt(withAttributes('video', { endAt: 'end' }))).toEqual([]);
    });

    it('accepts a video event with only its start flags, as one ended by navigation before its end is known', () => {
      expect(
        rejectedAt({
          name: 'video',
          ago: 0,
          attributes: { startMuted: true, startWithTranscript: false, startWithCaptions: true }
        })
      ).toEqual([]);
    });
  });

  describe('the members beside the attributes', () => {
    it('admits a visit id on every event but the pageview', () => {
      for (const name of EVENT_NAMES) {
        const expected = name === 'pageview' ? ['id'] : [];
        expect(rejectedAt(withMembers(name, { id: SAMPLE_VISIT_ID }))).toEqual(expected);
      }
    });

    it('admits an event without a visit id', () => {
      for (const name of EVENT_NAMES) {
        const sample = structuredClone(VALID_EVENTS[name]) as Record<string, unknown>;
        delete sample.id;
        expect(rejectedAt(sample)).toEqual([]);
      }
    });

    it.each([
      ['a version 4 uuid', SAMPLE_ID],
      ['an upper-case UUIDv7', SAMPLE_VISIT_ID.toUpperCase()],
      ['a UUIDv7 with a suffix', `${SAMPLE_VISIT_ID}x`],
      ['a number', 7]
    ])('rejects %s as the visit id', (_, id) => {
      expect(rejectedAt(withMembers('answer', { id }))).toContain('id');
    });

    it.each([
      ['negative', -1],
      ['fractional', 1.5],
      ['above the age limit', MAX_EVENT_AGE_MS + 1],
      ['a string', '0']
    ])('rejects an age that is %s', (_, ago) => {
      expect(rejectedAt(withMembers('menu_open', { ago }))).toContain('ago');
    });

    it('accepts an age of exactly the age limit', () => {
      expect(rejectedAt(withMembers('menu_open', { ago: MAX_EVENT_AGE_MS }))).toEqual([]);
    });
  });
});

describe('SENSITIVE_EVENTS', () => {
  it('holds exactly the events that reveal an answer or a leaning', () => {
    expect([...SENSITIVE_EVENTS].sort()).toEqual(
      [
        'answer',
        'answer_delete',
        'filters_active',
        'question_skip',
        'results_browse_entity',
        'results_ranked_entity'
      ].sort()
    );
  });

  it('never holds the pageview', () => {
    expect(SENSITIVE_EVENTS.has('pageview')).toBe(false);
    expect(isSensitiveEvent('pageview')).toBe(false);
  });

  it('is what isSensitiveEvent answers for every name', () => {
    for (const name of EVENT_NAMES) expect(isSensitiveEvent(name)).toBe(SENSITIVE_EVENTS.has(name));
  });
});
