/**
 * @file emailBucket fixture.
 *
 * Self-contained Mailpit (Inbucket) access for E2E tests. Talks directly to the Mailpit REST API (port 54324, started by `supabase start`) — it owns its own HTTP plumbing and does not depend on any other email module. Sibling to the other candidate fixtures (contestantLoginPage.fixture.ts, etc.); composed in `contestant-journey.ts`.
 *
 * Surface:
 *  - expectEmail(subject)              → polls Mailpit until a message with
 *                                        matching Subject arrives (15s timeout, [1000, 2000, 3000] retry intervals).
 *  - getEmail(subjectOrNth)            → string → the whole Subject; RegExp → a pattern over it;
 *                                        number → 0-indexed nth latest email.
 *  - getLinksInEmail(subjectOrNth)     → array of href values (cheerio-parsed
 *                                        anchors from the email HTML).
 *  - listSubjects()                    → the subject of every mail the recipient has right now, read once; throws when Mailpit cannot be read.
 *
 * A link the `account-access` function mails, for a sign-in or for a password recovery, is already the application's callback URL. A spec opens it as received, through `utils/mailedLink`; nothing here builds or rewrites a link.
 *
 * **Rigidity contract**:
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { load } from 'cheerio';
import type { Page } from '@playwright/test';

/**
 * URL of the Mailpit REST API (Inbucket), started by `supabase start`.
 */
const MAILPIT_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';

/**
 * Polling timeout (ms) for expectEmail / getEmail / getLinksInEmail.
 */
const POLL_TIMEOUT = 15_000;

/**
 * Polling intervals (ms).
 */
const POLL_INTERVALS = [1000, 2000, 3000];

/**
 * Shape of a Mailpit message summary (from /api/v1/search).
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
 * Shape of a full Mailpit message (from /api/v1/message/<id>).
 */
interface MailpitMessage extends MailpitMessageSummary {
  HTML: string;
  Text: string;
}

/**
 * Test-facing record returned by getEmail. Exposes the canonical Mailpit fields plus the HTML body for downstream parsing.
 */
export interface EmailRecord {
  id: string;
  subject: string;
  from: string;
  to: Array<string>;
  html: string;
  text: string;
  created: string;
}

async function fetchEmailsForRecipient(recipientEmail: string): Promise<Array<MailpitMessageSummary>> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(recipientEmail)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { total: number; messages: Array<MailpitMessageSummary> };
  return data.messages ?? [];
}

/**
 * The recipient's messages as Mailpit holds them right now, or an error.
 *
 * The strict counterpart of {@link fetchEmailsForRecipient}, for a caller that concludes something from a mail's ABSENCE: that helper answers a failed read with an empty list, which would let "no mail" pass while the catcher is unreachable.
 *
 * @throws Error naming the status when Mailpit does not answer the search.
 */
async function fetchEmailsForRecipientOrThrow(recipientEmail: string): Promise<Array<MailpitMessageSummary>> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(recipientEmail)}`);
  if (!response.ok) {
    throw new Error(
      `emailBucket: the mail catcher answered status ${response.status} to a search for ${recipientEmail}`
    );
  }
  const data = (await response.json()) as { messages?: Array<MailpitMessageSummary> };
  return data.messages ?? [];
}

async function fetchFullMessage(id: string): Promise<MailpitMessage | undefined> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!response.ok) return undefined;
  return (await response.json()) as MailpitMessage;
}

/**
 * Whether a message's subject is the one asked for: a string is the whole subject, a RegExp is a pattern over it.
 */
function matchSubject(summary: MailpitMessageSummary, subject: string | RegExp): boolean {
  if (subject instanceof RegExp) return subject.test(summary.Subject);
  return summary.Subject === subject;
}

function toEmailRecord(message: MailpitMessage): EmailRecord {
  return {
    id: message.ID,
    subject: message.Subject,
    from: message.From.Address,
    to: message.To.map((t) => t.Address),
    html: message.HTML,
    text: message.Text,
    created: message.Created
  };
}

/**
 * Create an emailBucket fixture bound to a specific recipient address.
 *
 * @param _page Playwright Page (unused — emailBucket talks to Mailpit REST,
 *              not to the browser — but accepted for fixture-factory parity).
 *              `null` from a caller that drives no page.
 * @param recipientEmail The recipient address to filter Mailpit by.
 */
export function createEmailBucket(_page: Page | null, recipientEmail: string) {
  return {
    /**
     * The subject of every mail Mailpit holds for the recipient right now, newest first. Reads once and does not wait.
     *
     * For an assertion about how many mails there are, none included. Such an assertion is sound only once the sender is known to have finished; this method knows nothing about that.
     *
     * @throws Error when Mailpit cannot be read: an unreadable catcher is never taken for an empty one.
     */
    async listSubjects(): Promise<Array<string>> {
      return (await fetchEmailsForRecipientOrThrow(recipientEmail)).map((message) => message.Subject);
    },

    /**
     * Wait until at least one email with a matching subject arrives in the recipient's Mailpit queue. Polls via `expect.poll` with the canonical [1000, 2000, 3000] retry intervals (15s timeout).
     */
    async expectEmail(subject: string | RegExp): Promise<void> {
      await expect
        .poll(
          async () => {
            const emails = await fetchEmailsForRecipient(recipientEmail);
            return emails.some((e) => matchSubject(e, subject));
          },
          {
            message: `Waiting for email with subject matching ${subject} for ${recipientEmail}`,
            timeout: POLL_TIMEOUT,
            intervals: POLL_INTERVALS
          }
        )
        .toBe(true);
    },

    /**
     * Retrieve a single email by subject match (string / RegExp) OR by 0-indexed nth latest position (number). Polls until the target email exists.
     *
     * Polymorphic-overload dispatch:
     *  - string | RegExp → subject match, a string being the whole subject (returns the newest matching).
     *  - number          → nth latest (Mailpit returns newest-first).
     */
    async getEmail(subjectOrNth: string | RegExp | number): Promise<EmailRecord> {
      let chosen: MailpitMessageSummary | undefined;
      await expect
        .poll(
          async () => {
            const emails = await fetchEmailsForRecipient(recipientEmail);
            if (typeof subjectOrNth === 'number') {
              chosen = emails[subjectOrNth];
            } else {
              chosen = emails.find((e) => matchSubject(e, subjectOrNth));
            }
            return Boolean(chosen);
          },
          {
            message: `Waiting for email ${
              typeof subjectOrNth === 'number' ? `at nth=${subjectOrNth}` : `with subject matching ${subjectOrNth}`
            } for ${recipientEmail}`,
            timeout: POLL_TIMEOUT,
            intervals: POLL_INTERVALS
          }
        )
        .toBe(true);
      // chosen is guaranteed defined by the poll above.
      const summary = chosen as MailpitMessageSummary;
      const full = await fetchFullMessage(summary.ID);
      expect(full, `Failed to fetch full message body for ${summary.ID}`).toBeDefined();
      return toEmailRecord(full as MailpitMessage);
    },

    /**
     * Retrieve all anchor hrefs from a target email's HTML body. Polymorphic dispatch identical to getEmail (string/RegExp → subject match; number → nth latest).
     */
    async getLinksInEmail(subjectOrNth: string | RegExp | number): Promise<Array<string>> {
      const email = await this.getEmail(subjectOrNth);
      const $ = load(email.html);
      const hrefs: Array<string> = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) hrefs.push(href);
      });
      return hrefs;
    }
  };
}

export type EmailBucketFixture = ReturnType<typeof createEmailBucket>;
