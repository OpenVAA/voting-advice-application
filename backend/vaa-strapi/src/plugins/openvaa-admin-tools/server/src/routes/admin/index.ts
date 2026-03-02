import candidateAuth from './candidateAuth';
import data from './data';
import email from './email';

export default {
  type: 'admin',
  routes: [...candidateAuth, ...data, ...email],
};
