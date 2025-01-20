import RegistrationEmailToAll from './extensions/RegistrationEmailToAll';
import RegistrationEmailToOne from './extensions/RegistrationEmailToOne';

export default {
  // Typing for `app` doesn't seem to be available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(app: any) {
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: 'Registration email to all',
      Component: RegistrationEmailToAll
    });
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'Registration email to one',
      Component: RegistrationEmailToOne
    });
  }
};
