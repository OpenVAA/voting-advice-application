import { REGISTRATION_LINK_PLACEHOLDER } from './utils/emailPlaceholders';
import { sendToAll } from './utils/sendToAll';
import type { Core } from '@strapi/strapi';
import type { SendEmailResult } from './email.type';

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    /**
     * Send an email to one one or more candidates by their `documentId`.
     * @param candidateId - The documentId of the candidate.
     * @param subject - The email subject.
     * @param content - The email content with a possible `{LINK}` placeholder for the registration key.
     * @param requireRegistrationKey - If `true`, fails if any of the candidates do not have a registration key or `content` does not contain the `{LINK}` placeholder.
     * @returns A `SendEmailResult` with the number of emails in `sent` or failure `cause`.
     */
    sendEmail: async ({
      candidateId,
      subject,
      content,
      requireRegistrationKey,
    }: {
      candidateId: string | Array<string>;
      subject: string;
      content: string;
      requireRegistrationKey?: boolean;
    }): Promise<SendEmailResult> => {
      if (requireRegistrationKey && content.indexOf(REGISTRATION_LINK_PLACEHOLDER) === -1)
        return {
          type: 'failure',
          cause: `The content has not ${REGISTRATION_LINK_PLACEHOLDER} placeholder`,
        };
      const candidates = await strapi.documents('api::candidate.candidate').findMany({
        filters: {
          documentId: {
            $in: [candidateId].flat(),
          },
        },
        fields: ['registrationKey', 'email'],
      });
      if (requireRegistrationKey) {
        const missingRegistrationKeys = candidates.filter((c) => c.registrationKey == null);
        if (missingRegistrationKeys.length > 0) {
          return {
            type: 'failure',
            cause: `Missing registration key for candidates: ${missingRegistrationKeys.map((c) => c.email).join(', ')}`,
          };
        }
      }
      return sendToAll({ content, subject, candidates });
    },

    /**
     * Send a registration email to all unregistered candidates.
     * NB! Does not currently check whether the candidates have a registration key.
     * @returns A `SendEmailResult` with the number of emails in `sent` or failure `cause`.
     */
    sendEmailToUnregistered: async ({
      subject,
      content,
    }: {
      subject: string;
      content: string;
    }): Promise<SendEmailResult> => {
      const unregisteredCandidates = await strapi.documents('api::candidate.candidate').findMany({
        fields: ['registrationKey', 'email'],
        filters: {
          user: {
            id: {
              $null: true,
            },
          },
        },
      });
      return sendToAll({ content, subject, candidates: unregisteredCandidates });
    },
  };
}
