import IdentityProviderGate from './IdentityProviderGate.svelte';
import SetPasswordGate from './SetPasswordGate.svelte';
import TermsOfUseGate from './TermsOfUseGate.svelte';
import type { Component } from 'svelte';
import type { ContestantGateId } from './gates';

/**
 * The view the protected layout renders for each gate, in place of the page.
 *
 * The record is keyed by the gate id type, so a gate id without a view does not typecheck. It is kept apart from `gates.ts` because the server load imports the gate list and a server module cannot hold components.
 */
export const GATE_VIEWS: Readonly<Record<ContestantGateId, Component>> = Object.freeze({
  setPassword: SetPasswordGate,
  identityProvider: IdentityProviderGate,
  termsOfUse: TermsOfUseGate
});
