import RegistrationEmailToAll from './extensions/RegistrationEmailToAll';
import RegistrationEmailToOne from './extensions/RegistrationEmailToOne';

export default {
  register(app) {
    app.injectContentManagerComponent('listView', 'actions', {
      name: 'Registration email to all',
      Component: RegistrationEmailToAll
    });
    app.injectContentManagerComponent('editView', 'right-links', {
      name: 'Registration email to one',
      Component: RegistrationEmailToOne
    });
  }
};
