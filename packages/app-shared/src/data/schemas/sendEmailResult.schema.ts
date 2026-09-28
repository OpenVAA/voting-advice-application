import { z } from 'zod';

/**
 * One per-recipient outcome, mirroring `RecipientResult` in `apps/supabase/supabase/functions/send-email/index.ts`.
 *
 * Every site in that function that builds one sets `user_id` and `email`, so both are required here. The remaining members are per-branch: `status` is `'sent'` on the success path and `'failed'` on the catch path, `error` accompanies `'failed'` only, and `subject` / `body` appear only in the dry run, which sets no `status` at all.
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
 * The return shape of the `send-email` Edge Function, as `supabase.functions.invoke('send-email')` delivers it in `data`.
 *
 * The function has three return branches. The 200 success branch and the 500 all-failed branch both return `{ success, sent, failed, dry_run, results }`; the dry-run branch returns `{ success, dry_run, results }` with no counts. `success`, `dry_run` and `results` are therefore required, so a response missing any of them is rejected at the boundary, and the counts are optional, so a dry run parses.
 *
 * Strict at both levels, because strictness is per-object and does not descend into an array element.
 */
export const SendEmailResultSchema = z.strictObject({
  /** `true` on both 200 branches, `false` on the 500 all-failed branch. */
  success: z.boolean(),
  /** The number of messages sent. Absent on the dry-run branch. */
  sent: z.number().optional(),
  /** The number of messages that failed. Absent on the dry-run branch. */
  failed: z.number().optional(),
  /** Whether the call was a dry run. */
  dry_run: z.boolean(),
  /** The per-recipient outcomes. */
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
