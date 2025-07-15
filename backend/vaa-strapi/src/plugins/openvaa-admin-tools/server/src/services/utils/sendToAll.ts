import { REGISTRATION_LINK_PLACEHOLDER } from './emailPlaceholders';
import type { Data } from '@strapi/strapi';
import type { SendEmailResult } from '../email.type';

if (!process.env.PUBLIC_BROWSER_FRONTEND_URL)
  throw new Error('Missing PUBLIC_BROWSER_FRONTEND_URL environment variable');

export async function sendToAll({
  content,
  subject,
  candidates,
}: {
  subject: string;
  content: string;
  candidates: Array<Data.Entity>;
}): Promise<SendEmailResult> {
  const errors = new Array<{ email: string; error?: string }>();
  let sent = 0;
  for (const { email, registrationKey } of candidates) {
    await sendRegistrationEmail({ email, registrationKey, subject, content })
      .then(() => sent++)
      .catch((e) => errors.push({ email, error: e.message }));
  }
  return {
    type: 'success',
    sent,
    errors,
  };
}

export async function sendRegistrationEmail({
  content,
  email,
  registrationKey,
  subject,
}: {
  email: string;
  content: string;
  registrationKey: string;
  subject: string;
}): Promise<void> {
  const emailPluginService = strapi.plugins['email'].services.email;
  const text = getFormattedMessage({ content, registrationKey });
  await emailPluginService.send({
    to: email,
    subject,
    text,
  });
}

export function getFormattedMessage({
  content,
  registrationKey,
}: {
  content: string;
  registrationKey: string;
}): string {
  const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL);
  url.pathname = '/candidate/register';
  url.searchParams.append('registrationKey', registrationKey);
  const resetUrl = url.toString();
  content = content.replace(
    new RegExp(REGISTRATION_LINK_PLACEHOLDER, 'g'),
    `<a href="${resetUrl}">${resetUrl}</a>`
  );
  content = content.replace(/\n/g, '<br>');
  return content;
}
