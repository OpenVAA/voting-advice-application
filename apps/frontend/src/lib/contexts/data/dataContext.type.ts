import type { DataRoot } from '@openvaa/data';
import type { Readable } from 'svelte/store';

export type DataContext = {
  /**
   * Temporary `Readable<DataRoot>` bridge for un-migrated `$dataRoot` consumers.
   * Retained until Wave 3/4 (Phase 98); the `Readable` import stays for it.
   */
  dataRoot: Readable<DataRoot>;
  /**
   * Rune-native DataRoot handle split (Pattern 2):
   * - `current` — reactive read (tracks the version counter); use in $derived/$effect/templates.
   * - `instance` — non-reactive read (same object, no version dependency); use from producer effects.
   */
  reactiveDataRoot: { readonly current: DataRoot; readonly instance: DataRoot };
};
