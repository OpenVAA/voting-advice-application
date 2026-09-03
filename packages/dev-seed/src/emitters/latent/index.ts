/**
 * Latent-factor answer emitter barrel.
 *
 * Single import path for the whole latent runtime surface + type surface: the six per-sub-step defaults, the shared type barrel and the composition shell `latentAnswerEmitter`. Every public symbol is re-exported here so external consumers (tests, overrides) can write `import { ... } from '@openvaa/dev-seed/src/emitters/latent'`.
 *
 * named exports only; no default exports; no re-export aliases.
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
