// Spike 024 — models the FOUR reactive-accessor shapes from the OpenVAA
// voter/candidate context, each with a "provide-after-mount" mutator that
// simulates cold-entry data population happening AFTER the consumer mounts.
//
// The shapes (per debug session dataroot-stale-direct-nav scope map):
//   1. dataRoot          — IDENTITY-STABLE object, reactivity via a #version
//                          $state counter; mutated IN PLACE (models DataRoot).
//   2. appSettings       — object whose REFERENCE is REPLACED on each provide
//                          (models mergeAppSettings returning a new object).
//   3. locale            — SCALAR replaced on each provide.
//   4. selectedElections — ARRAY whose reference is REPLACED on each provide.
//
// `$state` runes require a .svelte.ts module.

export interface SpikeCtx {
  // Case 1 — stable-ref + #version
  readonly dataRoot: { elections: string[] };
  provideElections(ids: string[]): void;
  // Case 2 — reference-replaced object
  readonly appSettings: { name: string };
  provideSettings(name: string): void;
  // Case 3 — scalar
  readonly locale: string;
  provideLocale(v: string): void;
  // Case 4 — value-replacing array
  readonly selectedElections: string[];
  provideSelected(ids: string[]): void;
}

export function createSpikeCtx(): SpikeCtx {
  // Case 1: a NON-rune object (like DataRoot) whose only reactive signal is a
  // separate version counter. The object reference NEVER changes.
  let version = $state(0);
  const root: { elections: string[] } = { elections: [] };

  // Case 2: a rune object whose reference is replaced wholesale.
  let settings = $state<{ name: string }>({ name: 'INIT' });

  // Case 3: a rune scalar.
  let locale = $state('INIT');

  // Case 4: a rune array replaced wholesale.
  let selected = $state<string[]>([]);

  return {
    // Stable getter: `void version` establishes the dependency; `root` is the
    // same reference every call (the exact dataRoot accessor shape).
    get dataRoot() {
      void version;
      return root;
    },
    provideElections(ids: string[]) {
      root.elections = ids; // mutate in place
      version++; // bump the only reactive signal
    },

    get appSettings() {
      return settings;
    },
    provideSettings(name: string) {
      settings = { name }; // NEW reference
    },

    get locale() {
      return locale;
    },
    provideLocale(v: string) {
      locale = v;
    },

    get selectedElections() {
      return selected;
    },
    provideSelected(ids: string[]) {
      selected = ids; // NEW array reference
    }
  };
}
