'use strict';

module.exports = async (plugin) => {
  // Enforce ACL on the destroy endpoint so that only candidate can delete their own photo
  for (const route of plugin.routes['content-api'].routes) {
    if (route.method !== 'DELETE' || route.path !== '/files/:id') continue;

    route.config = {
      policies: [
        // Allow only deleting candidate's own resource
        async (ctx, config, {strapi}) => {
          const {id} = ctx.params;

          const candidate = await strapi.query('api::candidate.candidate').findOne({
            where: {user: {id: ctx.state.user.id}, photo: {id}}
          });

          return !!candidate;
        }
      ]
    };
  }

  return plugin;
};
