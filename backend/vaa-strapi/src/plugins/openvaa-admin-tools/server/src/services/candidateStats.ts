import type { Core } from '@strapi/strapi';
import type { CandidateStatRow, CandidateStatsResult } from './candidateStats.type';

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    getStats: async (): Promise<CandidateStatsResult> => {
      // 1. Get all opinion question-categories
      const categories = await strapi.documents('api::question-category.question-category').findMany({
        filters: { type: 'opinion' },
        populate: { questions: true },
      });

      // 2. Collect all opinion question documentIds
      const opinionQuestionIds = new Set<string>();
      for (const cat of categories) {
        if (cat.questions) {
          for (const q of cat.questions) {
            opinionQuestionIds.add(q.documentId);
          }
        }
      }

      // 3. Query all candidates with user and nominations
      const candidates = await strapi.documents('api::candidate.candidate').findMany({
        populate: {
          user: true,
          nominations: {
            populate: {
              party: true,
              constituency: true,
            },
          },
        },
        limit: -1,
      });

      // 4. Classify candidates into 3 groups
      const notRegistered: Array<CandidateStatRow> = [];
      const registeredNotAnswered: Array<CandidateStatRow> = [];
      const answeredAll: Array<CandidateStatRow> = [];

      for (const candidate of candidates) {
        const row = buildRow(candidate);

        if (!candidate.user) {
          notRegistered.push(row);
          continue;
        }

        // Check if all opinion questions are answered
        const answers = (candidate.answers ?? {}) as Record<string, unknown>;
        const answeredKeys = new Set(Object.keys(answers));
        const allAnswered =
          opinionQuestionIds.size > 0 &&
          [...opinionQuestionIds].every((qId) => answeredKeys.has(qId));

        if (allAnswered) {
          answeredAll.push(row);
        } else {
          registeredNotAnswered.push(row);
        }
      }

      return {
        type: 'success',
        totalCount: candidates.length,
        notRegistered: { count: notRegistered.length, rows: notRegistered },
        registeredNotAnswered: { count: registeredNotAnswered.length, rows: registeredNotAnswered },
        answeredAll: { count: answeredAll.length, rows: answeredAll },
      };
    },
  };
}

function buildRow(candidate: Record<string, unknown>): CandidateStatRow {
  const nominations = (candidate.nominations ?? []) as Array<Record<string, unknown>>;
  const firstNomination = nominations[0];
  const party = (firstNomination?.party ?? {}) as Record<string, unknown>;
  const constituency = (firstNomination?.constituency ?? {}) as Record<string, unknown>;

  return {
    email: (candidate.email as string) ?? '',
    firstName: (candidate.firstName as string) ?? '',
    lastName: (candidate.lastName as string) ?? '',
    registrationKey: (candidate.registrationKey as string) ?? '',
    partyExternalId: (party.externalId as string) ?? '',
    constituencyExternalId: (constituency.externalId as string) ?? '',
  };
}
