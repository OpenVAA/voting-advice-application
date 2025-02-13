import type { Core } from '@strapi/strapi';

if (!process.env.PUBLIC_BROWSER_FRONTEND_URL)
  throw new Error('Missing PUBLIC_BROWSER_FRONTEND_URL environment variable');

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    sendEmail: async (
      candidateId,
      subject,
      content
    ): Promise<{ type: 'success' | 'failure'; cause?: string }> => {
      const candidate = await strapi.documents('api::candidate.candidate').findOne({
        documentId: candidateId,
        fields: ['registrationKey', 'email'],
      });
      const registrationKey = candidate.registrationKey;
      if (!registrationKey) {
        return { type: 'failure', cause: 'The Candidate has not registrationKey' };
      }

      const text = getFormattedMessage(content, registrationKey);

      const emailPluginService = strapi.plugins['email'].services.email;
      await emailPluginService.send({
        to: candidate.email,
        subject,
        text,
      });
      return { type: 'success' };
    },

    sendEmailToUnregistered: async (
      subject,
      content
    ): Promise<{ type: 'success' | 'failure'; cause?: string }> => {
      const unregisteredCandidates = await strapi.documents('api::candidate.candidate').findMany({
        fields: ['registrationKey', 'email'],
        filters: {
          user: {
            id: {
              $null: true,
            },
          },
        },
      });
      for (const candidate of unregisteredCandidates) {
        const emailPluginService = strapi.plugins['email'].services.email;
        const text = getFormattedMessage(content, candidate.registrationKey);
        await emailPluginService.send({
          to: candidate.email,
          subject,
          text,
        });
      }
      return { type: 'success' };
    },
  };
}

function getFormattedMessage(content, registrationKey) {
  const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL);
  url.pathname = '/candidate/register';
  url.searchParams.append('registrationKey', registrationKey);
  const resetUrl = url.toString();
  let text = content.replace(/{LINK}/g, `<a href="${resetUrl}">${resetUrl}</a>`);
  text = text.replace(/\n/g, '<br>');
  return text;
}
