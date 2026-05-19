/**
 * Phase 57 latent-factor answer emitter barrel.
 *
 * Single import path for the whole Phase 57 runtime surface + type surface.
 * Plans 01-06 contribute per-sub-step defaults + the shared type barrel; Plan
 * 07 contributes the composition shell `latentAnswerEmitter`. This file
 * re-exports every public symbol introduced in Phase 57 so external consumers
 * (tests, future overrides) can write `import { ... } from '@openvaa/dev-seed/src/emitters/latent'`.
 *
 * D-57-15: named exports only; no default exports; no re-export aliases.
 */

// Runtime exports
export { defaultCentroids } from './centroids';
export { defaultDimensions } from './dimensions';
export { boxMuller } from './gaussian';
export { latentAnswerEmitter } from './latentEmitter';
export { defaultLoadings } from './loadings';
export { defaultPositions } from './positions';
export { defaultProject } from './project';
export { defaultSpread } from './spread';

// Type exports
export type { Centroids, LatentHooks, LoadingMatrix, SpaceBundle } from './latentTypes';
