export default {
  async compute(ctx) {
    try {
      const { electionId } = ctx.params;

      const factorLoading = await strapi
        .service('api::factor-loading.factor-loading')
        .computeAndStoreFactors(electionId);

      return { data: factorLoading };
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
