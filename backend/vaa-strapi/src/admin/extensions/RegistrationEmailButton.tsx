import React, {useState} from 'react';
import {
  Alert,
  Button,
  ModalLayout,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Textarea,
  TextInput,
  Typography
} from '@strapi/design-system';
import {Envelop} from '@strapi/icons';

export default function RegistrationEmailButton({instructions, confirmFunction}) {
  // Only show this button in candidate collection
  const pathname = window.location.pathname;
  if (!pathname.includes('candidate.candidate')) {
    return null;
  }

  const [isVisible, setIsVisible] = useState(false);
  const [showError, setShowError] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');

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
            {showError && (
              <>
                <br />
                <Alert
                  title="Error"
                  variant="danger"
                  closeLabel="Close alert"
                  onClose={() => setShowError(false)}>
                  Email content doesn't inlude [LINK]
                </Alert>
              </>
            )}
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
                  if (emailContent.includes('[LINK]')) {
                    confirmFunction();
                    setIsVisible(false);
                    setShowError(false);
                  } else {
                    setShowError(true);
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
