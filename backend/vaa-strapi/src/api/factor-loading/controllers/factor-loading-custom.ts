export default {
  async compute(ctx) {
    try {
      const { electionId } = ctx.params;

      if (electionId) {
        // Single election case
        const factorLoading = await strapi
          .service('api::factor-loading.factor-loading')
          .computeAndStoreFactors(parseInt(electionId));
        return { data: factorLoading };
      } else {
        // All elections case
        const elections = await strapi.entityService.findMany(
          'api::election.election',
          {
            fields: ['id']
          }
        );

        const results = [];
        const errors = [];

        // Process each election
        for (const election of elections) {
          try {
            const factorLoading = await strapi
              .service('api::factor-loading.factor-loading')
              .computeAndStoreFactors(election.id);
            results.push({
              electionId: election.id,
              success: true,
              data: factorLoading
            });
          } catch (error) {
            console.error(`Error processing election ${election.id}:`, error);
            errors.push({
              electionId: election.id,
              error: error.message
            });
          }
        }

        return {
          data: {
            successful: results,
            failed: errors,
            summary: {
              total: elections.length,
              successful: results.length,
              failed: errors.length
            }
          }
        };
      }
    } catch (error) {
      if (error.message === 'Election not found') {
        return ctx.notFound(error.message);
      }
      if (
        error.message.includes('Factor analysis already exists') ||
        error.message.includes('Insufficient responses') ||
        error.message.includes('No answers found')
      ) {
        return ctx.badRequest(error.message);
      }
      return ctx.throw(500, error.message);
    }
  }
};
