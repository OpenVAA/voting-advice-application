import { Button, Field, Flex, SingleSelect, SingleSelectOption, TextInput, Typography } from '@strapi/design-system';
import { CheckCircle, WarningCircle } from '@strapi/icons';
import { useCallback, useEffect, useState } from 'react';
import { addCandidate, getFormOptions } from '../api/addCandidate';
import type { ReactElement } from 'react';
import type { FormOptionItem } from '../../../server/src/services/addCandidate.type';

export function AddCandidate(): ReactElement {
  const [parties, setParties] = useState<Array<FormOptionItem>>([]);
  const [constituencies, setConstituencies] = useState<Array<FormOptionItem>>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'warning'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const showStatus = useCallback((type: 'success' | 'warning', message: string) => {
    setStatus(type);
    setStatusMessage(message);
  }, []);

  useEffect(() => {
    (async () => {
      const result = await getFormOptions();
      if (result.type === 'success' && result.formOptions) {
        setParties(result.formOptions.parties);
        setConstituencies(result.formOptions.constituencies);
      } else {
        showStatus('warning', result.cause ?? 'Failed to load form options');
      }
    })();
  }, [showStatus]);

  function formatOptionLabel(item: FormOptionItem): string {
    const parts: Array<string> = [];
    if (item.name) parts.push(item.name);
    if (item.externalId) parts.push(`(${item.externalId})`);
    return parts.join(' ') || item.documentId;
  }

  async function handleSubmit(): Promise<void> {
    if (!firstName || !lastName || !email || !selectedParty || !selectedConstituency) {
      showStatus('warning', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setRegistrationUrl('');

    const result = await addCandidate({
      firstName,
      lastName,
      email,
      partyExternalId: selectedParty,
      constituencyExternalId: selectedConstituency,
    });

    setLoading(false);

    if (result.type === 'success' && result.registrationUrl) {
      setRegistrationUrl(result.registrationUrl);
      showStatus('success', 'Candidate created successfully');
      setFirstName('');
      setLastName('');
      setEmail('');
      setSelectedParty('');
      setSelectedConstituency('');
    } else {
      showStatus('warning', result.cause ?? 'Failed to add candidate');
    }
  }

  function handleCopyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    showStatus('success', 'Copied to clipboard');
  }

  return (
    <Flex direction="column" gap={5} alignItems="stretch">
      <Typography variant="epsilon">
        <p>
          Add a new candidate with a nomination. After creation, a registration link will be
          displayed.
        </p>
      </Typography>

      <Field.Root>
        <Field.Label>First name</Field.Label>
        <TextInput
          placeholder="First name"
          value={firstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Last name</Field.Label>
        <TextInput
          placeholder="Last name"
          value={lastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Email</Field.Label>
        <TextInput
          placeholder="Email address"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Party</Field.Label>
        <SingleSelect
          placeholder="Select a party"
          value={selectedParty}
          onChange={(value: string) => setSelectedParty(value)}
        >
          {parties.map((p) => (
            <SingleSelectOption key={p.externalId} value={p.externalId}>
              {formatOptionLabel(p)}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      </Field.Root>

      <Field.Root>
        <Field.Label>Constituency</Field.Label>
        <SingleSelect
          placeholder="Select a constituency"
          value={selectedConstituency}
          onChange={(value: string) => setSelectedConstituency(value)}
        >
          {constituencies.map((c) => (
            <SingleSelectOption key={c.externalId} value={c.externalId}>
              {formatOptionLabel(c)}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      </Field.Root>

      <Button
        onClick={handleSubmit}
        disabled={loading || !firstName || !lastName || !email || !selectedParty || !selectedConstituency}
      >
        {loading ? 'Adding...' : 'Add Candidate'}
      </Button>

      {registrationUrl && (
        <Field.Root>
          <Field.Label>Registration URL</Field.Label>
          <Flex gap={2}>
            <TextInput value={registrationUrl} disabled style={{ flex: 1 }} />
            <Button variant="secondary" onClick={() => handleCopyToClipboard(registrationUrl)}>
              Copy
            </Button>
          </Flex>
        </Field.Root>
      )}

      {status !== 'idle' && (
        <Typography variant="epsilon">
          <p style={{ margin: '1rem 0' }}>
            {status === 'success' ? (
              <CheckCircle fill="success700" />
            ) : status === 'warning' ? (
              <WarningCircle fill="warning700" />
            ) : null}{' '}
            {statusMessage}
          </p>
        </Typography>
      )}
    </Flex>
  );
}
