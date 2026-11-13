/**
 * The run tag: one value per Playwright run, from which the fixed identities that ask for a mailed link on every run build their addresses.
 *
 * The database allows twenty sign-in and recovery mails per address a day, across every project, and counts each mail that goes out. An identity that kept one address across runs would spend that budget within a day of full runs and then be refused its link. With the tag in its address, each run asks for the link of an address no earlier run used.
 *
 * Every process of a run must read the same tag: the setup that asks for a link, the specs that read the session and the teardown that removes the user each import the address on their own. The tag is therefore held in the environment variable {@link RUN_ADDRESS_TAG_VARIABLE}. The first module load of a run, in the Playwright runner process, which loads the configuration before it starts any worker, writes a fresh tag there, and the workers inherit it.
 */
import { randomBytes } from 'node:crypto';

/** The environment variable that holds the run tag. */
export const RUN_ADDRESS_TAG_VARIABLE = 'E2E_RUN_ADDRESS_TAG';

/** A run tag: sixteen lower-case hexadecimal digits, so it adds no hyphen, dot or capital to an address. */
const RUN_ADDRESS_TAG_SHAPE = /^[0-9a-f]{16}$/;

/** The domain of every address the suite invents. */
const TEST_ADDRESS_DOMAIN = 'test.openvaa.local';

/**
 * The run's tag, written to the environment when it holds none.
 *
 * @param env - The environment to read and write; the process's own by default.
 * @returns The tag the environment holds, or a fresh one now written there.
 * @throws When the variable holds a value that is not a tag.
 */
export function runAddressTag(env: NodeJS.ProcessEnv = process.env): string {
  const held = env[RUN_ADDRESS_TAG_VARIABLE];
  if (held === undefined || held === '') {
    const fresh = randomBytes(8).toString('hex');
    env[RUN_ADDRESS_TAG_VARIABLE] = fresh;
    return fresh;
  }
  if (!RUN_ADDRESS_TAG_SHAPE.test(held)) {
    throw new Error(
      `${RUN_ADDRESS_TAG_VARIABLE} holds a value that is not a run tag: it must be sixteen lower-case hexadecimal digits. Unset it to have the run make one.`
    );
  }
  return held;
}

/**
 * An address on the test domain whose local part is the given beginning followed by the run tag.
 *
 * @param localPartStart - The beginning of the local part, lower-case.
 * @param tag - The run tag.
 * @param localPartLength - When given, the local part is filled up with `x` to exactly this many characters.
 * @returns `<localPartStart><tag>[x…]@test.openvaa.local`.
 * @throws When the tag is malformed, or the beginning and the tag are already longer than `localPartLength`.
 */
export function runScopedAddress(localPartStart: string, tag: string, localPartLength?: number): string {
  if (!RUN_ADDRESS_TAG_SHAPE.test(tag)) {
    throw new Error('A run-scoped address needs a run tag of sixteen lower-case hexadecimal digits.');
  }
  const tagged = `${localPartStart}${tag}`;
  if (localPartLength === undefined) return `${tagged}@${TEST_ADDRESS_DOMAIN}`;
  if (tagged.length > localPartLength) {
    throw new Error(`A local part of ${tagged.length} characters does not fit in ${localPartLength}.`);
  }
  return `${tagged.padEnd(localPartLength, 'x')}@${TEST_ADDRESS_DOMAIN}`;
}

/** This run's tag. */
export const RUN_ADDRESS_TAG = runAddressTag();
