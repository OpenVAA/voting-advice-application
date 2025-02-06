import { prefixPluginTranslations } from '@strapi/helper-plugin';

export default {
  register(app) {
    app.createSettingSection(
      {
        id: 'hello-world',
        intlLabel: {
          id: 'hello-world.plugin.name',
          defaultMessage: 'Hello World'
        }
      },
      [
        {
          intlLabel: {
            id: 'hello-world.plugin.button',
            defaultMessage: 'Hello Button'
          },
          id: 'hello-button',
          to: '/settings/hello-world',
          Component: async () => {
            const component = await import('./components/HelloButton');
            return component.default;
          }
        }
      ]
    );
  },

  bootstrap() {}
};
