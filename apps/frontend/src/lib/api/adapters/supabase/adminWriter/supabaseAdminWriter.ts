import { UniversalAdapter } from '$lib/api/base/universalAdapter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { InsertJobResultOptions, SetQuestionOptions } from '$lib/api/base/dataWriter.type';

/**
 * Supabase implementation of admin-specific write operations.
 *
 * This class extracts admin methods that were erroneously placed in DataWriter
 * on the parallel branch. It provides the primary access point for:
 * - Question custom data operations (merge_custom_data RPC)
 * - Admin job result storage (admin_jobs table)
 * - Email sending (send-email Edge Function)
 *
 * TODO: Rename to something more descriptive (see WAUTH-01 future requirement).
 */
export class SupabaseAdminWriter extends supabaseAdapterMixin(UniversalAdapter) {
  /**
   * Update a question's custom data by merging new data into the existing JSONB.
   * Uses the `merge_custom_data` RPC function.
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
   * Resolves project_id from the job's electionId.
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
   */
  async sendEmail({
    templates,
    recipientUserIds,
    from,
    dryRun
  }: {
    templates: Record<string, { subject: string; text: string; html: string }>;
    recipientUserIds: string[];
    from?: string;
    dryRun?: boolean;
  }): Promise<{ type: 'success'; sent: number; failed: number; results: unknown[] }> {
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
