import AdminSetPasswordGate from './AdminSetPasswordGate.svelte';
import type { Component } from 'svelte';
import type { AdminGateId } from './adminGates';

/**
 * The view the Admin App's protected layout renders for each gate, in place of the page.
 *
 * The record is keyed by the gate id type, so a gate id without a view does not typecheck. It is kept apart from `adminGates.ts` because the server load imports the gate list and a server module cannot hold components.
 */
export const ADMIN_GATE_VIEWS: Readonly<Record<AdminGateId, Component>> = Object.freeze({
  setPassword: AdminSetPasswordGate
});
