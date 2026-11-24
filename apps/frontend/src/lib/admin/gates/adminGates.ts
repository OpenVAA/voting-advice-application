import { SET_PASSWORD_GATE } from '$lib/auth/gates';
import type { Gate, UserGateFacts } from '$lib/auth/gates';

/**
 * The id of a gate of the Admin App. Every member has a view in `ADMIN_GATE_VIEWS`.
 */
export type AdminGateId = 'setPassword';

/**
 * Every gate of the Admin App, in the order they are asked, decided by `firstNeededGate` from `$lib/auth/gates`.
 *
 * It holds the set-password gate alone. An account an identity provider made holds no admin grant, so nothing an identity provider's account lacks is asked here; and the terms of use cover the content an entity publishes, which an admin does not publish as one.
 *
 * Frozen, and free of Svelte imports, because the Admin App's protected server load imports it.
 */
export const ADMIN_GATES: ReadonlyArray<Gate<AdminGateId, UserGateFacts>> = Object.freeze([SET_PASSWORD_GATE]);
