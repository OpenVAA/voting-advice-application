import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';

/**
 * Supabase implementation of the FeedbackWriter.
 *
 * Inserts into `public.feedback`. The table requires `project_id`, and it comes from the adapter's configured project id, resolved once at construction. The `anon_insert_feedback` RLS policy + rate-limit trigger gate the insert.
 */
export class SupabaseFeedbackWriter extends supabaseAdapterMixin(UniversalFeedbackWriter) {
  /**
   * @param config - This request's own client, its `fetch` and the locales it extracts JSONB in.
   *
   * Declared explicitly rather than inherited: the mixin's construct signature erases its parameter types, so without this signature an adapter built from any argument at all would typecheck.
   */
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }

  protected async _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<DataApiActionResult> {
    const { error } = await this.scopedFrom('feedback').insert({
      rating: data.rating ?? null,
      description: data.description ?? null,
      date: data.date,
      url: data.url ?? null,
      user_agent: data.userAgent ?? null
    });
    if (error) throw new Error(`postFeedback: ${error.message}`);

    return { type: 'success' as const };
  }
}
