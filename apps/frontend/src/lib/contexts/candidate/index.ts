// Class is type-only to prevent accidental direct construction (WR-01);
// use initCandidateContext() / getCandidateContext() for runtime access.
export type { CandidateContextProvider } from './candidateContext.svelte';
export { getCandidateContext, initCandidateContext } from './candidateContext.svelte';
export * from './candidateContext.type';
export * from './candidateUserDataStore.type';
