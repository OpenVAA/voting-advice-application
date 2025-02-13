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
    }
  ]
};
