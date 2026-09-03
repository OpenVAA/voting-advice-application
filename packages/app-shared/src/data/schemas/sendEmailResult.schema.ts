import { z } from 'zod';

/**
 * One per-recipient outcome, mirroring `RecipientResult` in `apps/supabase/supabase/functions/send-email/index.ts`.
 *
 * All four push sites in that function set `user_id` and `email`, so both are required here. The remaining members are per-branch: `status` is `'sent'` on the success path and `'failed'` on the catch path, `error` accompanies `'failed'` only, and `subject` / `body` appear only in the dry run, which sets no `status` at all.
 */
const RecipientResultSchema = z.strictObject({
  /** The recipient's auth user id. */
  user_id: z.string(),
  /** The recipient's email address. */
  email: z.string(),
  /** The outcome discriminant. Absent on the dry-run branch, which sends nothing. */
  status: z.enum(['sent', 'failed']).optional(),
  /** The transport error message, present on the `failed` branch only. */
  error: z.string().optional(),
  /** The rendered subject, present on the dry-run branch only. */
  subject: z.string().optional(),
  /** The rendered body, present on the dry-run branch only. */
  body: z.string().optional()
});

/**
 * The measured return shape of the `send-email` Edge Function, as `supabase.functions.invoke('send-email')` delivers it in `data`.
 *
 * ## Why the counts are optional and `results` is not
 *
 * The function has THREE return branches. The 200 success branch and the 500 all-failed branch both return `{ success, sent, failed, dry_run, results }`; the DRY-RUN branch returns `{ success, dry_run, results }` with no counts at all. `results` is the one member all three carry, so it alone is required. A schema that required `sent` and `failed` would reject every dry run — which is the branch an operator is most likely to exercise first.
 *
 * ## What this replaces
 *
 * `SupabaseAdminWriter.sendEmail` declares its `results` as `Array<unknown>` and reads `data.sent` / `data.failed` / `data.results` off an untyped `data`. That is the phase's theme in miniature: an unvalidated read at the Supabase boundary. This schema is the vocabulary; the parse call at the adapter edge lands separately.
 *
 * Strict at both levels, because strictness is per-object and does not descend into an array element.
 */
export const SendEmailResultSchema = z.strictObject({
  /** `true` on both 200 branches, `false` on the 500 all-failed branch. */
  success: z.boolean().optional(),
  /** The number of messages sent. Absent on the dry-run branch. */
  sent: z.number().optional(),
  /** The number of messages that failed. Absent on the dry-run branch. */
  failed: z.number().optional(),
  /** Whether the call was a dry run. */
  dry_run: z.boolean().optional(),
  /** The per-recipient outcomes. Returned by all three branches. */
  results: z.array(RecipientResultSchema)
});

/**
 * The return shape of the `send-email` Edge Function.
 */
export type SendEmailResult = z.infer<typeof SendEmailResultSchema>;

/**
 * One per-recipient outcome within {@link SendEmailResult}.
 */
export type RecipientResult = z.infer<typeof RecipientResultSchema>;
