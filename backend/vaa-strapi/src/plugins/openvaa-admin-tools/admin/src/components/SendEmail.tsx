import {
  Button,
  Field,
  Flex,
  JSONInput,
  Radio,
  Textarea,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { CheckCircle, Mail, Upload, WarningCircle } from '@strapi/icons';
import { Data } from '@strapi/strapi';
import { ReactElement, useState } from 'react';
import { findCandidates } from '../api/data';
import { sendEmailToCandidate } from '../api/email';
import type { RegistrationStatus } from '../../../server/src/services/data.type';

/**
 * A component for first finding candidates by specific criteria and then sending them an email.
 */
export function SendEmail(): ReactElement {
  // 1. Find candidates
  const [findInfo, setFindInfo] = useState('');
  const [findStatus, setFindStatus] = useState<'idle' | 'success' | 'warning'>('idle');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('all');
  const [constituency, setConstituency] = useState('');
  const [candidatesData, setCandidatesData] = useState('');

  // 2. Send email
  const [sendInfo, setSendInfo] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'warning'>('idle');
  const [subject, setEmailSubject] = useState('');
  const [content, setEmailContent] = useState('');
  const [result, setResult] = useState('');

  async function handleFindCandidates(): Promise<void> {
    const { type, cause, data } = await findCandidates({ registrationStatus, constituency });
    if (type !== 'success') {
      setFindStatus('warning');
      setFindInfo(cause || 'There was an error completing the action.');
      return;
    }
    setFindStatus('success');
    setFindInfo('Action succesfully completed.');
    setCandidatesData(JSON.stringify(data ?? {}, null, 2));
  }

  async function handleSendEmail(): Promise<void> {
    if (!subject || !content) {
      setSendStatus('warning');
      setSendInfo('You must provide a subject and content for the email.');
      return;
    }

    let candidates: Array<Data.Entity> | undefined;
    try {
      candidates = JSON.parse(candidatesData);
    } catch (error) {
      setSendStatus('warning');
      setSendInfo(`The JSON provided is invalid: ${error instanceof Error ? error.message : '—'}`);
      return;
    }

    if (!candidates?.length) {
      setSendStatus('warning');
      setSendInfo('You must provide a non-empty array of candidates.');
      return;
    }

    const candidateId = candidates.map((c) => c.documentId);

    const { type, cause, ...rest } = await sendEmailToCandidate({
      candidateId,
      subject,
      content,
      requireRegistrationKey: false,
    });

    if (type !== 'success') {
      setFindStatus('warning');
      setFindInfo(cause || 'There was an error completing the action.');
      return;
    }
    setFindStatus('success');
    setFindInfo('Action succesfully completed.');
    setResult(JSON.stringify(rest ?? {}, null, 2));
  }

  return (
    <Flex direction="column" gap={5} alignItems="stretch">
      <Typography variant="epsilon">
        <p>Send email to selected nominated candidates.</p>
        <ol style={{ listStyleType: 'decimal', marginLeft: '2em' }}>
          <li>Select criteria</li>
          <li>Find candidates</li>
          <li>Edit list of recipients</li>
          <li>Enter subject and message content</li>
          <li>Send email</li>
        </ol>
        <p>
          <strong>Note!</strong>
        </p>
        <ul style={{ listStyleType: 'disc', marginLeft: '2em' }}>
          <li>The documentIds will be used for targeting, not the emails on the list.</li>
          <li>
            If any emails saved for Candidates are malformed, it will not result in an error and
            they will be included in the sent count.
          </li>
        </ul>
      </Typography>

      <Field.Root>
        <Field.Label>Registration status</Field.Label>
        <Radio.Group defaultValue="all" onValueChange={setRegistrationStatus}>
          <Radio.Item value="all">All</Radio.Item>
          <Radio.Item value="unregistered">Unregistered</Radio.Item>
          <Radio.Item value="registered">Registered</Radio.Item>
        </Radio.Group>
      </Field.Root>

      <Field.Root>
        <Field.Label>Constituency</Field.Label>
        <TextInput
          placeholder="Constituency documentId"
          size="M"
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConstituency(e.target.value)}
        />
      </Field.Root>

      {findStatus !== 'idle' && (
        <Typography variant="epsilon">
          <p style={{ margin: '1rem 0' }}>
            {findStatus === 'success' ? (
              <CheckCircle fill="success700" />
            ) : findStatus === 'warning' ? (
              <WarningCircle fill="warning700" />
            ) : null}
            {findInfo}
          </p>
        </Typography>
      )}

      <Button startIcon={<Upload />} onClick={handleFindCandidates}>
        Find Candidates
      </Button>

      <Field.Root>
        <Field.Label>Candidates</Field.Label>
        <JSONInput
          value={candidatesData}
          height="20rem"
          maxWidth="80vw"
          onChange={setCandidatesData}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Email subject</Field.Label>
        <TextInput
          name="Email subject"
          value={subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Email content</Field.Label>
        <Textarea
          name="Email content"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailContent(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Result as JSON</Field.Label>
        <JSONInput value={result} height="20rem" maxWidth="80vw" />
      </Field.Root>

      {sendStatus !== 'idle' && (
        <Typography variant="epsilon">
          <p style={{ margin: '1rem 0' }}>
            {sendStatus === 'success' ? (
              <CheckCircle fill="success700" />
            ) : sendStatus === 'warning' ? (
              <WarningCircle fill="warning700" />
            ) : null}
            {sendInfo}
          </p>
        </Typography>
      )}

      <Button startIcon={<Mail />} onClick={handleSendEmail}>
        Send Email to Candidates
      </Button>
    </Flex>
  );
}
