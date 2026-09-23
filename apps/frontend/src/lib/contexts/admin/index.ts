// Class is type-only to prevent accidental direct construction; use initAdminContext() / getAdminContext() for runtime access.
export type { AdminContextProvider } from './adminContext.svelte';
export { getAdminContext, initAdminContext } from './adminContext.svelte';
export * from './adminContext.type';
export * from './jobStates.type';
