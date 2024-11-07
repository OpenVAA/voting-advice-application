import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalLayout,
  Textarea,
  TextInput,
  Typography
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { Envelop } from '@strapi/icons';
import { useState } from 'react';

export default function RegistrationEmailButton({ instructions, confirmFunction }) {
  // Only show this button in candidate collection
  const pathname = window.location.pathname;
  if (!pathname.includes('candidate.candidate')) {
    return null;
  }

  const [isVisible, setIsVisible] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState(
    'Register to the Election Compass with the following link:\n\n{LINK}'
  );
  const toggleNotification = useNotification();

  return (
    <>
      <Button startIcon={<Envelop />} onClick={() => setIsVisible(true)}>
        Send registration email
      </Button>
      {isVisible && (
        <ModalLayout onClose={() => setIsVisible(false)}>
          <ModalHeader>
            <Typography fontWeight="bold" textColor="neutral800" as="h2">
              Send registration email
            </Typography>
          </ModalHeader>
          <ModalBody>
            <Typography>{instructions}</Typography>
            <br />
            <br />
            <TextInput
              label="Email subject"
              name="Email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <br />
            <Textarea
              placeholder={emailContent}
              label="Email content"
              name="Email content"
              onChange={(e) => setEmailContent(e.target.value)}>
              {emailContent}
            </Textarea>
          </ModalBody>
          <ModalFooter
            startActions={
              <Button onClick={() => setIsVisible(false)} variant="tertiary">
                Cancel
              </Button>
            }
            endActions={
              <Button
                startIcon={<Envelop />}
                onClick={() => {
                  if (!emailContent.includes('{LINK}')) {
                    toggleNotification({
                      type: 'warning',
                      message: "Email content doesn't include {LINK}",
                      timeout: 5000
                    });
                  } else if (emailSubject.length == 0) {
                    toggleNotification({
                      type: 'warning',
                      message: 'Email subject is empty',
                      timeout: 5000
                    });
                  } else {
                    confirmFunction(emailSubject, emailContent);
                    setIsVisible(false);
                    toggleNotification({
                      type: 'success',
                      message: 'Registration email was sent successfully',
                      timeout: 5000
                    });
                  }
                }}>
                Send
              </Button>
            }
          />
        </ModalLayout>
      )}
    </>
  );
}
