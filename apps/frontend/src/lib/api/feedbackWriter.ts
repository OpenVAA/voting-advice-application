import { SupabaseFeedbackWriter } from './adapters/supabase/feedbackWriter/supabaseFeedbackWriter';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * Obtain a `FeedbackWriter` for ONE request.
 *
 * Every call returns a FRESH instance, from the same three named sources and by the same shape as its three siblings. Its single call site lives in the app context and runs in the browser, so it is the arm this factory is most often asked for — but the arm is still named at the call site rather than sniffed here, because the whole family's contract is that the client is an input, never an inference.
 * @param source - Where this request's client comes from.
 * @returns A feedback writer nothing else holds a reference to.
 */
export function createFeedbackWriter(source: AdapterSource): SupabaseFeedbackWriter {
  return new SupabaseFeedbackWriter(resolveAdapterConfig(source));
}
