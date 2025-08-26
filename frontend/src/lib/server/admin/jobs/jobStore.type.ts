/**
 * Information about an admin job. A job is a long-running process that is used to perform a task.
 * The information is used to track the job's progress and status and display it to the admin.
 * @example
 * {
 *   id: '123',
 *   feature: 'argument-condensation',
 *   author: 'admin@example.com',
 *   status: 'running',
 *   progress: 0.5,
 *   startTime: new Date(),
 *   endTime: new Date(),
 *   lastActivityTime: new Date(),
 *   infoMessages: ['Job started'],
 *   warningMessages: [],
 *   errorMessages: []
 * }
 */
export interface JobInfo {
  id: string;
  feature: string;
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
