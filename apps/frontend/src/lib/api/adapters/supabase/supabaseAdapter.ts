import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type {
  ProjectScopedTable,
  ScopedTableAccess,
  SupabaseAdapter,
  SupabaseAdapterConfig
} from './supabaseAdapter.type';

/** The canonical 8-4-4-4-12 lower-case hexadecimal uuid shape, applied after trimming and lower-casing so a padded or upper-case configuration value normalises rather than fails. */
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The project id created by `apps/supabase/supabase/seed.sql`, quoted in the throw below so an operator reading the error knows what to put in the file. It is a message ingredient only, and is never used as a value. */
const DOCUMENTED_DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/** The remedy every project-id throw ends with, so the two messages cannot drift apart. */
const PROJECT_ID_REMEDY =
  'Set PUBLIC_PROJECT_ID in the repo-root `.env`, copied from `.env.example`. ' +
  `For a normal local stack the value is ${DOCUMENTED_DEFAULT_PROJECT_ID}.`;

/**
 * Resolve the project this adapter is scoped to, from the constructor config first and the environment second.
 *
 * There is deliberately NO fallback value: an unset or malformed project id throws here rather than quietly resolving to the default project, because a silently-defaulted id produces queries that succeed while reading somebody else's rows.
 * @param configured - The `projectId` the caller passed, if any.
 * @returns The trimmed, lower-cased project id.
 */
function resolveProjectId(configured: string | undefined): string {
  const raw = configured && configured.trim() !== '' ? configured : constants.PUBLIC_PROJECT_ID;
  const normalised = (raw ?? '').trim().toLowerCase();
  if (normalised === '') throw new Error(`PUBLIC_PROJECT_ID is required but not set. ${PROJECT_ID_REMEDY}`);
  if (!CANONICAL_UUID.test(normalised))
    throw new Error(
      `PUBLIC_PROJECT_ID must be a canonical 8-4-4-4-12 hexadecimal uuid; got '${normalised}'. ${PROJECT_ID_REMEDY}`
    );
  return normalised;
}

/**
 * Obtain the PostgREST query builder for one project-scoped table.
 *
 * This exists so `ScopedTableAccess` can name the builder's type. The client's `from` is overloaded — one signature for tables, one for views — and a conditional `infer` over an overloaded method resolves to the LAST signature, whose table-name constraint is `never` because the schema declares no views. Reading the type off THIS function's inferred return instead goes through normal overload resolution and yields the per-table builder.
 * @param client - The client to reach the table through.
 * @param table - The project-scoped table.
 * @returns The query builder for that table.
 */
export function tableBuilder<TTable extends ProjectScopedTable>(client: SupabaseClient<Database>, table: TTable) {
  return client.from(table);
}

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
    readonly #projectId: string;
    #locale = '';
    #defaultLocale = 'en';

    // reason: TS2545 requires a mixin class to declare exactly one rest parameter of type `any[]`, so this signature cannot name its own parameter; the `any` is exempted by `ignoreRestArgs: true` for the reason given on `Constructor` above. It is what makes the explicit `constructor(config: SupabaseAdapterConfig)` on each of the four concrete adapter classes load-bearing rather than decorative — a subclass's own signature is what every caller is checked against.
    constructor(...args: Array<any>) {
      super(...args);
      const config = args[0] as SupabaseAdapterConfig;
      this.#supabase = config.client;
      this.#projectId = resolveProjectId(config.projectId);
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

    get projectId(): string {
      return this.#projectId;
    }

    /**
     * The project-scoped entry point to a table.
     *
     * Every read and write against a table carrying a `project_id` foreign key to `public.projects` goes through here. Reads, updates and deletes get the project filter appended; inserts get the project column supplied, because an insert carries no filter. The union of tables this accepts is the set of tables holding that foreign key.
     * @param table - The project-scoped table to reach.
     * @returns The four operations, each already carrying this adapter's project.
     */
    scopedFrom<TTable extends ProjectScopedTable>(table: TTable): ScopedTableAccess<TTable> {
      const builder = tableBuilder(this.#supabase, table);
      const projectId = this.#projectId;
      /**
       * Append this adapter's project filter to a builder, returning it unchanged in type.
       * @param builderToScope - The builder to filter.
       * @returns The same builder, now carrying the project filter.
       */
      function scoped<TBuilder>(builderToScope: TBuilder): TBuilder {
        // reason: the ONE cast, and it is deliberately the narrowest possible. Inside a method generic over `TTable` the builder's row type is the UNION of all thirteen scoped tables, so PostgREST's `eq(column, value)` resolves its value parameter to an unresolvable conditional and rejects a plain `string`. The cast names only the call being made and returns `TBuilder` unchanged, so the builder's own static type — the caller's real table, its real columns — survives untouched. Widening to `any` here would erase it.
        return (builderToScope as unknown as { eq: (column: string, value: string) => TBuilder }).eq(
          'project_id',
          projectId
        );
      }
      // reason: the second and last cast, for the same generic-union reason as `scoped` above. `insert` and `update` type their payload as a conditional over `TTable`, which does not resolve while `TTable` is still a type parameter, so a payload assembled here cannot be shown to match it. The cast names only the two write calls and preserves both their return types, so the caller still sees the real builder for the real table.
      const writes = builder as unknown as {
        insert: (values: Record<string, unknown>) => ReturnType<ScopedTableAccess<TTable>['insert']>;
        update: (values: Record<string, unknown>) => ReturnType<ScopedTableAccess<TTable>['update']>;
      };
      return {
        // reason: the third and last cast. `select` is generic over the column-projection string and that generic decides the result row type, so the wrapper is written against the erased parameter list and then named as the builder's own method type. Without the cast the wrapper would be assignable only at the erased instantiation, which is what makes every scoped read return `{}`.
        select: ((...args: Parameters<typeof builder.select>) =>
          scoped(builder.select(...args))) as ScopedTableAccess<TTable>['select'],
        insert: (values) => writes.insert({ ...values, project_id: projectId }),
        update: (values) => scoped(writes.update({ ...values })),
        delete: () => scoped(builder.delete())
      };
    }
  }
  return WithMixin;
}
