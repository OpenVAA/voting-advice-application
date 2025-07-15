import type { ActionResult } from './actionResult.type';

export interface SendEmailResult extends ActionResult {
  /**
   * The number of emails sent successfully.
   */
  sent?: number;
  /**
   * The email addresses that failed to send.
   */
  errors?: Array<{ email: string; error?: string }>;
}
