import type {
  LocalizedQuestionArguments,
  LocalizedQuestionInfoSection,
  LocalizedTermDefinition,
  LocalizedVideoContent
} from '@openvaa/app-shared';
import type { Id, Serializable } from '@openvaa/core';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo, JobMessage } from '$lib/server/admin/jobs/jobStore.type';
import type { WithTargetId } from './dataWriter.type';

////////////////////////////////////////////////////////////////////
// Types for building the params to AdminWriter methods
////////////////////////////////////////////////////////////////////

export type SetQuestionOptions = WithTargetId & { data: TemporarySetQuestionData };

/**
 * A temporary type for setting `Question` data, which will be updated later to allow for setting all properties. It currently supports only `customData` properties.
 */
export type TemporarySetQuestionData = {
  customData: {
    arguments?: Array<LocalizedQuestionArguments>;
    infoSections?: Array<LocalizedQuestionInfoSection>;
    terms?: Array<LocalizedTermDefinition>;
    video?: LocalizedVideoContent;
  };
};

export type InsertJobResultOptions = { data: AdminJobRecord };

/**
 * Result of an admin job.
 * TODO: Define in a more logical place when saved job listing is implemented.
 */
export type AdminJobRecord = {
  jobId: JobInfo['id'];
  jobType: AdminFeature;
  electionId: Id;
  /**
   * Author email
   */
  author: string;
  endStatus: 'completed' | 'failed' | 'aborted'; // TODO: this could be dynamic, right?
  startTime?: string;
  endTime?: string;
  input?: Serializable;
  output?: Serializable;
  messages?: Array<JobMessage>;
  metadata?: Serializable;
};
