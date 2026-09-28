import { describe, expect, it, vi } from 'vitest';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { condenseArguments } from './condenseArguments';
import { generateQuestionInfo } from './generateQuestionInfo';

/**
 * The job-lifetime negative control — two overlapping admin jobs, one shared writer (criterion **C4**, decisions **B4(a)** and **E1(a)**, requirement **D11**).
 *
 * `157.2-01` (wave 1) creates this locus and its apparatus; `157.2-06` fills the two cases, measures the RED against the shared `adminWriter`, lands job-owned adapters, and records both halves in `157.2-NEGATIVE-CONTROL-LEDGER.md` row 3.
 *
 * **New ground, deliberately noted.** Research measured that NO spec of any kind exists anywhere under `src/lib/server/admin/features/`, so there is no sibling to copy a fixture shape from. The shape below comes from the adapter specs instead: module mocks declared through `vi.hoisted` so a test can reconfigure them per case, and a timer-free `deferred()` gate as the only ordering mechanism.
 *
 * ## Why the interleaving point is `await loadElectionData(…)` and nowhere else
 *
 * `condenseArguments` builds its writer once, near the top, and then runs for MINUTES across many questions (facts 11 and 12) — so the rebind window is not the gap between two statements, it is the whole job. `generateQuestionInfo` has the identical shape. The job's own first `await` after that construction is `loadElectionData`, which makes it the only place an interleave can be driven that is both AFTER the construction and BEFORE any writer call. An interleave placed earlier precedes the construction and proves nothing; one placed later is unobservable, because the job has already made the writer calls that would have shown the bleed.
 *
 * ## The observation point, and why it is the error path
 *
 * The mocked `loadElectionData` parks on the gate and then REJECTS. That carries the job into its `catch`, and — for a non-`AbortError` — through `controller.fail(…)` to the job recorder's `insertJobResult`. That call is the FIRST writer call the job makes after it resumes, which is exactly what a post-resume observation needs. Driving the success path instead would require standing up an LLM provider, a question set and a nomination set, none of which bears on the defect.
 *
 * ## How a writer call is attributed to a CREDENTIAL
 *
 * Each logical admin gets a `taggedSource(tag)`: a tagged fetch, a tagged client, and a verified-session helper answering with that admin's own token. `credentialOf` is the ONE reader: handed the source a writer was built from, it reports which credential that writer holds and whether that credential's client can reach the request's session store. A source naming `locals` is by construction the request's own cookie-bearing client, so it reports `request:<tag>` and a live adapter; a source naming a `client` reports that client's own tag and whatever the client carries. The reader is identical in both halves of every control below — what changes between RED and GREEN is which source the JOB hands in, never how the fake reads it. `insertJobResult`'s payload carries `jobId`, so each recorded write names both the job that made it and the credential that carried it.
 *
 * ## Collaborators mocked, and why each one
 *
 * - `$lib/admin/utils/loadElectionData` — the interleaving point itself; parks on the gate, then rejects.
 * - `$lib/api/adminWriter` — the SUBJECT, faked in BOTH shapes at once: the module-scope `adminWriter` with its single configuration slot, and the `createAdminWriter` factory whose every call closes over its own. The fake never changes between the two halves of the control; which shape the job reaches for is the job's own choice, and that choice is the thing under measurement.
 * - `$lib/api/dataProvider` — for `createSupabaseJobClient` alone, the seam through which each job obtains its own credential-bearing client. Faked so the client is an inspectable stub rather than a real one; the real factory's own contract is asserted in `lib/supabase/job.test.ts`, off the object it hands the library.
 * - `../jobs/jobStore` — `getJob` must return a truthy job or the `catch` skips `insertJobResult` entirely and the observation point is never reached; `getAllMessagesFromJob` and `markAborted` are reached from the same path.
 * - `../jobs/pipelineController` — `PipelineController` is constructed on the job's first line and `controller.fail(…)` runs on the error path.
 * - `../../llm/llmProvider`, `@openvaa/argument-condensation` and `@openvaa/question-info` — not reached on the error path, but imported at module load; mocked so importing the two jobs under test costs nothing.
 *
 * ## Ordering discipline
 *
 * The gate is an externally-resolved promise and is the ONLY ordering mechanism this file contains. There is no timer of any kind, no fake-timer harness, no promise-race and no zero-delay scheduling; the literal names of those constructs are deliberately absent, because the plan's acceptance criterion is a grep for them. The parked-then-rejects assertion below is deterministic rather than probabilistic: the promise CANNOT have settled before the gate is opened, so no microtask-queue reasoning is involved.
 */

/** One admin's identity as it rides on a request-scoped fetch. */
type TaggedFetch = { adminTag?: string };

/** What the faked `createSupabaseJobClient` hands back: a credential's name, and whether that credential's client can reach the request's session store. */
type JobClientStub = { credentialTag: string; carriesJarAdapter: boolean };

/** The two source shapes a writer can be built from: the request's own `locals`, or a client the caller supplies. Which one arrives is the job's choice and is the thing under measurement. */
type WriterSource = { fetch: TaggedFetch; client?: JobClientStub };

/** What one recorded writer call reports about the credential it executed under. */
type ObservedCredential = { observedTag: string | undefined; carriesJarAdapter: boolean };

/** The shape both features take: the initiating request's fetch and its locals, whose session helper is this application's one verification path. */
type JobSource = { fetch: Fetch; locals: App.Locals };

/** Mock handles declared through `vi.hoisted` so the factories below can close over them and a case can reconfigure any of them. */
const mocks = vi.hoisted(() => {
  /** Every `insertJobResult` the jobs make, in the order made, each naming the job that made it and the credential the writer carried at that moment. */
  const writes: Array<{ jobId: string; observedTag: string | undefined; carriesJarAdapter: boolean }> = [];

  /** Which job entered its own data load, in order — the driver record that proves the interleaving actually happened. */
  const reached: Array<string> = [];

  /** Every call a job made to the verified-session helper, in order, naming the admin it asked as. The length is what "resolved ONCE at job start" is read off. */
  const resolutions: Array<string> = [];

  /** The module-scope writer's ONE configuration slot: the field a later job's `init` overwrites while an earlier job is still parked. */
  const shared: { tag: string | undefined } = { tag: undefined };

  /** Every `PipelineController` a job constructed, in order, naming the identifier it was constructed with — the observation point for "the guard rejected before any job machinery existed". */
  const constructed: Array<string> = [];

  /**
   * THE ONE READER. Given the source a writer was built from, report which credential that writer holds and whether that credential's client can reach the request's session store.
   *
   * The `locals` arm needs no field of its own to be read: `hooks.server.ts` puts exactly one client there, the cookie-bearing `createServerClient`, so a writer built from that arm holds the initiating REQUEST's credential and an adapter that can write to it. Naming that here rather than reading a property off the stub keeps this file free of the `.supabase` member access the adapter-boundary guard bans outside its allowlist — the attribution is a fact about which arm arrived, not about what someone remembered to tag.
   * @param source - The source the writer was constructed from.
   * @returns The credential that writer will carry on every call it makes.
   */
  function credentialOf(source: WriterSource): ObservedCredential {
    if (source.client)
      return { observedTag: source.client.credentialTag, carriesJarAdapter: source.client.carriesJarAdapter };
    return { observedTag: `request:${source.fetch.adminTag}`, carriesJarAdapter: true };
  }

  /**
   * Record one writer call and answer it the way the real writer would.
   * @param jobId - The job that made the call, read off the payload the job itself built.
   * @param credential - What the writer was holding at the moment of the call.
   * @returns The success result the job's own code branches on.
   */
  function record(jobId: string, credential: ObservedCredential): { type: 'success' } {
    writes.push({ jobId, ...credential });
    return { type: 'success' };
  }

  const insertJobResult = vi.fn(async ({ data }: { data: { jobId: string } }) =>
    record(data.jobId, { observedTag: shared.tag, carriesJarAdapter: true })
  );
  const updateQuestion = vi.fn(async () => ({ type: 'success' }) as const);
  const adminWriterInit = vi.fn((config: WriterSource) => {
    shared.tag = config.fetch.adminTag;
  });

  /** The per-job factory: every call yields an instance closed over ITS OWN credential, which no later call can reach. */
  const createAdminWriter = vi.fn((source: WriterSource) => {
    const own = credentialOf(source);
    return {
      insertJobResult: vi.fn(async ({ data }: { data: { jobId: string } }) => record(data.jobId, own)),
      updateQuestion: vi.fn(async () => ({ type: 'success' }) as const)
    };
  });

  /** The seam each job obtains its own credential-bearing client through. It RAISES on an absent token exactly as the real factory does, so a job that resolved no session cannot proceed anonymously here either. */
  const createSupabaseJobClient = vi.fn(({ accessToken }: { accessToken: string | undefined }): JobClientStub => {
    if (!accessToken) throw new Error('createSupabaseJobClient: no access token supplied.');
    return { credentialTag: `job:${accessToken}`, carriesJarAdapter: false };
  });

  return {
    writes,
    reached,
    resolutions,
    shared,
    constructed,
    loadElectionData: vi.fn(),
    insertJobResult,
    updateQuestion,
    adminWriterInit,
    createAdminWriter,
    createSupabaseJobClient,
    getJob: vi.fn(),
    getAllMessagesFromJob: vi.fn(),
    markAborted: vi.fn(),
    controllerFail: vi.fn(),
    controllerInfo: vi.fn()
  };
});

vi.mock('$lib/admin/utils/loadElectionData', () => ({
  loadElectionData: mocks.loadElectionData
}));

vi.mock('$lib/api/adminWriter', () => ({
  adminWriter: {
    init: mocks.adminWriterInit,
    insertJobResult: mocks.insertJobResult,
    updateQuestion: mocks.updateQuestion
  },
  createAdminWriter: mocks.createAdminWriter
}));

vi.mock('$lib/api/dataProvider', () => ({
  createSupabaseJobClient: mocks.createSupabaseJobClient
}));

vi.mock('../jobs/jobStore', () => ({
  getJob: mocks.getJob,
  getAllMessagesFromJob: mocks.getAllMessagesFromJob,
  markAborted: mocks.markAborted
}));

vi.mock('../jobs/pipelineController', () => ({
  PipelineController: class {
    constructor(jobId: string) {
      mocks.constructed.push(jobId);
    }
    fail = mocks.controllerFail;
    info = mocks.controllerInfo;
    warning = vi.fn();
    complete = vi.fn();
    initializePipeline = vi.fn();
  }
}));

vi.mock('../../llm/llmProvider', () => ({
  getLLMProvider: vi.fn()
}));

vi.mock('@openvaa/argument-condensation', () => ({
  handleQuestion: vi.fn()
}));

vi.mock('@openvaa/question-info', () => ({
  generateQuestionInfo: vi.fn()
}));

/**
 * The only ordering mechanism this file may contain: a promise resolved from the outside.
 * @returns The gate promise and the function that opens it.
 */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/**
 * One logical admin's request context: a tagged fetch, a tagged client, and the verified-session helper answering with that admin's own token.
 *
 * The session helper is what makes the job's credential traceable to an ADMIN rather than to a call: the token it answers with names the admin, the job's client is built from that token, and the tag the writer reports is therefore the whole chain rather than a label attached at the end.
 * @param tag - The admin's identity, as it will be read back off a writer call.
 * @returns The request context, in the shape both features take.
 */
function taggedSource(tag: string): JobSource {
  const fetch = Object.assign(() => Promise.reject(new Error('the tagged fetch is an identity, not a transport')), {
    adminTag: tag
  }) as unknown as Fetch;
  return {
    fetch,
    locals: {
      supabase: { adminTag: tag },
      safeGetSession: async () => {
        mocks.resolutions.push(tag);
        return { session: { access_token: `session-token-of-${tag}` }, user: { id: tag } };
      }
    }
  } as unknown as JobSource;
}

/**
 * Start one admin job for one tagged admin and hand back its promise WITHOUT awaiting it.
 *
 * THE ONLY PLACE either job's parameter shape appears. When the jobs move from the shared writer to job-owned ones, this body is what changes; every assertion below is written against `mocks.writes` and `mocks.reached` and so cannot move with it.
 * @param feature - Which of the two long-running admin features to drive.
 * @param args - The admin's tag, the job id the writer call will carry, and the election id the data-load mock branches on.
 * @returns The running job's promise, which always rejects because the mocked data load rejects.
 */
function startJob(
  feature: 'condensation' | 'questionInfo',
  { tag, jobId, electionId }: { tag: string; jobId: string | undefined; electionId: string }
): Promise<unknown> {
  const source = taggedSource(tag);
  const common = { electionId, questionIds: [], source, locale: 'en', jobId: jobId as string };
  return feature === 'condensation' ? condenseArguments(common) : generateQuestionInfo({ ...common, operations: [] });
}

/** Clear the records the fakes accumulate, and the shared writer's configuration slot, so each case measures only its own drive. */
function resetRecords(): void {
  mocks.writes.length = 0;
  mocks.reached.length = 0;
  mocks.resolutions.length = 0;
  mocks.constructed.length = 0;
  mocks.shared.tag = undefined;
  mocks.createAdminWriter.mockClear();
  mocks.createSupabaseJobClient.mockClear();
  mocks.loadElectionData.mockClear();
  mocks.getJob.mockImplementation((jobId: string) => ({ jobType: 'AdminJob', author: `admin-for-${jobId}` }));
  mocks.getAllMessagesFromJob.mockImplementation(() => []);
}

describe('admin job lifetime — criterion C4, B4/D11', () => {
  // APPARATUS PROBE, live from `157.2-01`. It measures the interleaving mechanism rather than the job: a mock that resolved immediately, or one that never rejected, would let both cases below pass or fail for a reason that has nothing to do with which writer the job used.
  it('the mocked loadElectionData parks on the gate and only then rejects', async () => {
    const gate = deferred();
    const reached: Array<string> = [];
    const settled: Array<string> = [];

    mocks.loadElectionData.mockImplementation(async () => {
      reached.push('job parked inside its own await window');
      await gate.promise;
      throw new Error('election data unavailable');
    });

    const parked = loadElectionData({ electionId: 'e1', locale: 'en', source: taggedSource('probe') });
    const observed = parked.then(
      () => settled.push('resolved'),
      () => settled.push('rejected')
    );

    // The push above runs synchronously, before the mock's first await, so the job is provably inside its window here.
    expect(reached).toEqual(['job parked inside its own await window']);
    // It cannot have settled: nothing has opened the gate. This is program control flow, not a race that happened to be won.
    expect(settled).toEqual([]);

    gate.resolve();
    await observed;

    expect(settled).toEqual(['rejected']);
  });

  // LEDGER ROW 3, filled by `157.2-06`. Job 1 starts and parks inside `await loadElectionData(…)`, job 2 starts and rebinds the shared `adminWriter`, then job 1 resumes into its error path and reaches `insertJobResult` — the first writer call it makes after resuming, and therefore the observation point. RED on the shared writer: job 1's call carries job 2's configuration.
  describe('two overlapping jobs must not share one writer', () => {
    it('each job observes its own writer at the post-resume insertJobResult call', async () => {
      resetRecords();
      const gate = deferred();

      mocks.loadElectionData.mockImplementation(async ({ electionId }: { electionId: string }) => {
        if (electionId === 'election-A') {
          mocks.reached.push('A parked inside its own await window');
          await gate.promise;
        } else {
          mocks.reached.push('B entered its own data load');
        }
        throw new Error(`election data unavailable for ${electionId}`);
      });

      // Job A starts and runs synchronously into its own await window, where it stops.
      const jobA = startJob('condensation', { tag: 'A', jobId: 'job-A', electionId: 'election-A' });
      const settledA = jobA.then(
        () => 'resolved',
        () => 'rejected'
      );

      // Job B starts and runs to completion INSIDE that window, configuring the writer for its own admin on the way.
      await startJob('condensation', { tag: 'B', jobId: 'job-B', electionId: 'election-B' }).catch(() => undefined);

      gate.resolve();
      await settledA;

      // DRIVER: the interleaving really happened — A entered its window first, B ran its whole job inside it.
      expect(mocks.reached).toEqual(['A parked inside its own await window', 'B entered its own data load']);
      expect(mocks.writes.map(({ jobId }) => jobId)).toEqual(['job-B', 'job-A']);

      // ISOLATION: each job's writer call carried its OWN admin's credential.
      expect(mocks.writes).toEqual([
        { jobId: 'job-B', observedTag: 'job:session-token-of-B', carriesJarAdapter: false },
        { jobId: 'job-A', observedTag: 'job:session-token-of-A', carriesJarAdapter: false }
      ]);
    });

    it('a job’s writer is unaffected by a second job starting inside its await window', async () => {
      resetRecords();
      const gate = deferred();

      mocks.loadElectionData.mockImplementation(async ({ electionId }: { electionId: string }) => {
        if (electionId === 'election-A') {
          mocks.reached.push('A parked inside its own await window');
          await gate.promise;
        } else {
          mocks.reached.push('B entered its own data load');
        }
        throw new Error(`election data unavailable for ${electionId}`);
      });

      const jobA = startJob('questionInfo', { tag: 'A', jobId: 'job-A', electionId: 'election-A' });
      const settledA = jobA.then(
        () => 'resolved',
        () => 'rejected'
      );

      await startJob('questionInfo', { tag: 'B', jobId: 'job-B', electionId: 'election-B' }).catch(() => undefined);

      gate.resolve();
      await settledA;

      // DRIVER: the interleaving really happened — A entered its window first, B ran its whole job inside it.
      expect(mocks.reached).toEqual(['A parked inside its own await window', 'B entered its own data load']);
      expect(mocks.writes.map(({ jobId }) => jobId)).toEqual(['job-B', 'job-A']);

      // ISOLATION: each job's writer call carried its OWN admin's credential.
      expect(mocks.writes).toEqual([
        { jobId: 'job-B', observedTag: 'job:session-token-of-B', carriesJarAdapter: false },
        { jobId: 'job-A', observedTag: 'job:session-token-of-A', carriesJarAdapter: false }
      ]);
    });
  });

  /**
   * THE JOB-IDENTIFIER GUARD. The identifier used to be carried straight into `new PipelineController(jobId)` and into the job recorder with no validity test between them, so an absent one produced a job whose record half was broken from its first instruction. These cases run against BOTH features from one place, so a divergence between the two siblings fails rather than passing quietly in the one nobody looked at.
   *
   * The rejection point is asserted by OBSERVATION, not by position: the pipeline controller records every construction, the writer factory records every call, and the data load records every entry. All three being empty is what "before any job machinery exists" means, and it is what a guard moved below one of them would break.
   */
  describe('an invalid job identifier is refused before any job machinery exists', () => {
    const FEATURES = ['condensation', 'questionInfo'] as const;
    const INVALID = [
      { label: 'an absent', jobId: undefined },
      { label: 'an empty', jobId: '' },
      { label: 'a whitespace-only', jobId: '   ' }
    ];

    for (const feature of FEATURES) {
      it.each(INVALID)(
        `${feature}: rejects $label jobId ahead of the pipeline, the recorder and the writer`,
        async ({ jobId }) => {
          resetRecords();
          mocks.loadElectionData.mockImplementation(async () => {
            throw new Error('the data load must not be reached at all');
          });

          await expect(startJob(feature, { tag: 'A', jobId, electionId: 'election-A' })).rejects.toThrow(/jobId/);

          // No pipeline controller was constructed, so nothing downstream of it can have run.
          expect(mocks.constructed).toEqual([]);
          // No writer was built, so an invalid start did no credential work.
          expect(mocks.createAdminWriter).not.toHaveBeenCalled();
          // No writer call was made, so the job recorder was never reached either.
          expect(mocks.writes).toEqual([]);
          // And no outbound data load was attempted.
          expect(mocks.loadElectionData).not.toHaveBeenCalled();
        }
      );
    }

    it.each(FEATURES)(
      '%s: a valid jobId still reaches the pipeline, the writer and the recorder, exactly as before',
      async (feature) => {
        resetRecords();
        mocks.loadElectionData.mockImplementation(async () => {
          throw new Error('election data unavailable');
        });

        // THE POSITIVE CONTROL for the three cases above: each observation point CAN record, so the empty arrays there are the guard doing its work rather than an apparatus that never fires.
        await startJob(feature, { tag: 'A', jobId: 'job-A', electionId: 'election-A' }).catch(() => undefined);

        expect(mocks.constructed).toEqual(['job-A']);
        expect(mocks.createAdminWriter).toHaveBeenCalledTimes(1);
        expect(mocks.writes).toEqual([
          { jobId: 'job-A', observedTag: 'job:session-token-of-A', carriesJarAdapter: false }
        ]);
        expect(mocks.loadElectionData).toHaveBeenCalledTimes(1);
      }
    );
  });

  /**
   * THE JOB'S OWN CREDENTIAL (criterion **D10-C12**). A job used to borrow the initiating HTTP request's client for its whole multi-minute run — the same client `hooks.server.ts` built for that request, carrying an adapter onto that request's session store, on a response the job outlives. These cases assert that it no longer does.
   *
   * The RED half of both is the coupling itself: run against the construction these cases were written for, `credentialOf` reports `request:A` and a live adapter, because the source the job handed its writer named the request's `locals` rather than a client of its own. Nothing about the reader changes between the halves — the fake reads the same field, from the same record, in the same order. What changes is which source the JOB chose to build from, which is exactly the thing under measurement.
   *
   * Both run against BOTH features from one place, so a divergence between the two siblings fails rather than passing quietly in the one nobody looked at.
   */
  describe('a job carries its own credential, resolved once at start', () => {
    const FEATURES = ['condensation', 'questionInfo'] as const;

    /**
     * Drive one job to its observation point.
     * @param feature - Which of the two long-running admin features to drive.
     */
    async function driveOneJob(feature: (typeof FEATURES)[number]): Promise<void> {
      resetRecords();
      mocks.loadElectionData.mockImplementation(async () => {
        throw new Error('election data unavailable');
      });
      await startJob(feature, { tag: 'A', jobId: 'job-A', electionId: 'election-A' }).catch(() => undefined);
    }

    it.each(FEATURES)('%s: every writer call executes under the token the session lookup returned', async (feature) => {
      await driveOneJob(feature);

      // THE WHOLE CHAIN, asserted end to end rather than at its last link: the one verification path answered with this admin's token, the job's client was built from THAT token and from nothing else, and the write executed under the client so built. Asserting only the last of the three would pass for a client built from a token someone else supplied.
      expect(mocks.resolutions).toEqual(['A']);
      expect(mocks.createSupabaseJobClient.mock.calls).toEqual([[{ accessToken: 'session-token-of-A' }]]);
      expect(mocks.writes.map(({ jobId, observedTag }) => ({ jobId, observedTag }))).toEqual([
        { jobId: 'job-A', observedTag: 'job:session-token-of-A' }
      ]);
    });

    it.each(FEATURES)(
      '%s: the session is resolved ONCE, and the reads run on the same client as the writes',
      async (feature) => {
        await driveOneJob(feature);

        // ONCE. A second resolution mid-run would put the job's authority back on the request's clock under another name, which is the coupling this change removes rather than renames.
        expect(mocks.resolutions).toEqual(['A']);
        expect(mocks.createSupabaseJobClient).toHaveBeenCalledTimes(1);

        // ONE IDENTITY FOR THE WHOLE RUN. The feature's own parameter documentation says the run reads and writes as one identity; the data load is where that claim is either true or a sentence.
        const loadSources = mocks.loadElectionData.mock.calls.map(([args]) =>
          (args as { source: WriterSource }).source.client ? 'the job’s own client' : 'the initiating request’s'
        );
        expect(loadSources).toEqual(['the job’s own client']);
      }
    );

    it.each(FEATURES)('%s: no write to the request’s session store is attempted on the job’s path', async (feature) => {
      await driveOneJob(feature);

      // The second failure mode, observed rather than argued. `true` here is the pre-change reading: the writer holding the request's own client, whose setter `@sveltejs/kit` replaces with a thrower once the response has been generated — so a late write raised inside the client's own renewal rather than at a call site. There is no adapter on this path for that to happen through.
      expect(mocks.writes.map(({ jobId, carriesJarAdapter }) => ({ jobId, carriesJarAdapter }))).toEqual([
        { jobId: 'job-A', carriesJarAdapter: false }
      ]);
    });
  });
});
