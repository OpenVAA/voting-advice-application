/**
 * One valid wire event per name of the vocabulary, for tests only.
 *
 * The object is checked against `Record<EventName, WireEvent>`, so a name added to the vocabulary without a sample here does not compile. Every sample carries each optional attribute its event admits, so that a test which breaks one attribute starts from a value where that attribute is present.
 */
import type { EventName, WireEvent } from './events.schema';

/** A fixed UUIDv7, used as the visit id of every sample that may carry one. */
export const SAMPLE_VISIT_ID = '01234567-89ab-7001-8203-040506070809';

/** A fixed uuid in the form the database issues, used wherever a sample needs an identifier. */
export const SAMPLE_ID = '3b241101-e2bb-4255-8caf-4136c566a962';

/** A second fixed uuid, for samples that name two different objects. */
export const SAMPLE_OTHER_ID = '7d0f1c2a-55b3-4c0e-9a4e-2f8d6b1e0c93';

export const VALID_EVENTS = {
  pageview: {
    name: 'pageview',
    ago: 0,
    attributes: {
      params: { electionTab: SAMPLE_ID, entityTab: 'candidates', entity: 'candidate' },
      duration: 12_300
    }
  },
  answer: {
    name: 'answer',
    ago: 1_500,
    id: SAMPLE_VISIT_ID,
    attributes: { questionId: SAMPLE_ID, value: 'choice_1,choice_3' }
  },
  answer_delete: {
    name: 'answer_delete',
    ago: 1_200,
    id: SAMPLE_VISIT_ID,
    attributes: { questionId: SAMPLE_ID }
  },
  answer_resetAll: { name: 'answer_resetAll', ago: 900, id: SAMPLE_VISIT_ID, attributes: {} },
  dataConsent_granted: { name: 'dataConsent_granted', ago: 0, id: SAMPLE_VISIT_ID, attributes: {} },
  entityCard_expandSubcards: {
    name: 'entityCard_expandSubcards',
    ago: 300,
    id: SAMPLE_VISIT_ID,
    attributes: { length: 4 }
  },
  entityDetails_changeTab: {
    name: 'entityDetails_changeTab',
    ago: 300,
    id: SAMPLE_VISIT_ID,
    attributes: { section: 'opinions' }
  },
  feedback_error: { name: 'feedback_error', ago: 50, id: SAMPLE_VISIT_ID, attributes: { rating: 2 } },
  feedback_sent: { name: 'feedback_sent', ago: 50, id: SAMPLE_VISIT_ID, attributes: { rating: 5 } },
  filters_active: { name: 'filters_active', ago: 700, id: SAMPLE_VISIT_ID, attributes: { count: 2 } },
  filters_reset: { name: 'filters_reset', ago: 600, id: SAMPLE_VISIT_ID, attributes: {} },
  maintenance_shown: { name: 'maintenance_shown', ago: 0, id: SAMPLE_VISIT_ID, attributes: {} },
  menu_open: { name: 'menu_open', ago: 2_000, id: SAMPLE_VISIT_ID, attributes: {} },
  question_next: { name: 'question_next', ago: 400, id: SAMPLE_VISIT_ID, attributes: { questionIndex: 3 } },
  question_previous: {
    name: 'question_previous',
    ago: 400,
    id: SAMPLE_VISIT_ID,
    attributes: { questionIndex: 2 }
  },
  question_skip: { name: 'question_skip', ago: 400, id: SAMPLE_VISIT_ID, attributes: { questionIndex: 4 } },
  question_startFrom: {
    name: 'question_startFrom',
    ago: 100,
    id: SAMPLE_VISIT_ID,
    attributes: { questionId: '__first__' }
  },
  questionInfo_collapse: { name: 'questionInfo_collapse', ago: 100, id: SAMPLE_VISIT_ID, attributes: {} },
  questionInfo_expand: { name: 'questionInfo_expand', ago: 100, id: SAMPLE_VISIT_ID, attributes: {} },
  questionExtendedInfo_collapseSection: {
    name: 'questionExtendedInfo_collapseSection',
    ago: 100,
    id: SAMPLE_VISIT_ID,
    attributes: { title: 'Arguments for' }
  },
  questionExtendedInfo_expandSection: {
    name: 'questionExtendedInfo_expandSection',
    ago: 100,
    id: SAMPLE_VISIT_ID,
    attributes: { title: 'Background' }
  },
  questionExtendedInfo_open: { name: 'questionExtendedInfo_open', ago: 100, id: SAMPLE_VISIT_ID, attributes: {} },
  results_browse: {
    name: 'results_browse',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { election: SAMPLE_ID, entityType: 'candidate', numAnswers: 0 }
  },
  results_browse_entity: {
    name: 'results_browse_entity',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { entityType: 'organization', entityId: SAMPLE_OTHER_ID }
  },
  results_changeElection: {
    name: 'results_changeElection',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { election: SAMPLE_OTHER_ID }
  },
  results_changeTab: {
    name: 'results_changeTab',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { section: 'alliance' }
  },
  results_ranked: {
    name: 'results_ranked',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { election: SAMPLE_ID, entityType: 'candidate', numAnswers: 17 }
  },
  results_ranked_entity: {
    name: 'results_ranked_entity',
    ago: 800,
    id: SAMPLE_VISIT_ID,
    attributes: { entityType: 'candidate', entityId: SAMPLE_OTHER_ID, score: 73 }
  },
  survey_opened: { name: 'survey_opened', ago: 0, id: SAMPLE_VISIT_ID, attributes: {} },
  video: {
    name: 'video',
    ago: 0,
    id: SAMPLE_VISIT_ID,
    attributes: {
      startMuted: true,
      startWithTranscript: false,
      startWithCaptions: true,
      src: 'https://media.example.org/videos/intro.mp4',
      duration: 94.5,
      endAt: 0.42,
      ended: false,
      endMuted: false,
      endWithTranscript: true,
      endWithCaptions: true,
      error: false,
      jump: '1,1,-1,',
      toggleTranscript: 'true,false,true,'
    }
  }
} satisfies Record<EventName, WireEvent>;
