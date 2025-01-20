import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import RegistrationEmailButton from './RegistrationEmailButton';

export default function RegistrationEmailToOne() {
  const {
    form: { initialValues }
  } = useContentManagerContext();

  // Only show this button if user hasn't registrated
  if (initialValues.user?.length > 0) {
    return null;
  }

  return RegistrationEmailButton({
    instructions: `Send registration email to ${initialValues.firstName} ${initialValues.lastName}. Add registration link to email by adding {LINK} to the email content. Registration link can be added multiple times.`,
    confirmFunction: (emailSubject: string, emailContent: string) => {
      const jwtToken = sessionStorage.getItem('jwtToken');
      if (!jwtToken) throw new Error('No JWT token found');
      fetch('/candidate-admin/send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken.replaceAll('"', '')}`
        },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
          candidateId: initialValues.documentId
        })
      });
    }
  });
}
