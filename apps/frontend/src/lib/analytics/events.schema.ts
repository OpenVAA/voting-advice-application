/**
 * The closed vocabulary of usage events: every event the browser may send, with the exact attributes each may carry.
 *
 * ## Strict at every level
 *
 * Each event is a `z.strictObject`, and so is its `attributes`, so an unknown key anywhere fails the parse. Names are literals, closed sets are enums, and every string has a pattern or a length cap. No member admits text a visitor typed. Text taken from published content is admitted in one place only: the localised title of an information section, which the two section events carry (an operator ruling of 2026-10-20) and which is length-capped. Every other event that used to carry such text carries an index or a count instead.
 *
 * ## The wire shape of one event
 *
 * `name`, `ago` (the event's age in whole milliseconds when the batch is sent; the relay subtracts it from its own receive time) and `attributes`. Every event but the pageview may also carry `id`, the visit id, which must be a UUIDv7. The pageview never has an `id` member, and its route id and locale are those of the batch it travels in.
 */
import { ENTITY_TYPE } from '@openvaa/data';
import { z } from 'zod';
import { ID_PATTERN, MAX_EVENT_AGE_MS } from './constants';
import { isUuidV7 } from './uuidv7';

/** The event's age in whole milliseconds at send time. */
const AgeSchema = z.number().int().min(0).max(MAX_EVENT_AGE_MS);

/** The visit id: a UUIDv7 in canonical lower-case form. */
const VisitIdSchema = z.string().max(36).refine(isUuidV7, { message: 'Expected a UUIDv7' });

/** The members every event but the pageview has beside its name and attributes. */
const COMMON = { ago: AgeSchema, id: VisitIdSchema.optional() };

/** An identifier: one to 64 letters, digits, underscores or hyphens. It admits a uuid and the first-question placeholder, and no free text. */
const IdSchema = z.string().regex(ID_PATTERN);

/** The four entity types, taken from the values `@openvaa/data` declares. */
const EntityTypeSchema = z.enum(ENTITY_TYPE);

/** How many answers a results event may report. */
const NumAnswersSchema = z.number().int().min(0).max(10_000);

/** The position of a question in the voter's question sequence. */
const QuestionIndexSchema = z.number().int().min(0).max(10_000);

/** The longest information-section title a section event may carry. */
const MAX_SECTION_TITLE_LENGTH = 256;

/** The localised title of an information section, as the voter sees it: published content, not text a visitor typed. */
const SectionTitleSchema = z.string().min(1).max(MAX_SECTION_TITLE_LENGTH);

/** The most route parameters one pageview may carry. */
const MAX_PAGEVIEW_PARAMS = 8;

/**
 * The route parameters of a pageview, keyed by parameter name.
 *
 * A name starts with a letter, so an inherited name such as `__proto__` cannot appear. Which names a route may send is decided by the per-route allowlist when the relay builds the record; this schema bounds the shape only.
 */
const PageviewParamsSchema = z
  .record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/), z.string().regex(ID_PATTERN))
  .refine((params) => Object.keys(params).length <= MAX_PAGEVIEW_PARAMS, {
    message: `At most ${MAX_PAGEVIEW_PARAMS} parameters`
  });

/**
 * An answer value as the answer store sends it: a number, a boolean, or a choice id. A multiple-choice answer is its choice ids joined with commas. The character set admits ids and no free text.
 */
const AnswerValueSchema = z.union([
  z.number(),
  z.boolean(),
  z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Za-z0-9_.:,-]+$/)
]);

/** The longest media URL a video event may carry, before its query string and fragment are removed. */
const MAX_VIDEO_SRC_LENGTH = 2048;

/** The longest list of jumps or transcript toggles a video event may carry. */
const MAX_VIDEO_LIST_LENGTH = 512;

/**
 * Remove the query string and the fragment of a URL: everything from the first `?` or `#` on.
 *
 * @param url - A URL or any string.
 * @returns The part before the first `?` or `#`.
 */
function stripQueryAndFragment(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** The attributes of a video event. The start flags are set when the video starts; the rest when the event ends. */
const VideoAttributesSchema = z.strictObject({
  startMuted: z.boolean().optional(),
  startWithTranscript: z.boolean().optional(),
  startWithCaptions: z.boolean().optional(),
  /** The media URL, without its query string or fragment. */
  src: z.string().max(MAX_VIDEO_SRC_LENGTH).transform(stripQueryAndFragment).optional(),
  /** The length of the video in seconds. */
  duration: z
    .number()
    .min(0)
    .max(24 * 60 * 60)
    .optional(),
  /** Where the viewer stopped, as a fraction of the duration, or `'end'`. */
  endAt: z.union([z.literal('end'), z.number().min(0).max(1)]).optional(),
  ended: z.boolean().optional(),
  endMuted: z.boolean().optional(),
  endWithTranscript: z.boolean().optional(),
  endWithCaptions: z.boolean().optional(),
  error: z.boolean().optional(),
  /** The jump steps, each followed by a comma, e.g. `1,-1,1,`. */
  jump: z
    .string()
    .max(MAX_VIDEO_LIST_LENGTH)
    .regex(/^(-?\d+(\.\d+)?,)+$/)
    .optional(),
  /** The transcript toggles, each followed by a comma, e.g. `true,false,`. */
  toggleTranscript: z
    .string()
    .max(MAX_VIDEO_LIST_LENGTH)
    .regex(/^((true|false),)+$/)
    .optional()
});

/** Attributes for an event that carries none. */
const NO_ATTRIBUTES = z.strictObject({});

/**
 * The whole vocabulary: one strict member per event name, told apart by `name`.
 */
export const EventSchema = z.discriminatedUnion('name', [
  z.strictObject({
    name: z.literal('pageview'),
    ago: AgeSchema,
    attributes: z.strictObject({
      params: PageviewParamsSchema,
      /** The visible time spent on the view, in milliseconds. */
      duration: z.number().int().min(0)
    })
  }),
  z.strictObject({
    name: z.literal('answer'),
    ...COMMON,
    attributes: z.strictObject({ questionId: IdSchema, value: AnswerValueSchema })
  }),
  z.strictObject({
    name: z.literal('answer_delete'),
    ...COMMON,
    attributes: z.strictObject({ questionId: IdSchema })
  }),
  z.strictObject({ name: z.literal('answer_resetAll'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({ name: z.literal('dataConsent_granted'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({
    name: z.literal('entityCard_expandSubcards'),
    ...COMMON,
    attributes: z.strictObject({ length: z.number().int().min(0).max(1000) })
  }),
  z.strictObject({
    name: z.literal('entityDetails_changeTab'),
    ...COMMON,
    attributes: z.strictObject({ section: IdSchema })
  }),
  z.strictObject({
    name: z.literal('feedback_error'),
    ...COMMON,
    attributes: z.strictObject({ rating: z.number().int().min(1).max(5).optional() })
  }),
  z.strictObject({
    name: z.literal('feedback_sent'),
    ...COMMON,
    attributes: z.strictObject({ rating: z.number().int().min(1).max(5).optional() })
  }),
  z.strictObject({
    name: z.literal('filters_active'),
    ...COMMON,
    attributes: z.strictObject({ count: z.number().int().min(1).max(100) })
  }),
  z.strictObject({ name: z.literal('filters_reset'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({ name: z.literal('maintenance_shown'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({ name: z.literal('menu_open'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({
    name: z.literal('question_next'),
    ...COMMON,
    attributes: z.strictObject({ questionIndex: QuestionIndexSchema.optional() })
  }),
  z.strictObject({
    name: z.literal('question_previous'),
    ...COMMON,
    attributes: z.strictObject({ questionIndex: QuestionIndexSchema.optional() })
  }),
  z.strictObject({
    name: z.literal('question_skip'),
    ...COMMON,
    attributes: z.strictObject({ questionIndex: QuestionIndexSchema.optional() })
  }),
  z.strictObject({
    name: z.literal('question_startFrom'),
    ...COMMON,
    attributes: z.strictObject({ questionId: IdSchema })
  }),
  z.strictObject({ name: z.literal('questionInfo_collapse'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({ name: z.literal('questionInfo_expand'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({
    name: z.literal('questionExtendedInfo_collapseSection'),
    ...COMMON,
    attributes: z.strictObject({ title: SectionTitleSchema })
  }),
  z.strictObject({
    name: z.literal('questionExtendedInfo_expandSection'),
    ...COMMON,
    attributes: z.strictObject({ title: SectionTitleSchema })
  }),
  z.strictObject({ name: z.literal('questionExtendedInfo_open'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({
    name: z.literal('results_browse'),
    ...COMMON,
    attributes: z.strictObject({
      election: IdSchema.optional(),
      entityType: EntityTypeSchema.optional(),
      numAnswers: NumAnswersSchema
    })
  }),
  z.strictObject({
    name: z.literal('results_browse_entity'),
    ...COMMON,
    attributes: z.strictObject({ entityType: EntityTypeSchema, entityId: IdSchema })
  }),
  z.strictObject({
    name: z.literal('results_changeElection'),
    ...COMMON,
    attributes: z.strictObject({ election: IdSchema })
  }),
  z.strictObject({
    name: z.literal('results_changeTab'),
    ...COMMON,
    attributes: z.strictObject({ section: EntityTypeSchema })
  }),
  z.strictObject({
    name: z.literal('results_ranked'),
    ...COMMON,
    attributes: z.strictObject({
      election: IdSchema.optional(),
      entityType: EntityTypeSchema.optional(),
      numAnswers: NumAnswersSchema
    })
  }),
  z.strictObject({
    name: z.literal('results_ranked_entity'),
    ...COMMON,
    attributes: z.strictObject({
      entityType: EntityTypeSchema,
      entityId: IdSchema,
      /** The match score, a whole percentage. */
      score: z.number().int().min(0).max(100)
    })
  }),
  z.strictObject({ name: z.literal('survey_opened'), ...COMMON, attributes: NO_ATTRIBUTES }),
  z.strictObject({ name: z.literal('video'), ...COMMON, attributes: VideoAttributesSchema })
]);

/** One event as it travels in a batch, after parsing. */
export type WireEvent = z.output<typeof EventSchema>;

/** A name of the vocabulary. */
export type EventName = WireEvent['name'];

/** The attributes a call site passes for the event `TName`, before parsing. */
export type EventAttributes<TName extends EventName> = Extract<
  z.input<typeof EventSchema>,
  { name: TName }
>['attributes'];

/** Every name of the vocabulary, in the order the union declares them. */
export const EVENT_NAMES: ReadonlyArray<EventName> = Object.freeze(
  EventSchema.options.map((member) => member.shape.name.value)
);

/**
 * The events that reveal a visitor's answer or political leaning.
 *
 * An event in this set is sensitive: it says how the visitor answered, which answer they removed or skipped, which entity they looked at in the results and how well it matched them, or that they narrowed the results by filters. A deployment that collects without consent never links such an event to the visit; the pageview is never in this set.
 */
export const SENSITIVE_EVENTS: ReadonlySet<EventName> = new Set<EventName>([
  'answer',
  'answer_delete',
  'question_skip',
  'results_ranked_entity',
  'results_browse_entity',
  'filters_active'
]);

/**
 * True when the event reveals a visitor's answer or political leaning.
 *
 * @param name - An event name of the vocabulary.
 * @returns Whether `name` is in `SENSITIVE_EVENTS`.
 */
export function isSensitiveEvent(name: EventName): boolean {
  return SENSITIVE_EVENTS.has(name);
}
