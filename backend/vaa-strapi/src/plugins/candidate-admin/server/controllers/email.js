/**
 * A set of functions called "actions" for `admin`
 */

module.exports = {
  sendEmailToUnregistered: async (ctx) => {
    const {subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }

    strapi.service('plugin::candidate-admin.email').sendEmailToUnregistered(subject, content);

    ctx.status = 200;
  },
  sendEmail: async (ctx) => {
    const {candidateId, subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content || !candidateId) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }
    strapi.service('plugin::candidate-admin.email').sendEmail(candidateId, subject, content);

    ctx.status = 200;
  }
};
