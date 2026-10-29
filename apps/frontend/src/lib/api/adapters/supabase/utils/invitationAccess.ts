import { z } from 'zod';
import { parseRpcAnswer } from './rpcAnswer';
import type {
  AddressConfirmationResult,
  InvitationClaimResult,
  InvitationCodeStatus,
  InvitationSkipReason
} from '$lib/api/base/dataWriter.type';

/** One promised grant, in the database's own column names. */
const GrantSpecSchema = z.object({
  scope: z.string().min(1),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  role: z.string().min(1)
});

/** The reasons the database gives for a promise it left open, as this application knows them. */
const KNOWN_SKIP_REASONS: ReadonlyArray<InvitationSkipReason> = ['candidate_has_editor', 'target_not_in_project'];

/** A promised grant that was not written, with the reason the database gives. A reason this application does not know is read as `other`, so a reason added to the database does not fail the claim. */
const SkippedGrantSpecSchema = GrantSpecSchema.extend({
  reason: z
    .string()
    .min(1)
    .transform((reason): InvitationSkipReason =>
      KNOWN_SKIP_REASONS.includes(reason as InvitationSkipReason) ? (reason as InvitationSkipReason) : 'other'
    )
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

/** The answer of the `confirm-address` operation of `account-access`. */
const AddressConfirmationSchema = z.object({
  result: z.enum(['sent', 'in-use', 'refused'])
});

/** What the `code-sign-in` operation answers, once narrowed. The tokens are a session's credentials: they are handed to the auth client and to nothing else. */
export type CodeSignInAnswer = z.infer<typeof CodeSignInSchema>;

/**
 * Narrow the answer of the `claim_invitations` RPC.
 * @param raw - The unvalidated value the RPC returned.
 * @returns The grants written, the promises left open and whether the caller has a password.
 * @throws Error when the value does not match the RPC's answer. A malformed answer is a failed claim, never an empty one.
 */
export function parseInvitationClaim(raw: unknown): InvitationClaimResult {
  const { claimed, skipped, password_set } = parseRpcAnswer(InvitationClaimSchema, raw, 'claim_invitations');
  return { claimed, skipped, passwordSet: password_set };
}

/**
 * Narrow the answer of the `check-code` operation.
 * @param raw - The unvalidated body the function returned.
 * @returns One of the three status words.
 * @throws Error when the body does not carry one of them.
 */
export function parseInvitationCodeStatus(raw: unknown): InvitationCodeStatus {
  return parseRpcAnswer(InvitationCodeStatusSchema, raw, 'account-access check-code').status;
}

/**
 * Check the answer of the `request-link` operation.
 * @param raw - The unvalidated body the function returned.
 * @throws Error when the body is not the one acceptance the function answers every request with.
 */
export function parseSignInLinkRequest(raw: unknown): void {
  parseRpcAnswer(AcceptedRequestSchema, raw, 'account-access request-link');
}

/**
 * Check the answer of the `request-recovery` operation.
 * @param raw - The unvalidated body the function returned.
 * @throws Error when the body is not the one acceptance the function answers every request with.
 */
export function parsePasswordRecoveryRequest(raw: unknown): void {
  parseRpcAnswer(AcceptedRequestSchema, raw, 'account-access request-recovery');
}

/**
 * Narrow the answer of the `code-sign-in` operation.
 * @param raw - The unvalidated body the function returned.
 * @returns The two tokens of the session, or the refusal.
 * @throws Error when the body is neither, or a token is empty.
 */
export function parseCodeSignIn(raw: unknown): CodeSignInAnswer {
  return parseRpcAnswer(CodeSignInSchema, raw, 'account-access code-sign-in');
}

/**
 * Read the answer of the `confirm-address` operation.
 *
 * Unlike the other parsers here it never throws: any body but one of the three results is read as `refused`, because a request whose outcome is unknown has mailed nothing the caller can rely on.
 * @param raw - The unvalidated body the function returned.
 * @returns The result the body names, or `refused`.
 */
export function parseAddressConfirmationAnswer(raw: unknown): AddressConfirmationResult {
  const result = AddressConfirmationSchema.safeParse(raw);
  return result.success ? result.data.result : 'refused';
}
