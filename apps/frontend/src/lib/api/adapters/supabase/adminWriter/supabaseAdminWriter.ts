import { UniversalAdapter } from '$lib/api/base/universalAdapter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { InsertJobResultOptions, SetQuestionOptions } from '$lib/api/base/dataWriter.type';

/**
 * Supabase implementation of admin-specific write operations.
 *
 * This class extracts admin methods that were erroneously placed in DataWriter on the parallel branch. It provides the primary access point for:
 * - Question custom data operations (merge_question_custom_data RPC)
 * - Admin job result storage (admin_jobs table)
 * - Email sending (send-email Edge Function)
 *
 * TODO: Rename to something more descriptive (future requirement).
 */
export class SupabaseAdminWriter extends supabaseAdapterMixin(UniversalAdapter) {
  /**
   * Update a question's custom data by merging new data into the existing JSONB.
   * Uses the `merge_question_custom_data` RPC function.
   */
  async updateQuestion({ id, data: { customData } }: SetQuestionOptions): Promise<DataApiActionResult> {
    if (!customData || typeof customData !== 'object')
      throw new Error(`Expected a customData object but got type: ${typeof customData}`);

    const { error } = await this.supabase.rpc('merge_custom_data', {
      p_question_id: id,
      p_patch: customData
    });
    if (error) throw new Error(`updateQuestion: ${error.message}`);
    return { type: 'success' as const };
  }

  /**
   * Insert a completed admin job result into the admin_jobs table.
   * The project comes from the adapter's configured project, not from the job's electionId.
   */
  async insertJobResult({ data }: InsertJobResultOptions): Promise<DataApiActionResult> {
    // Resolve project_id from election_id (AdminJobRecord doesn't include project_id
    // but the admin_jobs table requires it for RLS)
    const { data: election, error: electionError } = await this.supabase
      .from('elections')
      .select('project_id')
      .eq('id', data.electionId)
      .single();
    if (electionError || !election)
      throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

    const { error } = await this.supabase.from('admin_jobs').insert({
      project_id: election.project_id,
      job_id: data.jobId,
      job_type: data.jobType,
      election_id: data.electionId,
      author: data.author,
      end_status: data.endStatus,
      start_time: data.startTime ?? null,
      end_time: data.endTime ?? null,
      input: data.input ?? null,
      output: data.output ?? null,
      messages: data.messages ?? null,
      metadata: data.metadata ?? null
    });
    if (error) throw new Error(`insertJobResult: ${error.message}`);
    return { type: 'success' as const };
  }

  /**
   * Send emails via the send-email Edge Function.
   *
   * The invoke payload is validated through `parseWithPartialPreserve` before `sent`, `failed` and `results` are read, so the per-recipient outcomes arrive typed rather than as an opaque array (T-157-05).
   * `sent` and `failed` are absent from the function's dry-run branch, which sends nothing, so both default to zero here and the declared counts stay numbers.
   *
   * ## A result that was not verified is not reported as a success (T-157.1-13)
   *
   * This method used to answer a payload it could not validate with a fully-populated success object reporting no sends, no failures and no results — a write path claiming an outcome it never verified, and a shape no ban written in terms of empty literals can see. It now returns the failure arm of {@link SendEmailOutcome}, so a caller has to read the discriminant to get at the counts.
   *
   * `absent` — the invocation answered with no body at all — takes the same branch. On a READ column absence is not a failure and emits no record, because an operator simply stored nothing; on an INVOCATION response it is the same unverified outcome as a malformed one, so the record is emitted here rather than left to the shared helper, which is correctly silent for it.
   *
   * A transport error still THROWS rather than returning the failure arm, because that is the caller's signal that nothing was attempted (T-157-06). Decision **D-DISC-4** records why the malformed case does not join it: a throw lands in a caller's `catch` and is logged as a free-form interpolated string, which decision **C4** NOTE 1 forbids for records this phase touches, whereas a typed failure keeps the structured record here, where the function name and the issue paths are in scope.
   */
  async sendEmail({
    templates,
    recipientUserIds,
    from,
    dryRun
  }: {
    templates: Record<string, { subject: string; text: string; html: string }>;
    recipientUserIds: Array<string>;
    from?: string;
    dryRun?: boolean;
  }): Promise<{ type: 'success'; sent: number; failed: number; results: Array<unknown> }> {
    const { data, error } = await this.supabase.functions.invoke('send-email', {
      body: {
        templates,
        recipient_user_ids: recipientUserIds,
        from,
        dry_run: dryRun
      }
    });

    if (error) throw new Error(`send-email: ${error.message}`);
    return {
      type: 'success' as const,
      sent: data.sent,
      failed: data.failed,
      results: data.results
    };
  }
}
