import { AbortError } from '@openvaa/core';
import { createAdminWriter } from '$lib/api/adminWriter';
import { createSupabaseJobClient } from '$lib/api/dataProvider';
import { assertValidJobId } from './assertValidJobId';
import { getAllMessagesFromJob, getJob, markAborted } from './jobStore';
import { PipelineController } from './pipelineController';
import type { Id, Serializable } from '@openvaa/core';
import type { AdminJobRecord } from '$lib/api/base/adminWriter.type';
import type { AdapterSource } from '$lib/api/dataProvider';

/**
 * The job-record half of an admin feature: the `AdminJobRecord` assembly and the abort/fail branch, in one place.
 *
 * `condenseArguments.ts` and `generateQuestionInfo.ts` both start through {@link startAdminJob} and record through the recorder it returns, so a fix to the job start-up or to the record is made once. The features keep their own control flow: nothing in this module decides WHEN a job ends, only how it starts and what is written when it ends.
 */

/** What a feature hands over to start a job run. */
type StartAdminJobOptions = Pick<
  JobRecorderOptions,
  'jobId' | 'electionId' | 'input' | 'getOutput' | 'logPrefix' | 'failureMessage'
> & {
  /** The initiating admin's request context, read once for its verified session and then left behind. */
  source: { fetch: Fetch; locals: App.Locals };
};

/** What a started job holds for its whole run. */
export type StartedAdminJob = {
  /** The job's own source: the global `fetch` and a client over the initiating admin's credential. Every read and write of the run goes through it. */
  jobSource: AdapterSource;
  /** The job's pipeline controller. */
  controller: PipelineController;
  /** The job's own writer over {@link StartedAdminJob.jobSource}. */
  adminWriter: ReturnType<typeof createAdminWriter>;
  /** The job's recorder, see {@link createJobRecorder}. */
  jobRecord: JobRecorder;
};

/**
 * Start one admin job run: validate its id, fix its credential and build the controller, the writer and the recorder it holds for the whole run.
 *
 * The order is the property:
 * - The job id is validated FIRST, so an invalid start does no credential work and makes no outbound call.
 * - The session is resolved ONCE, through `locals.safeGetSession`, this application's one verification path: it calls `getSession()` and then the `getUser()` round-trip that checks the token against Supabase Auth, and hands back nothing when that fails. Nothing resolves it again: resolving mid-run would put the job back on the request's clock.
 * - The job's source names a CLIENT rather than the request's `locals`. `createSupabaseJobClient` raises when no session was found, so a job that nobody authorised does not proceed anonymously. The transport is the plain global `fetch` rather than `source.fetch`: the request's `fetch` is scoped to a response the job outlives.
 * - The writer is the job's own, over the job's own credential, so neither a second admin's job nor the initiating request's lifetime can reach it. The job's client renews no session and has no cookie adapter, so it never emits a `Set-Cookie`: a gateway that times the connection out before the job ends cannot lose a renewed session, and a write after the response has been generated, such as a late `insertJobResult` on an aborted job, cannot meet the `cookies.set` that `@sveltejs/kit` makes throw at that point.
 *
 * Open: what a job should do when the initiating admin's session expires partway through the run.
 * @param options - See {@link StartAdminJobOptions}.
 * @returns The job's source, controller, writer and recorder.
 */
export async function startAdminJob({
  jobId,
  source,
  electionId,
  input,
  getOutput,
  logPrefix,
  failureMessage
}: StartAdminJobOptions): Promise<StartedAdminJob> {
  assertValidJobId(jobId);
  const { session } = await source.locals.safeGetSession();
  const jobSource: AdapterSource = {
    fetch: globalThis.fetch,
    client: createSupabaseJobClient({ accessToken: session?.access_token })
  };
  const controller = new PipelineController(jobId);
  const adminWriter = createAdminWriter(jobSource);
  const jobRecord = createJobRecorder({
    jobId,
    electionId,
    startTime: new Date().toISOString(),
    input,
    adminWriter,
    controller,
    getOutput,
    logPrefix,
    failureMessage
  });
  return { jobSource, controller, adminWriter, jobRecord };
}

/** What a feature hands over so the record can be assembled without the feature re-stating it three times. */
type JobRecorderOptions = {
  /** The job whose store entry supplies `jobType` and `author`. */
  jobId: string;
  /** The election the run was scoped to. */
  electionId: Id;
  /** ISO timestamp captured at job start, before any work. */
  startTime: string;
  /** The run's input parameters, recorded verbatim. */
  input: Serializable;
  /**
   * The job's OWN writer, constructed once by the feature and held for the whole run.
   *
   * Typed off the SELECTOR rather than off the adapter class: the adapter-boundary guard bans `$lib/api/adapters/**` imports outside the allowlist, and this module is not on it — nor should it be, because it has no business naming which adapter implements the writer.
   */
  adminWriter: ReturnType<typeof createAdminWriter>;
  /** The feature's controller, used only by the failure branch to mark the pipeline failed. */
  controller: PipelineController;
  /**
   * The run's accumulated output AT THE MOMENT OF RECORDING.
   *
   * A thunk rather than a value because both features accumulate their results as they go and a record may be written from the `catch` — i.e. mid-accumulation. Passing the array would freeze it at recorder-construction time, which is before any work has happened.
   */
  getOutput: () => Serializable | null;
  /** Prefixes the two messages this module emits: the store-lookup error and the pipeline failure. Each feature names itself. */
  logPrefix: string;
  /** The sentence `controller.fail` is given on the non-abort branch, e.g. `'Argument condensation failed'`. */
  failureMessage: string;
};

/** What a feature holds: one call for the success path and one for the `catch`. */
export type JobRecorder = {
  /**
   * Write the `completed` record, if the job is still in the store.
   * @param metadata - The feature's own summary, e.g. `{ questionsProcessed: n }`.
   */
  recordCompletion: (metadata: Serializable | null) => Promise<void>;
  /**
   * Handle a thrown error: mark the job aborted and record it, or fail the pipeline and record that.
   * @param error - The value caught. An `AbortError` — matched by NAME, not by `instanceof`, because the class crosses a package boundary — is a cooperative abort rather than a failure.
   */
  recordFailure: (error: unknown) => Promise<void>;
};

/**
 * Build the recorder for one job run.
 * @param options - See {@link JobRecorderOptions}.
 * @returns The two calls a feature makes.
 */
export function createJobRecorder({
  jobId,
  electionId,
  startTime,
  input,
  adminWriter,
  controller,
  getOutput,
  logPrefix,
  failureMessage
}: JobRecorderOptions): JobRecorder {
  /**
   * Assemble the record as of NOW.
   *
   * Read from the store on every call rather than captured once, because `endTime` and `messages` are only meaningful at the moment the record is written, and a `catch` writes at a different moment than the success path.
   * @returns Everything an `AdminJobRecord` needs except `endStatus` and `metadata`.
   */
  function resultData(): Omit<AdminJobRecord, 'endStatus' | 'metadata'> {
    const job = getJob(jobId);
    if (!job) throw new Error(`[${logPrefix}] Job ${jobId} not found in the job store.`);
    const { jobType, author } = job;
    return {
      jobId,
      jobType,
      electionId,
      author,
      startTime,
      endTime: new Date().toISOString(),
      input,
      output: getOutput(),
      messages: getAllMessagesFromJob(jobId)
    };
  }

  return {
    recordCompletion: async (metadata) => {
      // The store lookup guards the write: a job evicted mid-run has no `jobType` or `author` to record.
      if (!getJob(jobId)) return;
      await adminWriter.insertJobResult({
        data: { ...resultData(), endStatus: 'completed', metadata }
      });
    },

    recordFailure: async (error) => {
      // Read BEFORE `markAborted`, so the guard reflects the store as the catch found it — the order both features used.
      const job = getJob(jobId);

      // Job was aborted if the error is an AbortError. Avoid instanceof, check name instead.
      if (error && typeof error === 'object' && 'name' in error && error.name === AbortError.name) {
        markAborted(jobId);
        if (job) await adminWriter.insertJobResult({ data: { ...resultData(), endStatus: 'aborted', metadata: null } });
        return;
      }

      // else it's a real error so we fail the job
      const message =
        error && typeof error === 'object' && 'message' in error ? String(error.message) : JSON.stringify(error);
      controller.fail(`${failureMessage}: ${message}`);
      if (job)
        await adminWriter.insertJobResult({
          data: { ...resultData(), endStatus: 'failed', metadata: { error: message } }
        });
    }
  };
}
