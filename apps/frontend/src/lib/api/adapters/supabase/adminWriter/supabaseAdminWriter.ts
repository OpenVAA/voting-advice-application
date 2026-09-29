import { SendEmailResultSchema } from '@openvaa/app-shared';
import { UniversalAdapter } from '$lib/api/base/universalAdapter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { parseWithPartialPreserve, reportParseFailure } from '../utils/parseOutcome';
import type { SendEmailResult } from '@openvaa/app-shared';
import type { Enums } from '@openvaa/supabase-types';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { InsertJobResultOptions, SetQuestionOptions } from '$lib/api/base/dataWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';
import type { ParseSource } from '../utils/parseOutcome.type';

/**
 * The event name a malformed or absent `send-email` result is reported under.
 *
 * A constant, never an interpolation: a downstream sink keys events on a stable message, and every varying value belongs in the attribute bag instead. It covers both non-`ok` outcomes because they are the same event from the operator's side: the function was invoked and did not report a usable outcome.
 */
const SEND_EMAIL_PARSE_FAILURE_MESSAGE = 'A send-email result did not match its schema.';

/**
 * Where the `send-email` result came from, for the failure record.
 *
 * {@link ParseSource} names a `table.column` because every other site in this adapter reads a JSONB column. This value is an Edge Function response, so the locator carries the function name in the same field, and one attribute bag shape serves every parse failure.
 */
const SEND_EMAIL_SOURCE: ParseSource = { column: 'send-email' };

/**
 * What {@link SupabaseAdminWriter.sendEmail} resolves to.
 *
 * The failure arm speaks the `type` discriminant of {@link DataApiActionResult}, which this class's other write methods already return. It is a union rather than a success shape with zeroed counts, so a caller has to read `type` before it can reach an outcome that was never verified.
 */
export type SendEmailOutcome =
  | { type: 'success'; sent: number; failed: number; results: SendEmailResult['results'] }
  | { type: 'failure'; status?: number };

/**
 * Supabase implementation of admin-specific write operations.
 *
 * It provides the access point for:
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
   * Whether the caller holds `permission` on this adapter's configured project, as the database's `user_can` answers it.
   *
   * Asked through this adapter's own client, so the answer is about the request's verified session and its `grants` claim -- the same claim every RLS policy reads -- and the matrix is never re-derived in TypeScript. The project is the adapter's configured one, never a caller-supplied id.
   *
   * Fails closed: an RPC error or any answer other than a literal `true` is `false`.
   * @param permission - A member of the database's `grant_permission` enum.
   * @returns `true` only when `user_can` answers `true`.
   */
  async callerMayOnProject(permission: Enums<'grant_permission'>): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('user_can', {
      p_scope: 'project',
      p_target_id: this.projectId,
      p_permission: permission
    });
    return !error && data === true;
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
   * The project comes from the adapter's configured project, not from the job's electionId.
   */
  async insertJobResult({ data }: InsertJobResultOptions): Promise<DataApiActionResult> {
    // `AdminJobRecord` carries no project id and the `admin_jobs` table requires one for RLS. The scoped table access supplies it from the adapter's configured project, so this insert needs no lookup of its own.
    const { error } = await this.scopedFrom('admin_jobs').insert({
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
   * Each template is `{ subject, body }`, the shape the function validates; it renders `body` as both the plain-text and the HTML part, escaping substituted values in the HTML one.
   *
   * The response is validated before `sent`, `failed` and `results` are read. `sent` and `failed` are absent from the dry-run branch, which sends nothing, so both default to zero.
   *
   * A response that fails validation, or an invocation that answers with no body at all, returns the failure arm of {@link SendEmailOutcome} and emits one structured record. A transport error throws instead, because it signals that nothing was attempted.
   */
  async sendEmail({
    templates,
    recipientUserIds,
    from,
    dryRun
  }: {
    templates: Record<string, { subject: string; body: string }>;
    recipientUserIds: Array<string>;
    from?: string;
    dryRun?: boolean;
  }): Promise<SendEmailOutcome> {
    const { data, error } = await this.supabase.functions.invoke('send-email', {
      body: {
        templates,
        recipient_user_ids: recipientUserIds,
        // The Edge Function refuses an invocation naming a project other than the one its deployment serves, so the names rendered into these messages can only come from this project.
        project_id: this.projectId,
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
      // The helper reports a `malformed` outcome itself and stays silent for an `absent` one, which is right for a column and wrong for an invocation, so the `absent` record is emitted here. Either way exactly one record is emitted, carrying the function name, the issue paths and the refused key names, never the recipient addresses or message bodies the payload holds.
      if (outcome.status === 'absent')
        reportParseFailure(SEND_EMAIL_PARSE_FAILURE_MESSAGE, SEND_EMAIL_SOURCE, [], false);
      // A partially preserved survivor is not reported as a success: its counts come from a response that did not validate as a whole.
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
