import { Strapi } from '@strapi/strapi';
import { StrapiContext } from '../util/acl.type';

export default async (ctx: StrapiContext, config: unknown, { strapi }: { strapi: Strapi }): Promise<boolean> => {
  // Accessing without a valid user session should always fail as we can't enforce this check otherwise
  if (!ctx.state.user) return false;

  const candidate = await strapi.query('api::candidate.candidate').findOne({
    where: { user: { id: ctx.state.user.id } }
  });
  if (!candidate) return false;

  // Enforce that any creation/update enforces the candidate to be ourselves
  if (ctx.request.body?.data) ctx.request.body.data.candidate = candidate.id;

  return true;
};
