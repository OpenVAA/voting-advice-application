export default async (ctx, config, {strapi}) => {
  // Accessing without a valid user session should always fail as we can't enforce this check otherwise
  if (!ctx.state.user) return false;

  const candidate = await strapi.query('api::candidate.candidate').findOne({
    where: {user: {id: ctx.state.user.id}}
  });

  // Enforce that any creation/update enforces the candidate to be ourselves
  if (ctx.request.body?.data) ctx.request.body.data.candidate = candidate.id;

  return true;
};
