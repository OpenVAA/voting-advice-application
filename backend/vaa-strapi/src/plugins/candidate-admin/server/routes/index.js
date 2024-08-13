// eslint-disable-next-line @typescript-eslint/no-require-imports -- require might be needed
const candidateEmail = require('./candidateEmail');

module.exports = {
  'admin-api': {
    type: 'admin',
    routes: [...candidateEmail]
  }
};
