import type { Core } from '@strapi/strapi';

module.exports = async (plugin: Core.Plugin) => {
  // Enforce ACL on the destroy endpoint so that only candidate can delete their own photo
  for (const route of plugin.routes['content-api'].routes) {
    if (route.method !== 'DELETE' || route.path !== '/files/:id') continue;

    route.config = {
      policies: [
        // TODO: Write a policy that only allows a Candidate to delete their own photo using `refId` but then we need to also add that when uploading and figure out how to use the Candidate’s `documentId`
        // See: https://docs.strapi.io/dev-docs/plugins/upload#upload-entry-files
        'global::forbidden'
      ]
    };
  }

  return plugin;
};
