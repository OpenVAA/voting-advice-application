import type { EntityType } from '@openvaa/data';

/**
 * The interface for an analytics event.
 */
export interface TrackingEvent<
  TData extends Record<string, JSONData | undefined> = Record<string, JSONData | undefined>
> {
  name: TrackingEventName;
  data: TData;
}

type TrackingEventName =
  | 'answer_delete'
  | 'answer_resetAll'
  | 'answer_resetWeight'
  | 'answer_setWeight'
  | 'answer'
  | 'dataConsent_granted'
  | 'entityCard_expandSubcards'
  | 'entityDetails_changeTab'
  | 'feedback_error'
  | 'feedback_sent'
  | 'filters_active'
  | 'filters_reset'
  | 'maintenance_shown'
  | 'menu_open'
  | 'pageview'
  | 'question_next'
  | 'question_previous'
  | 'question_show'
  | 'question_skip'
  | 'question_startFrom'
  | 'questionExtendedInfo_collapseSection'
  | 'questionExtendedInfo_expandSection'
  | 'questionExtendedInfo_open'
  | 'questionInfo_collapse'
  | 'questionInfo_expand'
  | 'results_browse'
  | `results_browse_${EntityType}`
  | 'results_changeElection'
  | 'results_changeTab'
  | 'results_ranked'
  | `results_ranked_${EntityType}`
  | 'survey_opened'
  | 'testCondition_reset'
  | 'testCondition_set'
  | 'trackingId_set'
  | 'video';
