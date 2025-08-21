export interface JobInfo {
  id: string;
  feature: string; // 'argument-condensation', 'factor-analysis', etc.
  author: string; // admin email
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-1 range
  startTime: Date;
  endTime?: Date; // Set when job completes or fails
  lastActivityTime: Date; // Last time the job was updated
  infoMessages: Array<string>;
  warningMessages: Array<string>;
  errorMessages: Array<string>;
}
