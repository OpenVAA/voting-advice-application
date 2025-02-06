export default {
  config: {
    locales: ['en'],
    translations: {
      en: {
        'llm-test': 'LLM Test'
      }
    },
    menu: {
      links: [
        {
          name: 'llm-test',
          to: '/llm-test',
          Component: async () => {
            const component = await import('./extensions/llm-test');
            return component.default;
          }
        }
      ]
    }
  },
  bootstrap() {}
};
