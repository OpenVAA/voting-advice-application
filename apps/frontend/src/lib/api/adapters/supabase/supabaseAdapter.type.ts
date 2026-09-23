import type { Database, TablesInsert, TablesUpdate } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdapterConfig } from '$lib/api/base/universalAdapter.type';
import type { tableBuilder } from './supabaseAdapter';

/**
 * The tables carrying a `project_id` foreign key to `public.projects`, and therefore the tables every read and write must name a project for.
 *
 * A table joins this union when it gains that foreign key. The declared list in `scripts/assert-project-scoped-queries.mjs` mirrors it, and the guard is what keeps a bare, unscoped access to any of them out of the adapter.
 */
export type ProjectScopedTable =
  | 'admin_jobs'
  | 'alliances'
  | 'app_settings'
  | 'candidates'
  | 'constituencies'
  | 'constituency_groups'
  | 'elections'
  | 'factions'
  | 'feedback'
  | 'nominations'
  | 'organizations'
  | 'question_categories'
  | 'questions';

/**
 * The PostgREST query builder for one project-scoped table, read off `tableBuilder`'s inferred return rather than restated here, so there is one opinion about its shape rather than two.
 */
type QueryBuilderFor<TTable extends ProjectScopedTable> = ReturnType<typeof tableBuilder<TTable>>;

/**
 * The project-scoped view of one table: the same four operations the raw query builder offers, each with the project already applied.
 *
 * Reads, updates and deletes carry `project_id = <this adapter's project>` as a filter. Inserts carry it as a column instead, because an insert has no filter to carry it in, and the caller therefore does not supply `project_id` itself. No member of this type can express an operation that reaches another project's rows.
 */
export type ScopedTableAccess<TTable extends ProjectScopedTable> = {
  /**
   * Select from the table, filtered to this adapter's project.
   *
   * The builder's own method type is reused verbatim rather than rebuilt from `Parameters` and `ReturnType`. `select` is GENERIC over the column-projection string, and it is that type parameter which decides the row type of the result; `Parameters` and `ReturnType` each instantiate the method at its constraint before reading it, so the projection is erased and every row comes back as `{}`. Naming the method type carries the generic through, so a caller's `select('*, election_constituency_groups(constituency_group_id)')` still yields the joined row shape.
   */
  select: QueryBuilderFor<TTable>['select'];
  /** Insert one row, with this adapter's project id supplied. */
  insert: (values: Omit<TablesInsert<TTable>, 'project_id'>) => ReturnType<QueryBuilderFor<TTable>['insert']>;
  /** Update rows of the table, filtered to this adapter's project. */
  update: (values: Omit<TablesUpdate<TTable>, 'project_id'>) => ReturnType<QueryBuilderFor<TTable>['update']>;
  /** Delete rows of the table, filtered to this adapter's project. */
  delete: () => ReturnType<QueryBuilderFor<TTable>['delete']>;
};

/**
 * What a Supabase adapter is constructed from.
 * Extends the base AdapterConfig with the client this adapter speaks to Supabase through, and with the locales it extracts JSONB in.
 */
export interface SupabaseAdapterConfig extends AdapterConfig {
  /** The Supabase client every read and write of this adapter goes through. Required, and it belongs to one request. */
  client: SupabaseClient<Database>;
  /** Current locale for JSONB localization extraction, and the fallback behind each read method's own `options.locale`. Forwarded from `AdapterSource` by `resolveAdapterConfig`, so a caller that knows the request's language sets it once at construction. */
  locale?: string;
  /** Default locale fallback (from projects.default_locale). */
  defaultLocale?: string;
  /** Overrides the configured project id; for tests. An empty string is treated as absent and falls back to `constants.PUBLIC_PROJECT_ID`. */
  projectId?: string;
}

/**
 * Interface provided by supabaseAdapterMixin to all Supabase adapter classes.
 */
export interface SupabaseAdapter {
  /** The typed Supabase client instance. */
  readonly supabase: SupabaseClient<Database>;
  /** The current locale for data extraction. */
  readonly locale: string;
  /** The default locale for fallback. */
  readonly defaultLocale: string;
  /** The project every query of this adapter is scoped to, resolved once at construction. */
  readonly projectId: string;
  /** The project-scoped entry point to a table. Every read and write against a table carrying a `project_id` foreign key to `public.projects` goes through here, so the project is applied by construction rather than by each call site remembering it. */
  scopedFrom: <TTable extends ProjectScopedTable>(table: TTable) => ScopedTableAccess<TTable>;
}
