/**
 * admin service
 */

function getFormattedMessage(content, registrationKey) {
  const url = new URL(process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173');
  url.pathname = '/candidate/register';
  url.searchParams.append('registrationCode', registrationKey);
  const resetUrl = url.toString();

  let text = content.replace(/{LINK}/g, `<a href="${resetUrl}">${resetUrl}</a>`);
  text = text.replace(/\n/g, '<br>');
  return text;
}

module.exports = () => ({
  sendEmail: async (candidateId, subject, content) => {
    const candidate = await strapi.entityService.findOne('api::candidate.candidate', candidateId, {
      fields: ['registrationKey', 'email']
    });
    const registrationKey = candidate.registrationKey;

    const text = getFormattedMessage(content, registrationKey);

    const emailPluginService = strapi.plugins['email'].services.email;
    await emailPluginService.send({
      to: candidate.email,
      subject,
      text
    });
  },
  sendEmailToUnregistered: async (subject, content) => {
    const unregisteredCandidates = await strapi.entityService.findMany('api::candidate.candidate', {
      fields: ['registrationKey', 'email'],
      filters: {
        user: {
          id: {
            $null: true
          }
        }
      }
    });
    for (const candidate of unregisteredCandidates) {
      const emailPluginService = strapi.plugins['email'].services.email;
      const text = getFormattedMessage(content, candidate.registrationKey);
      await emailPluginService.send({
        to: candidate.email,
        subject,
        text
      });
    }
  }
});
