import RegistrationEmailButton from './RegistrationEmailButton';

export default function RegistrationEmailToAll() {
  return RegistrationEmailButton({
    instructions:
      'Send registration email to all unregistered candidates. Add registration link to email by adding [LINK] to the email content. Registration link can be added multiple times.',
    confirmFunction: () => {
      fetch('/api/admin/send-email-to-unregistered', {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Registration link',
          content: 'Hello, [LINK] is your registration link.'
        })
      });
    }
  });
}
