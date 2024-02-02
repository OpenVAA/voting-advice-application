import crypto from 'crypto';

export default {
  beforeCreate(event) {
    event.params.data.registrationKey = event.params.data.registrationKey ?? crypto.randomUUID();
  }
};
