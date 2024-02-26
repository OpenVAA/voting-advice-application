import RegistrationEmailButton from './RegistrationEmailButton';

export default function RegistrationEmailToAll() {
  return RegistrationEmailButton({
    instructions:
      'Send registration email to all unregistered candidates. Add registration link to email by adding [LINK] to the email content. Registration link can be added multiple times.',
    confirmFunction: () => {} // TODO add functionality
  });
}
