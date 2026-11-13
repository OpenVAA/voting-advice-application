/**
 * The removal of a fixed identity whose address carries the run tag of `runAddressTag.ts`.
 *
 * Such an identity takes a new address on every run: a stable beginning followed by the run tag. A run that ends before its teardown, interrupted, killed or voided by a host suspend, leaves its user under an address no later run uses, so a removal by this run's address never reaches that user. The setups and teardowns of these identities therefore remove by the stable beginning, which reaches the users of every earlier run as well as this run's.
 */

/** The removals of the admin client that {@link removeRunScopedIdentity} uses. */
export interface RunScopedIdentityRemover {
  /** Removes every auth user whose address begins with the prefix, with the user's grants and invitations. */
  removeUsersByEmailPrefix(prefix: string): Promise<number>;
  /** Removes the user holding the address, if any, with the user's grants, and every invitation addressed to it. */
  unregisterCandidate(email: string): Promise<void>;
}

/** A fixed identity with a run-scoped address: the address's stable beginning and this run's address. */
export interface RunScopedIdentity {
  /** The stable beginning of the identity's addresses, the same in every run. */
  addressPrefix: string;
  /** This run's address, which begins with {@link RunScopedIdentity.addressPrefix}. */
  address: string;
}

/**
 * Remove every user whose address begins with the identity's prefix, with their grants and invitations, and every invitation addressed to this run's address, whether or not a user holds it.
 *
 * Idempotent: with nothing to remove it removes nothing.
 *
 * @param client - The admin client, or anything with its two removals.
 * @param identity - The identity's prefix and this run's address.
 * @throws When this run's address does not begin with the prefix, before anything is removed; or when a removal fails.
 */
export async function removeRunScopedIdentity(
  client: RunScopedIdentityRemover,
  identity: RunScopedIdentity
): Promise<void> {
  if (!identity.address.startsWith(identity.addressPrefix)) {
    throw new Error(`removeRunScopedIdentity: the address does not begin with the prefix '${identity.addressPrefix}'`);
  }
  await client.removeUsersByEmailPrefix(identity.addressPrefix);
  await client.unregisterCandidate(identity.address);
}
