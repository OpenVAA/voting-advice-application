const candidateEmail = require('./candidateEmail');

module.exports = {
  'admin-api': {
    type: 'admin',
    routes: [...candidateEmail]
  }
};
