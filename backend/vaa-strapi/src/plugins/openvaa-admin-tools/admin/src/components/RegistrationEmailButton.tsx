import { Button, Field, Modal, Textarea, TextInput, Typography } from '@strapi/design-system';
import { CheckCircle, Mail, WarningCircle } from '@strapi/icons';
import { ReactElement, useState } from 'react';

export function RegistrationEmailButton({
  instructions,
  confirmFunction,
}: {
  instructions: string;
  confirmFunction: (args: { subject: string; content: string }) => Promise<Response>;
}): ReactElement | null {
  // Only show this button in candidate collection
  // TODO: Use a more sophisticated way to check if the component should be shown
  const pathname = window.location.pathname;
  if (!pathname.includes('candidate.candidate')) {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [subject, setEmailSubject] = useState('');
  const [content, setEmailContent] = useState(
    'Register to the Election Compass with the following link:\n\n{LINK}'
  );
  const [status, setStatus] = useState('idle');
  const [info, setInfo] = useState('');

  async function handleSubmit() {
    if (!content.includes('{LINK}')) {
      setStatus('warning');
      setInfo('Email content doesn’t include {LINK}');
    } else if (subject.length == 0) {
      setStatus('warning');
      setInfo('Email subject is empty');
    } else {
      const result = await confirmFunction({ subject, content }).catch(() => {
        return { ok: false };
      });
      if (!result?.ok) {
        setStatus('warning');
        setInfo('There was an error sending the email');
      } else {
        setStatus('success');
        setInfo('Registration email was sent successfully');
        setTimeout(() => setOpen(false), 5000);
      }
    }
  }
  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        <Button startIcon={<Mail />}>Send registration email</Button>
      </Modal.Trigger>
      <Modal.Content>
        <form onSubmit={handleSubmit}>
          <Modal.Header>
            <Modal.Title>Send registration email</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography>
              <p style={{ margin: '1rem 0' }}>{instructions}</p>
            </Typography>
            <Field.Root>
              <Field.Label>Email subject</Field.Label>
              <TextInput
                name="Email subject"
                value={subject}
                onChange={(e: { target: HTMLInputElement }) => setEmailSubject(e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Email content</Field.Label>
              <Textarea
                name="Email content"
                value={content}
                onChange={(e: { target: HTMLTextAreaElement }) => setEmailContent(e.target.value)}
              />
            </Field.Root>
            {status !== 'idle' && (
              <Typography>
                <p style={{ margin: '1rem 0' }}>
                  {status === 'success' ? (
                    <CheckCircle fill="success700" />
                  ) : status === 'warning' ? (
                    <WarningCircle fill="warning700" />
                  ) : null}
                  {info}
                </p>
              </Typography>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary">Cancel</Button>
            </Modal.Close>
            <Button type="submit" startIcon={<Mail />}>
              Send
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}
