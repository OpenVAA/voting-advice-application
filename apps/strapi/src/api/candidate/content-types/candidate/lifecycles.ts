import crypto from 'crypto';
import type { Event } from '@strapi/database/dist/lifecycles';

export default {
  /**
   * When the Candidate is initially created, add a registration key and make the email lowercase.
   * NB. If drafts were anabled, this hook would be triggered both when creating (a draft) and when publishing the Candidate, even when `create` is called with `{ status: 'published' }`.
   */
  beforeCreate(event: Event) {
    const { data } = event.params;
    // if (data.publishedAt) return;
    data.registrationKey = data.registrationKey ?? crypto.randomUUID();
    data.email = data.email?.toLowerCase();
  },

  /**
   * When the Candidate is updated, make the email lowercase.
   */
  beforeUpdate(event: Event) {
    const { data } = event.params;
    data.email = data.email?.toLowerCase();
  }
};
