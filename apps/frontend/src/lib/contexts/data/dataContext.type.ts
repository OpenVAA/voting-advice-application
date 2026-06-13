import type { DataRoot } from '@openvaa/data';

export type DataContext = {
  /**
   * Rune-native DataRoot, exposed as a BARE own-enumerable reactive accessor
   * (tracks the version counter). The legacy svelte/store DataRoot bridge was
   * removed in Wave 4 (Phase 98); the duplicate read-only mirror + its
   * non-reactive producer-read split were collapsed into this single handle in
   * Phase 113 (FLATTEN-01), and the `{ current }` wrapper was flattened to a bare
   * field in Phase 113 (FLATTEN-02) — read `ctx.dataRoot` directly. Producer
   * writes go through `setDataRoot`.
   */
  readonly dataRoot: DataRoot;
  /**
   * Mutate the DataRoot through the encapsulated non-reactive write path. Pass an
   * `updater` that calls `dr.update(() => dr.provide*(...))`. The write runs inside
   * `untrack`, so a producer `$effect` calling this takes no dependency on the version
   * counter and cannot self-loop — replacing the former non-reactive producer
   * read + hand-written `untrack` idiom (Spike 017/022). An arrow-function field, so
   * it survives being destructured (`const { setDataRoot } = ctx`).
   */
  setDataRoot: (updater: (dataRoot: DataRoot) => void) => void;
};
