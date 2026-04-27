/**
 * Email helper utilities for E2E tests using Mailpit REST API.
 *
 * Fetches emails from Mailpit (started by `supabase start` on port 54324),
 * and extracts links with cheerio.
 *
 * Requires Supabase local dev stack to be running (Mailpit on port 54324).
 */

import { load } from 'cheerio';

/**
 * URL of the Mailpit REST API.
 */
const MAILPIT_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';

/**
 * Shape of a message in the Mailpit search/list response.
 */
interface MailpitMessageSummary {
  ID: string;
  MessageID: string;
  From: { Name: string; Address: string };
  To: Array<{ Name: string; Address: string }>;
  Subject: string;
  Created: string;
  Size: number;
  Read: boolean;
}

/**
 * Shape of a full Mailpit message.
 */
interface MailpitMessage extends MailpitMessageSummary {
  HTML: string;
  Text: string;
}

/**
 * Fetch all message summaries for a recipient.
 *
 * @param recipientEmail - The email address to search for
 * @returns Array of message summaries, sorted by Created date (newest first)
 */
export async function fetchEmails(recipientEmail: string): Promise<MailpitMessageSummary[]> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(recipientEmail)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { total: number; messages: MailpitMessageSummary[] };
  return data.messages ?? [];
}

/**
 * Get the HTML content of the latest email sent to a specific recipient.
 *
 * @param recipientEmail - The email address to search for
 * @param skipCount - Number of most-recent emails to skip (for skipping stale emails from previous runs)
 * @returns The HTML content of the target email, or undefined if not found
 */
export async function getLatestEmailHtml(
  recipientEmail: string,
  skipCount = 0
): Promise<string | undefined> {
  const messages = await fetchEmails(recipientEmail);
  if (messages.length <= skipCount) return undefined;

  // Mailpit returns messages newest-first. The newest email that wasn't
  // in the mailbox before (i.e., not in the skipCount batch) is at index 0.
  const target = messages[0];
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${target.ID}`);
  if (!response.ok) return undefined;

  const message = (await response.json()) as MailpitMessage;
  return message.HTML || undefined;
}

/**
 * Extract the first link from an HTML string.
 *
 * @param html - The HTML content to search
 * @returns The href of the first anchor tag, or undefined if none found
 */
export function extractLinkFromHtml(html: string): string | undefined {
  const $ = load(html);
  return $('a').first().attr('href') ?? undefined;
}

/**
 * Get the registration/reset link from the latest email sent to a recipient.
 *
 * Combines fetchEmails, getLatestEmailHtml, and extractLinkFromHtml into a
 * single convenience function with descriptive error messages.
 *
 * @param recipientEmail - The email address to search for
 * @returns The registration/reset link URL
 * @throws Error if no email found for recipient or no link found in email
 */
export async function getRegistrationLink(recipientEmail: string): Promise<string> {
  const html = await getLatestEmailHtml(recipientEmail);
  if (!html) {
    throw new Error(
      `No email found for recipient "${recipientEmail}". ` +
        'Ensure the email was sent and Mailpit is running (supabase start).'
    );
  }

  const link = extractLinkFromHtml(html);
  if (!link) {
    throw new Error(
      `No link found in email for "${recipientEmail}". ` +
        `Email HTML content: ${html.substring(0, 200)}...`
    );
  }

  return link;
}

/**
 * Transform a Supabase Auth verify link into a direct auth callback URL.
 *
 * The Supabase invite/recovery email contains a link to the Auth verify endpoint
 * which then redirects to the frontend. This function extracts the token from
 * the verify link and constructs a direct URL to the frontend's auth callback,
 * bypassing the Supabase redirect (which may not have the correct redirect_to).
 *
 * @param verifyLink - The link from the Supabase email (e.g., http://...54321/auth/v1/verify?token=...&type=invite)
 * @param callbackPath - The frontend auth callback path (default: /en/candidate/auth/callback)
 * @returns A URL pointing directly to the frontend callback with token_hash and type params
 */
export function toCallbackUrl(verifyLink: string, callbackPath = '/en/candidate/auth/callback'): string {
  const url = new URL(verifyLink.replace(/&amp;/g, '&'));
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type') ?? 'invite';
  const frontendPort = process.env.FRONTEND_PORT ?? '5173';
  const frontendUrl = `http://localhost:${frontendPort}`;
  return `${frontendUrl}${callbackPath}?token_hash=${token}&type=${type}`;
}

/**
 * Count the number of emails in a recipient's mailbox.
 *
 * @param recipientEmail - The email address to count emails for
 * @returns Number of emails in the mailbox
 */
export async function countEmailsForRecipient(recipientEmail: string): Promise<number> {
  const messages = await fetchEmails(recipientEmail);
  return messages.length;
}

/**
 * Purge all emails from a recipient's mailbox.
 * Note: Mailpit doesn't support per-mailbox purging — this deletes all messages.
 *
 * @param recipientEmail - The email address whose mailbox to purge (unused — deletes all)
 */
export async function purgeMailbox(_recipientEmail: string): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}
