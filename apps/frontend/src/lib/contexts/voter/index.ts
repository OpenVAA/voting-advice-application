export * from './answerState.type';
export * from './selectionTree.type';
export * from './voter';
// Class is type-only to prevent accidental direct construction (WR-01);
// use initVoterContext() / getVoterContext() for runtime access.
export type { VoterContextProvider } from './voterContext.svelte';
export { getVoterContext, initVoterContext } from './voterContext.svelte';
export * from './voterContext.type';
