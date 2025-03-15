import { Button, Field, Flex, JSONInput, Typography } from '@strapi/design-system';
import { CheckCircle, Upload, WarningCircle } from '@strapi/icons';
import { ReactElement, useEffect, useState } from 'react';
import { findData } from '../api/data';
//import { ApiResult } from 'src/api/utils/apiResult.type';

interface CandidateData {
  constituencyExternalId: string;
  partyExternalId: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateElectionSymbol: string;
  candidateOccupation: string;
  candidateHomeMunicipalityFi: string;
  candidateHomeMunicipalitySv: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<string>;
  data: Array<CandidateData>;
}

type Election = {
  documentId: string;
  name: {
    en: string;
  };
};

function parseCSV(content: string): ValidationResult {
  try {
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return {
        isValid: false,
        errors: ['The file is empty.'],
        data: [],
      };
    }

    const data: Array<CandidateData> = [];

    lines.forEach((line, lineIndex) => {
      const columns = line.split(';').map((column) => column.trim());

      if (!columns.filter(Boolean).length) {
        // Skip empty rows
        return;
      }

      const electionType = columns[0];
      const countyExternalId = columns[1];
      const municipalityExternalId = columns[2];
      const partyExternalId = columns[7];
      const candidateFirstName = columns[17];
      const candidateLastName = columns[18];
      const candidateElectionSymbol = columns[20];
      const candidateOccupation = columns[21];
      const candidateHomeMunicipalityFi = columns[23];
      const candidateHomeMunicipalitySv = columns[24];

      const lineErrors: Array<string> = [];

      // Validate municipality number (should be a number or ***)
      if (isNaN(Number(countyExternalId)) || countyExternalId === '') {
        lineErrors.push(`Invalid county number: "${countyExternalId}"`);
      }

      // Validate municipality number (should be a number or ***)
      if (
        municipalityExternalId !== '***' &&
        (isNaN(Number(municipalityExternalId)) || municipalityExternalId === '')
      ) {
        lineErrors.push(`Invalid municipality number: "${municipalityExternalId}"`);
      }

      // Validate standard party number (should be a number)
      if (isNaN(Number(partyExternalId)) || partyExternalId === '') {
        lineErrors.push(`Invalid standard party number: "${partyExternalId}"`);
      }

      // Validate first name (should not be empty)
      if (candidateFirstName === '') {
        lineErrors.push('First name is required');
      }

      // Validate last name (should not be empty)
      if (candidateLastName === '') {
        lineErrors.push('Last name is required');
      }

      // Validate election symbol (should be a number)
      if (isNaN(Number(candidateElectionSymbol)) || candidateElectionSymbol === '') {
        lineErrors.push(`Invalid election symbol: "${candidateElectionSymbol}"`);
      }

      if (lineErrors.length > 0) {
        return {
          isValid: false,
          errors: [
            `Line ${lineIndex + 1} (${candidateFirstName} ${candidateLastName}): ${lineErrors.join(', ')}`,
          ],
          data: [],
        };
      }

      data.push({
        constituencyExternalId:
          electionType === 'AV'
            ? `county-${Number(municipalityExternalId)}`
            : electionType === 'K'
              ? `municipality-${Number(municipalityExternalId)}`
              : '-',
        partyExternalId,
        candidateFirstName,
        candidateLastName,
        candidateElectionSymbol,
        candidateOccupation,
        candidateHomeMunicipalityFi,
        candidateHomeMunicipalitySv,
      });
    });

    return {
      isValid: true,
      errors: [],
      data,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`],
      data: [],
    };
  }
}

export function CandidateNominatorFileImport(): ReactElement {
  const [elections, setElections] = useState<Array<Election>>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');

  const [, setFileContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<string | null>(null);
  //const [] = useState<ApiResult | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await findData({
          collection: 'elections',
          filters: {},
        });
        if (result.type === 'success' && result.data) {
          setElections(result.data.map((i) => ({ documentId: i.documentId, name: i.name })));
        }
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <form onSubmit={() => {}}>
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="epsilon">
          <Flex direction="column" gap={3} alignItems="stretch">
            <p>
              Upload a candidate list from https://tulospalvelu.vaalit.fi/fi/index.html to confirm
              candidate nominations (supports AV and K election types).
            </p>
          </Flex>
        </Typography>
        <Field.Root>
          <Field.Label>Election</Field.Label>
          <select value={selectedElection} onChange={(e) => setSelectedElection(e.target.value)}>
            {elections.map((election) => (
              <option key={election.documentId} value={election.documentId}>
                {election.name.en}
              </option>
            ))}
          </select>
          <Field.Label>Candidate nominator file (CSV)</Field.Label>
          <input
            type="file"
            accept=".csv"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              const reader = new FileReader();
              reader.onload = (e) => {
                setFileContent(e.target?.result as string);
                setValidationResult(
                  JSON.stringify(parseCSV(e.target?.result as string) ?? {}, null, 2)
                );
              };
              reader.readAsText(file, 'ISO-8859-1');
            }}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Preview</Field.Label>
          <JSONInput value={validationResult ?? ''} height="20rem" maxWidth="80vw" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Result as JSON</Field.Label>
          <JSONInput value={''} height="20rem" maxWidth="80vw" />
        </Field.Root>
        {status !== 'idle' && (
          <Typography variant="epsilon">
            <p style={{ margin: '1rem 0' }}>
              {status === 'success' ? (
                <CheckCircle fill="success700" />
              ) : status === 'warning' ? (
                <WarningCircle fill="warning700" />
              ) : null}
            </p>
          </Typography>
        )}
        <Button type="submit" startIcon={<Upload />}>
          Import
        </Button>
      </Flex>
    </form>
  );
}
