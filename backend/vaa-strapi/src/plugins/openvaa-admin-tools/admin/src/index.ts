import { RegistrationEmailToAll } from './components/RegistrationEmailToAll';
import { RegistrationEmailToOne } from './components/RegistrationEmailToOne';
import { PLUGIN_ID } from './pluginId';

export default {
  // Typing for `app` doesn't seem to be available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
    });
  },

  // Typing for `app` doesn't seem to be available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bootstrap(app: any) {
    // See also the `RegistrationEmailButton` for handling when the button is shown
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: 'Registration email to all',
      Component: RegistrationEmailToAll,
    });
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'Registration email to one',
      Component: RegistrationEmailToOne,
    });
  },

  // async registerTrads({ locales }: { locales: string[] }) {
  //   return Promise.all(
  //     locales.map(async (locale) => {
  //       try {
  //         const { default: data } = await import(`./translations/${locale}.json`);

  //         return { data, locale };
  //       } catch {
  //         return { data: {}, locale };
  //       }
  //     })
  //   );
  // },
};
