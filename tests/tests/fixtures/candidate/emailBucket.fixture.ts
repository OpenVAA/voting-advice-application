/**
 * @file emailBucket fixture — Phase 89 Plan 02 (TIR4:58-63 + D-89-05).
 *
 * Function-fixture wrapping the existing emailHelper.ts Mailpit utilities.
 * Sibling to other candidate-fixtures (candidateLoginPage.fixture.ts, etc.);
 * composed in `candidate-mega.ts`.
 *
 * D-89-05: this fixture WRAPS emailHelper.ts — it does NOT re-author the
 * Mailpit HTTP plumbing. emailHelper.ts STAYS in place for legacy specs.
 *
 * Surface (TIR4:60-63 verbatim signatures):
 *  - expectEmail(subject)              → polls Mailpit until a message with
 *                                        matching Subject arrives (15s timeout,
 *                                        [1000, 2000, 3000] retry intervals per
 *                                        candidate-registration.spec.ts:97-103).
 *  - getEmail(subjectOrNth)            → string/RegExp → match by Subject;
 *                                        number → 0-indexed nth latest email.
 *  - getLinksInEmail(subjectOrNth)     → array of href values (cheerio-parsed
 *                                        anchors from the email HTML).
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 *
 * SIBLING (not replacement) to emailHelper.ts. The two coexist until
 * emailHelper.ts is retired post-89-LAST (v2.10 close or v2.11+).
 */

import { expect } from '@playwright/test';
import { load } from 'cheerio';
import type { Page } from '@playwright/test';

/**
 * URL of the Mailpit REST API. Mirrors emailHelper.ts:15.
 */
const MAILPIT_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';

/**
 * Polling timeout (ms) for expectEmail / getEmail / getLinksInEmail. Matches
 * the candidate-registration.spec.ts:97-103 precedent.
 */
const POLL_TIMEOUT = 15_000;

/**
 * Polling intervals (ms) — matches candidate-registration.spec.ts:97-103.
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
 * Test-facing record returned by getEmail. Exposes the canonical Mailpit
 * fields plus the HTML body for downstream parsing.
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

async function fetchFullMessage(id: string): Promise<MailpitMessage | undefined> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!response.ok) return undefined;
  return (await response.json()) as MailpitMessage;
}

function matchSubject(summary: MailpitMessageSummary, subject: string | RegExp): boolean {
  if (subject instanceof RegExp) return subject.test(summary.Subject);
  return summary.Subject.includes(subject);
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
 * @param recipientEmail The recipient address to filter Mailpit by.
 */
export function createEmailBucket(_page: Page, recipientEmail: string) {
  return {
    /**
     * Wait until at least one email with a matching subject arrives in the
     * recipient's Mailpit queue. Polls via `expect.poll` with the canonical
     * [1000, 2000, 3000] retry intervals (15s timeout).
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
     * Retrieve a single email by subject match (string / RegExp) OR by
     * 0-indexed nth latest position (number). Polls until the target email
     * exists.
     *
     * Polymorphic-overload dispatch per TIR4:62-63 "EXACTLY these signatures":
     *  - string | RegExp → subject match (returns the newest matching).
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
              typeof subjectOrNth === 'number'
                ? `at nth=${subjectOrNth}`
                : `with subject matching ${subjectOrNth}`
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
     * Retrieve all anchor hrefs from a target email's HTML body. Polymorphic
     * dispatch identical to getEmail (string/RegExp → subject match; number
     * → nth latest).
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
