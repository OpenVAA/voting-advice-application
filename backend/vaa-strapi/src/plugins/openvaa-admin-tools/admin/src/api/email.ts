import { apiPost } from './utils/apiPost';

export async function sendEmailToUnregistered({
  subject,
  content,
}: {
  subject: string;
  content: string;
}): Promise<Response> {
  const response = await apiPost('/openvaa-admin-tools/send-email-to-unregistered', {
    subject,
    content,
  });
  return response;
}

export async function sendEmailToCandidate({
  candidateId,
  subject,
  content,
}: {
  candidateId: string;
  subject: string;
  content: string;
}): Promise<Response> {
  const response = await apiPost('/openvaa-admin-tools/send-email', {
    subject,
    content,
    candidateId,
  });
  return response;
}
