import { Button, Field, Flex, JSONInput, Typography } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import { ReactElement, useEffect, useState } from 'react';
import { findData, importData } from '../api/data';

const QUESTION_IDS = {
  occupation: 'cuucnobngt536gysyjyxwjux',
  homeMunicipality: 'h9ideiy9aijavtzwlyo19ykp',
  nickname: 'g859ggb3qdecapyb0j251ysr',
} as const;

type LocalizedString = Record<string, string>;

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
  name: LocalizedString;
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
    answers: Record<typeof QUESTION_IDS.nickname, { value: string } | undefined> | null; // Nickname
  } | null;
  election: {
    documentId: string;
    name: LocalizedString;
  };
  constituency: {
    documentId: string;
    externalId: string;
    name: LocalizedString;
  };
};

type MappedNomination = {
  _electionName: string;
  _constituencyName: string;
  documentId: string;
  constituency?: {
    externalId: string;
  };
  electionSymbol?: string;
  unconfirmed: boolean;
  party?: {
    externalId: string;
  };
  candidate: {
    _bankFirstName?: string;
    _bankLastName?: string;
    documentId: string;
    firstName: string;
    lastName: string;
    answers?: Record<
      typeof QUESTION_IDS.occupation | typeof QUESTION_IDS.homeMunicipality,
      {
        value: LocalizedString;
      }
    >;
  };
};

/**
 * Used to override the candidate names when matching names to the CSV data.
 */
type NameOverrides = {
  [candidateDocumentId: string]: {
    useFirstName?: string;
    useLastName?: string;
  };
};

type UpdateResult = {
  error?: string;
  updatedNominationsCount: number;
  unconfirmedNominationsCount: number;
  unconfirmedCandidates: Array<{
    documentId: string;
    firstName: string;
    lastName: string;
    election: string;
    constituency: string;
  }>;
  updatedCandidates: Array<string>;
};

/**
 * Strip all confusing elements from a string for fuzzy matching.
 */
function normalize(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 *
 * Validates the content of a CSV candidate nominator file and picks relevant nomination data
 * @param content - The content of a CSV candidate nominator file
 * @returns An object with relevant nomination data `CsvNomination`
 */
async function parseCSV(content: string): Promise<FileValidationResult> {
  try {
    // Get parties and constituencies, so we can validate their external IDs
    const partyData = await findData({
      collection: 'parties',
      filters: {},
    });
    if (partyData.type !== 'success' || !partyData.data)
      throw new Error(`Failed to fetch parties: ${partyData.cause ?? ''}`);
    const partyMap = new Map(partyData.data.map((o) => [o.externalId, o]));

    const constituencyData = await findData({
      collection: 'constituencies',
      filters: {},
    });
    if (constituencyData.type !== 'success' || !constituencyData.data)
      throw new Error(`Failed to fetch constituencies: ${constituencyData.cause ?? ''}`);
    const constituencyMap = new Map(constituencyData.data.map((o) => [o.externalId, o]));

    // Process CSV data
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return {
        isValid: false,
        errors: ['The file is empty.'],
        data: [],
      };
    }

    const data: Array<CsvNomination> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const columns = line.split(';').map((column) => column.trim());

      if (!columns.filter(Boolean).length) {
        // Skip empty rows
        continue;
      }

      const electionType = columns[0];
      let countyExternalId = columns[1];
      let municipalityExternalId = columns[2];
      const partyExternalId = `party-${columns[7].replace(/^0+/, '').padStart(4, '0')}`;
      const candidateFirstName = columns[17];
      const candidateLastName = columns[18];
      const candidateElectionSymbol = columns[14].replace(/^0+/, '');
      const candidateOccupation = columns[21];
      const candidateHomeMunicipalityFi = columns[23];
      const candidateHomeMunicipalitySv = columns[24];

      const lineErrors: Array<string> = [];

      // Validate election type (should be either AV or K)
      if (electionType !== 'AV' && electionType !== 'K')
        lineErrors.push(`Invalid election type: "${electionType}"`);

      // Validate county (should be a number or ***)
      if (electionType === 'AV' && countyExternalId !== '***') {
        countyExternalId = `county-${countyExternalId.replace(/^0+/, '').padStart(2, '0')}`;
        if (!constituencyMap.has(countyExternalId))
          lineErrors.push(`Could not find county: "${countyExternalId}"`);
      }

      // Validate municipality (should be a number or ***)
      if (electionType === 'K' && municipalityExternalId !== '***') {
        municipalityExternalId = `municipality-${municipalityExternalId.replace(/^0+/, '').padStart(3, '0')}`;
        if (!constituencyMap.has(municipalityExternalId))
          lineErrors.push(`Could not find municipality: "${municipalityExternalId}"`);
      }

      // Validate standard party number (should be a number)
      if (!partyMap.has(partyExternalId)) {
        lineErrors.push(`Could not find party: "${partyExternalId}"`);
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
            `Line ${i + 1} (${candidateFirstName} ${candidateLastName}): ${lineErrors.join(', ')}`,
          ],
          data: [],
        };
      }

      data.push({
        constituencyExternalId:
          electionType === 'AV'
            ? countyExternalId
            : electionType === 'K'
              ? municipalityExternalId
              : '-',
        partyExternalId,
        candidateFirstName,
        candidateLastName,
        candidateElectionSymbol,
        candidateOccupation,
        candidateHomeMunicipalityFi,
        candidateHomeMunicipalitySv,
      });
    }

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
 * @param overrides - Name overrides which can be used to override the names used to find matches in the CSV file
 * @returns Unconfirmed nominations mapped to confirmed nominations.
 */
function lookupNominations(
  unconfirmedNominations: Array<{
    documentId: string;
    election: {
      name: LocalizedString;
    };
    constituency: {
      documentId: string;
      externalId: string;
      name: LocalizedString;
    };
    candidate: {
      documentId: string;
      firstName: string;
      lastName: string;
      answers: Record<typeof QUESTION_IDS.nickname, { value: string } | undefined> | null; // Nickname
    } | null;
  }>,
  confirmedNominations: Array<{
    constituency: { externalId: string };
    electionSymbol: string;
    party: { externalId: string };
    candidate: {
      firstName: string;
      lastName: string;
      answers: Record<
        typeof QUESTION_IDS.occupation | typeof QUESTION_IDS.homeMunicipality,
        {
          value: LocalizedString;
        }
      >;
    };
  }>,
  overrides: NameOverrides | null
): Array<MappedNomination | { error: string }> {
  // Build the nominations
  const confirmedMap = new Map<
    string,
    Map<string, Map<string, (typeof confirmedNominations)[number]>>
  >();

  // Populate the map: { constituencyId -> { firstName -> { lastName -> confirmedNomination } } }

  // We'll use these to delete ambiguous nominations, because we cannot automatically use them
  const duplicates = new Array<{
    externalId: string;
    firstName: string;
    lastName: string;
  }>();

  const output: Array<MappedNomination | { error: string }> = [];

  for (const nomination of confirmedNominations) {
    const { externalId } = nomination.constituency;
    const firstName = normalize(nomination.candidate.firstName)
      .replace(/[(["].*?[)\]"]/, '') // Drop nicknames
      .trim();
    const lastName = normalize(nomination.candidate.lastName);

    if (!confirmedMap.has(externalId)) {
      confirmedMap.set(externalId, new Map());
    }

    if (!confirmedMap.get(externalId)!.has(firstName)) {
      confirmedMap.get(externalId)!.set(firstName, new Map());
    }

    if (confirmedMap.get(externalId)!.get(firstName)!.get(lastName)) {
      duplicates.push({
        externalId,
        firstName,
        lastName,
      });
      output.push({
        error: `Duplicate nomination found in ${externalId}: ${firstName} ${lastName}`,
      });
      continue;
    }
    confirmedMap.get(externalId)!.get(firstName)!.set(lastName, nomination);
  }

  // Remove duplicates from the confirmed map
  for (const { externalId, firstName, lastName } of duplicates) {
    confirmedMap.get(externalId)!.get(firstName)!.delete(lastName);
  }

  for (const { documentId, election, constituency, candidate } of unconfirmedNominations) {
    if (candidate === null) continue;

    // Apply overrides if available
    const candidateId = candidate.documentId;
    const firstName = overrides?.[candidateId]?.useFirstName || candidate.firstName;
    const lastName = overrides?.[candidateId]?.useLastName || candidate.lastName;

    // Add names split into parts and whole and also provide them swapped
    const tests = [normalize(firstName)]
      .map((n) => [n, n.split(/[\s,-]+/), n.replace(/-+/, ' ')])
      .flat(99)
      .map((fn) =>
        [normalize(lastName)]
          .map((n) => [n, n.split(/[\s,-]+/), n.replace(/-+/, ' ')])
          .flat(99)
          .map((ln) => [
            { firstName: fn, lastName: ln },
            { firstName: ln, lastName: fn },
          ])
      )
      .flat(99);

    const matches = tests
      .map((test) =>
        confirmedMap
          .get(constituency.externalId)
          ?.get(test.firstName.toLowerCase())
          ?.get(test.lastName.toLowerCase())
      )
      .filter((c) => c !== undefined);

    const confirmed =
      // In case of multiple matches, check whether they refer to the same nomination
      matches.length === 1 || new Set(matches).size === 1 ? matches[0] : undefined;

    const nickName = candidate.answers?.[QUESTION_IDS.nickname]?.value;

    output.push({
      _electionName: election.name.fi,
      _constituencyName: constituency.name.fi,
      constituency: {
        externalId: constituency.externalId,
      },
      documentId,
      ...(confirmed
        ? {
            // Data for updating the nomination and candidate:
            electionSymbol: confirmed.electionSymbol,
            unconfirmed: false,
            party: confirmed.party,
            candidate: {
              documentId: candidate.documentId,
              // Original Bank ID name:
              _bankFirstName: candidate.firstName,
              _bankLastName: candidate.lastName,
              // CSV name or nickname:
              firstName: nickName || confirmed.candidate.firstName,
              lastName: confirmed.candidate.lastName,
              // Important! Merge with the existing answers.
              answers: confirmed.candidate.answers,
            },
          }
        : {
            unconfirmed: true,
            candidate: {
              documentId: candidate.documentId,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
            },
          }),
    });
  }

  return output;
}

/**
 * Updates the confirmed nominations and candidates based on the results from `lookupNominations`.
 * @param nominations - Mapped nominations from `lookupNominations`
 */
async function updateNominations(
  nominations: Array<MappedNomination | { error: string }>
): Promise<UpdateResult> {
  const out: UpdateResult = {
    updatedNominationsCount: 0,
    unconfirmedNominationsCount: 0,
    unconfirmedCandidates: [],
    updatedCandidates: [],
  };
  try {
    for (const n of nominations) {
      if ('error' in n) continue;
      if (n.unconfirmed) {
        out.unconfirmedNominationsCount++;
        out.unconfirmedCandidates.push({
          election: n._electionName,
          constituency: n._constituencyName,
          ...n.candidate,
        });
        continue;
      }
      if (!n.candidate.answers || !n.electionSymbol || !n.party)
        throw new Error(
          `Missing required fields: answers ${n.candidate.answers} • electionSymbol ${n.electionSymbol} • party ${n.party}`
        );
      const result = await importData({
        candidates: [
          {
            documentId: n.candidate.documentId,
            firstName: n.candidate.firstName,
            lastName: n.candidate.lastName,
            answers: n.candidate.answers,
          },
        ],
        nominations: [
          {
            documentId: n.documentId,
            party: { externalId: n.party.externalId },
            electionSymbol: n.electionSymbol,
            unconfirmed: false,
          },
        ],
      });
      if (result.type !== 'success')
        throw new Error(`Failed to update nomination ${n.documentId}: ${result.cause}`);
      out.updatedNominationsCount++;
      out.updatedCandidates.push(n.candidate.documentId);
    }
  } catch (e) {
    out.error = `Failed to update nominations: ${e instanceof Error ? e.message : e}`;
  }
  return out;
}

export function CandidateNominatorFileImport(): ReactElement {
  const [elections, setElections] = useState<Array<Election>>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');

  const [electionNominations, setElectionNominations] = useState<Array<Nomination>>([]);

  const [file, setFile] = useState<FileValidationResult | null>(null);
  const [preview, setPreview] = useState<
    Array<MappedNomination | { error: string }> | { error: string } | null
  >(null);
  const [overrides, setOverrides] = useState<NameOverrides | null>(null);
  const [result, setResult] = useState<object | null>(null);

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
              fields: ['documentId', 'firstName', 'lastName', 'answers'],
            },
            election: {
              fields: ['documentId', 'name'],
            },
            constituency: true,
          },
        });
        if (result.type === 'success' && result.data) {
          setElectionNominations(result.data as unknown as Array<Nomination>);
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
              [QUESTION_IDS.occupation]: {
                value: {
                  en: x.candidateOccupation,
                  fi: x.candidateOccupation,
                  sv: x.candidateOccupation,
                },
              },
              [QUESTION_IDS.homeMunicipality]: {
                value: {
                  en: x.candidateHomeMunicipalityFi,
                  fi: x.candidateHomeMunicipalityFi,
                  sv: x.candidateHomeMunicipalitySv,
                },
              },
            },
          },
        })),
        overrides
      )
    );
  }, [
    selectedElection,
    JSON.stringify(electionNominations),
    JSON.stringify(overrides),
    JSON.stringify(file),
  ]);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!preview || 'error' in preview) return;
        const res = await updateNominations(preview);
        setResult(res);
      }}
    >
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="epsilon">
          <Flex direction="column" gap={3} alignItems="stretch">
            <p>
              Upload a candidate list from https://tulospalvelu.vaalit.fi/fi/index.html to confirm
              candidate nominations (supports AV and K election types). This implementation is
              specific to the 2025 Finnish local elections and contains some hard-coded variables
              related to that specific instance.
            </p>
            <p>
              Overrides can be used to supply a candidate-documentId-indexed set of useFirstName and
              useLastName values which are used for matching to the CSV data instead of the actual
              candidate properties. E.g.
              <code>
                {'{'} "tvkk4vgjok8o2349ub3jlpsf": {'{'} "useFirstName": "Foo", "useLastName": "Bar"{' '}
                {'}'}
              </code>
            </p>
            <p>
              NB. The current logic does not use the candidate’s age for disambiguation. Support for
              that should be added in the future.
            </p>
            <p>
              NB. The nominations will be confirmed one-by-one and not inside a transaction. On
              subsequent runs, however, already confirmed nominations will be bypassed.
            </p>
          </Flex>
        </Typography>
        <Field.Root>
          <Field.Label>Overiddes</Field.Label>
          <JSONInput
            value={''}
            onChange={(v: string) => setOverrides(JSON.parse(v))}
            height="20rem"
            maxWidth="80vw"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Election</Field.Label>
          <select value={selectedElection} onChange={(e) => setSelectedElection(e.target.value)}>
            <option value="" disabled>
              Select an election
            </option>
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
              reader.onload = async (e) => {
                const result = await parseCSV(e.target?.result as string);
                setFile(result);
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
          <Field.Label>Preview (editing this will NOT have any effect)</Field.Label>
          <JSONInput
            value={preview ? JSON.stringify(preview, null, 2) : ''}
            height="20rem"
            maxWidth="80vw"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Result</Field.Label>
          <JSONInput
            value={result ? JSON.stringify(result, null, 2) : ''}
            height="20rem"
            maxWidth="80vw"
          />
        </Field.Root>
        <Button type="submit" startIcon={<Upload />}>
          Import
        </Button>
      </Flex>
    </form>
  );
}
