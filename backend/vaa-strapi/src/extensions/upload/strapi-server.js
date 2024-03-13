'use strict';

module.exports = async (plugin) => {
  // Enforce ACL on the destroy endpoint so that only candidate can delete their own photo
  for (const route of plugin.routes['content-api'].routes) {
    if (route.method !== 'DELETE' || route.path !== '/files/:id') continue;

    route.config = {
      policies: [
        // Allow only deleting candidate's own resource
        async (ctx, config, {strapi}) => {
          // TODO: we need a proper way to confirm who the photo belongs to before allowing this, otherwise we could
          // have another candidate set someone else's photo as their own, and then they would be able to delete
          // someone else's image as a result.

          return false;
        }
      ]
    };
  }

  return plugin;
};
