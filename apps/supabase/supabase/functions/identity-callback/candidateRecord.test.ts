/**
 * Existing-candidate lookup AND creation tests.
 *
 * The lookup runs against a `candidates` table that carries a project foreign key, using a service-role client that bypasses row-level security entirely, so every filter the query omits is a filter nothing else supplies. These cases state the two properties that follow from that: the query names the project the deployment serves, and a failed query is a throw rather than a value indistinguishable from "no candidate here".
 *
 * The client is a hand-built fake rather than a mocking library. It records the table it was asked for, the columns selected and every equality filter applied, and answers `maybeSingle()` with a value each case controls. Recorded filters are asserted BY CONTENT and never by position: the builder is a chain, and the order of two independent equality filters is not a property worth pinning.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createCandidate, findExistingCandidate } from './candidateRecord';
import type { CandidateCreateClient, CandidateLookupClient } from './candidateRecord';

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const OTHER_PROJECT_ID = '00000000-0000-0000-0000-0000000000bb';
const AUTH_USER_ID = '11111111-1111-1111-1111-111111111111';

/** What one drive of the fake client observed: the tables asked for, the column lists selected, and every equality filter applied, in the order each was recorded. */
interface Recording {
  tables: Array<string>;
  selects: Array<string>;
  filters: Array<[string, string]>;
}

/** The shape `maybeSingle()` resolves to: PostgREST answers a zero-row read as `{ data: null, error: null }` and populates `error` for a transport failure or for two or more matching rows. */
interface MaybeSingleResult {
  data: { id: string } | null;
  error: { message: string } | null;
}

/**
 * A recording client that answers `maybeSingle()` with `result`.
 *
 * The builder returns itself from `eq` so a chain of any length is accepted; what the test reads afterwards is the recording, not the builder.
 * @param result - The value `maybeSingle()` resolves to.
 * @returns The client to pass to the lookup, and the recording it fills in.
 */
function recordingClient(result: MaybeSingleResult): { client: CandidateLookupClient; recorded: Recording } {
  const recorded: Recording = { tables: [], selects: [], filters: [] };

  const builder = {
    eq(column: string, value: string) {
      recorded.filters.push([column, value]);
      return builder;
    },
    maybeSingle(): Promise<MaybeSingleResult> {
      return Promise.resolve(result);
    }
  };

  const client = {
    from(table: string) {
      recorded.tables.push(table);
      return {
        select(columns: string) {
          recorded.selects.push(columns);
          return builder;
        }
      };
    }
  };

  return { client: client as unknown as CandidateLookupClient, recorded };
}

describe('findExistingCandidate', () => {
  it('reads the candidates table and selects the id column', async () => {
    const { client, recorded } = recordingClient({ data: null, error: null });

    await findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.tables).toEqual(['candidates']);
    expect(recorded.selects).toEqual(['id']);
  });

  it('applies both the project filter and the auth user filter', async () => {
    // The defect this asserts against: an auth user id is unique within Supabase auth but a candidates row carrying it is not unique across projects, so a lookup filtered only on the user would adopt a candidate belonging to a project this deployment does not serve.
    const { client, recorded } = recordingClient({ data: null, error: null });

    await findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.filters).toEqual(
      expect.arrayContaining([
        ['project_id', PROJECT_ID],
        ['auth_user_id', AUTH_USER_ID]
      ])
    );
  });

  it('carries the project id it was given rather than one of its own', async () => {
    const { client, recorded } = recordingClient({ data: null, error: null });

    await findExistingCandidate(client, { projectId: OTHER_PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.filters).toEqual(expect.arrayContaining([['project_id', OTHER_PROJECT_ID]]));
    expect(recorded.filters).not.toEqual(expect.arrayContaining([['project_id', PROJECT_ID]]));
  });

  it('returns the row when the lookup found one', async () => {
    const { client } = recordingClient({ data: { id: 'candidate-1' }, error: null });

    await expect(findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })).resolves.toEqual({
      id: 'candidate-1'
    });
  });

  it('returns null when the lookup found nothing, the ordinary first-registration case', async () => {
    // Zero rows is not an error and must not become one: a first-time bank-auth registrant has no candidates row yet, and creating one is the correct next step.
    const { client } = recordingClient({ data: null, error: null });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).resolves.toBeNull();
  });

  it('rejects when the lookup reported an error rather than returning null', async () => {
    // A returned null would be indistinguishable from "no candidate in this project" and would send the caller into its insert branch, writing a second candidates row and a second role assignment for an identity that already has both.
    const { client } = recordingClient({ data: null, error: { message: 'connection reset' } });

    await expect(findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })).rejects.toThrow(
      /candidate lookup failed/i
    );
  });

  it('names the client-reported failure and nothing about the deployment in the thrown message', async () => {
    // This endpoint is served without JWT verification and the handler's outer catch answers every throw with a fixed literal, so a message carrying the configured project or the auth user would hand an unauthenticated caller deployment configuration through a log or a future error path.
    const { client } = recordingClient({ data: null, error: { message: 'connection reset' } });

    const rejection = await findExistingCandidate(client, {
      projectId: PROJECT_ID,
      authUserId: AUTH_USER_ID
    }).catch((error: unknown) => error as Error);

    expect(rejection).toBeInstanceOf(Error);
    expect(rejection.message).toContain('connection reset');
    expect(rejection.message).not.toContain(PROJECT_ID);
    expect(rejection.message).not.toContain(AUTH_USER_ID);
  });
});

/**
 * The entry point READ AS TEXT, not imported.
 *
 * `index.ts` holds a remote import and the Deno runtime global, so vitest cannot import it and a text read is the only instrument available. It is deliberately the SECOND instrument here: the cases above prove the helper is correct, and this one proves the helper is still the route the entry point takes. Neither is worth much without the other, because a correct helper nobody calls closes nothing.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY_POINT_PATH = resolve(HERE, 'index.ts');
const ENTRY_POINT_SOURCE = readFileSync(ENTRY_POINT_PATH, 'utf8');

/** The id the fake insert answers with, so the returned value is asserted rather than assumed to be whatever was passed in. */
const CREATED_ID = '33333333-3333-3333-3333-333333333333';

/** What one drive of the creation fake observed: the tables asked for and the rows handed to `insert`. */
interface CreateRecording {
  tables: Array<string>;
  rows: Array<Record<string, unknown>>;
}

/**
 * A recording client whose `insert(...).select(...).single()` resolves to `result`.
 *
 * Hand-built rather than mocked, in the shape `entityGrant.test.ts` uses for the same reason: the module under test declares its own narrow client interface so it needs no import, and a fake that satisfies that interface is the only thing that can observe the row it writes.
 * @param result - What `single()` resolves to.
 * @returns The client to pass to the creation, and the recording it fills in.
 */
function recordingCreateClient(result: { data: { id: string } | null; error: { message: string } | null }): {
  client: CandidateCreateClient;
  recorded: CreateRecording;
} {
  const recorded: CreateRecording = { tables: [], rows: [] };

  const client = {
    from(table: string) {
      recorded.tables.push(table);
      return {
        insert(row: Record<string, unknown>) {
          recorded.rows.push(row);
          return {
            select() {
              return { single: () => Promise.resolve(result) };
            }
          };
        }
      };
    }
  };

  return { client: client as unknown as CandidateCreateClient, recorded };
}

/** A selection against the candidates table, wherever one appears in the entry point. */
const CANDIDATES_SELECTION = /\.from\(\s*['"`]candidates['"`]\s*\)/g;

/**
 * Every candidates chain in the entry point, each from its `from` call to the statement terminator that ends it.
 *
 * The population is derived by scanning at run time rather than written down as a count, so adding or removing a candidates query is not by itself a test failure -- only adding one that names no project is.
 * @returns The chains as source excerpts, in the order they appear.
 */
function candidatesChains(): Array<string> {
  const chains: Array<string> = [];
  CANDIDATES_SELECTION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CANDIDATES_SELECTION.exec(ENTRY_POINT_SOURCE)) !== null) {
    const end = ENTRY_POINT_SOURCE.indexOf(';', match.index);
    chains.push(ENTRY_POINT_SOURCE.slice(match.index, end === -1 ? ENTRY_POINT_SOURCE.length : end + 1));
  }
  return chains;
}

describe('the identity-callback entry point resolves BOTH candidate paths through the helper', () => {
  it('calls findExistingCandidate and createCandidate, both imported from the helper module', () => {
    // The instrument first. A read that silently returned an empty string would make every absence assertion below pass forever, so the presence of something the file is known to contain is asserted before anything is asserted about what it does not contain.
    expect(ENTRY_POINT_SOURCE).toContain('findExistingCandidate(');
    expect(ENTRY_POINT_SOURCE).toContain('createCandidate(');
    expect(ENTRY_POINT_SOURCE).toContain("from './candidateRecord.ts'");
  });

  it('holds no candidates chain of its own at all', () => {
    // STRENGTHENED, not weakened. Before 162-07 this file held one inline candidates chain -- the creation insert -- so the property that could be asserted was the weaker "every chain that filters on the auth user also names a project", scanned over a population that had to be floored above zero to mean anything. That insert has now MOVED into `candidateRecord.ts` beside the lookup, so the entry point holds no such chain, and the assertion becomes the stronger emptiness: every candidates query this function issues is one of the two in the helper module, each of which is driven by a fake and asserted by content above. A chain reappearing here is a query that escaped that coverage.
    const chains = candidatesChains();

    expect(
      chains,
      `${ENTRY_POINT_PATH} issues a candidates query of its own. Both candidate paths belong in candidateRecord.ts, where a fake-driven test can observe the row and the filters; a chain here can only ever be checked against source text. Offending excerpt(s):\n${chains.join('\n---\n')}`
    ).toEqual([]);
  });

  it('names the project on every candidates query the helper module issues', () => {
    // The property the moved assertion protected, restated where the queries now live, and over a population floored above zero so an empty answer cannot come from a read that found nothing.
    const helperSource = readFileSync(resolve(HERE, 'candidateRecord.ts'), 'utf8');
    const chains: Array<string> = [];
    const selection = /\.from\(\s*['"`]candidates['"`]\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = selection.exec(helperSource)) !== null) {
      const end = helperSource.indexOf(';', match.index);
      chains.push(helperSource.slice(match.index, end === -1 ? helperSource.length : end + 1));
    }

    expect(chains.length).toBeGreaterThan(0);
    expect(chains.filter((chain) => !chain.includes('project_id'))).toEqual([]);
  });
});

describe('createCandidate', () => {
  // The whole written row, not just the confirmation column. A row that carried the flag and dropped the project foreign key, or wrote the name parts to the wrong columns, is a defect this asserts against as surely as a missing flag.
  it('writes one candidates row carrying the confirmation flag true', async () => {
    const { client, recorded } = recordingCreateClient({ data: { id: CREATED_ID }, error: null });

    const created = await createCandidate(client, {
      projectId: PROJECT_ID,
      authUserId: AUTH_USER_ID,
      firstName: 'Given',
      lastName: 'Family'
    });

    expect(created).toEqual({ id: CREATED_ID });
    expect(recorded.tables).toEqual(['candidates']);
    expect(recorded.rows).toEqual([
      {
        first_name: 'Given',
        last_name: 'Family',
        project_id: PROJECT_ID,
        auth_user_id: AUTH_USER_ID,
        confirmed: true
      }
    ]);
  });

  // Stated as its own case, because it is the single property D-10 turns on and the one a later edit is most likely to drop while leaving every other assertion above green.
  it('writes the confirmation flag as true and never as false or absent', async () => {
    const { client, recorded } = recordingCreateClient({ data: { id: CREATED_ID }, error: null });

    await createCandidate(client, {
      projectId: PROJECT_ID,
      authUserId: AUTH_USER_ID,
      firstName: 'Given',
      lastName: 'Family'
    });

    expect(recorded.rows[0]).toHaveProperty('confirmed', true);
  });

  it('throws rather than returning when the insert fails', async () => {
    const { client } = recordingCreateClient({ data: null, error: { message: 'insert exploded' } });

    await expect(
      createCandidate(client, {
        projectId: PROJECT_ID,
        authUserId: AUTH_USER_ID,
        firstName: 'Given',
        lastName: 'Family'
      })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_CREATE_FAILED' });
  });

  // PostgREST can answer `{ data: null, error: null }`, and a caller reading that as a value would hand a session to an identity with no entity row at all. The null-row case is therefore a throw too, and it is asserted rather than assumed to follow from the case above.
  it('throws when the insert reports no error and returns no row', async () => {
    const { client } = recordingCreateClient({ data: null, error: null });

    await expect(
      createCandidate(client, {
        projectId: PROJECT_ID,
        authUserId: AUTH_USER_ID,
        firstName: 'Given',
        lastName: 'Family'
      })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_CREATE_FAILED' });
  });
});
