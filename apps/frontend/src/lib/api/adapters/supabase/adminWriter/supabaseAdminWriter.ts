import { SendEmailResultSchema } from '@openvaa/app-shared';
import { UniversalAdapter } from '$lib/api/base/universalAdapter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { parseWithPartialPreserve, reportParseFailure } from '../utils/parseOutcome';
import type { SendEmailResult } from '@openvaa/app-shared';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { InsertJobResultOptions, SetQuestionOptions } from '$lib/api/base/dataWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';
import type { ParseSource } from '../utils/parseOutcome.type';

/**
 * The event name a malformed or absent `send-email` result is reported under.
 *
 * A CONSTANT, never an interpolation: a downstream sink keys events on a stable message and every varying value belongs in the attribute bag instead (decision **C4** NOTE 1). It covers both non-`ok` outcomes because they are the same event from the operator's side — the function was invoked and did not report a usable outcome.
 */
const SEND_EMAIL_PARSE_FAILURE_MESSAGE = 'A send-email result did not match its schema.';

/**
 * Where the `send-email` result came from, for the failure record.
 *
 * {@link ParseSource} names a `table.column` because every other site in this adapter reads a JSONB column. This value is an Edge Function RESPONSE, so the locator carries the function name instead — deliberately the same field, so one attribute bag shape serves every parse failure the phase emits and a sink does not need a second schema for this one.
 */
const SEND_EMAIL_SOURCE: ParseSource = { column: 'send-email' };

/**
 * What {@link SupabaseAdminWriter.sendEmail} resolves to.
 *
 * The failure arm speaks the `type` discriminant of {@link DataApiActionResult}, which this class's other write methods already return, rather than inventing a second vocabulary for the same idea. It is a union rather than a widened success shape on purpose: the branch this replaced returned a fully-populated success object reporting no outcomes, which is not an empty literal and is therefore invisible to any ban written in terms of one — only a caller forced to read `type` can tell the two apart.
 */
export type SendEmailOutcome =
  | { type: 'success'; sent: number; failed: number; results: SendEmailResult['results'] }
  | { type: 'failure'; status?: number };

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
   * @param config - This request's own client, its `fetch` and the locales it extracts JSONB in.
   *
   * Declared explicitly rather than inherited: the mixin's construct signature erases its parameter types, so without this signature an adapter built from any argument at all would typecheck.
   */
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }

  /**
   * Update a question's custom data by merging new data into the existing JSONB.
   * Uses the `merge_question_custom_data` RPC function.
   */
  async updateQuestion({ id, data: { customData } }: SetQuestionOptions): Promise<DataApiActionResult> {
    if (!customData || typeof customData !== 'object')
      throw new Error(`Expected a customData object but got type: ${typeof customData}`);

    const { error } = await this.supabase.rpc('merge_question_custom_data', {
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
    // Resolve project_id from election_id (AdminJobRecord doesn't include project_id but the admin_jobs table requires it for RLS)
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
  }): Promise<SendEmailOutcome> {
    const { data, error } = await this.supabase.functions.invoke('send-email', {
      body: {
        templates,
        recipient_user_ids: recipientUserIds,
        from,
        dry_run: dryRun
      }
    });

    if (error) throw new Error(`send-email: ${error.message}`);

    const outcome = parseWithPartialPreserve<SendEmailResult>(
      SendEmailResultSchema,
      data,
      SEND_EMAIL_SOURCE,
      SEND_EMAIL_PARSE_FAILURE_MESSAGE
    );

    if (outcome.status !== 'ok') {
      // The helper reports a `malformed` outcome itself and stays silent for an `absent` one, which is right for a column and wrong for an invocation — so the second record is emitted here, with no issues to carry because there was no value to find any in. Either way exactly one record is emitted, at `error` (decision **C5(b)**), carrying the function name, the zod issue PATHS and the refused KEY NAMES; the payload holds recipient addresses and rendered message bodies, and neither those nor the refused keys' VALUES ever reach the record (T-157.1-15, T-157-17).
      if (outcome.status === 'absent')
        reportParseFailure(SEND_EMAIL_PARSE_FAILURE_MESSAGE, SEND_EMAIL_SOURCE, [], false);
      // A partially-preserved survivor is deliberately NOT reported as a success: the counts on it were produced by a function whose answer this method could not validate as a whole, and reporting them would be the same unverified claim in a smaller form.
      return { type: 'failure' as const };
    }

    return {
      type: 'success' as const,
      sent: outcome.value.sent ?? 0,
      failed: outcome.value.failed ?? 0,
      results: outcome.value.results
    };
  }
}
