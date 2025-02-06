export default {
  routes: [
    {
      method: 'GET',
      path: '/llm-tests',
      handler: 'llm-test.find',
      config: {
        policies: [],
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/llm-tests',
      handler: 'llm-test.create',
      config: {
        policies: [],
        auth: false
      }
    }
  ]
};
