/**
 * Email helper utilities for E2E tests using Inbucket REST API.
 *
 * Fetches emails from Inbucket's mailbox endpoint (started by `supabase start`),
 * and extracts links with cheerio. No MIME parsing needed -- Inbucket returns
 * pre-parsed HTML bodies.
 *
 * Requires Supabase local dev stack to be running (Inbucket on port 54324).
 */

import { load } from 'cheerio';

/**
 * URL of the Inbucket REST API.
 */
const INBUCKET_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';

/**
 * Extract the mailbox name (local part) from an email address.
 */
function getMailboxName(email: string): string {
  return email.split('@')[0];
}

/**
 * Shape of a message header in the Inbucket mailbox listing.
 */
interface InbucketMessageHeader {
  mailbox: string;
  id: string;
  from: string;
  subject: string;
  date: string;
  size: number;
}

/**
 * Shape of a full Inbucket message (with parsed body).
 */
interface InbucketMessage extends InbucketMessageHeader {
  body: { text: string; html: string };
}

/**
 * Fetch all message headers for a recipient's mailbox.
 *
 * @param recipientEmail - The email address whose mailbox to list
 * @returns Array of message headers, or empty array if mailbox is empty/not found
 */
export async function fetchEmails(recipientEmail: string): Promise<InbucketMessageHeader[]> {
  const mailbox = getMailboxName(recipientEmail);
  const response = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`);
  if (!response.ok) return [];
  return (await response.json()) as InbucketMessageHeader[];
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

  // Get the target message: latest minus skip
  const target = messages[messages.length - 1 - skipCount];
  const mailbox = getMailboxName(recipientEmail);
  const response = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}/${target.id}`);
  if (!response.ok) return undefined;

  const message = (await response.json()) as InbucketMessage;
  return message.body?.html ?? undefined;
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
        'Ensure the email was sent and Inbucket is running (supabase start).'
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
 *
 * @param recipientEmail - The email address whose mailbox to purge
 */
export async function purgeMailbox(recipientEmail: string): Promise<void> {
  const mailbox = getMailboxName(recipientEmail);
  await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`, { method: 'DELETE' });
}
