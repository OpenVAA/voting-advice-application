export default {
  config: {
    locales: ['en'],
    translations: {
      en: {
        'llm-test': 'LLM Test',
        'llm-test.generate': 'Generate New Test'
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
  bootstrap() {},
  register({ getPlugin }) {
    const plugin = getPlugin('content-manager');
    plugin.injectComponent('collectionType', 'api::llm-test.llm-test', 'listView', 'actions', {
      name: 'generate-llm-test',
      Component: async () => {
        const component = await import('./components/GenerateLLMTest');
        return component.default;
      }
    });
  }
};
