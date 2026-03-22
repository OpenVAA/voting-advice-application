import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';

/**
 * Supabase implementation of the FeedbackWriter.
 * Currently a stub -- postFeedback throws 'not implemented'.
 * Real implementation will insert feedback into a Supabase table.
 */
export class SupabaseFeedbackWriter extends supabaseAdapterMixin(UniversalFeedbackWriter) {
  protected _postFeedback() {
    throw new Error('SupabaseFeedbackWriter._postFeedback not implemented');
  }
}
