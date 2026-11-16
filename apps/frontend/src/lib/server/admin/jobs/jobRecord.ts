import { AbortError } from '@openvaa/core';
import { getAllMessagesFromJob, getJob, markAborted } from './jobStore';
import type { Id, Serializable } from '@openvaa/core';
import type { createAdminWriter } from '$lib/api/adminWriter';
import type { AdminJobRecord } from '$lib/api/base/dataWriter.type';
import type { PipelineController } from './pipelineController';

/**
 * The job-record half of an admin feature: the `AdminJobRecord` assembly and the abort/fail branch, in one place.
 *
 * ## Why this exists
 *
 * `condenseArguments.ts` and `generateQuestionInfo.ts` carried ~55 identical lines each — the whole `_getResultData` closure, the three `insertJobResult` calls and the entire `catch` block — differing only in the `output` expression and two message prefixes. Both were touched by this phase for the per-job-writer change, and the change had to be made twice; the WR-06 upload block is the same shape of duplication one layer down, and its lesson is the same one: a fix applied to one copy silently leaves the other.
 *
 * The features keep their own control flow. What moves here is the part that was identical, and only that: nothing in this module decides WHEN a job ends, only what is written when it does.
 */

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
