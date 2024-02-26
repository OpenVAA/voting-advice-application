import {useCMEditViewDataManager} from '@strapi/helper-plugin';
import RegistrationEmailButton from './RegistrationEmailButton';

export default function RegistrationEmailToOne() {
  const {initialData} = useCMEditViewDataManager();
  // Only show this button if user hasn't registrated
  if (!initialData.registrationKey) {
    return null;
  }

  return RegistrationEmailButton({
    instructions: `Send registration email to ${initialData.firstName} ${initialData.lastName}. Add registration link to email by adding [LINK] to the email content. Registration link can be added multiple times.`,
    confirmFunction: () => {} // TODO add functionality
  });
}
