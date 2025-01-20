import { Button, Field, Modal, Textarea, TextInput, Typography } from '@strapi/design-system';
import { Mail } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';
import { ReactElement, useState } from 'react';

export default function RegistrationEmailButton({
  instructions,
  confirmFunction
}: {
  instructions: string;
  confirmFunction: (emailSubject: string, emailContent: string) => unknown;
}): ReactElement | null {
  // Only show this button in candidate collection
  const pathname = window.location.pathname;
  if (!pathname.includes('candidate.candidate')) {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState(
    'Register to the Election Compass with the following link:\n\n{LINK}'
  );
  const { toggleNotification } = useNotification();

  function handleSubmit() {
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
      toggleNotification({
        type: 'success',
        message: 'Registration email was sent successfully',
        timeout: 5000
      });
      setOpen(false);
    }
  }

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        <Mail /> Send registration email
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Send registration email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Typography>{instructions}</Typography>
          <br />
          <br />
          <Field.Root>
            <Field.Label>Email subject</Field.Label>
            <TextInput name="Email subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Email subject</Field.Label>
            <Textarea name="Email content" value={emailContent} onChange={(e) => setEmailContent(e.target.value)} />
          </Field.Root>
          <br />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Cancel</Button>
          </Modal.Close>
          <Button startIcon={<Mail />} onClick={handleSubmit}>
            Send
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
