import data from './data';
import email from './email';

export default {
  type: 'admin',
  routes: [...data, ...email],
};
