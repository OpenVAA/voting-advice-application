/**
 * Unit tests for the fixed identities that ask for a mailed link on every run: the user whose stored session has no password, the unregistered candidate of the candidate journey and the candidate of the positive localisation walk. Each run asks for their links under addresses of its own, so no run spends the per-address daily mail budget of an address another run used.
 *
 * The addresses are module constants built from the run tag in `E2E_RUN_ADDRESS_TAG`, so each case sets or clears that variable and imports the modules afresh.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts runScopedAddresses
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The environment variable the run tag is read from and written to. */
const TAG_VARIABLE = 'E2E_RUN_ADDRESS_TAG';

/** A well-formed run tag: sixteen lower-case hexadecimal digits. */
const SOME_TAG = '0123456789abcdef';

/** The test domain every suite address is on. */
const DOMAIN = '@test.openvaa.local';

interface RunAddresses {
  passwordless: string;
  unregistered: string;
  localisation: string;
}

/** Imports the address modules afresh, as a new run does, and returns the three addresses they hold. */
async function addressesOfANewRun(): Promise<RunAddresses> {
  vi.resetModules();
  const credentials: Record<string, unknown> = await import('./testCredentials');
  const journey: Record<string, unknown> = await import('./contestantJourneyConstants');
  return {
    passwordless: String(credentials.TEST_PASSWORDLESS_EMAIL),
    unregistered: String(journey.UNREGISTERED_CANDIDATE_EMAIL),
    localisation: String(credentials.L10N_POSITIVE_CANDIDATE_EMAIL)
  };
}

beforeEach(() => {
  const tagBefore = process.env[TAG_VARIABLE];
  return () => {
    if (tagBefore === undefined) delete process.env[TAG_VARIABLE];
    else process.env[TAG_VARIABLE] = tagBefore;
  };
});

describe('the addresses a run asks mailed links for', () => {
  it('each carry the run tag the environment holds', async () => {
    process.env[TAG_VARIABLE] = SOME_TAG;
    const addresses = await addressesOfANewRun();
    expect(addresses.passwordless.includes(SOME_TAG), 'the passwordless address carries the tag').toBe(true);
    expect(addresses.unregistered.includes(SOME_TAG), "the unregistered candidate's address carries the tag").toBe(
      true
    );
    expect(addresses.localisation.includes(SOME_TAG), "the localisation candidate's address carries the tag").toBe(
      true
    );
  });

  it('differ between two runs that start with no tag', async () => {
    delete process.env[TAG_VARIABLE];
    const first = await addressesOfANewRun();
    delete process.env[TAG_VARIABLE];
    const second = await addressesOfANewRun();
    expect(second.passwordless !== first.passwordless, 'the passwordless addresses differ').toBe(true);
    expect(second.unregistered !== first.unregistered, "the unregistered candidate's addresses differ").toBe(true);
    expect(second.localisation !== first.localisation, "the localisation candidate's addresses differ").toBe(true);
  });

  it('come with a tag written to the environment when a run starts with none, so every worker the run starts reads the same one', async () => {
    delete process.env[TAG_VARIABLE];
    const addresses = await addressesOfANewRun();
    const written = String(process.env[TAG_VARIABLE]);
    expect(/^[0-9a-f]{16}$/.test(written), 'the environment holds sixteen lower-case hexadecimal digits').toBe(true);
    expect(addresses.passwordless.includes(written), 'the passwordless address carries the written tag').toBe(true);
    const again = await addressesOfANewRun();
    expect(JSON.stringify(again) === JSON.stringify(addresses), 'a second import reads the same addresses').toBe(true);
  });

  it('are refused for a malformed tag, naming the variable', async () => {
    process.env[TAG_VARIABLE] = 'Not-A-Tag';
    vi.resetModules();
    await expect(import('./testCredentials')).rejects.toThrow(TAG_VARIABLE);
  });
});

describe('the shape of the addresses', () => {
  it('keeps the passwordless address at a local part of 64 characters under its prefix, with no hyphen or dot after the prefix', async () => {
    process.env[TAG_VARIABLE] = SOME_TAG;
    const { passwordless } = await addressesOfANewRun();
    const { PASSWORDLESS_SESSION_ADDRESS_PREFIX } = await import('./invitationConstants');
    expect(passwordless.endsWith(DOMAIN), 'the address is on the test domain').toBe(true);
    const localPart = passwordless.slice(0, -DOMAIN.length);
    expect(localPart.length === 64, 'the local part is 64 characters long').toBe(true);
    expect(localPart.startsWith(PASSWORDLESS_SESSION_ADDRESS_PREFIX), 'the local part begins with its prefix').toBe(
      true
    );
    expect(
      /^[0-9a-z]+$/.test(localPart.slice(PASSWORDLESS_SESSION_ADDRESS_PREFIX.length)),
      'after the prefix only lower-case letters and digits follow'
    ).toBe(true);
  });

  it('keeps every address lower-case and on the test domain', async () => {
    process.env[TAG_VARIABLE] = SOME_TAG;
    const addresses = Object.entries(await addressesOfANewRun());
    expect(addresses).toHaveLength(3);
    for (const [name, address] of addresses) {
      expect(address === address.toLowerCase(), `the ${name} address is lower-case`).toBe(true);
      expect(
        address.endsWith(DOMAIN) && address.indexOf('@') === address.length - DOMAIN.length,
        `the ${name} address is on the test domain`
      ).toBe(true);
    }
  });
});
