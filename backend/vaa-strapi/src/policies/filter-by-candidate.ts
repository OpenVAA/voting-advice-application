export default async (ctx, config, {strapi}) => {
  const candidate = await strapi.query('api::candidate.candidate').findOne({
    where: {user: {id: ctx.state.user.id}}
  });

  // Enforce that only the models belonging to the candidate are returned
  ctx.request.query.filters = {
    ...(ctx.request.query.filters || {}),
    candidate: {id: {$eq: candidate.id}}
  };

  return true;
};
