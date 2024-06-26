import crypto from 'crypto';

export default {
  beforeCreate(event) {
    event.params.data.registrationKey = event.params.data.registrationKey ?? crypto.randomUUID();
    event.params.data.manifesto = event.params.data.manifesto ?? {};
    event.params.data.email = event.params.data.email?.toLowerCase();
  },
  beforeUpdate(event) {
    event.params.data.email = event.params.data.email?.toLowerCase();
    event.params.data.manifesto =
      event.params.data.manifesto === null ? {} : event.params.data.manifesto;
  }
};
