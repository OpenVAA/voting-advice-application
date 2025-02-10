import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';
import type { Core } from '@strapi/strapi';

// TODO: Remove when Answers are deprecated

export default async function ownedByCandidate(
  { request, state }: StrapiContext,
  config: unknown,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> {
  const userId = state?.user?.id;

  // Accessing without a valid user session should always fail as we can't enforce this check otherwise
  if (!userId) {
    warn('[global:filter-by-candidate] triggered because there was no userId by', { request, state });
    return false;
  }

  const candidate = (
    await strapi.documents('api::candidate.candidate').findMany({
      populate: ['user'],
      where: {
        user: { id: userId }
      }
    })
  )[0];

  if (!candidate) {
    warn('[global:filter-by-candidate] triggered because there was no candidate by', { request, state });
    return false;
  }

  // Enforce that any creation/update enforces the candidate to be themself
  if (request.body?.data) request.body.data.candidate = candidate.documentId;

  return true;
}
