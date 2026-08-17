import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { SupabaseAdapter, SupabaseAdapterConfig } from './supabaseAdapter.type';

// reason: the TypeScript mixin pattern requires a constructor signature whose rest
// parameter is `any[]`; `unknown[]` makes `extends base` unassignable for every base
// class with typed constructor parameters. The lint rule does not fire here because
// `@typescript-eslint/no-explicit-any` is configured with `ignoreRestArgs: true`
// (shared-config/eslint.config.mjs:98-102) — so this `any` is exempted by
// configuration, not by conformance, and is documented rather than suppressed.
type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;

/**
 * A mixin for all Supabase Data API services.
 * Provides a typed SupabaseClient<Database>, locale, and defaultLocale.
 * This exposes the Supabase client directly -- the PostgREST query builder IS the abstraction.
 *
 * @param base - The base class to extend with the mixin.
 * @returns A class extending both the base and SupabaseAdapter.
 */
export function supabaseAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base {
    #supabase: SupabaseClient<Database> | undefined;
    #locale = '';
    #defaultLocale = 'en';

    init(config: SupabaseAdapterConfig): this {
      super.init(config);
      if (config.serverClient) {
        this.#supabase = config.serverClient;
      } else if (browser) {
        // In the browser, use createBrowserClient from @supabase/ssr to sync
        // with session cookies set by createServerClient in hooks.server.ts.
        // Plain createClient uses localStorage which can't see those cookies.
        this.#supabase = createBrowserClient<Database>(
          constants.PUBLIC_SUPABASE_URL,
          constants.PUBLIC_SUPABASE_ANON_KEY,
          { global: { fetch: config.fetch! } }
        );
      } else {
        // On the server (universal load functions without serverClient),
        // use plain createClient. The fetch from SvelteKit includes cookies.
        this.#supabase = createClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
          global: { fetch: config.fetch! }
        });
      }
      if (config.locale) this.#locale = config.locale;
      if (config.defaultLocale) this.#defaultLocale = config.defaultLocale;
      return this;
    }

    get supabase(): SupabaseClient<Database> {
      if (!this.#supabase) throw new Error('Supabase client not initialized. Call init() first.');
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
