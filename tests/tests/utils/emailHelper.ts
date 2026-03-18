/**
 * Email helper utilities for E2E tests using LocalStack SES.
 *
 * Fetches emails from LocalStack's internal SES mailbox endpoint,
 * parses them with mailparser, and extracts links with cheerio.
 *
 * Requires LocalStack to be running (via `yarn dev` docker stack).
 */

import { request } from '@playwright/test';
import { load } from 'cheerio';
import { simpleParser } from 'mailparser';

/**
 * Shape of a single email in the LocalStack SES inbox.
 */
export interface SESEmail {
  Id: string;
  Region: string;
  Source: string;
  RawData: string;
  Timestamp: string;
}

/**
 * Shape of the LocalStack SES inbox response.
 */
export interface SESMailbox {
  messages: Array<SESEmail>;
}

/**
 * URL of the LocalStack SES internal inbox endpoint.
 */
const SES_INBOX_URL = `${process.env.LOCALSTACK_ENDPOINT ?? 'http://localhost:4566'}/_aws/ses`;

/**
 * Clear all emails from the LocalStack SES inbox.
 *
 * WARNING: This clears ALL emails for ALL recipients. Only call this
 * when no other tests are running that depend on SES emails.
 */
export async function clearEmails(): Promise<void> {
  const context = await request.newContext();
  try {
    await context.delete(SES_INBOX_URL);
  } finally {
    await context.dispose();
  }
}

/**
 * Count how many emails exist for a specific recipient.
 *
 * Use this before sending an email, then poll with `getLatestEmailHtml`
 * using `afterIndex` to wait for the NEW email and skip stale ones.
 *
 * @param recipientEmail - The email address to count for
 * @returns Number of existing emails for this recipient
 */
export async function countEmailsForRecipient(recipientEmail: string): Promise<number> {
  const emails = await fetchEmails();
  const lowerRecipient = recipientEmail.toLowerCase();
  return emails.filter((e) => e.RawData.toLowerCase().includes(lowerRecipient)).length;
}

/**
 * Fetch all emails from the LocalStack SES inbox.
 *
 * @returns Array of SES email messages
 */
export async function fetchEmails(): Promise<Array<SESEmail>> {
  const context = await request.newContext();
  try {
    const response = await context.get(SES_INBOX_URL);
    const body = (await response.json()) as SESMailbox;
    return body.messages;
  } finally {
    await context.dispose();
  }
}

/**
 * Get the HTML content of the latest email sent to a specific recipient.
 *
 * Iterates emails in reverse chronological order, parses each with mailparser,
 * and checks if the recipient matches (case-insensitive).
 *
 * @param recipientEmail - The email address to search for
 * @param skipCount - Number of existing emails for this recipient to skip
 *   (from oldest). Use with `countEmailsForRecipient` to only match NEW emails.
 * @returns The HTML content of the matching email, or undefined if not found
 */
export async function getLatestEmailHtml(recipientEmail: string, skipCount = 0): Promise<string | undefined> {
  const emails = await fetchEmails();
  const lowerRecipient = recipientEmail.toLowerCase();

  // Collect matching emails in chronological order, then skip the old ones
  const matchingEmails: Array<SESEmail> = [];
  for (const email of emails) {
    if (email.RawData.toLowerCase().includes(lowerRecipient)) {
      matchingEmails.push(email);
    }
  }

  // Only consider emails after skipCount (i.e., new ones)
  const newEmails = matchingEmails.slice(skipCount);
  if (newEmails.length === 0) return undefined;

  // Return the latest (last) new email
  const latest = newEmails[newEmails.length - 1];
  const parsed = await simpleParser(latest.RawData);
  return parsed.textAsHtml || parsed.html || undefined;
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
      `No email found for recipient "${recipientEmail}". ` + 'Ensure the email was sent and LocalStack SES is running.'
    );
  }

  const link = extractLinkFromHtml(html);
  if (!link) {
    throw new Error(
      `No link found in email for "${recipientEmail}". ` + `Email HTML content: ${html.substring(0, 200)}...`
    );
  }

  return link;
}
