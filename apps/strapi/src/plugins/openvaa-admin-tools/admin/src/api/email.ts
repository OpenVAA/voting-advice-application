import { apiPost } from './utils/apiPost';
import type { SendEmailResult } from '../../../server/src/services/email.type';

export async function sendEmailToUnregistered({
  subject,
  content,
}: {
  subject: string;
  content: string;
}): Promise<SendEmailResult> {
  const response = await apiPost('/openvaa-admin-tools/send-email-to-unregistered', {
    subject,
    content,
  }).catch((e) => e);
  let error: string | undefined;
  let rest: Partial<SendEmailResult> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error sending the emails';
  } else {
    const data: SendEmailResult = await response.json();
    const { type, cause } = data;
    if (type !== 'success') error = cause ?? 'There was an error sending the emails';
    else ({ ...rest } = data);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', ...rest };
}

export async function sendEmailToCandidate({
  candidateId,
  subject,
  content,
  requireRegistrationKey,
}: {
  candidateId: string | Array<string>;
  subject: string;
  content: string;
  requireRegistrationKey?: boolean;
}): Promise<SendEmailResult> {
  const response = await apiPost('/openvaa-admin-tools/send-email', {
    subject,
    content,
    candidateId,
    requireRegistrationKey,
  }).catch((e) => e);
  let error: string | undefined;
  let rest: Partial<SendEmailResult> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error sending the email';
  } else {
    const data: SendEmailResult = await response.json();
    const { type, cause } = data;
    if (type !== 'success') error = cause ?? 'There was an error sending the email';
    else ({ ...rest } = data);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', ...rest };
}
