import crypto from 'crypto';

export default {
  beforeCreate(event) {
    event.params.data.registrationKey = event.params.data.registrationKey ?? crypto.randomUUID();
    event.params.data.email = event.params.data.email?.toLowerCase();
  },
  beforeUpdate(event) {
    event.params.data.email = event.params.data.email?.toLowerCase();
  }
};
