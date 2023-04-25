/**
 * This policy context allows us to hide draft posts from Strapi REST API,
 * as Strapi does not provide this functionality and allows for drafts to be
 * visible through REST calls.
 */
export default async (policyContext, config, {strapi}) => {
  let allowRequest = true;

  const handler = policyContext.state.route.handler;
  const handlerSplit = handler.split('.');
  const route = handlerSplit.slice(0, -1).join('.');
  const handlerFunction = handlerSplit.slice(-1)[0];

  switch (handlerFunction) {
    case 'findOne':
      allowRequest = await strapi.db
        .query(route)
        .findOne({
          select: ['publishedAt'],
          where: {id: policyContext.params.id}
        })
        .then((result) => {
          if (result) {
            if (!result.publishedAt) {
              console.warn('Result is unpublished, we should not allow this.');
              return false;
            }
            return true;
          } else {
            // If no result is found, also return 403 to prevent scraping of potential draft ids
            return false;
          }
        })
        .catch((error) => {
          console.error(
            'There was an query error while trying to get post publishing status',
            error
          );
          return false;
        });
      break;
    default:
      console.error('Unrecognised requested function while checking drafts policy.');
  }
  return allowRequest; // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
};
