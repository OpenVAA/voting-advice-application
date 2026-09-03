import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { SupabaseAdapter, SupabaseAdapterConfig } from './supabaseAdapter.type';

// reason: the TypeScript mixin pattern requires a constructor signature whose rest parameter is `any[]`; `unknown[]` makes `extends base` unassignable for every base class with typed constructor parameters. The lint rule does not fire here because `@typescript-eslint/no-explicit-any` is configured with `ignoreRestArgs: true` (shared-config/eslint.config.mjs:98-102) — so this `any` is exempted by configuration, not by conformance, and is documented rather than suppressed.
type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;

/**
 * A mixin for all Supabase Data API services.
 * Provides a typed SupabaseClient<Database>, locale, and defaultLocale.
 * This exposes the Supabase client directly -- the PostgREST query builder IS the abstraction.
 *
 * The client is an INPUT, never an inference: the mixin builds none of its own and reads no environment flag to decide which one it should have. Whoever constructs the adapter has already named the client, and a caller who names none does not compile.
 * @param base - The base class to extend with the mixin.
 * @returns A class extending both the base and SupabaseAdapter.
 */
export function supabaseAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base {
    readonly #supabase: SupabaseClient<Database>;
    #locale = '';
    #defaultLocale = 'en';

    // reason: TS2545 requires a mixin class to declare exactly one rest parameter of type `any[]`, so this signature cannot name its own parameter; the `any` is exempted by `ignoreRestArgs: true` for the reason given on `Constructor` above. It is what makes the explicit `constructor(config: SupabaseAdapterConfig)` on each of the four concrete adapter classes load-bearing rather than decorative — a subclass's own signature is what every caller is checked against.
    constructor(...args: Array<any>) {
      super(...args);
      const config = args[0] as SupabaseAdapterConfig;
      this.#supabase = config.client;
      if (config.locale) this.#locale = config.locale;
      if (config.defaultLocale) this.#defaultLocale = config.defaultLocale;
    }

    get supabase(): SupabaseClient<Database> {
      return this.#supabase;
    }

    get locale(): string {
      return this.#locale;
    }

    get defaultLocale(): string {
      return this.#defaultLocale;
    }
  }
  return WithMixin;
}
