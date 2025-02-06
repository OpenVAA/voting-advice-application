import LLMTest from './components/LLMTest';

export default {
  register(app) {
    app.createSettingSection(
      {
        id: 'llm-test',
        intlLabel: {
          id: 'llm-test.settings',
          defaultMessage: 'LLM Test'
        }
      },
      [
        {
          intlLabel: {
            id: 'llm-test.settings.test',
            defaultMessage: 'Test'
          },
          id: 'test',
          to: '/settings/llm-test',
          Component: LLMTest
        }
      ]
    );
  },
  bootstrap() {}
};
