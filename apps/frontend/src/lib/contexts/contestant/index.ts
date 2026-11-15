// Class is type-only to prevent accidental direct construction; use initContestantContext() / getContestantContext() for runtime access.
export type { ContestantContextProvider } from './contestantContext.svelte';
export { getContestantContext, initContestantContext } from './contestantContext.svelte';
export * from './contestantContext.type';
export * from './contestantUserDataState.type';
