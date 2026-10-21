/**
 * Existing-candidate lookup, creation and deletion tests.
 *
 * The lookup finds the candidate through the identity's candidate-editor grant, then reads that candidate from a `candidates` table that carries a project foreign key. It runs on a service-role client that bypasses row-level security entirely, so every filter the queries omit is a filter nothing else supplies. These cases state the properties that follow from that: the grant query names the user, the scope, the target type and the role; the candidates query names the project the deployment serves; and a failed query is a throw rather than a value indistinguishable from "no candidate here".
 *
 * The clients are hand-built fakes rather than a mocking library. The lookup fake records the tables it was asked for, the columns selected and every `eq` and `in` filter applied, resolves the grants query as a thenable with a value each case controls, and answers `maybeSingle()` on the candidates query with another. Recorded filters are asserted BY CONTENT and never by position: the builder is a chain, and the order of two independent filters is not a property worth pinning.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createCandidate, deleteCandidate, findExistingCandidate } from './candidateRecord';
import type { CandidateCreateClient, CandidateDeleteClient, CandidateLookupClient } from './candidateRecord';

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const OTHER_PROJECT_ID = '00000000-0000-0000-0000-0000000000bb';
const AUTH_USER_ID = '11111111-1111-1111-1111-111111111111';
const GRANTED_ID = '22222222-2222-2222-2222-222222222222';
const SECOND_GRANTED_ID = '44444444-4444-4444-4444-444444444444';

/** One filter the fake observed, with the table whose chain it was applied to. */
interface RecordedFilter {
  table: string;
  method: 'eq' | 'in';
  column: string;
  value: unknown;
}

/** What one drive of the lookup fake observed: the tables asked for, the column lists selected per table, every filter applied, and the tables whose chain ended in `maybeSingle()`. */
interface Recording {
  tables: Array<string>;
  selects: Array<[string, string]>;
  filters: Array<RecordedFilter>;
  maybeSingleOn: Array<string>;
}

/** What the grants query resolves to when awaited. */
interface GrantsResult {
  data: Array<{ target_id: string }> | null;
  error: { message: string } | null;
}

/** The shape `maybeSingle()` resolves to: PostgREST answers a zero-row read as `{ data: null, error: null }` and populates `error` for a transport failure or for two or more matching rows. */
interface MaybeSingleResult {
  data: { id: string } | null;
  error: { message: string } | null;
}

/** What each of the lookup's two queries resolves to in one case. */
interface LookupResults {
  grants: GrantsResult;
  candidates?: MaybeSingleResult;
}

/**
 * A recording client serving both tables the lookup reads.
 *
 * Every builder returns itself from `eq` and `in`, so a chain of any length is accepted. Awaiting a builder resolves to `grants`; calling `maybeSingle()` resolves to `candidates`. What a case reads afterwards is the recording, not the builder.
 * @param results - What the grants query and the candidates query resolve to.
 * @returns The client to pass to the lookup, and the recording it fills in.
 */
function recordingClient(results: LookupResults): { client: CandidateLookupClient; recorded: Recording } {
  const recorded: Recording = { tables: [], selects: [], filters: [], maybeSingleOn: [] };
  const candidates = results.candidates ?? { data: null, error: null };

  function builderFor(table: string) {
    const builder = {
      eq(column: string, value: string) {
        recorded.filters.push({ table, method: 'eq', column, value });
        return builder;
      },
      in(column: string, values: Array<string>) {
        recorded.filters.push({ table, method: 'in', column, value: values });
        return builder;
      },
      maybeSingle(): Promise<MaybeSingleResult> {
        recorded.maybeSingleOn.push(table);
        return Promise.resolve(candidates);
      },
      then<TResult1 = GrantsResult, TResult2 = never>(
        onfulfilled?: ((value: GrantsResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
      ): Promise<TResult1 | TResult2> {
        return Promise.resolve(results.grants).then(onfulfilled, onrejected);
      }
    };
    return builder;
  }

  const client = {
    from(table: string) {
      recorded.tables.push(table);
      return {
        select(columns: string) {
          recorded.selects.push([table, columns]);
          return builderFor(table);
        }
      };
    }
  };

  return { client: client as unknown as CandidateLookupClient, recorded };
}

/** The four filters that make a grants row a candidate-editor grant held by the user. */
const GRANT_FILTERS: Array<RecordedFilter> = [
  { table: 'grants', method: 'eq', column: 'user_id', value: AUTH_USER_ID },
  { table: 'grants', method: 'eq', column: 'scope', value: 'entity' },
  { table: 'grants', method: 'eq', column: 'target_type', value: 'candidate' },
  { table: 'grants', method: 'eq', column: 'role', value: 'editor' }
];

describe('findExistingCandidate', () => {
  it('reads the target ids of the user’s candidate-editor grants', async () => {
    const { client, recorded } = recordingClient({ grants: { data: [], error: null } });

    await findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.selects).toEqual(expect.arrayContaining([['grants', 'target_id']]));
    expect(recorded.filters).toEqual(expect.arrayContaining(GRANT_FILTERS));
  });

  it('reads the granted candidate in the served project only, as at most one row', async () => {
    // The defect this asserts against: grants carry no project, and one identity may hold candidates in several projects, so a candidates query filtered only on the granted ids would adopt a candidate belonging to a project this deployment does not serve.
    const { client, recorded } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }], error: null },
      candidates: { data: { id: GRANTED_ID }, error: null }
    });

    await findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.tables).toEqual(['grants', 'candidates']);
    expect(recorded.selects).toEqual(expect.arrayContaining([['candidates', 'id']]));
    expect(recorded.filters).toEqual(
      expect.arrayContaining([
        { table: 'candidates', method: 'eq', column: 'project_id', value: PROJECT_ID },
        { table: 'candidates', method: 'in', column: 'id', value: [GRANTED_ID] }
      ])
    );
    expect(recorded.maybeSingleOn).toEqual(['candidates']);
  });

  it('carries every granted id and the project id it was given rather than one of its own', async () => {
    const { client, recorded } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }, { target_id: SECOND_GRANTED_ID }], error: null }
    });

    await findExistingCandidate(client, { projectId: OTHER_PROJECT_ID, authUserId: AUTH_USER_ID });

    expect(recorded.filters).toEqual(
      expect.arrayContaining([
        { table: 'candidates', method: 'eq', column: 'project_id', value: OTHER_PROJECT_ID },
        { table: 'candidates', method: 'in', column: 'id', value: [GRANTED_ID, SECOND_GRANTED_ID] }
      ])
    );
    expect(recorded.filters).not.toEqual(
      expect.arrayContaining([{ table: 'candidates', method: 'eq', column: 'project_id', value: PROJECT_ID }])
    );
  });

  it('returns the row when the lookup found one', async () => {
    const { client } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }], error: null },
      candidates: { data: { id: GRANTED_ID }, error: null }
    });

    await expect(findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })).resolves.toEqual({
      id: GRANTED_ID
    });
  });

  it('returns null without reading candidates when the user holds no candidate-editor grant, the ordinary first-registration case', async () => {
    // Zero grants is not an error and must not become one: a first-time bank-auth registrant has no candidate yet, and creating one is the correct next step.
    const { client, recorded } = recordingClient({ grants: { data: [], error: null } });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).resolves.toBeNull();
    expect(recorded.tables).toEqual(['grants']);
  });

  it('treats a null grants answer like an empty one', async () => {
    const { client, recorded } = recordingClient({ grants: { data: null, error: null } });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).resolves.toBeNull();
    expect(recorded.tables).toEqual(['grants']);
  });

  it('returns null when no granted candidate is in the served project', async () => {
    const { client } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }], error: null },
      candidates: { data: null, error: null }
    });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).resolves.toBeNull();
  });

  it('rejects, without reading candidates, when the grants query reported an error', async () => {
    // A returned null would be indistinguishable from "no candidate in this project" and would send the caller into its insert branch, writing a second candidate for an identity that already has one.
    const { client, recorded } = recordingClient({ grants: { data: null, error: { message: 'connection reset' } } });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_LOOKUP_FAILED' });
    expect(recorded.tables).toEqual(['grants']);
  });

  it('rejects when the candidates query reported a transport error', async () => {
    const { client } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }], error: null },
      candidates: { data: null, error: { message: 'connection reset' } }
    });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_LOOKUP_FAILED' });
  });

  it('rejects when two granted candidates sit in the served project', async () => {
    // `maybeSingle()` reports two matching rows as an error. Picking one would be a silent choice between two candidates the identity edits.
    const { client } = recordingClient({
      grants: { data: [{ target_id: GRANTED_ID }, { target_id: SECOND_GRANTED_ID }], error: null },
      candidates: { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } }
    });

    await expect(
      findExistingCandidate(client, { projectId: PROJECT_ID, authUserId: AUTH_USER_ID })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_LOOKUP_FAILED' });
  });

  const FAILING_QUERIES: Array<[string, LookupResults]> = [
    ['the grants query', { grants: { data: null, error: { message: 'connection reset' } } }],
    [
      'the candidates query',
      {
        grants: { data: [{ target_id: GRANTED_ID }], error: null },
        candidates: { data: null, error: { message: 'connection reset' } }
      }
    ]
  ];

  it.each(FAILING_QUERIES)(
    'names the client-reported failure of %s and nothing about the deployment in the thrown message',
    async (_label, results) => {
      // This endpoint is served without JWT verification and the handler's outer catch answers every throw with a fixed literal, so a message carrying the configured project or the auth user would hand an unauthenticated caller deployment configuration through a log or a future error path.
      const { client } = recordingClient(results);

      const rejection = (await findExistingCandidate(client, {
        projectId: PROJECT_ID,
        authUserId: AUTH_USER_ID
      }).catch((error: unknown) => error)) as Error;

      expect(rejection).toBeInstanceOf(Error);
      expect(rejection.message).toMatch(/candidate lookup failed/i);
      expect(rejection.message).toContain('connection reset');
      expect(rejection.message).not.toContain(PROJECT_ID);
      expect(rejection.message).not.toContain(AUTH_USER_ID);
    }
  );
});

/**
 * The entry point READ AS TEXT, not imported.
 *
 * `index.ts` holds a remote import and the Deno runtime global, so vitest cannot import it and a text read is the only instrument available. It is deliberately the SECOND instrument here: the cases above prove the helpers are correct, and this one proves the helpers are still the route the entry point takes. Neither is worth much without the other, because a correct helper nobody calls closes nothing.
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

/** What one drive of the deletion fake observed: the tables asked for, how many deletes were issued, and every equality filter applied. */
interface DeleteRecording {
  tables: Array<string>;
  deletes: number;
  filters: Array<[string, string]>;
}

/** What an awaited delete chain resolves to. */
interface DeleteResult {
  error: { message: string } | null;
}

/**
 * A recording client whose `delete()` chain resolves to `{ error }` when awaited.
 *
 * @param error - What the delete reports.
 * @returns The client to pass to the deletion, and the recording it fills in.
 */
function recordingDeleteClient(error: DeleteResult['error']): {
  client: CandidateDeleteClient;
  recorded: DeleteRecording;
} {
  const recorded: DeleteRecording = { tables: [], deletes: 0, filters: [] };

  const builder = {
    eq(column: string, value: string) {
      recorded.filters.push([column, value]);
      return builder;
    },
    then<TResult1 = DeleteResult, TResult2 = never>(
      onfulfilled?: ((value: DeleteResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      return Promise.resolve({ error }).then(onfulfilled, onrejected);
    }
  };

  const client = {
    from(table: string) {
      recorded.tables.push(table);
      return {
        delete() {
          recorded.deletes += 1;
          return builder;
        }
      };
    }
  };

  return { client: client as unknown as CandidateDeleteClient, recorded };
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

describe('the identity-callback entry point reaches the candidates table only through the helper', () => {
  it('calls findExistingCandidate, createCandidate and deleteCandidate, all imported from the helper module', () => {
    // The instrument first. A read that silently returned an empty string would make every absence assertion below pass forever, so the presence of something the file is known to contain is asserted before anything is asserted about what it does not contain.
    expect(ENTRY_POINT_SOURCE).toContain('findExistingCandidate(');
    expect(ENTRY_POINT_SOURCE).toContain('createCandidate(');
    expect(ENTRY_POINT_SOURCE).toContain('deleteCandidate(');
    expect(ENTRY_POINT_SOURCE).toContain("from './candidateRecord.ts'");
  });

  it('holds no candidates chain of its own at all', () => {
    // Every candidates query this function issues is one of those in the helper module, each of which is driven by a fake and asserted by content above. A chain here is a query outside that coverage.
    const chains = candidatesChains();

    expect(
      chains,
      `${ENTRY_POINT_PATH} issues a candidates query of its own. Candidate queries belong in candidateRecord.ts, where a fake-driven test can observe the row and the filters; a chain here can only ever be checked against source text. Offending excerpt(s):\n${chains.join('\n---\n')}`
    ).toEqual([]);
  });

  it('names the project on every candidates query the helper module issues', () => {
    // Scanned over a population floored above zero, so an empty answer cannot come from a read that found nothing.
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
  // The whole written row, compared strictly so that an extra key, even one holding `undefined`, fails. A row that dropped the project foreign key, wrote the name parts to the wrong columns, or carried a column beyond these four is a defect this asserts against as surely as a missing flag.
  it('writes exactly the name parts, the project and the confirmation flag', async () => {
    const { client, recorded } = recordingCreateClient({ data: { id: CREATED_ID }, error: null });

    const created = await createCandidate(client, {
      projectId: PROJECT_ID,
      firstName: 'Given',
      lastName: 'Family'
    });

    expect(created).toEqual({ id: CREATED_ID });
    expect(recorded.tables).toEqual(['candidates']);
    expect(recorded.rows).toHaveLength(1);
    expect(Object.keys(recorded.rows[0]).sort()).toEqual(['confirmed', 'first_name', 'last_name', 'project_id']);
    expect(recorded.rows).toStrictEqual([
      {
        first_name: 'Given',
        last_name: 'Family',
        project_id: PROJECT_ID,
        confirmed: true
      }
    ]);
  });

  // Stated as its own case, because it is the property a later edit is most likely to drop while leaving every other assertion above green.
  it('writes the confirmation flag as true and never as false or absent', async () => {
    const { client, recorded } = recordingCreateClient({ data: { id: CREATED_ID }, error: null });

    await createCandidate(client, {
      projectId: PROJECT_ID,
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
        firstName: 'Given',
        lastName: 'Family'
      })
    ).rejects.toMatchObject({ code: 'ERR_CANDIDATE_CREATE_FAILED' });
  });
});

describe('deleteCandidate', () => {
  it('deletes the candidate by its id within the served project', async () => {
    const { client, recorded } = recordingDeleteClient(null);

    await expect(deleteCandidate(client, { projectId: PROJECT_ID, candidateId: CREATED_ID })).resolves.toBeUndefined();

    expect(recorded.tables).toEqual(['candidates']);
    expect(recorded.deletes).toBe(1);
    expect(recorded.filters).toEqual(
      expect.arrayContaining([
        ['id', CREATED_ID],
        ['project_id', PROJECT_ID]
      ])
    );
  });

  it('carries the project id it was given rather than one of its own', async () => {
    const { client, recorded } = recordingDeleteClient(null);

    await deleteCandidate(client, { projectId: OTHER_PROJECT_ID, candidateId: CREATED_ID });

    expect(recorded.filters).toEqual(expect.arrayContaining([['project_id', OTHER_PROJECT_ID]]));
    expect(recorded.filters).not.toEqual(expect.arrayContaining([['project_id', PROJECT_ID]]));
  });

  it('rejects with the client-reported text only when the delete fails', async () => {
    const { client } = recordingDeleteClient({ message: 'delete exploded' });

    const rejection = (await deleteCandidate(client, { projectId: PROJECT_ID, candidateId: CREATED_ID }).catch(
      (error: unknown) => error
    )) as Error & { code?: string };

    expect(rejection).toBeInstanceOf(Error);
    expect(rejection).toMatchObject({ code: 'ERR_CANDIDATE_DELETE_FAILED' });
    expect(rejection.message).toContain('delete exploded');
    expect(rejection.message).not.toContain(PROJECT_ID);
  });
});
