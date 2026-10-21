import { z } from 'zod';
import type { InvitationClaimResult, InvitationCodeStatus } from '$lib/api/base/dataWriter.type';

/** One promised grant, in the database's own column names. */
const GrantSpecSchema = z.object({
  scope: z.string().min(1),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  role: z.string().min(1)
});

/** A promised grant that was not written, with the reason the database gives. */
const SkippedGrantSpecSchema = GrantSpecSchema.extend({
  reason: z.enum(['candidate_has_editor', 'target_not_in_project'])
});

/**
 * The answer of the `claim_invitations` RPC: the grants it wrote, the promises it left open, and whether the caller has a password.
 *
 * Unknown members are dropped rather than refused, so a fact added to the answer later does not fail the claim.
 */
const InvitationClaimSchema = z.object({
  claimed: z.array(GrantSpecSchema),
  skipped: z.array(SkippedGrantSpecSchema),
  password_set: z.boolean()
});

/** The answer of the `check-code` operation of `account-access`. */
const InvitationCodeStatusSchema = z.object({
  status: z.enum(['valid', 'used', 'unknown'])
});

/** The answer of the `request-link` and `request-recovery` operations of `account-access`, which is the same for every request of either. */
const AcceptedRequestSchema = z.object({
  accepted: z.literal(true)
});

/** The answer of the `code-sign-in` operation of `account-access`: a session's two tokens, or the one refusal. */
const CodeSignInSchema = z.discriminatedUnion('result', [
  z.object({
    result: z.literal('signed-in'),
    access_token: z.string().min(1),
    refresh_token: z.string().min(1)
  }),
  z.object({ result: z.literal('invalid-credentials') })
]);

/** What the `code-sign-in` operation answers, once narrowed. The tokens are a session's credentials: they are handed to the auth client and to nothing else. */
export type CodeSignInAnswer = z.infer<typeof CodeSignInSchema>;

/**
 * Narrow an unvalidated answer against its schema.
 *
 * The message names the operation and the paths the schema refused. It never holds a value of the answer, which for a sign-in is a session token.
 * @param schema - The schema the answer must match.
 * @param raw - The unvalidated answer.
 * @param operation - The name of the operation, for the message.
 * @returns The answer as the schema types it.
 * @throws Error when the answer does not match the schema.
 */
function narrow<TSchema extends z.ZodType>(schema: TSchema, raw: unknown, operation: string): z.infer<TSchema> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const paths = new Set(result.error.issues.map((issue) => issue.path.join('.') || '(root)'));
    throw new Error(`The answer of ${operation} did not match its schema at: ${[...paths].join(', ')}`);
  }
  return result.data;
}

/**
 * Narrow the answer of the `claim_invitations` RPC.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The grants written, the promises left open and whether the caller has a password.
 * @throws Error when the value does not match the RPC's answer. A malformed answer is a failed claim, never an empty one.
 */
export function parseInvitationClaim(raw: unknown): InvitationClaimResult {
  const { claimed, skipped, password_set } = narrow(InvitationClaimSchema, raw, 'claim_invitations');
  return { claimed, skipped, passwordSet: password_set };
}

/**
 * Narrow the answer of the `check-code` operation.
 * @param raw - The unvalidated body the function returned.
 * @returns One of the three status words.
 * @throws Error when the body does not carry one of them.
 */
export function parseInvitationCodeStatus(raw: unknown): InvitationCodeStatus {
  return narrow(InvitationCodeStatusSchema, raw, 'account-access check-code').status;
}

/**
 * Check the answer of the `request-link` operation.
 * @param raw - The unvalidated body the function returned.
 * @throws Error when the body is not the one acceptance the function answers every request with.
 */
export function parseSignInLinkRequest(raw: unknown): void {
  narrow(AcceptedRequestSchema, raw, 'account-access request-link');
}

/**
 * Check the answer of the `request-recovery` operation.
 * @param raw - The unvalidated body the function returned.
 * @throws Error when the body is not the one acceptance the function answers every request with.
 */
export function parsePasswordRecoveryRequest(raw: unknown): void {
  narrow(AcceptedRequestSchema, raw, 'account-access request-recovery');
}

/**
 * Narrow the answer of the `code-sign-in` operation.
 * @param raw - The unvalidated body the function returned.
 * @returns The two tokens of the session, or the refusal.
 * @throws Error when the body is neither, or a token is empty.
 */
export function parseCodeSignIn(raw: unknown): CodeSignInAnswer {
  return narrow(CodeSignInSchema, raw, 'account-access code-sign-in');
}
