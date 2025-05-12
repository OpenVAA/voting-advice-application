export default {
  routes: [
    {
      method: 'POST',
      path: '/factor-loadings/compute/:electionId?',
      handler: 'factor-loading-custom.compute',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Compute factor loadings for an election',
        tags: ['Factor Loading']
      }
    }
  ]
};
