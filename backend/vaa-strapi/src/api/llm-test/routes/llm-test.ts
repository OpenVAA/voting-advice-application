export default {
  routes: [
    {
      method: 'POST',
      path: '/llm-test/generate',
      handler: 'llm-test.generate',
      config: {
        policies: [],
        auth: {
          scope: ['admin'] // This ensures only admin users can access
        }
      }
    }
  ]
};
