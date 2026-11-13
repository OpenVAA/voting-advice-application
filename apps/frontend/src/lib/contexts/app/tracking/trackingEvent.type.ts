import type { EntityType } from '@openvaa/data';

/**
 * A name a call site may track: every name of the event vocabulary except the pageview, which the tracking service builds itself.
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
  | 'question_skip'
  | 'question_startFrom'
  | 'questionInfo_collapse'
  | 'questionInfo_expand'
  | 'questionExtendedInfo_collapseSection'
  | 'questionExtendedInfo_expandSection'
  | 'questionExtendedInfo_open'
  | `results_browse_${EntityType}`
  | 'results_browse'
  | 'results_changeElection'
  | 'results_changeTab'
  | `results_ranked_${EntityType}`
  | 'results_ranked'
  | 'survey_opened'
  | 'video';
