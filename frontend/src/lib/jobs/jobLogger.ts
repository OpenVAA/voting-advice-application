/**
 * Custom logger that integrates with the job store via API calls
 * This logger can be passed to features to automatically update job progress and messages
 */

import { DefaultLogger } from '@openvaa/core';
import type { Logger } from '@openvaa/core';

export class JobLogger implements Logger {
  private jobId: string;
  private defaultLogger: DefaultLogger;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.defaultLogger = new DefaultLogger();
  }

  /**
   * Update job progress (0-1 range)
   */
  async progress(value: number): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: value })
      });
    } catch (error) {
      console.error('Failed to update job progress:', error);
    }
    // Also log to console for debugging
    this.defaultLogger.progress(value);
  }

  /**
   * Add info message to job
   */
  async info(message: string): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'info', message })
      });
    } catch (error) {
      console.error('Failed to add info message:', error);
    }
    // Also log to console for debugging
    this.defaultLogger.info(message);
  }

  /**
   * Add warning message to job
   */
  async warning(message: string): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'warning', message })
      });
    } catch (error) {
      console.error('Failed to add warning message:', error);
    }
    // Also log to console for debugging
    this.defaultLogger.warning(message);
  }

  /**
   * Add error message to job
   */
  async error(message: string): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'error', message })
      });
    } catch (error) {
      console.error('Failed to add error message:', error);
    }
    // Also log to console for debugging
    this.defaultLogger.error(message);
  }

  /**
   * Mark job as completed
   */
  async complete(): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  }

  /**
   * Mark job as failed
   */
  async fail(errorMessage?: string): Promise<void> {
    try {
      await fetch(`/api/admin/jobs/${this.jobId}/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorMessage })
      });
    } catch (error) {
      console.error('Failed to fail job:', error);
    }
  }
}
