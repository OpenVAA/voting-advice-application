import crypto from 'crypto';
import type { Core } from '@strapi/strapi';
import type {
  AddCandidateInput,
  AddCandidateResult,
  FormOptionItem,
  FormOptionsResult,
} from './addCandidate.type';

if (!process.env.PUBLIC_BROWSER_FRONTEND_URL)
  throw new Error('Missing PUBLIC_BROWSER_FRONTEND_URL environment variable');

/**
 * Get the first available locale value from a localized JSON name field.
 */
function getLocalizedName(name: unknown): string {
  if (!name || typeof name !== 'object') return '';
  const values = Object.values(name as Record<string, string>);
  return values[0] ?? '';
}

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    /**
     * Fetch parties, constituencies, and the election for the add candidate form.
     */
    getFormOptions: async (): Promise<FormOptionsResult> => {
      try {
        const [parties, constituencies, elections] = await Promise.all([
          strapi.documents('api::party.party').findMany({ fields: ['name', 'externalId'] }),
          strapi
            .documents('api::constituency.constituency')
            .findMany({ fields: ['name', 'externalId'] }),
          strapi.documents('api::election.election').findMany({ fields: ['name', 'externalId'] }),
        ]);

        function mapItem(item: Record<string, unknown> & { documentId: string }): FormOptionItem {
          return {
            documentId: item.documentId,
            name: getLocalizedName(item.name),
            externalId: (item.externalId as string) ?? '',
          };
        }

        return {
          type: 'success',
          formOptions: {
            parties: parties.map(mapItem),
            constituencies: constituencies.map(mapItem),
            election: elections.length > 0 ? mapItem(elections[0]) : null,
          },
        };
      } catch (error) {
        strapi.log.error('addCandidate.getFormOptions error', error);
        return { type: 'failure', cause: 'Failed to fetch form options' };
      }
    },

    /**
     * Create a candidate and nomination using the import data service.
     */
    addCandidate: async (input: AddCandidateInput): Promise<AddCandidateResult> => {
      const { firstName, lastName, email, partyExternalId, constituencyExternalId } = input;

      if (!firstName || !lastName || !email || !partyExternalId || !constituencyExternalId) {
        return { type: 'failure', cause: 'All fields are required' };
      }

      // Find the election to get its externalId
      const elections = await strapi
        .documents('api::election.election')
        .findMany({ fields: ['externalId'] });
      if (elections.length === 0) {
        return { type: 'failure', cause: 'No election found' };
      }
      const electionExternalId = (elections[0] as Record<string, unknown>).externalId as
        | string
        | undefined;
      if (!electionExternalId) {
        return { type: 'failure', cause: 'Election has no externalId' };
      }

      const suffix = crypto.randomUUID().slice(0, 8);
      const candidateExternalId = `ADMIN-CA-${suffix}`;
      const nominationExternalId = `ADMIN-NOM-${suffix}`;
      const registrationKey = crypto.randomUUID();

      const importData = {
        candidates: [
          {
            externalId: candidateExternalId,
            firstName,
            lastName,
            email,
            registrationKey,
          },
        ],
        nominations: [
          {
            externalId: nominationExternalId,
            election: { externalId: electionExternalId },
            constituency: { externalId: constituencyExternalId },
            party: { externalId: partyExternalId },
            candidate: { externalId: candidateExternalId },
          },
        ],
      };

      const importResult = await strapi
        .plugin('openvaa-admin-tools')
        .service('data')
        .import(importData);

      if (importResult.type !== 'success') {
        return { type: 'failure', cause: importResult.cause ?? 'Import failed' };
      }

      // Build registration URL
      const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL!);
      url.pathname = '/candidate/register';
      url.searchParams.append('registrationKey', registrationKey);

      return { type: 'success', registrationUrl: url.toString() };
    },
  };
}
