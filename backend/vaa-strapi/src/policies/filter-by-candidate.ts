import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';
import type { Core } from '@strapi/strapi';

export default async (ctx: StrapiContext, config: unknown, { strapi }: { strapi: Core.Strapi }): Promise<boolean> => {
  // Accessing without a valid user session should always fail as we can't enforce this check otherwise
  if (!ctx.state.user) return false;

  const candidate = (
    await strapi.documents('api::candidate.candidate').findMany({
      populate: ['user'],
      where: { user: { id: ctx.state.user.id } }
    })
  )[0];
  if (!candidate) {
    warn('[global:filter-by-candidate] triggered by', ctx.request);
    return false;
  }

  // Enforce that only the models belonging to the candidate are returned
  ctx.request.query.filters = {
    ...(ctx.request.query.filters || {}),
    candidate: { documentId: { $eq: candidate.documentId } }
  };

  return true;
};
