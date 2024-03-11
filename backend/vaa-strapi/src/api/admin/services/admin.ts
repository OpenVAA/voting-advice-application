/**
 * admin service
 */

const getFormattedMessage = (content: string, registrationKey: string) => {
  const url = new URL(process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173');
  url.pathname = '/en/candidate/register';
  url.searchParams.append('registrationCode', registrationKey);
  const resetUrl = url.toString();

  const text = content.replace(/\[LINK\]/g, `<a href="${resetUrl}">${resetUrl}</a>`);
  return text;
}

export default () => ({
  sendEmail: async (candidateId: string, subject: string, content: string) => {
    const candidate = await strapi.entityService.findOne('api::candidate.candidate', candidateId, {
      fields: ['registrationKey', 'email']
    });
    const registrationKey = candidate.registrationKey;

    const text = getFormattedMessage(content, registrationKey);

    const emailPluginService = strapi.plugins['email'].services.email;
    await emailPluginService.send({
      to: candidate.email,
      subject,
      text,
    })
  },
  sendEmailToUnregistered: async (subject: string, content: string) => {
    const allCandidates = await strapi.entityService.findMany('api::candidate.candidate', {
      fields: ['registrationKey', 'email'],
      where: {
        userId: null
      }
    }) as any[];
    for (const candidate of allCandidates) {
      const emailPluginService = strapi.plugins['email'].services.email;
      const text = getFormattedMessage(content, candidate.registrationKey);
      await emailPluginService.send({
        to: candidate.email,
        subject,
        text,
      });
    }
  }
});
