import { describe, expect, it } from 'vitest';
import {
  parseCodeSignIn,
  parseInvitationClaim,
  parseInvitationCodeStatus,
  parsePasswordRecoveryRequest,
  parseSignInLinkRequest
} from './invitationAccess';

const SECRET = 'value-that-must-not-be-in-the-message';

const projectEditor = { scope: 'project', target_type: null, target_id: 'proj-1', role: 'editor' };
const candidateEditor = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };

/** The message of what `run` throws. */
function messageOf(run: () => unknown): string {
  try {
    run();
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('the narrowing returned, and it must throw');
}

describe('parseInvitationClaim', () => {
  it('narrows a well-formed answer to the grants written, the promises left open and the password state', () => {
    const claim = parseInvitationClaim({
      claimed: [projectEditor],
      skipped: [{ ...candidateEditor, reason: 'candidate_has_editor' }],
      password_set: false
    });

    expect(claim).toStrictEqual({
      claimed: [projectEditor],
      skipped: [{ ...candidateEditor, reason: 'candidate_has_editor' }],
      passwordSet: false
    });
  });

  it('narrows an answer that claimed and skipped nothing', () => {
    expect(parseInvitationClaim({ claimed: [], skipped: [], password_set: true })).toStrictEqual({
      claimed: [],
      skipped: [],
      passwordSet: true
    });
  });

  it('accepts both reasons a promise is left open for', () => {
    const claim = parseInvitationClaim({
      claimed: [],
      skipped: [
        { ...candidateEditor, reason: 'candidate_has_editor' },
        { ...candidateEditor, reason: 'target_not_in_project' }
      ],
      password_set: true
    });

    expect(claim.skipped.map((item) => item.reason)).toEqual(['candidate_has_editor', 'target_not_in_project']);
  });

  it('reads a skipped item with a reason it does not know as `other`, so a reason added to the database does not fail the claim', () => {
    const claim = parseInvitationClaim({
      claimed: [projectEditor],
      skipped: [{ ...candidateEditor, reason: 'some-other-reason' }],
      password_set: true
    });

    expect(claim.claimed).toEqual([projectEditor]);
    expect(claim.skipped).toEqual([{ ...candidateEditor, reason: 'other' }]);
  });

  it.each([
    ['an empty reason', ''],
    ['no reason', undefined],
    ['a reason that is not text', 7]
  ])('throws for a skipped item with %s', (_name, reason) => {
    expect(() =>
      parseInvitationClaim({
        claimed: [],
        skipped: [{ ...candidateEditor, reason }],
        password_set: true
      })
    ).toThrow(/^The answer of claim_invitations did not match its schema at: skipped\.0\.reason$/);
  });

  it('throws for an answer without the password state', () => {
    expect(() => parseInvitationClaim({ claimed: [], skipped: [] })).toThrow(
      /did not match its schema at: password_set$/
    );
  });

  it('throws for null', () => {
    expect(() => parseInvitationClaim(null)).toThrow(
      /^The answer of claim_invitations did not match its schema at: \(root\)$/
    );
  });

  it('names the refused paths and never a value of the answer', () => {
    const message = messageOf(() =>
      parseInvitationClaim({
        claimed: [{ ...projectEditor, scope: { secret: SECRET } }],
        skipped: [],
        password_set: true
      })
    );

    expect(message).toContain('claimed.0.scope');
    expect(message).not.toContain(SECRET);
  });
});

describe('parseInvitationCodeStatus', () => {
  it.each(['valid', 'used', 'unknown'] as const)('narrows the status %s', (status) => {
    expect(parseInvitationCodeStatus({ status })).toBe(status);
  });

  it('throws for a fourth status word', () => {
    expect(() => parseInvitationCodeStatus({ status: 'expired' })).toThrow(
      /^The answer of account-access check-code did not match its schema at: status$/
    );
  });

  it('throws for null', () => {
    expect(() => parseInvitationCodeStatus(null)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('never repeats the refused word', () => {
    expect(messageOf(() => parseInvitationCodeStatus({ status: SECRET }))).not.toContain(SECRET);
  });
});

describe('parseSignInLinkRequest', () => {
  it('accepts the one answer the function gives', () => {
    expect(() => parseSignInLinkRequest({ accepted: true })).not.toThrow();
  });

  it('throws for an answer that does not accept', () => {
    expect(() => parseSignInLinkRequest({ accepted: false })).toThrow(
      /^The answer of account-access request-link did not match its schema at: accepted$/
    );
  });

  it('throws for an error body', () => {
    expect(() => parseSignInLinkRequest({ error: 'bad-request' })).toThrow(/did not match its schema at: accepted$/);
  });

  it('throws for null', () => {
    expect(() => parseSignInLinkRequest(null)).toThrow(/did not match its schema at: \(root\)$/);
  });
});

describe('parsePasswordRecoveryRequest', () => {
  it('accepts the one answer the function gives', () => {
    expect(() => parsePasswordRecoveryRequest({ accepted: true })).not.toThrow();
  });

  it('returns nothing of the answer', () => {
    expect(parsePasswordRecoveryRequest({ accepted: true, mail: 'recovery' })).toBeUndefined();
  });

  it('throws for an answer that does not accept', () => {
    expect(() => parsePasswordRecoveryRequest({ accepted: false })).toThrow(
      /^The answer of account-access request-recovery did not match its schema at: accepted$/
    );
  });

  it('throws for an error body', () => {
    expect(() => parsePasswordRecoveryRequest({ error: 'bad-request' })).toThrow(
      /did not match its schema at: accepted$/
    );
  });

  it('throws for null', () => {
    expect(() => parsePasswordRecoveryRequest(null)).toThrow(/did not match its schema at: \(root\)$/);
  });
});

describe('parseCodeSignIn', () => {
  it('narrows a signed-in answer to its two tokens', () => {
    expect(parseCodeSignIn({ result: 'signed-in', access_token: 'access', refresh_token: 'refresh' })).toStrictEqual({
      result: 'signed-in',
      access_token: 'access',
      refresh_token: 'refresh'
    });
  });

  it('narrows the refusal', () => {
    expect(parseCodeSignIn({ result: 'invalid-credentials' })).toStrictEqual({ result: 'invalid-credentials' });
  });

  it('throws for a signed-in answer with an empty token', () => {
    expect(() => parseCodeSignIn({ result: 'signed-in', access_token: '', refresh_token: 'refresh' })).toThrow(
      /^The answer of account-access code-sign-in did not match its schema at: access_token$/
    );
    expect(() => parseCodeSignIn({ result: 'signed-in', access_token: 'access', refresh_token: '' })).toThrow(
      /did not match its schema at: refresh_token$/
    );
  });

  it('throws for a result that is neither', () => {
    expect(() => parseCodeSignIn({ result: 'locked' })).toThrow(/did not match its schema at: result$/);
  });

  it('throws for null', () => {
    expect(() => parseCodeSignIn(null)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('never repeats a token of an answer it refuses', () => {
    const message = messageOf(() => parseCodeSignIn({ result: 'signed-in', access_token: SECRET, refresh_token: 7 }));

    expect(message).toContain('refresh_token');
    expect(message).not.toContain(SECRET);
  });
});
