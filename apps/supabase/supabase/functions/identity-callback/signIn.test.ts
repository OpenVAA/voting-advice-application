/**
 * The sign-in of an identity's existing account, run against a fake account look-up and a fake sign-in token.
 *
 * A finished account of this identity is signed in with the token minted for it, and the answer is a 200 that carries the token. No account, an account no registration has finished and another identity's account are each answered `no_account`, a 404 with no token, and no token is minted for them. A failing look-up or token is not turned into an answer.
 */

import { describe, expect, it, vi } from 'vitest';
import { resultBody, resultStatus } from './requestContract.ts';
import { signInExistingAccount } from './signIn.ts';
import type { IdentityAccount } from './placeholderAccount.ts';
import type { SignInDependencies } from './signIn.ts';

const MATCH_VALUE = 'AbC123xYz';
const USER_ID = '11111111-2222-3333-4444-555555555555';
const PLACEHOLDER = 'abc123xyz@bank-auth.placeholder';
const TOKEN = 'minted-token';

/** Fake dependencies whose look-up answers `account`, with spies on both calls. */
function dependencies(account: IdentityAccount | null): SignInDependencies & {
  findAccount: ReturnType<typeof vi.fn>;
  signInToken: ReturnType<typeof vi.fn>;
} {
  return {
    findAccount: vi.fn(async () => account),
    signInToken: vi.fn(async () => TOKEN)
  };
}

function account(appMetadata: Record<string, unknown> | null): IdentityAccount {
  return { id: USER_ID, email: PLACEHOLDER, appMetadata };
}

describe('signInExistingAccount', () => {
  it('signs in the account an earlier registration of this identity finished, with a 200 that carries the token', async () => {
    const deps = dependencies(account({ identity_provider: 'idura', identity_match_value: MATCH_VALUE }));

    const outcome = await signInExistingAccount(deps, MATCH_VALUE);

    expect(outcome).toEqual({ result: 'signed_in', token: TOKEN });
    expect(deps.findAccount).toHaveBeenCalledExactlyOnceWith(MATCH_VALUE);
    expect(deps.signInToken).toHaveBeenCalledExactlyOnceWith(USER_ID);
    expect(resultStatus(outcome.result)).toBe(200);
    expect(resultBody(outcome.result, 'token' in outcome ? outcome.token : undefined)).toEqual({
      result: 'signed_in',
      token: TOKEN
    });
  });

  it.each([
    { case: 'an unknown identity', found: null },
    { case: 'an account no registration has finished', found: account(null) },
    { case: 'an account whose metadata holds no match value', found: account({ identity_provider: 'idura' }) },
    { case: 'an empty match value', found: account({ identity_match_value: '' }) },
    { case: "another identity's account", found: account({ identity_match_value: 'aBc123XyZ' }) }
  ])('answers no_account, a 404 with no token, for $case, and mints no token', async ({ found }) => {
    const deps = dependencies(found);

    const outcome = await signInExistingAccount(deps, MATCH_VALUE);

    expect(outcome).toEqual({ result: 'no_account' });
    expect(deps.signInToken).not.toHaveBeenCalled();
    expect(resultStatus(outcome.result)).toBe(404);
    expect(resultBody(outcome.result)).toEqual({ result: 'no_account' });
  });

  it('lets a failing look-up through, and mints no token', async () => {
    const lookUpFailure = Object.assign(new Error('look-up failed'), { code: 'ERR_ACCOUNT_LOOKUP_FAILED' });
    const deps = dependencies(null);
    deps.findAccount.mockRejectedValueOnce(lookUpFailure);

    await expect(signInExistingAccount(deps, MATCH_VALUE)).rejects.toBe(lookUpFailure);
    expect(deps.signInToken).not.toHaveBeenCalled();
  });

  it('lets a failing sign-in token through', async () => {
    const linkFailure = Object.assign(new Error('link failed'), { code: 'ERR_LINK_FAILED' });
    const deps = dependencies(account({ identity_match_value: MATCH_VALUE }));
    deps.signInToken.mockRejectedValueOnce(linkFailure);

    await expect(signInExistingAccount(deps, MATCH_VALUE)).rejects.toBe(linkFailure);
  });
});
