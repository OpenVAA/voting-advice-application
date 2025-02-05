import { RegistrationEmailButton } from './RegistrationEmailButton';
import { sendEmailToCandidate } from '../api/email';

export function RegistrationEmailToOne() {
  const urlParts = window.location.pathname.split('/');
  const candidateId = urlParts[urlParts.length - 1];

  if (!candidateId) return 'Email function unavailable';

  // TODO: Only show this button if user hasn't registrated
  // if (initialValues.user?.length > 0) {
  //   return null;
  // }

  return RegistrationEmailButton({
    instructions: `Send registration email to candidate with id '${candidateId}' if they are not already registered. Add registration link to email by adding {LINK} to the email content. Registration link can be added multiple times.`,
    confirmFunction: (args: { subject: string; content: string }) =>
      sendEmailToCandidate({
        ...args,
        candidateId,
      }),
  });
}
