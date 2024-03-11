/**
 * A set of functions called "actions" for `admin`
 */

export default {
  sendEmailToUnregistered: async (ctx, next) => {
    const {subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }

    const adminService = strapi.service('api::admin.admin');
    adminService.sendEmailToUnregistered(subject, content);

    ctx.status = 200;
  },
  sendEmail: async (ctx, next) => {
    const {candidateId, subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content || !candidateId) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }
    const adminService = strapi.service('api::admin.admin');

    adminService.sendEmail(candidateId, content);
    ctx.status = 200;
  }
};
