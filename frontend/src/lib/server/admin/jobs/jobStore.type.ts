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
 *   startTime: '2024-01-01T00:00:00.000Z',
 *   endTime: '2024-01-01T00:05:00.000Z',
 *   lastActivityTime: '2024-01-01T00:04:30.000Z',
 *   infoMessages: [{ type: 'info', message: 'Job started', timestamp: '2024-01-01T00:00:00.000Z' }],
 *   warningMessages: [],
 *   errorMessages: []
 * }
 */

export interface JobMessage {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string; // ISO
}

export interface JobInfo {
  id: string;
  feature: string;
  author: string; // admin email
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-1 range
  startTime: string; // ISO
  endTime?: string; // ISO, set when job completes or fails
  lastActivityTime: string; // ISO, last time the job was updated
  infoMessages: Array<JobMessage>;
  warningMessages: Array<JobMessage>;
  errorMessages: Array<JobMessage>;
}
