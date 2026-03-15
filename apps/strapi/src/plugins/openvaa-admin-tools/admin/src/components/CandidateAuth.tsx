import { Badge, Button, Field, Flex, TextInput, Typography } from '@strapi/design-system';
import { CheckCircle, Key, Mail, User, WarningCircle } from '@strapi/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  forceRegisterCandidate,
  generateCandidatePassword,
  getCandidateInfo,
  searchCandidates,
  sendForgotPassword,
  setCandidatePassword,
} from '../api/candidateAuth';
import type { ReactElement } from 'react';
import type {
  CandidateInfo,
  CandidateSearchResult,
} from '../../../server/src/services/candidateAuth.type';

export function CandidateAuth(): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<CandidateSearchResult>>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateInfo | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'warning'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = useCallback((type: 'success' | 'warning', message: string) => {
    setStatus(type);
    setStatusMessage(message);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const result = await searchCandidates({ query: searchQuery.trim() });
      if (result.type === 'success' && result.candidates) {
        setSearchResults(result.candidates);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  async function handleSelectCandidate(documentId: string): Promise<void> {
    setStatus('idle');
    setResetUrl('');
    setPassword('');
    setLoading(true);
    const result = await getCandidateInfo({ documentId });
    setLoading(false);
    if (result.type === 'success' && result.candidate) {
      setSelectedCandidate(result.candidate);
      setSearchResults([]);
      setSearchQuery('');
    } else {
      showStatus('warning', result.cause ?? 'Failed to load candidate info');
    }
  }

  async function handleAutoGenerate(): Promise<void> {
    setLoading(true);
    const result = await generateCandidatePassword({
      username: selectedCandidate?.email ?? '',
    });
    setLoading(false);
    if (result.type === 'success' && result.password) {
      setPassword(result.password);
      showStatus('success', 'Password generated');
    } else {
      showStatus('warning', result.cause ?? 'Failed to generate password');
    }
  }

  async function handleForceRegister(): Promise<void> {
    if (!selectedCandidate || !password) {
      showStatus('warning', 'Please enter or generate a password first');
      return;
    }
    setLoading(true);
    const result = await forceRegisterCandidate({
      documentId: selectedCandidate.documentId,
      password,
    });
    setLoading(false);
    if (result.type === 'success') {
      showStatus('success', 'Candidate registered successfully');
      // Refresh candidate info
      const updated = await getCandidateInfo({ documentId: selectedCandidate.documentId });
      if (updated.type === 'success' && updated.candidate) {
        setSelectedCandidate(updated.candidate);
      }
    } else {
      showStatus('warning', result.cause ?? 'Failed to force-register candidate');
    }
  }

  async function handleSendForgotPassword(): Promise<void> {
    if (!selectedCandidate) return;
    setLoading(true);
    const result = await sendForgotPassword({ documentId: selectedCandidate.documentId });
    setLoading(false);
    if (result.type === 'success') {
      showStatus('success', 'Forgot password email sent');
      if (result.resetUrl) setResetUrl(result.resetUrl);
    } else {
      showStatus('warning', result.cause ?? 'Failed to send forgot password email');
    }
  }

  async function handleSetPassword(): Promise<void> {
    if (!selectedCandidate || !password) {
      showStatus('warning', 'Please enter or generate a password first');
      return;
    }
    setLoading(true);
    const result = await setCandidatePassword({
      documentId: selectedCandidate.documentId,
      password,
    });
    setLoading(false);
    if (result.type === 'success') {
      showStatus('success', 'Password updated successfully');
    } else {
      showStatus('warning', result.cause ?? 'Failed to set password');
    }
  }

  function handleCopyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    showStatus('success', 'Copied to clipboard');
  }

  function handleClearSelection(): void {
    setSelectedCandidate(null);
    setPassword('');
    setStatus('idle');
    setResetUrl('');
    setSearchQuery('');
    setSearchResults([]);
  }

  return (
    <Flex direction="column" gap={5} alignItems="stretch">
      <Typography variant="epsilon">
        <p>
          Search for a candidate by name, email, or documentId. Then manage their registration
          status and password.
        </p>
      </Typography>

      {/* Search */}
      {!selectedCandidate && (
        <>
          <Field.Root>
            <Field.Label>Search candidates</Field.Label>
            <TextInput
              placeholder="Name, email, or documentId"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </Field.Root>

          {searchResults.length > 0 && (
            <div
              style={{
                border: '1px solid #dcdce4',
                borderRadius: '4px',
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              {searchResults.map((c) => (
                <div
                  key={c.documentId}
                  onClick={() => handleSelectCandidate(c.documentId)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0ff')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')
                  }
                >
                  <span>
                    {c.firstName} {c.lastName} ({c.email})
                  </span>
                  <Badge>{c.isRegistered ? 'Registered' : 'Unregistered'}</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Selected candidate info */}
      {selectedCandidate && (
        <>
          <div
            style={{
              padding: '16px',
              border: '1px solid #dcdce4',
              borderRadius: '4px',
              backgroundColor: '#f6f6f9',
            }}
          >
            <Flex direction="column" gap={3} alignItems="stretch">
              <Flex gap={3} alignItems="center">
                <User />
                <Typography variant="delta">
                  {selectedCandidate.firstName} {selectedCandidate.lastName}
                </Typography>
                <Badge
                  backgroundColor={selectedCandidate.isRegistered ? 'success100' : 'warning100'}
                  textColor={selectedCandidate.isRegistered ? 'success700' : 'warning700'}
                >
                  {selectedCandidate.isRegistered ? 'Registered' : 'Unregistered'}
                </Badge>
              </Flex>
              <Typography variant="epsilon">
                Email: {selectedCandidate.email}
                <br />
                Document ID: {selectedCandidate.documentId}
              </Typography>
            </Flex>
          </div>

          <Button variant="tertiary" onClick={handleClearSelection}>
            Clear selection
          </Button>

          {/* Unregistered candidate actions */}
          {!selectedCandidate.isRegistered && (
            <>
              {selectedCandidate.registrationUrl && (
                <Field.Root>
                  <Field.Label>Registration URL</Field.Label>
                  <Flex gap={2}>
                    <TextInput
                      value={selectedCandidate.registrationUrl}
                      disabled
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleCopyToClipboard(selectedCandidate.registrationUrl ?? '')}
                    >
                      Copy
                    </Button>
                  </Flex>
                </Field.Root>
              )}

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Flex gap={2}>
                  <TextInput
                    placeholder="Enter password or auto-generate"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <Button variant="secondary" onClick={handleAutoGenerate} disabled={loading}>
                    Auto-generate
                  </Button>
                </Flex>
              </Field.Root>

              <Button
                startIcon={<Key />}
                onClick={handleForceRegister}
                disabled={loading || !password}
              >
                Force Register
              </Button>
            </>
          )}

          {/* Registered candidate actions */}
          {selectedCandidate.isRegistered && (
            <>
              <Button
                startIcon={<Mail />}
                onClick={handleSendForgotPassword}
                disabled={loading}
                variant="secondary"
              >
                Send Forgot Password Email
              </Button>

              {resetUrl && (
                <Field.Root>
                  <Field.Label>Password Reset URL</Field.Label>
                  <Flex gap={2}>
                    <TextInput value={resetUrl} disabled style={{ flex: 1 }} />
                    <Button variant="secondary" onClick={() => handleCopyToClipboard(resetUrl)}>
                      Copy
                    </Button>
                  </Flex>
                </Field.Root>
              )}

              <Field.Root>
                <Field.Label>Set new password</Field.Label>
                <Flex gap={2}>
                  <TextInput
                    placeholder="Enter password or auto-generate"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <Button variant="secondary" onClick={handleAutoGenerate} disabled={loading}>
                    Auto-generate
                  </Button>
                </Flex>
              </Field.Root>

              <Button
                startIcon={<Key />}
                onClick={handleSetPassword}
                disabled={loading || !password}
              >
                Set Password
              </Button>
            </>
          )}
        </>
      )}

      {/* Status message */}
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
