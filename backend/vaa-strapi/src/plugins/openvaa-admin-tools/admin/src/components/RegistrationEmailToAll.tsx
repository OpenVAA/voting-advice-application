import { ReactElement } from 'react';
import { RegistrationEmailButton } from './RegistrationEmailButton';
import { sendEmailToUnregistered } from '../api/email';

export function RegistrationEmailToAll(): ReactElement | null {
  return RegistrationEmailButton({
    instructions:
      'Send registration email to all unregistered candidates. Add registration link to email by adding {LINK} to the email content. Registration link can be added multiple times.',
    confirmFunction: sendEmailToUnregistered,
  });
}
