import type { DataRoot } from '@openvaa/data';

export type DataContext = {
  /**
   * Rune-native DataRoot, exposed as a BARE own-enumerable reactive accessor (tracks the version counter). There is no svelte/store bridge, no read-only mirror beside it and no `{ current }` wrapper — read `ctx.dataRoot` directly.
   * Producer writes go through `setDataRoot`.
   */
  readonly dataRoot: DataRoot;
  /**
   * Mutate the DataRoot through the encapsulated non-reactive write path. Pass an `updater` that calls `dr.update(() => dr.provide*(...))`. The write runs inside `untrack`, so a producer `$effect` calling this takes no dependency on the version counter and cannot self-loop. This is the single write path, so no producer needs to hand-write its own `untrack`. An arrow-function field, so it survives being destructured (`const { setDataRoot } = ctx`).
   */
  setDataRoot: (updater: (dataRoot: DataRoot) => void) => void;
};
