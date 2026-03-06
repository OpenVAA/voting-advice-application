import { Button, Field, Flex, Textarea, Typography } from '@strapi/design-system';
import { CheckCircle, WarningCircle } from '@strapi/icons';
import { useState } from 'react';
import { getCandidateStats } from '../api/candidateStats';
import type { ReactElement } from 'react';
import type {
  CandidateStatRow,
  CandidateStatsResult,
} from '../../../server/src/services/candidateStats.type';

const TSV_HEADER = 'email\tfirstName\tlastName\tregistrationKey\tpartyExternalId\tconstituencyExternalId';

function rowsToTsv(rows: Array<CandidateStatRow>): string {
  const dataLines = rows.map(
    (r) =>
      `${r.email}\t${r.firstName}\t${r.lastName}\t${r.registrationKey}\t${r.partyExternalId}\t${r.constituencyExternalId}`
  );
  return [TSV_HEADER, ...dataLines].join('\n');
}

export function CandidateStats(): ReactElement {
  const [stats, setStats] = useState<CandidateStatsResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'warning'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  async function handleFetch(): Promise<void> {
    setStatus('loading');
    setStatusMessage('');
    const result = await getCandidateStats();
    if (result.type === 'success') {
      setStats(result);
      setStatus('success');
      setStatusMessage(`Fetched statistics for ${result.totalCount ?? 0} candidates.`);
    } else {
      setStats(null);
      setStatus('warning');
      setStatusMessage(result.cause ?? 'Failed to fetch statistics');
    }
  }

  function handleCopy(text: string): void {
    navigator.clipboard.writeText(text);
    setStatus('success');
    setStatusMessage('Copied to clipboard');
  }

  return (
    <Flex direction="column" gap={5} alignItems="stretch">
      <Typography variant="epsilon">
        <p>
          Fetch candidate statistics to see registration and answer-completion progress. The
          tab-separated data can be copied and pasted into a spreadsheet.
        </p>
      </Typography>

      <div>
        <Button onClick={handleFetch} disabled={status === 'loading'}>
          {status === 'loading' ? 'Fetching...' : 'Fetch Statistics'}
        </Button>
      </div>

      {/* Status message */}
      {status !== 'idle' && status !== 'loading' && (
        <Typography variant="epsilon">
          <p>
            {status === 'success' ? (
              <CheckCircle fill="success700" />
            ) : (
              <WarningCircle fill="warning700" />
            )}{' '}
            {statusMessage}
          </p>
        </Typography>
      )}

      {stats && (
        <>
          <Typography variant="delta">
            <p>Total candidates: {stats.totalCount ?? 0}</p>
          </Typography>

          <StatsTextarea
            label={`Not registered (${stats.notRegistered?.count ?? 0})`}
            rows={stats.notRegistered?.rows ?? []}
            onCopy={handleCopy}
          />

          <StatsTextarea
            label={`Registered but not answered all opinion questions (${stats.registeredNotAnswered?.count ?? 0})`}
            rows={stats.registeredNotAnswered?.rows ?? []}
            onCopy={handleCopy}
          />

          <StatsTextarea
            label={`Answered all opinion questions (${stats.answeredAll?.count ?? 0})`}
            rows={stats.answeredAll?.rows ?? []}
            onCopy={handleCopy}
          />
        </>
      )}
    </Flex>
  );
}

function StatsTextarea({
  label,
  rows,
  onCopy,
}: {
  label: string;
  rows: Array<CandidateStatRow>;
  onCopy: (text: string) => void;
}): ReactElement {
  const tsv = rowsToTsv(rows);

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        value={tsv}
        readOnly
        style={{ fontFamily: 'monospace', fontSize: '12px', minHeight: '120px' }}
      />
      <div style={{ marginTop: '4px' }}>
        <Button variant="secondary" size="S" onClick={() => onCopy(tsv)}>
          Copy to Clipboard
        </Button>
      </div>
    </Field.Root>
  );
}
