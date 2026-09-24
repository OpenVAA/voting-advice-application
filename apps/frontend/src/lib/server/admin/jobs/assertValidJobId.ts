/**
 * Refuse an admin job whose identifier is missing, empty or blank, before anything is built from it.
 *
 * One declaration rather than one per feature, because two spellings of one validity decision drift apart the moment either is edited; the two job features call this same function as their first statement, so a divergence between them is not expressible.
 *
 * The empty string and the whitespace-only string are refused alongside the absent value, because an empty identifier reaches the job store, the pipeline controller and the job recorder exactly as an absent one does — it produces a job whose record half is broken from its first instruction rather than an obvious failure.
 * @param jobId - The identifier the caller handed the job.
 * @throws If the identifier is absent, empty, or whitespace-only.
 */
export function assertValidJobId(jobId: string | undefined | null): void {
  if (typeof jobId !== 'string' || jobId.trim() === '')
    throw new Error('Cannot start an admin job: the jobId is missing, empty or blank.');
}
