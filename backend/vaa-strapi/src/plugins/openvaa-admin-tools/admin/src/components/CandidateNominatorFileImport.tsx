import { Button, Field, Flex, JSONInput, Typography } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import { ReactElement, useEffect, useState } from 'react';
import { findData } from '../api/data';

type CsvNomination = {
  constituencyExternalId: string;
  partyExternalId: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateElectionSymbol: string;
  candidateOccupation: string;
  candidateHomeMunicipalityFi: string;
  candidateHomeMunicipalitySv: string;
};

type FileValidationResult = {
  isValid: boolean;
  errors: Array<string>;
  data: Array<CsvNomination>;
};

type Election = {
  documentId: string;
  name: {
    en: string;
  };
};

type Nomination = {
  documentId: string;
  electionSymbol: string | null;
  unconfirmed: boolean;
  externalId: string | null;
  candidate: {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
  } | null;
  election: {
    documentId: string;
  };
  constituency: {
    documentId: string;
    externalId: string;
  };
};

/**
 *
 * Validates the content of a CSV candidate nominator file and picks relevant nomination data
 * @param content - The content of a CSV candidate nominator file
 * @returns An object with relevant nomination data `CsvNomination`
 */
function parseCSV(content: string): FileValidationResult {
  try {
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return {
        isValid: false,
        errors: ['The file is empty.'],
        data: [],
      };
    }

    const data: Array<CsvNomination> = [];

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
            ? `county-${countyExternalId}`
            : electionType === 'K'
              ? `municipality-${municipalityExternalId}`
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

/**
 * Maps unconfirmed nominations to confirmed nominations based on full name and `constituency.externalId`.
 * @param unconfirmedNominations - Unconfirmed nominations from Strapi
 * @param confirmedNominations - Confirmed nominations from the CSV file
 * @returns Unconfirmed nominations mapped to confirmed nominations.
 */
function lookupNominations(
  unconfirmedNominations: Array<{
    documentId: string;
    constituency: { documentId: string; externalId: string };
    candidate: { documentId: string; firstName: string; lastName: string } | null;
  }>,
  confirmedNominations: Array<{
    constituency: { externalId: string };
    electionSymbol: string;
    party: { externalId: string };
    candidate: {
      firstName: string;
      lastName: string;
      answers: Record<
        | 'cuucnobngt536gysyjyxwjux' // Occupation
        | 'h9ideiy9aijavtzwlyo19ykp' // Municipality
        | 'g859ggb3qdecapyb0j251ysr', // Preferred name
        {
          info: { en: string; fi: string; sv: string };
          value: null;
        }
      >;
    };
  }>
) {
  const confirmedMap = new Map<
    string,
    Map<string, Map<string, (typeof confirmedNominations)[number]>>
  >();

  // Populate the map: { constituencyId -> { firstName -> { lastName -> confirmedNomination } } }
  for (const nomination of confirmedNominations) {
    const { externalId } = nomination.constituency;
    const firstName = nomination.candidate.firstName
      .toLowerCase()
      .replace(/[(["].*?[)\]"]/, '') // Drop nicknames
      .trim();
    const lastName = nomination.candidate.lastName.toLowerCase();

    if (!confirmedMap.has(externalId)) {
      confirmedMap.set(externalId, new Map());
    }
    if (!confirmedMap.get(externalId)!.has(firstName)) {
      confirmedMap.get(externalId)!.set(firstName, new Map());
    }
    confirmedMap.get(externalId)!.get(firstName)!.set(lastName, nomination);
  }

  return unconfirmedNominations.map(({ constituency, candidate }) => {
    if (candidate === null) {
      return null;
    }

    const tests = [
      ...[
        candidate.firstName,
        ...candidate.firstName.split(/[\s,-]+/), // E.g. Anna-Kaisa Johanna => Anna or Kaisa or Johanna
        ...candidate.firstName.split(' '), // E.g. Anna-Kaisa Johanna => Anna-Kaisa or Johanna
      ].map((firstName) => ({ firstName, lastName: candidate.lastName })),
      ...[
        candidate.lastName,
        ...candidate.lastName.split(/[\s,-]+/),
        ...candidate.lastName.split(' '),
      ].map((lastName) => ({ firstName: lastName, lastName: candidate.firstName })), // Change first and last name order
    ];

    const confirmed = tests
      .map((test) =>
        confirmedMap
          .get(constituency.externalId)
          ?.get(test.firstName.toLowerCase())
          ?.get(test.lastName.toLowerCase())
      )
      .find((c) => Boolean(c));

    return {
      constituency: {
        externalId: constituency.externalId,
      },
      ...(confirmed
        ? {
            // Data for updating the nomination and candidate:
            electionSymbol: confirmed.electionSymbol,
            unconfirmed: false,
            party: confirmed.party,
            candidate: {
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              // Important! Merge with the existing answers.
              answers: confirmed.candidate.answers,
            },
          }
        : {
            unconfirmed: true,
            candidate: {
              firstName: candidate.firstName,
              lastName: candidate.lastName,
            },
          }),
    };
  });
}

export function CandidateNominatorFileImport(): ReactElement {
  const [elections, setElections] = useState<Array<Election>>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');

  const [electionNominations, setElectionNominations] = useState<Array<Nomination>>([]);

  const [file, setFile] = useState<FileValidationResult | null>(null);
  const [preview, setPreview] = useState<object | null>(null);

  useEffect(() => {
    async function fetchElections() {
      try {
        const result = await findData({
          collection: 'elections',
          filters: {},
        });
        if (result.type === 'success' && result.data) {
          setElections(result.data.map((i) => i as unknown as Election));
        }
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    }
    fetchElections();
  }, []);

  useEffect(() => {
    async function fetchNominations() {
      try {
        const result = await findData({
          collection: 'nominations',
          filters: {
            unconfirmed: {
              $eq: true,
            },
            election: {
              documentId: {
                $eq: selectedElection,
              },
            },
          },
          populate: {
            candidate: {
              fields: ['documentId', 'firstName', 'lastName'],
            },
            election: {
              fields: ['documentId'],
            },
            constituency: true,
          },
        });
        if (result.type === 'success' && result.data) {
          setElectionNominations(result.data.map((i) => i as unknown as Nomination));
        }
      } catch (error) {
        console.error('Error fetching nominations:', error);
      }
    }
    fetchNominations();
  }, [selectedElection]);

  useEffect(() => {
    if (!selectedElection) {
      setPreview({ error: 'Election not selected.' });
      return;
    }

    if (
      !electionNominations.length ||
      electionNominations[0].election.documentId !== selectedElection
    ) {
      setPreview({ error: 'Error loading unconfirmed nominations for the election.' });
      return;
    }

    if (!file) {
      setPreview({ error: 'Candidate nominator file not uploaded.' });
      return;
    }

    if (!file?.isValid) {
      setPreview({ error: 'Error parsing the candidate nominator file.' });
      return;
    }

    setPreview(
      lookupNominations(
        electionNominations,
        file.data.map((x) => ({
          constituency: { externalId: x.constituencyExternalId },
          party: { externalId: x.partyExternalId },
          electionSymbol: x.candidateElectionSymbol,
          candidate: {
            firstName: x.candidateFirstName,
            lastName: x.candidateLastName,
            answers: {
              // Important! Merge with the existing answers.
              cuucnobngt536gysyjyxwjux: {
                info: {
                  en: x.candidateOccupation,
                  fi: x.candidateOccupation,
                  sv: x.candidateOccupation,
                },
                value: null,
              },
              h9ideiy9aijavtzwlyo19ykp: {
                info: {
                  en: x.candidateHomeMunicipalityFi,
                  fi: x.candidateHomeMunicipalityFi,
                  sv: x.candidateHomeMunicipalitySv,
                },
                value: null,
              },
              g859ggb3qdecapyb0j251ysr: {
                info: {
                  en: x.candidateFirstName,
                  fi: x.candidateFirstName,
                  sv: x.candidateFirstName,
                },
                value: null,
              },
            },
          },
        }))
      )
    );
  }, [selectedElection, JSON.stringify(electionNominations), JSON.stringify(file)]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // TODO: Loop through `preview` and actually update the confirmed candidates.
      }}
    >
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
                setFile(parseCSV(e.target?.result as string));
              };
              reader.readAsText(file, 'ISO-8859-1');
            }}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>File</Field.Label>
          <JSONInput
            value={file ? JSON.stringify(file, null, 2) : ''}
            height="20rem"
            maxWidth="80vw"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Preview</Field.Label>
          <JSONInput
            value={preview ? JSON.stringify(preview, null, 2) : ''}
            height="20rem"
            maxWidth="80vw"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Output</Field.Label>
          <JSONInput value={'TODO'} height="20rem" maxWidth="80vw" />
        </Field.Root>
        <Button type="submit" startIcon={<Upload />}>
          Import
        </Button>
      </Flex>
    </form>
  );
}
