/**
 * Email helper utilities for E2E tests using LocalStack SES.
 *
 * Fetches emails from LocalStack's internal SES mailbox endpoint,
 * parses them with mailparser, and extracts links with cheerio.
 *
 * Requires LocalStack to be running (via `yarn dev` docker stack).
 */

import { load } from 'cheerio';
import { simpleParser } from 'mailparser';
import { request } from '@playwright/test';

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
 * @returns The HTML content of the matching email, or undefined if not found
 */
export async function getLatestEmailHtml(recipientEmail: string): Promise<string | undefined> {
  const emails = await fetchEmails();

  // Iterate in reverse to get the latest email first
  for (let i = emails.length - 1; i >= 0; i--) {
    const email = emails[i];
    const parsed = await simpleParser(email.RawData);

    // Check parsed 'to' addresses
    if (parsed.to) {
      const toAddresses = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
      for (const addr of toAddresses) {
        if ('value' in addr) {
          const match = addr.value.some(
            (v) => v.address?.toLowerCase() === recipientEmail.toLowerCase()
          );
          if (match) {
            return parsed.textAsHtml || parsed.html || undefined;
          }
        }
      }
    }

    // Fallback: check RawData for the recipient string
    if (email.RawData.toLowerCase().includes(recipientEmail.toLowerCase())) {
      return parsed.textAsHtml || parsed.html || undefined;
    }
  }

  return undefined;
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
        'Ensure the email was sent and LocalStack SES is running.'
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
