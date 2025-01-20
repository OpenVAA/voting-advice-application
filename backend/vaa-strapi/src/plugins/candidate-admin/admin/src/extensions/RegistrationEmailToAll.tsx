import RegistrationEmailButton from './RegistrationEmailButton';

export default function RegistrationEmailToAll() {
  return RegistrationEmailButton({
    instructions:
      'Send registration email to all unregistered candidates. Add registration link to email by adding {LINK} to the email content. Registration link can be added multiple times.',
    confirmFunction: (emailSubject: string, emailContent: string) => {
      const jwtToken = sessionStorage.getItem('jwtToken');
      if (!jwtToken) throw new Error('No JWT token found');
      fetch('/candidate-admin/send-email-to-unregistered', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken.replaceAll('"', '')}`
        },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent
        })
      });
    }
  });
}
