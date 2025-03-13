export default {
  routes: [
    {
      method: 'POST',
      path: '/argument-condensation/condense',
      handler: 'argument-condensation.condense',
      config: {
        policies: [],
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/argument-condensation/test',
      handler: 'argument-condensation.test',
      config: {
        policies: [],
        middlewares: [],
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/argument-condensation/test-answers',
      handler: 'argument-condensation.testAnswers',
      config: {
        policies: [],
        auth: false
      }
    }
  ]
};
