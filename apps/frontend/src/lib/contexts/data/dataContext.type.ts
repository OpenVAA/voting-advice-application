import type { DataRoot } from '@openvaa/data';

export type DataContext = {
  /**
   * Rune-native DataRoot handle exposing a reactive `.current` getter (tracks the
   * version counter). The legacy svelte/store DataRoot bridge was removed in
   * Wave 4 (Phase 98) once the last `$dataRoot` / `get(store)` consumers migrated
   * to `reactiveDataRoot.instance`.
   */
  dataRoot: { readonly current: DataRoot };
  /**
   * Rune-native DataRoot handle split (Pattern 2):
   * - `current` — reactive read (tracks the version counter); use in $derived/$effect/templates.
   * - `instance` — non-reactive read (same object, no version dependency); use from producer effects.
   */
  reactiveDataRoot: { readonly current: DataRoot; readonly instance: DataRoot };
};
